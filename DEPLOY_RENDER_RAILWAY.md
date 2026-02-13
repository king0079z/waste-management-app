# Deploy with WebSockets (Render or Railway)

Use **Render** or **Railway** when you need the **full app**, including **WebSockets** (real-time driver location, chat, live sensor updates). Vercel serverless does not support WebSockets.

---

## Option 1: Render (Web Service)

### 1. Connect the repo

1. Go to [Render Dashboard](https://dashboard.render.com).
2. **New +** → **Web Service**.
3. Connect your Git provider and select this repository (or use **Blueprint** and point to the repo that contains `render.yaml`).

### 2. Configure the service

If you use the **Blueprint** (repo has `render.yaml`):

- Render will create a Web Service with:
  - **Build command:** `npm install`
  - **Start command:** `npm start`
  - **Health check path:** `/api/health`

If you create the service **manually**:

- **Runtime:** Node
- **Build command:** `npm install`
- **Start command:** `npm start`
- **Health check path (optional):** `/api/health`

### 3. Environment variables

In the service **Environment** tab, add:

| Variable            | Value                                                                 |
|---------------------|-----------------------------------------------------------------------|
| `NODE_ENV`          | `production`                                                          |
| `DATABASE_TYPE`     | `mongodb`                                                             |
| `MONGODB_URI`       | Your MongoDB Atlas connection string                                  |
| `MONGODB_DATABASE`  | `waste_management` (or your DB name)                                  |
| `SESSION_SECRET`    | A long random string (optional, for sessions)                         |
| **Findy (sensors)** | Required for sensor/device data: `FINDY_API_URL`, `FINDY_API_KEY`, `FINDY_SERVER`, `FINDY_API_USERNAME`, `FINDY_API_PASSWORD` — see [ENV_VARS_FOR_RENDER.md](ENV_VARS_FOR_RENDER.md) |

Do **not** put secrets in `render.yaml`; set them in the Render Dashboard.

### 4. Deploy

- **Blueprint:** Save the Blueprint; Render will deploy.
- **Manual:** Click **Create Web Service**. Render will build and run `npm start`.

Your app will be at `https://<service-name>.onrender.com`. WebSockets (`/ws`) and the REST API will work.

---

## Option 2: Railway

### 1. Create a project

1. Go to [Railway](https://railway.app).
2. **New Project** → **Deploy from GitHub repo** (or **Empty project** and connect the repo later).
3. Select this repository.

### 2. Configure the service

Railway will detect Node.js and use `npm start` from `package.json`. To set it explicitly:

- Open the service → **Settings** → **Deploy**.
- **Start command:** `npm start` (optional; this is the default for Node).

### 3. Environment variables

In the service **Variables** tab, add:

| Variable            | Value                                                                 |
|---------------------|-----------------------------------------------------------------------|
| `NODE_ENV`          | `production`                                                          |
| `DATABASE_TYPE`     | `mongodb`                                                             |
| `MONGODB_URI`       | Your MongoDB Atlas connection string                                  |
| `MONGODB_DATABASE`  | `waste_management` (or your DB name)                                  |
| `SESSION_SECRET`    | A long random string                                                  |
| Findy (optional)    | Same as in the Render table above                                     |

### 4. Public URL

- **Settings** → **Networking** → **Generate domain** (or add a custom domain).
- Your app will be at `https://<your-app>.up.railway.app`. WebSockets and the REST API will work.

---

## MongoDB Atlas (for both Render and Railway)

1. Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Database Access** → Add a user (username + password).
3. **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`) so Render/Railway can connect.
4. **Connect** → **Connect your application** → copy the connection string.
5. Set `MONGODB_URI` to that string (replace `<password>` with the real password) and set `MONGODB_DATABASE` (e.g. `waste_management`).

---

## Summary

| Feature           | Vercel        | Render / Railway   |
|------------------|---------------|---------------------|
| WebSockets `/ws` | Not supported | Supported           |
| REST API         | Yes           | Yes                 |
| Static pages      | Yes           | Yes                 |
| Real-time map/chat| No           | Yes                 |
| Long-lived server| No (serverless) | Yes (always-on)   |

For the full app with real-time features, use **Render** or **Railway** and **Start command: `npm start`** with the env vars above.
