export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface JobProgress {
  completed: number;
  total: number;
}

export interface Job {
  jobId: string;
  candidateId: string;
  type: string;
  status: JobStatus;
  progress: JobProgress;
  error: string | null;
  retryable: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RawCell = null | {
  type: 0 | 1 | 2;
  color?: string;
  direction?: string;
};

export interface CurrentMapResponse {
  map: {
    content: RawCell[][];
  };
}

export interface GoalMapResponse {
  goal: string[][];
}
