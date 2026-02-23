/**
 * Scene 4 — HOW IT WORKS (20–40s, 615 local frames)
 *
 * Four steps with progress rail.
 * Wallet signing, on-chain confirmation, event logs, immutable records.
 */
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, GRADIENTS } from '../styles/colors';
import { ProgressRail } from '../components/ProgressRail';
import { Particles } from '../components/Particles';
import { GrainOverlay } from '../components/GrainOverlay';
import { TypewriterText } from '../components/TypewriterText';
import { sceneFade } from '../utils/helpers';

const TOTAL = 615;

const STEPS = [
  {
    label: 'Allocate Budget',
    description: 'Government allocates funds to a project on-chain. Wallet signature required.',
    icon: '💰',
    color: COLORS.gold,
  },
  {
    label: 'Release Funds',
    description: 'Milestone-gated releases. On-chain check: cannot exceed allocated amount.',
    icon: '🔓',
    color: COLORS.brand,
  },
  {
    label: 'Track Milestones',
    description: 'Every milestone update emits a blockchain event. Fully auditable.',
    icon: '📍',
    color: COLORS.brandEnd,
  },
  {
    label: 'Public Verification',
    description: 'Any citizen, journalist, or auditor can verify records in real time.',
    icon: '🔍',
    color: COLORS.success,
  },
];

// Simulated on-chain log lines
const LOG_LINES = [
  { text: '> wallet.sign({ instruction: AllocateBudget })', color: COLORS.gold, frame: 80 },
  { text: '✓ TX: 5xKj...devnet confirmed (slot 284491)', color: COLORS.success, frame: 100 },
  { text: '> emit!(FundsAllocated { project_id, amount: 3.2B })', color: COLORS.brand, frame: 180 },
  { text: '> wallet.sign({ instruction: ReleaseFunds })', color: COLORS.gold, frame: 230 },
  { text: '✓ guard: released <= allocated → OK', color: COLORS.success, frame: 250 },
  { text: '✓ TX: 8mNp...devnet confirmed (slot 284512)', color: COLORS.success, frame: 270 },
  { text: '> emit!(FundsReleased { milestone: 1, amount: 0.8B })', color: COLORS.brand, frame: 340 },
  { text: '> IPFS.store(doc_hash: "Qm7xH3...")', color: COLORS.brandEnd, frame: 420 },
  { text: '✓ immutable_record: cannot_edit = true', color: COLORS.success, frame: 480 },
  { text: '> PublicLedger.verify(project_id) → VERIFIED ✓', color: COLORS.success, frame: 560 },
];

export const Scene4HowItWorks: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = sceneFade(frame, TOTAL, 15);

  // Section header
  const headerProgress = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Which log lines to show
  const visibleLogs = LOG_LINES.filter((l) => frame >= l.frame);

  // Terminal window entrance
  const terminalProgress = spring({
    frame: frame - 55,
    fps,
    config: { damping: 22, stiffness: 100, mass: 1 },
  });

  return (
    <AbsoluteFill style={{ background: COLORS.bgDeep, opacity }}>
      {/* Subtle background particles */}
      <Particles
        count={20}
        width={1920}
        height={1080}
        seed={4}
        mode="rest"
        baseOpacity={0.2}
      />

      {/* Layout: left rail + right terminal */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          padding: '96px 120px',
          gap: 80,
        }}
      >
        {/* LEFT — Steps */}
        <div
          style={{
            flex: '0 0 520px',
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          {/* Header */}
          <div
            style={{
              opacity: headerProgress,
              transform: `translateY(${(1 - headerProgress) * 20}px)`,
              marginBottom: 48,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: FONTS.mono,
                color: COLORS.brand,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              How It Works
            </div>
            <div
              style={{
                fontSize: 42,
                fontFamily: FONTS.heading,
                fontWeight: 700,
                color: COLORS.text,
                lineHeight: 1.15,
              }}
            >
              Four steps to{' '}
              <span
                style={{
                  background: GRADIENTS.brand,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                full transparency
              </span>
            </div>
          </div>

          {/* Progress Rail */}
          <ProgressRail
            steps={STEPS}
            startFrame={20}
            framesPerStep={130}
            orientation="vertical"
          />
        </div>

        {/* RIGHT — Terminal */}
        <div
          style={{
            flex: 1,
            opacity: terminalProgress,
            transform: `translateX(${(1 - terminalProgress) * 40}px)`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Terminal window */}
          <div
            style={{
              flex: 1,
              background: '#0d0d0d',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
            }}
          >
            {/* Title bar */}
            <div
              style={{
                background: '#1a1a1a',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {['#ef4444', '#f59e0b', '#22c55e'].map((c, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
              ))}
              <div
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 12,
                  fontFamily: FONTS.mono,
                  color: COLORS.textMuted,
                }}
              >
                govfund-nepal — solana devnet
              </div>
            </div>

            {/* Log output */}
            <div
              style={{
                padding: '20px 24px',
                fontFamily: FONTS.mono,
                fontSize: 13,
                lineHeight: 1.7,
                color: COLORS.textMuted,
                height: 'calc(100% - 40px)',
                overflow: 'hidden',
              }}
            >
              {/* Static header */}
              <div style={{ color: '#404040', marginBottom: 12 }}>
                $ node govfund-client.js --network devnet
              </div>
              <div style={{ color: COLORS.brand, marginBottom: 16 }}>
                GovFund Nepal — Solana Devnet · Program: 8xF3...
              </div>

              {/* Dynamic log lines */}
              {visibleLogs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    color: log.color,
                    opacity: interpolate(frame, [log.frame, log.frame + 8], [0, 1], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    }),
                  }}
                >
                  {log.text}
                </div>
              ))}

              {/* Blinking cursor */}
              {Math.floor(frame / 15) % 2 === 0 && (
                <div style={{ color: COLORS.brand, opacity: 0.8 }}>▮</div>
              )}
            </div>
          </div>

          {/* Stats row below terminal */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 20,
              opacity: interpolate(frame, [200, 230], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {[
              { label: 'Avg Confirmation', value: '0.4s', color: COLORS.success },
              { label: 'TX Finality', value: '99.98%', color: COLORS.brand },
              { label: 'Cost per TX', value: '$0.00025', color: COLORS.gold },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontFamily: FONTS.heading,
                    fontWeight: 700,
                    color: stat.color,
                    marginBottom: 4,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: FONTS.body,
                    color: COLORS.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 50%, rgba(5,5,5,0.5) 100%)`,
          pointerEvents: 'none',
        }}
      />

      <GrainOverlay opacity={0.03} />
    </AbsoluteFill>
  );
};
