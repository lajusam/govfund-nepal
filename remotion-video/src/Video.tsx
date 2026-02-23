/**
 * GovFund Nepal — 90-second cinematic product demo
 *
 * Total: 2700 frames @ 30fps = 90 seconds
 * Resolution: 1920×1080
 * Crossfades: 15 frames between every scene
 *
 * Scene layout (absolute frames):
 *  Scene 1 The Question:          0 → 165
 *  Scene 2 The Problem:          135 → 405  (overlap 30f with S1)
 *  Scene 3 The Solution:         375 → 600  (overlap 30f with S2)
 *  Scene 4 How It Works:         570 → 1185 (overlap 30f with S3)
 *  Scene 5 UI Showcase:         1155 → 1650 (overlap 30f with S4)
 *  Scene 6 Core Features:       1620 → 2115 (overlap 30f with S5)
 *  Scene 7 Money Flow:          2085 → 2400 (overlap 30f with S6)
 *  Scene 8 Tech Stack:          2370 → 2565 (overlap 30f with S7)
 *  Scene 9 Closing:             2535 → 2700 (overlap 30f with S8)
 */
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useVideoConfig,
} from 'remotion';
import { Scene1Question } from './scenes/Scene1Question';
import { Scene2Problem } from './scenes/Scene2Problem';
import { Scene3Solution } from './scenes/Scene3Solution';
import { Scene4HowItWorks } from './scenes/Scene4HowItWorks';
import { Scene5UIShowcase } from './scenes/Scene5UIShowcase';
import { Scene6Features } from './scenes/Scene6Features';
import { Scene7MoneyFlow } from './scenes/Scene7MoneyFlow';
import { Scene8TechStack } from './scenes/Scene8TechStack';
import { Scene9Closing } from './scenes/Scene9Closing';
import { COLORS } from './styles/colors';

/** Set to true when you have placed music.mp3 in the /public folder */
const AUDIO_ENABLED = false;

/**
 * Scene crossfade spec.
 * `from`     = absolute start frame of the Sequence
 * `duration` = total frames the Sequence is rendered (content + crossfade buffer)
 */
const SCENES = [
  { from: 0,    duration: 165, Component: Scene1Question },
  { from: 135,  duration: 270, Component: Scene2Problem },
  { from: 375,  duration: 240, Component: Scene3Solution },
  { from: 585,  duration: 615, Component: Scene4HowItWorks },
  { from: 1155, duration: 510, Component: Scene5UIShowcase },
  { from: 1620, duration: 510, Component: Scene6Features },
  { from: 2085, duration: 345, Component: Scene7MoneyFlow },
  { from: 2370, duration: 210, Component: Scene8TechStack },
  { from: 2535, duration: 180, Component: Scene9Closing },
] as const;

export const GovFundVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.bgDeep }}>
      {/* Background music */}
      {AUDIO_ENABLED && (
        <Audio
          src={staticFile('music.mp3')}
          volume={(f) => {
            // Soft fade-in and out
            if (f < 300) return (f / 300) * 0.18;
            if (f > 2400 && f < 2550) return 0.18 - ((f - 2400) / 150) * 0.12;
            if (f >= 2550) return Math.max(0, 0.06 - ((f - 2550) / 150) * 0.06);
            return 0.18;
          }}
        />
      )}

      {/* Scene sequences */}
      {SCENES.map(({ from, duration, Component }, i) => (
        <Sequence key={i} from={from} durationInFrames={duration}>
          <Component />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
