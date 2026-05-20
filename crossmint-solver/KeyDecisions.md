# Key Decisions

Architectural and design decisions made during development, including the trade-offs accepted and technical debt incurred.

---

## 1. Hexagonal Architecture

**Decision:** Strict separation into domain, infrastructure, and presentation layers. The domain owns all business logic and speaks only to interfaces (ports). Adapters depend inward; the domain depends on nothing external.

`InMemoryJobRepository` implements the `JobRepository` port. Use cases depend only on the interface — swapping to Redis or Postgres means writing a new adapter with no use-case changes.

**Trade-offs:**

- More files and indirection than a simple script would need for a challenge of this size.
- Justifies itself as soon as the API changes, a new transport is added, or persistence is swapped — only the adapter changes.

---

## 2. Smart Diff Strategy

**Decision:** On each solve, fetch both the current map and the goal map, compute a delta, and only call the API for cells that differ. Delete-before-create order is preserved.

**Trade-offs:**

- Two map fetches per run instead of one (current + goal).
- Correct-by-construction: running the solver twice on an already-correct map is a true no-op, making it safe to re-run without manual cleanup.

**Tech debt:** The diff is O(rows × cols) in memory and time — fine for the grid sizes in this challenge, but would need rethinking for very large maps.

---

## 3. Async Job-Based API

**Decision:** `POST /solve` returns a job ID immediately (202). The actual work runs in the background. Status and progress are polled via `GET /jobs/:jobId`.

**Trade-offs:**

- More complex than a blocking endpoint for a challenge context.
- Required because Phase 2 involves 100+ sequential API calls that can take minutes when rate-limited. A synchronous endpoint would time out at any reasonable HTTP gateway.
- Polling is less ergonomic than WebSockets/SSE for real-time progress, but has zero extra infrastructure requirements.

**Tech debt:**

- Job state lives only in the process. A crash loses all in-progress jobs. Acceptable for a challenge; a production system would persist to Redis or a database.
- No job TTL or cleanup. The in-memory store grows unbounded over time.
- No pagination on job listing (no listing endpoint exists yet).

---

## 4. Sequential API Calls With Exponential Backoff

**Decision:** All Crossmint API calls execute one at a time. Failed calls (429 or 5xx) are retried up to `RETRY_MAX_ATTEMPTS` times (default 10) with exponential backoff + ±25% jitter. The `Retry-After` header is honoured when present.

**Trade-offs:**

- Sequential execution is 10–20× slower than concurrent at full throughput.
- Concurrent calls would likely trigger more 429s, making it slower in practice. Sequencing respects the rate limit budget naturally.
- Jitter prevents the thundering-herd problem where all retries for a batch of sequential calls fire at the same moment.

**Tech debt:** Backoff parameters (`maxAttempts`, `baseDelayMs`) are global. A more sophisticated implementation would track the per-endpoint rate limit window and pause the entire queue when a 429 is received, rather than retrying per-call. This would halve the number of wasted calls during a rate-limited run.

---

## 5. Job Lifecycle Inlined into StartMegaverseSolverUseCase

**Decision:** All job lifecycle logic (idempotency check, status transitions, terminal state guards, logging) lives directly in `StartMegaverseSolverUseCase`. There is no separate orchestrator abstraction.

**Trade-offs:**

- Fewer files and less indirection for the current single-operation scope.
- If a second operation type emerges (e.g., a partial-area repaint), the shared lifecycle logic would be extracted into a dedicated orchestrator at that point — not prematurely.

**Tech debt:** There is no mechanism to cancel an in-flight job. The operation is a fire-and-forget promise with no cancellation token. This would require a cooperative cancellation pattern (e.g., `AbortController`) if time-bounded execution becomes a requirement.

---

## 6. Distributed Systems Awareness

**Fresh jobs over retries.** Failed jobs are never replayed. Resubmission creates a fresh job that reconciles against current map state. A failed job's diff is a snapshot of state at the time it ran — by the time someone resubmits, the map may have changed due to the partial run or external mutations. Replaying a stale diff would apply the wrong operations. This mirrors payment systems where a failed charge gets a new authorization against current account state, not a replay of the stale one.

**Distributed locking.** Today the service assumes a single process. If multiple instances ran concurrently, a second solver could start on the same `candidateId` between the `findActiveByCandidate` check and job creation (TOCTOU race). The fix is an advisory lock (Redis `SET NX`, Postgres advisory lock) wrapping the idempotency check and insert. Not implemented because the challenge runs single-process; the port-based `JobRepository` makes the swap straightforward.
