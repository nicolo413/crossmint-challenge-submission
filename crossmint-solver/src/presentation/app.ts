import express, { Application } from 'express';
import { createMegaverseRouter } from './routes/megaverse.routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { MegaverseController } from './controllers/MegaverseController';
import { JobController } from './controllers/JobController';
import { LoggerPort } from '../domain/ports/LoggerPort';

export function createApp(
  megaverseController: MegaverseController,
  jobController: JobController,
  logger: LoggerPort,
): Application {
  const app = express();

  app.use(express.json());
  app.use(requestLogger(logger));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/megaverse', createMegaverseRouter(megaverseController, jobController));

  app.use(errorHandler(logger));

  return app;
}
