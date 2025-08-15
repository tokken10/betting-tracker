const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const exactOrigins = [
  ...envOrigins,
  process.env.FRONTEND_URL,       // e.g. https://betting-tracker-nine.vercel.app
  process.env.FRONTEND_URL_ALT,   // e.g. https://your-custom-domain.com
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

// Allow preview URLs of the frontend project on Vercel
const previewRegexes = [
  /^https?:\/\/betting-tracker-nine(-[a-z0-9-]+)?\.vercel\.app$/i
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
  console.log('Host:', req.headers.host, 'Origin:', req.headers.origin);
  next();
});

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Example route
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Routes
const betRoutes = require('./routes/bets');
const userRoutes = require('./routes/users');
const seedRoutes = require('./routes/seed');
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bets', auth, betRoutes);
app.use('/api/users', auth, userRoutes);
app.use('/api/seed', auth, seedRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
