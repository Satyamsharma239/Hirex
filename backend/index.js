const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ─── Security & Logging ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(morgan('dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/', apiLimiter);


// ─── CORS ────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path === '/api/jobs/external') {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    return next();
  }
  
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })(req, res, next);
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── MongoDB ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch((err) => console.log('❌ MongoDB Error:', err.message));

// ─── Routes ──────────────────────────────────────────────────────────────────
const jobRoutes      = require('./routes/jobs');
const aiRoutes       = require('./routes/ai');
const discoverRoutes = require('./routes/discover');
const featureRoutes  = require('./routes/features');

app.use('/api/jobs',     jobRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/profile',  require('./routes/profile'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'HireX AI Backend is Alive! 🚀',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});