import { JobCard } from './JobCard';
import type { Job } from '../types';

interface Props {
  jobs: Job[];
  onJobUpdated: (job: Job) => void;
}

export function JobList({ jobs, onJobUpdated }: Props) {
  if (jobs.length === 0) {
    return <p className="no-jobs">No jobs yet — trigger a solve above.</p>;
  }

  return (
    <div className="job-list">
      {jobs.map((job) => (
        <JobCard key={job.jobId} job={job} onUpdate={onJobUpdated} />
      ))}
    </div>
  );
}
