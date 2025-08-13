import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './routes/auth.js';
import betRoutes from './routes/bets.js';
import userRoutes from './routes/users.js';

import auth from './middleware/auth.js';
import connectDB from './db.js';

const app = express();

// Parse JSON and cookies early
app.use(express.json());
app.use(cookieParser());

// Build allowlist from env and common local domains
const envAllowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  'https://betting-tracker-nine.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  ...envAllowed,
]);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin not allowed: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
};

// Apply CORS globally and handle preflight
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

await connectDB();

// Routes (function mounted under /api/* on Vercel)
app.use('/auth', authRouter);
app.use('/bets', auth, betRoutes);
app.use('/users', auth, userRoutes);

// Health check for readiness probes
app.get('/health', (_, res) => res.json({ ok: true }));

export default app;