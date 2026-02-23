import React from 'react';
import { useCurrentFrame } from 'remotion';

interface GrainOverlayProps {
  opacity?: number;
}

/**
 * Cinematic film grain via SVG feTurbulence filter.
 * Single SVG element — GPU-accelerated, zero JS per-frame overhead.
 * Seed changes each frame to animate the grain.
 */
export const GrainOverlay: React.FC<GrainOverlayProps> = ({
  opacity = 0.035,
}) => {
  const frame = useCurrentFrame();
  // Cycle seed 0-999 so the grain visibly animates
  const seed = frame % 1000;
  const filterId = `grain-${seed}`;

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        mixBlendMode: 'overlay',
        opacity,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={filterId} x="0%" y="0%" width="100%" height="100%"
          colorInterpolationFilters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.68"
            numOctaves="4"
            seed={seed}
            result="noise"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter={`url(#${filterId})`} />
    </svg>
  );
};
