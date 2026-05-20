export type ApiErrorClassification = 'transient' | 'permanent' | 'ambiguous';

// transient: 429, 5xx — safe to retry
// permanent: 4xx — bad request or auth failure, do not retry
// ambiguous: no response received — may have landed; do not retry, diff reconciliation handles recovery
export function classifyHttpStatus(status: number | undefined): ApiErrorClassification {
  if (status === undefined) return 'ambiguous';
  if (status === 429 || status >= 500) return 'transient';
  return 'permanent';
}
