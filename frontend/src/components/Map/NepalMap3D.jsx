import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  PROVINCE_SHAPES, PROVINCE_COLORS, PROVINCE_HEX, PEAKS, CITIES,
  toLocal, toGeo, findProvince, computeTerrainHeight, terrainColor,
} from '../../data/nepalProvinceShapes';

// ═══════════════════════════════════════
//  VERTEX & FRAGMENT SHADERS
// ═══════════════════════════════════════
const terrainVertexShader = /* glsl */ `
  attribute float provinceId;
  attribute vec3 terrainColor;

  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vProvinceId;
  varying float vHeight;

  void main() {
    vColor = terrainColor;
    vNormal = normalize(normalMatrix * normal);
    vProvinceId = provinceId;
    vHeight = position.y;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const terrainFragmentShader = /* glsl */ `
  uniform float highlightId;
  uniform float selectedId;
  uniform float time;

  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vProvinceId;
  varying float vHeight;

  void main() {
    // Directional sunlight from upper-right
    vec3 lightDir = normalize(vec3(0.6, 0.9, -0.3));
    float diff = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.35;
    vec3 color = vColor * (ambient + (1.0 - ambient) * diff);

    // Subtle rim light
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
    color += vec3(0.15, 0.12, 0.08) * pow(rim, 3.0) * 0.3;

    // Province highlight (glow)
    if (highlightId > 0.0 && abs(vProvinceId - highlightId) < 0.5) {
      color += vec3(0.18, 0.15, 0.08);
    }
    // Province selection (golden glow + slight pulse)
    if (selectedId > 0.0 && abs(vProvinceId - selectedId) < 0.5) {
      float pulse = 0.5 + 0.5 * sin(time * 2.5);
      color += vec3(0.25, 0.20, 0.05) * (0.8 + 0.2 * pulse);
    }

    // Height-based fog (very high = slightly hazy)
    float fogFactor = smoothstep(2.5, 4.5, vHeight) * 0.25;
    color = mix(color, vec3(0.85, 0.88, 0.95), fogFactor);

    // Snow sparkle on peaks
    if (vHeight > 2.8) {
      float sparkle = fract(sin(dot(vWorldPos.xz * 50.0, vec2(12.9898, 78.233))) * 43758.5453);
      if (sparkle > 0.97) color += vec3(0.3);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ═══════════════════════════════════════
//  TERRAIN MESH
// ═══════════════════════════════════════
const TERRAIN_WIDTH = 14;
const TERRAIN_DEPTH = 7;
const SEG_X = 220;
const SEG_Z = 110;

function Terrain({ hoveredProvince, selectedProvince, onHover, onClick }) {
  const meshRef = useRef();
  const materialRef = useRef();

  // Build terrain geometry once
  const { geometry, provinceMap } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_WIDTH, TERRAIN_DEPTH, SEG_X, SEG_Z);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);
    const provIds = new Float32Array(count);
    const provMap = new Map(); // vertexIndex → provinceId

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const [lon, lat] = toGeo(x, z);

      // Compute height
      const h = computeTerrainHeight(lon, lat);
      pos.setY(i, h);

      // Detect province
      const pId = findProvince(lon, lat);
      provIds[i] = pId || 0;
      provMap.set(i, pId || 0);

      // Compute vertex color: blend terrain natural color with province tint
      const tc = terrainColor(h);
      if (pId && PROVINCE_COLORS[pId]) {
        const pc = PROVINCE_COLORS[pId];
        // Blend: higher altitude → less province tint (rock/snow dominates)
        const blend = h > 2.5 ? 0.15 : h > 1.5 ? 0.3 : 0.45;
        colors[i * 3]     = tc[0] * (1 - blend) + pc[0] * blend;
        colors[i * 3 + 1] = tc[1] * (1 - blend) + pc[1] * blend;
        colors[i * 3 + 2] = tc[2] * (1 - blend) + pc[2] * blend;
      } else {
        // Outside Nepal boundary — dark ground
        colors[i * 3]     = 0.15;
        colors[i * 3 + 1] = 0.18;
        colors[i * 3 + 2] = 0.12;
      }
    }

    geo.setAttribute('terrainColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('provinceId', new THREE.BufferAttribute(provIds, 1));
    geo.computeVertexNormals();

    return { geometry: geo, provinceMap: provMap };
  }, []);

  // Update shader uniforms each frame
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.highlightId.value = hoveredProvince || 0;
      materialRef.current.uniforms.selectedId.value = selectedProvince || 0;
    }
  });

  const uniforms = useMemo(() => ({
    highlightId: { value: 0 },
    selectedId: { value: 0 },
    time: { value: 0 },
  }), []);

  // Pointer interaction
  const handlePointerMove = useCallback((e) => {
    e.stopPropagation();
    const { point } = e;
    const [lon, lat] = toGeo(point.x, point.z);
    const pId = findProvince(lon, lat);
    onHover(pId, point);
  }, [onHover]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    const { point } = e;
    const [lon, lat] = toGeo(point.x, point.z);
    const pId = findProvince(lon, lat);
    if (pId) onClick(pId);
  }, [onClick]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onPointerMove={handlePointerMove}
      onPointerOut={() => onHover(null, null)}
      onClick={handleClick}
      receiveShadow
      castShadow
    >
      <shaderMaterial
        ref={materialRef}
        vertexShader={terrainVertexShader}
        fragmentShader={terrainFragmentShader}
        uniforms={uniforms}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

