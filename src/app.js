import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './routes/auth.js';
import betRoutes from './routes/bets.js';
import userRoutes from './routes/users.js';

import auth from './middleware/auth.js';
import connectDB from './db.js';

const app = express();

/**
 * ---- CORS (place FIRST) ----
 * - Exact origins (no trailing slash)
 * - Never throw on disallowed origins (return false instead)
 * - Shared options for requests and preflights
 */
const envAllowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = [
  'https://betting-tracker-nine.vercel.app', // production frontend
  'http://localhost:3000',                   // local dev (adjust/remove as needed)
  'http://localhost:5173',                   // local dev (Vite default; adjust if needed)
  ...envAllowed,
];

// vary by origin so caches don’t mix responses
app.use((_, res, next) => {
  res.setHeader('Vary', 'Origin');
  next();
});

const corsOptions = {
  origin(origin, callback) {
    // allow non-browser clients (curl/Postman/server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // block without throwing (prevents 500 on OPTIONS)
    return callback(null, false);
  },
  credentials: true, // set to false if you don't use browser cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'content-type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
  preflightContinue: false, // let cors handle and end the preflight
  maxAge: 86400, // cache preflights 1 day (optional)
};

// Apply CORS to all routes + preflights
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // explicit preflight handler

// Safety: if anything still handles OPTIONS later, short-circuit it
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/**
 * ---- Body & cookies ----
 * Keep these AFTER CORS so preflights don't touch parsers.
 */
app.use(express.json());
app.use(cookieParser());

/**
 * ---- DB ----
 * Connect once (cached inside connectDB for serverless)
 */
await connectDB();

/**
 * ---- Routes (mounted under /api/* by vercel.json) ----
 */
app.use('/auth', authRouter);
app.use('/bets', auth, betRoutes);
app.use('/users', auth, userRoutes);

// Health
app.get('/health', (_, res) => res.json({ ok: true }));

export default app;