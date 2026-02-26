import React, { useState, useCallback } from 'react';

/**
 * IPFSDocumentLink — opens IPFS documents using gateway fallback.
 *
 * Problem: gateway.pinata.cloud only serves files pinned to YOUR Pinata account.
 *          Seed-data hashes or files pinned elsewhere cause ERR_ID:00016 timeout.
 *
 * Solution: Try multiple public gateways in order. If the first fails (HEAD check),
 *           fall back to the next. On click, open the first reachable gateway URL.
 */

const GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
    'https://w3s.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',   // Pinata last — only works for your pins
];

export function getIPFSGatewayUrl(hash, gatewayIndex = 0) {
    if (!hash) return '#';
    const gw = GATEWAYS[gatewayIndex] || GATEWAYS[0];
    return `${gw}${hash}`;
}

export default function IPFSDocumentLink({ ipfsHash, name, children }) {
    const [checking, setChecking] = useState(false);

    const openDocument = useCallback(async (e) => {
        e.preventDefault();
        if (!ipfsHash) return;

        setChecking(true);

        // Try each gateway with a quick HEAD request
        for (const gw of GATEWAYS) {
            const url = `${gw}${ipfsHash}`;
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000);

                const res = await fetch(url, {
                    method: 'HEAD',
                    mode: 'no-cors',   // public gateways may not send CORS headers for HEAD
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);

                // no-cors yields opaque response (status 0) — that still means the server responded
                if (res.ok || res.type === 'opaque' || res.status === 0) {
                    setChecking(false);
                    window.open(url, '_blank', 'noopener,noreferrer');
                    return;
                }
            } catch {
                // timeout or network error — try next gateway
            }
        }

        // If all HEAD checks fail/timeout, just open the first public gateway directly
        // (the browser can still load it even if HEAD from JS was blocked by CORS)
        setChecking(false);
        window.open(`${GATEWAYS[0]}${ipfsHash}`, '_blank', 'noopener,noreferrer');
    }, [ipfsHash]);

    if (children) {
        return (
            <a
                href={`${GATEWAYS[0]}${ipfsHash}`}
                onClick={openDocument}
                rel="noopener noreferrer"
            >
                {checking ? (
                    <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-golden/40 border-t-golden rounded-full animate-spin" />
                        Connecting to IPFS…
                    </span>
                ) : children}
            </a>
        );
    }

    return (
        <a
            href={`${GATEWAYS[0]}${ipfsHash}`}
            onClick={openDocument}
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-earth rounded-xl hover:bg-earth-light transition-colors group"
        >
            <div className="w-8 h-8 rounded-lg bg-golden/10 flex items-center justify-center text-golden text-sm">📎</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-parchment group-hover:text-golden transition-colors truncate">
                    {checking ? 'Connecting to IPFS…' : (name || 'IPFS Document')}
                </p>
                <p className="text-[10px] text-parchment-muted font-mono truncate">{ipfsHash}</p>
            </div>
            {checking ? (
                <span className="w-4 h-4 border-2 border-golden/40 border-t-golden rounded-full animate-spin flex-shrink-0" />
            ) : (
                <span className="text-parchment-muted text-xs">↗</span>
            )}
        </a>
    );
}
