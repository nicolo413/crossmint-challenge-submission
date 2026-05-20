import nock from 'nock';
import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/presentation/app';
import { CrossmintApiAdapter } from '../../src/infrastructure/http/CrossmintApiAdapter';
import { InMemoryJobRepository } from '../../src/infrastructure/repositories/InMemoryJobRepository';
import { SolveMegaverseUseCase } from '../../src/domain/use-cases/SolveMegaverseUseCase';
import { StartMegaverseSolverUseCase } from '../../src/domain/use-cases/StartMegaverseSolverUseCase';
import { GetJobStatusUseCase } from '../../src/domain/use-cases/GetJobStatusUseCase';
import { MegaverseController } from '../../src/presentation/controllers/MegaverseController';
import { JobController } from '../../src/presentation/controllers/JobController';
import { createRetryHttpClient } from '../../src/infrastructure/http/RetryHttpClient';
import { JobStatus } from '../../src/domain/models/Job';
import { nullLogger } from '../helpers/nullLogger';

const BASE_URL = 'https://challenge.crossmint.io/api';
const CANDIDATE_ID = 'integration-test-candidate';

const PATH_CURRENT_MAP = `/api/map/${CANDIDATE_ID}`;
const PATH_GOAL_MAP = `/api/map/${CANDIDATE_ID}/goal`;
const PATH_POLYANETS = '/api/polyanets';
const PATH_COMETHS = '/api/comeths';

function buildTestApp() {
  const httpClient = createRetryHttpClient({ baseUrl: BASE_URL, maxAttempts: 0, baseDelayMs: 0 });
  const apiAdapter = new CrossmintApiAdapter(httpClient);
  const jobRepo = new InMemoryJobRepository();

  const solver = new SolveMegaverseUseCase(apiAdapter, nullLogger);
  const startSolver = new StartMegaverseSolverUseCase(jobRepo, solver, nullLogger);
  const getStatus = new GetJobStatusUseCase(jobRepo);

  return {
    app: createApp(new MegaverseController(startSolver), new JobController(getStatus), nullLogger),
    jobRepo,
  };
}

const TERMINAL_STATUSES = new Set([JobStatus.Completed, JobStatus.Failed]);

async function pollJobUntilDone(
  app: Application,
  jobId: string,
  maxMs = 5000,
): Promise<{ status: string; error: string | null; retryable: boolean }> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const res = await request(app).get(`/api/megaverse/jobs/${jobId}`);
    if (TERMINAL_STATUSES.has(res.body.status as JobStatus)) {
      return res.body as { status: string; error: string | null; retryable: boolean };
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('Job did not reach a terminal status within timeout');
}

