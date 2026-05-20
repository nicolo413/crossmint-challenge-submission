import { Job, JobProgress, JobStatus } from '../models/Job';
import { JobType } from '../value-objects/JobType';

export interface JobUpdate {
  status?: JobStatus;
  progress?: JobProgress;
  error?: string;
  retryable?: boolean;
}

export interface JobRepository {
  save(job: Job): void;
  findById(id: string): Job | undefined;
  findActiveByCandidate(candidateId: string, type: JobType): Job | undefined;
  update(id: string, updates: JobUpdate): void;
}
