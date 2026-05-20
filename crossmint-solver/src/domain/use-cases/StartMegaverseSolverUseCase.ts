import { v4 as uuidv4 } from 'uuid';
import { SolveMegaverseUseCase } from './SolveMegaverseUseCase';
import { JobRepository } from '../ports/JobRepository';
import { LoggerPort } from '../ports/LoggerPort';
import { Job, JobStatus } from '../models/Job';
import { JobType } from '../value-objects/JobType';
import { MegaverseApiError } from '../errors/MegaverseApiError';
import { MapDivergedError } from '../errors/MapDivergedError';

const TERMINAL_STATUSES = new Set<JobStatus>([JobStatus.Completed, JobStatus.Failed]);

export class StartMegaverseSolverUseCase {
  constructor(
    private readonly jobs: JobRepository,
    private readonly solver: SolveMegaverseUseCase,
    private readonly logger: LoggerPort,
  ) {}

  execute(candidateId: string): Job {
    const active = this.jobs.findActiveByCandidate(candidateId, JobType.Solve);
    if (active) {
      this.logger.info('Returning existing active job', {
        jobId: active.id,
        candidateId,
        status: active.status,
      });
      return active;
    }

    const job = new Job(uuidv4(), candidateId, JobType.Solve);
    this.jobs.save(job);
    const log = this.logger.child({ jobId: job.id, candidateId });
    log.info('Job created');

    this.solver
      .execute(candidateId, (progress) => {
        this.jobs.update(job.id, { status: JobStatus.Running, progress });
      })
      .then(() => {
        const current = this.jobs.findById(job.id);
        if (current && TERMINAL_STATUSES.has(current.status)) return;
        this.jobs.update(job.id, { status: JobStatus.Completed });
        log.info('Job completed');
      })
      .catch((error: unknown) => {
        const current = this.jobs.findById(job.id);
        if (current && TERMINAL_STATUSES.has(current.status)) return;

        const message = error instanceof Error ? error.message : String(error);
        const retryable =
          (error instanceof MegaverseApiError && error.classification === 'transient') ||
          error instanceof MapDivergedError;

        this.jobs.update(job.id, { status: JobStatus.Failed, error: message, retryable });

        if (error instanceof MapDivergedError) {
          log.warn('Job failed — map diverged after solve, resubmission will reconcile', { error: message });
        } else if (retryable) {
          log.warn('Job failed — transient error, resubmission will retry', { error: message });
        } else {
          log.error('Job failed permanently', { error: message });
        }
      });

    return job;
  }
}
