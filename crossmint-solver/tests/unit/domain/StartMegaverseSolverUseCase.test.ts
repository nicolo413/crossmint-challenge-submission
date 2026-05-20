import { StartMegaverseSolverUseCase } from '../../../src/domain/use-cases/StartMegaverseSolverUseCase';
import { SolveMegaverseUseCase } from '../../../src/domain/use-cases/SolveMegaverseUseCase';
import { InMemoryJobRepository } from '../../../src/infrastructure/repositories/InMemoryJobRepository';
import { JobStatus } from '../../../src/domain/models/Job';
import { JobType } from '../../../src/domain/value-objects/JobType';
import { MegaverseApiError } from '../../../src/domain/errors/MegaverseApiError';
import { MapDivergedError } from '../../../src/domain/errors/MapDivergedError';
import { nullLogger } from '../../helpers/nullLogger';

const CANDIDATE = 'test-candidate';

type SolverFn = (
  candidateId: string,
  onProgress?: (p: { completed: number; total: number }) => void,
) => Promise<void>;

function buildUseCase(solverImpl: SolverFn = () => Promise.resolve()) {
  const jobs = new InMemoryJobRepository();
  const solver = { execute: jest.fn().mockImplementation(solverImpl) } as unknown as SolveMegaverseUseCase;
  const useCase = new StartMegaverseSolverUseCase(jobs, solver, nullLogger);
  return { useCase, jobs, solver };
}

function buildWithSequentialSolver(...impls: SolverFn[]) {
  const jobs = new InMemoryJobRepository();
  const mock = jest.fn();
  impls.forEach((impl) => mock.mockImplementationOnce(impl));
  mock.mockImplementation(() => new Promise(() => {})); // fallback: never resolves
  const solver = { execute: mock } as unknown as SolveMegaverseUseCase;
  const useCase = new StartMegaverseSolverUseCase(jobs, solver, nullLogger);
  return { useCase, jobs };
}

async function drainMicrotasks() {
  await new Promise<void>((resolve) => setImmediate(resolve));
}

describe('StartMegaverseSolverUseCase — job creation', () => {
  it('returns a new job with Pending status', () => {
    const { useCase } = buildUseCase();
    const job = useCase.execute(CANDIDATE);
    expect(job.status).toBe(JobStatus.Pending);
    expect(job.type).toBe(JobType.Solve);
    expect(job.candidateId).toBe(CANDIDATE);
  });

  it('creates a new job after a Failed job — failed jobs are never retried', async () => {
    const { useCase, jobs } = buildWithSequentialSolver(
      () => Promise.reject(new MegaverseApiError('failed', 400, 'permanent')),
      () => new Promise(() => {}),
    );

    const first = useCase.execute(CANDIDATE);
    await drainMicrotasks();
    expect(jobs.findById(first.id)!.status).toBe(JobStatus.Failed);

    const second = useCase.execute(CANDIDATE);
    expect(second.id).not.toBe(first.id);
    expect(second.status).toBe(JobStatus.Pending);
  });

  it('creates a new job after a Completed job — completed jobs are not re-used', async () => {
    const { useCase, jobs } = buildWithSequentialSolver(
      () => Promise.resolve(),
      () => new Promise(() => {}),
    );

    const first = useCase.execute(CANDIDATE);
    await drainMicrotasks();
    expect(jobs.findById(first.id)!.status).toBe(JobStatus.Completed);

    const second = useCase.execute(CANDIDATE);
    expect(second.id).not.toBe(first.id);
    expect(second.status).toBe(JobStatus.Pending);
  });

  it('two sequential failures produce two distinct job IDs', async () => {
    const { useCase, jobs } = buildWithSequentialSolver(
      () => Promise.reject(new MegaverseApiError('first failure', 400, 'permanent')),
      () => Promise.reject(new MegaverseApiError('second failure', 500, 'transient')),
    );

    const first = useCase.execute(CANDIDATE);
    await drainMicrotasks();

    const second = useCase.execute(CANDIDATE);
    await drainMicrotasks();

    expect(second.id).not.toBe(first.id);
    expect(jobs.findById(first.id)!.status).toBe(JobStatus.Failed);
    expect(jobs.findById(second.id)!.status).toBe(JobStatus.Failed);
  });
});

