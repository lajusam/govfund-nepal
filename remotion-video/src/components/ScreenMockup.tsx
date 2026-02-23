import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { COLORS, FONTS, GRADIENTS, SHADOW } from '../styles/colors';

interface MetricItem {
  label: string;
  value: string;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface ScreenMockupProps {
  title: string;
  subtitle?: string;
  metrics?: MetricItem[];
  rows?: Array<{ label: string; status: string; amount: string; color: string }>;
  type: 'dashboard' | 'detail' | 'hierarchy' | 'analytics';
  startFrame?: number;
  width?: number;
  height?: number;
  rotateY?: number;
  rotateX?: number;
  scale?: number;
  annotation?: string;
  style?: React.CSSProperties;
}

export const ScreenMockup: React.FC<ScreenMockupProps> = ({
  title,
  subtitle,
  metrics = [],
  rows = [],
  type,
  startFrame = 0,
  width = 480,
  height = 320,
  rotateY = -12,
  rotateX = 4,
  scale = 1,
  annotation,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = frame - startFrame;

  const enterProgress = spring({
    frame: elapsed,
    fps,
    config: { damping: 22, stiffness: 100, mass: 1 },
  });

  const opacity = interpolate(elapsed, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const floatY = Math.sin((elapsed * Math.PI) / 80) * 8;
  const floatX = Math.cos((elapsed * Math.PI) / 120) * 4;

  return (
    <div
      style={{
        opacity,
        transform: `
          perspective(1000px)
          rotateY(${rotateY * (2 - enterProgress)}deg)
          rotateX(${rotateX * (2 - enterProgress)}deg)
          scale(${scale * (0.7 + enterProgress * 0.3)})
          translateY(${floatY}px)
          translateX(${floatX}px)
        `,
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      {/* Screen body */}
      <div
        style={{
          width,
          height,
          background: COLORS.surface,
          border: `1px solid rgba(255,255,255,0.08)`,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: SHADOW.glass,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Title bar */}
        <div
          style={{
            padding: '10px 16px',
            background: COLORS.surfaceLight,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          {/* Traffic lights */}
          {['#ef4444', '#f59e0b', '#22c55e'].map((c, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
          ))}
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 11,
              fontFamily: FONTS.mono,
              color: COLORS.textMuted,
              letterSpacing: '0.02em',
            }}
          >
            {title}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: 16, overflow: 'hidden' }}>
          {type === 'dashboard' && (
            <DashboardContent metrics={metrics} elapsed={elapsed} />
          )}
          {type === 'detail' && (
            <DetailContent rows={rows} elapsed={elapsed} subtitle={subtitle} />
          )}
          {type === 'hierarchy' && (
            <HierarchyContent elapsed={elapsed} />
          )}
          {type === 'analytics' && (
            <AnalyticsContent elapsed={elapsed} />
          )}
        </div>
      </div>

      {/* Annotation badge */}
      {annotation && (
        <div
          style={{
            position: 'absolute',
            bottom: -36,
            left: '50%',
            transform: 'translateX(-50%)',
            background: `${COLORS.brand}22`,
            border: `1px solid ${COLORS.brand}55`,
            borderRadius: 999,
            padding: '4px 14px',
            fontSize: 11,
            fontFamily: FONTS.body,
            color: COLORS.brand,
            whiteSpace: 'nowrap',
            opacity: interpolate(elapsed, [30, 45], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {annotation}
        </div>
      )}

      {/* Glow beneath */}
      <div
        style={{
          position: 'absolute',
          bottom: -20,
          left: '10%',
          right: '10%',
          height: 40,
          background: `radial-gradient(ellipse, ${COLORS.brand}33 0%, transparent 70%)`,
          filter: 'blur(8px)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

// --- Sub-content components ---

const DashboardContent: React.FC<{ metrics: MetricItem[]; elapsed: number }> = ({
  metrics,
  elapsed,
}) => {
  const defaultMetrics: MetricItem[] = metrics.length > 0 ? metrics : [
    { label: 'Total Budget', value: '₹ 42.7B', color: COLORS.brand, trend: 'up' },
    { label: 'Released', value: '₹ 23.1B', color: COLORS.success, trend: 'up' },
    { label: 'Projects', value: '1,247', color: COLORS.gold },
    { label: 'Audited', value: '98.4%', color: COLORS.success, trend: 'up' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      {/* Mini bar chart */}
      <div style={{ display: 'flex', gap: 4, height: 56, alignItems: 'flex-end', marginBottom: 8 }}>
        {[65, 78, 52, 90, 82, 95, 70, 88].map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h * interpolate(elapsed, [10 + i * 3, 25 + i * 3], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })}%`,
              background: i % 2 === 0
                ? `linear-gradient(to top, ${COLORS.brand}, ${COLORS.brandEnd})`
                : `linear-gradient(to top, ${COLORS.gold}88, ${COLORS.gold})`,
              borderRadius: '2px 2px 0 0',
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {defaultMetrics.map((m, i) => {
          const p = interpolate(elapsed, [i * 6 + 20, i * 6 + 35], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={i}
              style={{
                background: COLORS.bgDeep,
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 8,
                padding: '7px 10px',
                opacity: p,
                transform: `translateY(${(1 - p) * 8}px)`,
              }}
            >
              <div style={{ fontSize: 9, color: COLORS.textMuted, fontFamily: FONTS.mono, marginBottom: 3 }}>
                {m.label}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontFamily: FONTS.heading,
                  fontWeight: 700,
                  color: m.color ?? COLORS.text,
                }}
              >
                {m.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DetailContent: React.FC<{
  rows: Array<{ label: string; status: string; amount: string; color: string }>;
  elapsed: number;
  subtitle?: string;
}> = ({ rows, elapsed, subtitle }) => {
  const defaultRows = rows.length > 0 ? rows : [
    { label: 'Foundation Work', status: 'Completed', amount: '₹ 3.2B', color: COLORS.success },
    { label: 'Civil Construction', status: 'In Progress', amount: '₹ 8.7B', color: COLORS.brand },
    { label: 'IPFS Document', status: 'Verified', amount: 'Qm3xH...', color: COLORS.gold },
    { label: 'Fund Release #3', status: 'Approved', amount: '₹ 2.1B', color: COLORS.success },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {subtitle && (
        <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: FONTS.body, marginBottom: 6 }}>
          {subtitle}
        </div>
      )}
      {defaultRows.map((row, i) => {
        const p = interpolate(elapsed, [i * 5 + 10, i * 5 + 22], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 6,
              borderLeft: `2px solid ${row.color}`,
              opacity: p,
              transform: `translateX(${(1 - p) * -12}px)`,
            }}
          >
            <div style={{ fontSize: 11, fontFamily: FONTS.body, color: COLORS.text }}>{row.label}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 9, fontFamily: FONTS.mono, color: row.color }}>{row.status}</div>
              <div style={{ fontSize: 10, fontFamily: FONTS.mono, color: COLORS.textSecondary }}>{row.amount}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const HierarchyContent: React.FC<{ elapsed: number }> = ({ elapsed }) => {
  const items = [
    { label: 'Government of Nepal', level: 0, color: COLORS.gold },
    { label: 'Bagmati Province', level: 1, color: COLORS.brand },
    { label: 'Kathmandu District', level: 2, color: COLORS.brandEnd },
    { label: 'Road Sector', level: 3, color: COLORS.success },
    { label: '→ Ring Road Project', level: 4, color: COLORS.text },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {items.map((item, i) => {
        const p = interpolate(elapsed, [i * 6 + 5, i * 6 + 18], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              paddingLeft: item.level * 14,
              opacity: p,
              transform: `translateX(${(1 - p) * 10}px)`,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: item.color,
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontSize: 11,
                fontFamily: FONTS.body,
                color: item.color,
                fontWeight: item.level === 0 ? 700 : 400,
              }}
            >
              {item.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AnalyticsContent: React.FC<{ elapsed: number }> = ({ elapsed }) => {
  const provinces = [
    { name: 'Bagmati', pct: 28, color: COLORS.brand },
    { name: 'Gandaki', pct: 18, color: COLORS.gold },
    { name: 'Madhesh', pct: 22, color: COLORS.success },
    { name: 'Lumbini', pct: 15, color: COLORS.brandEnd },
    { name: 'Karnali', pct: 10, color: COLORS.warning },
    { name: 'Sudurpashchim', pct: 7, color: COLORS.error },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ fontSize: 9, fontFamily: FONTS.mono, color: COLORS.textMuted, marginBottom: 4 }}>
        BUDGET BY PROVINCE
      </div>
      {provinces.map((p, i) => {
        const barProgress = interpolate(elapsed, [i * 5 + 10, i * 5 + 28], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 9, color: COLORS.textSecondary, width: 80, fontFamily: FONTS.body }}>
              {p.name}
            </div>
            <div
              style={{
                flex: 1,
                height: 6,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${p.pct * barProgress}%`,
                  height: '100%',
                  background: p.color,
                  borderRadius: 3,
                  boxShadow: `0 0 6px ${p.color}88`,
                }}
              />
            </div>
            <div style={{ fontSize: 9, color: p.color, fontFamily: FONTS.mono, width: 28, textAlign: 'right' }}>
              {p.pct}%
            </div>
          </div>
        );
      })}
    </div>
  );
};
