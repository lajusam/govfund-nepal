import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { COLORS, FONTS } from '../styles/colors';
import { seededRandom } from '../utils/helpers';

interface NetworkNode {
  label: string;
  x: number; // 0–1
  y: number; // 0–1
  color?: string;
  size?: number;
  icon?: string;
}

interface Edge {
  from: number;
  to: number;
}

interface NodeNetworkProps {
  nodes: NetworkNode[];
  edges: Edge[];
  width: number;
  height: number;
  startFrame?: number;
  seed?: number;
}

export const NodeNetwork: React.FC<NodeNetworkProps> = ({
  nodes,
  edges,
  width,
  height,
  startFrame = 0,
  seed = 77,
}) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startFrame;
  const rng = seededRandom(seed);

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* SVG edges */}
      <svg
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        width={width}
        height={height}
      >
        <defs>
          <filter id="glow-edge">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {edges.map((edge, i) => {
          const from = nodes[edge.from];
          const to = nodes[edge.to];
          if (!from || !to) return null;

          const x1 = from.x * width;
          const y1 = from.y * height;
          const x2 = to.x * width;
          const y2 = to.y * height;

          const edgeProgress = interpolate(
            elapsed,
            [i * 6 + 10, i * 6 + 28],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          // Draw partial line based on progress
          const mx = x1 + (x2 - x1) * edgeProgress;
          const my = y1 + (y2 - y1) * edgeProgress;

          // Pulse particle along edge
          const pulseT = (elapsed * 0.02 + i * 0.33) % 1;
          const px = x1 + (x2 - x1) * pulseT;
          const py = y1 + (y2 - y1) * pulseT;

          const color = from.color ?? COLORS.brand;

          return (
            <g key={i}>
              <line
                x1={x1}
                y1={y1}
                x2={mx}
                y2={my}
                stroke={color}
                strokeWidth={1}
                strokeOpacity={0.25}
                filter="url(#glow-edge)"
              />
              {edgeProgress >= 1 && (
                <circle cx={px} cy={py} r={2.5} fill={color} opacity={0.7} filter="url(#glow-edge)" />
              )}
            </g>
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => {
        const nodeProgress = interpolate(
          elapsed,
          [i * 8, i * 8 + 20],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        const eased = 1 - Math.pow(1 - nodeProgress, 3);
        const nodeColor = node.color ?? COLORS.brand;
        const nodeSize = node.size ?? 48;
        const cx = node.x * width;
        const cy = node.y * height;

        const floatY = Math.sin((elapsed * Math.PI) / 72 + i * 1.2) * 5;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: cx - nodeSize / 2,
              top: cy - nodeSize / 2 + floatY,
              width: nodeSize,
              height: nodeSize,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${nodeColor}44 0%, ${nodeColor}11 60%, transparent 100%)`,
              border: `1.5px solid ${nodeColor}66`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: eased,
              transform: `scale(${0.4 + eased * 0.6})`,
              boxShadow: `0 0 24px ${nodeColor}44`,
            }}
          >
            {node.icon && <span style={{ fontSize: nodeSize * 0.4 }}>{node.icon}</span>}
          </div>
        );
      })}

      {/* Labels */}
      {nodes.map((node, i) => {
        const nodeProgress = interpolate(
          elapsed,
          [i * 8 + 15, i * 8 + 30],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        const nodeSize = node.size ?? 48;
        const cx = node.x * width;
        const cy = node.y * height;
        const floatY = Math.sin((elapsed * Math.PI) / 72 + i * 1.2) * 5;

        return (
          <div
            key={`label-${i}`}
            style={{
              position: 'absolute',
              left: cx - 60,
              top: cy + nodeSize / 2 + 8 + floatY,
              width: 120,
              textAlign: 'center',
              opacity: nodeProgress,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: FONTS.body,
                fontWeight: 600,
                color: COLORS.textSecondary,
                letterSpacing: '0.04em',
              }}
            >
              {node.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
