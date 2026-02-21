import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// Base URL resolution
//
//  Environment       │ VITE_API_URL set?  │ Value used
//  ──────────────────┼────────────────────┼──────────────────────────────────
//  Local dev         │ Yes (.env.local)   │ http://localhost:5000/api
//  Local dev         │ No                 │ /api  → Vite proxy (if configured)
//  Vercel (prod/prev)│ Never set          │ /api  → same-origin serverless fn
//
//  To use the local Express server during development, create
//  frontend/.env.local (this file is gitignored):
//
//    VITE_API_URL=http://localhost:5000/api
//
//  On Vercel no environment variable is needed — the relative path /api is
//  automatically routed to api/server.js by the rewrites in vercel.json.
// ─────────────────────────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || '/api';

// ── Axios instance ────────────────────────────────────────────────────────────
// A single shared instance so interceptors, headers, and timeout are
// configured once and apply to every call in this file.
const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// ── Admin wallet headers ──────────────────────────────────────────────────────
// Sets (or clears) the three headers that verifyAdmin() checks on the server.
// Call this once after the wallet connects, so subsequent admin requests are
// automatically authenticated.
export function setAdminHeaders(walletAddress, signature = null, message = null) {
    if (walletAddress) {
        api.defaults.headers.common['x-wallet-address'] = walletAddress;
        if (signature) api.defaults.headers.common['x-wallet-signature'] = signature;
        if (message)   api.defaults.headers.common['x-wallet-message']   = message;
    } else {
        delete api.defaults.headers.common['x-wallet-address'];
        delete api.defaults.headers.common['x-wallet-signature'];
        delete api.defaults.headers.common['x-wallet-message'];
    }
}

// ── Low-level helpers ─────────────────────────────────────────────────────────

/**
 * GET helper — returns response data or null on failure.
 * Logs the HTTP status code alongside the error message for easier debugging.
 */
async function safeFetch(url) {
    try {
        const res = await api.get(url);
        return res.data;
    } catch (err) {
        const status = err.response?.status ?? 'network error';
        const msg    = err.response?.data?.error ?? err.message;
        console.error(`[API ${status}] GET ${url} —`, msg);
        return null;
    }
}

/**
 * POST helper — throws on failure so callers can show error UI.
 */
async function safePost(url, body) {
    const res = await api.post(url, body);
    return res.data;
}

// ═════════════════════════════════════════════════════════════════════════════
// Public read routes  (no auth required)
// ═════════════════════════════════════════════════════════════════════════════

// ── Projects ──────────────────────────────────────────────────────────────────

/**
 * GET /api/projects[?province=&district=&sector=&status=]
 * Returns the merged on-chain + MongoDB project list.
 */
export async function getProjects(filters = {}) {
    const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    ).toString();
    const data = await safeFetch(`/projects${params ? '?' + params : ''}`);
    return data || [];
}

/** GET /api/projects/:projectId */
export async function getProject(projectId) {
    const data = await safeFetch(`/projects/${projectId}`);
    return data || null;
}

/** GET /api/projects/:projectId/milestones */
export async function getProjectMilestones(projectId) {
    const data = await safeFetch(`/projects/${projectId}/milestones`);
    return data || [];
}

/** GET /api/projects/:projectId/documents */
export async function getProjectDocuments(projectId) {
    const data = await safeFetch(`/projects/${projectId}/documents`);
    return data || [];
}

/** GET /api/projects/:projectId/releases */
export async function getProjectReleases(projectId) {
    const data = await safeFetch(`/projects/${projectId}/releases`);
    return data || [];
}

// ── Analytics ─────────────────────────────────────────────────────────────────

/** GET /api/analytics */
export async function getAnalytics() {
    const data = await safeFetch('/analytics');
    return data || {
        overview: {
            totalBudget: 0, totalAllocated: 0, totalReleased: 0,
            totalProjects: 0, activeProjects: 0, completedProjects: 0,
            utilizationRate: '0',
        },
        provinceStats: [],
        sectorStats: [],
    };
}

// ── Provinces ─────────────────────────────────────────────────────────────────

/** GET /api/provinces */
export async function getProvinces() {
    const data = await safeFetch('/provinces');
    return data || [
        { name: 'Koshi',          number: 1 },
        { name: 'Madhesh',        number: 2 },
        { name: 'Bagmati',        number: 3 },
        { name: 'Gandaki',        number: 4 },
        { name: 'Lumbini',        number: 5 },
        { name: 'Karnali',        number: 6 },
        { name: 'Sudurpashchim',  number: 7 },
    ];
}

