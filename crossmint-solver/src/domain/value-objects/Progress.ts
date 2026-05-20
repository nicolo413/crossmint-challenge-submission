export interface SolveProgress {
  completed: number;
  total: number;
}

export type ProgressCallback = (progress: SolveProgress) => void;
