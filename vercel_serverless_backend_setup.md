# Backend → Vercel Serverless (Express) — Implementation Brief

## 0) Goal
Deploy the existing `betting-tracker-backend` as **serverless functions on Vercel** under `/api/*`, keep MongoDB + JWT auth working, and expose a stable `API_BASE_URL` that the frontend can call from Vercel.

---

## 1) Repo Layout (target)
If the backend is in its own repo, keep it. If it’s inside the frontend repo, place it at the root (recommended) or in a `backend/` folder. The serverless entrypoint must live at `api/index.js`.

```
<repo>/
  api/
    index.js          # serverless entry wrapping the Express app
  src/
    app.js            # builds and exports the Express app (no app.listen)
    db.js             # Mongo connection (cached)
    routes/
      auth.js         # /auth routes (register/login)
      ...             # other route files
  vercel.json
  package.json
  .env.local          # local dev only (DO NOT COMMIT)
```

---

## 2) Dependencies
Install what we need (adjust if you already have them):

```bash
npm i express cors mongoose jsonwebtoken bcrypt
npm i -D @vercel/node
```

> We won’t use `serverless-http`; Vercel’s Node runtime handles Express directly when exported as default.

---

## 3) Split “app” vs “server”
**Do not call `app.listen` in serverless.** Create an `app.js` that builds and exports the Express app. Keep your old `server.js` for local dev if you want, but it won’t be used by Vercel.

### `src/app.js`
```js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.js';
import connectDB from './db.js';

const app = express();

// Parse
app.use(express.json());
app.use(cookieParser());

// CORS – allow your Vercel frontend domain(s)
const allowed = [
  'https://your-frontend.vercel.app',   // replace with your actual domain
  'https://your-custom-domain.com'      // optional
];
app.use(cors({ origin: allowed, credentials: true }));

// Ensure DB is connected before handling requests (connection is cached)
await connectDB();

// Routes live under /api in production via vercel.json; keep them mounted at root here
app.use('/auth', authRouter);

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

export default app;
```

### `src/db.js` (Mongo connection with caching for serverless)
```js
import mongoose from 'mongoose';

let cached = global._mongoose;
if (!cached) cached = global._mongoose = { conn: null, promise: null };

export default async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('Missing MONGO_URI');
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false
      })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

### `src/routes/auth.js` (example)
```js
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const token = jwt.sign({ sub: 'user-id' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token });
  } catch (err) {
    res.status(400).json({ error: 'Register failed', details: String(err) });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const token = jwt.sign({ sub: 'user-id' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(401).json({ error: 'Login failed', details: String(err) });
  }
});

export default router;
```

---

## 4) Serverless entrypoint
Create `api/index.js` that **exports the Express app as default**:

```js
import app from '../src/app.js';

// Vercel uses the default export as the handler
export default app;
```

---

## 5) vercel.json (routes + build)
Place at repo root:

```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "api/index.js" }
  ]
}
```

---

## 6) package.json
Ensure it’s ESM (or convert imports to CommonJS). Example ESM:

```json
{
  "type": "module",
  "scripts": {
    "dev": "vercel dev",
    "start": "node api/index.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.6.0"
  },
  "devDependencies": {
    "@vercel/node": "^3.2.0"
  }
}
```

> If you prefer CommonJS, switch to `require` syntax and drop `"type": "module"`.

---

## 7) Environment Variables (Vercel)
In the Vercel project settings → **Environment Variables**, add:

- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — a strong secret

---

## 8) Local Testing
```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
npm run dev
# Test: http://localhost:3000/api/health
```

---

## 9) Deploy
```bash
vercel
vercel --prod
```

Backend base URL:
```
https://<project>.vercel.app/api
```

---

## 10) Frontend Wiring
```js
const API_BASE_URL = 'https://<project>.vercel.app/api';

fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
```

---

## 11) CORS & Cookies
- Lock CORS to your frontend domain.
- If using cookies: `credentials: 'include'` in fetch **and** CORS `{ credentials: true }`.

---

## 12) Quick Verification
```bash
curl -X GET https://<project>.vercel.app/api/health
```

---

## 13) Troubleshooting
- **404 on `/api/...`** → check `vercel.json`.
- **500 missing env vars** → set them in Vercel.
- **CORS errors** → match origins + credentials.
