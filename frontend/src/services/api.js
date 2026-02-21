import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

/**
 * Fetch from backend API. No demo fallback — data comes from
 * blockchain (via backend) or MongoDB cache. If backend is down,
 * return empty arrays so the UI shows "no projects" instead of fake data.
 */
async function safeFetch(url) {
    try {
        const res = await api.get(url);
        return res.data;
    } catch (err) {
        console.error(`API request failed: ${url}`, err.message);
        return null;
    }
}

export async function getProjects(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const data = await safeFetch(`/projects${params ? '?' + params : ''}`);
    return data || [];
}

export async function getProject(projectId) {
    const data = await safeFetch(`/projects/${projectId}`);
    return data || null;
}

export async function getProjectMilestones(projectId) {
    const data = await safeFetch(`/projects/${projectId}/milestones`);
    return data || [];
}

export async function getProjectDocuments(projectId) {
    const data = await safeFetch(`/projects/${projectId}/documents`);
    return data || [];
}

export async function getProjectReleases(projectId) {
    const data = await safeFetch(`/projects/${projectId}/releases`);
    return data || [];
}

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

export async function getProvinces() {
    const data = await safeFetch('/provinces');
    return data || [
        { name: 'Koshi', number: 1 }, { name: 'Madhesh', number: 2 },
        { name: 'Bagmati', number: 3 }, { name: 'Gandaki', number: 4 },
        { name: 'Lumbini', number: 5 }, { name: 'Karnali', number: 6 },
        { name: 'Sudurpashchim', number: 7 },
    ];
}

export async function getFeedback(projectId) {
    const data = await safeFetch(`/feedback/${projectId}`);
    return data || [];
}

export async function submitFeedback(data) {
    try {
        const res = await api.post('/feedback', data);
        return res.data;
    } catch (err) {
        console.error('Failed to submit feedback:', err.message);
        throw err;
    }
}

// ── Utility formatters ──

export function formatNPR(amount) {
    if (!amount || amount === 0) return 'NPR 0';
    if (amount >= 10000000) return `NPR ${(amount / 10000000).toFixed(1)} Cr`;
    if (amount >= 100000) return `NPR ${(amount / 100000).toFixed(1)} L`;
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
        case 'Completed': return 'text-green-500';
        case 'InProgress': return 'text-blue-500';
        case 'Delayed': return 'text-orange-500';
        case 'Pending': return 'text-gray-400';
        case 'Active': return 'text-blue-500';
        case 'Closed': return 'text-gray-500';
        default: return 'text-gray-400';
    }
}

export function getStatusBg(status) {
    switch (status) {
        case 'Completed': return 'bg-green-500';
        case 'InProgress': return 'bg-blue-500';
        case 'Delayed': return 'bg-orange-500';
        case 'Pending': return 'bg-gray-300 dark:bg-gray-600';
        case 'Active': return 'bg-blue-500';
        case 'Closed': return 'bg-gray-500';
        default: return 'bg-gray-300';
    }
}

export default api;
