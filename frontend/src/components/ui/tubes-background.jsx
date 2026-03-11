import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const randomColors = (count) =>
    Array.from({ length: count }, () =>
        '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    );

export function TubesBackground({
    children,
    className,
    enableClickInteraction = true,
}) {
    const canvasRef = useRef(null);
    const tubesRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let mounted = true;
        let cleanup;

        const initTubes = async () => {
            if (!canvasRef.current) return;

            try {
                const module = await import(
                    /* @vite-ignore */
                    'https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js'
                );
                const TubesCursor = module.default;

                if (!mounted) return;

                const app = TubesCursor(canvasRef.current, {
                    tubes: {
                        colors: ['#FFB81C', '#8E6F3E', '#FAD980'],
                        lights: {
                            intensity: 200,
                            colors: ['#FFB81C', '#E09500', '#FAD980', '#8E6F3E'],
                        },
                    },
                });

                tubesRef.current = app;
                setIsLoaded(true);

                const handleResize = () => {
                    /* library handles resize internally */
                };
                window.addEventListener('resize', handleResize);

                cleanup = () => {
                    window.removeEventListener('resize', handleResize);
                };
            } catch (error) {
                console.error('Failed to load TubesCursor:', error);
            }
        };

        initTubes();

        return () => {
            mounted = false;
            if (cleanup) cleanup();
        };
    }, []);

    const handleClick = () => {
        if (!enableClickInteraction || !tubesRef.current) return;

        const colors = randomColors(3);
        const lightsColors = randomColors(4);

        tubesRef.current.tubes.setColors(colors);
        tubesRef.current.tubes.setLightsColors(lightsColors);
    };

    return (
        <div
            className={cn(
                'relative w-full h-full min-h-[400px] overflow-hidden',
                className,
            )}
            style={{ background: '#1A160F' }}
            onClick={handleClick}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full block"
                style={{ touchAction: 'none' }}
            />

            {/* Content Overlay */}
            <div className="relative z-10 w-full h-full pointer-events-none">
                {children}
            </div>
        </div>
    );
}

export default TubesBackground;
