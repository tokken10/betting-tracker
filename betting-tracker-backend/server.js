const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',  // Local development
  'http://localhost:5000',  // Local backend
  'https://your-vercel-app.vercel.app'  // Your Vercel frontend URL
];

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bets', auth, betRoutes);
app.use('/api/users', auth, userRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
