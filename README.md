# bolt-action-dice-emulator

Bolt Action dice bag helper with both a CLI and a tiny server-rendered webapp.

## Install

From the repo root:

```bash
pip install -e .
```

## Run (webapp)

```bash
ba web
```

Then open `http://127.0.0.1:8000`.

## Run (CLI)

```bash
ba play "Germany" "USA" 10 10 --turns 6
```

This repo now contains:

- `src/bolt_action_cli/`: the original Bolt Action dice bag CLI helper
- `backend/`: FastAPI backend for the army list builder (v1)
- `frontend/`: Vite + React UI for the army list builder (v1)

## Army list builder (v1)

### Run the backend

From repo root:

```bash
uv sync
uv run uvicorn backend.app.main:app --reload --port 8000
```

Backend endpoints:

- `GET /api/health`
- `GET /api/catalog`
- `GET /api/lists`
- `GET /api/lists/{id}`
- `POST /api/lists`
- `POST /api/points`

Saved lists are persisted as JSON under `data/army_lists/`.

### Run the frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:8000` by default.

Optional override:

- Set `VITE_API_BASE` (e.g. `http://localhost:8000`) when running Vite.
