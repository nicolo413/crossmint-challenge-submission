import 'dotenv/config';
import { createApp } from './presentation/app';
import { container } from './infrastructure/container/DependencyContainer';
import { config } from './config';

const app = createApp(container.megaverseController, container.jobController, container.logger);

app.listen(config.port, () => {
  container.logger.info('Crossmint solver started', { port: config.port, logLevel: config.logLevel });
});
