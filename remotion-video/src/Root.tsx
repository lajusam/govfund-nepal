import React from 'react';
import { Composition } from 'remotion';
import { GovFundVideo } from './Video';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GovFundNepal"
        component={GovFundVideo}
        durationInFrames={2700}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
