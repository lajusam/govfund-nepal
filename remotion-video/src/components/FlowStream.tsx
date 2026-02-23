import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLORS, FONTS } from '../styles/colors';

interface FlowNode {
  label: string;
  sublabel?: string;
  color?: string;
  icon?: string;
}

interface FlowStreamProps {
  nodes: FlowNode[];
  width: number;
  startFrame?: number;
  animated?: boolean;
  orientation?: 'horizontal' | 'vertical';
  particleCount?: number;
}

export const FlowStream: React.FC<FlowStreamProps> = ({
  nodes,
  width,
  startFrame = 0,
  animated = true,
  orientation = 'vertical',
  particleCount = 5,
}) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startFrame;

  const isVertical = orientation === 'vertical';
  const nodeSpacing = isVertical
    ? 110
    : Math.floor(width / (nodes.length + 0.5));

  const containerWidth = isVertical ? 280 : width;
  const containerHeight = isVertical ? nodes.length * nodeSpacing + 40 : 180;

  return (
    <div
      style={{
        position: 'relative',
        width: containerWidth,
        height: containerHeight,
      }}
    >
      {nodes.map((node, i) => {
        const nodeEnterProgress = interpolate(
          elapsed,
          [i * 12, i * 12 + 20],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        const eased = 1 - Math.pow(1 - nodeEnterProgress, 3);

        const cx = isVertical ? containerWidth / 2 : nodeSpacing * (i + 0.5) + nodeSpacing * 0.25;
        const cy = isVertical ? i * nodeSpacing + 44 : containerHeight / 2;

        const nodeColor = node.color ?? COLORS.brand;

        // Arrow / connector
        const connectorProgress = interpolate(
          elapsed,
          [(i + 0) * 12 + 10, (i + 1) * 12 + 5],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        return (
          <React.Fragment key={i}>
            {/* Connector line + arrow */}
            {i < nodes.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  left: isVertical ? cx - 1 : cx + 40,
                  top: isVertical ? cy + 36 : cy - 1,
                  width: isVertical ? 2 : nodeSpacing - 80,
                  height: isVertical ? nodeSpacing - 58 : 2,
                  overflow: 'hidden',
                  opacity: connectorProgress,
                }}
              >
                {/* Gradient track */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: isVertical
                      ? `linear-gradient(to bottom, ${nodeColor}44, ${nodes[i + 1].color ?? COLORS.brand}44)`
                      : `linear-gradient(to right, ${nodeColor}44, ${nodes[i + 1].color ?? COLORS.brand}44)`,
                  }}
                />
                {/* Moving particle on connector */}
                {animated &&
                  Array.from({ length: particleCount }, (_, pi) => {
                    const t = ((elapsed * 0.03 + pi / particleCount) % 1);
                    return (
                      <div
                        key={pi}
                        style={{
                          position: 'absolute',
                          left: isVertical ? '50%' : `${t * 100}%`,
                          top: isVertical ? `${t * 100}%` : '50%',
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: nodeColor,
                          transform: 'translate(-50%, -50%)',
                          boxShadow: `0 0 8px ${nodeColor}`,
                          opacity: 0.4 + t * 0.6,
                        }}
                      />
                    );
                  })}
              </div>
            )}

            {/* Node circle */}
            <div
              style={{
                position: 'absolute',
                left: cx - 36,
                top: cy - 36,
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${nodeColor}33 0%, transparent 70%)`,
                border: `2px solid ${nodeColor}66`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: eased,
                transform: `scale(${0.5 + eased * 0.5})`,
                boxShadow: `0 0 20px ${nodeColor}44`,
              }}
            >
              {node.icon && (
                <span style={{ fontSize: 24 }}>{node.icon}</span>
              )}
            </div>

            {/* Node label */}
            <div
              style={{
                position: 'absolute',
                left: isVertical ? cx + 46 : cx - 60,
                top: isVertical ? cy - 14 : cy + 46,
                width: isVertical ? 180 : 120,
                opacity: eased,
                transform: `translateX(${isVertical ? (1 - eased) * 20 : 0}px)`,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontFamily: FONTS.heading,
                  fontWeight: 600,
                  color: COLORS.text,
                  lineHeight: 1.2,
                }}
              >
                {node.label}
              </div>
              {node.sublabel && (
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: FONTS.body,
                    color: COLORS.textMuted,
                    marginTop: 3,
                  }}
                >
                  {node.sublabel}
                </div>
              )}
            </div>

            {/* Step number */}
            <div
              style={{
                position: 'absolute',
                left: isVertical ? cx - 50 : cx - 50,
                top: isVertical ? cy - 10 : cy - 50,
                fontSize: 11,
                fontFamily: FONTS.mono,
                color: nodeColor + '99',
                opacity: eased,
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
