# Environment variables for Render (full app)

Set these in **Render** → your service → **Environment** so the deployed app works (MongoDB + Findy sensors + app settings).

## Required for app and database

| Variable | Example / description |
|----------|------------------------|
| `NODE_ENV` | `production` |
| `DATABASE_TYPE` | `mongodb` |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `MONGODB_DATABASE` | `waste_management` |

## Required for Findy (sensors / device data)

| Variable | Example / description |
|----------|------------------------|
| `FINDY_API_URL` | `https://uac.higps.org` |
| `FINDY_API_KEY` | Your Findy API key |
| `FINDY_SERVER` | `findyIoT_serverApi` |
| `FINDY_API_USERNAME` | Your Findy portal username |
| `FINDY_API_PASSWORD` | Your Findy portal password |

## Optional

| Variable | Description |
|----------|-------------|
| `SESSION_SECRET` | Random string for sessions (recommended in production) |
| `PORT` | Leave unset; Render sets it |

After adding or changing variables, **Save** and trigger a **Manual Deploy** (or wait for auto-deploy) so the server restarts with the new env.
