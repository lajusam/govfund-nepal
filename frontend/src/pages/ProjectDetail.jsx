import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProject, getFeedback, submitFeedback, formatNPR, getStatusColor, getStatusBg, getExplorerUrl, getAccountExplorerUrl } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

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
    const [project, setProject] = useState(null);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newFeedback, setNewFeedback] = useState({ rating: 5, comment: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        Promise.all([getProject(projectId), getFeedback(projectId)])
            .then(([p, f]) => { setProject(p); setFeedback(f); setLoading(false); });
    }, [projectId]);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-golden/25 border-t-golden rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!project) {
        return <div className="text-center py-20 text-parchment-muted text-lg">Project not found</div>;
    }

    const p = project;
    const budgetPct = p.allocatedBudget > 0 ? ((p.releasedAmount / p.allocatedBudget) * 100).toFixed(1) : 0;
    const milestonePct = p.milestoneCount > 0 ? ((p.milestonesCompleted / p.milestoneCount) * 100).toFixed(0) : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-parchment-muted mb-6">
                <Link to="/projects" className="hover:text-golden transition-colors">Projects</Link>
                <span>/</span>
                <span className="text-parchment font-medium">{p.name}</span>
            </div>

            {/* Header */}
            <div className="card p-8 mb-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`badge ${p.status === 'Active' ? 'badge-active' : 'badge-completed'}`}>{p.status}</span>
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
                            <p className="text-xs text-parchment-ghost">Contractor</p>
                            <p className="font-semibold text-parchment">{p.contractor}</p>
                        </div>
                    </div>
                </div>

                {/* Budget overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-xs text-parchment-ghost mb-1">Total Budget</p>
                        <p className="text-xl font-heading font-bold text-parchment">{formatNPR(p.totalBudget)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-parchment-ghost mb-1">Allocated</p>
                        <p className="text-xl font-heading font-bold text-amber-glow">{formatNPR(p.allocatedBudget)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-parchment-ghost mb-1">Released</p>
                        <p className="text-xl font-heading font-bold text-golden">{formatNPR(p.releasedAmount)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-parchment-ghost mb-1">Completion</p>
                        <p className="text-xl font-heading font-bold text-bronze-light">{milestonePct}%</p>
                    </div>
                </div>

                {/* Progress bars */}
                <div className="mt-6 space-y-3">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-parchment-muted">Fund Utilization</span>
                            <span className="font-semibold">{budgetPct}%</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill bg-gradient-to-r from-golden to-amber-glow" style={{ width: `${Math.min(budgetPct, 100)}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-parchment-muted">Milestones ({p.milestonesCompleted}/{p.milestoneCount})</span>
                            <span className="font-semibold">{milestonePct}%</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill bg-gradient-to-r from-bronze to-bronze-light" style={{ width: `${milestonePct}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-sm text-parchment-muted">
                    Estimated Completion: <span className="font-medium text-parchment">
                        {new Date(p.estimatedCompletion).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Milestones + Documents */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Milestones */}
                    <div className="card p-6">
                        <h3 className="font-heading font-bold text-lg text-parchment mb-6">
                            Milestone Pipeline
                        </h3>
                        {p.milestones?.length > 0 ? (
                            <MilestoneTracker milestones={p.milestones} total={p.milestoneCount} />
                        ) : (
                            <p className="text-parchment-muted text-sm">No milestones recorded yet</p>
                        )}
                    </div>

                    {/* Fund Release Chart */}
                    {releaseChartData && (
                        <div className="card p-6">
                            <h3 className="font-heading font-bold text-lg text-parchment mb-4">
                                Fund Release Timeline
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
                                Fund Release History
                            </h3>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-earth-border">
                                        <th className="text-left py-3 text-parchment-muted font-medium">Date</th>
                                        <th className="text-left py-3 text-parchment-muted font-medium">Amount</th>
                                        <th className="text-left py-3 text-parchment-muted font-medium hidden sm:table-cell">Description</th>
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
                            Public Reviews
                        </h3>
                        <form onSubmit={handleSubmitFeedback} className="mb-6 p-4 bg-earth rounded-xl">
                            <div className="flex items-center gap-4 mb-3">
                                <label className="text-sm text-parchment-muted">Rating:</label>
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
                                placeholder="Share your feedback on this project..."
                                value={newFeedback.comment}
                                onChange={e => setNewFeedback(f => ({ ...f, comment: e.target.value }))}
                                maxLength={500}
                                required
                            />
                            <button type="submit" disabled={submitting} className="btn-primary text-sm">
                                {submitting ? 'Submitting...' : 'Submit Review'}
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
                            <p className="text-sm text-parchment-muted">No reviews yet. Be the first!</p>
                        )}
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-6">
                    {/* Documents */}
                    <div className="card p-6">
                        <h3 className="font-heading font-bold text-lg text-parchment mb-4">
                            📄 Documents (IPFS)
                        </h3>
                        {p.documents?.length > 0 ? (
                            <div className="space-y-3">
                                {p.documents.map((doc, i) => (
                                    <a
                                        key={i}
                                        href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-earth rounded-xl hover:bg-earth-light transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-golden/10 flex items-center justify-center text-golden text-sm">📎</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-parchment group-hover:text-golden transition-colors truncate">{doc.name}</p>
                                            <p className="text-[10px] text-parchment-muted font-mono truncate">{doc.ipfsHash}</p>
                                        </div>
                                        <span className="text-parchment-muted text-xs">↗</span>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-parchment-muted">No documents uploaded yet</p>
                        )}
                    </div>

                    {/* Budget Allocations */}
                    {p.budgetAllocations?.length > 0 && (
                        <div className="card p-6">
                            <h3 className="font-heading font-bold text-lg text-parchment mb-4">
                                💰 Budget Allocations
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
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Solana On-Chain Info */}
                    <div className="card p-6">
                        <h3 className="font-heading font-bold text-lg text-parchment mb-4">
                            ⛓️ On-Chain Data
                        </h3>

                        {/* Project PDA */}
                        {p.pda && (
                            <div className="mb-4 p-3 bg-earth rounded-xl">
                                <p className="text-[10px] text-parchment-ghost uppercase tracking-wider mb-1">Project PDA (Devnet)</p>
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
                            const txList = [
                                ...(p.fundReleases || []).filter(r => r.txSignature).map(r => ({ sig: r.txSignature, label: `Released ${formatNPR(r.amount)}`, date: r.date, type: 'release' })),
                                ...(p.budgetAllocations || []).filter(a => a.txSignature).map(a => ({ sig: a.txSignature, label: `Allocated ${formatNPR(a.amount)}`, date: a.date, type: 'allocate' })),
                            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

                            return txList.length > 0 ? (
                                <div>
                                    <p className="text-[10px] text-parchment-ghost uppercase tracking-wider mb-3">Recent Transactions</p>
                                    <div className="space-y-2">
                                        {txList.map((tx, i) => (
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
                                </div>
                            ) : (
                                <p className="text-xs text-parchment-ghost mb-3">No on-chain transaction records yet.</p>
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
                                    <p className="text-sm font-medium text-parchment group-hover:text-golden transition-colors">Solana Explorer</p>
                                    <p className="text-xs text-parchment-muted">Devnet Cluster</p>
                                </div>
                                <svg className="w-4 h-4 ml-auto text-parchment-ghost group-hover:text-golden transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

