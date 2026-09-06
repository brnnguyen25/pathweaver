# Pathweaver — Deployment Guide

This document covers everything needed to deploy Pathweaver from scratch, plus notes on real issues hit during the actual deployment and how they were resolved.

---

## 1. Environment Variables

### Backend (`backend/.env` locally, or Render environment variables in production)

| Variable | Description | Example |
|---|---|---|
| `DB_HOST` | Postgres hostname | `pathweaver-db.render.com` |
| `DB_PORT` | Postgres port | `5432` |
| `DB_USER` | Postgres username | `pathweaver_admin` |
| `DB_PASSWORD` | Postgres password | *(secret)* |
| `DB_NAME` | Database name | `pathweaver_dev` |
| `JWT_SECRET` | Signing secret for auth tokens | long random string |
| `PORT` | Port the Express server listens on | `3001` |

### Frontend (build-time only, via Vite)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Full URL of the backend API, including `/api` | `https://pathweaver-backend.onrender.com/api` |

> **Critical:** `VITE_API_BASE_URL` is baked into the compiled JavaScript **at build time**, not read at runtime. Changing this value in Render's dashboard does nothing until the frontend is rebuilt — either by pushing a new commit, or triggering a **Manual Deploy**. If the frontend still calls `localhost:3001` after a "successful" deploy, the build did not actually pick up the new value; check that the source code genuinely reads `import.meta.env.VITE_API_BASE_URL` (not a hardcoded string) and that the environment variable was saved *before* the build ran, not just typed into the field.

---

## 2. Database Schema Setup

Run against a fresh, empty PostgreSQL database, in this exact order:

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label VARCHAR(255) NOT NULL,
    node_type VARCHAR(50) NOT NULL DEFAULT 'required'
        CHECK (node_type IN ('required', 'optional', 'mutually_exclusive', 'time_sensitive')),
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    condition_type VARCHAR(50) NOT NULL DEFAULT 'hard_requirement'
        CHECK (condition_type IN ('hard_requirement', 'one_of_many')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT no_self_reference CHECK (from_node_id != to_node_id)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE questlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE nodes ADD COLUMN questline_id UUID REFERENCES questlines(id) ON DELETE CASCADE;
ALTER TABLE edges ADD COLUMN questline_id UUID REFERENCES questlines(id) ON DELETE CASCADE;

ALTER TABLE nodes ADD COLUMN position_x DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE nodes ADD COLUMN position_y DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE nodes ALTER COLUMN questline_id SET NOT NULL;
ALTER TABLE edges ALTER COLUMN questline_id SET NOT NULL;
```

Verify with `\dt` — expect `nodes`, `edges`, `users`, `questlines`. No seed data is needed in production; the first real user registers and builds their own questlines through the UI.

---

## 3. Deploying to Render

### Database
1. **New → PostgreSQL**, free plan.
2. Copy the **External Database URL** and connect with `psql` to run the schema above.
3. Note the **Hostname / Port / Database / Username / Password** from the Connections tab — used in the next step.

### Backend (Docker Web Service)
1. **New → Web Service**, connect the GitHub repo.
2. **Environment:** Docker · **Dockerfile Path:** `backend/Dockerfile` · **Root Directory:** blank
3. **Environment Variables:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET` (see §1)
4. Deploy. Verify at `https://<backend-url>/api/health` → `{"status":"ok"}`.

### Frontend (Static Site)
1. **New → Static Site**, same repo.
2. **Build Command:**
   ```
   npm install && npm run build --workspace=shared-types && npm run build --workspace=frontend
   ```
3. **Publish Directory:** `frontend/dist`
4. **Environment Variables:** `VITE_API_BASE_URL` → `https://<real-backend-url>/api`
5. Deploy.

### Continuous Deployment
Both Render services auto-deploy on every push to `main` by default — no additional configuration needed. GitHub Actions (`.github/workflows/ci.yml`) runs type-checking and Docker build verification in parallel, independent of Render's own deploy.

---

## 4. Troubleshooting Log (Real Issues Hit During Deployment)

**Symptom: Render gave the frontend a URL with a random suffix (`pathweaver-frontend-y11m.onrender.com`) instead of the plain name.**
Render subdomains are unique across its *entire* platform, not per-account. If your chosen name is already taken by someone else's service, Render silently appends a suffix. Always copy the real URL from the service's dashboard page rather than guessing or typing it from memory.

**Symptom: Frontend shows Render's generic "Not Found" page immediately after a successful deploy.**
Caused by the browser displaying a stale cached response from before the deploy finished propagating. Fix: hard refresh (`Ctrl+Shift+R`), not a plain refresh.

**Symptom: "Failed to fetch" on register/login in production, despite `/api/health` working fine when visited directly.**
Check the browser DevTools **Network** tab for the actual request URL. If it still shows `localhost:3001` instead of the real backend URL, the frontend was built *before* `VITE_API_BASE_URL` was set, or the code still hardcodes the URL rather than reading `import.meta.env.VITE_API_BASE_URL`. Fix: confirm the source code is correct and pushed to `main`, then trigger a fresh build — compare the output JS filename hash between builds (e.g. `index-BnzYeZ46.js` vs `index-BhRfdzgi.js`) to confirm a genuinely new bundle was produced, not a cached one.

**Symptom: `questlineId` is `undefined` inside a nested Express route's controller.**
Any router mounted under a parent path with a URL parameter (e.g. `/api/questlines/:questlineId/edges`) must be created with `Router({ mergeParams: true })`. Without it, the nested router cannot see parameters captured by its parent, and every scoped query silently fails.

**Symptom: Export endpoint returns nodes/edges from every questline, not just the requested one.**
The controller's SQL query was missing `WHERE questline_id = $1`. Always double-check every questline-scoped query has both the filter clause and the corresponding parameter — this is easy to miss when copy-adapting a controller from an earlier module.

**Symptom: First request to the live site after a period of inactivity takes 30–50+ seconds.**
Expected behavior on Render's free tier — the backend Web Service spins down after 15 minutes idle. The Static Site frontend does not spin down. Not a bug; visit `/api/health` first to "wake" the backend before a demo.

**Symptom: Password reset needed on local PostgreSQL (Windows).**
`pg_hba.conf` has separate lines for IPv4 (`127.0.0.1/32`) and IPv6 (`::1/128`) loopback connections — both must be set to `trust` temporarily to reset a forgotten password via `ALTER USER ... WITH PASSWORD`, since `localhost` may resolve to either address depending on the machine.

---

## 5. Known Limitations (Documented Tradeoffs, Not Bugs)

- **Export/Import does not preserve node layout positions.** Module 8's export schema predates position persistence (Module 13); imported questlines start in a default grid layout.
- **Export endpoints are not authentication-protected.** `window.open()` cannot attach a Bearer token, so export routes are intentionally left open, relying on the UUID's unpredictability rather than auth. A production system handling sensitive data would use a signed, time-limited download link instead.
- **Render's free PostgreSQL expires after 90 days.** Plan to re-run the schema setup against a fresh database, or upgrade to a paid instance, before that window closes if continued availability matters (e.g., an upcoming interview).
