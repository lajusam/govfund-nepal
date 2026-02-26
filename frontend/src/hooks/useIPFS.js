import { useState, useCallback, useRef } from 'react';
import api from '../services/api';

// ═══════════════════════════════════════════════════════════════════════════════
// useIPFS — React hook for reliable IPFS file uploads
//
//  Features
//  ────────
//  • Upload via backend /api/ipfs/upload (Pinata pinning + gateway verification)
//  • Upload progress tracking (percent)
//  • Automatic retry with exponential backoff
//  • Pre-upload client-side validation (size, type)
//  • CID validation helper
//  • Gateway URL resolution for existing hashes
//  • Structured error codes for targeted UI feedback
// ═══════════════════════════════════════════════════════════════════════════════

const MAX_FILE_SIZE = 50 * 1024 * 1024; // mirrors backend limit

const ALLOWED_EXTENSIONS = new Set([
    'pdf', 'doc', 'docx', 'xls', 'xlsx',
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
    'mp4', 'webm', 'mov',
    'zip', 'txt', 'csv', 'json',
]);

// Public gateways for client-side fallback resolution
const PUBLIC_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
    'https://w3s.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
];

/**
 * Validate a CID (CIDv0 or CIDv1).
 */
export function isValidCID(hash) {
    if (!hash || typeof hash !== 'string') return false;
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash) || /^bafy[a-z2-7]{55,}$/.test(hash);
}

/**
 * Build a gateway URL for an IPFS hash.
 */
export function getIPFSUrl(hash, gatewayIndex = 0) {
    if (!hash) return '';
    const gw = PUBLIC_GATEWAYS[gatewayIndex] || PUBLIC_GATEWAYS[0];
    return `${gw}${hash}`;
}

/**
 * Client-side file validation before upload.
 */
function validateFileClient(file) {
    if (!file) return 'No file selected';
    if (file.size === 0) return 'File is empty';
    if (file.size > MAX_FILE_SIZE) return `File exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB limit`;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
        return `File type ".${ext}" is not supported. Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`;
    }
    return null; // valid
}

export default function useIPFS() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);              // 0-100
    const [uploadResult, setUploadResult] = useState(null);    // { ipfsHash, gatewayUrl, size, ... }
    const [error, setError] = useState(null);                  // { message, code }
    const abortRef = useRef(null);

    /**
     * Upload a File object to IPFS via the backend.
     *
     * @param {File}   file       - Browser File object from <input type="file">
     * @param {object} [options]
     * @param {string} [options.projectId]  - Tag the pin with a project ID
     * @param {number} [options.maxRetries] - Upload retries (default 2)
     * @returns {Promise<{ ipfsHash, gatewayUrl, size, fileName } | null>}
     */
    const uploadFile = useCallback(async (file, options = {}) => {
        const { projectId = '', maxRetries = 2 } = options;

        // Reset state
        setError(null);
        setUploadResult(null);
        setProgress(0);

        // Client-side validation
        const validationError = validateFileClient(file);
        if (validationError) {
            const err = { message: validationError, code: 'VALIDATION_FAILED' };
            setError(err);
            return null;
        }

        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        if (projectId) formData.append('projectId', projectId);

        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    console.log(`[useIPFS] Retry ${attempt}/${maxRetries}...`);
                    await new Promise((r) => setTimeout(r, 2000 * attempt));
                }

                // Create abort controller for this attempt
                const controller = new AbortController();
                abortRef.current = controller;

                const res = await api.post('/ipfs/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 180_000, // 3 min for large files
                    signal: controller.signal,
                    onUploadProgress: (e) => {
                        if (e.total) {
                            const pct = Math.round((e.loaded / e.total) * 100);
                            setProgress(pct);
                        }
                    },
                });

                const result = res.data;
                setUploadResult(result);
                setProgress(100);
                setUploading(false);
                abortRef.current = null;
                return result;
            } catch (err) {
                lastError = err;

                // Don't retry on abort or auth errors
                if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
                    break;
                }
                const httpStatus = err.response?.status;
                if (httpStatus === 401 || httpStatus === 400) {
                    break; // non-retryable
                }
            }
        }

        // All attempts failed
        const errData = lastError?.response?.data;
        const finalError = {
            message: errData?.error || lastError?.message || 'Upload failed',
            code: errData?.code || 'UPLOAD_FAILED',
        };
        setError(finalError);
        setUploading(false);
        setProgress(0);
        abortRef.current = null;
        return null;
    }, []);

    /**
     * Abort an in-progress upload.
     */
    const cancelUpload = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
        setUploading(false);
        setProgress(0);
    }, []);

    /**
     * Verify an IPFS hash is accessible via the backend (which checks public gateways).
     * @param {string} ipfsHash
     * @returns {Promise<{ accessible: boolean, gatewayUrl: string } | null>}
     */
    const verifyHash = useCallback(async (ipfsHash) => {
        try {
            const res = await api.post('/ipfs/verify', { ipfsHash }, { timeout: 30000 });
            return res.data;
        } catch (err) {
            console.error('[useIPFS] Verify failed:', err.message);
            return null;
        }
    }, []);

    /**
     * Resolve a gateway URL for an IPFS hash via the backend.
     * Falls back to client-side Pinata URL if backend is unavailable.
     * @param {string} ipfsHash
     * @returns {Promise<string>}
     */
    const resolveUrl = useCallback(async (ipfsHash) => {
        try {
            const res = await api.get(`/ipfs/resolve/${ipfsHash}`, { timeout: 15000 });
            return res.data.gatewayUrl;
        } catch {
            return getIPFSUrl(ipfsHash); // fallback
        }
    }, []);

    /**
     * Check IPFS service health.
     * @returns {Promise<{ configured, authenticated, message, gateways }>}
     */
    const checkStatus = useCallback(async () => {
        try {
            const res = await api.get('/ipfs/status', { timeout: 15000 });
            return res.data;
        } catch (err) {
            return { configured: false, authenticated: false, message: err.message, gateways: [] };
        }
    }, []);

    /**
     * Reset all state (useful when switching projects or tabs).
     */
    const reset = useCallback(() => {
        setUploading(false);
        setProgress(0);
        setUploadResult(null);
        setError(null);
    }, []);

    return {
        // Actions
        uploadFile,
        cancelUpload,
        verifyHash,
        resolveUrl,
        checkStatus,
        reset,
        // State
        uploading,
        progress,
        uploadResult,
        error,
    };
}
