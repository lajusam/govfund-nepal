import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useInView,
} from 'framer-motion';
import { getAnalytics } from '../services/api';

/* ═══════════════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════════════ */
const EASE = [0.22, 1, 0.36, 1];

/* ═══════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════ */
const fadeUp = {
    hidden:  { opacity: 0, y: 48, filter: 'blur(6px)' },
    visible: (i = 0) => ({
        opacity: 1, y: 0, filter: 'blur(0px)',
        transition: { duration: 0.85, delay: i * 0.11, ease: EASE },
    }),
};

const fadeIn = {
    hidden:  { opacity: 0 },
    visible: (i = 0) => ({
        opacity: 1,
        transition: { duration: 0.7, delay: i * 0.1, ease: EASE },
    }),
};

const stagger = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

/* ═══════════════════════════════════════════════════════════
   SPLIT TEXT — per-character reveal
   ═══════════════════════════════════════════════════════════ */
function SplitText({ text, delay = 0, className }) {
    return (
        <motion.span
            className={className}
            initial="hidden"
            animate="visible"
            variants={stagger}
            aria-label={text}
        >
            {text.split('').map((ch, i) => (
                <motion.span
                    key={i}
                    style={{ display: 'inline-block' }}
                    variants={{
                        hidden:  { opacity: 0, y: 64, rotateX: -40 },
                        visible: {
                            opacity: 1, y: 0, rotateX: 0,
                            transition: { duration: 0.72, delay: delay + i * 0.027, ease: EASE },
                        },
                    }}
                >
                    {ch === ' ' ? '\u00A0' : ch}
                </motion.span>
            ))}
        </motion.span>
    );
}

/* ═══════════════════════════════════════════════════════════
   CUSTOM CURSOR
   ═══════════════════════════════════════════════════════════ */
function CustomCursor() {
    const dotRef  = useRef(null);
    const ringRef = useRef(null);
    const pos     = useRef({ x: 0, y: 0 });
    const ringPos = useRef({ x: 0, y: 0 });
    const raf     = useRef(null);

    useEffect(() => {
        const onMove = (e) => { pos.current = { x: e.clientX, y: e.clientY }; };
        const enter  = () => ringRef.current?.classList.add('hovering');
        const leave  = () => ringRef.current?.classList.remove('hovering');

        const els = document.querySelectorAll('a, button, [data-cursor]');
        els.forEach(el => { el.addEventListener('mouseenter', enter); el.addEventListener('mouseleave', leave); });
        window.addEventListener('mousemove', onMove);

        const loop = () => {
            if (dotRef.current) {
                dotRef.current.style.left = pos.current.x + 'px';
                dotRef.current.style.top  = pos.current.y + 'px';
            }
            if (ringRef.current) {
                ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.12;
                ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.12;
                ringRef.current.style.left = ringPos.current.x + 'px';
                ringRef.current.style.top  = ringPos.current.y + 'px';
            }
            raf.current = requestAnimationFrame(loop);
        };
        raf.current = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('mousemove', onMove);
            els.forEach(el => { el.removeEventListener('mouseenter', enter); el.removeEventListener('mouseleave', leave); });
            cancelAnimationFrame(raf.current);
        };
    }, []);

    return (
        <>
            <div id="cursor-dot"  ref={dotRef}  />
            <div id="cursor-ring" ref={ringRef} />
        </>
    );
}

/* ═══════════════════════════════════════════════════════════
   NOISE GRAIN OVERLAY
   ═══════════════════════════════════════════════════════════ */
function Grain() {
    return <div className="noise-overlay" aria-hidden="true" />;
}

/* ═══════════════════════════════════════════════════════════
   FLOATING AMBIENT ORB
   ═══════════════════════════════════════════════════════════ */
function Orb({ style, color, blur = 120, size = 400, delay = 0 }) {
    return (
        <motion.div
            aria-hidden="true"
            style={{
                position: 'absolute',
                borderRadius: '50%',
                width: size,
                height: size,
                background: color,
                filter: `blur(${blur}px)`,
                pointerEvents: 'none',
                ...style,
            }}
            animate={{ y: [0, -28, 10, -16, 0], x: [0, 16, -10, 8, 0], scale: [1, 1.07, 0.96, 1.04, 1] }}
            transition={{ duration: 12, repeat: Infinity, delay, ease: 'easeInOut' }}
        />
    );
}

