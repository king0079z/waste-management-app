# Setup Checklist – Vercel + MongoDB Atlas

Do these in order. Everything in this project (code, config) is already done; you only need the accounts and a few clicks.

---

## Step 1: MongoDB Atlas (about 5 minutes)

1. **Open:** https://www.mongodb.com/cloud/atlas/register  
   - Sign up or log in.

2. **Create a cluster**  
   - Create Project → e.g. "Waste Management".  
   - Build a Database → choose **M0 FREE**.  
   - Create (wait for cluster to be ready).

3. **Database user**  
   - Security → Database Access → Add New Database User.  
   - Authentication: Password.  
   - Username: e.g. `wasteapp`  
   - Password: generate or choose one → **copy and save it**.  
   - Database User Privileges: **Atlas admin** (or Read and write to any database).  
   - Add User.

4. **Network access**  
   - Security → Network Access → Add IP Address.  
   - Add **0.0.0.0/0** (Allow access from anywhere – needed for Vercel).  
   - Confirm.

5. **Connection string**  
   - Database → Connect → **Connect your application**.  
   - Copy the URI. It looks like:  
     `mongodb+srv://wasteapp:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`  
   - Replace `<password>` with your real password (if password has `@` or `#`, use URL encoding: `@` → `%40`, `#` → `%23`).  
   - **Save this full URI** – you’ll paste it in Vercel.

---

## Step 2: Vercel (about 3 minutes)

1. **Open:** https://vercel.com/signup  
   - Sign up with GitHub (recommended) or email.

2. **Import project**  
   - New Project → Import Git Repository.  
   - If the repo isn’t there, push your "wast Ap" folder to GitHub first, then import that repo.  
   - Or: **Add New** → **Project** → **Import** and upload or connect the repo.

3. **Environment variables** (before deploying)  
   - In the import screen (or Project → Settings → Environment Variables), add:

   | Name              | Value (use your real values)                    |
   |-------------------|--------------------------------------------------|
   | `DATABASE_TYPE`   | `mongodb`                                        |
   | `MONGODB_URI`     | (paste your full Atlas URI from Step 1.5)        |
   | `MONGODB_DATABASE`| `waste_management`                               |
   | `NODE_ENV`        | `production`                                     |

   - Save.

4. **Deploy**  
   - Click **Deploy**.  
   - Wait for the build to finish.  
   - Your app URL will be like: `https://your-project-name.vercel.app`.

---

## Step 3: Deploy from your PC (alternative to Step 2 import)

If you prefer to deploy from the command line:

1. **One-time login**  
   - Open a terminal in the project folder and run:  
     `npx vercel login`  
   - Follow the browser login.

2. **Add env vars in Vercel**  
   - After first deploy: Vercel Dashboard → your project → Settings → Environment Variables.  
   - Add the same four variables as in the table above.

3. **Deploy**  
   - In the project folder run:  
     `npx vercel --prod`  
   - Or double‑click `deploy-to-vercel.bat` if you use that script.

---

## Done

- **App URL:** `https://<your-project>.vercel.app`  
- **Database:** MongoDB Atlas (same URI you put in `MONGODB_URI`).

If anything fails, check **DEPLOY_VERCEL_MONGODB.md** for more detail.
