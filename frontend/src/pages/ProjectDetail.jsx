import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProject, getFeedback, submitFeedback, formatNPR, getStatusColor, getStatusBg, getExplorerUrl, getAccountExplorerUrl, isValidSignature } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import IPFSDocumentLink from '../components/IPFSDocumentLink';
import ComplaintForm from '../components/ComplaintForm';
import ComplaintCard from '../components/ComplaintCard';
import { useLanguage } from '../context/LanguageContext';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function MilestoneTracker({ milestones, total }) {
    return (
        <div className="relative">
            {milestones.map((m, i) => {
                const isCompleted = m.status === 'Completed';
                const isActive = m.status === 'InProgress';
                return (
                    <div key={i} className="flex items-start gap-4 mb-6 last:mb-0">
                        {/* Timeline line + dot */}
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${isCompleted ? 'bg-golden border-golden text-basalt' :
                                    isActive ? 'bg-golden/15 border-golden text-golden animate-pulse' :
                                        'bg-earth-light border-earth-border text-parchment-ghost'
                                }`}>
                                {isCompleted ? '✓' : i + 1}
                            </div>
                            {i < milestones.length - 1 && (
                                <div className={`w-0.5 h-12 ${isCompleted ? 'bg-golden/70' : 'bg-earth-border'}`}></div>
                            )}
                        </div>
                        {/* Content */}
                        <div className="flex-1 pb-2">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm text-parchment">{m.title}</h4>
                                <span className={`badge text-[10px] ${
                                    isCompleted ? 'badge-active' :
                                    isActive ? 'badge-pending border-golden/40 text-golden' :
                                    'badge-pending'
                                }`}>
                                    {m.status}
                                </span>
                            </div>
                            <p className="text-xs text-parchment-muted">{m.description}</p>
                            <p className="text-[10px] text-parchment-ghost mt-1">Updated: {new Date(m.updatedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function ProjectDetail() {
    const { projectId } = useParams();
    const { publicKey, signMessage } = useWallet();
    const [project, setProject] = useState(null);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newFeedback, setNewFeedback] = useState({ rating: 5, comment: '' });
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    // Complaints state
    const [complaints, setComplaints] = useState([]);
    const [complaintsLoading, setComplaintsLoading] = useState(false);
    const [showComplaintForm, setShowComplaintForm] = useState(false);
    const [hasSubmittedComplaint, setHasSubmittedComplaint] = useState(false);
    const [complaintSort, setComplaintSort] = useState('newest');
    const { t } = useLanguage();

    useEffect(() => {
        Promise.all([getProject(projectId), getFeedback(projectId)])
            .then(([p, f]) => { setProject(p); setFeedback(f); setLoading(false); });
    }, [projectId]);

    // Fetch complaints when tab is active or on mount
    const fetchComplaints = useCallback(async () => {
        setComplaintsLoading(true);
        try {
            const res = await api.get(`/complaints/project/${projectId}`);
            const data = res.data || [];
            setComplaints(data);
            // Check if current wallet already submitted
            if (publicKey) {
                const walletAddr = publicKey.toBase58();
                setHasSubmittedComplaint(data.some(c => c.walletAddress === walletAddr));
            }
        } catch {
            setComplaints([]);
        } finally {
            setComplaintsLoading(false);
        }
    }, [projectId, publicKey]);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    // Update hasSubmittedComplaint when wallet changes
    useEffect(() => {
        if (publicKey && complaints.length > 0) {
            const walletAddr = publicKey.toBase58();
            setHasSubmittedComplaint(complaints.some(c => c.walletAddress === walletAddr));
        } else {
            setHasSubmittedComplaint(false);
        }
    }, [publicKey, complaints]);

    const releaseChartData = useMemo(() => {
        if (!project?.fundReleases?.length) return null;
        let cumulative = 0;
        const releases = project.fundReleases.map(r => {
            cumulative += r.amount;
            return { date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), amount: cumulative };
        });
        return {
            labels: releases.map(r => r.date),
            datasets: [{
                label: 'Cumulative Released',
                data: releases.map(r => r.amount),
                borderColor: '#8E6F3E',
                backgroundColor: 'rgba(142,111,62,0.08)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#8E6F3E',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
            }],
        };
    }, [project]);

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const result = await submitFeedback({ projectId, ...newFeedback });
        setFeedback(prev => [result, ...prev]);
        setNewFeedback({ rating: 5, comment: '' });
        setSubmitting(false);
    };

    const sortedComplaints = useMemo(() => {
        const sorted = [...complaints];
        switch (complaintSort) {
            case 'popular':
                return sorted.sort((a, b) => {
                    const scoreA = (a.reactions?.support || 0) + (a.reactions?.investigation || 0) - (a.reactions?.disagree || 0);
                    const scoreB = (b.reactions?.support || 0) + (b.reactions?.investigation || 0) - (b.reactions?.disagree || 0);
                    return scoreB - scoreA;
                });
            case 'oldest':
                return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            default: // newest
                return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    }, [complaints, complaintSort]);

    const handleComplaintSuccess = () => {
        setShowComplaintForm(false);
        fetchComplaints();
    };

    const [reactingComplaint, setReactingComplaint] = useState(false);
    const handleComplaintReact = useCallback(async (complaintId, reaction) => {
        if (!publicKey || !signMessage) return;
        setReactingComplaint(true);
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

            setComplaints(prev => prev.map(c => c._id === complaintId ? res.data : c));
        } catch (err) {
            console.error('React failed:', err);
        } finally {
            setReactingComplaint(false);
        }
    }, [publicKey, signMessage]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-golden/25 border-t-golden rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!project) {
        return <div className="text-center py-20 text-parchment-muted text-lg">{t('projectNotFound')}</div>;
    }

    const p = project;
    const budgetPct = p.allocatedBudget > 0 ? ((p.releasedAmount / p.allocatedBudget) * 100).toFixed(1) : 0;
    const milestonePct = p.milestoneCount > 0 ? ((p.milestonesCompleted / p.milestoneCount) * 100).toFixed(0) : 0;

    // Determine if this is a demo/sample project (no real on-chain transactions)
    const allSignatures = [
        ...(p.fundReleases || []).map(r => r.txSignature),
        ...(p.budgetAllocations || []).map(a => a.txSignature),
    ].filter(Boolean);
    const isDemoProject = allSignatures.length > 0 && !allSignatures.some(sig => isValidSignature(sig)) && !p.onChain;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-parchment-muted mb-6">
                <Link to="/projects" className="hover:text-golden transition-colors">Projects</Link>
                <span>/</span>
                <span className="text-parchment font-medium">{p.name}</span>
            </div>

            {/* Demo project banner */}
            {isDemoProject && (
                <div className="mb-6 p-4 rounded-xl bg-golden/8 border border-golden/20 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-golden/15 border border-golden/25 flex items-center justify-center text-golden text-sm flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-golden mb-0.5">{t('demonstrationProject')}</p>
                        <p className="text-xs text-parchment-muted leading-relaxed">
                            {t('demoProjectDesc')}
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="card p-8 mb-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`badge ${
                                p.status === 'Active' ? 'badge-active' :
                                p.status === 'Completed' ? 'bg-earth text-parchment-ghost border border-parchment-ghost/30' :
                                p.status === 'Suspended' ? 'bg-red-900/20 text-red-400 border border-red-500/30' :
                                'badge-completed'
                            }`}>{p.status === 'Completed' ? `🔒 ${t('closed')}` : p.status}</span>
                            <span className="text-sm text-parchment-muted">{p.province} → {p.district} → {p.sector}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-heading font-bold text-parchment">{p.name}</h1>
                        <p className="text-parchment-muted mt-2 max-w-2xl">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-earth-light flex items-center justify-center">
                            <svg className="w-7 h-7 text-parchment-ghost" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-parchment-ghost">{t('contractorLabel')}</p>
                            <p className="font-semibold text-parchment">{p.contractor}</p>
                        </div>
                    </div>
                </div>

                {/* Budget overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-xs text-parchment-ghost mb-1">{t('totalBudgetLabel')}</p>
                        <p className="text-xl font-heading font-bold text-parchment">{formatNPR(p.totalBudget)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-parchment-ghost mb-1">{t('allocated')}</p>
                        <p className="text-xl font-heading font-bold text-amber-glow">{formatNPR(p.allocatedBudget)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-parchment-ghost mb-1">{t('released')}</p>
                        <p className="text-xl font-heading font-bold text-golden">{formatNPR(p.releasedAmount)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-parchment-ghost mb-1">{t('completion')}</p>
                        <p className="text-xl font-heading font-bold text-bronze-light">{milestonePct}%</p>
                    </div>
                </div>

                {/* Progress bars */}
                <div className="mt-6 space-y-3">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-parchment-muted">{t('fundUtilization')}</span>
                            <span className="font-semibold">{budgetPct}%</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill bg-gradient-to-r from-golden to-amber-glow" style={{ width: `${Math.min(budgetPct, 100)}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-parchment-muted">{t('milestonesLabel')} ({p.milestonesCompleted}/{p.milestoneCount})</span>
                            <span className="font-semibold">{milestonePct}%</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill bg-gradient-to-r from-bronze to-bronze-light" style={{ width: `${milestonePct}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-sm text-parchment-muted">
                    {t('estimatedCompletionLabel')}: <span className="font-medium text-parchment">
                        {new Date(p.estimatedCompletion).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 mb-8 border-b border-earth-border overflow-x-auto">
                {[
                    { key: 'overview', label: 'Overview', icon: '📋' },
                    { key: 'complaints', label: `Complaints (${complaints.length})`, icon: '🚨' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                            activeTab === tab.key
                                ? 'border-golden text-golden'
                                : 'border-transparent text-parchment-muted hover:text-parchment hover:border-earth-border'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Milestones + Documents */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Milestones */}
                    <div className="card p-6">
                        <h3 className="font-heading font-bold text-lg text-parchment mb-6">
                            {t('milestonePipeline')}
                        </h3>
                        {p.milestones?.length > 0 ? (
                            <MilestoneTracker milestones={p.milestones} total={p.milestoneCount} />
                        ) : (
                            <p className="text-parchment-muted text-sm">{t('noMilestones')}</p>
                        )}
                    </div>

                    {/* Fund Release Chart */}
                    {releaseChartData && (
                        <div className="card p-6">
                            <h3 className="font-heading font-bold text-lg text-parchment mb-4">
                                {t('fundReleaseTimeline')}
                            </h3>
                            <Line
                                data={releaseChartData}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: {
                                            backgroundColor: 'rgba(45,37,24,0.95)',
                                            borderColor: 'rgba(142,111,62,0.28)',
                                            borderWidth: 1,
                                            titleColor: '#F5F1E6',
                                            bodyColor: '#C4A96E',
                                            padding: 12,
                                            callbacks: { label: (ctx) => ` ${formatNPR(ctx.raw)}` },
                                        },
                                    },
                                    scales: {
                                        y: {
                                            ticks: {
                                                callback: (v) => formatNPR(v),
                                                color: '#C4A96E',
                                                font: { size: 11 },
                                            },
                                            grid: { color: 'rgba(142,111,62,0.18)' },
                                            border: { color: 'rgba(142,111,62,0.28)' },
                                        },
                                        x: {
                                            grid: { display: false },
                                            ticks: { color: '#C4A96E', font: { size: 11 } },
                                            border: { color: 'rgba(142,111,62,0.28)' },
                                        },
                                    },
                                }}
                            />
                        </div>
                    )}

                    {/* Fund Release Table */}
                    {p.fundReleases?.length > 0 && (
                        <div className="card p-6 overflow-x-auto">
                            <h3 className="font-heading font-bold text-lg text-parchment mb-4">
                                {t('fundReleaseHistory')}
                            </h3>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-earth-border">
                                        <th className="text-left py-3 text-parchment-muted font-medium">{t('dateLabel')}</th>
                                        <th className="text-left py-3 text-parchment-muted font-medium">{t('amountLabel')}</th>
                                        <th className="text-left py-3 text-parchment-muted font-medium hidden sm:table-cell">{t('descriptionLabel')}</th>
                                        <th className="text-left py-3 text-parchment-muted font-medium">Tx</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {p.fundReleases.map((r, i) => (
                                        <tr key={i} className="border-b border-earth-border hover:bg-earth-light transition-colors">
                                            <td className="py-3 text-parchment-muted whitespace-nowrap">{new Date(r.date).toLocaleDateString()}</td>
                                            <td className="py-3 font-semibold text-golden whitespace-nowrap">{formatNPR(r.amount)}</td>
                                            <td className="py-3 text-parchment-muted hidden sm:table-cell">{r.description || '—'}</td>
                                            <td className="py-3">
                                                {r.txSignature ? (
                                                    isValidSignature(r.txSignature) ? (
                                                        <a
                                                            href={getExplorerUrl(r.txSignature)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-xs font-mono text-golden hover:text-amber-glow transition-colors group"
                                                            title={r.txSignature}
                                                        >
                                                            <span className="hidden sm:inline">{r.txSignature.slice(0, 8)}&hellip;{r.txSignature.slice(-6)}</span>
                                                            <span className="sm:hidden">View</span>
                                                            <svg className="w-3 h-3 opacity-60 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        </a>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-xs text-parchment-muted" title="Simulated transaction for demonstration purposes">
                                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-golden/10 border border-golden/20 text-[10px] text-golden/80 font-medium">
                                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                Sample
                                                            </span>
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-xs text-parchment-ghost">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Public Feedback */}
                    <div className="card p-6">
                        <h3 className="font-heading font-bold text-lg text-parchment mb-4">
                            {t('publicReviews')}
                        </h3>
                        <form onSubmit={handleSubmitFeedback} className="mb-6 p-4 bg-earth rounded-xl">
                            <div className="flex items-center gap-4 mb-3">
                                <label className="text-sm text-parchment-muted">{t('ratingLabel')}</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setNewFeedback(f => ({ ...f, rating: star }))}
                                            className={`text-xl transition-colors ${star <= newFeedback.rating ? 'text-golden' : 'text-parchment-ghost'} hover:text-golden`}
                                        >★</button>
                                    ))}
                                </div>
                            </div>
                            <textarea
                                className="input-field mb-3"
                                rows={3}
                                placeholder={t('feedbackPlaceholder')}
                                value={newFeedback.comment}
                                onChange={e => setNewFeedback(f => ({ ...f, comment: e.target.value }))}
                                maxLength={500}
                                required
                            />
                            <button type="submit" disabled={submitting} className="btn-primary text-sm">
                                {submitting ? t('submittingFeedback') : t('submitReview')}
                            </button>
                        </form>

                        {feedback.length > 0 ? (
                            <div className="space-y-4">
                                {feedback.map((f, i) => (
                                    <div key={i} className="p-4 bg-earth rounded-xl border border-earth-border">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm text-golden">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</div>
                                            </div>
                                            <span className="text-xs text-parchment-muted">{new Date(f.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-parchment-dim">{f.comment}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-parchment-muted">{t('noReviews')}</p>
                        )}
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-6">
                    {/* Documents */}
                    <div className="card p-6">
                        <h3 className="font-heading font-bold text-lg text-parchment mb-4">
                            📄 {t('documentsIPFS')}
                        </h3>
                        {p.documents?.length > 0 ? (
                            <div className="space-y-3">
                                {p.documents.map((doc, i) => (
                                    <IPFSDocumentLink
                                        key={i}
                                        ipfsHash={doc.ipfsHash}
                                        name={doc.name}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-parchment-muted">{t('noDocuments')}</p>
                        )}
                    </div>

                    {/* Budget Allocations */}
                    {p.budgetAllocations?.length > 0 && (
                        <div className="card p-6">
                            <h3 className="font-heading font-bold text-lg text-parchment mb-4">
                                💰 {t('budgetAllocationsTitle')}
                            </h3>
                            <div className="space-y-3">
                                {p.budgetAllocations.map((a, i) => (
                                    <div key={i} className="p-3 bg-earth rounded-xl">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-semibold text-amber-glow">{formatNPR(a.amount)}</span>
                                            <span className="text-xs text-parchment-muted">{new Date(a.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-parchment-muted">{a.description}</p>
                                        {a.txSignature && (
                                            isValidSignature(a.txSignature) ? (
                                                <a
                                                    href={getExplorerUrl(a.txSignature)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-mono text-golden hover:text-amber-glow transition-colors"
                                                >
                                                    Tx: {a.txSignature.slice(0, 8)}…{a.txSignature.slice(-6)}
                                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] text-parchment-muted" title="Simulated transaction for demonstration purposes">
                                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-golden/10 border border-golden/20 text-golden/80 font-medium">
                                                        <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        Sample Tx
                                                    </span>
                                                </span>
                                            )
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Solana On-Chain Info */}
                    <div className="card p-6">
                        <h3 className="font-heading font-bold text-lg text-parchment mb-4">
                            ⛓️ {t('onChainData')}
                        </h3>

                        {/* Project PDA */}
                        {p.pda && (
                            <div className="mb-4 p-3 bg-earth rounded-xl">
                                <p className="text-[10px] text-parchment-ghost uppercase tracking-wider mb-1">{t('projectPDA')}</p>
                                <a
                                    href={getAccountExplorerUrl(p.pda)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between group hover:bg-earth-light rounded-lg p-1 -m-1 transition-colors"
                                >
                                    <span className="text-xs font-mono text-golden group-hover:text-amber-glow break-all leading-relaxed">
                                        {p.pda}
                                    </span>
                                    <svg className="w-3.5 h-3.5 ml-2 flex-shrink-0 text-parchment-ghost group-hover:text-golden transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        )}

                        {/* Recent on-chain transactions */}
                        {(() => {
                            const allTxs = [
                                ...(p.fundReleases || []).filter(r => r.txSignature).map(r => ({ sig: r.txSignature, label: `Released ${formatNPR(r.amount)}`, date: r.date, type: 'release' })),
                                ...(p.budgetAllocations || []).filter(a => a.txSignature).map(a => ({ sig: a.txSignature, label: `Allocated ${formatNPR(a.amount)}`, date: a.date, type: 'allocate' })),
                            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

                            // Separate real on-chain txs from demo/sample placeholders
                            const realTxs = allTxs.filter(tx => isValidSignature(tx.sig));
                            const demoTxs = allTxs.filter(tx => !isValidSignature(tx.sig));
                            const isDemoProject = realTxs.length === 0 && demoTxs.length > 0;

                            return realTxs.length > 0 ? (
                                <div>
                                    <p className="text-[10px] text-parchment-ghost uppercase tracking-wider mb-3">{t('recentTransactions')}</p>
                                    <div className="space-y-2">
                                        {realTxs.map((tx, i) => (
                                            <a
                                                key={i}
                                                href={getExplorerUrl(tx.sig)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-2 bg-earth rounded-lg hover:bg-earth-light transition-colors group"
                                            >
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                                                    tx.type === 'release' ? 'bg-golden/15 text-golden' : 'bg-amber-glow/10 text-amber-glow'
                                                }`}>
                                                    {tx.type === 'release' ? '⇓' : '⇑'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-parchment font-medium truncate">{tx.label}</p>
                                                    <p className="text-[10px] font-mono text-parchment-ghost">
                                                        {tx.sig.slice(0, 8)}&hellip;{tx.sig.slice(-6)}
                                                    </p>
                                                </div>
                                                <svg className="w-3 h-3 text-parchment-ghost group-hover:text-golden transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        ))}
                                    </div>
                                    {demoTxs.length > 0 && (
                                        <p className="text-[10px] text-parchment-ghost/60 mt-2 italic">
                                            + {demoTxs.length} sample transaction{demoTxs.length > 1 ? 's' : ''} (demonstration data)
                                        </p>
                                    )}
                                </div>
                            ) : demoTxs.length > 0 ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <p className="text-[10px] text-parchment-ghost uppercase tracking-wider">{t('transactionHistory')}</p>
                                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-golden/10 border border-golden/20 text-[9px] text-golden/80 font-medium">
                                            <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            {t('sampleData')}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {demoTxs.slice(0, 5).map((tx, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-3 p-2 bg-earth rounded-lg hover:bg-earth-light/50 transition-colors"
                                            >
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                                                    tx.type === 'release' ? 'bg-golden/15 text-golden' : 'bg-amber-glow/10 text-amber-glow'
                                                }`}>
                                                    {tx.type === 'release' ? '⇓' : '⇑'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-parchment font-medium truncate">{tx.label}</p>
                                                    <p className="text-[10px] text-parchment-muted">
                                                        {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-golden/10 border border-golden/20 text-[9px] text-golden/70 font-medium flex-shrink-0">
                                                    <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    Sample
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {demoTxs.length > 5 && (
                                        <p className="text-[10px] text-parchment-ghost/60 mt-2">
                                            + {demoTxs.length - 5} more transaction{demoTxs.length - 5 > 1 ? 's' : ''}
                                        </p>
                                    )}
                                    <div className="mt-3 p-2.5 rounded-lg bg-golden/5 border border-golden/15">
                                        <p className="text-[10px] text-parchment-muted leading-relaxed">
                                            <span className="text-golden/80 font-medium">Note:</span> {t('sampleTxNote')}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-parchment-ghost mb-3">{t('noOnChainTx')}</p>
                            );
                        })()}

                        {/* Solana Explorer link */}
                        <div className="mt-4 pt-3 border-t border-earth-border">
                            <a
                                href="https://explorer.solana.com/?cluster=devnet"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-earth rounded-xl hover:bg-earth-light transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-golden/10 border border-golden/20 flex items-center justify-center text-golden text-sm">⛓</div>
                                <div>
                                    <p className="text-sm font-medium text-parchment group-hover:text-golden transition-colors">{t('solanaExplorer')}</p>
                                    <p className="text-xs text-parchment-muted">{t('devnetCluster')}</p>
                                </div>
                                <svg className="w-4 h-4 ml-auto text-parchment-ghost group-hover:text-golden transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            ) : (
            /* ── Complaints Tab ─────────────────────────────────────────────── */
            <div className="max-w-4xl space-y-6">
                {/* Header + Add button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 className="font-heading font-bold text-xl text-parchment">
                            Citizen Complaints
                        </h3>
                        <p className="text-sm text-parchment-muted mt-1">
                            {complaints.length} complaint{complaints.length !== 1 ? 's' : ''} filed for this project
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Sort */}
                        <select
                            value={complaintSort}
                            onChange={e => setComplaintSort(e.target.value)}
                            className="input-field text-sm py-1.5 px-3"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="popular">Most Popular</option>
                        </select>
                        {/* Add Complaint Button */}
                        {publicKey && !hasSubmittedComplaint && !showComplaintForm && (
                            <button
                                onClick={() => setShowComplaintForm(true)}
                                className="btn-primary text-sm flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Complaint
                            </button>
                        )}
                    </div>
                </div>

                {/* Already submitted notice */}
                {publicKey && hasSubmittedComplaint && (
                    <div className="p-4 rounded-xl bg-amber-900/15 border border-amber-500/25 flex items-start gap-3">
                        <span className="text-amber-400 text-lg mt-0.5">⚠️</span>
                        <div>
                            <p className="text-sm font-semibold text-amber-400">You have already submitted a complaint</p>
                            <p className="text-xs text-parchment-muted mt-0.5">Each wallet can submit one complaint per project.</p>
                        </div>
                    </div>
                )}

                {/* Not connected notice */}
                {!publicKey && (
                    <div className="p-4 rounded-xl bg-earth border border-earth-border flex items-start gap-3">
                        <span className="text-parchment-ghost text-lg mt-0.5">🔗</span>
                        <div>
                            <p className="text-sm font-semibold text-parchment">Connect your wallet to file a complaint</p>
                            <p className="text-xs text-parchment-muted mt-0.5">A Solana wallet signature is required for verification.</p>
                        </div>
                    </div>
                )}

                {/* Complaint Form Modal */}
                {showComplaintForm && (
                    <div className="card p-6">
                        <ComplaintForm
                            projectId={projectId}
                            onSuccess={handleComplaintSuccess}
                            onCancel={() => setShowComplaintForm(false)}
                        />
                    </div>
                )}

                {/* Complaints List */}
                {complaintsLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-3 border-golden/25 border-t-golden rounded-full animate-spin"></div>
                    </div>
                ) : sortedComplaints.length > 0 ? (
                    <div className="space-y-4">
                        {sortedComplaints.map(complaint => (
                            <ComplaintCard
                                key={complaint._id}
                                complaint={complaint}
                                walletAddress={publicKey?.toBase58() || null}
                                onReact={handleComplaintReact}
                                reacting={reactingComplaint}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="card p-12 text-center">
                        <p className="text-4xl mb-3">📭</p>
                        <p className="text-lg font-heading font-bold text-parchment mb-1">No complaints yet</p>
                        <p className="text-sm text-parchment-muted">Be the first to report an issue with this project.</p>
                    </div>
                )}
            </div>
            )}
        </div>
    );
}

