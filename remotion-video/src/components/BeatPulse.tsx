import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLORS } from '../styles/colors';

interface BeatPulseProps {
  children: React.ReactNode;
  beatInterval?: number;  // frames between beats
  strength?: number;      // scale multiplier 0–1
  color?: string;
  style?: React.CSSProperties;
}

export const BeatPulse: React.FC<BeatPulseProps> = ({
  children,
  beatInterval = 30,
  strength = 0.04,
  color = COLORS.brand,
  style,
}) => {
  const frame = useCurrentFrame();
  const phase = (frame % beatInterval) / beatInterval;

  // Sharp attack, slow decay
  const scale = 1 + strength * Math.pow(Math.max(0, 1 - phase * 2), 3);
  const glowOpacity = Math.pow(Math.max(0, 1 - phase * 1.5), 2) * 0.5;

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        filter: glowOpacity > 0.01 ? `drop-shadow(0 0 ${glowOpacity * 30}px ${color})` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

interface CounterProps {
  from: number;
  to: number;
  startFrame: number;
  duration: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<CounterProps> = ({
  from,
  to,
  startFrame,
  duration,
  decimals = 0,
  prefix = '',
  suffix = '',
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Ease out cubic
  const eased = 1 - Math.pow(1 - progress, 3);
  const value = from + (to - from) * eased;

  return (
    <span>
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  );
};
