# Crossmint Challenge

This repository contains my submission for the Crossmint coding challenge.

## Projects

### [crossmint-solver](crossmint-solver/)

The core submission — a TypeScript service that reads a candidate's goal map and incrementally builds the megaverse via the Crossmint API. Designed with hexagonal architecture, diff-based idempotent solving, and payment-grade error handling.

See [crossmint-solver/README.md](crossmint-solver/README.md) for setup, API docs, and architecture details.

### [crossmint-ui](crossmint-ui/)

An optional React dashboard for visualizing solver progress. Provides a real-time grid view of the megaverse and job status monitoring. Built as a lightweight prototype to complement the solver.

## Quick start

```bash
# Solver (main project)
cd crossmint-solver
npm install
npm run build
npm start

# UI (optional)
cd crossmint-ui
npm install
npm run dev
```

Both projects use Node 20 (see `.nvmrc`).
