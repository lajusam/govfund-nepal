import React from 'react';
import EvidenceViewer from './EvidenceViewer';

const TYPE_COLORS = {
    'Budget Misuse':          'bg-red-900/25 border-red-500/30 text-red-400',
    'Project Delay':          'bg-amber-900/25 border-amber-500/30 text-amber-400',
    'Fake Progress Report':   'bg-orange-900/25 border-orange-500/30 text-orange-400',
    'Contractor Corruption':  'bg-rose-900/25 border-rose-500/30 text-rose-400',
    'Environmental Damage':   'bg-emerald-900/25 border-emerald-500/30 text-emerald-400',
    'Other':                  'bg-slate-900/25 border-slate-500/30 text-slate-400',
};

export default function ComplaintCard({ complaint, walletAddress, onReact, reacting }) {
    const score = (complaint.reactions?.support || 0) - (complaint.reactions?.disagree || 0);
    const isOwner = walletAddress && complaint.walletAddress === walletAddress;
    const isPublicInvestigation = (complaint.reactions?.support || 0) > 50;

    const userVote = walletAddress
        ? complaint.voters?.find(v => v.walletAddress === walletAddress)?.reaction
        : null;

    const shortWallet = complaint.walletAddress
        ? `${complaint.walletAddress.slice(0, 4)}...${complaint.walletAddress.slice(-4)}`
        : 'Anonymous';

    const typeColor = TYPE_COLORS[complaint.complaintType] || TYPE_COLORS['Other'];

    return (
        <div className="card p-4 md:p-6 relative">
            {/* Public Investigation Badge */}
            {isPublicInvestigation && (
                <div className="absolute -top-3 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-900/40 border border-red-500/40 text-red-400 text-xs font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Public Investigation
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    {/* Complaint Type Badge */}
                    {complaint.complaintType && (
                        <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border mb-2 ${typeColor}`}>
                            {complaint.complaintType}
                        </span>
                    )}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-mono bg-earth px-2 py-0.5 rounded text-parchment-ghost">
                            {shortWallet}
                        </span>
                        {isOwner && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-golden/15 border border-golden/25 text-golden font-medium">
                                Your Complaint
                            </span>
                        )}
                        <span className="text-[10px] text-parchment-ghost">
                            {new Date(complaint.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric'
                            })}
                        </span>
                    </div>
                    <h3 className="text-lg font-heading font-bold text-parchment">{complaint.title}</h3>
                </div>

                {/* Score */}
                <div className={`flex flex-col items-center ml-4 px-3 py-2 rounded-xl ${
                    score > 0 ? 'bg-golden/10 border border-golden/20' :
                    score < 0 ? 'bg-red-900/20 border border-red-500/20' :
                    'bg-earth border border-earth-border'
                }`}>
                    <span className={`text-lg font-bold ${
                        score > 0 ? 'text-golden' : score < 0 ? 'text-red-400' : 'text-parchment-ghost'
                    }`}>{score > 0 ? '+' : ''}{score}</span>
                    <span className="text-[9px] text-parchment-ghost uppercase">Score</span>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-parchment-dim leading-relaxed mb-4 whitespace-pre-wrap">
                {complaint.description}
            </p>

            {/* Evidence */}
            {complaint.evidence?.length > 0 && (
                <div className="mb-4">
                    <EvidenceViewer evidence={complaint.evidence} />
                </div>
            )}

            {/* Reactions */}
            <div className="flex items-center gap-3 pt-4 border-t border-earth-border">
                <button
                    onClick={() => onReact(complaint._id, 'support')}
                    disabled={reacting}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                        userVote === 'support'
                            ? 'bg-green-900/30 border border-green-500/40 text-green-400'
                            : 'bg-earth hover:bg-earth-light border border-earth-border text-parchment-muted hover:text-green-400'
                    }`}
                >
                    <span>👍</span>
                    <span className="font-semibold">{complaint.reactions?.support || 0}</span>
                    <span className="hidden sm:inline text-xs">Support</span>
                </button>

                <button
                    onClick={() => onReact(complaint._id, 'disagree')}
                    disabled={reacting}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                        userVote === 'disagree'
                            ? 'bg-red-900/30 border border-red-500/40 text-red-400'
                            : 'bg-earth hover:bg-earth-light border border-earth-border text-parchment-muted hover:text-red-400'
                    }`}
                >
                    <span>👎</span>
                    <span className="font-semibold">{complaint.reactions?.disagree || 0}</span>
                    <span className="hidden sm:inline text-xs">Disagree</span>
                </button>

                <button
                    onClick={() => onReact(complaint._id, 'investigation')}
                    disabled={reacting}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                        userVote === 'investigation'
                            ? 'bg-amber-900/30 border border-amber-500/40 text-amber-400'
                            : 'bg-earth hover:bg-earth-light border border-earth-border text-parchment-muted hover:text-amber-400'
                    }`}
                >
                    <span>⚠️</span>
                    <span className="font-semibold">{complaint.reactions?.investigation || 0}</span>
                    <span className="hidden sm:inline text-xs">Investigation</span>
                </button>
            </div>
        </div>
    );
}