describe('Megaverse API (integration)', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  beforeEach(() => {
    ({ app } = buildTestApp());
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('POST /api/megaverse/solve', () => {
    it('returns 400 when candidateId is missing', async () => {
      const res = await request(app).post('/api/megaverse/solve').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/candidateId/);
    });

    it('returns 202 with jobId and pending status', async () => {
      nock('https://challenge.crossmint.io')
        .get(PATH_CURRENT_MAP)
        .reply(200, { map: { content: [[null]] } });
      nock('https://challenge.crossmint.io')
        .get(PATH_GOAL_MAP)
        .reply(200, { goal: [['SPACE']] });

      const res = await request(app).post('/api/megaverse/solve').send({ candidateId: CANDIDATE_ID });

      expect(res.status).toBe(202);
      expect(res.body).toHaveProperty('jobId');
      expect(res.body.status).toBe(JobStatus.Pending);

      await pollJobUntilDone(app, res.body.jobId as string);
    });

    it('solves a simple map by creating a single polyanet', async () => {
      nock('https://challenge.crossmint.io')
        .get(PATH_CURRENT_MAP)
        .reply(200, { map: { content: [[null, null]] } });
      nock('https://challenge.crossmint.io')
        .get(PATH_GOAL_MAP)
        .reply(200, { goal: [['POLYANET', 'SPACE']] });
      const createScope = nock('https://challenge.crossmint.io')
        .post(PATH_POLYANETS, { candidateId: CANDIDATE_ID, row: 0, column: 0 })
        .reply(200, {});
      // Post-solve verification fetch: polyanet is in place
      nock('https://challenge.crossmint.io')
        .get(PATH_CURRENT_MAP)
        .reply(200, { map: { content: [[{ type: 0 }, null]] } });

      const {
        body: { jobId },
      } = await request(app).post('/api/megaverse/solve').send({ candidateId: CANDIDATE_ID });
      const finalJob = await pollJobUntilDone(app, jobId as string);

      expect(finalJob.status).toBe(JobStatus.Completed);
      expect(createScope.isDone()).toBe(true);
    });

    it('returns the same jobId when submitted twice while the solve job is still active', async () => {
      nock('https://challenge.crossmint.io')
        .get(PATH_CURRENT_MAP)
        .delayBody(500)
        .reply(200, { map: { content: [[null]] } });
      nock('https://challenge.crossmint.io')
        .get(PATH_GOAL_MAP)
        .reply(200, { goal: [['SPACE']] });

      const first = await request(app).post('/api/megaverse/solve').send({ candidateId: CANDIDATE_ID });
      const second = await request(app).post('/api/megaverse/solve').send({ candidateId: CANDIDATE_ID });

      expect(second.body.jobId).toBe(first.body.jobId);

      await pollJobUntilDone(app, first.body.jobId as string);
    });

    it('makes zero API calls when the map already matches the goal (idempotency)', async () => {
      nock('https://challenge.crossmint.io')
        .get(PATH_CURRENT_MAP)
        .reply(200, { map: { content: [[{ type: 0 }]] } });
      nock('https://challenge.crossmint.io')
        .get(PATH_GOAL_MAP)
        .reply(200, { goal: [['POLYANET']] });

      const createScope = nock('https://challenge.crossmint.io').post(PATH_POLYANETS).reply(200, {});
      const deleteScope = nock('https://challenge.crossmint.io').delete(PATH_POLYANETS).reply(200, {});

      const {
        body: { jobId },
      } = await request(app).post('/api/megaverse/solve').send({ candidateId: CANDIDATE_ID });
      const finalJob = await pollJobUntilDone(app, jobId as string);

      expect(finalJob.status).toBe(JobStatus.Completed);
      expect(createScope.isDone()).toBe(false);
      expect(deleteScope.isDone()).toBe(false);
    });

    it('fires delete before create when a cell changes type (ordering guarantee)', async () => {
      const callOrder: string[] = [];

      nock('https://challenge.crossmint.io')
        .get(PATH_CURRENT_MAP)
        .reply(200, { map: { content: [[{ type: 0 }]] } });
      nock('https://challenge.crossmint.io')
        .get(PATH_GOAL_MAP)
        .reply(200, { goal: [['UP_COMETH']] });
      nock('https://challenge.crossmint.io')
        .delete(PATH_POLYANETS)
        .reply(200, () => {
          callOrder.push('delete');
          return {};
        });
      nock('https://challenge.crossmint.io')
        .post(PATH_COMETHS)
        .reply(200, () => {
          callOrder.push('create');
          return {};
        });
      // Post-solve verification fetch: cometh is in place
      nock('https://challenge.crossmint.io')
        .get(PATH_CURRENT_MAP)
        .reply(200, { map: { content: [[{ type: 2, direction: 'up' }]] } });

      const {
        body: { jobId },
      } = await request(app).post('/api/megaverse/solve').send({ candidateId: CANDIDATE_ID });
      const finalJob = await pollJobUntilDone(app, jobId as string);

      expect(finalJob.status).toBe(JobStatus.Completed);
      expect(callOrder).toEqual(['delete', 'create']);
    });

    it('resubmitting after a failed job starts a new job (different jobId)', async () => {
      nock('https://challenge.crossmint.io').get(PATH_CURRENT_MAP).reply(429, { error: 'rate limited' });
      nock('https://challenge.crossmint.io')
        .get(PATH_GOAL_MAP)
        .reply(200, { goal: [['SPACE']] });
      const { body: first } = await request(app)
        .post('/api/megaverse/solve')
        .send({ candidateId: CANDIDATE_ID });
      await pollJobUntilDone(app, first.jobId as string);

      nock('https://challenge.crossmint.io')
        .get(PATH_CURRENT_MAP)
        .reply(200, { map: { content: [[null]] } });
      nock('https://challenge.crossmint.io')
        .get(PATH_GOAL_MAP)
        .reply(200, { goal: [['SPACE']] });
      const { body: second } = await request(app)
        .post('/api/megaverse/solve')
        .send({ candidateId: CANDIDATE_ID });

      expect(second.jobId).not.toBe(first.jobId);

      await pollJobUntilDone(app, second.jobId as string);
    });

    describe('— error responses', () => {
      it('marks a job as failed with retryable=true when the API returns 429', async () => {
        nock('https://challenge.crossmint.io').get(PATH_CURRENT_MAP).reply(429, { error: 'rate limited' });
        nock('https://challenge.crossmint.io')
          .get(PATH_GOAL_MAP)
          .reply(200, { goal: [['SPACE']] });

        const {
          body: { jobId },
        } = await request(app).post('/api/megaverse/solve').send({ candidateId: CANDIDATE_ID });
        const finalJob = await pollJobUntilDone(app, jobId as string);

        expect(finalJob.status).toBe(JobStatus.Failed);
        expect(finalJob.retryable).toBe(true);
      });

      it('marks a job as failed with retryable=false on a permanent error', async () => {
        nock('https://challenge.crossmint.io').get(PATH_CURRENT_MAP).reply(400, { error: 'bad request' });
        nock('https://challenge.crossmint.io')
          .get(PATH_GOAL_MAP)
          .reply(200, { goal: [['SPACE']] });

        const {
          body: { jobId },
        } = await request(app).post('/api/megaverse/solve').send({ candidateId: CANDIDATE_ID });
        const finalJob = await pollJobUntilDone(app, jobId as string);

        expect(finalJob.status).toBe(JobStatus.Failed);
        expect(finalJob.retryable).toBe(false);
      });

      it('marks job as failed with retryable=true when post-solve verification detects external modification', async () => {
        nock('https://challenge.crossmint.io')
          .get(PATH_CURRENT_MAP)
          .reply(200, { map: { content: [[null]] } });
        nock('https://challenge.crossmint.io')
          .get(PATH_GOAL_MAP)
          .reply(200, { goal: [['POLYANET']] });
        nock('https://challenge.crossmint.io').post(PATH_POLYANETS).reply(200, {});
        // Verification fetch: external agent removed the polyanet we just created
        nock('https://challenge.crossmint.io')
          .get(PATH_CURRENT_MAP)
          .reply(200, { map: { content: [[null]] } });

        const {
          body: { jobId },
        } = await request(app).post('/api/megaverse/solve').send({ candidateId: CANDIDATE_ID });
        const finalJob = await pollJobUntilDone(app, jobId as string);

        expect(finalJob.status).toBe(JobStatus.Failed);
        expect(finalJob.retryable).toBe(true);
        expect(finalJob.error).toMatch(/external modification detected/);
      });
    });
  });

  describe('GET /api/megaverse/jobs/:jobId', () => {
    it('returns 404 for unknown job id', async () => {
      const res = await request(app).get('/api/megaverse/jobs/nonexistent-id');
      expect(res.status).toBe(404);
    });
  });
});
