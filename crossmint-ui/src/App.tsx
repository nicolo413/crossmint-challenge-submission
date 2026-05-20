import { useState, useCallback } from 'react';
import { Topbar } from './components/Topbar';
import { CandidateControls, LS_KEY } from './components/CandidateControls';
import { JobList } from './components/JobList';
import { MapView } from './components/MapView';
import type { Job, JobStatus } from './types';

const TERMINAL_STATUSES = new Set<JobStatus>(['completed', 'failed']);

export function App() {
  const [candidateId, setCandidateId] = useState(() => localStorage.getItem(LS_KEY) ?? '');
  const [savedId, setSavedId] = useState(() => localStorage.getItem(LS_KEY) ?? '');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [mapRefreshKey, setMapRefreshKey] = useState(0);

  const handleCandidateSaved = useCallback((id: string) => {
    setSavedId(id);
    setMapRefreshKey((k) => k + 1);
  }, []);

  const handleJobCreated = useCallback((job: Job) => {
    setJobs((prev) => {
      const idx = prev.findIndex((j) => j.jobId === job.jobId);
      if (idx === -1) return [job, ...prev];
      const next = [...prev];
      next[idx] = job;
      return next;
    });
    // Snapshot the map at submission time so the user sees the pre-solve baseline.
    setMapRefreshKey((k) => k + 1);
  }, []);

  const handleJobUpdated = useCallback((updated: Job) => {
    setJobs((prev) => prev.map((j) => (j.jobId === updated.jobId ? updated : j)));
    if (TERMINAL_STATUSES.has(updated.status)) {
      setMapRefreshKey((k) => k + 1);
    }
  }, []);

  return (
    <div id="app-shell">
      <Topbar />
      <main className="main-content">
        <div className="content-body">
          <section className="page-section">
            <p className="eyebrow">Candidate</p>
            <CandidateControls
              candidateId={candidateId}
              savedId={savedId}
              onChange={setCandidateId}
              onCandidateSaved={handleCandidateSaved}
              onJobCreated={handleJobCreated}
            />
          </section>
          <section className="page-section">
            <p className="eyebrow">Jobs</p>
            <JobList jobs={jobs} onJobUpdated={handleJobUpdated} />
          </section>
          <section className="page-section">
            <p className="eyebrow">Map</p>
            <MapView candidateId={candidateId} refreshKey={mapRefreshKey} />
          </section>
        </div>
      </main>
    </div>
  );
}
