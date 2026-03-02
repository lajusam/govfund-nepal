/**
 * api/server.js — Single Vercel serverless function that handles ALL /api/* routes.
 *
 * Why one file?
 *   Vercel Hobby plan allows at most 12 serverless functions.
 *   Every .js file under api/ counts as one function. By exporting
 *   a full Express app from a single file we stay well within the limit.
 *
 * How routing still works:
 *   vercel.json rewrites every /api request to this function, but Vercel
 *   preserves the original req.url (e.g. /api/projects) so Express can
 *   match routes exactly as it does locally.
 *
 * MongoDB connection caching:
 *   Serverless runtimes are stateless but the Node.js process stays "warm"
 *   for a short window between invocations. Storing the Mongoose connection
 *   on `global` lets warm calls reuse the existing TCP connection instead of
 *   opening a new one each time (would exhaust Atlas free-tier pool quickly).
 */

'use strict';

const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const mongoose   = require('mongoose');

// ── Route handlers (re-used from the existing backend) ─────────────────────
const projectRoutes  = require('../backend/src/routes/projects');
const provinceRoutes = require('../backend/src/routes/provinces');
const analyticsRoutes= require('../backend/src/routes/analytics');
const adminRoutes    = require('../backend/src/routes/admin');
const feedbackRoutes = require('../backend/src/routes/feedback');
const ipfsRoutes     = require('../backend/src/routes/ipfs');
const Project        = require('../backend/src/models/Project');

// ── MongoDB connection cache ────────────────────────────────────────────────
let cachedConnection = global._mongooseConnection || null;

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI environment variable is not set');

  const conn = await mongoose.connect(uri, {
    bufferCommands:            false,
    maxPoolSize:               10,
    serverSelectionTimeoutMS:  5000,
    socketTimeoutMS:           45000,
  });

  cachedConnection = global._mongooseConnection = conn;
  return conn;
}

// ── Express app ─────────────────────────────────────────────────────────────
const app = express();

// CORS — allow the deployed frontend and local dev
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, same-origin Vercel calls)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true); // open during development — tighten for production
  },
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'x-wallet-address',
    'x-wallet-signature',
    'x-wallet-message',
  ],
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting — generous for Vercel edge (per function instance)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  message:  { error: 'Too many requests, please try again later.' },
}));

// ── Middleware: ensure MongoDB is connected before every request ────────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    res.status(503).json({ error: 'Database unavailable', message: err.message });
  }
});

// ── Routes ───────────────────────────────────────────────────────────────────

// Root info
app.get('/api', (req, res) => {
  res.json({
    message: 'GovFund Nepal API is running!',
    routes: [
      '/api/projects',
      '/api/provinces',
      '/api/analytics',
      '/api/admin/config',
      '/api/feedback',
      '/api/health',
      '/api/ipfs',
      '/api/demo-projects',
    ],
  });
});

// Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Demo projects (all seeded MongoDB projects)
app.get('/api/demo-projects', async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects', message: err.message });
  }
});

// Feature routes
app.use('/api/projects',  projectRoutes);
app.use('/api/provinces', provinceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/feedback',  feedbackRoutes);
app.use('/api/ipfs',      ipfsRoutes);

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Export for Vercel (no app.listen!) ──────────────────────────────────────
// Vercel calls this function directly with (req, res) — same signature as
// express's request handler. Never call app.listen() in a serverless context;
// the platform manages the HTTP server lifecycle.
module.exports = app;
