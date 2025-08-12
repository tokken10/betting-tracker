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

const allowed = [
  'https://your-frontend.vercel.app'
];
app.use(cors({ origin: allowed, credentials: true }));

await connectDB();

app.use('/auth', authRouter);
app.use('/bets', auth, betRoutes);
app.use('/users', auth, userRoutes);

app.get('/health', (_, res) => res.json({ ok: true }));

export default app;
