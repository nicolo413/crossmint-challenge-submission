import pino, { Logger } from 'pino';
import { LoggerPort } from '../../domain/ports/LoggerPort';

export class PinoLogger implements LoggerPort {
  constructor(private readonly logger: Logger) {}

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(context ?? {}, message);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(context ?? {}, message);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.logger.error(context ?? {}, message);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(context ?? {}, message);
  }

  child(bindings: Record<string, unknown>): LoggerPort {
    return new PinoLogger(this.logger.child(bindings));
  }
}

export function createLogger(level = 'info'): LoggerPort {
  const isDev = process.env.NODE_ENV !== 'production';

  const pinoLogger = isDev
    ? pino({ level, transport: { target: 'pino-pretty', options: { colorize: true } } })
    : pino({ level });

  return new PinoLogger(pinoLogger);
}
