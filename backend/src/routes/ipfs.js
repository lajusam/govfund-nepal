const express = require('express');
const multer = require('multer');
const router = express.Router();
const { verifyAdmin } = require('../middleware/auth');
const {
    uploadToIPFS,
    validateFile,
    verifyHashOnGateways,
    resolveGatewayUrl,
    testPinataAuth,
    isValidCID,
    isPinataConfigured,
    GATEWAYS,
    MAX_FILE_SIZE,
} = require('../services/ipfs');

// ── Multer config — in-memory storage, 50 MB limit ──────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/ipfs/upload
//
// Upload a file to IPFS via Pinata. Returns the pinned CID + verified gateway URL.
// Protected — requires admin wallet auth headers.
//
// Body: multipart/form-data
//   - file      (required)  — the file to upload
//   - projectId (optional)  — tag the pin with the project ID
//
// Response 200:
//   { ipfsHash, gatewayUrl, size, verifiedGateway, fileName }
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/upload', verifyAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided', code: 'NO_FILE' });
        }

        const { originalname, buffer, mimetype } = req.file;
        const projectId = req.body.projectId || '';

        // Validate on the server side too (defense in depth)
        const validation = validateFile(buffer, originalname, mimetype);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error, code: 'VALIDATION_FAILED' });
        }

        console.log(`[IPFS Route] Uploading: ${originalname} (${(buffer.length / 1024).toFixed(1)} KB) for project: ${projectId || '(none)'}`);

        const result = await uploadToIPFS(buffer, originalname, {
            mimeType: mimetype,
            metadata: projectId ? { projectId } : {},
            verifyGateway: true,
        });

        res.json({
            ipfsHash: result.ipfsHash,
            gatewayUrl: result.gatewayUrl,
            size: result.size,
            verifiedGateway: result.verifiedGateway,
            fileName: originalname,
        });
    } catch (err) {
        console.error('[IPFS Route] Upload error:', err.message);
        const status = err.code === 'AUTH_FAILED' ? 401
            : err.code === 'PINATA_NOT_CONFIGURED' ? 503
            : err.code === 'VALIDATION_FAILED' ? 400
            : 500;
        res.status(status).json({ error: err.message, code: err.code || 'UPLOAD_ERROR' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/ipfs/verify
//
// Verify an existing IPFS hash is accessible via public gateways.
// Body: { ipfsHash }
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/verify', async (req, res) => {
    try {
        const { ipfsHash } = req.body;
        if (!ipfsHash) {
            return res.status(400).json({ error: 'ipfsHash is required' });
        }
        if (!isValidCID(ipfsHash)) {
            return res.status(400).json({ error: 'Invalid IPFS CID format', code: 'INVALID_CID' });
        }

        const verifiedUrl = await verifyHashOnGateways(ipfsHash, { maxAttempts: 2, timeoutMs: 8000 });
        res.json({
            ipfsHash,
            accessible: !!verifiedUrl,
            gatewayUrl: verifiedUrl || `${GATEWAYS[0]}${ipfsHash}`,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/ipfs/resolve/:hash
//
// Resolve the fastest accessible gateway URL for a hash.
// Useful for the frontend to display/download documents.
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/resolve/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        if (!isValidCID(hash)) {
            return res.status(400).json({ error: 'Invalid IPFS CID format' });
        }
        const url = await resolveGatewayUrl(hash);
        res.json({ ipfsHash: hash, gatewayUrl: url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/ipfs/status
//
// Check IPFS (Pinata) configuration health.
// ═══════════════════════════════════════════════════════════════════════════════
router.get('/status', async (req, res) => {
    const configured = isPinataConfigured();
    if (!configured) {
        return res.json({
            configured: false,
            authenticated: false,
            message: 'Pinata API keys not set. Set PINATA_API_KEY + PINATA_SECRET_KEY in backend/.env',
            gateways: GATEWAYS,
        });
    }

    const auth = await testPinataAuth();
    res.json({
        configured: true,
        authenticated: auth.ok,
        message: auth.message,
        gateways: GATEWAYS,
    });
});

module.exports = router;
