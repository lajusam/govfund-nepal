import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { getAnalytics, formatNPR } from '../services/api';

// ── Animation variants ──
const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
    }),
};

const staggerContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i = 0) => ({
        opacity: 1,
        scale: 1,
        transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
    }),
};

const slideInLeft = {
    hidden: { opacity: 0, x: -60 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const slideInRight = {
    hidden: { opacity: 0, x: 60 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

// ── Animated counter ──
function AnimatedCounter({ value, label, icon, suffix = '' }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!value) return;
        let start = 0;
        const end = typeof value === 'string' ? parseFloat(value) : value;
        const duration = 2000;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [value]);

    const display = typeof value === 'string' && value.includes('.')
        ? count.toFixed(1) + suffix
        : count.toLocaleString() + suffix;

    return (
        <motion.div
            variants={scaleIn}
            className="relative group"
        >
            <div className="card p-6 text-center hover:-translate-y-2 transition-all duration-500 hover:border-golden/30 hover:shadow-golden-md">
                <motion.div
                    className="text-3xl mb-3"
                    whileHover={{ scale: 1.3, rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                >
                    {icon}
                </motion.div>
                <div className="text-2xl md:text-3xl font-heading font-bold text-parchment mb-1">
                    {display}
                </div>
                <div className="text-sm text-parchment-muted">{label}</div>
            </div>
        </motion.div>
    );
}

// ── Floating particle/decoration ──
function FloatingOrb({ className, delay = 0 }) {
    return (
        <motion.div
            className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
            animate={{
                y: [0, -30, 0, 20, 0],
                x: [0, 15, -10, 5, 0],
                scale: [1, 1.1, 0.95, 1.05, 1],
            }}
            transition={{
                duration: 8,
                repeat: Infinity,
                delay,
                ease: 'easeInOut',
            }}
        />
    );
}

// ── Nepal flag SVG animated ──
function NepalFlagDecor() {
    return (
        <motion.svg
            viewBox="0 0 100 120"
            className="w-24 h-28 opacity-10"
            initial={{ rotate: -5, scale: 0.9 }}
            animate={{ rotate: 5, scale: 1 }}
            transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        >
            <polygon points="0,0 100,30 0,60" fill="#DC143C" stroke="#003893" strokeWidth="3" />
            <polygon points="0,60 100,90 0,120" fill="#DC143C" stroke="#003893" strokeWidth="3" />
        </motion.svg>
    );
}

export default function Landing() {
    const [analytics, setAnalytics] = useState(null);
    const { scrollYProgress } = useScroll();
    const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

    useEffect(() => {
        getAnalytics().then(setAnalytics);
    }, []);

    const stats = analytics?.overview || {};

    return (
        <div className="overflow-hidden antialiased">
            {/* ══════════════════════════════════════════
                HERO SECTION — Kinetic Typography + Parallax
               ══════════════════════════════════════════ */}
            <section className="relative min-h-screen flex items-center overflow-hidden" style={{ minHeight: '100svh' }}>
                {/* ── Hero background image ── place file at frontend/public/hero-bg.jpg */}
                <div className="absolute inset-0 z-0">
                    <div
                        className="absolute inset-0 bg-basalt"
                        style={{
                            backgroundImage: `url('/hero-bg.jpg')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat',
                            /* Avoid iOS fixed-attachment scroll jank */
                            backgroundAttachment: 'local',
                            willChange: 'transform',
                        }}
                    />
                    {/* Cinematic gradient overlays — slightly lighter to let bg image show */}
                    <div className="absolute inset-0 bg-gradient-to-b from-basalt/88 via-basalt/55 to-basalt" />
                    <div className="absolute inset-0 bg-gradient-to-r from-basalt/70 via-transparent to-basalt/40" />
                    {/* Dhaka pattern grain */}
                    <div className="absolute inset-0 bg-dhaka-pattern opacity-[0.05]" />
                </div>

                {/* Floating orbs — increased opacity for clarity; z-[2] sits above bg overlays */}
                <FloatingOrb className="top-16 left-8 w-56 h-56 bg-golden/25 z-[2]" delay={0} />
                <FloatingOrb className="bottom-28 right-12 w-72 h-72 bg-bronze/18 z-[2]" delay={2.5} />
                <FloatingOrb className="top-1/2 left-1/3 w-40 h-40 bg-amber-glow/10 z-[2]" delay={4.5} />
                <FloatingOrb className="top-1/3 right-1/4 w-32 h-32 bg-golden/12 z-[2]" delay={1.5} />

                {/* Dot-grid overlay — subtle depth */}
                <div
                    className="absolute inset-0 z-[3] pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,184,28,0.15) 1px, transparent 1px)',
                        backgroundSize: '36px 36px',
                        opacity: 0.04,
                    }}
                />

                <motion.div
                    style={{ y: heroY, opacity: heroOpacity }}
                    className="relative z-[5] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
                >
                    {/* Left: Text content */}
                    <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        {/* Badge */}
                        <motion.div variants={fadeUp} custom={0}>
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-golden/10 border border-golden/25 rounded-full text-golden text-sm font-semibold mb-8 on-image-text-sm">
                                <motion.span
                                    className="w-2 h-2 rounded-full bg-golden"
                                    animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                Built on Solana Blockchain
                            </span>
                        </motion.div>

                        {/* Kinetic headline */}
                        <motion.h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold leading-[1.05] mb-8">
                            <motion.span
                                variants={fadeUp}
                                custom={1}
                                className="block text-parchment on-image-text"
                            >
                                Transparent
                            </motion.span>
                            <motion.span
                                variants={fadeUp}
                                custom={2}
                                className="block bg-gradient-to-r from-golden via-amber-glow to-golden-600 bg-clip-text text-transparent on-image-text"
                            >
                                Government Funds
                            </motion.span>
                            <motion.span
                                variants={fadeUp}
                                custom={3}
                                className="block text-parchment on-image-text"
                            >
                                For Nepal
                            </motion.span>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            variants={fadeUp}
                            custom={4}
                            className="text-lg md:text-xl text-parchment-dim max-w-lg mb-10 leading-relaxed on-image-text-sm"
                        >
                            Every rupee tracked. Every project verifiable. Corruption is
                                <span className="font-semibold text-amber-glow"> technically restricted </span>
                            by blockchain rules — not empty promises.
                        </motion.p>

                        {/* CTA buttons */}
                        <motion.div variants={fadeUp} custom={5} className="flex flex-wrap gap-4 mb-10">
                            <Link to="/dashboard">
                                <motion.button
                                    whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(255,184,28,0.40)' }}
                                    whileTap={{ scale: 0.97 }}
                                    className="btn-primary text-lg px-8 py-3"
                                >
                                    View Dashboard →
                                </motion.button>
                            </Link>
                            <Link to="/projects">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="btn-secondary text-lg px-8 py-3"
                                >
                                    Explore Projects
                                </motion.button>
                            </Link>
                        </motion.div>

                        {/* Trust badges */}
                        <motion.div variants={fadeUp} custom={6} className="flex flex-wrap items-center gap-6 text-sm text-parchment-muted">
                            {['Immutable Records', 'Public Verification', 'No Tampering'].map((text, i) => (
                                <motion.div
                                    key={text}
                                    className="flex items-center gap-2"
                                    whileHover={{ x: 4 }}
                                    transition={{ type: 'spring', stiffness: 300 }}
                                >
                                    <svg className="w-4 h-4 text-golden" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    {text}
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Right: Animated visual */}
                    <motion.div
                        variants={slideInRight}
                        initial="hidden"
                        animate="visible"
                        className="hidden lg:flex justify-center items-center"
                    >
                        <div className="relative">
                            {/* Glow ring — more visible for dark bg */}
                            <motion.div
                                className="absolute inset-0 scale-150 rounded-full bg-gradient-to-br from-golden/35 to-bronze/25 blur-3xl"
                                animate={{ scale: [1.4, 1.65, 1.4], rotate: [0, 180, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            />

                            {/* Main visual: Animated blockchain blocks */}
                            <motion.div
                                className="relative z-10 w-80 h-80 flex items-center justify-center"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                            >
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute"
                                        style={{
                                            transform: `rotate(${i * 60}deg) translateY(-120px)`,
                                        }}
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <motion.div
                                            className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-lg shadow-lg ${
                                                i % 2 === 0
                                                    ? 'bg-golden/10 border-golden/30 text-golden'
                                                    : 'bg-bronze/10 border-bronze/30 text-amber-glow'
                                            }`}
                                            whileHover={{ scale: 1.3 }}
                                        >
                                            {['🏗️', '💰', '📋', '🔐', '✅', '📊'][i]}
                                        </motion.div>
                                    </motion.div>
                                ))}

                                {/* Center stupa icon */}
                                <motion.div
                                    className="absolute z-10 w-24 h-24 rounded-2xl bg-gradient-to-br from-golden to-bronze flex items-center justify-center shadow-golden-lg"
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                                >
                                    <span className="text-4xl">🏛️</span>
                                </motion.div>
                            </motion.div>

                            {/* Nepal flag decorations */}
                            <div className="absolute -top-8 -right-8">
                                <NepalFlagDecor />
                            </div>
                            <div className="absolute -bottom-8 -left-8 rotate-180">
                                <NepalFlagDecor />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[5]"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <div className="w-6 h-10 rounded-full border-2 border-bronze/30 flex justify-center pt-2">
                        <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-golden"
                            animate={{ y: [0, 16, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                </motion.div>
            </section>

            {/* ══════════════════════════════════════════
                STATS SECTION — Scroll-triggered counters
               ══════════════════════════════════════════ */}
            <motion.section
                className="py-24 bg-earth relative overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={staggerContainer}
            >
                {/* Decorative line */}
                <motion.div
                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-golden via-bronze to-golden"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={fadeUp} className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-parchment mb-3">
                            Transparency at a Glance
                        </h2>
                        <p className="text-parchment-muted text-lg">
                            Real-time data from the Solana blockchain
                        </p>
                    </motion.div>

                    <motion.div
                        variants={staggerContainer}
                        className="grid grid-cols-2 md:grid-cols-4 gap-6"
                    >
                        <AnimatedCounter label="Total Budget" value={stats.totalBudget ? formatNPR(stats.totalBudget).replace('NPR ', '') : '0'} icon="💰" />
                        <AnimatedCounter label="Funds Released" value={stats.totalReleased ? formatNPR(stats.totalReleased).replace('NPR ', '') : '0'} icon="📤" />
                        <AnimatedCounter label="Active Projects" value={stats.activeProjects || 0} icon="🏗️" />
                        <AnimatedCounter label="Utilization Rate" value={stats.utilizationRate || '0'} icon="📊" suffix="%" />
                    </motion.div>
                </div>
            </motion.section>

            {/* ══════════════════════════════════════════
                HOW IT WORKS — Staggered card animation
               ══════════════════════════════════════════ */}
            <motion.section
                className="py-24 bg-basalt relative"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div variants={fadeUp} className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-parchment mb-3">
                            How It Works
                        </h2>
                        <p className="text-parchment-muted text-lg">
                            Blockchain-enforced transparency in 4 steps
                        </p>
                    </motion.div>

                    <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {[
                            {
                                step: '01', title: 'Project Created',
                                desc: 'Government creates a public project on the blockchain with full budget details.',
                                icon: '📋', color: 'from-golden/5 to-earth',
                            },
                            {
                                step: '02', title: 'Budget Allocated',
                                desc: 'Funds allocated from treasury. Cannot exceed declared total budget — enforced by smart contract.',
                                icon: '💵', color: 'from-bronze/8 to-earth',
                            },
                            {
                                step: '03', title: 'Funds Released',
                                desc: 'Every release recorded on-chain. Cannot exceed allocated amount. Tamper-proof history.',
                                icon: '🔓', color: 'from-earth-raised to-earth',
                            },
                            {
                                step: '04', title: 'Public Verification',
                                desc: 'Any citizen verifies transactions on Solana Explorer. Complete transparency, zero trust needed.',
                                icon: '✅', color: 'from-earth to-earth-light',
                            },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                custom={i}
                                whileHover={{ y: -12, transition: { duration: 0.3 } }}
                            >
                                <div className={`card p-8 text-center h-full bg-gradient-to-b ${item.color}`}>
                                    <motion.div
                                        className="text-5xl mb-5"
                                        whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        {item.icon}
                                    </motion.div>

                                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-golden/10 text-golden text-xs font-bold mb-3">
                                        {item.step}
                                    </div>

                                    <h3 className="font-heading font-bold text-lg mb-3 text-parchment">
                                        {item.title}
                                    </h3>

                                    <p className="text-sm text-parchment-muted leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </motion.section>

            {/* ══════════════════════════════════════════
                WHY BLOCKCHAIN — Split layout with animations
               ══════════════════════════════════════════ */}
            <motion.section
                className="py-24 bg-earth"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div variants={slideInLeft}>
                        <span className="text-sm font-semibold text-golden uppercase tracking-wider mb-3 block">
                            Why Blockchain?
                        </span>
                        <h2 className="text-3xl md:text-4xl font-heading font-bold text-parchment mb-6">
                            Corruption Cannot Survive On-Chain
                        </h2>
                        <p className="text-parchment-dim mb-8 leading-relaxed text-lg">
                            Traditional government budget tracking relies on centralized databases that can be
                            manipulated. Our system stores every financial transaction on the Solana blockchain —
                            immutable, transparent, and verifiable by any citizen.
                        </p>

                        <div className="space-y-4">
                            {[
                                { title: 'Immutable Ledger', desc: 'Once recorded, transactions cannot be altered or deleted' },
                                { title: 'Smart Contract Rules', desc: 'Budget limits enforced by code, not administrators' },
                                { title: 'Real-time Auditing', desc: 'Anyone can verify via Solana Explorer — no FOIA needed' },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-earth-light transition-colors"
                                    initial={{ opacity: 0, x: -30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.15, duration: 0.5 }}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-golden/10 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-golden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-parchment">{item.title}</h4>
                                        <p className="text-sm text-parchment-muted">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div variants={slideInRight} className="hidden lg:block">
                        <div className="relative">
                            {/* Terminal-style visual */}
                            <motion.div
                                className="bg-basalt rounded-2xl p-6 shadow-basalt-xl border border-earth-border"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span className="text-xs text-parchment-ghost ml-2">solana-explorer</span>
                                </div>
                                    <div className="font-mono text-sm space-y-2 text-parchment-dim">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <span className="text-green-400">$</span> solana confirm <span className="text-yellow-400">4xK9...mNpQ</span>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 1.0 }}
                                        className="text-green-400"
                                    >
                                        ✓ Transaction confirmed (finalized)
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 1.5 }}
                                    >
                                        <span className="text-parchment-ghost">Block:</span> 284,931,847
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 2.0 }}
                                    >
                                        <span className="text-parchment-ghost">Program:</span> <span className="text-golden">GovFNep...XXX</span>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 2.5 }}
                                    >
                                        <span className="text-parchment-ghost">Instruction:</span> allocateBudget
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 3.0 }}
                                    >
                                        <span className="text-parchment-ghost">Amount:</span> <span className="text-amber-glow">NPR 50,000,000</span>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 3.5 }}
                                        className="text-golden mt-2"
                                    >
                                        ⛓ Immutable. Transparent. Verified.
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* ══════════════════════════════════════════
                CTA SECTION — Full-bleed gradient
               ══════════════════════════════════════════ */}
            <motion.section
                className="relative py-28 overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.4 }}
            >
                {/* Gradient bg */}
                <div className="absolute inset-0 bg-gradient-to-r from-basalt via-earth to-basalt" />

                {/* Animated bg pattern */}
                <motion.div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,184,28,0.20) 1px, transparent 1px)',
                        backgroundSize: '30px 30px',
                    }}
                    animate={{ backgroundPosition: ['0px 0px', '30px 30px'] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />

                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <motion.h2
                        variants={fadeUp}
                        custom={0}
                        className="text-3xl md:text-5xl font-heading font-bold text-parchment mb-6"
                    >
                        Ready to explore
                        <br />
                        <span className="bg-gradient-to-r from-golden to-amber-glow bg-clip-text text-transparent">
                            transparent governance?
                        </span>
                    </motion.h2>

                    <motion.p
                        variants={fadeUp}
                        custom={1}
                        className="text-parchment-dim text-lg mb-10 max-w-2xl mx-auto"
                    >
                        Connect your Solana wallet and start verifying government spending in real-time.
                        Every transaction is on-chain and publicly auditable.
                    </motion.p>

                    <motion.div variants={fadeUp} custom={2}>
                        <Link to="/projects">
                            <motion.button
                                whileHover={{ scale: 1.05, boxShadow: '0 25px 50px rgba(255,184,28,0.45)' }}
                                whileTap={{ scale: 0.97 }}
                                className="btn-primary text-lg px-10 py-4"
                            >
                                Explore All Projects →
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>
            </motion.section>
        </div>
    );
}
