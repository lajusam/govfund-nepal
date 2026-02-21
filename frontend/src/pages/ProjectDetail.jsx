import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProject, getFeedback, submitFeedback, formatNPR, getStatusColor, getStatusBg } from '../services/api';
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
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                    isActive ? 'bg-nepal-blue border-nepal-blue text-white animate-pulse' :
                                        'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                                }`}>
                                {isCompleted ? '✓' : i + 1}
                            </div>
                            {i < milestones.length - 1 && (
                                <div className={`w-0.5 h-12 ${isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                            )}
                        </div>
                        {/* Content */}
                        <div className="flex-1 pb-2">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm text-nepal-navy dark:text-white">{m.title}</h4>
                                <span className={`badge text-[10px] ${isCompleted ? 'badge-active' : isActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'badge-pending'
                                    }`}>
                                    {m.status}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{m.description}</p>
                            <p className="text-[10px] text-gray-400 mt-1">Updated: {new Date(m.updatedAt).toLocaleDateString()}</p>
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
                borderColor: '#DC143C',
                backgroundColor: 'rgba(220, 20, 60, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#DC143C',
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
                <div className="w-12 h-12 border-4 border-nepal-red/30 border-t-nepal-red rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!project) {
        return <div className="text-center py-20 text-gray-400 text-lg">Project not found</div>;
    }

    const p = project;
    const budgetPct = p.allocatedBudget > 0 ? ((p.releasedAmount / p.allocatedBudget) * 100).toFixed(1) : 0;
    const milestonePct = p.milestoneCount > 0 ? ((p.milestonesCompleted / p.milestoneCount) * 100).toFixed(0) : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <Link to="/projects" className="hover:text-nepal-red transition-colors">Projects</Link>
                <span>/</span>
                <span className="text-nepal-navy dark:text-white font-medium">{p.name}</span>
            </div>

            {/* Header */}
            <div className="card p-8 mb-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`badge ${p.status === 'Active' ? 'badge-active' : 'badge-completed'}`}>{p.status}</span>
                            <span className="text-sm text-gray-400">{p.province} → {p.district} → {p.sector}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-heading font-bold text-nepal-navy dark:text-white">{p.name}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <svg className="w-7 h-7 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Contractor</p>
                            <p className="font-semibold text-nepal-navy dark:text-white">{p.contractor}</p>
                        </div>
                    </div>
                </div>

                {/* Budget overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Total Budget</p>
                        <p className="text-xl font-heading font-bold text-nepal-navy dark:text-white">{formatNPR(p.totalBudget)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Allocated</p>
                        <p className="text-xl font-heading font-bold text-nepal-blue">{formatNPR(p.allocatedBudget)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Released</p>
                        <p className="text-xl font-heading font-bold text-nepal-red">{formatNPR(p.releasedAmount)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Completion</p>
                        <p className="text-xl font-heading font-bold text-nepal-gold">{milestonePct}%</p>
                    </div>
                </div>

                {/* Progress bars */}
                <div className="mt-6 space-y-3">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Fund Utilization</span>
                            <span className="font-semibold">{budgetPct}%</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill bg-gradient-to-r from-nepal-red to-nepal-gold" style={{ width: `${Math.min(budgetPct, 100)}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Milestones ({p.milestonesCompleted}/{p.milestoneCount})</span>
                            <span className="font-semibold">{milestonePct}%</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill bg-gradient-to-r from-green-400 to-green-600" style={{ width: `${milestonePct}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-sm text-gray-400">
                    Estimated Completion: <span className="font-medium text-nepal-navy dark:text-white">
                        {new Date(p.estimatedCompletion).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Milestones + Documents */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Milestones */}
                    <div className="card p-6">
                        <h3 className="font-heading font-bold text-lg text-nepal-navy dark:text-white mb-6">
                            Milestone Pipeline
                        </h3>
                        {p.milestones?.length > 0 ? (
                            <MilestoneTracker milestones={p.milestones} total={p.milestoneCount} />
                        ) : (
                            <p className="text-gray-400 text-sm">No milestones recorded yet</p>
                        )}
                    </div>

                    {/* Fund Release Chart */}
                    {releaseChartData && (
                        <div className="card p-6">
                            <h3 className="font-heading font-bold text-lg text-nepal-navy dark:text-white mb-4">
                                Fund Release Timeline
                            </h3>
                            <Line
                                data={releaseChartData}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: { display: false },
                                        tooltip: { callbacks: { label: (ctx) => formatNPR(ctx.raw) } },
                                    },
                                    scales: {
                                        y: { ticks: { callback: (v) => formatNPR(v) }, grid: { color: 'rgba(0,0,0,0.05)' } },
                                        x: { grid: { display: false } },
                                    },
                                }}
                            />
                        </div>
                    )}

                    {/* Fund Release Table */}
                    {p.fundReleases?.length > 0 && (
                        <div className="card p-6 overflow-x-auto">
                            <h3 className="font-heading font-bold text-lg text-nepal-navy dark:text-white mb-4">
                                Fund Release History
                            </h3>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 text-gray-500 font-medium">Date</th>
                                        <th className="text-left py-3 text-gray-500 font-medium">Amount</th>
                                        <th className="text-left py-3 text-gray-500 font-medium">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {p.fundReleases.map((r, i) => (
                                        <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="py-3 text-gray-600 dark:text-gray-300">{new Date(r.date).toLocaleDateString()}</td>
                                            <td className="py-3 font-semibold text-nepal-red">{formatNPR(r.amount)}</td>
                                            <td className="py-3 text-gray-600 dark:text-gray-300">{r.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Public Feedback */}
                    <div className="card p-6">
                        <h3 className="font-heading font-bold text-lg text-nepal-navy dark:text-white mb-4">
                            Public Reviews
                        </h3>
                        <form onSubmit={handleSubmitFeedback} className="mb-6 p-4 bg-nepal-stone dark:bg-nepal-charcoal rounded-xl">
                            <div className="flex items-center gap-4 mb-3">
                                <label className="text-sm text-gray-600 dark:text-gray-300">Rating:</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setNewFeedback(f => ({ ...f, rating: star }))}
                                            className={`text-xl ${star <= newFeedback.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
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
                                    <div key={i} className="p-4 bg-white dark:bg-nepal-charcoal rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm text-yellow-400">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</div>
                                            </div>
                                            <span className="text-xs text-gray-400">{new Date(f.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">{f.comment}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">No reviews yet. Be the first!</p>
                        )}
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-6">
                    {/* Documents */}
                    <div className="card p-6">
                        <h3 className="font-heading font-bold text-lg text-nepal-navy dark:text-white mb-4">
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
                                        className="flex items-center gap-3 p-3 bg-nepal-stone dark:bg-nepal-charcoal rounded-xl hover:bg-nepal-stone-dark dark:hover:bg-gray-800 transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-nepal-red/10 flex items-center justify-center text-nepal-red text-sm">📎</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-nepal-navy dark:text-white group-hover:text-nepal-red transition-colors truncate">{doc.name}</p>
                                            <p className="text-[10px] text-gray-400 font-mono truncate">{doc.ipfsHash}</p>
                                        </div>
                                        <span className="text-gray-400 text-xs">↗</span>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">No documents uploaded yet</p>
                        )}
                    </div>

                    {/* Budget Allocations */}
                    {p.budgetAllocations?.length > 0 && (
                        <div className="card p-6">
                            <h3 className="font-heading font-bold text-lg text-nepal-navy dark:text-white mb-4">
                                💰 Budget Allocations
                            </h3>
                            <div className="space-y-3">
                                {p.budgetAllocations.map((a, i) => (
                                    <div key={i} className="p-3 bg-nepal-stone dark:bg-nepal-charcoal rounded-xl">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-semibold text-nepal-navy dark:text-white">{formatNPR(a.amount)}</span>
                                            <span className="text-xs text-gray-400">{new Date(a.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">{a.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Solana Explorer */}
                    <div className="card p-6">
                        <h3 className="font-heading font-bold text-lg text-nepal-navy dark:text-white mb-4">
                            🔗 Blockchain
                        </h3>
                        <a
                            href="https://explorer.solana.com/?cluster=devnet"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 bg-nepal-stone dark:bg-nepal-charcoal rounded-xl hover:bg-nepal-stone-dark dark:hover:bg-gray-800 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 text-sm">⛓</div>
                            <div>
                                <p className="text-sm font-medium text-nepal-navy dark:text-white">View on Solana Explorer</p>
                                <p className="text-xs text-gray-400">Devnet Cluster</p>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
