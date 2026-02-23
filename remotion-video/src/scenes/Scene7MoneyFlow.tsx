/**
 * Scene 7 — MONEY FLOW (70–80s, 315 local frames)
 *
 * Animated fund flow visualization.
 * Government Budget → Project Allocation → Fund Release → Milestones → Public Ledger
 * Green = verified, Gold = approved, Red blocked = overspending prevented.
 */
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, GRADIENTS } from '../styles/colors';
import { Particles } from '../components/Particles';
import { GrainOverlay } from '../components/GrainOverlay';
import { AnimatedCounter } from '../components/BeatPulse';
import { sceneFade } from '../utils/helpers';

const TOTAL = 315;

const FLOW_NODES = [
  {
    label: 'Government\nBudget',
    sublabel: '₹ 42.7B',
    color: COLORS.gold,
    icon: '🏛️',
    delay: 20,
  },
  {
    label: 'Project\nAllocation',
    sublabel: '₹ 23.4B',
    color: COLORS.brand,
    icon: '📋',
    delay: 60,
  },
  {
    label: 'Fund\nRelease',
    sublabel: '₹ 12.1B',
    color: COLORS.brandEnd,
    icon: '🔓',
    delay: 100,
  },
  {
    label: 'Milestones\nCompleted',
    sublabel: '847 / 1,247',
    color: COLORS.success,
    icon: '✅',
    delay: 140,
  },
  {
    label: 'Public\nLedger',
    sublabel: 'Verified ✓',
    color: COLORS.success,
    icon: '📖',
    delay: 180,
  },
];

const CONNECTOR_WIDTH = 160;
const NODE_SIZE = 110;

