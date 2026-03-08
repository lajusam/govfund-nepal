const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const Feedback = require('../models/Feedback');

// ── Per-route rate limiters ──────────────────────────────────────────────────
// Strict limiter for writes — prevents spam/flood attacks on the open endpoint
const feedbackWriteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,                  // 10 feedback posts per IP per hour
    message: { error: 'Too many feedback submissions. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Read limiter — generous but prevents scraping
const feedbackReadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Input sanitisation helper ────────────────────────────────────────────────
function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    // Strip MongoDB operators ($) and trim
    return str.replace(/[\${}]/g, '').trim();
}

// GET feedback for a project
router.get('/:projectId', feedbackReadLimiter, async (req, res) => {
    try {
        const feedback = await Feedback.find({ projectId: req.params.projectId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(feedback);
    } catch (err) {
        console.error('[feedback] Error:', err.message);
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
});

// POST new feedback — rate-limited + sanitized
router.post('/', feedbackWriteLimiter, async (req, res) => {
    try {
        const { projectId, walletAddress, rating, comment } = req.body;
        if (!projectId || !rating || !comment) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Type-check rating to block NaN / non-number payloads
        const numRating = Number(rating);
        if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
            return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
        }

        // Sanitize all string inputs to prevent NoSQL injection
        const cleanProjectId = sanitizeString(projectId);
        const cleanComment = sanitizeString(comment);
        const cleanWallet = sanitizeString(walletAddress || 'anonymous');

        if (!cleanProjectId) {
            return res.status(400).json({ error: 'Invalid projectId' });
        }
        if (cleanComment.length > 500) {
            return res.status(400).json({ error: 'Comment too long (max 500 chars)' });
        }
        if (cleanComment.length < 2) {
            return res.status(400).json({ error: 'Comment too short (min 2 chars)' });
        }

        const feedback = new Feedback({
            projectId: cleanProjectId,
            walletAddress: cleanWallet,
            rating: numRating,
            comment: cleanComment,
        });

        await feedback.save();
        res.status(201).json(feedback);
    } catch (err) {
        console.error('[Feedback] Error:', err.message);
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
});

module.exports = router;
