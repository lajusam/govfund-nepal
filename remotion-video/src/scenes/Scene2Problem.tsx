/**
 * Scene 2 — THE PROBLEM (5–13s, 255 local frames)
 *
 * Floating glass cards with problem statements.
 * Red accents. Vignette closes. Particles darken and slow.
 */
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS } from '../styles/colors';
import { Particles } from '../components/Particles';
import { GrainOverlay } from '../components/GrainOverlay';
import { sceneFade } from '../utils/helpers';

const TOTAL = 255;

const PROBLEMS = [
  {
    icon: '❌',
    title: 'Opaque Budget Allocations',
    desc: 'Funds are allocated with no public record or verifiable audit trail.',
    delay: 15,
  },
  {
    icon: '❌',
    title: 'Manual Fund Tracking',
    desc: 'Paper-based processes allow errors, manipulation, and delays.',
    delay: 40,
  },
  {
    icon: '❌',
    title: 'No Public Audit Trail',
    desc: 'Citizens have no mechanism to verify how public resources are spent.',
    delay: 65,
  },
  {
    icon: '❌',
    title: 'Silent Edits & Corruption',
    desc: 'Records can be altered retroactively with zero accountability.',
    delay: 90,
  },
];

export const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = sceneFade(frame, TOTAL, 15);

  // Vignette closes progressively
  const vignetteProgress = interpolate(frame, [80, 220], [0.4, 0.85], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Particles slow and darken
  const particleOpacity = interpolate(frame, [80, 220], [0.5, 0.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Red wash overlay
  const redOverlay = interpolate(frame, [120, 230], [0, 0.07], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: COLORS.bgDeep, opacity }}>
      {/* Background particles */}
      <Particles
        count={30}
        width={1920}
        height={1080}
        seed={2}
        mode="rest"
        baseOpacity={particleOpacity}
      />

      {/* Section label */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: interpolate(frame, [5, 20], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontFamily: FONTS.mono,
            color: COLORS.error,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          The Problem
        </div>
        <div
          style={{
            width: 40,
            height: 2,
            background: COLORS.error,
            borderRadius: 2,
            boxShadow: `0 0 10px ${COLORS.error}`,
          }}
        />
      </div>

      {/* Heading */}
      <div
        style={{
          position: 'absolute',
          top: 130,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [10, 30], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <span
          style={{
            fontSize: 44,
            fontFamily: FONTS.heading,
            fontWeight: 700,
            color: COLORS.text,
          }}
        >
          Transparency gaps cost nations{' '}
          <span style={{ color: COLORS.error }}>billions.</span>
        </span>
      </div>

      {/* Problem cards */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          paddingTop: 160,
          paddingLeft: 80,
          paddingRight: 80,
        }}
      >
        {PROBLEMS.map((problem, i) => {
          const cardProgress = spring({
            frame: frame - problem.delay,
            fps,
            config: { damping: 18, stiffness: 90, mass: 1 },
          });
          const cardOpacity = interpolate(frame, [problem.delay, problem.delay + 15], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          // Subtle float
          const floatY = Math.sin((frame * Math.PI) / 100 + i * 1.5) * 6;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                maxWidth: 340,
                background: COLORS.surfaceGlass,
                border: `1px solid rgba(239, 68, 68, 0.2)`,
                borderRadius: 16,
                padding: 28,
                backdropFilter: 'blur(16px)',
                boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 24px rgba(239,68,68,0.08)`,
                opacity: cardOpacity,
                transform: `scale(${0.85 + cardProgress * 0.15}) translateY(${(1 - cardProgress) * 30 + floatY}px)`,
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  marginBottom: 16,
                }}
              >
                {problem.icon}
              </div>

              {/* Title */}
              <div
                style={{
                  fontSize: 17,
                  fontFamily: FONTS.heading,
                  fontWeight: 600,
                  color: COLORS.text,
                  lineHeight: 1.25,
                  marginBottom: 10,
                }}
              >
                {problem.title}
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: 13,
                  fontFamily: FONTS.body,
                  color: COLORS.textSecondary,
                  lineHeight: 1.6,
                }}
              >
                {problem.desc}
              </div>

              {/* Bottom accent */}
              <div
                style={{
                  marginTop: 18,
                  height: 2,
                  background: `linear-gradient(90deg, ${COLORS.error}66, transparent)`,
                  borderRadius: 1,
                }}
              />
            </div>
          );
        })}
      </AbsoluteFill>

      {/* Red overlay wash */}
      <AbsoluteFill
        style={{
          background: `rgba(239, 68, 68, ${redOverlay})`,
          pointerEvents: 'none',
        }}
      />

      {/* Closing vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 20%, rgba(5,5,5,${vignetteProgress}) 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Scan line effect */}
      <div
        style={{
          position: 'absolute',
          top: ((frame * 4) % 1080),
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, rgba(239,68,68,0.06), transparent)`,
          pointerEvents: 'none',
        }}
      />

      <GrainOverlay opacity={0.04} />
    </AbsoluteFill>
  );
};