/** GET /api/provinces/:name */
export async function getProvince(name) {
    const data = await safeFetch(`/provinces/${encodeURIComponent(name)}`);
    return data || null;
}

// ── Feedback ──────────────────────────────────────────────────────────────────

/** GET /api/feedback/:projectId */
export async function getFeedback(projectId) {
    const data = await safeFetch(`/feedback/${projectId}`);
    return data || [];
}

/** POST /api/feedback */
export async function submitFeedback(payload) {
    return safePost('/feedback', payload);
}

// ── Health / misc ─────────────────────────────────────────────────────────────

/** GET /api/health — returns { status, db, timestamp } */
export async function getHealth() {
    const data = await safeFetch('/health');
    return data || { status: 'unknown' };
}

/** GET /api/demo-projects — all seeded MongoDB projects */
export async function getDemoProjects() {
    const data = await safeFetch('/demo-projects');
    return data || [];
}

// ═════════════════════════════════════════════════════════════════════════════
// Admin routes  (require x-wallet-* headers — call setAdminHeaders() first)
// ═════════════════════════════════════════════════════════════════════════════

/** GET /api/admin/config — admin wallet + program ID (public, no auth) */
export async function getAdminConfig() {
    const data = await safeFetch('/admin/config');
    return data || {};
}

/** POST /api/admin/projects/sync — sync newly created project from chain */
export async function syncProject(projectId, txSignature, description = '') {
    return safePost('/admin/projects/sync', { projectId, txSignature, description });
}

/** POST /api/admin/projects/:projectId/sync-allocate */
export async function syncAllocate(projectId, { txSignature, amount, description } = {}) {
    return safePost(`/admin/projects/${projectId}/sync-allocate`, { txSignature, amount, description });
}

/** POST /api/admin/projects/:projectId/sync-release */
export async function syncRelease(projectId, { txSignature, amount, description } = {}) {
    return safePost(`/admin/projects/${projectId}/sync-release`, { txSignature, amount, description });
}

/** POST /api/admin/projects/:projectId/sync-milestone */
export async function syncMilestone(projectId, { txSignature, index, title, description, status } = {}) {
    return safePost(`/admin/projects/${projectId}/sync-milestone`, { txSignature, index, title, description, status });
}

/** POST /api/admin/projects/:projectId/sync-document */
export async function syncDocument(projectId, { txSignature, ipfsHash, name } = {}) {
    return safePost(`/admin/projects/${projectId}/sync-document`, { txSignature, ipfsHash, name });
}

/** POST /api/admin/projects/:projectId/sync-close */
export async function syncClose(projectId, { txSignature } = {}) {
    return safePost(`/admin/projects/${projectId}/sync-close`, { txSignature });
}

/** GET /api/admin/sync-all — re-sync all projects from chain to MongoDB */
export async function syncAll() {
    const data = await safeFetch('/admin/sync-all');
    return data || { count: 0 };
}

// ═════════════════════════════════════════════════════════════════════════════
// Utility formatters  (pure functions — no network calls)
// ═════════════════════════════════════════════════════════════════════════════

export function formatNPR(amount) {
    if (!amount || amount === 0) return 'NPR 0';
    if (amount >= 10_000_000) return `NPR ${(amount / 10_000_000).toFixed(1)} Cr`;
    if (amount >= 100_000)    return `NPR ${(amount / 100_000).toFixed(1)} L`;
    return `NPR ${amount.toLocaleString()}`;
}

export function getExplorerUrl(signature) {
    return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function getAccountExplorerUrl(address) {
    return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

export function getStatusColor(status) {
    switch (status) {
        case 'Completed':  return 'text-green-500';
        case 'InProgress': return 'text-blue-500';
        case 'Delayed':    return 'text-orange-500';
        case 'Pending':    return 'text-gray-400';
        case 'Active':     return 'text-blue-500';
        case 'Closed':     return 'text-gray-500';
        default:           return 'text-gray-400';
    }
}

export function getStatusBg(status) {
    switch (status) {
        case 'Completed':  return 'bg-green-500';
        case 'InProgress': return 'bg-blue-500';
        case 'Delayed':    return 'bg-orange-500';
        case 'Pending':    return 'bg-gray-300 dark:bg-gray-600';
        case 'Active':     return 'bg-blue-500';
        case 'Closed':     return 'bg-gray-500';
        default:           return 'bg-gray-300';
    }
}

export default api;
