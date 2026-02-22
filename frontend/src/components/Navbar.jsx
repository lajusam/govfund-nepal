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
        { to: '/home', label: t('home') },
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
                    <Link to="/home" className="flex items-center gap-3 group">
                        {/* Circular logo frame — golden-gradient ring + clipped logo image */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 40 40"
                            width="40"
                            height="40"
                            role="img"
                            aria-label="GovFund Nepal logo"
                            className="flex-shrink-0 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(255,184,28,0.70)]"
                            style={{ width: 'clamp(32px,5vw,40px)', height: 'clamp(32px,5vw,40px)' }}
                        >
                            <defs>
                                {/* Clip path — perfect circle */}
                                <clipPath id="nav-logo-clip">
                                    <circle cx="20" cy="20" r="17.5" />
                                </clipPath>
                                {/* Golden gradient ring */}
                                <linearGradient id="nav-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%"   stopColor="#FFB81C" />
                                    <stop offset="55%"  stopColor="#FAD980" />
                                    <stop offset="100%" stopColor="#8E6F3E" />
                                </linearGradient>
                                {/* Subtle inner glow on hover (filter) */}
                                <filter id="nav-logo-glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Ring border — gradient stroke circle */}
                            <circle
                                cx="20" cy="20" r="19"
                                fill="none"
                                stroke="url(#nav-ring-grad)"
                                strokeWidth="2"
                                opacity="0.90"
                            />

                            {/* Deep basalt fill behind logo so transparent PNGs look correct */}
                            <circle cx="20" cy="20" r="17.5" fill="#1A160F" />

                            {/* Logo image — clipped to circle, centered, 14 px inner padding (3px each side) */}
                            <image
                                href="/logo.png"
                                x="3" y="3"
                                width="34" height="34"
                                clipPath="url(#nav-logo-clip)"
                                preserveAspectRatio="xMidYMid meet"
                            />
                        </svg>

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
