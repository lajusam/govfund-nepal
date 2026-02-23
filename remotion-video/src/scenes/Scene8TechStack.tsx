/**
 * Scene 8 — TECH STACK (80–85s, 165 local frames)
 *
 * Horizontal badge scroll: Solana · Anchor · Rust · Node.js · MongoDB · IPFS · React · Vite
 * Clean, calm, confident.
 */
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS } from '../styles/colors';
import { GrainOverlay } from '../components/GrainOverlay';
import { sceneFade } from '../utils/helpers';

const TOTAL = 165;

const TECH_STACK = [
  { name: 'Solana', color: '#9945FF', sub: 'Blockchain' },
  { name: 'Anchor', color: '#14F195', sub: 'Smart Contracts' },
  { name: 'Rust', color: '#CE4A32', sub: 'Program Language' },
  { name: 'Node.js', color: '#68A063', sub: 'Backend API' },
  { name: 'MongoDB', color: '#47A248', sub: 'Off-Chain Storage' },
  { name: 'IPFS', color: '#65C2CB', sub: 'Document Storage' },
  { name: 'React', color: '#61DAFB', sub: 'Frontend UI' },
  { name: 'Vite', color: '#646CFF', sub: 'Build Tool' },
];

export const Scene8TechStack: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = sceneFade(frame, TOTAL, 15);

  const headerProgress = interpolate(frame, [8, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: COLORS.bgDeep, opacity }}>
      {/* Subtle grid background */}
      <AbsoluteFill style={{ pointerEvents: 'none', opacity: 0.03 }}>
        <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <pattern id="grid8" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#ffffff" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="1920" height="1080" fill="url(#grid8)" />
        </svg>
      </AbsoluteFill>

      {/* Section header */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          width: '100%',
          textAlign: 'center',
          opacity: headerProgress,
          transform: `translateY(${(1 - headerProgress) * -14}px)`,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontFamily: FONTS.mono,
            color: COLORS.brand,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          Tech Stack
        </div>
        <div
          style={{
            fontSize: 40,
            fontFamily: FONTS.heading,
            fontWeight: 700,
            color: COLORS.text,
          }}
        >
          Battle-tested. Production-grade.
        </div>
      </div>

      {/* Badge row */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          paddingTop: 60,
        }}
      >
        {TECH_STACK.map((tech, i) => {
          const badgeSpring = spring({
            frame: frame - (20 + i * 12),
            fps,
            config: { damping: 18, stiffness: 110, mass: 0.9 },
          });
          const badgeOpacity = interpolate(frame, [20 + i * 12, 32 + i * 12], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const floatY = Math.sin((frame * Math.PI) / 70 + i * 0.9) * 6;
          const pulseGlow = 0.3 + Math.sin((frame * Math.PI) / 45 + i * 0.7) * 0.2;

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                opacity: badgeOpacity,
                transform: `scale(${0.7 + badgeSpring * 0.3}) translateY(${(1 - badgeSpring) * 30 + floatY}px)`,
              }}
            >
              {/* Badge */}
              <div
                style={{
                  background: `${tech.color}14`,
                  border: `1.5px solid ${tech.color}66`,
                  borderRadius: 14,
                  padding: '18px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  minWidth: 130,
                  boxShadow: `0 0 ${20 * pulseGlow}px ${tech.color}44`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* Color dot */}
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: tech.color,
                    boxShadow: `0 0 10px ${tech.color}`,
                  }}
                />

                {/* Tech name */}
                <div
                  style={{
                    fontSize: 20,
                    fontFamily: FONTS.heading,
                    fontWeight: 700,
                    color: tech.color,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {tech.name}
                </div>

                {/* Subtitle */}
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: FONTS.body,
                    color: COLORS.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    textAlign: 'center',
                  }}
                >
                  {tech.sub}
                </div>
              </div>

              {/* Bottom connector dot */}
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: tech.color,
                  opacity: 0.5,
                }}
              />
            </div>
          );
        })}
      </AbsoluteFill>

      {/* Connecting horizontal line under badges */}
      <div
        style={{
          position: 'absolute',
          bottom: 320,
          left: 100,
          right: 100,
          height: 1,
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.04) 20%, rgba(255,255,255,0.04) 80%, transparent)`,
          opacity: interpolate(frame, [30, 50], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      />

      {/* Bottom statement */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [100, 120], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          transform: `translateY(${interpolate(frame, [100, 120], [16, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })}px)`,
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontFamily: FONTS.body,
            color: COLORS.textMuted,
            letterSpacing: '0.04em',
          }}
        >
          Minimal dependencies · Zero operational overhead · Fully open source
        </span>
      </div>

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(5,5,5,0.6) 100%)`,
          pointerEvents: 'none',
        }}
      />

      <GrainOverlay opacity={0.03} />
    </AbsoluteFill>
  );
};