describe('StartMegaverseSolverUseCase — idempotency', () => {
  it('returns the existing job when a Pending job exists', () => {
    const { useCase } = buildUseCase(() => new Promise(() => {}));
    const first = useCase.execute(CANDIDATE);
    const second = useCase.execute(CANDIDATE);
    expect(second.id).toBe(first.id);
  });

  it('returns the existing job when a Running job exists', () => {
    let capturedOnProgress: ((p: { completed: number; total: number }) => void) | undefined;
    const { useCase, jobs } = buildUseCase((_id, onProgress) => {
      capturedOnProgress = onProgress;
      return new Promise(() => {});
    });

    const first = useCase.execute(CANDIDATE);
    capturedOnProgress?.({ completed: 1, total: 10 }); // transitions job to Running
    expect(jobs.findById(first.id)!.status).toBe(JobStatus.Running);

    const second = useCase.execute(CANDIDATE);
    expect(second.id).toBe(first.id);
  });
});

describe('StartMegaverseSolverUseCase — terminal state immutability', () => {
  it('old Failed job status remains Failed after a new job is created', async () => {
    const { useCase, jobs } = buildWithSequentialSolver(
      () => Promise.reject(new MegaverseApiError('failed', 400, 'permanent')),
      () => Promise.resolve(),
    );

    const first = useCase.execute(CANDIDATE);
    await drainMicrotasks();
    expect(jobs.findById(first.id)!.status).toBe(JobStatus.Failed);

    const second = useCase.execute(CANDIDATE);
    await drainMicrotasks();
    expect(jobs.findById(second.id)!.status).toBe(JobStatus.Completed);

    expect(jobs.findById(first.id)!.status).toBe(JobStatus.Failed);
  });

  it('does not overwrite a terminal Failed status when the solver promise later resolves', async () => {
    let resolveOp!: () => void;
    const { useCase, jobs } = buildUseCase(
      () =>
        new Promise<void>((res) => {
          resolveOp = res;
        }),
    );
    const job = useCase.execute(CANDIDATE);

    jobs.update(job.id, { status: JobStatus.Failed, error: 'externally failed' });
    resolveOp();
    await drainMicrotasks();

    expect(jobs.findById(job.id)!.status).toBe(JobStatus.Failed);
    expect(jobs.findById(job.id)!.error).toBe('externally failed');
  });

  it('does not overwrite a terminal Completed status when the solver promise later rejects', async () => {
    let rejectOp!: (e: Error) => void;
    const { useCase, jobs } = buildUseCase(
      () =>
        new Promise<void>((_, rej) => {
          rejectOp = rej;
        }),
    );
    const job = useCase.execute(CANDIDATE);

    jobs.update(job.id, { status: JobStatus.Completed });
    rejectOp(new Error('late error'));
    await drainMicrotasks();

    expect(jobs.findById(job.id)!.status).toBe(JobStatus.Completed);
  });
});

describe('StartMegaverseSolverUseCase — status transitions', () => {
  it('transitions job to Completed when solver resolves', async () => {
    const { useCase, jobs } = buildUseCase(() => Promise.resolve());
    const job = useCase.execute(CANDIDATE);
    await drainMicrotasks();
    expect(jobs.findById(job.id)!.status).toBe(JobStatus.Completed);
  });

  it('transitions job to Failed with retryable=false on permanent error', async () => {
    const { useCase, jobs } = buildUseCase(() =>
      Promise.reject(new MegaverseApiError('bad request', 400, 'permanent')),
    );
    const job = useCase.execute(CANDIDATE);
    await drainMicrotasks();
    const stored = jobs.findById(job.id)!;
    expect(stored.status).toBe(JobStatus.Failed);
    expect(stored.retryable).toBe(false);
    expect(stored.error).toBe('bad request');
  });

  it('transitions job to Failed with retryable=true on transient error', async () => {
    const { useCase, jobs } = buildUseCase(() =>
      Promise.reject(new MegaverseApiError('rate limited', 429, 'transient')),
    );
    const job = useCase.execute(CANDIDATE);
    await drainMicrotasks();
    const stored = jobs.findById(job.id)!;
    expect(stored.status).toBe(JobStatus.Failed);
    expect(stored.retryable).toBe(true);
  });

  it('transitions job to Failed with retryable=true when map diverges after solve', async () => {
    const { useCase, jobs } = buildUseCase(() => Promise.reject(new MapDivergedError(2)));
    const job = useCase.execute(CANDIDATE);
    await drainMicrotasks();
    const stored = jobs.findById(job.id)!;
    expect(stored.status).toBe(JobStatus.Failed);
    expect(stored.retryable).toBe(true);
    expect(stored.error).toMatch(/external modification detected/);
  });
});
