const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const auth = require('./middleware/auth');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const exactOrigins = [
  ...envOrigins,
  process.env.FRONTEND_URL?.replace(/\/$/, ''),       // e.g. https://betting-tracker.vercel.app
  process.env.FRONTEND_URL_ALT?.replace(/\/$/, ''),   // e.g. https://your-custom-domain.com
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

// Allow preview URLs of the frontend project on Vercel
const previewRegexes = [
  /^https?:\/\/betting-tracker(-[a-z0-9-]+)?\.vercel\.app$/i,
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // Same-origin or server-to-server
    const allowed =
      exactOrigins.includes(origin) ||
      previewRegexes.some((re) => re.test(origin));

    if (allowed) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Debug logging
app.use((req, res, next) => {
  logger.debug('Host:', req.headers.host, 'Origin:', req.headers.origin);
  next();
});

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => logger.info('MongoDB connected'))
.catch((err) => logger.error('MongoDB connection error:', err));

// Example route
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Routes
const betRoutes = require('./routes/bets');
const userRoutes = require('./routes/users');
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bets', auth, betRoutes);
app.use('/api/users', auth, userRoutes);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