export const Scene7MoneyFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = sceneFade(frame, TOTAL, 15);

  const headerProgress = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const totalWidth = FLOW_NODES.length * NODE_SIZE + (FLOW_NODES.length - 1) * CONNECTOR_WIDTH;
  const startX = (1920 - totalWidth) / 2;

  // Overspend shield animation
  const shieldProgress = interpolate(frame, [230, 260], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: COLORS.bgDeep, opacity }}>
      {/* Background */}
      <Particles count={15} width={1920} height={1080} seed={7} mode="rest" baseOpacity={0.15} />

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
            color: COLORS.gold,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Fund Flow
        </div>
        <div
          style={{
            fontSize: 40,
            fontFamily: FONTS.heading,
            fontWeight: 700,
            color: COLORS.text,
            lineHeight: 1.15,
          }}
        >
          Every rupee,{' '}
          <span
            style={{
              background: GRADIENTS.gold,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            traced on-chain
          </span>
        </div>
      </div>

      {/* Flow diagram */}
      <div
        style={{
          position: 'absolute',
          top: 260,
          left: startX,
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'row',
        }}
      >
        {FLOW_NODES.map((node, i) => {
          const nodeEnter = spring({
            frame: frame - node.delay,
            fps,
            config: { damping: 20, stiffness: 90, mass: 1 },
          });
          const nodeOpacity = interpolate(frame, [node.delay, node.delay + 15], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const floatY = Math.sin((frame * Math.PI) / 80 + i * 1.4) * 8;

          return (
            <React.Fragment key={i}>
              {/* Node */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  opacity: nodeOpacity,
                  transform: `scale(${0.6 + nodeEnter * 0.4}) translateY(${(1 - nodeEnter) * 30 + floatY}px)`,
                }}
              >
                {/* Circle */}
                <div
                  style={{
                    width: NODE_SIZE,
                    height: NODE_SIZE,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${node.color}33 0%, ${node.color}11 60%, transparent 100%)`,
                    border: `2.5px solid ${node.color}88`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 32px ${node.color}44, 0 0 60px ${node.color}18`,
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 30 }}>{node.icon}</span>
                </div>

                {/* Label */}
                <div
                  style={{
                    marginTop: 16,
                    textAlign: 'center',
                  }}
                >
                  {node.label.split('\n').map((line, li) => (
                    <div
                      key={li}
                      style={{
                        fontSize: 15,
                        fontFamily: FONTS.heading,
                        fontWeight: li === 0 ? 600 : 400,
                        color: li === 0 ? COLORS.text : COLORS.textSecondary,
                        lineHeight: 1.3,
                      }}
                    >
                      {line}
                    </div>
                  ))}
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 18,
                      fontFamily: FONTS.mono,
                      fontWeight: 700,
                      color: node.color,
                    }}
                  >
                    {node.sublabel}
                  </div>
                </div>

                {/* Step number */}
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    fontFamily: FONTS.mono,
                    color: node.color + '88',
                    letterSpacing: '0.06em',
                  }}
                >
                  STEP {String(i + 1).padStart(2, '0')}
                </div>
              </div>

              {/* Connector arrow */}
              {i < FLOW_NODES.length - 1 && (
                <div
                  style={{
                    width: CONNECTOR_WIDTH,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    paddingBottom: 60,
                  }}
                >
                  {/* Arrow track */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: 2,
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 1,
                      overflow: 'visible',
                    }}
                  >
                    {/* Fill */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${interpolate(
                          frame,
                          [node.delay + 20, FLOW_NODES[i + 1].delay],
                          [0, 100],
                          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                        )}%`,
                        background: `linear-gradient(90deg, ${node.color}, ${FLOW_NODES[i + 1].color})`,
                        boxShadow: `0 0 8px ${node.color}`,
                        borderRadius: 1,
                      }}
                    />

                    {/* Arrowhead */}
                    <div
                      style={{
                        position: 'absolute',
                        right: -8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 0,
                        height: 0,
                        borderTop: '5px solid transparent',
                        borderBottom: '5px solid transparent',
                        borderLeft: `8px solid ${FLOW_NODES[i + 1].color}`,
                        opacity: interpolate(frame, [FLOW_NODES[i + 1].delay - 10, FLOW_NODES[i + 1].delay], [0, 1], {
                          extrapolateLeft: 'clamp',
                          extrapolateRight: 'clamp',
                        }),
                      }}
                    />

                    {/* Moving particle (SVG — single element) */}
                    {frame > node.delay + 20 && (
                      <svg
                        style={{ position: 'absolute', inset: 0, width: '100%', height: 2, overflow: 'visible' }}
                      >
                        <circle
                          cx={`${((frame * 0.025 + i * 0.33) % 1) * 100}%`}
                          cy={1}
                          r={3}
                          fill={node.color}
                          opacity={0.8}
                        />
                      </svg>
                    )}
                  </div>

                  {/* Transfer amount label */}
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: FONTS.mono,
                      color: COLORS.textMuted,
                      opacity: interpolate(frame, [node.delay + 30, node.delay + 50], [0, 1], {
                        extrapolateLeft: 'clamp',
                        extrapolateRight: 'clamp',
                      }),
                    }}
                  >
                    verified tx
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* OVERSPEND PREVENTION block */}
      <div
        style={{
          position: 'absolute',
          bottom: 90,
          left: '50%',
          transform: `translateX(-50%) scale(${0.8 + shieldProgress * 0.2})`,
          opacity: shieldProgress,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 12,
          padding: '14px 28px',
          boxShadow: '0 0 24px rgba(239,68,68,0.12)',
        }}
      >
        <div style={{ fontSize: 20 }}>🛑</div>
        <div>
          <div style={{ fontSize: 14, fontFamily: FONTS.heading, fontWeight: 600, color: COLORS.error }}>
            Overspend Guard — On-Chain Enforced
          </div>
          <div style={{ fontSize: 12, fontFamily: FONTS.body, color: COLORS.textMuted, marginTop: 2 }}>
            Released funds{' '}
            <span style={{ color: COLORS.error }}>cannot exceed</span>
            {' '}allocated budget. Enforced by smart contract. No exceptions.
          </div>
        </div>
      </div>

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(5,5,5,0.6) 100%)`,
          pointerEvents: 'none',
        }}
      />

      <GrainOverlay opacity={0.03} />
    </AbsoluteFill>
  );
};
