import { Request, Response, NextFunction } from 'express';
import { LoggerPort } from '../../domain/ports/LoggerPort';

export function requestLogger(logger: LoggerPort) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

      logger[level](`${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs,
      });
    });

    next();
  };
}
