import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-nepal-navy dark:bg-nepal-charcoal border-t border-nepal-navy-light dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nepal-red to-white/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                                </svg>
                            </div>
                            <span className="font-heading font-bold text-xl text-white">GovFund Nepal</span>
                        </div>
                        <p className="text-gray-400 text-sm max-w-md leading-relaxed">
                            A decentralized government fund transparency system built on Solana blockchain.
                            Making public spending transparent, immutable, and verifiable for every citizen of Nepal.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            {[
                                { to: '/dashboard', label: 'Dashboard' },
                                { to: '/projects', label: 'Projects' },
                                { to: '/admin', label: 'Admin Panel' },
                            ].map(link => (
                                <li key={link.to}>
                                    <Link to={link.to} className="text-gray-400 hover:text-nepal-red text-sm transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Blockchain */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Blockchain</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="https://explorer.solana.com/?cluster=devnet" target="_blank" rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-nepal-blue text-sm transition-colors">
                                    Solana Explorer ↗
                                </a>
                            </li>
                            <li>
                                <a href="https://solana.com" target="_blank" rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-nepal-blue text-sm transition-colors">
                                    Solana.com ↗
                                </a>
                            </li>
                            <li>
                                <span className="inline-flex items-center gap-2 text-green-400 text-xs mt-2">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                    Devnet Connected
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-xs">
                        © 2026 GovFund Nepal. Built on Solana Blockchain. All transactions are publicly verifiable.
                    </p>
                    <p className="text-gray-600 text-xs">
                        🇳🇵 For a transparent Nepal
                    </p>
                </div>
            </div>
        </footer>
    );
}
