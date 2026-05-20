import { config } from '../../config';
import { createLogger } from '../logging/PinoLogger';
import { createRetryHttpClient } from '../http/RetryHttpClient';
import { CrossmintApiAdapter } from '../http/CrossmintApiAdapter';
import { InMemoryJobRepository } from '../repositories/InMemoryJobRepository';
import { SolveMegaverseUseCase } from '../../domain/use-cases/SolveMegaverseUseCase';
import { StartMegaverseSolverUseCase } from '../../domain/use-cases/StartMegaverseSolverUseCase';
import { GetJobStatusUseCase } from '../../domain/use-cases/GetJobStatusUseCase';
import { MegaverseController } from '../../presentation/controllers/MegaverseController';
import { JobController } from '../../presentation/controllers/JobController';
import { LoggerPort } from '../../domain/ports/LoggerPort';

export interface Container {
  logger: LoggerPort;
  megaverseController: MegaverseController;
  jobController: JobController;
}

function buildContainer(): Container {
  const logger = createLogger(config.logLevel);

  const httpClient = createRetryHttpClient({
    baseUrl: config.crossmintApiBaseUrl,
    maxAttempts: config.retry.maxAttempts,
    baseDelayMs: config.retry.baseDelayMs,
    logger: logger.child({ component: 'crossmint-retriable-HttpClient' }),
  });

  const apiAdapter = new CrossmintApiAdapter(httpClient);
  const jobRepository = new InMemoryJobRepository();

  const solveMegaverse = new SolveMegaverseUseCase(apiAdapter, logger.child({ component: 'solve-use-case' }));
  const startSolver = new StartMegaverseSolverUseCase(
    jobRepository,
    solveMegaverse,
    logger.child({ component: 'start-solver' }),
  );
  const getJobStatus = new GetJobStatusUseCase(jobRepository);

  return {
    logger,
    megaverseController: new MegaverseController(startSolver),
    jobController: new JobController(getJobStatus),
  };
}

export const container = buildContainer();
