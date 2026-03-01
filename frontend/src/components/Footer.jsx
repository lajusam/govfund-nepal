import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-basalt border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gov-slate flex items-center justify-center">
                                <img src="/logo.png" alt="GovFund Nepal" className="w-6 h-6 object-contain rounded" />
                            </div>
                            <span className="font-heading font-bold text-xl text-white">GovFund Nepal</span>
                        </div>
                        <p className="text-white/60 text-sm max-w-md leading-relaxed">
                            A decentralized government fund transparency system built on Solana blockchain.
                            Making public spending transparent, immutable, and verifiable for every citizen of Nepal.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
                        <ul className="space-y-2">
                            {[
                                { to: '/dashboard', label: 'Dashboard' },
                                { to: '/projects', label: 'Projects' },
                                { to: '/admin', label: 'Admin Panel' },
                            ].map(link => (
                                <li key={link.to}>
                                    <Link to={link.to} className="text-white/60 hover:text-white text-sm transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Blockchain */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Blockchain</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="https://explorer.solana.com/?cluster=devnet" target="_blank" rel="noopener noreferrer"
                                    className="text-white/60 hover:text-white text-sm transition-colors">
                                    Solana Explorer
                                </a>
                            </li>
                            <li>
                                <a href="https://solana.com" target="_blank" rel="noopener noreferrer"
                                    className="text-white/60 hover:text-white text-sm transition-colors">
                                    Solana.com
                                </a>
                            </li>
                            <li>
                                <span className="inline-flex items-center gap-2 text-gov-amber text-xs mt-2">
                                    <span className="w-2 h-2 rounded-full bg-gov-green animate-pulse"></span>
                                    Devnet Connected
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-white/40 text-xs">
                        © 2026 GovFund Nepal. Built on Solana Blockchain. All transactions are publicly verifiable.
                    </p>
                    <p className="text-white/40 text-xs">
                        🇳🇵 For a transparent Nepal
                    </p>
                </div>
            </div>
        </footer>
    );
}
