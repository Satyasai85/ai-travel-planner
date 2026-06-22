require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');

const app = express();

/* ----------------------------- Core middleware ---------------------------- */

// Allow only the configured client origin in production; fall back to permissive in dev.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server).
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

// Global, lightweight rate limiting to protect the API from abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please slow down and try again shortly.' },
});
app.use('/api', apiLimiter);

/* -------------------------------- Routes ---------------------------------- */

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'AI Travel Planner API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);

/* --------------------------- Error handling -------------------------------- */

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler — guarantees a clean JSON response, never a stack trace.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? 'Internal server error' : err.message,
  });
});

/* -------------------------------- Bootstrap -------------------------------- */

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 AI Travel Planner API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });

module.exports = app;
