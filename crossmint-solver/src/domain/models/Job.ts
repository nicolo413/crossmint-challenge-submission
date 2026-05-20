import { JobType } from '../value-objects/JobType';

export enum JobStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

export interface JobProgress {
  completed: number;
  total: number;
}

export interface JobSnapshot {
  readonly id: string;
  readonly candidateId: string;
  readonly type: JobType;
  readonly status: JobStatus;
  readonly progress: JobProgress;
  readonly error: string | undefined;
  readonly retryable: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class Job {
  private _status: JobStatus;
  private _progress: JobProgress;
  private _error: string | undefined;
  private _retryable: boolean;
  private _updatedAt: Date;

  constructor(
    readonly id: string,
    readonly candidateId: string,
    readonly type: JobType,
    status: JobStatus = JobStatus.Pending,
    progress: JobProgress = { completed: 0, total: 0 },
    error: string | undefined = undefined,
    retryable: boolean = false,
    readonly createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ) {
    this._status = status;
    this._progress = progress;
    this._error = error;
    this._retryable = retryable;
    this._updatedAt = updatedAt;
  }

  get status(): JobStatus {
    return this._status;
  }
  get progress(): JobProgress {
    return this._progress;
  }
  get error(): string | undefined {
    return this._error;
  }
  get retryable(): boolean {
    return this._retryable;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  /** @internal — only callable by repository implementations */
  applyUpdate(fields: {
    status?: JobStatus;
    progress?: JobProgress;
    error?: string;
    retryable?: boolean;
  }): void {
    if (fields.status !== undefined) this._status = fields.status;
    if (fields.progress !== undefined) this._progress = fields.progress;
    if (fields.error !== undefined) this._error = fields.error;
    if (fields.retryable !== undefined) this._retryable = fields.retryable;
    this._updatedAt = new Date();
  }

  toJSON() {
    return {
      jobId: this.id,
      candidateId: this.candidateId,
      type: this.type,
      status: this._status,
      progress: this._progress,
      error: this._error ?? undefined,
      retryable: this._retryable,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
