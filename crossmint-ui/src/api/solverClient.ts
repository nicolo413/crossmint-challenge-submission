import type { Job } from '../types';

const BASE = '/solver';

async function post(path: string, body: Record<string, string>): Promise<Job> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<Job>;
}

export function solve(candidateId: string): Promise<Job> {
  return post('/api/megaverse/solve', { candidateId });
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await fetch(`${BASE}/api/megaverse/jobs/${jobId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<Job>;
}
