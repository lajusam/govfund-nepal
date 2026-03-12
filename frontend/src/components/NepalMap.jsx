import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Map, Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// ── Constants ──────────────────────────────────────────────────────
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const NEPAL_BOUNDS = [
    [80.0585, 26.3478],
    [88.2015, 30.4227],
];

const INITIAL_VIEW = {
    longitude: 83.45,
    latitude: 27.70,
    zoom: 6,
    pitch: 0,
    bearing: 0,
};

const MIN_ZOOM = 5.5;
const MAX_ZOOM = 12;

// Parallax tuning — pixel offsets applied via CSS transform
const PARALLAX_PX = 30;          // max translate in px
const PARALLAX_SCALE_BOOST = 0.04; // slight scale-up to hide edges during translate
const LERP_SPEED = 0.06;

// ── Marker data ────────────────────────────────────────────────────
const WHISPERS = [
    { id: 'w1', lng: 85.324, lat: 27.7172, label: 'Road damage — Kathmandu' },
    { id: 'w2', lng: 83.985, lat: 28.2096, label: 'Water shortage — Pokhara' },
    { id: 'w3', lng: 83.46, lat: 27.68, label: 'Power outage — Butwal' },
    { id: 'w4', lng: 85.891, lat: 26.812, label: 'Bridge collapse — Birgunj' },
    { id: 'w5', lng: 87.267, lat: 26.668, label: 'Flood alert — Biratnagar' },
    { id: 'w6', lng: 80.574, lat: 28.697, label: 'School repair — Dhangadhi' },
];

const PETITIONS = [
    { id: 'p1', lng: 85.314, lat: 27.695, label: 'Transparency audit — Lalitpur' },
    { id: 'p2', lng: 84.014, lat: 28.235, label: 'Hospital expansion — Kaski' },
    { id: 'p3', lng: 81.616, lat: 28.046, label: 'Irrigation project — Nepalgunj' },
    { id: 'p4', lng: 86.712, lat: 26.813, label: 'New school — Janakpur' },
];

// ── CSS keyframes (injected once) ──────────────────────────────────
const STYLE_ID = 'nepal-map-keyframes';
const KEYFRAMES = `
@keyframes whisperPulse {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50%      { transform: scale(1.35); opacity: 0.5; }
}
@keyframes whisperRing {
  0%   { transform: scale(0.5); opacity: 0.6; }
  100% { transform: scale(2.8); opacity: 0; }
}
@keyframes petitionBeacon {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50%      { transform: scale(1.25); filter: brightness(1.6); }
}
@keyframes petitionRing {
  0%   { transform: scale(0.6); opacity: 0.7; }
  100% { transform: scale(3.5); opacity: 0; }
}
`;

function injectKeyframes() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);
}

// ── Whisper marker (red glow) ──────────────────────────────────────
function WhisperDot() {
    return (
        <div className="relative flex items-center justify-center" style={{ width: 30, height: 30 }}>
            {/* Expanding ring */}
            <span
                className="absolute rounded-full"
                style={{
                    width: 24, height: 24,
                    border: '1.5px solid rgba(255,60,60,0.5)',
                    animation: 'whisperRing 2s ease-out infinite',
                }}
            />
            {/* Pulsing core */}
            <span
                className="rounded-full"
                style={{
                    width: 10, height: 10,
                    backgroundColor: '#ff3c3c',
                    boxShadow: '0 0 6px 2px rgba(255,60,60,0.7), 0 0 18px 6px rgba(255,60,60,0.25)',
                    animation: 'whisperPulse 2s ease-in-out infinite',
                }}
            />
        </div>
    );
}

// ── Petition marker (neon green beacon) ────────────────────────────
function PetitionBeacon() {
    return (
        <div className="relative flex items-center justify-center" style={{ width: 40, height: 40 }}>
            {/* Outer ring */}
            <span
                className="absolute rounded-full"
                style={{
                    width: 32, height: 32,
                    border: '1.5px solid rgba(0,255,140,0.45)',
                    animation: 'petitionRing 2.5s ease-out infinite',
                }}
            />
            {/* Mid glow */}
            <span
                className="absolute rounded-full"
                style={{
                    width: 22, height: 22,
                    backgroundColor: 'rgba(0,255,140,0.12)',
                    filter: 'blur(4px)',
                }}
            />
            {/* Core */}
            <span
                className="rounded-full"
                style={{
                    width: 14, height: 14,
                    backgroundColor: '#00ff8c',
                    boxShadow: '0 0 8px 3px rgba(0,255,140,0.7), 0 0 24px 8px rgba(0,255,140,0.3)',
                    animation: 'petitionBeacon 2.5s ease-in-out infinite',
                }}
            />
        </div>
    );
}

