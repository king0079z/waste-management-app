# Deploy to Vercel

**Need WebSockets (real-time map, chat)?** Vercel does not support them. Use **[Render](DEPLOY_RENDER_RAILWAY.md#option-1-render-web-service)** or **[Railway](DEPLOY_RENDER_RAILWAY.md#option-2-railway)** instead — see [DEPLOY_RENDER_RAILWAY.md](DEPLOY_RENDER_RAILWAY.md).

---

## 1. Install Vercel CLI (one time)

```bash
npm i -g vercel
```

## 2. Log in (one time)

```bash
vercel login
```

## 3. Set environment variables

In [Vercel Dashboard](https://vercel.com/dashboard) → your project → **Settings** → **Environment Variables**, add at least:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_TYPE` | Yes | Set to `mongodb` so the app uses Atlas |
| `MONGODB_URI` or `MONGODB_URL` | Yes | MongoDB Atlas connection string |
| `MONGODB_DATABASE` | Optional | Database name (e.g. `waste_management`) |
| `NODE_ENV` | Optional | `production` |
| `SESSION_SECRET` | Recommended | Random secret for sessions |
| `FINDY_API_URL`, `FINDY_API_KEY`, etc. | If using Findy | From your `.env` |

Use the same names as in `.env.example`.

## 4. Deploy

From the project root:

```bash
vercel
```

Follow prompts (link to existing project or create new). For production:

```bash
vercel --prod
```

## 5. Important notes for Vercel

- **WebSockets**: Vercel serverless does **not** support WebSockets. The `/ws` endpoint will not work. Real-time features (live driver location, chat) will need polling or a separate service. REST API and static pages will work.
- **MongoDB**: Set `DATABASE_TYPE=mongodb` and `MONGODB_URI` (and optionally `MONGODB_DATABASE`) so the app uses Atlas. In Atlas Network Access, allow `0.0.0.0/0` or Vercel’s IPs so the serverless function can connect.
- **Cold starts**: The first request after idle can be slower; a new MongoDB connection is created per invocation.
- **Timeout**: API routes have a time limit (e.g. 10s on Hobby, 60s on Pro).

## 6. Full app with WebSockets (alternative)

If you need **WebSockets** (real-time map, driver chat), use **Render** or **Railway** — see **[DEPLOY_RENDER_RAILWAY.md](DEPLOY_RENDER_RAILWAY.md)** for step-by-step instructions, env vars, and MongoDB Atlas setup.
