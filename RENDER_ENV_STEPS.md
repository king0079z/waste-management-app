# Add Findy env vars on Render (do this once)

Only you can add environment variables in your Render account. Follow these steps:

---

## 1. Open Render

1. Go to **https://dashboard.render.com**
2. Log in and open your **waste-management-app** service

---

## 2. Open Environment

1. In the left sidebar, click **Environment**
2. You’ll see the list of existing variables (if any)

---

## 3. Add these variables

Click **Add Environment Variable** for each row below. Use the **same values** as in your local `.env` or `render-findy-env-copy.txt`.

| Key (name)            | Value (use your real values) |
|-----------------------|------------------------------|
| `FINDY_API_URL`       | `https://uac.higps.org`      |
| `FINDY_API_KEY`       | Your Findy API key           |
| `FINDY_SERVER`        | `findyIoT_serverApi`         |
| `FINDY_API_USERNAME`  | Your Findy username          |
| `FINDY_API_PASSWORD`  | Your Findy password          |

If you already have MongoDB vars (`MONGODB_URI`, `MONGODB_DATABASE`, etc.), leave them as they are. Only add or update the Findy ones above.

---

## 4. Save and redeploy

1. Click **Save Changes**
2. Go to **Manual Deploy** → **Deploy latest commit** (or push a new commit to trigger a deploy)

After the deploy finishes, the app will use Findy the same way as on your machine, and “Findy not configured” should stop.

---

**Tip:** If you keep your values in `render-findy-env-copy.txt` on your PC, open that file and copy each line into Render (Key = left side, Value = right side).
