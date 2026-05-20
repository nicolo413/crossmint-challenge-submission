import { InMemoryJobRepository } from '../../../src/infrastructure/repositories/InMemoryJobRepository';
import { Job, JobStatus } from '../../../src/domain/models/Job';
import { JobType } from '../../../src/domain/value-objects/JobType';

const SOLVE = JobType.Solve;

describe('InMemoryJobRepository', () => {
  let repo: InMemoryJobRepository;

  beforeEach(() => {
    repo = new InMemoryJobRepository();
  });

  it('saves and retrieves a job by id', () => {
    const job = new Job('job-1', 'candidate-1', SOLVE);
    repo.save(job);
    expect(repo.findById('job-1')).toBe(job);
  });

  it('returns undefined for unknown job id', () => {
    expect(repo.findById('nonexistent')).toBeUndefined();
  });

  it('updates job status and sets updatedAt', () => {
    const job = new Job('job-1', 'candidate-1', SOLVE);
    const before = new Date();
    repo.save(job);

    repo.update('job-1', { status: JobStatus.Running });

    const updated = repo.findById('job-1')!;
    expect(updated.status).toBe(JobStatus.Running);
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('updates job progress', () => {
    const job = new Job('job-1', 'candidate-1', SOLVE);
    repo.save(job);
    repo.update('job-1', { progress: { completed: 5, total: 10 } });
    expect(repo.findById('job-1')!.progress).toEqual({ completed: 5, total: 10 });
  });

  it('sets error message on update', () => {
    const job = new Job('job-1', 'candidate-1', SOLVE);
    repo.save(job);
    repo.update('job-1', { status: JobStatus.Failed, error: 'something went wrong' });
    expect(repo.findById('job-1')!.error).toBe('something went wrong');
  });

  it('sets retryable flag on update', () => {
    const job = new Job('job-1', 'candidate-1', SOLVE);
    repo.save(job);
    repo.update('job-1', { status: JobStatus.Failed, retryable: true });
    expect(repo.findById('job-1')!.retryable).toBe(true);
  });

  it('silently ignores updates for unknown job ids', () => {
    expect(() => repo.update('nonexistent', { status: JobStatus.Completed })).not.toThrow();
  });
});

describe('InMemoryJobRepository.findActiveByCandidate', () => {
  let repo: InMemoryJobRepository;

  beforeEach(() => {
    repo = new InMemoryJobRepository();
  });

  it('returns a pending job matching candidateId and type', () => {
    const job = new Job('job-1', 'candidate-1', SOLVE, JobStatus.Pending);
    repo.save(job);
    expect(repo.findActiveByCandidate('candidate-1', SOLVE)).toBe(job);
  });

  it('returns a running job matching candidateId and type', () => {
    const job = new Job('job-1', 'candidate-1', SOLVE, JobStatus.Running);
    repo.save(job);
    expect(repo.findActiveByCandidate('candidate-1', SOLVE)).toBe(job);
  });

  it('returns undefined when the only job is completed', () => {
    const job = new Job('job-1', 'candidate-1', SOLVE, JobStatus.Completed);
    repo.save(job);
    expect(repo.findActiveByCandidate('candidate-1', SOLVE)).toBeUndefined();
  });

  it('returns undefined when the only job is failed', () => {
    const job = new Job('job-1', 'candidate-1', SOLVE, JobStatus.Failed);
    repo.save(job);
    expect(repo.findActiveByCandidate('candidate-1', SOLVE)).toBeUndefined();
  });

  it('returns undefined for an unknown candidate', () => {
    expect(repo.findActiveByCandidate('nonexistent', SOLVE)).toBeUndefined();
  });

  it('does not return active jobs belonging to a different candidate', () => {
    const job = new Job('job-1', 'candidate-A', SOLVE, JobStatus.Running);
    repo.save(job);
    expect(repo.findActiveByCandidate('candidate-B', SOLVE)).toBeUndefined();
  });
});
