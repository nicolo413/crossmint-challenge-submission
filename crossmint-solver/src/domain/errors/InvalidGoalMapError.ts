import { DomainError } from './DomainError';

export class InvalidGoalMapError extends DomainError {
  readonly statusCode = 422;

  constructor(cell: string, row: number, column: number) {
    super(`Unknown goal map cell "${cell}" at [${row}, ${column}]`);
  }
}
