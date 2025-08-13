import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './routes/auth.js';
import betRoutes from './routes/bets.js';
import userRoutes from './routes/users.js';

import auth from './middleware/auth.js';
import connectDB from './db.js';

const app = express();

/* --------------------------- C O R S  S E T U P --------------------------- */
/**
 * Exact origins only (no trailing slashes). You can extend via ALLOWED_ORIGINS
 * env var (comma-separated).
 */
const envAllowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// ✅ Make sure your live frontend is EXACT here:
const allowedOriginsArr = [
  'https://betting-tracker-nine.vercel.app', // production frontend
  'http://localhost:3000',                   // local dev (adjust/remove)
  'http://localhost:5173',                   // local dev (Vite, if used)
  ...envAllowed,
];
const allowedOrigins = new Set(allowedOriginsArr);

// Helpful for caches/CDNs to send correct ACAO per-origin
app.use((_, res, next) => {
  res.setHeader('Vary', 'Origin');
  next();
});

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (curl/Postman/server-to-server) with no Origin
    if (!origin) {
      if (process.env.DEBUG_CORS === '1') console.log('[CORS] no Origin → allow');
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      if (process.env.DEBUG_CORS === '1') console.log(`[CORS] allow ${origin}`);
      return callback(null, true);
    }

    // Do NOT throw; returning false blocks cleanly (no 500).
    if (process.env.DEBUG_CORS === '1') console.log(`[CORS] BLOCK ${origin}`);
    return callback(null, false);
  },
  credentials: true, // set to false if you do NOT use browser cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'content-type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
  preflightContinue: false, // let cors terminate OPTIONS
  maxAge: 86400, // cache preflights 1 day
};

// Apply CORS for all routes + explicit preflights
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/**
 * Short-circuit OPTIONS early so nothing else (like DB) runs for preflights.
 * This also guarantees no 500 on OPTIONS.
 */
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/* ----------------------- P A R S I N G  &  C O O K I E S ------------------ */
app.use(express.json());
app.use(cookieParser());

/* -------------------------- H E A L T H  (no DB) -------------------------- */
// Works even if Mongo is misconfigured — handy for CORS/preflight tests
app.get('/health', (_, res) => res.json({ ok: true }));

/* --------------------------- D A T A B A S E  C O N N --------------------- */
// Ensure required environment variables are present before connecting
const missingEnv = [];
if (!process.env.MONGO_URI) missingEnv.push('MONGO_URI');
if (!process.env.JWT_SECRET) missingEnv.push('JWT_SECRET');

if (missingEnv.length) {
  const msg = `Missing required environment variables: ${missingEnv.join(', ')}`;
  console.error(msg);
  // Return a 500 response for all routes if misconfigured
  app.use((_, res) => res.status(500).json({ error: 'Server misconfiguration' }));
} else {
  try {
    // connectDB() should cache connections internally for serverless re-use
    await connectDB();

    /* -------------------------------- R O U T E S ------------------------------ */
    // Mounted under /api/* by vercel.json
    app.use('/auth', authRouter);
    app.use('/bets', auth, betRoutes);
    app.use('/users', auth, userRoutes);
  } catch (err) {
    console.error('Failed to connect to database', err);
    app.use((_, res) =>
      res.status(500).json({ error: 'Database connection failed' })
    );
  }
}

export default app;
