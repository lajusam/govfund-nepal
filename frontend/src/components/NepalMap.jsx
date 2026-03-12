import React, { useState, useMemo } from 'react';
import { Map, Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// Free dark tile style — no API key / signup needed
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

// Nepal bounds — lock viewport
const NEPAL_BOUNDS = [
    [80.0585, 26.3478], // SW
    [88.2015, 30.4227], // NE
];

const INITIAL_VIEW = {
    longitude: 83.45,
    latitude: 27.70,
    zoom: 6,
    pitch: 0,
    bearing: 0,
};

// Sample whisper markers (civic issues — red glow)
const WHISPERS = [
    { id: 'w1', lng: 85.324, lat: 27.7172, label: 'Road damage — Kathmandu' },
    { id: 'w2', lng: 83.985, lat: 28.2096, label: 'Water shortage — Pokhara' },
    { id: 'w3', lng: 83.46, lat: 27.68, label: 'Power outage — Butwal' },
    { id: 'w4', lng: 85.891, lat: 26.812, label: 'Bridge collapse — Birgunj' },
    { id: 'w5', lng: 87.267, lat: 26.668, label: 'Flood alert — Biratnagar' },
    { id: 'w6', lng: 80.574, lat: 28.697, label: 'School repair — Dhangadhi' },
];

// Sample petition markers (threshold reports — green glow)
const PETITIONS = [
    { id: 'p1', lng: 85.314, lat: 27.695, label: 'Transparency audit — Lalitpur' },
    { id: 'p2', lng: 84.014, lat: 28.235, label: 'Hospital expansion — Kaski' },
    { id: 'p3', lng: 81.616, lat: 28.046, label: 'Irrigation project — Nepalgunj' },
    { id: 'p4', lng: 86.712, lat: 26.813, label: 'New school — Janakpur' },
];

function GlowDot({ color, size = 12, pulse = true }) {
    const shadow = color === 'red'
        ? '0 0 8px 3px rgba(255,60,60,0.6), 0 0 20px 6px rgba(255,60,60,0.25)'
        : '0 0 8px 3px rgba(0,255,140,0.6), 0 0 20px 6px rgba(0,255,140,0.25)';
    const bg = color === 'red' ? '#ff3c3c' : '#00ff8c';

    return (
        <div className="relative flex items-center justify-center" style={{ width: size * 2.5, height: size * 2.5 }}>
            {pulse && (
                <span
                    className="absolute rounded-full animate-ping"
                    style={{
                        width: size * 2,
                        height: size * 2,
                        backgroundColor: bg,
                        opacity: 0.25,
                    }}
                />
            )}
            <span
                className="rounded-full"
                style={{
                    width: size,
                    height: size,
                    backgroundColor: bg,
                    boxShadow: shadow,
                }}
            />
        </div>
    );
}

export default function NepalMap() {
    const [hovered, setHovered] = useState(null);

    const markers = useMemo(() => [
        ...WHISPERS.map(w => ({ ...w, type: 'whisper' })),
        ...PETITIONS.map(p => ({ ...p, type: 'petition' })),
    ], []);

    return (
        <Map
            initialViewState={INITIAL_VIEW}
            maxBounds={NEPAL_BOUNDS}
            minZoom={5.5}
            maxZoom={12}
            mapStyle={MAP_STYLE}
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
            dragRotate={false}
        >
            <NavigationControl position="bottom-right" showCompass={false} />

            {markers.map((m) => (
                <Marker key={m.id} longitude={m.lng} latitude={m.lat} anchor="center">
                    <div
                        className="cursor-pointer relative"
                        onMouseEnter={() => setHovered(m.id)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        <GlowDot
                            color={m.type === 'whisper' ? 'red' : 'green'}
                            size={m.type === 'whisper' ? 10 : 14}
                        />
                        {hovered === m.id && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap px-3 py-1.5 rounded-lg bg-basalt/95 border border-white/10 text-xs text-white shadow-lg backdrop-blur-sm z-50 pointer-events-none">
                                <span className={m.type === 'whisper' ? 'text-red-400' : 'text-emerald-400'}>
                                    {m.type === 'whisper' ? '⚠ Whisper' : '✦ Petition'}
                                </span>
                                <span className="text-white/60 mx-1.5">—</span>
                                <span>{m.label}</span>
                            </div>
                        )}
                    </div>
                </Marker>
            ))}
        </Map>
    );
}
