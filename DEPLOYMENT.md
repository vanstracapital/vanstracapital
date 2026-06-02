# Putting Vanstra Capital online (free)

The app has **two parts**:
- **Frontend** (the HTML pages) → hosted free on **GitHub Pages**.
- **Backend** (Node/Express engine that creates accounts) → hosted free on **Render**.

GitHub Pages alone can NOT create accounts — it has no backend. Follow these
steps once and the whole thing works online for anyone.

---

## Step 1 — Push the code to GitHub
Make sure `.env` is NOT uploaded (the included `.gitignore` already blocks it).
Your repo should contain everything else, including `render.yaml` and `config.js`.

## Step 2 — Deploy the backend on Render
1. Go to https://render.com and sign up (free, can use your GitHub account).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repo. Render detects `render.yaml` and proposes the
   **vanstra-backend** web service. Click **Apply**.
4. When prompted, fill in the secret environment variables:
   | Key | Value |
   |-----|-------|
   | `ADMIN_EMAIL` | your admin email |
   | `ADMIN_PASSWORD` | your admin password (the admin panel login) |
   | `EMAIL_USER` | your Gmail address (for OTP emails) |
   | `EMAIL_PASSWORD` | your Gmail **16-char app password** |
   | `FRONTEND_URL` | leave blank for now — fill in Step 4 |
5. Wait for the deploy to finish. Render gives you a URL like
   `https://vanstra-backend.onrender.com`. **Copy it.**
6. Open that URL + `/api/health` in your browser
   (`https://vanstra-backend.onrender.com/api/health`). You should see
   `{"status":"Server is running"}`. ✅

## Step 3 — Point the frontend at your backend
Edit **`config.js`** (top of the file) and set:
```js
const PROD_API_BASE_URL = 'https://vanstra-backend.onrender.com/api';
```
(Use YOUR Render URL, and keep the `/api` at the end.) Commit & push.

## Step 4 — Turn on GitHub Pages for the frontend
1. In your GitHub repo: **Settings → Pages**.
2. Source: **Deploy from a branch** → Branch: **main** → Folder: **/ (root)** → Save.
3. After a minute GitHub gives you a URL like
   `https://YOURNAME.github.io/YOURREPO/`. This is your live site.
4. Back in Render, set the env var `FRONTEND_URL` to that Pages URL, then
   **Manual Deploy → Deploy latest commit** (so password-reset email links
   point to the right place).

## Step 5 — Test
Open `https://YOURNAME.github.io/YOURREPO/signup.html` and create an account.
It should work for anyone, anywhere.

---

## Good to know
- **First request is slow.** Render's free tier sleeps after ~15 min idle; the
  next request takes ~30–50s to wake it. Normal for free hosting.
- **Data resets on redeploy.** The backend stores data in JSON files, and
  Render's free filesystem is temporary — accounts are wiped when the service
  restarts or redeploys. Fine for a demo. For permanent storage you'd add a
  paid Render disk or move to a database (e.g. MongoDB Atlas free tier).
- **Local development still works** unchanged: run the backend
  (`cd backend && npm install && node server.js`) and the static server
  (`node start-static-server.js`), then open `http://localhost:3000`.
  `config.js` auto-detects localhost vs the hosted site.
- **Security:** never commit `backend/.env`. If you already pushed it publicly,
  rotate your Gmail app password and JWT/admin secrets, and make the repo private.
