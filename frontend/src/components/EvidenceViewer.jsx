import React, { useState, useCallback } from 'react';

const GATEWAYS = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
];

export function getEvidenceUrl(cid, gatewayIndex = 0) {
    if (!cid) return '#';
    return `${GATEWAYS[gatewayIndex] || GATEWAYS[0]}${cid}`;
}

export default function EvidenceViewer({ evidence }) {
    const [loadingCid, setLoadingCid] = useState(null);

    const openEvidence = useCallback(async (cid) => {
        if (!cid) return;
        setLoadingCid(cid);

        for (const gw of GATEWAYS) {
            const url = `${gw}${cid}`;
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                const res = await fetch(url, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
                clearTimeout(timeoutId);
                if (res.ok || res.type === 'opaque' || res.status === 0) {
                    setLoadingCid(null);
                    window.open(url, '_blank', 'noopener,noreferrer');
                    return;
                }
            } catch {
                // try next gateway
            }
        }

        setLoadingCid(null);
        window.open(`${GATEWAYS[0]}${cid}`, '_blank', 'noopener,noreferrer');
    }, []);

    if (!evidence || evidence.length === 0) {
        return null;
    }

    const isImage = (type) => type && (type.startsWith('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type));

    return (
        <div className="space-y-2">
            <p className="text-xs text-parchment-ghost uppercase tracking-wider mb-2">
                Evidence ({evidence.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {evidence.map((e, i) => (
                    <button
                        key={i}
                        onClick={() => openEvidence(e.cid)}
                        disabled={loadingCid === e.cid}
                        className="flex items-center gap-3 p-3 bg-earth rounded-xl hover:bg-earth-light transition-colors group text-left w-full"
                    >
                        <div className="w-8 h-8 rounded-lg bg-golden/10 border border-golden/20 flex items-center justify-center text-golden text-sm flex-shrink-0">
                            {loadingCid === e.cid ? (
                                <span className="w-4 h-4 border-2 border-golden/40 border-t-golden rounded-full animate-spin" />
                            ) : isImage(e.type) ? (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-parchment group-hover:text-golden transition-colors truncate">
                                {e.name || 'Evidence File'}
                            </p>
                            <p className="text-[10px] font-mono text-parchment-ghost truncate">
                                {e.cid.slice(0, 12)}...{e.cid.slice(-6)}
                            </p>
                        </div>
                        <svg className="w-4 h-4 text-parchment-ghost group-hover:text-golden transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                ))}
            </div>
        </div>
    );
}
