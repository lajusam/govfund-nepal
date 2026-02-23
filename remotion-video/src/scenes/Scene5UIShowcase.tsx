/**
 * Scene 5 — PLATFORM UI SHOWCASE (40–55s, 465 local frames)
 *
 * Floating 3D screens of the GovFund Nepal interface.
 * Dashboard, Project Detail, Province hierarchy, Analytics.
 */
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, GRADIENTS } from '../styles/colors';
import { ScreenMockup } from '../components/ScreenMockup';
import { Particles } from '../components/Particles';
import { GrainOverlay } from '../components/GrainOverlay';
import { sceneFade } from '../utils/helpers';

const TOTAL = 465;

export const Scene5UIShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = sceneFade(frame, TOTAL, 15);

  // Section header
  const headerProgress = interpolate(frame, [10, 28], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Slow pan: screens drift subtly
  const panX = Math.sin((frame * Math.PI) / 300) * 20;

  return (
    <AbsoluteFill style={{ background: COLORS.bgDeep, opacity }}>
      {/* Background */}
      <Particles count={18} width={1920} height={1080} seed={5} mode="rest" baseOpacity={0.15} />

      {/* Background grid */}
      <AbsoluteFill style={{ pointerEvents: 'none', opacity: 0.04 }}>
        <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <pattern id="grid5" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#0ea5e9" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="1920" height="1080" fill="url(#grid5)" />
        </svg>
      </AbsoluteFill>

      {/* Section header */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: '50%',
          transform: `translateX(-50%) translateY(${(1 - headerProgress) * -20}px)`,
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
          Platform Preview
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
          Built for{' '}
          <span
            style={{
              background: GRADIENTS.brand,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            every citizen
          </span>
        </div>
      </div>

      {/* Screens */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          paddingTop: 140,
          paddingLeft: 100,
          paddingRight: 100,
          transform: `translateX(${panX}px)`,
        }}
      >
        {/* Screen 1 — Dashboard */}
        <ScreenMockup
          title="dashboard.govfund.np"
          type="dashboard"
          startFrame={30}
          width={420}
          height={300}
          rotateY={12}
          rotateX={-4}
          scale={1}
          annotation="Real-time public visibility"
        />

        {/* Screen 2 — Project Detail (center, larger) */}
        <ScreenMockup
          title="project / ring-road-ktm"
          type="detail"
          startFrame={60}
          width={480}
          height={340}
          rotateY={0}
          rotateX={-2}
          scale={1.08}
          annotation="IPFS-verified documents"
          style={{ zIndex: 2 }}
        />

        {/* Screen 3 — Hierarchy */}
        <ScreenMockup
          title="hierarchy / province / bagmati"
          type="hierarchy"
          startFrame={90}
          width={380}
          height={280}
          rotateY={-12}
          rotateX={-4}
          scale={0.95}
          annotation="Province → District hierarchy"
        />
      </AbsoluteFill>

      {/* Bottom row: analytics */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: '50%',
          transform: `translateX(-50%) translateY(${
            interpolate(frame, [150, 180], [40, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }px)`,
          opacity: interpolate(frame, [150, 180], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <ScreenMockup
          title="analytics.govfund.np"
          type="analytics"
          startFrame={150}
          width={580}
          height={220}
          rotateY={0}
          rotateX={6}
          scale={1}
          annotation="Wallet-secured administration"
        />
      </div>

      {/* Annotation labels */}
      {[
        { text: '1,247 Active Projects', x: 160, y: 120, frame: 120 },
        { text: '₹ 42.7B Total Budget', x: 960, y: 100, frame: 130 },
        { text: '98.4% Audit Coverage', x: 1700, y: 130, frame: 140 },
      ].map((ann, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: ann.x,
            top: ann.y,
            transform: 'translateX(-50%)',
            opacity: interpolate(frame, [ann.frame, ann.frame + 20], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            background: 'rgba(14,165,233,0.1)',
            border: '1px solid rgba(14,165,233,0.3)',
            borderRadius: 999,
            padding: '5px 14px',
            fontSize: 12,
            fontFamily: FONTS.mono,
            color: COLORS.brand,
            whiteSpace: 'nowrap',
          }}
        >
          {ann.text}
        </div>
      ))}

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
