import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLORS, SHADOW } from '../styles/colors';

interface GlassCardProps {
  children: React.ReactNode;
  width?: number | string;
  style?: React.CSSProperties;
  /** Frame at which the card starts animating in */
  enterFrame?: number;
  /** Duration of the enter animation in frames */
  enterDuration?: number;
  /** If true, enter from bottom; otherwise fade in */
  slideUp?: boolean;
  glow?: boolean;
  glowColor?: string;
  padding?: number;
  borderColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  width,
  style,
  enterFrame = 0,
  enterDuration = 20,
  slideUp = false,
  glow = false,
  glowColor = COLORS.brand,
  padding = 28,
  borderColor = 'rgba(255,255,255,0.08)',
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [enterFrame, enterFrame + enterDuration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const easedProgress = 1 - Math.pow(1 - progress, 3);

  const translateY = slideUp ? (1 - easedProgress) * 40 : 0;
  const opacity = easedProgress;

  const glowShadow = glow
    ? `0 0 40px ${glowColor}66, 0 0 80px ${glowColor}22`
    : undefined;

  return (
    <div
      style={{
        background: COLORS.surfaceGlass,
        border: `1px solid ${borderColor}`,
        borderRadius: 16,
        padding,
        backdropFilter: 'blur(20px)',
        boxShadow: [SHADOW.glass, glowShadow].filter(Boolean).join(', '),
        opacity,
        transform: `translateY(${translateY}px)`,
        width,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
