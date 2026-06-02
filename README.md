# Vanstra Capital

> ⚠️ **Demonstration prototype — NOT a real financial institution.**
> This is an evaluation/demo project. It is not a bank, holds no deposits, and is
> not FDIC‑insured. Do not enter real passwords, Social Security numbers, card
> details, or other genuine personal information.

A demo digital‑banking experience: a static HTML/CSS/JS frontend backed by a
Node/Express API with simple JSON‑file storage (no database setup required).

## Run it locally

You need two processes: the **backend** (API) and the **static server** (frontend).

**1. Start the backend** (port 5000):
```bash
cd backend
npm install
node server.js
```
It runs in file‑DB mode by default (data is stored as JSON under `backend/data/`).

**2. Start the frontend** (port 3000), from the project root in a second terminal:
```bash
node start-static-server.js
```

**3. Open the app:**
```
http://localhost:3000
```
Create an account at `http://localhost:3000/signup.html`.
`config.js` auto‑detects localhost vs. a hosted site.

## Admin panel
Visit `http://localhost:3000/admin-login.html`. Admin credentials are configured
via `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env`.

## Going online
See **[DEPLOYMENT.md](DEPLOYMENT.md)** — the frontend deploys to a static host
(e.g. GitHub Pages) and the backend to a Node host (e.g. Render via the included
`render.yaml`). Set `PROD_API_BASE_URL` in `config.js` to your deployed backend.

## Notes
- **Never commit secrets.** `backend/.env` (email/JWT/admin credentials) is
  excluded by `.gitignore`. If it was ever pushed publicly, rotate those values.
- On free hosting tiers the JSON file store is temporary — data may reset on
  redeploy. Fine for a demo; use a persistent database for production.
