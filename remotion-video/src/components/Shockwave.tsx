import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLORS } from '../styles/colors';

interface ShockwaveProps {
  triggerFrame: number;
  x?: number;         // center x (px)
  y?: number;         // center y (px)
  color?: string;
  maxRadius?: number;
  duration?: number;
  rings?: number;
}

export const Shockwave: React.FC<ShockwaveProps> = ({
  triggerFrame,
  x = 960,
  y = 540,
  color = COLORS.brand,
  maxRadius = 600,
  duration = 40,
  rings = 3,
}) => {
  const frame = useCurrentFrame();
  const elapsed = frame - triggerFrame;

  if (elapsed < 0 || elapsed > duration) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: rings }, (_, i) => {
        const ringDelay = (i / rings) * duration * 0.4;
        const localElapsed = elapsed - ringDelay;
        if (localElapsed < 0) return null;

        const progress = localElapsed / duration;
        const easedProgress = 1 - Math.pow(1 - Math.min(progress, 1), 3);
        const radius = easedProgress * maxRadius;
        const opacity = interpolate(progress, [0, 0.3, 1], [0, 0.7, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - radius,
              top: y - radius,
              width: radius * 2,
              height: radius * 2,
              borderRadius: '50%',
              border: `${2 - i * 0.5}px solid ${color}`,
              opacity,
              boxShadow: `0 0 ${20 - i * 5}px ${color}66`,
            }}
          />
        );
      })}

      {/* Central flash */}
      {elapsed < duration * 0.3 && (
        <div
          style={{
            position: 'absolute',
            left: x - 100,
            top: y - 100,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}88 0%, transparent 70%)`,
            opacity: interpolate(elapsed, [0, duration * 0.05, duration * 0.3], [0, 1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            filter: 'blur(4px)',
          }}
        />
      )}
    </div>
  );
};
