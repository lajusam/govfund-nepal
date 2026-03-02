const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════════
// IPFS Service — Production-ready pinning, gateway verification & fallback
//
//  Problem solved:
//    "The request timed out searching for a file on the non-pinata IPFS network.
//     — ERR_ID:00016"
//
//  Root cause:
//    1. Files were uploaded to Pinata but never *verified* accessible via gateway.
//    2. When Pinata keys were missing → fake placeholder hash → gateway 404.
//    3. No fallback gateways → single point of failure on Pinata gateway.
//    4. No retry logic → transient IPFS propagation delays caused timeouts.
//
//  Fix architecture:
//    ┌──────────┐   pin    ┌──────────┐   verify   ┌──────────────┐
//    │  Upload  │ ───────► │  Pinata  │ ─────────► │ Gateway HEAD │
//    │  Buffer  │          │  Cluster │            │  (3 retries) │
//    └──────────┘          └──────────┘            └──────┬───────┘
//                                                         │ fail?
//                                                   ┌─────▼─────┐
//                                                   │ Fallback  │
//                                                   │ Gateways  │
//                                                   └───────────┘
// ═══════════════════════════════════════════════════════════════════════════════

// ── Constants ─────────────────────────────────────────────────────────────────

const PINATA_PIN_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_TEST_URL = 'https://api.pinata.cloud/data/testAuthentication';

// Max file size: 50 MB (Pinata free tier is 100 MB, but be conservative)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed MIME types for government document uploads
const ALLOWED_MIME_TYPES = new Set([
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Video
    'video/mp4',
    'video/webm',
    'video/quicktime',
    // Archives
    'application/zip',
    // Text
    'text/plain',
    'text/csv',
    'application/json',
]);

// Public IPFS gateways — ordered by reliability.
// The dedicated gateway is tried first, public gateways are fallbacks.
const GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
    'https://w3s.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPinataKeys() {
    const apiKey = (process.env.PINATA_API_KEY || '').trim();
    const secretKey = (process.env.PINATA_SECRET_KEY || '').trim();
    const jwt = (process.env.PINATA_JWT || '').trim();

    if (jwt && jwt !== 'your_pinata_jwt') return { jwt };
    if (apiKey && secretKey && apiKey !== 'your_pinata_api_key') return { apiKey, secretKey };
    return null;
}

function isPinataConfigured() {
    return getPinataKeys() !== null;
}

/**
 * Validate a CID looks like a real IPFS hash (CIDv0 or CIDv1).
 *   CIDv0: Qm…  (46 chars, base58btc)
 *   CIDv1: baf… (59+ chars, base32) — includes bafy, bafk, bafkrei, bafybei, etc.
 */
function isValidCID(hash) {
    if (!hash || typeof hash !== 'string') return false;
    // CIDv0: Qm + 44 base58 chars = 46 total
    if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash)) return true;
    // CIDv1: starts with 'b' and is base32 encoded (at least 50 chars)
    if (/^b[a-z2-7]{49,}$/.test(hash)) return true;
    return false;
}

/**
 * Infer MIME type from file extension when the client doesn't send one.
 */
function inferMimeType(filename) {
    if (!filename) return 'application/octet-stream';
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
        pdf: 'application/pdf', doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
        gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
        mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
        zip: 'application/zip', txt: 'text/plain', csv: 'text/csv',
        json: 'application/json',
    };
    return map[ext] || 'application/octet-stream';
}

/**
 * Sleep for ms milliseconds.
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ══════════════════════════════════════════════════════════════════════════
// Core Functions
// ══════════════════════════════════════════════════════════════════════════

/**
 * Validate file before upload.
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @param {string} [mimeType]
 * @returns {{ valid: boolean, error?: string, mimeType: string }}
 */
