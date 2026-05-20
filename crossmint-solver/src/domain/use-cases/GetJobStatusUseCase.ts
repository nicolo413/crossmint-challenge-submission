import { JobRepository } from '../ports/JobRepository';
import { Job } from '../models/Job';
import { JobNotFoundError } from '../errors/JobNotFoundError';

export class GetJobStatusUseCase {
  constructor(private readonly jobs: JobRepository) {}

  execute(jobId: string): Job {
    const job = this.jobs.findById(jobId);
    if (!job) throw new JobNotFoundError(jobId);
    return job;
  }
}
