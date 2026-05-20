import { useEffect, useRef } from 'react';
import { getJob } from '../api/solverClient';
import type { Job, JobStatus } from '../types';

const TERMINAL_STATUSES = new Set<JobStatus>(['completed', 'failed']);
const POLL_INTERVAL_MS = 2000;

const STATUS_LABELS: Record<string, string> = {
  pending: 'Queued',
  running: 'Running',
  completed: 'Succeeded',
  failed: 'Failed',
};

const NOOP_MESSAGES: Record<string, string> = {
  solve: 'Map already matches goal — no changes needed.',
};

interface Props {
  job: Job;
  onUpdate: (job: Job) => void;
}

export function JobCard({ job, onUpdate }: Props) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (TERMINAL_STATUSES.has(job.status)) return;

    const id = setInterval(() => {
      void getJob(job.jobId)
        .then((updated) => {
          onUpdateRef.current(updated);
          if (TERMINAL_STATUSES.has(updated.status)) clearInterval(id);
        })
        .catch(() => clearInterval(id));
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, [job.jobId, job.status]);

  const label = STATUS_LABELS[job.status] ?? job.status;
  const total = job.progress?.total ?? 0;
  const completed = job.progress?.completed ?? 0;
  const isNoop = job.status === 'completed' && total === 0;

  return (
    <div className="job-card">
      <div className="job-card-header">
        <span className="job-type">{job.type}</span>
        <span className={`job-badge status-${job.status}`}>
          <span className="job-badge-dot" />
          {label}
        </span>
      </div>
      <p className="job-id">{job.jobId}</p>
      {total > 0 && (
        <div className="job-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.round((completed / total) * 100)}%` }}
            />
          </div>
          <span className="progress-label">{completed} / {total}</span>
        </div>
      )}
      {isNoop && (
        <p className="job-noop">{NOOP_MESSAGES[job.type] ?? 'Already up to date — no changes needed.'}</p>
      )}
      {job.error && <p className="job-error">{job.error}</p>}
      {job.status === 'failed' && (
        <p className="job-retry-hint">
          {job.retryable ? 'Transient error — resubmit to try again.' : 'Permanent error — check your candidate ID.'}
        </p>
      )}
    </div>
  );
}