// ═══════════════════════════════════════
//  PROVINCE BOUNDARY LINES
// ═══════════════════════════════════════
function ProvinceBorders() {
  const lines = useMemo(() => {
    const result = [];
    for (const [id, data] of Object.entries(PROVINCE_SHAPES)) {
      const points = data.points.map(([lon, lat]) => {
        const [x, z] = toLocal(lon, lat);
        const h = computeTerrainHeight(lon, lat) + 0.05;
        return new THREE.Vector3(x, h, z);
      });
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      result.push({ id, geo });
    }
    return result;
  }, []);

  return (
    <group>
      {lines.map(({ id, geo }) => (
        <line key={id} geometry={geo}>
          <lineBasicMaterial color="#FFFFFF" transparent opacity={0.25} linewidth={1} />
        </line>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════
//  PEAK MARKERS — vertical line + label
// ═══════════════════════════════════════
function PeakMarker({ peak }) {
  const [x, z] = toLocal(peak.lon, peak.lat);
  const terrainH = computeTerrainHeight(peak.lon, peak.lat);
  const markerH = terrainH + 1.2;

  const lineGeo = useMemo(() => {
    const pts = [new THREE.Vector3(x, terrainH, z), new THREE.Vector3(x, markerH, z)];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [x, z, terrainH, markerH]);

  return (
    <group>
      <line geometry={lineGeo}>
        <lineBasicMaterial color="#FFFFFF" transparent opacity={0.6} />
      </line>
      {/* Peak dot */}
      <mesh position={[x, markerH, z]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
      {/* Label */}
      <Html
        position={[x, markerH + 0.15, z]}
        center
        distanceFactor={12}
        style={{ pointerEvents: 'none' }}
      >
        <div className="text-center whitespace-nowrap">
          <div className="text-white text-[10px] font-bold drop-shadow-lg leading-tight">
            {peak.name}
          </div>
          <div className="text-white/70 text-[8px] drop-shadow-lg">
            {peak.elevation.toLocaleString()}m
          </div>
        </div>
      </Html>
    </group>
  );
}

// ═══════════════════════════════════════
//  CITY MARKERS — dot + label
// ═══════════════════════════════════════
function CityMarker({ city }) {
  const [x, z] = toLocal(city.lon, city.lat);
  const h = computeTerrainHeight(city.lon, city.lat) + 0.15;

  return (
    <group position={[x, h, z]}>
      <mesh>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color="#FFD700" />
      </mesh>
      {/* Glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.08, 0.14, 16]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <Html
        position={[0, 0.25, 0]}
        center
        distanceFactor={12}
        style={{ pointerEvents: 'none' }}
      >
        <div className="text-amber-300 text-[9px] font-semibold whitespace-nowrap drop-shadow-lg">
          • {city.name}
        </div>
      </Html>
    </group>
  );
}

// ═══════════════════════════════════════
//  PROVINCE LABELS (on terrain)
// ═══════════════════════════════════════
function ProvinceLabels() {
  const labels = Object.entries(PROVINCE_SHAPES).map(([id, data]) => {
    const [x, z] = toLocal(data.center[0], data.center[1]);
    const h = computeTerrainHeight(data.center[0], data.center[1]) + 0.4;
    return { id: Number(id), name: data.name, x, z, h };
  });

  return (
    <group>
      {labels.map((l) => (
        <Html
          key={l.id}
          position={[l.x, l.h, l.z]}
          center
          distanceFactor={15}
          style={{ pointerEvents: 'none' }}
        >
          <div className="text-center whitespace-nowrap">
            <div className="text-white/90 text-[11px] font-extrabold uppercase tracking-wider drop-shadow-lg">
              {l.name}
            </div>
            <div className="text-white/50 text-[8px] font-semibold">
              Province {l.id}
            </div>
          </div>
        </Html>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════
//  CLOUD LAYER
// ═══════════════════════════════════════
function CloudLayer() {
  const groupRef = useRef();
  const count = 25;

  const clouds = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: (Math.random() - 0.5) * 16,
      y: 3.5 + Math.random() * 1.5,
      z: Math.random() * 4 - 1,
      scaleX: 0.8 + Math.random() * 2,
      scaleZ: 0.4 + Math.random() * 1,
      speed: 0.003 + Math.random() * 0.005,
      opacity: 0.06 + Math.random() * 0.08,
    })),
  []);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((mesh, i) => {
      mesh.position.x += clouds[i].speed;
      if (mesh.position.x > 9) mesh.position.x = -9;
    });
  });

  return (
    <group ref={groupRef}>
      {clouds.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]} scale={[c.scaleX, 0.08, c.scaleZ]}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={c.opacity}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════
//  GROUND PLANE (surrounding area)
// ═══════════════════════════════════════
function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <planeGeometry args={[30, 20]} />
      <meshStandardMaterial color="#0F1208" metalness={0.1} roughness={0.9} />
    </mesh>
  );
}

// ═══════════════════════════════════════
//  GEOGRAPHIC LABELS (Tibet, India)
// ═══════════════════════════════════════
function GeoLabels() {
  return (
    <group>
      <Html position={[0, 3.5, 4.5]} center distanceFactor={20} style={{ pointerEvents: 'none' }}>
        <div className="text-white/20 text-[14px] font-bold tracking-[0.4em] uppercase">
          Tibetan Plateau
        </div>
      </Html>
      <Html position={[0, 0.1, -4.5]} center distanceFactor={20} style={{ pointerEvents: 'none' }}>
        <div className="text-white/20 text-[14px] font-bold tracking-[0.4em] uppercase">
          I N D I A
        </div>
      </Html>
    </group>
  );
}

// ═══════════════════════════════════════
//  LIGHTING
// ═══════════════════════════════════════
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.35} color="#FFF8E1" />
      <directionalLight
        position={[6, 10, -4]}
        intensity={1.4}
        color="#FFF0D0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-near={0.1}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <pointLight position={[-5, 4, 5]} intensity={0.4} color="#B0C4DE" />
      <hemisphereLight args={['#87CEEB', '#5C4033', 0.2]} />
    </>
  );
}

// ═══════════════════════════════════════
//  TOOLTIP (follows hovered point)
// ═══════════════════════════════════════
function Tooltip({ position, provinceId }) {
  if (!position || !provinceId) return null;
  const data = PROVINCE_SHAPES[provinceId];
  if (!data) return null;

  return (
    <Html position={[position.x, position.y + 0.5, position.z]} center style={{ pointerEvents: 'none' }}>
      <div className="bg-basalt/90 backdrop-blur-sm border border-golden/30 rounded-lg px-3 py-1.5 shadow-xl">
        <div className="text-white text-xs font-bold">{data.name}</div>
        <div className="text-golden text-[10px]">Province {provinceId}</div>
      </div>
    </Html>
  );
}

// ═══════════════════════════════════════
//  MAIN SCENE
// ═══════════════════════════════════════
function MapScene({ selectedProvince, hoveredProvince, tooltipPos, onHover, onSelect }) {
  return (
    <>
      <Lighting />
      <fog attach="fog" args={['#0A0D06', 18, 35]} />

      <GroundPlane />
      <Terrain
        hoveredProvince={hoveredProvince}
        selectedProvince={selectedProvince}
        onHover={onHover}
        onClick={onSelect}
      />
      <ProvinceBorders />
      <ProvinceLabels />
      <CloudLayer />
      <GeoLabels />

      {PEAKS.map((p) => <PeakMarker key={p.name} peak={p} />)}
      {CITIES.map((c) => <CityMarker key={c.name} city={c} />)}

      <Tooltip position={tooltipPos} provinceId={hoveredProvince} />
    </>
  );
}

// ═══════════════════════════════════════
//  PROVINCE LEGEND (HTML overlay)
// ═══════════════════════════════════════
function ProvinceLegend({ hoveredProvince, onSelect }) {
  return (
    <div className="absolute bottom-4 left-4 z-20 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2.5 shadow-xl">
      <div className="text-white/60 text-[9px] uppercase tracking-wider font-semibold mb-1.5">
        Provinces
      </div>
      <div className="space-y-1">
        {Object.entries(PROVINCE_SHAPES).map(([id, data]) => (
          <button
            key={id}
            onClick={() => onSelect(Number(id))}
            className={`flex items-center gap-2 w-full text-left px-1.5 py-0.5 rounded transition-colors ${
              hoveredProvince === Number(id) ? 'bg-white/10' : 'hover:bg-white/5'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: PROVINCE_HEX[id] }}
            />
            <span className="text-white/80 text-[10px] font-medium">{data.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
//  EXPORTED COMPONENT
// ═══════════════════════════════════════
export default function NepalMap3D({ onSelectProvince, selectedProvince, projectCounts = {} }) {
  const [hoveredProvince, setHoveredProvince] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  const handleHover = useCallback((provinceId, point) => {
    setHoveredProvince(provinceId);
    setTooltipPos(point ? { x: point.x, y: point.y, z: point.z } : null);
    document.body.style.cursor = provinceId ? 'pointer' : 'auto';
  }, []);

  const handleSelect = useCallback((id) => {
    onSelectProvince?.(selectedProvince === id ? null : id);
  }, [onSelectProvince, selectedProvince]);

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{
          position: [0, 9, -10],
          fov: 40,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        onCreated={({ gl }) => gl.setClearColor(0x0A0D06, 1)}
      >
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={6}
          maxDistance={22}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.3}
          autoRotate={!selectedProvince && !hoveredProvince}
          autoRotateSpeed={0.25}
          target={[0, 0.5, 0.5]}
          panSpeed={0.5}
          zoomSpeed={0.8}
          dampingFactor={0.08}
          enableDamping
        />
        <MapScene
          selectedProvince={selectedProvince}
          hoveredProvince={hoveredProvince}
          tooltipPos={tooltipPos}
          onHover={handleHover}
          onSelect={handleSelect}
        />
      </Canvas>

      {/* Title */}
      <div className="absolute top-4 left-4 z-20 select-none pointer-events-none">
        <h2 className="text-white text-lg sm:text-xl font-bold tracking-wide drop-shadow-lg">
          Nepal: 3D Provincial Map
        </h2>
        <p className="text-white/40 text-[10px] sm:text-xs mt-0.5">
          & Himalayan Topography
        </p>
      </div>

      {/* Legend */}
      <ProvinceLegend hoveredProvince={hoveredProvince} onSelect={handleSelect} />

      {/* Compass */}
      <div className="absolute bottom-4 right-4 z-20 select-none pointer-events-none">
        <svg width="40" height="40" viewBox="0 0 40 40" className="opacity-40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="white" strokeWidth="0.5" />
          <polygon points="20,4 23,18 20,16 17,18" fill="white" opacity="0.8" />
          <polygon points="20,36 23,22 20,24 17,22" fill="white" opacity="0.3" />
          <text x="20" y="3" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">N</text>
        </svg>
      </div>
    </div>
  );
}
