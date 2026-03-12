import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import api from '../services/api';
import { getProjects } from '../services/api';
import ComplaintCard from '../components/ComplaintCard';

export default function Complaints() {
    const { publicKey, signMessage } = useWallet();
    const [complaints, setComplaints] = useState([]);
    const [projects, setProjects] = useState({});
    const [loading, setLoading] = useState(true);
    const [reacting, setReacting] = useState(false);
    const [filter, setFilter] = useState('all'); // all | mine | investigation
    const [typeFilter, setTypeFilter] = useState('all');

    const walletAddress = publicKey?.toBase58() || null;

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get('/complaints/top?limit=100').then(r => r.data).catch(() => []),
            getProjects(),
        ]).then(([c, p]) => {
            setComplaints(c);
            const map = {};
            (p || []).forEach(proj => { map[proj.projectId] = proj; });
            setProjects(map);
            setLoading(false);
        });
    }, []);

    const handleReact = useCallback(async (complaintId, reaction) => {
        if (!publicKey || !signMessage) return;
        setReacting(true);
        try {
            const message = `GovFund React: ${complaintId}:${Date.now()}`;
            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes = await signMessage(messageBytes);
            const signature = bs58.encode(signatureBytes);

            const res = await api.post('/complaints/react', { complaintId, reaction }, {
                headers: {
                    'x-wallet-address': publicKey.toBase58(),
                    'x-wallet-signature': signature,
                    'x-wallet-message': message,
                },
            });

            setComplaints(prev => {
                const updated = prev.map(c => c._id === complaintId ? res.data : c);
                updated.sort((a, b) => {
                    const scoreA = (a.reactions?.support || 0) - (a.reactions?.disagree || 0);
                    const scoreB = (b.reactions?.support || 0) - (b.reactions?.disagree || 0);
                    return scoreB - scoreA;
                });
                return updated;
            });
        } catch (err) {
            console.error('React failed:', err);
        } finally {
            setReacting(false);
        }
    }, [publicKey, signMessage]);

    const filtered = complaints.filter(c => {
        if (filter === 'mine') { if (c.walletAddress !== walletAddress) return false; }
        if (filter === 'investigation') { if (!((c.reactions?.support || 0) > 50)) return false; }
        if (typeFilter !== 'all') { if (c.complaintType !== typeFilter) return false; }
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-golden/25 border-t-golden rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-parchment mb-2">Citizen Complaints</h1>
                <p className="text-parchment-muted">
                    Report corruption, irregularities, and misuse of public funds. All complaints are publicly visible and backed by IPFS evidence.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="card p-4">
                    <p className="text-xs text-parchment-ghost mb-1">Total Complaints</p>
                    <p className="text-2xl font-heading font-bold text-parchment">{complaints.length}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-parchment-ghost mb-1">Projects Affected</p>
                    <p className="text-2xl font-heading font-bold text-amber-glow">
                        {new Set(complaints.map(c => c.projectId)).size}
                    </p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-parchment-ghost mb-1">Under Investigation</p>
                    <p className="text-2xl font-heading font-bold text-red-400">
                        {complaints.filter(c => (c.reactions?.support || 0) > 50).length}
                    </p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-parchment-ghost mb-1">Total Evidence Files</p>
                    <p className="text-2xl font-heading font-bold text-golden">
                        {complaints.reduce((sum, c) => sum + (c.evidence?.length || 0), 0)}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
                {[
                    { key: 'all', label: 'All Complaints' },
                    { key: 'investigation', label: 'Public Investigation' },
                    ...(walletAddress ? [{ key: 'mine', label: 'My Complaints' }] : []),
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            filter === f.key
                                ? 'bg-golden/15 border border-golden/30 text-golden'
                                : 'bg-earth border border-earth-border text-parchment-muted hover:text-parchment hover:border-golden/20'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
                <span className="text-xs text-parchment-ghost mr-1">Type:</span>
                {['all', 'Budget Misuse', 'Project Delay', 'Fake Progress Report', 'Contractor Corruption', 'Environmental Damage', 'Other'].map(t => (
                    <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                            typeFilter === t
                                ? 'bg-red-900/20 border border-red-500/30 text-red-400'
                                : 'bg-earth border border-earth-border text-parchment-muted hover:text-parchment'
                        }`}
                    >
                        {t === 'all' ? 'All Types' : t}
                    </button>
                ))}
            </div>

            {/* Complaints List */}
            {filtered.length > 0 ? (
                <div className="space-y-6">
                    {filtered.map(c => {
                        const proj = projects[c.projectId];
                        return (
                            <div key={c._id}>
                                {/* Project reference bar */}
                                <div className="flex items-center gap-2 mb-2 ml-1">
                                    <span className="text-[10px] text-parchment-ghost uppercase tracking-wider">Project:</span>
                                    <Link
                                        to={`/project/${c.projectId}`}
                                        className="text-xs text-golden hover:text-amber-glow transition-colors font-medium"
                                    >
                                        {proj?.name || c.projectId}
                                    </Link>
                                    {proj && (
                                        <span className="text-[10px] text-parchment-ghost">
                                            — {proj.province}, {proj.district}
                                        </span>
                                    )}
                                </div>
                                <ComplaintCard
                                    complaint={c}
                                    walletAddress={walletAddress}
                                    onReact={handleReact}
                                    reacting={reacting}
                                />
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-earth-light flex items-center justify-center">
                        <svg className="w-8 h-8 text-parchment-ghost" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-heading font-bold text-parchment mb-2">
                        {filter === 'mine' ? 'You haven\'t filed any complaints' :
                         filter === 'investigation' ? 'No complaints under public investigation' :
                         'No Complaints Filed Yet'}
                    </h3>
                    <p className="text-sm text-parchment-muted">
                        {filter === 'all'
                            ? 'Visit a project page to file the first complaint.'
                            : 'Try changing the filter above.'}
                    </p>
                </div>
            )}
        </div>
    );
}
