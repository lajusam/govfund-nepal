import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import api from '../services/api';
import { getProject } from '../services/api';
import ComplaintCard from '../components/ComplaintCard';
import ComplaintForm from '../components/ComplaintForm';

export default function ComplaintPage() {
    const { projectId } = useParams();
    const { publicKey, signMessage } = useWallet();
    const [project, setProject] = useState(null);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingComplaint, setEditingComplaint] = useState(null);
    const [reacting, setReacting] = useState(false);

    const walletAddress = publicKey?.toBase58() || null;

    // Check if current user already has a complaint for this project
    const userComplaint = complaints.find(c => c.walletAddress === walletAddress);

    const fetchComplaints = useCallback(async () => {
        try {
            const res = await api.get(`/complaints/project/${projectId}`);
            setComplaints(res.data);
        } catch (err) {
            console.error('Failed to fetch complaints:', err);
        }
    }, [projectId]);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            getProject(projectId),
            api.get(`/complaints/project/${projectId}`).then(r => r.data).catch(() => []),
        ]).then(([p, c]) => {
            setProject(p);
            setComplaints(c);
            setLoading(false);
        });
    }, [projectId]);

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

    const handleComplaintSuccess = useCallback((result) => {
        setShowForm(false);
        setEditingComplaint(null);
        fetchComplaints();
    }, [fetchComplaints]);

    const handleEdit = useCallback((complaint) => {
        setEditingComplaint(complaint);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-golden/25 border-t-golden rounded-full animate-spin" />
            </div>
        );
    }

    if (!project) {
        return <div className="text-center py-20 text-parchment-muted text-lg">Project not found</div>;
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-parchment-muted mb-6">
                <Link to="/projects" className="hover:text-golden transition-colors">Projects</Link>
                <span>/</span>
                <Link to={`/project/${projectId}`} className="hover:text-golden transition-colors">{project.name}</Link>
                <span>/</span>
                <span className="text-parchment font-medium">Complaints</span>
            </div>

            {/* Header */}
            <div className="card p-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-heading font-bold text-parchment">Citizen Complaints</h1>
                        <p className="text-parchment-muted text-sm mt-1">
                            {project.name} — {complaints.length} complaint{complaints.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    {publicKey && !userComplaint && !showForm && (
                        <button
                            onClick={() => { setEditingComplaint(null); setShowForm(true); }}
                            className="btn-primary text-sm"
                        >
                            File a Complaint
                        </button>
                    )}
                    {publicKey && userComplaint && !showForm && (
                        <button
                            onClick={() => handleEdit(userComplaint)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm bg-earth border border-earth-border text-parchment-muted hover:text-golden hover:border-golden/30 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Your Complaint
                        </button>
                    )}
                </div>
            </div>

            {/* Complaint Form */}
            {showForm && (
                <div className="mb-8">
                    <ComplaintForm
                        projectId={projectId}
                        existingComplaint={editingComplaint}
                        onSuccess={handleComplaintSuccess}
                    />
                    <button
                        onClick={() => { setShowForm(false); setEditingComplaint(null); }}
                        className="mt-3 text-sm text-parchment-ghost hover:text-parchment-muted transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Complaints List */}
            {complaints.length > 0 ? (
                <div className="space-y-6">
                    {complaints.map(c => (
                        <ComplaintCard
                            key={c._id}
                            complaint={c}
                            walletAddress={walletAddress}
                            onReact={handleReact}
                            reacting={reacting}
                        />
                    ))}
                </div>
            ) : (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-earth-light flex items-center justify-center">
                        <svg className="w-8 h-8 text-parchment-ghost" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-heading font-bold text-parchment mb-2">No Complaints Yet</h3>
                    <p className="text-sm text-parchment-muted mb-4">
                        Be the first citizen to report an issue with this project.
                    </p>
                    {publicKey && !showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn-primary text-sm"
                        >
                            File a Complaint
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
