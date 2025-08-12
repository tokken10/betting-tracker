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
 * - You can override via ALLOWED_ORIGINS (comma-separated).
 */
const envAllowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  'https://betting-tracker-nine.vercel.app', // ✅ no trailing slash
  'http://localhost:3000',                   // dev (adjust/remove if unused)
  'http://localhost:5173',                   // dev (Vite default; adjust if needed)
  ...envAllowed,
]);

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser requests (no Origin): curl/Postman/server-to-server
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin not allowed: ${origin}`), false);
  },
  credentials: true, // keep true only if you use cookies in the browser
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  optionsSuccessStatus: 204,
}));

// Preflight for all routes (helps proxies/CDNs)
app.options('*', cors());

await connectDB();

// Routes (mounted at /api/* via vercel.json)
app.use('/auth', authRouter);
app.use('/bets', auth, betRoutes);
app.use('/users', auth, userRoutes);

// Health
app.get('/health', (_, res) => res.json({ ok: true }));

export default app;