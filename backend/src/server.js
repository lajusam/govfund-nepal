require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const projectRoutes = require('./routes/projects');
const provinceRoutes = require('./routes/provinces');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const feedbackRoutes = require('./routes/feedback');
const ipfsRoutes = require('./routes/ipfs');
const complaintRoutes = require('./routes/complaints');
const budgetRoutes = require('./routes/budget');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    allowedHeaders: [
        'Content-Type',
        'x-wallet-address',
        'x-wallet-signature',
        'x-wallet-message',
    ],
}));

app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,                  // Reduced from 200 — stricter global limit
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// === Test / API routes ===

// Root API route to test server
app.get('/api', (req, res) => {
    res.json({
        message: 'Backend is running!',
        routes: [
            '/api/projects',
            '/api/provinces',
            '/api/analytics',
            '/api/admin',
            '/api/feedback',
            '/api/ipfs',
            '/api/complaints',
            '/api/budget',
            '/api/auth',
            '/api/health',
        ]
    });
});

// === Other project routes ===
app.use('/api/projects', projectRoutes);
app.use('/api/provinces', provinceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/ipfs', ipfsRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Connect to MongoDB Atlas and start server
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env file!');
    console.error('   Please set MONGO_URI in backend/.env');
    console.error('   Example: MONGO_URI=mongodb+srv://user:pass@cluster0.mongodb.net/govfund');
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`   Test API: http://localhost:${PORT}/api`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection failed:', err.message);
        console.error('   Check your MONGO_URI in .env and ensure your Atlas IP whitelist includes your IP.');
        process.exit(1);
    });

module.exports = app;
