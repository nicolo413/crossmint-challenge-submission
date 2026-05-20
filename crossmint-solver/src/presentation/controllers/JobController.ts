import { Request, Response, NextFunction } from 'express';
import { GetJobStatusUseCase } from '../../domain/use-cases/GetJobStatusUseCase';

export class JobController {
  constructor(private readonly getJobStatus: GetJobStatusUseCase) {}

  getStatus = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const job = this.getJobStatus.execute(req.params.jobId);
      res.json(job.toJSON());
    } catch (error) {
      next(error);
    }
  };
}
