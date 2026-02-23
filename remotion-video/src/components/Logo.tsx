import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, GRADIENTS, SHADOW } from '../styles/colors';

interface LogoProps {
  startFrame?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showBadge?: boolean;
  pulse?: boolean;
  style?: React.CSSProperties;
}

const SIZE_MAP = {
  sm: { title: 32, tagline: 14, badge: 11, gap: 8 },
  md: { title: 52, tagline: 18, badge: 13, gap: 12 },
  lg: { title: 72, tagline: 22, badge: 15, gap: 16 },
  xl: { title: 96, tagline: 28, badge: 18, gap: 20 },
};

export const Logo: React.FC<LogoProps> = ({
  startFrame = 0,
  size = 'lg',
  showTagline = true,
  showBadge = true,
  pulse = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = frame - startFrame;

  const s = SIZE_MAP[size];

  // Assemble logo from letters – each letter springs in
  const LETTERS = ['G', 'o', 'v', 'F', 'u', 'n', 'd'];
  const NEPAL = ['N', 'e', 'p', 'a', 'l'];

  const letterSpring = (i: number) =>
    spring({
      frame: elapsed - i * 3,
      fps,
      config: { damping: 18, stiffness: 120, mass: 0.8 },
    });

  const taglineProgress = interpolate(elapsed, [LETTERS.length * 3 + 10, LETTERS.length * 3 + 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const badgeProgress = interpolate(elapsed, [LETTERS.length * 3 + 30, LETTERS.length * 3 + 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pulseScale = pulse ? 1 + Math.sin((elapsed * Math.PI) / 45) * 0.005 : 1;
  const glowIntensity = 0.6 + Math.sin((elapsed * Math.PI) / 60) * 0.4;

  const flagColors = ['#DC143C', '#FFFFFF', '#003893'];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: s.gap,
        transform: `scale(${pulseScale})`,
        ...style,
      }}
    >
      {/* Flag accent bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {flagColors.map((c, i) => (
          <div
            key={i}
            style={{
              width: 24,
              height: 4,
              borderRadius: 2,
              backgroundColor: c,
              opacity: interpolate(elapsed, [i * 4, i * 4 + 15], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          />
        ))}
      </div>

      {/* Main wordmark */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
          fontFamily: FONTS.heading,
          lineHeight: 1,
        }}
      >
        {/* GovFund */}
        <div style={{ display: 'flex' }}>
          {LETTERS.map((letter, i) => {
            const sp = letterSpring(i);
            const isF = letter === 'F';
            const color = i < 3
              ? COLORS.text
              : COLORS.brand;

            return (
              <span
                key={i}
                style={{
                  fontSize: s.title,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: isF ? COLORS.gold : color,
                  opacity: sp,
                  transform: `translateY(${(1 - sp) * -30}px)`,
                  display: 'inline-block',
                  textShadow:
                    isF
                      ? `0 0 30px ${COLORS.gold}99`
                      : i >= 3
                      ? `0 0 30px ${COLORS.brand}99`
                      : 'none',
                }}
              >
                {letter}
              </span>
            );
          })}
        </div>

        {/* Divider dot */}
        <span
          style={{
            fontSize: s.title * 0.5,
            color: COLORS.gold,
            opacity: letterSpring(LETTERS.length),
            marginLeft: 6,
            marginRight: 6,
          }}
        >
          ·
        </span>

        {/* Nepal */}
        <div style={{ display: 'flex' }}>
          {NEPAL.map((letter, i) => {
            const sp = letterSpring(LETTERS.length + 1 + i);
            return (
              <span
                key={i}
                style={{
                  fontSize: s.title * 0.7,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: COLORS.textSecondary,
                  opacity: sp,
                  transform: `translateY(${(1 - sp) * -20}px)`,
                  display: 'inline-block',
                }}
              >
                {letter}
              </span>
            );
          })}
        </div>
      </div>

      {/* Underline glow */}
      <div
        style={{
          height: 2,
          width: `${interpolate(elapsed, [8, 35], [0, 100], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })}%`,
          background: GRADIENTS.brand,
          borderRadius: 2,
          boxShadow: `0 0 ${20 * glowIntensity}px ${COLORS.brand}`,
        }}
      />

      {/* Tagline */}
      {showTagline && (
        <div
          style={{
            fontSize: s.tagline,
            fontFamily: FONTS.body,
            color: COLORS.textSecondary,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: taglineProgress,
            transform: `translateY(${(1 - taglineProgress) * 10}px)`,
            textAlign: 'center',
          }}
        >
          Transparent Public Spending.{' '}
          <span style={{ color: COLORS.brand }}>On-Chain.</span>
        </div>
      )}

      {/* Solana badge */}
      {showBadge && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(20, 241, 149, 0.08)',
            border: '1px solid rgba(20, 241, 149, 0.2)',
            borderRadius: 999,
            padding: '6px 16px',
            opacity: badgeProgress,
            transform: `translateY(${(1 - badgeProgress) * 10}px) scale(${0.9 + 0.1 * badgeProgress})`,
          }}
        >
          {/* Solana gradient dot */}
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #9945FF, #14F195)',
            }}
          />
          <span
            style={{
              fontSize: s.badge,
              fontFamily: FONTS.mono,
              color: '#14F195',
              letterSpacing: '0.04em',
            }}
          >
            Powered by Solana Devnet
          </span>
        </div>
      )}
    </div>
  );
};
