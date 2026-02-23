import React from 'react';
import { useCurrentFrame } from 'remotion';
import { COLORS } from '../styles/colors';
import { seededRandom } from '../utils/helpers';

interface ParticlesDef {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
  color: string;
  opacity: number;
}

interface ParticlesProps {
  count?: number;
  width: number;
  height: number;
  seed?: number;
  mode?: 'rest' | 'converge' | 'explode';
  modeProgress?: number;
  baseOpacity?: number;
}

// Hex colors only — SVG doesn't accept rgba strings in fill with opacity trick
const PARTICLE_COLORS = [
  COLORS.brand,
  COLORS.brandEnd,
  COLORS.gold,
  '#525252',
  '#ffffff',
];

/**
 * All particles rendered inside a single <svg> element.
 * This is dramatically faster than individual <div> elements
 * because there is only ONE DOM node per Particles instance,
 * not `count` nodes.
 */
export const Particles: React.FC<ParticlesProps> = ({
  count = 60,
  width,
  height,
  seed = 42,
  mode = 'rest',
  modeProgress = 0,
  baseOpacity = 1,
}) => {
  const frame = useCurrentFrame();

  // Build particle definitions once — stable across frames (no random call in render loop)
  const particles = React.useMemo<ParticlesDef[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const r = seededRandom(seed + i);
      return {
        x: r(),
        y: r(),
        size: 1.2 + r() * 2.8,
        speed: 0.3 + r() * 0.7,
        phase: r() * Math.PI * 2,
        color: PARTICLE_COLORS[Math.floor(r() * PARTICLE_COLORS.length)],
        opacity: 0.15 + r() * 0.55,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, seed]);

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
      width={width}
      height={height}
    >
      {particles.map((p, i) => {
        const t = (frame * 0.01 * p.speed + p.phase) % (Math.PI * 2);
        const drift = Math.sin(t) * 30 * p.speed;
        const driftY = Math.cos(t * 0.7 + p.phase) * 20 * p.speed;

        let cx = p.x * width + drift;
        let cy = p.y * height + driftY;

        if (mode === 'converge' && modeProgress > 0) {
          const mp2 = modeProgress * modeProgress;
          cx = cx + (width / 2 - cx) * mp2;
          cy = cy + (height / 2 - cy) * mp2;
        } else if (mode === 'explode' && modeProgress > 0) {
          const dist = modeProgress * (400 + p.speed * 300);
          cx = cx + Math.cos(p.phase) * dist;
          cy = cy + Math.sin(p.phase) * dist;
        }

        const opacity = p.opacity * baseOpacity;

        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={p.size / 2}
            fill={p.color}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
};
