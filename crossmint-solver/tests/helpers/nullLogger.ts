import { LoggerPort } from '../../src/domain/ports/LoggerPort';

export const nullLogger: LoggerPort = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: () => nullLogger,
};
