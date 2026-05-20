import { Router } from 'express';
import { MegaverseController } from '../controllers/MegaverseController';
import { JobController } from '../controllers/JobController';
import { validateBody } from '../middleware/validateBody';

export function createMegaverseRouter(
  megaverseController: MegaverseController,
  jobController: JobController,
): Router {
  const router = Router();

  router.post('/solve', validateBody(['candidateId']), megaverseController.solve);
  router.get('/jobs/:jobId', jobController.getStatus);

  return router;
}
