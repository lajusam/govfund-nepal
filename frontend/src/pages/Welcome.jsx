import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

// ─── Particle Canvas ─────────────────────────────────────────────────────────
function ParticleCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let W = (canvas.width  = window.innerWidth);
        let H = (canvas.height = window.innerHeight);
        let animId;

        // Palette: golden/bronze tones on deep basalt
        const COLORS = ['rgba(255,184,28,', 'rgba(250,217,128,', 'rgba(142,111,62,'];

        const particles = Array.from({ length: 110 }, () => ({
            x:      Math.random() * W,
            y:      Math.random() * H,
            r:      Math.random() * 1.8 + 0.3,
            alpha:  Math.random() * 0.45 + 0.08,
            dx:     (Math.random() - 0.5) * 0.35,
            dy:    -(Math.random() * 0.45 + 0.1),
            color:  COLORS[Math.floor(Math.random() * COLORS.length)],
            pulse:  Math.random() * Math.PI * 2,
        }));

        function draw() {
            ctx.clearRect(0, 0, W, H);
            const t = Date.now() * 0.001;

            particles.forEach(p => {
                const a = p.alpha * (0.6 + 0.4 * Math.sin(t + p.pulse));
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `${p.color}${a.toFixed(3)})`;
                ctx.fill();

                p.x += p.dx;
                p.y += p.dy;

                if (p.y < -4)  { p.y = H + 4; p.x = Math.random() * W; }
                if (p.x < -4)  { p.x = W + 4; }
                if (p.x > W + 4) { p.x = -4; }
            });

            // Subtle connection lines between close particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const d = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
                    if (d < 90) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x,  particles[j].y);
                        ctx.strokeStyle = `rgba(255,255,255,${(0.05 * (1 - d / 90)).toFixed(3)})`;
                        ctx.lineWidth   = 0.5;
                        ctx.stroke();
                    }
                }
            }

            animId = requestAnimationFrame(draw);
        }

        draw();

        const onResize = () => {
            W = canvas.width  = window.innerWidth;
            H = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
        />
    );
}

// ─── Floating ambient orbs ────────────────────────────────────────────────────
function AmbientOrb({ style, delay = 0 }) {
    return (
        <motion.div
            className="absolute rounded-full blur-[90px] pointer-events-none"
            style={style}
            animate={{
                scale:   [1, 1.18, 0.94, 1.08, 1],
                opacity: [style.opacity, style.opacity * 1.3, style.opacity * 0.7, style.opacity * 1.1, style.opacity],
            }}
            transition={{ duration: 9 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
        />
    );
}

// ─── Animated scan line ───────────────────────────────────────────────────────
function ScanLine() {
    return (
        <motion.div
            className="absolute left-0 right-0 h-px pointer-events-none"
            style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.10) 30%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.10) 70%, transparent 100%)',
                zIndex: 3,
            }}
            animate={{ top: ['-2px', '100vh'] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
        />
    );
}

// ─── Animated logo ring ───────────────────────────────────────────────────────
function LogoRing({ size, delay, opacity, clockwise = true }) {
    return (
        <motion.div
            className="absolute rounded-full border pointer-events-none"
            style={{
                width: size, height: size,
                borderColor: `rgba(255,255,255,${opacity})`,
                top:  '50%', left: '50%',
                marginTop:  -(size / 2),
                marginLeft: -(size / 2),
            }}
            animate={{ rotate: clockwise ? 360 : -360, scale: [1, 1.04, 1] }}
            transition={{
                rotate: { duration: 12 + delay * 4, repeat: Infinity, ease: 'linear' },
                scale:  { duration: 4, repeat: Infinity, ease: 'easeInOut', delay },
            }}
        />
    );
}

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
                    className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden select-none"
                    style={{ background: '#1A160F', zIndex: 9999 }}
                >
                    {/* ── Particle field ── */}
                    <ParticleCanvas />

                    {/* ── Scan line effect ── */}
                    <ScanLine />

                    {/* ── Ambient glow orbs ── */}
                    <AmbientOrb
                        delay={0}
                        style={{ width: 480, height: 480, top: '10%', left: '-8%',
                                 background: '#FFB81C', opacity: 0.18, zIndex: 0 }}
                    />
                    <AmbientOrb
                        delay={3}
                        style={{ width: 360, height: 360, bottom: '5%', right: '-5%',
                                 background: '#8E6F3E', opacity: 0.15, zIndex: 0 }}
                    />
                    <AmbientOrb
                        delay={1.5}
                        style={{ width: 220, height: 220, top: '55%', left: '15%',
                                 background: '#FAD980', opacity: 0.10, zIndex: 0 }}
                    />

                    {/* ── Radial vignette ── */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: 'radial-gradient(ellipse 70% 65% at 50% 50%, transparent 0%, rgba(26,22,15,0.45) 70%, rgba(26,22,15,0.85) 100%)',
                            zIndex: 2,
                        }}
                    />

                    {/* ── Corner decorative lines ── */}
                    {[
                        { top: 20, left: 20,  rot: 0   },
                        { top: 20, right: 20, rot: 90  },
                        { bottom: 20, left: 20,  rot: 270 },
                        { bottom: 20, right: 20, rot: 180 },
                    ].map((pos, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-8 h-8 pointer-events-none"
                            style={{ ...pos, zIndex: 4, rotate: pos.rot }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.40 }}
                            transition={{ delay: 1.2 + i * 0.1, duration: 0.6 }}
                        >
                            <div className="absolute top-0 left-0 w-full h-px" style={{ background: 'rgba(255,255,255,0.35)' }} />
                            <div className="absolute top-0 left-0 h-full w-px" style={{ background: 'rgba(255,255,255,0.35)' }} />
                        </motion.div>
                    ))}

                    {/* ── Content stack ── */}
                    <div className="relative flex flex-col items-center justify-center gap-0 px-6 text-center" style={{ zIndex: 5 }}>

                        {/* Logo container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.72, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                            className="relative flex items-center justify-center mb-8"
                            style={{ width: 200, height: 200 }}
                        >
                            {/* Spinning rings */}
                            <LogoRing size={230} delay={0}   opacity={0.18} clockwise={true}  />
                            <LogoRing size={260} delay={1.5} opacity={0.10} clockwise={false} />
                            <LogoRing size={195} delay={0.8} opacity={0.28} clockwise={true}  />

                            {/* Navy halo pulse */}
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
                                className="font-heading font-extrabold tracking-tight"
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
                                className="font-heading font-semibold tracking-[0.35em] uppercase"
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
                                className="font-heading font-bold"
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
                                className="font-heading font-bold"
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

                    {/* ── Bottom brand strip ── */}
                    <motion.div
                        className="absolute bottom-7 left-0 right-0 flex justify-center pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.2, duration: 0.8 }}
                        style={{ zIndex: 5 }}
                    >
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', letterSpacing: '0.20em', fontFamily: 'JetBrains Mono, monospace' }}>
                            {t('decentralizedStrip')}
                        </span>
                    </motion.div>

                    {/* ── Horizontal divider line ── */}
                    <motion.div
                        className="absolute left-0 right-0 pointer-events-none"
                        style={{ bottom: 56, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.20) 50%, rgba(255,255,255,0.12) 70%, transparent)', zIndex: 4 }}
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ delay: 2.0, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
