import { Request, Response, NextFunction } from 'express';
import { StartMegaverseSolverUseCase } from '../../domain/use-cases/StartMegaverseSolverUseCase';

export class MegaverseController {
  constructor(private readonly startSolver: StartMegaverseSolverUseCase) {}

  solve = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { candidateId } = req.body as { candidateId: string };
      const job = this.startSolver.execute(candidateId);
      res.status(202).json({ jobId: job.id, status: job.status });
    } catch (error) {
      next(error);
    }
  };
}
