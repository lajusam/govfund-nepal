import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSolana } from '../context/WalletContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';

export default function Navbar() {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { publicKey } = useWallet();
    const { isAdmin } = useSolana();
    const { t } = useLanguage();

    const NAV_LINKS = [
        { to: '/home', label: t('home') },
        { to: '/dashboard', label: t('dashboard') },
        { to: '/projects', label: t('projects') },
    ];

    const links = isAdmin
        ? [...NAV_LINKS, { to: '/admin', label: t('admin') }]
        : NAV_LINKS;

    return (
        <nav className="sticky top-0 z-50 nav-glass">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/home" className="flex items-center gap-3 group">
                        <img
                            src="/logo.png"
                            alt="GovFund Nepal"
                            className="flex-shrink-0 rounded-full object-contain transition-all duration-300 group-hover:brightness-110"
                            style={{
                                width: 'clamp(32px,5vw,40px)',
                                height: 'clamp(32px,5vw,40px)',
                            }}
                        />
                        <div>
                            <span className="font-heading font-bold text-lg text-white">
                                GovFund
                            </span>
                            <span className="hidden sm:inline text-xs text-white/50 ml-1">Nepal</span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                    location.pathname === link.to
                                        ? 'bg-white/15 text-white border border-white/25'
                                        : 'text-white/75 hover:bg-white/10 hover:text-white'
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
                            <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gov-amber/20 text-gov-amber border border-gov-amber/35">
                                Admin
                            </span>
                        )}

                        {/* Solana wallet button */}
                        <div className="hidden sm:block">
                            <WalletMultiButton />
                        </div>

                        {/* Mobile menu toggle */}
                        <button
                            className="md:hidden p-2 rounded-md text-white hover:bg-white/10 transition-colors"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle menu"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                {mobileOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden pb-4 pt-1 border-t border-white/10 animate-slide-up">
                        {links.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setMobileOpen(false)}
                                className={`block px-4 py-3 rounded-md text-sm font-medium transition-colors my-0.5 ${
                                    location.pathname === link.to
                                        ? 'bg-white/15 text-white border border-white/20'
                                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="mt-3 px-1">
                            <WalletMultiButton className="!w-full" />
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
