import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { LoggerPort } from '../../domain/ports/LoggerPort';
import { classifyHttpStatus } from '../../domain/errors/ApiErrorClassification';

export interface RetryConfig {
  baseUrl: string;
  maxAttempts: number;
  baseDelayMs: number;
  logger?: LoggerPort;
}

export function resolveDelay(retryAfter: string | undefined, attempt: number, baseDelayMs: number): number {
  // If the server provided a Retry-After header, use it to determine the delay
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) return seconds * 1000;
    const date = Date.parse(retryAfter);
    if (!isNaN(date)) return Math.max(0, date - Date.now());
  }
  // Exponential backoff with ±25% jitter to spread retries across sequential calls
  const base = baseDelayMs * Math.pow(2, attempt - 1);
  return base * (0.75 + Math.random() * 0.5);
}

export function createRetryHttpClient(retryConfig: RetryConfig): AxiosInstance {
  const client = axios.create({ baseURL: retryConfig.baseUrl, timeout: 30_000 });

  axiosRetry(client, {
    retries: retryConfig.maxAttempts,
    retryCondition: (error) => {
      return classifyHttpStatus(error.response?.status) === 'transient';
    },
    retryDelay: (attempt, error) => {
      const retryAfter = error.response?.headers['retry-after'] as string | undefined;
      return resolveDelay(retryAfter, attempt, retryConfig.baseDelayMs);
    },
    onRetry: (attempt, error, requestConfig) => {
      retryConfig.logger?.warn('Retrying failed request', {
        attempt,
        maxAttempts: retryConfig.maxAttempts,
        status: error.response?.status,
        url: requestConfig.url,
        method: requestConfig.method?.toUpperCase(),
      });
    },
  });

  return client;
}
