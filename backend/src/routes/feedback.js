const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

// GET feedback for a project
router.get('/:projectId', async (req, res) => {
    try {
        const feedback = await Feedback.find({ projectId: req.params.projectId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(feedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new feedback
router.post('/', async (req, res) => {
    try {
        const { projectId, walletAddress, rating, comment } = req.body;
        if (!projectId || !rating || !comment) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        if (comment.length > 500) {
            return res.status(400).json({ error: 'Comment too long (max 500 chars)' });
        }

        const feedback = new Feedback({
            projectId,
            walletAddress: walletAddress || 'anonymous',
            rating,
            comment,
        });

        await feedback.save();
        res.status(201).json(feedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
