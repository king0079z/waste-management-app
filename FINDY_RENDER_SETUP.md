# Fix "Not authenticated - please login first" (Findy on Render)

The app gets sensor/device data from **Findy** (UAC API). The **server** must log in to Findy using credentials. If those credentials are not set on Render, you see:

- `❌ Error fetching device …: Not authenticated - please login first`
- `⚠️ Findy API: Findy API credentials not fully configured`

## Fix: Add Findy env vars on Render

1. Open **Render Dashboard** → your **waste-management-app** service.
2. Go to **Environment** (left sidebar).
3. Add these variables (use the same values as in your local `.env`):

   | Key | Value |
   |-----|--------|
   | `FINDY_API_URL` | `https://uac.higps.org` |
   | `FINDY_API_KEY` | Your Findy API key (from .env) |
   | `FINDY_SERVER` | `findyIoT_serverApi` |
   | `FINDY_API_USERNAME` | Your Findy username |
   | `FINDY_API_PASSWORD` | Your Findy password (if it contains `#`, use quotes in Render) |

4. **Save Changes**.
5. Trigger a **Manual Deploy** (or wait for auto-deploy) so the server restarts with the new env.

After the redeploy, the server will call Findy login on startup (or on first use) and sensor/device requests should work. The "Not authenticated - please login first" errors should stop.

## If you don't use Findy sensors

If you are not using Findy IoT devices, you can leave these unset. Sensor-related UI may show errors or placeholders; the rest of the app (bins, drivers, map, etc.) will still work.
