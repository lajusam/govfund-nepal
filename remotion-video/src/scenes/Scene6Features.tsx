/**
 * Scene 6 — CORE FEATURES (55–70s, 465 local frames)
 *
 * 8 feature cards cascade in with beat-synced entrances.
 */
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, GRADIENTS } from '../styles/colors';
import { Particles } from '../components/Particles';
import { BeatPulse } from '../components/BeatPulse';
import { GrainOverlay } from '../components/GrainOverlay';
import { sceneFade } from '../utils/helpers';

const TOTAL = 465;

const FEATURES = [
  {
    icon: '🔗',
    title: 'Fully On-Chain Records',
    desc: 'Every allocation and release is written to Solana. No off-chain storage for critical state.',
    color: COLORS.brand,
    delay: 30,
  },
  {
    icon: '🛡️',
    title: 'Admin Wallet Control',
    desc: 'Only the designated admin wallet can mutate program state. Cryptographically enforced.',
    color: COLORS.gold,
    delay: 55,
  },
  {
    icon: '📜',
    title: 'Immutable Audit Trail',
    desc: 'Blockchain ledger records are permanent. No silent edits, no retroactive changes.',
    color: COLORS.brandEnd,
    delay: 80,
  },
  {
    icon: '🌐',
    title: 'Public Transparency',
    desc: 'All project data is publicly readable without authentication. Verified by anyone.',
    color: COLORS.success,
    delay: 105,
  },
  {
    icon: '📁',
    title: 'IPFS Document Proof',
    desc: 'Procurement documents are stored on IPFS. Content hashes on-chain prevent tampering.',
    color: '#a78bfa',
    delay: 200,
  },
  {
    icon: '📊',
    title: 'Real-Time Analytics',
    desc: 'Live dashboards show budget flow, province breakdowns, and milestone completion rates.',
    color: COLORS.brand,
    delay: 225,
  },
  {
    icon: '🧾',
    title: 'No Silent Edits',
    desc: 'The smart contract prevents updates without emitting on-chain events. Every change is visible.',
    color: COLORS.warning,
    delay: 250,
  },
  {
    icon: '⚡',
    title: 'Mainnet-Ready',
    desc: 'Architecture designed for production. Migrate from Devnet to Mainnet with one config change.',
    color: COLORS.success,
    delay: 275,
  },
];

export const Scene6Features: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = sceneFade(frame, TOTAL, 15);

  const headerProgress = interpolate(frame, [10, 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Divide cards into two groups of 4
  const firstGroup = FEATURES.slice(0, 4);
  const secondGroup = FEATURES.slice(4, 8);

  return (
    <AbsoluteFill style={{ background: COLORS.bgDeep, opacity }}>
      {/* Background particles */}
      <Particles count={18} width={1920} height={1080} seed={6} mode="rest" baseOpacity={0.18} />

      {/* Section header */}
      <div
        style={{
          position: 'absolute',
          top: 56,
          left: '50%',
          transform: `translateX(-50%) translateY(${(1 - headerProgress) * -16}px)`,
          opacity: headerProgress,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontFamily: FONTS.mono,
            color: COLORS.brand,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Core Features
        </div>
        <div
          style={{
            fontSize: 40,
            fontFamily: FONTS.heading,
            fontWeight: 700,
            color: COLORS.text,
          }}
        >
          Governance infrastructure,{' '}
          <span
            style={{
              background: GRADIENTS.brand,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            not just software
          </span>
        </div>
      </div>

      {/* First row of 4 cards */}
      <div
        style={{
          position: 'absolute',
          top: 180,
          left: 100,
          right: 100,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 22,
        }}
      >
        {firstGroup.map((feature, i) => (
          <FeatureCard key={i} feature={feature} frame={frame} fps={fps} />
        ))}
      </div>

      {/* Second row of 4 cards */}
      <div
        style={{
          position: 'absolute',
          top: 420,
          left: 100,
          right: 100,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 22,
        }}
      >
        {secondGroup.map((feature, i) => (
          <FeatureCard key={i + 4} feature={feature} frame={frame} fps={fps} />
        ))}
      </div>

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 45%, rgba(5,5,5,0.55) 100%)`,
          pointerEvents: 'none',
        }}
      />

      <GrainOverlay opacity={0.03} />
    </AbsoluteFill>
  );
};

interface FeatureCardData {
  icon: string;
  title: string;
  desc: string;
  color: string;
  delay: number;
}

const FeatureCard: React.FC<{
  feature: FeatureCardData;
  frame: number;
  fps: number;
}> = ({ feature, frame, fps }) => {
  const enterSpring = spring({
    frame: frame - feature.delay,
    fps,
    config: { damping: 20, stiffness: 100, mass: 0.9 },
  });

  const cardOpacity = interpolate(frame, [feature.delay, feature.delay + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const isActive =
    frame >= feature.delay && frame < feature.delay + 80;

  const floatY = Math.sin((frame * Math.PI) / 90 + feature.delay * 0.1) * 4;

  return (
    <div
      style={{
        background: 'rgba(22, 22, 22, 0.7)',
        border: `1px solid ${isActive ? feature.color + '44' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 14,
        padding: '22px 20px',
        backdropFilter: 'blur(12px)',
        boxShadow: isActive
          ? `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${feature.color}22`
          : '0 8px 32px rgba(0,0,0,0.4)',
        opacity: cardOpacity,
        transform: `scale(${0.88 + enterSpring * 0.12}) translateY(${(1 - enterSpring) * 24 + floatY * (cardOpacity)}px)`,
        transition: 'border-color 0.3s ease',
        height: 200,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          background: `${feature.color}18`,
          border: `1px solid ${feature.color}33`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          marginBottom: 14,
          boxShadow: isActive ? `0 0 16px ${feature.color}44` : undefined,
          flexShrink: 0,
        }}
      >
        {feature.icon}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 15,
          fontFamily: FONTS.heading,
          fontWeight: 600,
          color: isActive ? COLORS.text : COLORS.textSecondary,
          lineHeight: 1.25,
          marginBottom: 8,
          flexShrink: 0,
        }}
      >
        {feature.title}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 12,
          fontFamily: FONTS.body,
          color: COLORS.textMuted,
          lineHeight: 1.55,
          flex: 1,
        }}
      >
        {feature.desc}
      </div>

      {/* Bottom accent */}
      <div
        style={{
          marginTop: 12,
          height: 2,
          background: `linear-gradient(90deg, ${feature.color}88, transparent)`,
          borderRadius: 1,
          opacity: isActive ? 1 : 0.3,
          flexShrink: 0,
        }}
      />
    </div>
  );
};
