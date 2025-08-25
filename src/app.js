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
 * - Add your real deployed frontend domain below
 * - Keep localhost entries for local development as needed
 * - You can also drive this via env var ALLOWED_ORIGINS (comma-separated)
 */
const envAllowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  'https://betting-tracker-jmg0otsr1-tokken10s-projects.vercel.app', // frontend domain
  'http://localhost:5173',            // Vite dev (change/remove if not used)
  'http://localhost:3000',            // Next.js/other local dev
  ...envAllowed,
]);

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no Origin (curl/Postman/server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`CORS: Origin not allowed: ${origin}`), false);
  },
  credentials: true, // keep true if you use cookies or need auth headers in browsers
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With'],
  optionsSuccessStatus: 204,
}));

// Optional: explicit preflight handler (helps some proxies)
app.options('*', cors());

await connectDB();

// Routes (mounted at /api/* by vercel.json)
app.use('/auth', authRouter);
app.use('/bets', auth, betRoutes);
app.use('/users', auth, userRoutes);

// Health
app.get('/health', (_, res) => res.json({ ok: true }));

export default app;