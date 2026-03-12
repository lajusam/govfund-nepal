import React, { useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import api from '../services/api';

export default function ComplaintForm({ projectId, onSuccess, existingComplaint }) {
    const { publicKey, signMessage } = useWallet();
    const [title, setTitle] = useState(existingComplaint?.title || '');
    const [description, setDescription] = useState(existingComplaint?.description || '');
    const [evidence, setEvidence] = useState(existingComplaint?.evidence || []);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const isEditing = !!existingComplaint;

    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        if (!publicKey || !signMessage) {
            setError('Please connect your wallet first');
            return;
        }

        setUploading(true);
        setError('');

        for (const file of files) {
            if (file.size > 50 * 1024 * 1024) {
                setError(`File ${file.name} exceeds 50MB limit`);
                continue;
            }

            try {
                // Sign message for auth
                const message = `GovFund Evidence Upload: ${Date.now()}`;
                const messageBytes = new TextEncoder().encode(message);
                const signatureBytes = await signMessage(messageBytes);
                const signature = bs58.encode(signatureBytes);

                const formData = new FormData();
                formData.append('file', file);
                formData.append('projectId', projectId);

                const res = await api.post('/ipfs/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'x-wallet-address': publicKey.toBase58(),
                        'x-wallet-signature': signature,
                        'x-wallet-message': message,
                    },
                    timeout: 60000,
                });

                setEvidence(prev => [...prev, {
                    cid: res.data.ipfsHash,
                    name: file.name,
                    type: file.type || 'document',
                }]);
            } catch (err) {
                console.error('Upload failed:', err);
                setError(`Failed to upload ${file.name}: ${err.response?.data?.error || err.message}`);
            }
        }

        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeEvidence = (index) => {
        setEvidence(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!publicKey || !signMessage) {
            setError('Please connect your wallet to submit a complaint');
            return;
        }

        if (title.length < 5) {
            setError('Title must be at least 5 characters');
            return;
        }
        if (description.length < 10) {
            setError('Description must be at least 10 characters');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const message = `GovFund Complaint: ${projectId}:${Date.now()}`;
            const messageBytes = new TextEncoder().encode(message);
            const signatureBytes = await signMessage(messageBytes);
            const signature = bs58.encode(signatureBytes);

            const headers = {
                'x-wallet-address': publicKey.toBase58(),
                'x-wallet-signature': signature,
                'x-wallet-message': message,
            };

            const payload = { projectId, title, description, evidence };
            let result;

            if (isEditing) {
                const res = await api.put(`/complaints/edit/${existingComplaint._id}`, payload, { headers });
                result = res.data;
            } else {
                const res = await api.post('/complaints/create', payload, { headers });
                result = res.data;
            }

            setTitle('');
            setDescription('');
            setEvidence([]);
            if (onSuccess) onSuccess(result);
        } catch (err) {
            const msg = err.response?.data?.error || err.message;
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            <h3 className="font-heading font-bold text-lg text-parchment">
                {isEditing ? 'Edit Complaint' : 'File a Complaint'}
            </h3>

            {!publicKey && (
                <div className="p-3 rounded-xl bg-amber-900/20 border border-amber-500/30 text-amber-400 text-sm">
                    Connect your wallet to submit a complaint
                </div>
            )}

            {error && (
                <div className="p-3 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm text-parchment-muted mb-1">Title</label>
                <input
                    type="text"
                    className="input-field"
                    placeholder="Brief title of the complaint..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={200}
                    required
                />
                <p className="text-[10px] text-parchment-ghost mt-1">{title.length}/200</p>
            </div>

            <div>
                <label className="block text-sm text-parchment-muted mb-1">Description</label>
                <textarea
                    className="input-field"
                    rows={5}
                    placeholder="Describe the irregularity or corruption you observed..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    maxLength={5000}
                    required
                />
                <p className="text-[10px] text-parchment-ghost mt-1">{description.length}/5000</p>
            </div>

            {/* Evidence Upload */}
            <div>
                <label className="block text-sm text-parchment-muted mb-2">Evidence Documents</label>
                <div className="flex items-center gap-3">
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm cursor-pointer transition-all ${
                        uploading ? 'bg-earth border border-earth-border text-parchment-ghost' :
                        'bg-golden/10 border border-golden/25 text-golden hover:bg-golden/20'
                    }`}>
                        {uploading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-golden/40 border-t-golden rounded-full animate-spin" />
                                Uploading to IPFS...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Upload Evidence
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            multiple
                            onChange={handleFileUpload}
                            disabled={uploading || !publicKey}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.zip,.txt,.csv"
                        />
                    </label>
                    <span className="text-[10px] text-parchment-ghost">Max 50MB per file, 10 files max</span>
                </div>

                {/* Evidence List */}
                {evidence.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {evidence.map((e, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 bg-earth rounded-lg">
                                <div className="w-6 h-6 rounded bg-golden/10 flex items-center justify-center text-golden text-xs">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-parchment truncate">{e.name}</p>
                                    <p className="text-[10px] font-mono text-parchment-ghost">{e.cid.slice(0, 16)}...</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeEvidence(i)}
                                    className="text-red-400 hover:text-red-300 text-sm p-1"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={submitting || !publicKey}
                className="btn-primary w-full text-sm"
            >
                {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-basalt/40 border-t-basalt rounded-full animate-spin" />
                        {isEditing ? 'Updating...' : 'Submitting...'}
                    </span>
                ) : (
                    isEditing ? 'Update Complaint' : 'Submit Complaint'
                )}
            </button>
        </form>
    );
}
