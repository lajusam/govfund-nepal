/**
 * Scene 3 — THE SOLUTION (13–20s, 225 local frames)
 *
 * Particles converge to center → logo assembles with shockwave.
 * "Transparent Public Spending. On-Chain."
 * Solana badge.
 */
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, GRADIENTS } from '../styles/colors';
import { Particles } from '../components/Particles';
import { Logo } from '../components/Logo';
import { Shockwave } from '../components/Shockwave';
import { GrainOverlay } from '../components/GrainOverlay';
import { sceneFade } from '../utils/helpers';

const TOTAL = 225;
const CONVERGE_START = 20;
const CONVERGE_END = 70;
const LOGO_START = 65;
const SHOCKWAVE_FRAME = 72;

export const Scene3Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = sceneFade(frame, TOTAL, 15);

  const convergeProgress = interpolate(frame, [CONVERGE_START, CONVERGE_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // After logo appears, particles explode back out
  const explodeProgress = interpolate(frame, [SHOCKWAVE_FRAME, SHOCKWAVE_FRAME + 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const particleMode = frame < SHOCKWAVE_FRAME ? 'converge' : 'explode';
  const particleProgress = frame < SHOCKWAVE_FRAME ? convergeProgress : explodeProgress;

  // Background glow
  const glowIntensity = interpolate(frame, [SHOCKWAVE_FRAME - 5, SHOCKWAVE_FRAME + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Logo entrance
  const logoProgress = spring({
    frame: frame - LOGO_START,
    fps,
    config: { damping: 20, stiffness: 80, mass: 1 },
  });

  // Problem text fades out before logo
  const problemTextOut = interpolate(frame, [0, 20], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: COLORS.bgDeep, opacity }}>
      {/* Particles */}
      <Particles
        count={55}
        width={1920}
        height={1080}
        seed={3}
        mode={particleMode}
        modeProgress={particleProgress}
        baseOpacity={0.6}
      />

      {/* Central convergence glow */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${COLORS.brand}${Math.floor(glowIntensity * 40).toString(16).padStart(2,'0')} 0%, transparent 70%)`,
          filter: 'blur(20px)',
          opacity: glowIntensity,
          pointerEvents: 'none',
        }}
      />

      {/* Logo assembly */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: logoProgress,
          transform: `scale(${0.8 + logoProgress * 0.2})`,
        }}
      >
        <Logo
          startFrame={LOGO_START}
          size="xl"
          showTagline
          showBadge
          pulse
        />
      </AbsoluteFill>

      {/* Shockwave on beat drop */}
      <Shockwave
        triggerFrame={SHOCKWAVE_FRAME}
        x={960}
        y={540}
        color={COLORS.brand}
        maxRadius={700}
        duration={45}
        rings={3}
      />

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 25%, rgba(5,5,5,0.6) 100%)`,
          pointerEvents: 'none',
        }}
      />

      <GrainOverlay opacity={0.035} />
    </AbsoluteFill>
  );
};