/* ═══════════════════════════════════════════════════════════
   ANIMATED STAT COUNTER
   ═══════════════════════════════════════════════════════════ */
function StatCard({ value, label, prefix = '', suffix = '', accent = '#0A5FFF' }) {
    const [count, setCount] = useState(0);
    const ref    = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });

    useEffect(() => {
        if (!inView || !value) return;
        const end  = parseFloat(value) || 0;
        let   cur  = 0;
        const step = end / 60;
        const id   = setInterval(() => {
            cur += step;
            if (cur >= end) { setCount(end); clearInterval(id); }
            else setCount(Math.floor(cur));
        }, 26);
        return () => clearInterval(id);
    }, [inView, value]);

    const display = String(value).includes('.') ? count.toFixed(1) : count.toLocaleString();

    return (
        <motion.div ref={ref} variants={fadeUp} className="relative group">
            <div
                className="card p-8 text-center relative overflow-hidden cursor-default"
                style={{ transition: 'border-color 0.4s, box-shadow 0.4s, transform 0.4s' }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = accent + '50';
                    e.currentTarget.style.boxShadow   = `0 0 40px ${accent}20, 0 20px 60px rgba(0,0,0,0.4)`;
                    e.currentTarget.style.transform   = 'translateY(-6px)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                    e.currentTarget.style.boxShadow   = '';
                    e.currentTarget.style.transform   = '';
                }}
            >
                <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}14 0%, transparent 65%)` }}
                />
                <div className="text-4xl md:text-5xl font-display font-extrabold mb-2 relative tracking-tight"
                    style={{ color: accent }}>
                    {prefix}{display}{suffix}
                </div>
                <div className="text-xs font-mono tracking-[0.18em] uppercase" style={{ color: '#7A7A8C' }}>
                    {label}
                </div>
            </div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════
   SCROLL-REVEAL SECTION WRAPPER
   ═══════════════════════════════════════════════════════════ */
function Section({ children, className = '' }) {
    return (
        <motion.section
            className={className}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
        >
            {children}
        </motion.section>
    );
}

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════ */
export default function Landing() {
    const [analytics, setAnalytics] = useState(null);
    const wrapRef = useRef(null);

    const { scrollYProgress } = useScroll({ target: wrapRef, offset: ['start start', 'end end'] });
    const heroY  = useTransform(scrollYProgress, [0, 0.18], [0, -60]);
    const heroOp = useTransform(scrollYProgress, [0, 0.2],  [1, 0]);
    const heroSc = useTransform(scrollYProgress, [0, 0.18], [1, 0.97]);
    const smoothY = useSpring(heroY, { stiffness: 80, damping: 25 });

    useEffect(() => { getAnalytics().then(setAnalytics); }, []);
    const stats = analytics?.overview || {};

    const marqueeWords = [
        'SOLANA BLOCKCHAIN', 'IMMUTABLE RECORDS', 'ZERO CORRUPTION',
        'REAL-TIME AUDITING', 'CITIZEN POWER', 'NEPAL TRANSPARENCY',
        'SMART CONTRACTS', 'PUBLIC LEDGER', 'OPEN SOURCE', 'DEVNET LIVE',
    ];

    return (
        <div ref={wrapRef} className="relative bg-white dark:bg-[#060608]">
            <Grain />

            {/* ─────────────────────────────────────────────
                HERO
                ───────────────────────────────────────────── */}
            <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">

                {/* Dot grid */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
                        backgroundSize: '44px 44px',
                    }}
                />

                {/* Vignette */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, #060608 100%)' }}
                />

                {/* Orbs */}
                <Orb color="rgba(10,95,255,0.22)"  size={550} blur={130} style={{ top: '-8%',  left: '-10%' }} delay={0} />
                <Orb color="rgba(255,26,60,0.14)"  size={480} blur={120} style={{ bottom: '-5%', right: '-8%' }} delay={3} />
                <Orb color="rgba(232,184,75,0.08)" size={320} blur={100} style={{ top: '40%', left: '42%' }}   delay={6} />

                {/* Animated scanline */}
                <motion.div
                    aria-hidden="true"
                    className="absolute left-0 right-0 h-px pointer-events-none"
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(10,95,255,0.5), transparent)',
                        top: '35%',
                    }}
                    animate={{ opacity: [0, 0.55, 0], y: [0, 180, 380] }}
                    transition={{ duration: 6, repeat: Infinity, delay: 2, ease: 'easeInOut' }}
                />

                {/* Main content with parallax */}
                <motion.div
                    style={{ y: smoothY, opacity: heroOp, scale: heroSc }}
                    className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-10 pt-28 pb-16"
                >
                    {/* Live badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
                        className="mb-10"
                    >
                        <span className="badge-live">
                            <motion.span
                                className="w-1.5 h-1.5 rounded-full inline-block"
                                style={{ background: '#0A5FFF' }}
                                animate={{ opacity: [1, 0.2, 1], scale: [1, 1.6, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            &nbsp;Live on Solana Devnet
                        </span>
                    </motion.div>

                    {/* Giant headline */}
                    <div
                        className="mb-3"
                        style={{ perspective: '1000px' }}
                    >
                        <div
                            className="font-display font-extrabold leading-[0.88] tracking-[-0.03em] text-white select-none"
                            style={{ fontSize: 'clamp(2rem, 4.5vw, 4.5rem)' }}
                        >
                            <div style={{ overflow: 'hidden', lineHeight: 1 }}>
                                <SplitText text="RADICAL" delay={0.05} />
                            </div>
                            <div style={{ overflow: 'hidden', lineHeight: 1 }}>
                                <SplitText text="TRANSPARENCY" delay={0.18} />
                            </div>
                            <div style={{ overflow: 'hidden', lineHeight: 1 }}>
                                <motion.span
                                    className="font-display font-extrabold"
                                    style={{
                                        background: 'linear-gradient(90deg, #0A5FFF 0%, #5B8FFF 40%, #FF1A3C 80%, #FF6B6B 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        display: 'inline-block',
                                    }}
                                    initial={{ opacity: 0, y: 80 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.9, delay: 0.55, ease: EASE }}
                                >
                                    FOR NEPAL
                                </motion.span>
                            </div>
                        </div>
                    </div>

                    {/* Glow rule */}
                    <motion.div
                        className="glow-divider-blue mb-10"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        style={{ originX: 0 }}
                        transition={{ duration: 1.1, delay: 0.8, ease: EASE }}
                    />

                    {/* Subtitle + CTAs */}
                    <div className="flex flex-col lg:flex-row lg:items-end gap-10 lg:gap-24">
                        <motion.p
                            initial={{ opacity: 0, y: 32 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.95, ease: EASE }}
                            className="max-w-md text-lg leading-relaxed"
                            style={{ color: '#A0A0B0', fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                            Every rupee tracked. Every project verifiable.
                            Blockchain rules — not empty promises.{' '}
                            <span className="text-white font-medium">Built on Solana.</span>
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 32 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.05, ease: EASE }}
                            className="flex items-center gap-4 flex-shrink-0"
                        >
                            <Link to="/dashboard">
                                <button className="btn-electric">
                                    View Dashboard &nbsp;
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ display: 'inline' }}>
                                        <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </Link>
                            <Link to="/projects">
                                <button className="btn-ghost">
                                    Explore Projects
                                </button>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Proof row */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1.3 }}
                        className="flex flex-wrap items-center gap-8 mt-16 pt-10"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        {[
                            { value: '100%', sub: 'On-chain', blue: true },
                            { value: '0',    sub: 'Tamper rate', blue: false },
                            { value: '7',    sub: 'Provinces', blue: true },
                            { value: '\u221e', sub: 'Public access', blue: false },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.4 + i * 0.09, duration: 0.5, ease: EASE }}
                                className="flex flex-col"
                            >
                                <span
                                    className="font-display font-extrabold text-3xl leading-none tracking-tight"
                                    style={{ color: item.blue ? '#0A5FFF' : '#FF1A3C' }}
                                >
                                    {item.value}
                                </span>
                                <span
                                    className="text-xs font-mono tracking-widest uppercase mt-1"
                                    style={{ color: '#7A7A8C' }}
                                >
                                    {item.sub}
                                </span>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                >
                    <span className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: '#5A5A6A' }}>
                        Scroll
                    </span>
                    <div
                        className="w-5 h-8 rounded-full flex justify-center pt-1.5"
                        style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                    >
                        <motion.div
                            className="w-1 h-1 rounded-full"
                            style={{ background: '#0A5FFF' }}
                            animate={{ y: [0, 14, 0] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </div>
                </motion.div>
            </section>

            {/* ─────────────────────────────────────────────
                MARQUEE STRIP
                ───────────────────────────────────────────── */}
            <div
                className="overflow-hidden py-4"
                style={{ background: 'linear-gradient(90deg, #0A5FFF 0%, #0044CC 50%, #CC0E2B 100%)' }}
            >
                <div className="flex">
                    <div className="marquee-track select-none">
                        {[...marqueeWords, ...marqueeWords].map((w, i) => (
                            <span
                                key={i}
                                className="font-display font-bold text-xs tracking-[0.16em] uppercase text-white/90 whitespace-nowrap px-8"
                            >
                                {w}<span className="opacity-50 ml-8">&#10022;</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────
                STATS
                ───────────────────────────────────────────── */}
            <Section className="py-28 relative overflow-hidden">
                <Orb color="rgba(10,95,255,0.09)" size={600} blur={160} style={{ top: '20%', left: '10%' }} delay={1} />
                <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
                    <div className="mb-16">
                        <motion.p variants={fadeUp} custom={0} className="section-label mb-4">
                            Platform Metrics
                        </motion.p>
                        <motion.h2
                            variants={fadeUp}
                            custom={1}
                            className="font-display font-extrabold text-white leading-tight tracking-tight"
                            style={{ fontSize: 'clamp(1.4rem, 2.8vw, 2.4rem)' }}
                        >
                            Transparency
                            <br />
                            <span style={{ color: '#7A7A8C', fontWeight: 700 }}>at a glance</span>
                        </motion.h2>
                    </div>

                    <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                        <StatCard
                            label="Total Budget"
                            value={stats.totalBudget ? Math.round(stats.totalBudget / 1e7) : 0}
                            prefix="NPR " suffix=" Cr+"
                            accent="#0A5FFF"
                        />
                        <StatCard
                            label="Funds Released"
                            value={stats.totalReleased ? Math.round(stats.totalReleased / 1e7) : 0}
                            prefix="NPR " suffix=" Cr"
                            accent="#5B8FFF"
                        />
                        <StatCard
                            label="Active Projects"
                            value={stats.activeProjects || 0}
                            accent="#FF1A3C"
                        />
                        <StatCard
                            label="Utilization"
                            value={stats.utilizationRate || 0}
                            suffix="%" accent="#E8B84B"
                        />
                    </motion.div>

                    <motion.div variants={fadeIn} custom={4} className="glow-divider-blue mt-20" />
                </div>
            </Section>

            {/* ─────────────────────────────────────────────
                HOW IT WORKS
                ───────────────────────────────────────────── */}
            <Section className="py-28 relative overflow-hidden">
                <Orb color="rgba(255,26,60,0.09)" size={500} blur={140} style={{ top: '10%', right: '-5%' }} delay={2} />
                <div className="max-w-7xl mx-auto px-6 lg:px-10">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-20 gap-8">
                        <div>
                            <motion.p variants={fadeUp} custom={0} className="section-label mb-4">The Protocol</motion.p>
                            <motion.h2
                                variants={fadeUp} custom={1}
                                className="font-display font-extrabold text-white leading-tight tracking-tight"
                                style={{ fontSize: 'clamp(1.4rem, 2.8vw, 2.4rem)' }}
                            >
                                How it<br />
                                <span style={{
                                    background: 'linear-gradient(90deg,#0A5FFF,#FF1A3C)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}>works</span>
                            </motion.h2>
                        </div>
                        <motion.p
                            variants={fadeUp} custom={2}
                            className="max-w-sm text-base leading-relaxed lg:text-right"
                            style={{ color: '#7A7A8C' }}
                        >
                            Four blockchain-enforced steps that make corruption technically impossible.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {[
                            {
                                n: '01', title: 'Project Created',
                                desc: 'Government publishes project data on-chain with a locked budget ceiling and milestone metadata.',
                                accent: '#0A5FFF',
                            },
                            {
                                n: '02', title: 'Budget Allocated',
                                desc: 'Smart contract enforces maximum allocation. No administrator can exceed the declared ceiling.',
                                accent: '#5B8FFF',
                            },
                            {
                                n: '03', title: 'Funds Released',
                                desc: 'Every release is a signed on-chain transaction. Tamper-proof, timestamped, and permanent.',
                                accent: '#FF1A3C',
                            },
                            {
                                n: '04', title: 'Public Verify',
                                desc: 'Any citizen inspects every transaction on Solana Explorer. Zero trust required.',
                                accent: '#E8B84B',
                            },
                        ].map((step, i) => (
                            <motion.div
                                key={step.n}
                                variants={fadeUp} custom={i}
                                whileHover={{ y: -8 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                                className="group"
                            >
                                <div
                                    className="card h-full p-8 relative overflow-hidden"
                                    style={{ transition: 'border-color 0.4s, box-shadow 0.4s' }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = step.accent + '45';
                                        e.currentTarget.style.boxShadow   = `0 0 50px ${step.accent}18`;
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                                        e.currentTarget.style.boxShadow   = '';
                                    }}
                                >
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"
                                        style={{ background: `radial-gradient(ellipse at 0% 0%, ${step.accent}12 0%, transparent 65%)` }}
                                    />
                                    <div
                                        className="font-display font-extrabold text-6xl leading-none tracking-tight mb-6 select-none"
                                        style={{ color: step.accent + '28' }}
                                    >
                                        {step.n}
                                    </div>
                                    <h3 className="font-display font-bold text-xl text-white mb-3 tracking-tight">{step.title}</h3>
                                    <p className="text-sm leading-relaxed" style={{ color: '#7A7A8C' }}>{step.desc}</p>
                                    <motion.div
                                        className="absolute bottom-0 left-0 h-0.5"
                                        style={{ background: step.accent }}
                                        initial={{ width: 0 }}
                                        whileHover={{ width: '100%' }}
                                        transition={{ duration: 0.5, ease: EASE }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* ─────────────────────────────────────────────
                WHY BLOCKCHAIN
                ───────────────────────────────────────────── */}
            <Section className="py-28 overflow-hidden relative">
                <Orb color="rgba(10,95,255,0.11)" size={600} blur={150} style={{ top: '30%', left: '-5%' }} delay={0} />
                <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

                    {/* Left: copy */}
                    <div>
                        <motion.p variants={fadeUp} custom={0} className="section-label mb-6">Why Blockchain</motion.p>
                        <motion.h2
                            variants={fadeUp} custom={1}
                            className="font-display font-extrabold text-white leading-tight tracking-tight mb-8"
                            style={{ fontSize: 'clamp(1.4rem, 2.8vw, 2.4rem)' }}
                        >
                            Corruption cannot<br />
                            <span style={{ color: '#FF1A3C' }}>survive on-chain</span>
                        </motion.h2>
                        <motion.p
                            variants={fadeUp} custom={2}
                            className="text-base leading-relaxed mb-12"
                            style={{ color: '#8A8A9C', maxWidth: '480px' }}
                        >
                            Traditional budget databases are siloed, editable, and opaque.
                            Solana changes the rules — every rupee leaves an immutable, public fingerprint permanently.
                        </motion.p>

                        <div className="space-y-5">
                            {[
                                { title: 'Immutable Ledger',           desc: 'Once recorded, no administrator can alter transactions.',                     accent: '#0A5FFF' },
                                { title: 'Smart Contract Limits',      desc: 'Allocations bound by code logic, not human promises.',                        accent: '#5B8FFF' },
                                { title: 'Live Citizen Audit',         desc: 'Open Solana Explorer. See everything. No FOIA needed.',                       accent: '#E8B84B' },
                            ].map((item, i) => (
                                <motion.div
                                    key={item.title}
                                    variants={fadeUp} custom={i + 3}
                                    className="flex items-start gap-5 group"
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 transition-transform duration-300 group-hover:scale-110"
                                        style={{ background: item.accent + '18', border: `1px solid ${item.accent}30` }}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: item.accent }}>
                                            <path d="M2 7l3 3 7-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-display font-bold text-white mb-1 text-base tracking-tight">{item.title}</div>
                                        <div className="text-sm leading-relaxed" style={{ color: '#7A7A8C' }}>{item.desc}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right: terminal */}
                    <motion.div variants={fadeUp} custom={2} className="relative">
                        <div
                            className="absolute -inset-6 rounded-3xl pointer-events-none"
                            style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(10,95,255,0.12) 0%, transparent 70%)' }}
                        />
                        <div className="terminal relative">
                            <div className="terminal-bar">
                                <div className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
                                <div className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }} />
                                <div className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
                                <span className="ml-3 text-xs" style={{ color: '#5A5A6A', fontFamily: 'JetBrains Mono, monospace' }}>
                                    solana-explorer &middot; govfund.nepal
                                </span>
                            </div>
                            <div className="p-7 space-y-3 text-sm" style={{ color: '#C0C0D0', fontFamily: 'JetBrains Mono, monospace' }}>
                                {[
                                    { d: 0.2,  node: <><span style={{ color: '#5B8FFF' }}>$</span>{' '}solana confirm <span style={{ color: '#E8B84B' }}>7xK9mfe...nPqR</span></> },
                                    { d: 0.7,  node: <span style={{ color: '#4ADE80' }}>&#10003; Transaction finalized (Solana Devnet)</span> },
                                    { d: 1.2,  node: <><span style={{ color: '#5A5A6A' }}>Block   : </span><span style={{ color: '#F5F5F7' }}>285,931,042</span></> },
                                    { d: 1.7,  node: <><span style={{ color: '#5A5A6A' }}>Program : </span><span style={{ color: '#FF1A3C' }}>GovFund...Nep</span></> },
                                    { d: 2.2,  node: <><span style={{ color: '#5A5A6A' }}>Method  : </span><span style={{ color: '#5B8FFF' }}>allocate_budget</span></> },
                                    { d: 2.7,  node: <><span style={{ color: '#5A5A6A' }}>Amount  : </span><span style={{ color: '#E8B84B' }}>NPR 50,000,000</span></> },
                                    { d: 3.2,  node: <><span style={{ color: '#5A5A6A' }}>Signer  : </span><span style={{ color: '#F5F5F7' }}>4MMh...A3h2 (treasury)</span></> },
                                    { d: 3.7,  node: <><span style={{ color: '#5A5A6A' }}>Fee     : </span><span style={{ color: '#F5F5F7' }}>0.000005 SOL</span></> },
                                    { d: 4.3,  node: <span style={{ color: '#FF1A3C' }}>&#9918;  Immutable. Transparent. Verified. Forever.</span> },
                                ].map((line, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -8 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: line.d, duration: 0.4 }}
                                    >
                                        {line.node}
                                    </motion.div>
                                ))}
                                <motion.span
                                    style={{ display: 'inline-block', width: '8px', height: '16px', background: '#0A5FFF', verticalAlign: 'middle' }}
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ duration: 0.7, repeat: Infinity, ease: 'steps(1)' }}
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </Section>

            {/* ─────────────────────────────────────────────
                MANIFESTO
                ───────────────────────────────────────────── */}
            <Section className="py-32 relative overflow-hidden">
                <div
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
                >
                    <span
                        className="font-display font-extrabold uppercase select-none"
                        style={{
                            fontSize: 'clamp(4rem, 14vw, 14rem)',
                            color: 'transparent',
                            WebkitTextStroke: '1px rgba(255,255,255,0.022)',
                            letterSpacing: '-0.04em',
                            lineHeight: 1,
                        }}
                    >
                        TRUST
                    </span>
                </div>

                <div className="max-w-5xl mx-auto px-6 lg:px-10 text-center relative z-10">
                    <motion.p variants={fadeUp} custom={0} className="section-label mb-8">Our Manifesto</motion.p>

                    <motion.h2
                        variants={fadeUp} custom={1}
                        className="font-display font-extrabold text-white leading-tight tracking-tight mb-10"
                        style={{ fontSize: 'clamp(1.5rem, 3vw, 2.8rem)' }}
                    >
                        Public money is{' '}
                        <span style={{ color: '#FF1A3C' }}>public trust.</span>
                        <br />
                        Every citizen deserves to{' '}
                        <span style={{
                            background: 'linear-gradient(90deg, #0A5FFF, #5B8FFF)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>verify.</span>
                    </motion.h2>

                    <motion.p
                        variants={fadeUp} custom={2}
                        className="text-lg leading-relaxed max-w-2xl mx-auto mb-16"
                        style={{ color: '#7A7A8C' }}
                    >
                        GovFund Nepal is not just a tracker. It is a paradigm shift.
                        Accountability should not depend on auditors or politicians.
                        It should be <span className="text-white font-medium">mathematically guaranteed.</span>
                    </motion.p>

                    <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            { icon: '&#9938;', label: 'Solana-Powered', desc: '65,000 TPS, sub-second finality, near-zero fees' },
                            { icon: '&#127963;', label: 'Nepal-Native',  desc: 'All 7 provinces covered, NPR-denominated reporting' },
                            { icon: '&#128275;', label: 'Open Protocol', desc: 'Open source. Auditable. Forkable by any nation.' },
                        ].map((item, i) => (
                            <motion.div
                                key={item.label}
                                variants={fadeUp} custom={i}
                                className="card p-7 text-left"
                                style={{ transition: 'all 0.4s var(--ease-luxury, cubic-bezier(0.22,1,0.36,1))' }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform   = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow   = '0 20px 60px rgba(10,95,255,0.13)';
                                    e.currentTarget.style.borderColor = 'rgba(10,95,255,0.3)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform   = '';
                                    e.currentTarget.style.boxShadow   = '';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                                }}
                            >
                                <div className="text-3xl mb-4" dangerouslySetInnerHTML={{ __html: item.icon }} />
                                <div className="font-display font-bold text-white text-lg mb-2 tracking-tight">{item.label}</div>
                                <div className="text-sm leading-relaxed" style={{ color: '#7A7A8C' }}>{item.desc}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </Section>

            {/* ─────────────────────────────────────────────
                CTA
                ───────────────────────────────────────────── */}
            <Section className="relative overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(135deg, #060612 0%, #08090F 40%, #0D0608 100%)' }}
                />
                <Orb color="rgba(10,95,255,0.18)"  size={700} blur={180} style={{ top: '-20%',    left: '20%' }}  delay={0} />
                <Orb color="rgba(255,26,60,0.13)"  size={600} blur={160} style={{ bottom: '-20%', right: '15%' }} delay={3} />
                <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-10 py-40 text-center">
                    <motion.p variants={fadeUp} custom={0} className="section-label mb-8">Get Started</motion.p>

                    <motion.h2
                        variants={fadeUp} custom={1}
                        className="font-display font-extrabold text-white leading-tight tracking-tight mb-8"
                        style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.5rem)' }}
                    >
                        Ready to explore<br />
                        <span style={{
                            background: 'linear-gradient(90deg, #0A5FFF 0%, #5B8FFF 35%, #FF1A3C 70%, #FF6B6B 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>the truth?</span>
                    </motion.h2>

                    <motion.p
                        variants={fadeUp} custom={2}
                        className="text-lg leading-relaxed max-w-xl mx-auto mb-14"
                        style={{ color: '#7A7A8C' }}
                    >
                        Connect your Solana wallet and verify government spending in real-time.
                        Every transaction on-chain. Every rupee accountable.
                    </motion.p>

                    <motion.div
                        variants={fadeUp} custom={3}
                        className="flex items-center justify-center gap-5 flex-wrap"
                    >
                        <Link to="/projects">
                            <motion.button
                                className="btn-electric text-base"
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Explore All Projects &nbsp;
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ display: 'inline' }}>
                                    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </motion.button>
                        </Link>
                        <Link to="/dashboard">
                            <motion.button
                                className="btn-ghost text-base"
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                Live Dashboard
                            </motion.button>
                        </Link>
                    </motion.div>

                    <motion.div variants={fadeIn} custom={5} className="glow-divider-blue mt-24 mb-12" />

                    <motion.p
                        variants={fadeIn} custom={6}
                        className="text-xs font-mono tracking-widest uppercase"
                        style={{ color: '#3A3A4A' }}
                    >
                        Built with Solana &middot; MongoDB &middot; React &middot; Framer Motion
                        &nbsp;&middot;&nbsp; Open Source &nbsp;&middot;&nbsp; Nepal
                    </motion.p>
                </div>
            </Section>
        </div>
    );
}
