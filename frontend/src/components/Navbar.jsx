import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSolana } from '../context/WalletContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from './LanguageToggle';

export default function Navbar() {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { publicKey } = useWallet();
    const { isAdmin } = useSolana();
    const { t } = useLanguage();

    const NAV_LINKS = [
        { to: '/', label: t('home') },
        { to: '/dashboard', label: t('dashboard') },
        { to: '/projects', label: t('projects') },
    ];

    // Build links dynamically - show Admin only when admin wallet connected
    const links = isAdmin
        ? [...NAV_LINKS, { to: '/admin', label: t('admin') }]
        : NAV_LINKS;

    return (
        <nav className="sticky top-0 z-50 nav-glass">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-golden to-bronze flex items-center justify-center shadow-golden-sm group-hover:shadow-golden-md transition-shadow">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                        </div>
                        <div>
                            <span className="font-heading font-bold text-lg bg-gradient-to-r from-golden to-amber-glow bg-clip-text text-transparent">
                                GovFund
                            </span>
                            <span className="hidden sm:inline text-xs text-parchment-ghost ml-1">Nepal</span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === link.to
                                        ? 'bg-golden/10 text-golden border border-golden/20'
                                        : 'text-parchment-muted hover:bg-earth-light hover:text-amber-glow'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {/* Language toggle */}
                        <div className="hidden sm:block">
                            <LanguageToggle />
                        </div>

                        {/* Admin badge */}
                        {isAdmin && (
                            <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-golden/10 text-golden border border-golden/25">
                                Admin
                            </span>
                        )}

                        {/* Solana wallet button */}
                        <div className="hidden sm:block wallet-btn-wrapper">
                            <WalletMultiButton className="!bg-gradient-to-r !from-golden !to-bronze !text-basalt !font-bold !rounded-xl !h-10 !text-sm !shadow-golden-sm hover:!shadow-golden-md !transition-shadow" />
                        </div>

                        {/* Mobile menu button */}
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-earth-light"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {mobileOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden pb-4 animate-slide-up">
                        {links.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMobileOpen(false)}
                                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === link.to
                                        ? 'bg-golden/10 text-golden border border-golden/20'
                                        : 'text-parchment-muted hover:bg-earth-light hover:text-amber-glow'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="mt-2 px-4">
                            <WalletMultiButton className="!bg-gradient-to-r !from-golden !to-bronze !text-basalt !font-bold !rounded-xl !w-full !h-10 !text-sm" />
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
