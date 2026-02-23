/**
 * Scene 9 — CLOSING STATEMENT (85–90s, 165 local frames)
 *
 * Final logo assembly.
 * "Transparency is not a promise. It's code."
 * govfund-nepal.vercel.app
 * Fade to black.
 */
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, GRADIENTS, SHADOW } from '../styles/colors';
import { Logo } from '../components/Logo';
import { Particles } from '../components/Particles';
import { Shockwave } from '../components/Shockwave';
import { GrainOverlay } from '../components/GrainOverlay';
import { sceneFade } from '../utils/helpers';

const TOTAL = 165;

export const Scene9Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene fade-in only: this is the last scene, fade to black at the end
  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Final fade to black
  const fadeOut = interpolate(frame, [135, 165], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(fadeIn, fadeOut);

  // Logo entrance
  const logoSpring = spring({
    frame: frame - 20,
    fps,
    config: { damping: 22, stiffness: 80, mass: 1.2 },
  });

  // Line 1: "Transparency is not a promise."
  const line1Progress = interpolate(frame, [55, 85], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const line1Eased = 1 - Math.pow(1 - line1Progress, 3);

  // Line 2: "It's code."
  const line2Progress = interpolate(frame, [85, 110], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const line2Eased = 1 - Math.pow(1 - line2Progress, 3);

  // URL
  const urlProgress = interpolate(frame, [110, 130], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Glow pulse
  const glowPulse = 0.5 + Math.sin((frame * Math.PI) / 50) * 0.3;

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bgDeep,
        opacity,
      }}
    >
      {/* Background particles — quiet */}
      <Particles
        count={25}
        width={1920}
        height={1080}
        seed={9}
        mode="rest"
        baseOpacity={0.25}
      />

      {/* Central glow */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '40%',
          transform: 'translate(-50%, -50%)',
          width: 900,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(14,165,233,${0.08 * glowPulse}) 0%, transparent 65%)`,
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />

      {/* Logo */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 48,
        }}
      >
        {/* Logo assembly */}
        <div
          style={{
            opacity: logoSpring,
            transform: `scale(${0.75 + logoSpring * 0.25})`,
          }}
        >
          <Logo
            startFrame={20}
            size="lg"
            showTagline={false}
            showBadge={false}
            pulse={false}
          />
        </div>

        {/* Horizontal rule */}
        <div
          style={{
            width: interpolate(frame, [48, 70], [0, 560], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            height: 1,
            background: `linear-gradient(90deg, transparent, ${COLORS.textMuted}66, transparent)`,
          }}
        />

        {/* Statement */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {/* Line 1 */}
          <div
            style={{
              fontSize: 52,
              fontFamily: FONTS.heading,
              fontWeight: 700,
              color: COLORS.text,
              letterSpacing: '-0.02em',
              opacity: line1Eased,
              transform: `translateY(${(1 - line1Eased) * 24}px)`,
              textAlign: 'center',
            }}
          >
            "Transparency is not a promise.
          </div>

          {/* Line 2 */}
          <div
            style={{
              fontSize: 52,
              fontFamily: FONTS.heading,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              opacity: line2Eased,
              transform: `translateY(${(1 - line2Eased) * 24}px)`,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
            }}
          >
            <span style={{ color: COLORS.textSecondary }}>It's{' '}</span>
            <span
              style={{
                background: GRADIENTS.brand,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                filter: `drop-shadow(0 0 ${20 * glowPulse}px ${COLORS.brand}88)`,
              }}
            >
              code."
            </span>
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            opacity: urlProgress,
            transform: `translateY(${(1 - urlProgress) * 14}px)`,
          }}
        >
          <div
            style={{
              width: 32,
              height: 1,
              background: COLORS.textMuted + '66',
              marginBottom: 4,
            }}
          />
          <div
            style={{
              fontSize: 22,
              fontFamily: FONTS.mono,
              color: COLORS.brand,
              letterSpacing: '0.04em',
            }}
          >
            govfund-nepal.vercel.app
          </div>
          <div
            style={{
              fontSize: 13,
              fontFamily: FONTS.body,
              color: COLORS.textMuted,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Open source · Public Ledger · Devnet
          </div>
        </div>

        {/* Nepal flag colors — bottom ornament */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            opacity: interpolate(frame, [120, 135], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {['#DC143C', '#FFFFFF', '#003893'].map((c, i) => (
            <div
              key={i}
              style={{
                width: 32,
                height: 3,
                borderRadius: 2,
                backgroundColor: c,
                opacity: c === '#FFFFFF' ? 0.4 : 0.8,
              }}
            />
          ))}
        </div>
      </AbsoluteFill>

      {/* Shockwave on logo assembly */}
      <Shockwave
        triggerFrame={35}
        x={960}
        y={400}
        color={COLORS.brand}
        maxRadius={400}
        duration={35}
        rings={2}
      />

      {/* Final vignette closes */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, rgba(5,5,5,0.7) 100%)`,
          pointerEvents: 'none',
        }}
      />

      <GrainOverlay opacity={0.035} />
    </AbsoluteFill>
  );
};
