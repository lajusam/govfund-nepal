import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSolana } from '../context/WalletContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from './LanguageToggle';

export default function Navbar() {
    const { dark, toggle } = useTheme();
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
        <nav className="sticky top-0 z-50 glass border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nepal-red to-nepal-navy flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                        </div>
                        <div>
                            <span className="font-heading font-bold text-lg bg-gradient-to-r from-nepal-red to-nepal-navy bg-clip-text text-transparent">
                                GovFund
                            </span>
                            <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400 ml-1">Nepal</span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === link.to
                                        ? 'bg-nepal-red/10 text-nepal-red dark:bg-nepal-red/20'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
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

                        {/* Dark mode toggle */}
                        <button
                            onClick={toggle}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {dark ? (
                                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                </svg>
                            )}
                        </button>

                        {/* Admin badge */}
                        {isAdmin && (
                            <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-nepal-red/10 text-nepal-red border border-nepal-red/20">
                                Admin
                            </span>
                        )}

                        {/* Solana wallet button */}
                        <div className="hidden sm:block wallet-btn-wrapper">
                            <WalletMultiButton className="!bg-gradient-to-r !from-nepal-red !to-nepal-navy !rounded-xl !h-10 !text-sm !font-medium !shadow-lg hover:!shadow-xl !transition-shadow" />
                        </div>

                        {/* Mobile menu button */}
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
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
                                        ? 'bg-nepal-red/10 text-nepal-red'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="mt-2 px-4">
                            <WalletMultiButton className="!bg-gradient-to-r !from-nepal-red !to-nepal-navy !rounded-xl !w-full !h-10 !text-sm !font-medium" />
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
