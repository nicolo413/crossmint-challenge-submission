import { DomainError } from './DomainError';

export class JobNotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(jobId: string) {
    super(`Job "${jobId}" not found`);
  }
}
