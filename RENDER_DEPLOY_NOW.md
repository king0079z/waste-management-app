# Deploy to Render – do this now

Render needs your code on **GitHub** first, then you connect the repo in the Render dashboard. Follow these steps in order.

---

## Step 1: Put the project on GitHub

1. **Create a new repo on GitHub**
   - Open: **https://github.com/new**
   - Repository name: e.g. `waste-management-app`
   - Leave it **empty** (no README, no .gitignore).
   - Click **Create repository**.

2. **Push this folder to that repo** (replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name):

   ```powershell
   cd "c:\Users\Mohamed\Desktop\New folder (28)\wast Ap"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```

   If GitHub asks for login, use your username and a **Personal Access Token** as the password (Settings → Developer settings → Personal access tokens).

---

## Step 2: Deploy on Render

1. **Open Render**
   - Go to: **https://dashboard.render.com**

2. **New Web Service**
   - Click **New +** → **Web Service**.

3. **Connect the repo**
   - Connect **GitHub** if you haven’t already (authorize Render).
   - Select the repo you just pushed (e.g. `waste-management-app`).
   - Click **Connect**.

4. **Settings** (Render will often detect them from `render.yaml`; if not, set manually):
   - **Name:** `waste-management-app` (or any name).
   - **Runtime:** Node.
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free (or paid if you prefer).

5. **Environment variables**
   - Open the **Environment** tab (or **Environment Variables** in the left menu).
   - Add all variables from **[ENV_VARS_FOR_RENDER.md](ENV_VARS_FOR_RENDER.md)** so the app and Findy sensors work:
   - **Required:** `NODE_ENV`, `DATABASE_TYPE`, `MONGODB_URI`, `MONGODB_DATABASE`
   - **Findy (sensors):** `FINDY_API_URL`, `FINDY_API_KEY`, `FINDY_SERVER`, `FINDY_API_USERNAME`, `FINDY_API_PASSWORD`
   - Or copy from your local `render-findy-env-copy.txt` (same values as `.env`; file is gitignored).

6. **Deploy**
   - Click **Create Web Service**.
   - Render will run `npm install` then `npm start`. Wait until the deploy shows **Live**.

7. **Your app URL**
   - At the top you’ll see something like: `https://waste-management-app-xxxx.onrender.com`
   - Open that URL to use the app. WebSockets (`/ws`) and the REST API will work.

---

## If you use a Blueprint instead

1. In Render: **New +** → **Blueprint**.
2. Connect the same GitHub repo.
3. Render will read `render.yaml` and create the Web Service. You still must add **Environment** variables in the service (Dashboard → your service → **Environment**): `MONGODB_URI`, `MONGODB_DATABASE`, and optionally `NODE_ENV`, `DATABASE_TYPE`.

---

## Summary

| Step | What to do |
|------|------------|
| 1    | Create empty repo at github.com/new |
| 2    | In your project folder: `git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git` then `git push -u origin main` |
| 3    | dashboard.render.com → New → Web Service → connect repo → set Build: `npm install`, Start: `npm start` |
| 4    | Add env vars: `MONGODB_URI`, `MONGODB_DATABASE`, `DATABASE_TYPE=mongodb`, `NODE_ENV=production` |
| 5    | Create Web Service → wait for Live → open the given URL |

After that, the app is deployed on Render with WebSockets working.