// ── Lerp helper ────────────────────────────────────────────────────
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
//  Parallax is done via CSS transform on the wrapper — the map itself
//  stays fully uncontrolled so drag, zoom, and NavigationControl all
//  work natively with zero state-fighting.
// ═══════════════════════════════════════════════════════════════════
export default function NepalMap() {
    const [hovered, setHovered] = useState(null);
    const parallaxRef = useRef(null);     // the div we translate
    const mouseNorm = useRef({ x: 0, y: 0 });
    const current = useRef({ x: 0, y: 0 });
    const rafId = useRef(0);

    const markers = useMemo(() => [
        ...WHISPERS.map(w => ({ ...w, type: 'whisper' })),
        ...PETITIONS.map(p => ({ ...p, type: 'petition' })),
    ], []);

    // Inject CSS keyframes once
    useEffect(() => { injectKeyframes(); }, []);

    // ── Window-level mouse tracker ─────────────────────────────────
    useEffect(() => {
        let lastTime = 0;
        const onMouseMove = (e) => {
            const now = performance.now();
            if (now - lastTime < 16) return;
            lastTime = now;
            mouseNorm.current = {
                x: (e.clientX / window.innerWidth) * 2 - 1,
                y: (e.clientY / window.innerHeight) * 2 - 1,
            };
        };
        const onMouseLeave = () => {
            mouseNorm.current = { x: 0, y: 0 };
        };
        window.addEventListener('mousemove', onMouseMove, { passive: true });
        document.documentElement.addEventListener('mouseleave', onMouseLeave);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            document.documentElement.removeEventListener('mouseleave', onMouseLeave);
        };
    }, []);

    // ── rAF parallax loop — CSS transform only, no map state ───────
    useEffect(() => {
        const animate = () => {
            const tX = mouseNorm.current.x * PARALLAX_PX;
            const tY = mouseNorm.current.y * PARALLAX_PX;
            current.current.x = lerp(current.current.x, tX, LERP_SPEED);
            current.current.y = lerp(current.current.y, tY, LERP_SPEED);

            const el = parallaxRef.current;
            if (el) {
                const s = 1 + PARALLAX_SCALE_BOOST;
                el.style.transform =
                    `translate(${current.current.x}px, ${current.current.y}px) scale(${s})`;
            }
            rafId.current = requestAnimationFrame(animate);
        };
        rafId.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafId.current);
    }, []);

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Parallax wrapper — translated by cursor, slightly scaled to hide edges */}
            <div
                ref={parallaxRef}
                className="w-full h-full will-change-transform"
                style={{ filter: 'brightness(1.2) contrast(1.1) saturate(1.2)' }}
            >
                <Map
                    initialViewState={INITIAL_VIEW}
                    maxBounds={NEPAL_BOUNDS}
                    minZoom={MIN_ZOOM}
                    maxZoom={MAX_ZOOM}
                    mapStyle={MAP_STYLE}
                    style={{ width: '100%', height: '100%' }}
                    attributionControl={false}
                    dragRotate={true}
                    scrollZoom={false}
                    touchZoomRotate={true}
                >
                    <NavigationControl position="bottom-right" showCompass={false} />

                    {markers.map((m) => (
                        <Marker key={m.id} longitude={m.lng} latitude={m.lat} anchor="center">
                            <div
                                className="cursor-pointer relative"
                                onMouseEnter={() => setHovered(m.id)}
                                onMouseLeave={() => setHovered(null)}
                            >
                                {m.type === 'whisper' ? <WhisperDot /> : <PetitionBeacon />}

                                {hovered === m.id && (
                                    <div
                                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap
                                                   px-3 py-1.5 rounded-lg border text-xs text-white shadow-xl
                                                   backdrop-blur-md z-50 pointer-events-none"
                                        style={{
                                            background: 'rgba(10,10,18,0.92)',
                                            borderColor: m.type === 'whisper'
                                                ? 'rgba(255,60,60,0.35)'
                                                : 'rgba(0,255,140,0.35)',
                                        }}
                                    >
                                        <span className={m.type === 'whisper' ? 'text-red-400' : 'text-emerald-400'}>
                                            {m.type === 'whisper' ? '⚠ Whisper' : '✦ Petition'}
                                        </span>
                                        <span className="text-white/40 mx-1.5">—</span>
                                        <span>{m.label}</span>
                                    </div>
                                )}
                            </div>
                        </Marker>
                    ))}
                </Map>
            </div>

            {/* Vignette overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)',
                }}
            />

            {/* Top-edge glow line */}
            <div
                className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(0,255,140,0.25) 30%, rgba(255,60,60,0.20) 70%, transparent)',
                }}
            />
        </div>
    );
}