function validateFile(fileBuffer, fileName, mimeType) {
    if (!fileBuffer || fileBuffer.length === 0) {
        return { valid: false, error: 'File is empty' };
    }
    if (fileBuffer.length > MAX_FILE_SIZE) {
        return { valid: false, error: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB limit` };
    }
    const resolved = mimeType || inferMimeType(fileName);
    if (!ALLOWED_MIME_TYPES.has(resolved) && resolved !== 'application/octet-stream') {
        return { valid: false, error: `File type "${resolved}" is not allowed` };
    }
    return { valid: true, mimeType: resolved };
}

/**
 * Upload a file buffer to IPFS via Pinata with retry.
 *
 * @param {Buffer}  fileBuffer - Raw file bytes
 * @param {string}  fileName   - Original file name
 * @param {object}  [options]
 * @param {string}  [options.mimeType]      - MIME type (auto-detected if omitted)
 * @param {object}  [options.metadata]      - Extra pinataMetadata.keyvalues
 * @param {number}  [options.maxRetries=3]  - Upload attempts
 * @param {boolean} [options.verifyGateway=true] - HEAD-check to verify accessibility
 * @returns {Promise<{ ipfsHash: string, gatewayUrl: string, size: number, verifiedGateway: string|null }>}
 */
async function uploadToIPFS(fileBuffer, fileName, options = {}) {
    const { mimeType, metadata, maxRetries = 3, verifyGateway = true } = options;

    // 1. Validate file
    const validation = validateFile(fileBuffer, fileName, mimeType);
    if (!validation.valid) {
        throw new IPFSError(validation.error, 'VALIDATION_FAILED');
    }

    // 2. Check Pinata credentials
    const keys = getPinataKeys();
    if (!keys) {
        throw new IPFSError(
            'Pinata API keys are not configured. Set PINATA_API_KEY + PINATA_SECRET_KEY (or PINATA_JWT) in backend/.env',
            'PINATA_NOT_CONFIGURED'
        );
    }

    // 3. Build form data
    const formData = new FormData();
    formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: validation.mimeType,
    });

    const pinataMetadata = {
        name: fileName,
        keyvalues: {
            uploadedAt: new Date().toISOString(),
            app: 'govfund-nepal',
            sha256: crypto.createHash('sha256').update(fileBuffer).digest('hex'),
            ...(metadata || {}),
        },
    };
    formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

    // Pin options — use CIDv0 (Qm..., 46 chars) to stay within Solana on-chain 64-char limit
    const pinataOptions = { cidVersion: 0 };
    formData.append('pinataOptions', JSON.stringify(pinataOptions));

    // 4. Upload with retry
    const authHeaders = keys.jwt
        ? { Authorization: `Bearer ${keys.jwt}` }
        : { pinata_api_key: keys.apiKey, pinata_secret_api_key: keys.secretKey };

    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[IPFS] Upload attempt ${attempt}/${maxRetries}: ${fileName} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);

            const response = await axios.post(PINATA_PIN_URL, formData, {
                maxBodyLength: Infinity,
                timeout: 120_000, // 2 min timeout for large files
                headers: {
                    ...formData.getHeaders(),
                    ...authHeaders,
                },
            });

            const ipfsHash = response.data.IpfsHash;
            const size = response.data.PinSize || fileBuffer.length;

            console.log(`[IPFS] ✅ Pinned: ${ipfsHash} (${(size / 1024).toFixed(1)} KB)`);

            // 5. Verify gateway accessibility
            let verifiedGateway = null;
            if (verifyGateway) {
                verifiedGateway = await verifyHashOnGateways(ipfsHash);
            }

            return {
                ipfsHash,
                gatewayUrl: `${GATEWAYS[0]}${ipfsHash}`,
                size,
                verifiedGateway,
            };
        } catch (err) {
            lastError = err;
            const status = err.response?.status;
            const msg = err.response?.data?.error?.details || err.response?.data?.error || err.message;
            console.error(`[IPFS] Upload attempt ${attempt} failed (HTTP ${status || 'N/A'}):`, msg);

            // Don't retry on 401/403 (auth), 400 (bad request)
            if (status === 401 || status === 403) {
                throw new IPFSError('Pinata authentication failed. Check your API keys.', 'AUTH_FAILED');
            }
            if (status === 400) {
                throw new IPFSError(`Pinata rejected the file: ${msg}`, 'BAD_REQUEST');
            }

            if (attempt < maxRetries) {
                const delay = 2000 * attempt; // 2s, 4s, 6s
                console.log(`[IPFS] Retrying in ${delay / 1000}s...`);
                await sleep(delay);
            }
        }
    }

    throw new IPFSError(
        `IPFS upload failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
        'UPLOAD_FAILED'
    );
}

/**
 * Verify that an IPFS hash is accessible via at least one public gateway.
 * Uses HEAD requests (no body download) with exponential backoff.
 *
 * @param {string}  ipfsHash
 * @param {object}  [options]
 * @param {number}  [options.maxAttempts=3]   - Per-gateway retries
 * @param {number}  [options.timeoutMs=10000] - Per-request timeout
 * @returns {Promise<string|null>} The first working gateway URL, or null
 */
async function verifyHashOnGateways(ipfsHash, options = {}) {
    const { maxAttempts = 3, timeoutMs = 10000 } = options;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        for (const gw of GATEWAYS) {
            try {
                const url = `${gw}${ipfsHash}`;
                const res = await axios.head(url, {
                    timeout: timeoutMs,
                    maxRedirects: 3,
                    validateStatus: (s) => s >= 200 && s < 400,
                });
                console.log(`[IPFS] ✅ Verified on gateway: ${gw} (HTTP ${res.status})`);
                return url;
            } catch {
                // silent — try next gateway
            }
        }

        if (attempt < maxAttempts) {
            const delay = 3000 * attempt; // IPFS propagation can take a few seconds
            console.log(`[IPFS] Gateway verification attempt ${attempt} — waiting ${delay / 1000}s for propagation...`);
            await sleep(delay);
        }
    }

    console.warn(`[IPFS] ⚠️ Hash ${ipfsHash} not yet available on any gateway (may still be propagating)`);
    return null;
}

