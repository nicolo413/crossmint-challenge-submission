import { useState } from 'react';
import { solve } from '../api/solverClient';
import type { Job } from '../types';

export const LS_KEY = 'xm_candidate_id';

const IconSolve = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
  </svg>
);

const IconArrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

interface Props {
  candidateId: string;
  savedId: string;
  onChange: (id: string) => void;
  onCandidateSaved: (id: string) => void;
  onJobCreated: (job: Job) => void;
}

export function CandidateControls({ candidateId, savedId, onChange, onCandidateSaved, onJobCreated }: Props) {
  const [loading, setLoading] = useState<'solve' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [setLabel, setSetLabel] = useState<'Save' | 'Saved'>('Save');

  const dirty = candidateId !== savedId;

  function persistCandidate() {
    if (!candidateId.trim()) return;
    localStorage.setItem(LS_KEY, candidateId);
    onCandidateSaved(candidateId);
    setSetLabel('Saved');
    setTimeout(() => setSetLabel('Save'), 1400);
  }

  function clearCandidate() {
    localStorage.removeItem(LS_KEY);
    onCandidateSaved('');
    onChange('');
    setError(null);
  }

  function requireId(): string | null {
    const trimmed = candidateId.trim();
    if (trimmed) return trimmed;
    setError('Enter a candidate ID first.');
    setShake(true);
    setTimeout(() => setShake(false), 600);
    return null;
  }

  async function handleSolve() {
    setError(null);
    const id = requireId();
    if (!id) return;
    setLoading('solve');
    try {
      const job = await solve(id);
      onJobCreated(job);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="controls">
      <div className="candidate-row">
        <input
          id="candidate-input"
          type="text"
          placeholder="Enter your candidate ID"
          className={`candidate-input${shake ? ' input-shake' : ''}`}
          autoComplete="off"
          spellCheck={false}
          value={candidateId}
          onChange={(e) => { onChange(e.target.value); setError(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') persistCandidate(); }}
        />
        <button
          className={`btn-candidate-set${dirty ? ' btn-candidate-set--active' : ''}`}
          disabled={!dirty}
          onClick={persistCandidate}
        >
          {setLabel}
        </button>
        <button
          className="btn-candidate-clear"
          disabled={!savedId}
          onClick={clearCandidate}
        >
          Clear
        </button>
      </div>

      {savedId && savedId === candidateId && !dirty && (
        <p className="candidate-saved">Candidate ID loaded from memory.</p>
      )}

      <div className="action-cards">
        <div className="action-card action-card--solve">
          <div className="action-card-top">
            <div className="action-icon action-icon--solve"><IconSolve /></div>
            <div className="action-card-body">
              <p className="action-title">Solve</p>
              <p className="action-desc">Fetch the goal map and apply only the delta — create and delete objects until the maps match.</p>
            </div>
          </div>
          <button
            className="btn btn-solve"
            disabled={loading !== null}
            onClick={() => { void handleSolve(); }}
          >
            {loading === 'solve'
              ? <><span className="btn-spinner" /> Working…</>
              : <>Solve <IconArrow /></>}
          </button>
        </div>
      </div>

      {error && <p className="controls-error">{error}</p>}
    </div>
  );
}
