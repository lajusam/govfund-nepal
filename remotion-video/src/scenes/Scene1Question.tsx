/**
 * Scene 1 — THE QUESTION (0–5s, 165 local frames)
 *
 * A calm, serious opening.
 * "Where does public money go?"
 * "Can trust be enforced by code?"
 */
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { COLORS, FONTS } from '../styles/colors';
import { Particles } from '../components/Particles';
import { GrainOverlay } from '../components/GrainOverlay';
import { sceneFade } from '../utils/helpers';

const TOTAL = 165;

export const Scene1Question: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneFade(frame, TOTAL, 15);

  // Camera drift — slow parallax movement
  const driftX = Math.sin((frame * Math.PI) / 120) * 8;
  const driftY = Math.cos((frame * Math.PI) / 160) * 5;

  // First line enters at frame 20
  const line1Progress = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const line1Eased = 1 - Math.pow(1 - line1Progress, 3);

  // Second line enters at frame 70
  const line2Progress = interpolate(frame, [70, 100], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const line2Eased = 1 - Math.pow(1 - line2Progress, 3);

  // Vignette pulse
  const vignetteIntensity = 0.4 + Math.sin((frame * Math.PI) / 90) * 0.05;

  // Cursor blink for line 1
  const cursor1Active = frame >= 20 && frame < 55;
  const cursor1Blink = Math.floor(frame / 8) % 2 === 0;

  // Cursor blink for line 2
  const cursor2Active = frame >= 70 && frame < 105;
  const cursor2Blink = Math.floor(frame / 8) % 2 === 0;

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bgDeep,
        opacity,
      }}
    >
      {/* Camera drift container */}
      <div
        style={{
          position: 'absolute',
          inset: -20,
          transform: `translate(${driftX}px, ${driftY}px)`,
        }}
      >
        {/* Background particles */}
        <Particles
          count={40}
          width={1960}
          height={1120}
          seed={1}
          mode="rest"
          baseOpacity={0.5}
        />
      </div>

      {/* Radial light at center */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(14,165,233,0.06) 0%, transparent 60%)`,
          opacity: line1Eased,
        }}
      />

      {/* Typography */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        {/* Line 1 */}
        <div
          style={{
            opacity: line1Eased,
            transform: `translateY(${(1 - line1Eased) * 30}px)`,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize: 68,
              fontFamily: FONTS.heading,
              fontWeight: 700,
              color: COLORS.text,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            Where does public money go?
            {cursor1Active && cursor1Blink && (
              <span
                style={{
                  display: 'inline-block',
                  width: 3,
                  height: '0.85em',
                  backgroundColor: COLORS.brand,
                  verticalAlign: 'middle',
                  marginLeft: 4,
                  borderRadius: 1,
                }}
              />
            )}
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: interpolate(frame, [55, 70], [0, 120], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            height: 1,
            background: `linear-gradient(90deg, transparent, ${COLORS.textMuted}, transparent)`,
          }}
        />

        {/* Line 2 */}
        <div
          style={{
            opacity: line2Eased,
            transform: `translateY(${(1 - line2Eased) * 20}px)`,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize: 48,
              fontFamily: FONTS.heading,
              fontWeight: 400,
              color: COLORS.textSecondary,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              fontStyle: 'italic',
            }}
          >
            Can trust be enforced by code?
            {cursor2Active && cursor2Blink && (
              <span
                style={{
                  display: 'inline-block',
                  width: 3,
                  height: '0.85em',
                  backgroundColor: COLORS.textMuted,
                  verticalAlign: 'middle',
                  marginLeft: 4,
                  borderRadius: 1,
                }}
              />
            )}
          </span>
        </div>

        {/* Subtitle hint */}
        <div
          style={{
            opacity: interpolate(frame, [100, 120], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
            fontSize: 16,
            fontFamily: FONTS.mono,
            color: COLORS.textMuted,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginTop: 16,
          }}
        >
          A question for every citizen.
        </div>
      </AbsoluteFill>

      {/* Vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, rgba(5,5,5,${vignetteIntensity}) 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Film grain */}
      <GrainOverlay opacity={0.04} />
    </AbsoluteFill>
  );
};
