# Deploy on Vercel and Connect MongoDB Atlas

## 1. MongoDB Atlas (Cloud Database)

### Create a cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in or create an account.
2. **Create a project** (e.g. "Waste Management").
3. **Build a cluster** (e.g. M0 Free).
4. **Database Access** → Add New Database User:
   - Username and password (save the password).
   - Role: **Atlas admin** or **Read and write to any database**.
5. **Network Access** → Add IP Address:
   - For **Vercel**: add `0.0.0.0/0` (allow from anywhere) so serverless can connect.
   - For local dev you can also add your current IP.
6. **Get connection string**:
   - Cluster → **Connect** → **Connect your application**.
   - Copy the URI, e.g.:
     `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   - Replace `USER` and `PASSWORD` with your DB user and password (encode special chars in password, e.g. `@` → `%40`).

### Optional: create the database and collection

- The app uses database name from `MONGODB_DATABASE` (default: `waste_management`).
- Collections are created automatically when the app writes data (e.g. `bins`, `users`, `sensors`).

---

## 2. Deploy on Vercel

### From Git (recommended)

1. Push your project to **GitHub** (or GitLab/Bitbucket).
2. Go to [Vercel](https://vercel.com) → **Add New** → **Project**.
3. Import your repo and confirm:
   - **Framework Preset**: Other
   - **Root Directory**: (leave default)
   - **Build Command**: (leave empty or `npm run build` if you use it)
   - **Output Directory**: (leave default)
4. **Environment Variables** (add before deploying):

   | Name             | Value                                                                 |
   |------------------|-----------------------------------------------------------------------|
   | `DATABASE_TYPE`  | `mongodb`                                                             |
   | `MONGODB_URI`    | Your Atlas URI (e.g. `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority`) |
   | `MONGODB_DATABASE` | `waste_management`                                                |
   | `NODE_ENV`       | `production`                                                       |

   Add any other vars your app needs (e.g. `SESSION_SECRET`, `FINDY_API_*`).

5. Click **Deploy**. Your app will be at `https://your-project.vercel.app`.

### From Vercel CLI

```bash
npm i -g vercel
cd "c:\Users\abouelfetouhm\Desktop\wast Ap"
vercel
```

When prompted, add the same environment variables in the Vercel dashboard (Project → Settings → Environment Variables).

---

## 3. Important notes for Vercel

- **WebSockets**: Vercel serverless does **not** support WebSockets. The `/ws` endpoint will not work. Real-time features (live driver location, chat) will need polling or a separate service. REST API and static pages will work.
- **MongoDB**: Set `DATABASE_TYPE=mongodb` and `MONGODB_URI` (and optionally `MONGODB_DATABASE`) so the app uses Atlas.
- **Cold starts**: First request after idle can be slower; MongoDB connection is created per invocation.

---

## 4. Full app with WebSockets (alternative)

If you need **WebSockets** (real-time map, driver chat), run the full Node server on a host that supports long-lived connections, for example:

- **Render** (Web Service): connect the same repo, set **Start Command** to `npm start`, add the same env vars including `MONGODB_URI` and `DATABASE_TYPE=mongodb`.
- **Railway**: New Project from repo, add env vars, deploy.

Use MongoDB Atlas the same way: `DATABASE_TYPE=mongodb`, `MONGODB_URI` from Atlas, and `0.0.0.0/0` in Network Access so the service can connect.

---

## 5. Checklist

- [ ] MongoDB Atlas cluster created
- [ ] DB user created and password saved
- [ ] Network Access: `0.0.0.0/0` (for Vercel or cloud host)
- [ ] Connection string copied and password encoded
- [ ] Vercel (or other) project created and repo connected
- [ ] Env vars set: `DATABASE_TYPE=mongodb`, `MONGODB_URI`, `MONGODB_DATABASE`
- [ ] Deploy and test the app URL
