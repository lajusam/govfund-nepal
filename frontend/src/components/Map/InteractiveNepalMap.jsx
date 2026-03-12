import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { nepalGeoJSON, NEPAL_CENTER, NEPAL_BOUNDS, PROVINCE_STYLES } from '../../data/nepalGeoJSON';

// Fix Leaflet default marker icon path (vite bundling issue)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Fit map to Nepal on mount ──
function FitBounds() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(NEPAL_BOUNDS, { padding: [20, 20], maxZoom: 8 });
  }, [map]);
  return null;
}

// ── Province label overlay ──
function ProvinceLabels() {
  const map = useMap();

  useEffect(() => {
    const labels = [];
    nepalGeoJSON.features.forEach((feature) => {
      const coords = feature.geometry.coordinates[0];
      // Compute centroid
      let sumLat = 0, sumLon = 0;
      coords.forEach(([lon, lat]) => { sumLon += lon; sumLat += lat; });
      const centroid = [sumLat / coords.length, sumLon / coords.length];

      const label = L.marker(centroid, {
        icon: L.divIcon({
          className: 'province-label',
          html: `<span>${feature.properties.name}</span>`,
          iconSize: [80, 24],
          iconAnchor: [40, 12],
        }),
        interactive: false,
      });
      label.addTo(map);
      labels.push(label);
    });

    return () => labels.forEach((l) => map.removeLayer(l));
  }, [map]);

  return null;
}

