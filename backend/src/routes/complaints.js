const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const bs58 = require('bs58');
const nacl = require('tweetnacl');
const Complaint = require('../models/Complaint');
const Project = require('../models/Project');

// ── Rate limiters ────────────────────────────────────────────────────────────
const writeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { error: 'Too many complaint submissions. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[\${}]/g, '').trim();
}

function verifyWalletSignature(req, res, next) {
    const walletAddress = req.headers['x-wallet-address'];
    const signature = req.headers['x-wallet-signature'];
    const message = req.headers['x-wallet-message'];

    if (!walletAddress) {
        return res.status(401).json({ error: 'Wallet address required' });
    }
    if (!signature || !message) {
        return res.status(401).json({ error: 'Wallet signature and message are required' });
    }

    try {
        const messageBytes = new TextEncoder().encode(message);
        const signatureBytes = bs58.decode(signature);
        const publicKeyBytes = bs58.decode(walletAddress);
        const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
        if (!verified) {
            return res.status(403).json({ error: 'Invalid wallet signature' });
        }
    } catch (err) {
        return res.status(403).json({ error: 'Signature verification failed' });
    }

    req.walletAddress = walletAddress;
    next();
}

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/complaints/create
// ═════════════════════════════════════════════════════════════════════════════
router.post('/create', writeLimiter, verifyWalletSignature, async (req, res) => {
    try {
        const { projectId, title, description, evidence } = req.body;

        if (!projectId || !title || !description) {
            return res.status(400).json({ error: 'projectId, title, and description are required' });
        }

        const cleanProjectId = sanitize(projectId);
        const cleanTitle = sanitize(title);
        const cleanDescription = sanitize(description);

        if (cleanTitle.length < 5 || cleanTitle.length > 200) {
            return res.status(400).json({ error: 'Title must be between 5 and 200 characters' });
        }
        if (cleanDescription.length < 10 || cleanDescription.length > 5000) {
            return res.status(400).json({ error: 'Description must be between 10 and 5000 characters' });
        }

        // Verify project exists
        const project = await Project.findOne({ projectId: cleanProjectId });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Validate evidence array
        let cleanEvidence = [];
        if (Array.isArray(evidence)) {
            cleanEvidence = evidence
                .filter(e => e && typeof e.cid === 'string' && e.cid.length > 0)
                .slice(0, 10) // max 10 evidence items
                .map(e => ({
                    cid: sanitize(e.cid),
                    name: sanitize(e.name || 'Untitled'),
                    type: sanitize(e.type || 'document'),
                }));
        }

        const complaint = new Complaint({
            projectId: cleanProjectId,
            province: project.province || '',
            district: project.district || '',
            walletAddress: req.walletAddress,
            title: cleanTitle,
            description: cleanDescription,
            evidence: cleanEvidence,
        });

        await complaint.save();
        res.status(201).json(complaint);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'You have already submitted a complaint for this project' });
        }
        console.error('[complaints] Create error:', err.message);
        res.status(500).json({ error: 'Failed to create complaint' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
// PUT /api/complaints/edit/:id
// ═════════════════════════════════════════════════════════════════════════════
router.put('/edit/:id', writeLimiter, verifyWalletSignature, async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        // Only the creator can edit
        if (complaint.walletAddress !== req.walletAddress) {
            return res.status(403).json({ error: 'Only the complaint creator can edit' });
        }

        const { title, description, evidence } = req.body;

        if (title) {
            const cleanTitle = sanitize(title);
            if (cleanTitle.length < 5 || cleanTitle.length > 200) {
                return res.status(400).json({ error: 'Title must be between 5 and 200 characters' });
            }
            complaint.title = cleanTitle;
        }

        if (description) {
            const cleanDescription = sanitize(description);
            if (cleanDescription.length < 10 || cleanDescription.length > 5000) {
                return res.status(400).json({ error: 'Description must be between 10 and 5000 characters' });
            }
            complaint.description = cleanDescription;
        }

        if (Array.isArray(evidence)) {
            complaint.evidence = evidence
                .filter(e => e && typeof e.cid === 'string' && e.cid.length > 0)
                .slice(0, 10)
                .map(e => ({
                    cid: sanitize(e.cid),
                    name: sanitize(e.name || 'Untitled'),
                    type: sanitize(e.type || 'document'),
                }));
        }

        await complaint.save();
        res.json(complaint);
    } catch (err) {
        console.error('[complaints] Edit error:', err.message);
        res.status(500).json({ error: 'Failed to update complaint' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/complaints/project/:projectId
// ═════════════════════════════════════════════════════════════════════════════
router.get('/project/:projectId', readLimiter, async (req, res) => {
    try {
        const projectId = sanitize(req.params.projectId);
        const complaints = await Complaint.find({ projectId })
            .sort({ 'reactions.support': -1, createdAt: -1 })
            .limit(100);

        // Compute score and sort by popularity
        const withScore = complaints.map(c => {
            const obj = c.toObject();
            obj.score = (obj.reactions?.support || 0) - (obj.reactions?.disagree || 0);
            return obj;
        });
        withScore.sort((a, b) => b.score - a.score);

        res.json(withScore);
    } catch (err) {
        console.error('[complaints] Fetch error:', err.message);
        res.status(500).json({ error: 'Failed to fetch complaints' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/complaints/react
// ═════════════════════════════════════════════════════════════════════════════
router.post('/react', writeLimiter, verifyWalletSignature, async (req, res) => {
    try {
        const { complaintId, reaction } = req.body;

        if (!complaintId || !reaction) {
            return res.status(400).json({ error: 'complaintId and reaction are required' });
        }

        const validReactions = ['support', 'disagree', 'investigation'];
        if (!validReactions.includes(reaction)) {
            return res.status(400).json({ error: `reaction must be one of: ${validReactions.join(', ')}` });
        }

        const complaint = await Complaint.findById(complaintId);
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }

        // Check if wallet already voted
        const existingVoteIndex = complaint.voters.findIndex(
            v => v.walletAddress === req.walletAddress
        );

        if (existingVoteIndex !== -1) {
            const existingReaction = complaint.voters[existingVoteIndex].reaction;

            // Same reaction = remove vote (toggle off)
            if (existingReaction === reaction) {
                complaint.reactions[existingReaction] = Math.max(0, complaint.reactions[existingReaction] - 1);
                complaint.voters.splice(existingVoteIndex, 1);
            } else {
                // Different reaction = switch vote
                complaint.reactions[existingReaction] = Math.max(0, complaint.reactions[existingReaction] - 1);
                complaint.reactions[reaction] = (complaint.reactions[reaction] || 0) + 1;
                complaint.voters[existingVoteIndex].reaction = reaction;
            }
        } else {
            // New vote
            complaint.reactions[reaction] = (complaint.reactions[reaction] || 0) + 1;
            complaint.voters.push({ walletAddress: req.walletAddress, reaction });
        }

        await complaint.save();

        const obj = complaint.toObject();
        obj.score = (obj.reactions?.support || 0) - (obj.reactions?.disagree || 0);
        res.json(obj);
    } catch (err) {
        console.error('[complaints] React error:', err.message);
        res.status(500).json({ error: 'Failed to submit reaction' });
    }
});

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/complaints/top
// ═════════════════════════════════════════════════════════════════════════════
router.get('/top', readLimiter, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const complaints = await Complaint.find()
            .sort({ 'reactions.support': -1, createdAt: -1 })
            .limit(limit);

        const withScore = complaints.map(c => {
            const obj = c.toObject();
            obj.score = (obj.reactions?.support || 0) - (obj.reactions?.disagree || 0);
            return obj;
        });
        withScore.sort((a, b) => b.score - a.score);

        res.json(withScore);
    } catch (err) {
        console.error('[complaints] Top error:', err.message);
        res.status(500).json({ error: 'Failed to fetch top complaints' });
    }
});

module.exports = router;
