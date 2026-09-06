# Pathweaver

![Pathweaver CI](https://github.com/brnnguyen25/pathweaver/actions/workflows/ci.yml/badge.svg)

**A quest dependency and narrative flow visualizer for game developers working on complex, non-linear RPGs.**

Live demo: `https://pathweaver-frontend-y11m.onrender.com` _(free-tier backend may take ~30–50s to wake up on first load)_

---

## What It Does

Pathweaver lets narrative designers map out branching questlines as interactive directed graphs, then stress-test that logic before a single line of game code is written. It answers the question every complex RPG questline eventually runs into: _"If the player does X before Y, is the true ending still reachable — or did we just build a soft-lock?"_

- **Visual graph editor** — drag-and-drop quest nodes, connect them into dependency chains, edit properties through a live panel
- **Playtest Mode** — click through nodes as a simulated player; the graph recolors in real time to show what's available, locked, or missing prerequisites
- **Validation engine** — a real DFS traversal finds orphaned (unreachable) content and dead ends; Tarjan's strongly connected components algorithm detects dependency cycles that would make a questline literally impossible to complete
- **Multi-user accounts** — register, log in, and manage multiple independent questlines ("campaigns"), each fully isolated per user
- **Import/Export** — download any questline as structured JSON or XML for import into a game engine, or re-import a previously exported file to rebuild it from scratch

## Tech Stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Frontend | React, TypeScript, Vite, React Flow                    |
| Backend  | Node.js, Express, TypeScript                           |
| Database | PostgreSQL (recursive CTEs, transactions, JSONB)       |
| Auth     | JWT, bcrypt                                            |
| Infra    | Docker, Docker Compose, GitHub Actions (CI/CD), Render |

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌────────────┐
│   Frontend   │─────▶│   Backend    │─────▶│ PostgreSQL │
│ React + Vite │ HTTP │  Express API │  SQL │  (Render)  │
│ (Static Site)│      │ (Docker Web  │      │            │
│              │      │   Service)   │      │            │
└─────────────┘      └──────────────┘      └────────────┘
```

The project is an npm-workspaces monorepo with three packages:

```
pathweaver/
├── frontend/        React/Vite app, React Flow canvas, auth UI
├── backend/         Express REST API, graph algorithms, auth/ownership middleware
└── shared-types/    TypeScript interfaces shared between frontend and backend
```

**Data model:** `users` own `questlines`, which own `nodes` and `edges`. Every graph-scoped API route (`/api/questlines/:questlineId/...`) is protected by two layers of middleware — one confirming the request carries a valid login, a second confirming that specific user actually owns that specific questline — so one account's data is never reachable by another.

## Key Engineering Details

- **Graph algorithms implemented from scratch:** iterative DFS for reachability/orphan detection, and a full recursive implementation of Tarjan's SCC algorithm for cycle detection — not a library call.
- **Transactional writes:** bulk layout saves and JSON imports are wrapped in real `BEGIN`/`COMMIT`/`ROLLBACK` transactions, so a failure partway through never leaves corrupted or half-created data.
- **ID remapping on import:** re-importing an exported questline generates entirely new database rows; a mapping table translates the file's old node references to the new IDs before edges are recreated.
- **Security:** parameterized SQL everywhere (no injection surface), bcrypt-hashed passwords with server-side complexity enforcement, JWT-based auth, and ownership checks that return `404` rather than `403` for resources a user doesn't own — so a request can't be used to enumerate which IDs exist.

## Running Locally

**Prerequisites:** Node.js 22+, PostgreSQL, Docker Desktop (optional, for the containerized path).

```powershell
git clone https://github.com/brnnguyen25/pathweaver.git
cd pathweaver
npm install
npm run build --workspace=shared-types
```

Set up `backend/.env` (see `DEPLOYMENT.md` for the full variable list), create the database schema (see `DEPLOYMENT.md` for the SQL), then:

```powershell
npm run dev --workspace=backend    # http://localhost:3001
npm run dev --workspace=frontend   # http://localhost:5173
```

Or, to run the whole stack (including Postgres) in Docker:

```powershell
docker-compose up --build
```

## CI/CD

Every push to `main` runs a GitHub Actions pipeline that type-checks both `frontend` and `backend`, and verifies both Docker images build successfully. The live deployment on Render auto-deploys from `main` independently, using its own Docker-based build for the backend and a static build for the frontend. See `DEPLOYMENT.md` for the full deployment setup.
