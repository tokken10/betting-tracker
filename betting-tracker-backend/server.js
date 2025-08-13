const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
);

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Example route
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Routes
const betRoutes = require('./routes/bets');
const userRoutes = require('./routes/users');
app.use('/api/auth', require('./routes/auth'));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.has(origin)) {
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    return res.sendStatus(403);
  }
  next();
});

app.use('/api/bets', auth, betRoutes);
app.use('/api/users', auth, userRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