/**
 * Resolve the best accessible gateway URL for a given IPFS hash.
 * Useful for reading/displaying documents.
 *
 * @param {string} ipfsHash
 * @param {number} [timeoutMs=8000]
 * @returns {Promise<string>} Working gateway URL
 */
async function resolveGatewayUrl(ipfsHash, timeoutMs = 8000) {
    if (!isValidCID(ipfsHash)) {
        throw new IPFSError(`Invalid IPFS CID: "${ipfsHash}"`, 'INVALID_CID');
    }

    for (const gw of GATEWAYS) {
        try {
            const url = `${gw}${ipfsHash}`;
            await axios.head(url, { timeout: timeoutMs, validateStatus: (s) => s >= 200 && s < 400 });
            return url;
        } catch {
            // try next
        }
    }

    // Fallback: return default Pinata URL even if HEAD failed (propagation delay)
    return `${GATEWAYS[0]}${ipfsHash}`;
}

/**
 * Test Pinata API key validity (useful for admin setup verification).
 * @returns {Promise<{ ok: boolean, message: string }>}
 */
async function testPinataAuth() {
    const keys = getPinataKeys();
    if (!keys) return { ok: false, message: 'Pinata keys not configured' };

    try {
        const headers = keys.jwt
            ? { Authorization: `Bearer ${keys.jwt}` }
            : { pinata_api_key: keys.apiKey, pinata_secret_api_key: keys.secretKey };

        await axios.get(PINATA_TEST_URL, { headers, timeout: 10000 });
        return { ok: true, message: 'Pinata authentication successful' };
    } catch (err) {
        return { ok: false, message: err.response?.data?.error || err.message };
    }
}

// ── Custom error class ────────────────────────────────────────────────────────

class IPFSError extends Error {
    constructor(message, code = 'IPFS_ERROR') {
        super(message);
        this.name = 'IPFSError';
        this.code = code;
    }
}

module.exports = {
    uploadToIPFS,
    validateFile,
    verifyHashOnGateways,
    resolveGatewayUrl,
    testPinataAuth,
    isValidCID,
    isPinataConfigured,
    IPFSError,
    GATEWAYS,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE,
};
