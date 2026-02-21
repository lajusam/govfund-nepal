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

// Import your Project model for demo-projects route
const Project = require('./models/Project'); // make sure this path is correct

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
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
            '/api/health',
            '/api/demo-projects'
        ]
    });
});

// Demo projects route to fetch seeded projects
app.get('/api/demo-projects', async (req, res) => {
    try {
        const projects = await Project.find(); // fetch all seeded projects
        res.json(projects);
    } catch (err) {
        console.error('Error fetching demo projects:', err);
        res.status(500).json({ error: 'Failed to fetch projects', message: err.message });
    }
});

// === Other project routes ===
app.use('/api/projects', projectRoutes);
app.use('/api/provinces', provinceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
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
            console.log(`   Demo projects: http://localhost:${PORT}/api/demo-projects`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection failed:', err.message);
        console.error('   Check your MONGO_URI in .env and ensure your Atlas IP whitelist includes your IP.');
        process.exit(1);
    });

module.exports = app;