// ── Scroll-driven cinematic zoom controller ──
function ScrollZoomController({ sectionRef }) {
  const map = useMap();
  const rafRef = useRef(null);
  const currentRef = useRef({ lat: 28.3, lon: 84.1, zoom: 7 });
  const scrollProgressRef = useRef(0);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const userDraggingRef = useRef(false);

  useEffect(() => {
    if (!sectionRef?.current) return;

    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Camera keyframes: full Nepal → center/Bagmati region
    const START = { lat: 28.3, lon: 84.1, zoom: 7 };
    const END = { lat: 27.7, lon: 85.3, zoom: 9.5 };

    // Pause scroll-driven animation during user drag
    const onDragStart = () => { userDraggingRef.current = true; };
    const onDragEnd = () => {
      userDraggingRef.current = false;
      // Sync current position so the lerp resumes smoothly
      const center = map.getCenter();
      currentRef.current.lat = center.lat;
      currentRef.current.lon = center.lng;
      currentRef.current.zoom = map.getZoom();
    };
    map.on('dragstart', onDragStart);
    map.on('dragend', onDragEnd);

    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const sectionHeight = rect.height - window.innerHeight;
      if (sectionHeight <= 0) return;
      const scrolled = -rect.top;
      scrollProgressRef.current = clamp(scrolled / sectionHeight, 0, 1);
    };

    const animate = () => {
      const now = performance.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      timeRef.current += dt;

      if (!userDraggingRef.current) {
        const progress = scrollProgressRef.current;
        const eased = easeInOutCubic(progress);

        let targetLat = lerp(START.lat, END.lat, eased);
        let targetLon = lerp(START.lon, END.lon, eased);
        let targetZoom = lerp(START.zoom, END.zoom, eased);

        // Subtle idle oscillation when near the top
        if (progress < 0.1) {
          const strength = 1 - progress / 0.1;
          targetLat += Math.sin(timeRef.current * 0.4) * 0.015 * strength;
          targetLon += Math.cos(timeRef.current * 0.3) * 0.025 * strength;
          targetZoom += Math.sin(timeRef.current * 0.2) * 0.05 * strength;
        }

        const LERP_SPEED = 0.06;
        const c = currentRef.current;
        c.lat = lerp(c.lat, targetLat, LERP_SPEED);
        c.lon = lerp(c.lon, targetLon, LERP_SPEED);
        c.zoom = lerp(c.zoom, targetZoom, LERP_SPEED);

        map.setView([c.lat, c.lon], c.zoom, { animate: false });
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      map.off('dragstart', onDragStart);
      map.off('dragend', onDragEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [map, sectionRef]);

  return null;
}

// ── Style helpers ──
function getProvinceStyle(feature) {
  const fill = feature.properties.fill;
  return {
    fillColor: fill,
    fillOpacity: 0.35,
    color: fill,
    weight: 1.5,
    opacity: 0.7,
  };
}

function getHighlightStyle(feature) {
  const fill = feature.properties.fill;
  return {
    fillColor: fill,
    fillOpacity: 0.6,
    color: '#fff',
    weight: 2.5,
    opacity: 1,
  };
}

function getSelectedStyle(feature) {
  const fill = feature.properties.fill;
  return {
    fillColor: fill,
    fillOpacity: 0.55,
    color: '#FFB81C',
    weight: 3,
    opacity: 1,
  };
}

// ── Main map component ──
export default function InteractiveNepalMap({ onSelectProvince, selectedProvince, projectCounts = {}, scrollContainerRef }) {
  const scrollZoomActive = !!scrollContainerRef;
  const geoJsonRef = useRef(null);

  // Reset styles when selectedProvince changes
  useEffect(() => {
    if (!geoJsonRef.current) return;
    geoJsonRef.current.eachLayer((layer) => {
      const id = layer.feature.properties.id;
      if (id === selectedProvince) {
        layer.setStyle(getSelectedStyle(layer.feature));
        layer.bringToFront();
      } else {
        layer.setStyle(getProvinceStyle(layer.feature));
      }
    });
  }, [selectedProvince]);

  const onEachFeature = useCallback((feature, layer) => {
    const id = feature.properties.id;
    const name = feature.properties.name;
    const count = projectCounts[id] || 0;

    // Tooltip
    layer.bindTooltip(
      `<div class="map-tooltip">
        <strong>${name}</strong>
        <span>${count} project${count !== 1 ? 's' : ''}</span>
      </div>`,
      { sticky: true, className: 'nepal-tooltip', direction: 'top', offset: [0, -10] }
    );

    layer.on({
      mouseover: (e) => {
        if (id !== selectedProvince) {
          e.target.setStyle(getHighlightStyle(feature));
          e.target.bringToFront();
        }
      },
      mouseout: (e) => {
        if (id !== selectedProvince) {
          e.target.setStyle(getProvinceStyle(feature));
        }
      },
      click: () => {
        onSelectProvince?.(id === selectedProvince ? null : id);
      },
    });
  }, [onSelectProvince, selectedProvince, projectCounts]);

  // Force re-render of GeoJSON when projectCounts change
  const geoJsonKey = useMemo(
    () => JSON.stringify(projectCounts) + (selectedProvince || ''),
    [projectCounts, selectedProvince]
  );

  return (
    <div className="absolute inset-0 w-full h-full nepal-map-container">
      <MapContainer
        center={NEPAL_CENTER}
        zoom={7}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={!scrollZoomActive}
        doubleClickZoom={true}
        dragging={true}
        minZoom={6}
        maxZoom={12}
        maxBounds={[
          [24.5, 78.0],
          [32.5, 90.5],
        ]}
        style={{ width: '100%', height: '100%', background: '#0a0e17' }}
      >
        {/* Dark tile layer — CartoDB Dark Matter (free, no API key) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          opacity={0.6}
        />

        {/* Province boundaries */}
        <GeoJSON
          key={geoJsonKey}
          ref={geoJsonRef}
          data={nepalGeoJSON}
          style={getProvinceStyle}
          onEachFeature={onEachFeature}
        />

        {scrollZoomActive ? (
          <ScrollZoomController sectionRef={scrollContainerRef} />
        ) : (
          <FitBounds />
        )}
        <ProvinceLabels />
        <ZoomControls />
      </MapContainer>

      {/* Legend (outside MapContainer — no useMap needed) */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[#0d1117]/90 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2.5 hidden sm:block">
        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5 font-medium">Provinces</p>
        <div className="space-y-1">
          {Object.entries(PROVINCE_STYLES).map(([id, s]) => (
            <button
              key={id}
              onClick={() => onSelectProvince?.(Number(id) === selectedProvince ? null : Number(id))}
              className={`flex items-center gap-2 w-full text-left px-1.5 py-0.5 rounded transition-colors text-xs ${
                Number(id) === selectedProvince
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: s.fill }}
              />
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Custom zoom controls (inside MapContainer context) ──
function ZoomControls() {
  const map = useMap();
  return (
    <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: 'auto' }}>
      <div className="leaflet-control flex flex-col gap-1 mr-2 mb-2">
        <button
          className="w-8 h-8 bg-[#0d1117]/90 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm font-mono"
          onClick={() => map.zoomIn()}
        >+</button>
        <button
          className="w-8 h-8 bg-[#0d1117]/90 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm font-mono"
          onClick={() => map.zoomOut()}
        >−</button>
      </div>
    </div>
  );
}
