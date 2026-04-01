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

// ── Project Dashboard Analytics ───────────────────────────────────────────

/** GET /api/projects/stats — total/active/delayed/completed counts */
export async function getProjectStats() {
    const data = await safeFetch('/projects/stats');
    return data || { total: 0, active: 0, delayed: 0, completed: 0 };
}

/** GET /api/projects/by-province — count per province */
export async function getProjectsByProvince() {
    const data = await safeFetch('/projects/by-province');
    return data || [];
}

/** GET /api/projects/by-sector — count per sector */
export async function getProjectsBySector() {
    const data = await safeFetch('/projects/by-sector');
    return data || [];
}

/** GET /api/projects/milestones-summary — milestone progress per active project */
export async function getMilestonesSummary() {
    const data = await safeFetch('/projects/milestones-summary');
    return data || [];
}

/** GET /api/projects/recent-releases — latest fund releases across all projects */
export async function getRecentReleases() {
    const data = await safeFetch('/projects/recent-releases');
    return data || [];
}

/** GET /api/projects/recently-updated — last 4 updated projects */
export async function getRecentlyUpdatedProjects() {
    const data = await safeFetch('/projects/recently-updated');
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
// IPFS routes
// ═════════════════════════════════════════════════════════════════════════════

/** GET /api/ipfs/status — check Pinata configuration & auth health */
export async function getIPFSStatus() {
    const data = await safeFetch('/ipfs/status');
    return data || { configured: false, authenticated: false };
}

/** POST /api/ipfs/verify — verify an IPFS hash is accessible via gateways */
export async function verifyIPFSHash(ipfsHash) {
    return safePost('/ipfs/verify', { ipfsHash });
}

/** GET /api/ipfs/resolve/:hash — resolve the fastest gateway URL for a hash */
export async function resolveIPFSUrl(ipfsHash) {
    const data = await safeFetch(`/ipfs/resolve/${ipfsHash}`);
    return data?.gatewayUrl || `https://ipfs.io/ipfs/${ipfsHash}`;
}

// ═════════════════════════════════════════════════════════════════════════════
// National Budget routes  (no auth required)
// ═════════════════════════════════════════════════════════════════════════════

/** GET /api/budget/all — returns all budget sections in one call */
export async function getBudgetAll() {
    const data = await safeFetch('/budget/all');
    return data || null;
}

/** GET /api/budget/summary — total budget split */
export async function getBudgetSummary() {
    const data = await safeFetch('/budget/summary');
    return data || null;
}

/** GET /api/budget/provinces — province-wise federal grants */
export async function getBudgetProvinces() {
    const data = await safeFetch('/budget/provinces');
    return data || [];
}

/** GET /api/budget/ministries — ministry-wise breakdown */
export async function getBudgetMinistries() {
    const data = await safeFetch('/budget/ministries');
    return data || [];
}

/** GET /api/budget/utilization — allocated vs spent */
export async function getBudgetUtilization() {
    const data = await safeFetch('/budget/utilization');
    return data || [];
}

/** GET /api/budget/verify — IPFS CID verification */
export async function getBudgetVerify() {
    const data = await safeFetch('/budget/verify');
    return data || { verified: false };
}

// ═════════════════════════════════════════════════════════════════════════════
// Complaint routes
// ═════════════════════════════════════════════════════════════════════════════

/** GET /api/complaints/project/:projectId */
export async function getComplaints(projectId) {
    const data = await safeFetch(`/complaints/project/${projectId}`);
    return data || [];
}

/** GET /api/complaints/top */
export async function getTopComplaints(limit = 20) {
    const data = await safeFetch(`/complaints/top?limit=${limit}`);
    return data || [];
}

// ═════════════════════════════════════════════════════════════════════════════
// Utility formatters  (pure functions — no network calls)
// ═════════════════════════════════════════════════════════════════════════════

export function formatNPR(amount) {
    if (!amount || amount === 0) return 'NPR 0';
    // For budget values >= 10, display with B (Billion) suffix
    // This covers all budget-related values like 667.62 B, 16.04 B, 222.86 B, 1860.33 B
    if (amount >= 10) return `NPR ${parseFloat(amount.toFixed(2)).toLocaleString()} B`;
    if (amount >= 1) return `NPR ${amount.toFixed(2)}`;
    if (amount >= 10_000_000) return `NPR ${(amount / 10_000_000).toFixed(1)} Cr`;
    if (amount >= 100_000)    return `NPR ${(amount / 100_000).toFixed(1)} L`;
    return `NPR ${amount.toLocaleString()}`;
}

/**
 * Checks whether a string looks like a valid Solana transaction signature.
 * Real Solana signatures are 87-88 characters of base58 (alphanumeric, no 0/O/I/l).
 * Demo/seed signatures contain '...' or 'demo' and are much shorter.
 */
export function isValidSignature(sig) {
    if (!sig || typeof sig !== 'string') return false;
    // Demo signatures contain '...' or 'demo'
    if (sig.includes('...') || sig.includes('demo')) return false;
    // Valid base58 chars only, and minimum length of 80 characters
    return /^[1-9A-HJ-NP-Za-km-z]{80,}$/.test(sig);
}

export function getExplorerUrl(signature) {
    if (!isValidSignature(signature)) return null;
    return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function getAccountExplorerUrl(address) {
    return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

export function getStatusColor(status) {
    switch (status) {
        case 'Completed':  return 'text-golden';
        case 'InProgress': return 'text-bronze-light';
        case 'Delayed':    return 'text-amber-glow';
        case 'Pending':    return 'text-parchment-ghost';
        case 'Active':     return 'text-bronze-light';
        case 'Closed':     return 'text-parchment-ghost';
        default:           return 'text-parchment-ghost';
    }
}

export function getStatusBg(status) {
    switch (status) {
        case 'Completed':  return 'bg-golden/20 text-golden';
        case 'InProgress': return 'bg-bronze/20 text-bronze-light';
        case 'Delayed':    return 'bg-amber-glow/15 text-amber-glow';
        case 'Pending':    return 'bg-earth-light text-parchment-muted';
        case 'Active':     return 'bg-bronze/20 text-bronze-light';
        case 'Closed':     return 'bg-earth text-parchment-ghost';
        default:           return 'bg-earth-light text-parchment-ghost';
    }
}

export default api;
