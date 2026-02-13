# Fix Render "package.json not found" (root is src)

Render is using **Root Directory: src**, so it runs commands in `/opt/render/project/src/` where there is no `package.json`. Override the commands to run from the **parent** (repo root).

## In Render Dashboard

1. Open your service **waste-management-app** → **Settings**.
2. Under **Build & Deploy**, set:

   **Build Command**
   ```bash
   cd .. && npm install
   ```

   **Start Command**
   ```bash
   cd .. && npm start
   ```

3. **Save Changes**.
4. **Manual Deploy** → **Deploy latest commit** (or **Clear build cache & deploy**).

Build and start will run from the repo root and find `package.json`.
