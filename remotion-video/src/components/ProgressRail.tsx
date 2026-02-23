import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLORS, FONTS } from '../styles/colors';

interface Step {
  label: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface ProgressRailProps {
  steps: Step[];
  startFrame?: number;
  framesPerStep?: number;
  orientation?: 'horizontal' | 'vertical';
  width?: number;
}

export const ProgressRail: React.FC<ProgressRailProps> = ({
  steps,
  startFrame = 0,
  framesPerStep = 40,
  orientation = 'vertical',
  width = 600,
}) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startFrame;

  const isHorizontal = orientation === 'horizontal';

  const activeStepIndex = Math.min(
    Math.floor(elapsed / framesPerStep),
    steps.length - 1
  );

  const stepProgress = (elapsed % framesPerStep) / framesPerStep;

  const railProgress = interpolate(
    elapsed,
    [0, framesPerStep * steps.length],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        alignItems: isHorizontal ? 'flex-start' : 'flex-start',
        gap: 0,
        width: isHorizontal ? width : 320,
        position: 'relative',
      }}
    >
      {steps.map((step, i) => {
        const isActive = i === activeStepIndex;
        const isCompleted = i < activeStepIndex;
        const stepColor = step.color ?? COLORS.brand;

        const itemProgress = interpolate(
          elapsed,
          [i * framesPerStep, i * framesPerStep + 20],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        const eased = 1 - Math.pow(1 - itemProgress, 3);

        const pulseScale = isActive
          ? 1 + Math.sin((elapsed * Math.PI) / 20) * 0.1
          : 1;

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: isHorizontal ? 'column' : 'row',
              alignItems: isHorizontal ? 'center' : 'flex-start',
              flex: isHorizontal ? 1 : undefined,
              position: 'relative',
              opacity: eased,
            }}
          >
            {/* Rail track */}
            {i < steps.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  ...(isHorizontal
                    ? { top: 20, left: '50%', right: '-50%', height: 2 }
                    : { left: 19, top: 40, bottom: -40, width: 2 }),
                  background: 'rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                }}
              >
                {/* Fill */}
                <div
                  style={{
                    position: 'absolute',
                    ...(isHorizontal
                      ? { top: 0, left: 0, height: '100%', width: isCompleted ? '100%' : isActive ? `${stepProgress * 100}%` : '0%' }
                      : { left: 0, top: 0, width: '100%', height: isCompleted ? '100%' : isActive ? `${stepProgress * 100}%` : '0%' }),
                    background: stepColor,
                    transition: 'none',
                    boxShadow: `0 0 8px ${stepColor}`,
                  }}
                />
              </div>
            )}

            {/* Step node */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                flexShrink: 0,
                border: `2px solid ${isCompleted || isActive ? stepColor : 'rgba(255,255,255,0.12)'}`,
                background: isCompleted
                  ? stepColor
                  : isActive
                  ? `${stepColor}33`
                  : 'rgba(255,255,255,0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${pulseScale})`,
                boxShadow: isActive ? `0 0 20px ${stepColor}66` : undefined,
                zIndex: 1,
                marginBottom: isHorizontal ? 10 : 0,
                marginRight: isHorizontal ? 0 : 16,
              }}
            >
              {step.icon ? (
                <span style={{ fontSize: 16 }}>{step.icon}</span>
              ) : (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: FONTS.mono,
                    color: isCompleted ? '#000' : isActive ? stepColor : COLORS.textMuted,
                  }}
                >
                  {isCompleted ? '✓' : String(i + 1)}
                </span>
              )}
            </div>

            {/* Step text */}
            <div
              style={{
                maxWidth: isHorizontal ? 140 : undefined,
                textAlign: isHorizontal ? 'center' : undefined,
                marginBottom: isHorizontal ? 0 : 32,
                paddingTop: isHorizontal ? 0 : 8,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: FONTS.heading,
                  color: isActive ? COLORS.text : isCompleted ? COLORS.textSecondary : COLORS.textMuted,
                  lineHeight: 1.2,
                }}
              >
                {step.label}
              </div>
              {step.description && (
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: FONTS.body,
                    color: COLORS.textMuted,
                    marginTop: 4,
                    lineHeight: 1.4,
                    maxWidth: 220,
                    opacity: isActive ? 1 : 0.5,
                  }}
                >
                  {step.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
