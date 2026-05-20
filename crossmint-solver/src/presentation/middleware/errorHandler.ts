import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../domain/errors/DomainError';
import { LoggerPort } from '../../domain/ports/LoggerPort';

export function errorHandler(logger: LoggerPort) {
  return (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    if (error instanceof DomainError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    logger.error('Unhandled error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: 'Internal server error' });
  };
}
