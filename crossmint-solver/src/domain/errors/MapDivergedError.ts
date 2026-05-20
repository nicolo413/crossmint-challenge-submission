import { DomainError } from './DomainError';

export class MapDivergedError extends DomainError {
  readonly statusCode = 409;

  constructor(readonly divergedCells: number) {
    super(
      `Map diverged after solve — external modification detected on ${divergedCells} cell(s), resubmission recommended`,
    );
  }
}
