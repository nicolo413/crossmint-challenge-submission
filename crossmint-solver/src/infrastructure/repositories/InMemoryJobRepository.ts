import { JobRepository, JobUpdate } from '../../domain/ports/JobRepository';
import { Job, JobStatus } from '../../domain/models/Job';
import { JobType } from '../../domain/value-objects/JobType';

const ACTIVE_STATUSES: ReadonlySet<JobStatus> = new Set([JobStatus.Pending, JobStatus.Running]);

export class InMemoryJobRepository implements JobRepository {
  private readonly store = new Map<string, Job>();

  save(job: Job): void {
    this.store.set(job.id, job);
  }

  findById(id: string): Job | undefined {
    return this.store.get(id);
  }

  findActiveByCandidate(candidateId: string, type: JobType): Job | undefined {
    for (const job of this.store.values()) {
      if (job.candidateId === candidateId && job.type === type && ACTIVE_STATUSES.has(job.status)) {
        return job;
      }
    }
    return undefined;
  }

  update(id: string, updates: JobUpdate): void {
    const job = this.store.get(id);
    if (!job) return;
    job.applyUpdate(updates);
  }
}
