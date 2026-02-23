import React from 'react';
import { useCurrentFrame } from 'remotion';
import { COLORS, FONTS } from '../styles/colors';

interface TypewriterTextProps {
  text: string;
  startFrame?: number;
  charsPerFrame?: number;
  style?: React.CSSProperties;
  cursorVisible?: boolean;
  cursorColor?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startFrame = 0,
  charsPerFrame = 3,
  style,
  cursorVisible = true,
  cursorColor = COLORS.brand,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const charCount = Math.min(text.length, Math.floor(elapsed * charsPerFrame));
  const visible = charCount < text.length;

  const cursorBlink = Math.floor(elapsed / 8) % 2 === 0;

  return (
    <span style={{ fontFamily: FONTS.mono, ...style }}>
      {text.slice(0, charCount)}
      {cursorVisible && visible && (
        <span
          style={{
            display: 'inline-block',
            width: 2,
            height: '1.1em',
            backgroundColor: cursorColor,
            verticalAlign: 'text-bottom',
            marginLeft: 2,
            opacity: cursorBlink ? 1 : 0,
          }}
        />
      )}
    </span>
  );
};
