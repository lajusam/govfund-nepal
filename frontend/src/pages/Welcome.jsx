import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { TubesBackground } from '../components/ui/tubes-background';

// ─── Counter badge (trust signal) ────────────────────────────────────────────
function TrustBadge({ icon, label, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
                background: 'rgba(255,255,255,0.10)',
                border:     '1px solid rgba(255,255,255,0.20)',
                backdropFilter: 'blur(8px)',
            }}
        >
            <span className="text-sm">{icon}</span>
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{label}</span>
        </motion.div>
    );
}

// ─── Main Welcome Page ────────────────────────────────────────────────────────
export default function Welcome() {
    const navigate = useNavigate();
    const [btnHovered, setBtnHovered] = useState(false);
    const [entered, setEntered] = useState(false);
    const { t } = useLanguage();

    const handleEnter = () => {
        setEntered(true);
        setTimeout(() => navigate('/home'), 520);
    };

    return (
        <AnimatePresence>
            {!entered && (
                <motion.div
                    key="welcome"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.04 }}
                    transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 overflow-hidden select-none"
                    style={{ zIndex: 9999 }}
                >
                    {/* ── 3D Tubes Interactive Background ── */}
                    <TubesBackground className="w-full h-full">
                        <div className="flex flex-col items-center justify-center w-full h-full px-6 text-center pointer-events-auto">

                            {/* Logo container */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.72, y: 24 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                                className="relative flex items-center justify-center mb-8"
                                style={{ width: 200, height: 200 }}
                            >
                                {/* Halo pulse */}
                                <motion.div
                                    className="absolute rounded-full"
                                    style={{
                                        width: 170, height: 170,
                                        background: 'radial-gradient(circle, rgba(255,184,28,0.35) 0%, transparent 70%)',
                                    }}
                                    animate={{ scale: [1, 1.22, 1], opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                                />

                                {/* Logo */}
                                <motion.img
                                    src="/logo.png"
                                    alt="GovFund Nepal"
                                    className="relative z-10 rounded-full object-contain"
                                    style={{
                                        width: 148,
                                        height: 148,
                                        filter: 'drop-shadow(0 0 28px rgba(255,184,28,0.70))',
                                    }}
                                    whileHover={{
                                        scale: 1.06,
                                        filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.35))',
                                    }}
                                    transition={{ duration: 0.35 }}
                                />
                            </motion.div>

                            {/* Brand name */}
                            <motion.div
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.75, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
                                className="mb-1"
                            >
                                <h1
                                    className="font-heading font-extrabold tracking-tight drop-shadow-[0_0_20px_rgba(0,0,0,1)]"
                                    style={{
                                        fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
                                        color: '#FFFFFF',
                                        lineHeight: 1.05,
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    GovFund
                                </h1>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.65, delay: 0.70, ease: [0.22, 1, 0.36, 1] }}
                                className="mb-10"
                            >
                                <span
                                    className="font-heading font-semibold tracking-[0.35em] uppercase drop-shadow-[0_0_20px_rgba(0,0,0,1)]"
                                    style={{
                                        fontSize: 'clamp(0.85rem, 2.5vw, 1.15rem)',
                                        color: 'rgba(255,255,255,0.55)',
                                        letterSpacing: '0.38em',
                                    }}
                                >
                                    Nepal
                                </span>
                            </motion.div>

                            {/* Tagline */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.75, delay: 0.90, ease: [0.22, 1, 0.36, 1] }}
                                className="mb-3"
                            >
                                <p
                                    className="font-heading font-bold drop-shadow-[0_0_20px_rgba(0,0,0,1)]"
                                    style={{
                                        fontSize: 'clamp(1.25rem, 3.5vw, 2rem)',
                                        color: '#FFFFFF',
                                        letterSpacing: '-0.01em',
                                        lineHeight: 1.25,
                                    }}
                                >
                                    {t('welcomeTagline1')}
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.75, delay: 1.05, ease: [0.22, 1, 0.36, 1] }}
                                className="mb-4"
                            >
                                <p
                                    className="font-heading font-bold drop-shadow-[0_0_20px_rgba(0,0,0,1)]"
                                    style={{
                                        fontSize: 'clamp(1.25rem, 3.5vw, 2rem)',
                                        color: '#FFFFFF',
                                        letterSpacing: '-0.01em',
                                        lineHeight: 1.25,
                                    }}
                                >
                                    {t('welcomeTagline2')}{' '}
                                    <span
                                        style={{
                                            background: 'linear-gradient(90deg, #FFB81C, #E09500)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                        }}
                                    >
                                        {t('welcomeTagline3')}
                                    </span>
                                </p>
                            </motion.div>

                            {/* Subtitle */}
                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.70, delay: 1.20, ease: [0.22, 1, 0.36, 1] }}
                                className="drop-shadow-md"
                                style={{
                                    color: 'rgba(255,255,255,0.70)',
                                    fontSize: 'clamp(0.8rem, 2vw, 1rem)',
                                    maxWidth: 380,
                                    lineHeight: 1.65,
                                    marginBottom: '2.5rem',
                                }}
                            >
                                {t('welcomeSubtitle')}
                            </motion.p>

                            {/* Primary CTA */}
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.75, delay: 1.42, ease: [0.22, 1, 0.36, 1] }}
                                className="mb-10 relative"
                            >
                                <motion.button
                                    onClick={handleEnter}
                                    onHoverStart={() => setBtnHovered(true)}
                                    onHoverEnd={() => setBtnHovered(false)}
                                    whileHover={{ scale: 1.06 }}
                                    whileTap={{ scale: 0.96 }}
                                    className="relative overflow-hidden font-heading font-bold rounded-2xl px-12 py-4 text-lg tracking-wide outline-none focus:outline-none"
                                    style={{
                                        background: btnHovered
                                            ? 'linear-gradient(135deg, #E09500 0%, #FFB81C 60%, #E09500 100%)'
                                            : 'linear-gradient(135deg, #FFB81C 0%, #E09500 100%)',
                                        color: '#1A160F',
                                        boxShadow: btnHovered
                                            ? '0 0 0 2px rgba(255,184,28,0.40), 0 20px 48px rgba(255,184,28,0.35), 0 4px 16px rgba(0,0,0,0.25)'
                                            : '0 8px 32px rgba(255,184,28,0.30), 0 2px 8px rgba(0,0,0,0.20)',
                                        transition: 'background 0.3s, box-shadow 0.3s',
                                        cursor: 'pointer',
                                        letterSpacing: '0.04em',
                                        fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                                    }}
                                >
                                    {/* Shimmer sweep */}
                                    <motion.span
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)',
                                        }}
                                        animate={btnHovered ? { x: ['-100%', '200%'] } : { x: '-100%' }}
                                        transition={{ duration: 0.55, ease: 'easeIn' }}
                                    />
                                    <span className="relative z-10 flex items-center gap-3">
                                        {t('letsExplore')}
                                        <motion.svg
                                            width="18" height="18" viewBox="0 0 24 24"
                                            fill="none" stroke="currentColor"
                                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                            animate={btnHovered ? { x: [0, 5, 0] } : { x: 0 }}
                                            transition={{ duration: 0.45, repeat: btnHovered ? Infinity : 0 }}
                                        >
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12 19" />
                                        </motion.svg>
                                    </span>
                                </motion.button>
                            </motion.div>

                            {/* Trust badges */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: 1.75 }}
                                className="flex flex-wrap justify-center gap-2"
                            >
                                <TrustBadge icon="⛓️" label={t('solanaBlockchainBadge')}  delay={1.80} />
                                <TrustBadge icon="🔐" label={t('immutableRecordsBadge')}  delay={1.90} />
                                <TrustBadge icon="🇳🇵" label={t('builtForNepal')}   delay={2.00} />
                            </motion.div>
                        </div>
                    </TubesBackground>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
