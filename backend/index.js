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
  if (!req.path.startsWith('/api')) {
    return next();
  }
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
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) || origin.includes('onrender.com') || (req.headers.host && origin.includes(req.headers.host))) {
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

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected!');
    try {
      const Job = require('./models/job');
      const count = await Job.countDocuments();
      if (count < 10) {
        console.log('🌱 Seeding mock jobs...');
        await Job.deleteMany({});
        await Job.create([
          {
            company: "Google",
            role: "Senior UX Designer",
            status: "Interview",
            location: "Mountain View, CA",
            salary: "15 - 25 LPA",
            appliedDate: "2023-10-12",
            jobDescription: "Lead UX designs for Google Search and Workspace applications.",
            notes: "Next: Panel Interview (25 Oct)"
          },
          {
            company: "Airbnb",
            role: "Product Manager",
            status: "Applied",
            location: "San Francisco, CA",
            salary: "18 - 28 LPA",
            appliedDate: "2023-10-18",
            jobDescription: "Manage guest checkout and booking platform experience.",
            notes: "Next: Initial Screen (28 Oct)"
          },
          {
            company: "Stripe",
            role: "Lead Developer",
            status: "Offered",
            location: "Remote / India",
            salary: "25 - 35 LPA",
            appliedDate: "2023-10-01",
            jobDescription: "Design scalable API endpoints and billing workflows.",
            notes: "Next: Feedback (Due 26 Oct)"
          },
          {
            company: "Spotify",
            role: "Data Scientist",
            status: "Applied",
            location: "New York, NY",
            salary: "12 - 20 LPA",
            appliedDate: "2023-10-20",
            jobDescription: "Analyze music streaming metrics and recommendation algorithms.",
            notes: ""
          },
          {
            company: "Razorpay",
            role: "MERN Stack Developer",
            status: "Saved",
            location: "Bangalore, India",
            salary: "12 - 18 LPA",
            appliedDate: "2023-10-22",
            jobDescription: "Build merchant portal and checkouts.",
            notes: ""
          },
          {
            company: "Zomato",
            role: "React Developer",
            status: "Interview",
            location: "Gurugram, India",
            salary: "10 - 15 LPA",
            appliedDate: "2023-10-15",
            jobDescription: "Optimize dashboards for partners.",
            notes: "Next: Round 2 Tech (29 Oct)"
          },
          {
            company: "Swiggy",
            role: "Full Stack Developer",
            status: "Saved",
            location: "Bangalore, India",
            salary: "14 - 22 LPA",
            appliedDate: "2023-10-24",
            jobDescription: "Scale checkout and cart services.",
            notes: ""
          },
          {
            company: "Paytm",
            role: "Data Analyst",
            status: "Rejected",
            location: "Noida, India",
            salary: "8 - 12 LPA",
            appliedDate: "2023-09-28",
            jobDescription: "Analyze financial transactions.",
            notes: "Rejected due to lack of experience."
          },
          {
            company: "Flipkart",
            role: "UI Engineer",
            status: "Applied",
            location: "Bangalore, India",
            salary: "12 - 18 LPA",
            appliedDate: "2023-10-14",
            jobDescription: "Develop modular front-end UI libraries.",
            notes: ""
          },
          {
            company: "Zepto",
            role: "Backend Developer",
            status: "Saved",
            location: "Mumbai, India",
            salary: "10 - 16 LPA",
            appliedDate: "2023-10-25",
            jobDescription: "Optimize express APIs and order routes.",
            notes: ""
          },
          {
            company: "TCS",
            role: "Systems Engineer",
            status: "Applied",
            location: "Pune, India",
            salary: "6 - 10 LPA",
            appliedDate: "2023-10-10",
            jobDescription: "Manage software delivery pipelines.",
            notes: ""
          },
          {
            company: "Nykaa",
            role: "Product Designer",
            status: "Interview",
            location: "Gurgaon, India",
            salary: "8 - 12 LPA",
            appliedDate: "2023-10-11",
            jobDescription: "Design checkout flow for mobile apps.",
            notes: "Next: Design Review (27 Oct)"
          },
          {
            company: "Wipro",
            role: "Associate Developer",
            status: "Rejected",
            location: "Bangalore, India",
            salary: "4 - 7 LPA",
            appliedDate: "2023-09-20",
            jobDescription: "Work on legacy Java projects.",
            notes: "Rejected after coding round."
          },
          {
            company: "Infosys",
            role: "Software Engineer",
            status: "Applied",
            location: "Hyderabad, India",
            salary: "5 - 8 LPA",
            appliedDate: "2023-10-09",
            jobDescription: "Implement API endpoints and testing.",
            notes: ""
          },
          {
            company: "CRED",
            role: "Senior Frontend Engineer",
            status: "Offered",
            location: "Bangalore, India",
            salary: "24 - 32 LPA",
            appliedDate: "2023-10-05",
            jobDescription: "Build mobile web views and animations.",
            notes: "Offer letter signed."
          }
        ]);
        console.log('✅ Seeding complete!');
      }
    } catch (seedErr) {
      console.warn('⚠️ Seeding failed:', seedErr.message);
    }
  })
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

const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
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