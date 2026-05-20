import { DomainError } from './DomainError';
import { ApiErrorClassification } from './ApiErrorClassification';

export class MegaverseApiError extends DomainError {
  readonly statusCode = 502;

  constructor(
    message: string,
    readonly originalStatusCode?: number,
    readonly classification: ApiErrorClassification = 'permanent',
  ) {
    super(message);
  }
}
