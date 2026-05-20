# Crossmint Megaverse Solver

A TypeScript service that solves the Crossmint coding challenge by reading a candidate's goal map and incrementally building the megaverse via the Crossmint API.

## Running the project

```bash
npm install
npm run build
npm start           # starts on port 3000 (override with PORT env var)
```

**Solve a candidate's megaverse:**
```bash
# Start a job
curl -X POST http://localhost:3000/api/megaverse/solve \
  -H "Content-Type: application/json" \
  -d '{"candidateId":"your-candidate-id"}'

# Poll until done
curl http://localhost:3000/api/megaverse/jobs/<jobId>
```

**Run tests:**
```bash
npm test              # all tests
npm run test:unit     # unit only
npm run test:integration
```

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/megaverse/solve` | Start a solve job, returns `{ jobId, status }` (202) |
| `GET` | `/api/megaverse/jobs/:jobId` | Poll job status and progress |
| `GET` | `/health` | Health check |

## Project structure

```
src/
├── domain/               # Core logic — no framework dependencies
│   ├── models/           # Polyanet, Soloon, Cometh, GoalMap, CurrentMap, Job
│   ├── value-objects/    # SoloonColor, ComethDirection, Position, MapDiff
│   ├── ports/            # MegaverseApiPort, JobRepository (interfaces)
│   ├── use-cases/        # SolveMegaverseUseCase, StartMegaverseSolverUseCase, GetJobStatusUseCase
│   └── errors/           # Typed domain errors with HTTP status codes
├── infrastructure/
│   ├── http/             # RetryHttpClient (axios + backoff), CrossmintApiAdapter
│   ├── repositories/     # InMemoryJobRepository
│   └── container/        # Manual dependency injection wiring
└── presentation/         # Express app, controllers, middleware, routes
```

## Key design decisions

See [KeyDecisions.md](KeyDecisions.md) for the full rationale behind each architectural choice, trade-offs accepted, and tech debt acknowledged. The highlights:

- **Hexagonal architecture** — domain ports/adapters, all dependencies point inward
- **Diff-based idempotent solver** — only mutates cells that differ between current and goal state
- **Async job API** — non-blocking `POST /solve` returns a job ID (202), progress via polling
- **Exponential backoff + jitter** — sequential API calls with `Retry-After` header support
- **Post-solve reconciliation** — re-fetches map after writes to detect external modifications
- **Error taxonomy** — transient / permanent / ambiguous classification mirrors payment decline codes

## UI Dashboard

A companion React dashboard is available in [`../crossmint-ui`](../crossmint-ui/) for visualizing solver progress in real time.
