import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './routes/auth.js';
import betRoutes from './routes/bets.js';
import userRoutes from './routes/users.js';

import auth from './middleware/auth.js';
import connectDB from './db.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

/**
 * CORS allow‑list
 * - Must match origins EXACTLY (no trailing slash).
 * - Add/remove localhost ports you actually use for dev.
 * - You can override via ALLOWED_ORIGINS (comma‑separated).
 */
const envAllowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  'https://betting-tracker-nine.vercel.app', // production frontend
  'http://localhost:3000',                   // local dev (adjust/remove as needed)
  'http://localhost:5173',                   // local dev (Vite default; adjust if needed)
  ...envAllowed,
]);

// One options object used for both normal requests and preflights
const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (no Origin): curl/Postman/server-to-server
    if (!origin) return callback(null, true);

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    // Do NOT throw; returning false blocks without causing a 500
    return callback(null, false);
  },
  credentials: true, // set to false if you don't use cookies from the browser
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'content-type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
  maxAge: 86400, // cache preflights for 1 day
};

// Ensure caches vary by Origin so ACAO is correct per-origin
app.use((_, res, next) => {
  res.setHeader('Vary', 'Origin');
  next();
});

app.use(cors(corsOptions));
// Make sure preflights use the exact same options
app.options('*', cors(corsOptions));
// Safety: short-circuit any stray OPTIONS that slip past
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

await connectDB();

// Routes (mounted under /api/* by vercel.json)
app.use('/auth', authRouter);
app.use('/bets', auth, betRoutes);
app.use('/users', auth, userRoutes);

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

export default app;