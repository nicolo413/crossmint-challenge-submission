import { useState, useEffect, useCallback } from 'react';
import { getCurrentMap, getGoalMap } from '../api/crossmintClient';
import type { RawCell } from '../types';

const SOLOON_FILTERS: Record<string, string> = {
  white: 'grayscale(100%)',
  red: 'grayscale(100%) brightness(30%) sepia(100%) hue-rotate(-180deg) saturate(700%) contrast(0.8)',
  purple: 'grayscale(100%) brightness(70%) sepia(50%) hue-rotate(-100deg) saturate(500%) contrast(1)',
  blue: 'grayscale(100%) brightness(40%) sepia(100%) hue-rotate(-50deg) saturate(600%) contrast(0.8)',
};

const COMETH_ROTATIONS: Record<string, string> = {
  up: '330deg', right: '48deg', down: '140deg', left: '230deg',
};

function CurrentCell({ cell }: { cell: RawCell }) {
  if (cell === null) return <span className="cell cell-space">🌌</span>;
  if (cell.type === 0) return <span className="cell cell-polyanet">🪐</span>;
  if (cell.type === 1) {
    const filter = SOLOON_FILTERS[cell.color ?? ''];
    return <span className="cell cell-soloon" style={filter ? { filter } : undefined}>🌕</span>;
  }
  const rotation = COMETH_ROTATIONS[cell.direction ?? ''] ?? '0deg';
  return <span className="cell cell-cometh" style={{ transform: `rotate(${rotation})` }}>☄️</span>;
}

function GoalCell({ token }: { token: string }) {
  if (!token || token === 'SPACE') return <span className="cell cell-space">🌌</span>;
  if (token === 'POLYANET') return <span className="cell cell-polyanet">🪐</span>;

  const soloon = /^(WHITE|RED|PURPLE|BLUE)_SOLOON$/.exec(token);
  if (soloon) {
    const filter = SOLOON_FILTERS[soloon[1].toLowerCase()];
    return <span className="cell cell-soloon" style={filter ? { filter } : undefined}>🌕</span>;
  }

  const cometh = /^(UP|DOWN|LEFT|RIGHT)_COMETH$/.exec(token);
  if (cometh) {
    const rotation = COMETH_ROTATIONS[cometh[1].toLowerCase()] ?? '0deg';
    return <span className="cell cell-cometh" style={{ transform: `rotate(${rotation})` }}>☄️</span>;
  }

  return <span className="cell cell-space">🌌</span>;
}

type State =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'current'; rows: RawCell[][] }
  | { type: 'goal'; rows: string[][] };

const RefreshIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" />
  </svg>
);

interface Props {
  title: string;
  candidateId: string;
  type: 'current' | 'goal';
  refreshKey: number;
}

export function MapPanel({ title, candidateId, type, refreshKey }: Props) {
  const [state, setState] = useState<State>({ type: 'idle' });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!candidateId.trim()) {
      setState({ type: 'error', message: 'Enter a candidate ID first.' });
      (document.getElementById('candidate-input') as HTMLInputElement | null)?.focus();
      return;
    }
    setLoading(true);
    setState({ type: 'loading' });
    try {
      if (type === 'current') {
        const res = await getCurrentMap(candidateId);
        setState({ type: 'current', rows: res.map.content });
      } else {
        const res = await getGoalMap(candidateId);
        setState({ type: 'goal', rows: res.goal });
      }
    } catch (err) {
      const message = err instanceof Error && err.message.includes('429')
        ? 'Take it easy — the API also deserves to rest.'
        : `Failed to load ${type} map`;
      setState({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }, [candidateId, type]);

  useEffect(() => {
    if (refreshKey > 0) void load();
  }, [refreshKey, load]);

  return (
    <div className="map-panel">
      <div className="map-panel-header">
        <p className="map-title">{title}</p>
        <button
          className={`btn-map-refresh${loading ? ' loading' : ''}`}
          disabled={loading}
          onClick={() => { void load(); }}
        >
          <RefreshIcon /> Refresh
        </button>
      </div>

      {state.type === 'idle' && <div className="map-grid map-placeholder">Waiting for first action…</div>}
      {state.type === 'loading' && <div className="map-grid map-placeholder">Loading…</div>}
      {state.type === 'error' && <div className="map-grid map-error">{state.message}</div>}
      {state.type === 'current' && (
        <div className="map-grid">
          {state.rows.map((row, r) => (
            <div key={r} className="map-row">
              {row.map((cell, c) => <CurrentCell key={c} cell={cell} />)}
            </div>
          ))}
        </div>
      )}
      {state.type === 'goal' && (
        <div className="map-grid">
          {state.rows.map((row, r) => (
            <div key={r} className="map-row">
              {row.map((token, c) => <GoalCell key={c} token={token} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
