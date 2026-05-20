export interface AppConfig {
  port: number;
  logLevel: string;
  crossmintApiBaseUrl: string;
  retry: {
    maxAttempts: number;
    baseDelayMs: number;
  };
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  crossmintApiBaseUrl: process.env.CROSSMINT_API_BASE_URL ?? 'https://challenge.crossmint.io/api',
  retry: {
    maxAttempts: parseInt(process.env.RETRY_MAX_ATTEMPTS ?? '10', 10),
    baseDelayMs: parseInt(process.env.RETRY_BASE_DELAY_MS ?? '2000', 10),
  },
};
