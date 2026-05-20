import type { CurrentMapResponse, GoalMapResponse } from '../types';

const BASE = '/cm-api';

export async function getCurrentMap(candidateId: string): Promise<CurrentMapResponse> {
  const res = await fetch(`${BASE}/map/${candidateId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<CurrentMapResponse>;
}

export async function getGoalMap(candidateId: string): Promise<GoalMapResponse> {
  const res = await fetch(`${BASE}/map/${candidateId}/goal`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<GoalMapResponse>;
}
