import React, { useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

// Convert lat/lon to 3D position on sphere
function latLonToVec3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

// Nepal center coordinates
const NEPAL_LAT = 28.3;
const NEPAL_LON = 84.1;

// Generate scattered points around the globe (simulated network nodes)
function generateGlobePoints(count, radius) {
  const points = [];
  // Seeded random for deterministic output
  let seed = 12345;
  function rand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  for (let i = 0; i < count; i++) {
    // Fibonacci sphere distribution
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const theta = goldenAngle * i;

    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    // Convert back to lat/lon to check proximity to Nepal
    const lat = Math.asin(y) * (180 / Math.PI);
    const lon = Math.atan2(z, x) * (180 / Math.PI);

    // Distance to Nepal (approximate)
    const dLat = lat - NEPAL_LAT;
    const dLon = lon - NEPAL_LON;
    const dist = Math.sqrt(dLat * dLat + dLon * dLon);

    // Higher density near Nepal
    const isNearNepal = dist < 15;
    const isInNepal = dist < 5;

    // Add with some randomness
    if (isInNepal || (isNearNepal && rand() > 0.3) || rand() > 0.6) {
      points.push({
        position: new THREE.Vector3(x * radius, y * radius, z * radius),
        isNepal: isInNepal,
        isNearNepal: isNearNepal,
        intensity: isInNepal ? 1.0 : isNearNepal ? 0.6 : 0.2 + rand() * 0.2,
      });
    }
  }
  return points;
}

// Generate arc lines connecting some points (network connections)
function generateArcs(points, radius) {
  const arcs = [];
  let seed = 54321;
  function rand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  const nepalPoints = points.filter(p => p.isNepal);
  const otherPoints = points.filter(p => !p.isNepal);

  // Create arcs from Nepal to nearby points
  for (let i = 0; i < Math.min(nepalPoints.length, 8); i++) {
    const from = nepalPoints[i];
    const toIdx = Math.floor(rand() * Math.min(otherPoints.length, 50));
    const to = otherPoints[toIdx];
    if (from && to) {
      arcs.push({ from: from.position, to: to.position });
    }
  }

  return arcs;
}

// ═══════════════════════════════════════════════
// GLOBE MESH — Earth sphere with atmosphere
// ═══════════════════════════════════════════════

function GlobeAtmosphere({ radius }) {
  const shaderRef = useRef();

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    glowColor: { value: new THREE.Color('#1a6bff') },
  }), []);

  useFrame((_, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.time.value += delta;
    }
  });

  return (
    <mesh scale={[1.15, 1.15, 1.15]}>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        ref={shaderRef}
        transparent
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 glowColor;
          varying vec3 vNormal;
          void main() {
            float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
            gl_FragColor = vec4(glowColor, intensity * 0.4);
          }
        `}
      />
    </mesh>
  );
}

function GlobeSphere({ radius }) {
  const meshRef = useRef();

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 128, 128]} />
      <meshPhongMaterial
        color="#0a0e17"
        emissive="#050812"
        specular="#111827"
        shininess={5}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

// ═══════════════════════════════════════════════
// GRID LINES — lat/lon grid on globe
// ═══════════════════════════════════════════════

function GlobeGrid({ radius }) {
  const gridGeo = useMemo(() => {
    const points = [];
    const r = radius + 0.002;

    // Latitude lines
    for (let lat = -80; lat <= 80; lat += 20) {
      for (let lon = -180; lon < 180; lon += 2) {
        const p1 = latLonToVec3(lat, lon, r);
        const p2 = latLonToVec3(lat, lon + 2, r);
        points.push(p1, p2);
      }
    }
    // Longitude lines
    for (let lon = -180; lon < 180; lon += 20) {
      for (let lat = -80; lat < 80; lat += 2) {
        const p1 = latLonToVec3(lat, lon, r);
        const p2 = latLonToVec3(lat + 2, lon, r);
        points.push(p1, p2);
      }
    }

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    points.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    });
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [radius]);

  return (
    <lineSegments geometry={gridGeo}>
      <lineBasicMaterial color="#1a2332" transparent opacity={0.3} />
    </lineSegments>
  );
}

// ═══════════════════════════════════════════════
// NETWORK DOTS — scattered light points
// ═══════════════════════════════════════════════

function NetworkDots({ radius }) {
  const pointsRef = useRef();
  const data = useMemo(() => generateGlobePoints(2000, radius + 0.01), [radius]);

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(data.length * 3);
    const col = new Float32Array(data.length * 3);
    const sz = new Float32Array(data.length);

    const nepalColor = new THREE.Color('#FFB81C');
    const nearColor = new THREE.Color('#4B7BB5');
    const defaultColor = new THREE.Color('#2563eb');

    data.forEach((p, i) => {
      pos[i * 3] = p.position.x;
      pos[i * 3 + 1] = p.position.y;
      pos[i * 3 + 2] = p.position.z;

      const color = p.isNepal ? nepalColor : p.isNearNepal ? nearColor : defaultColor;
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;

      sz[i] = p.isNepal ? 3.0 : p.isNearNepal ? 2.0 : 1.0;
    });

    return { positions: pos, colors: col, sizes: sz };
  }, [data]);

  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.elapsedTime;
      // Subtle pulsing for Nepal nodes
      const sizeAttr = pointsRef.current.geometry.getAttribute('size');
      data.forEach((p, i) => {
        if (p.isNepal) {
          sizeAttr.array[i] = 3.0 + Math.sin(time * 2 + i) * 0.8;
        }
      });
      sizeAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={data.length} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={data.length} itemSize={3} />
        <bufferAttribute attach="attributes-size" array={sizes} count={data.length} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        vertexColors
        vertexShader={`
          attribute float size;
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = smoothstep(0.5, 0.1, d);
            gl_FragColor = vec4(vColor, alpha * 0.85);
          }
        `}
      />
    </points>
  );
}

// ═══════════════════════════════════════════════
// NEPAL HIGHLIGHT — bright ring around Nepal region
// ═══════════════════════════════════════════════

function NepalHighlight({ radius }) {
  const ringRef = useRef();

  const ringGeo = useMemo(() => {
    const points = [];
    const r = radius + 0.015;
    // Draw a ring around Nepal's approximate bounds
    const centerLat = 28.3;
    const centerLon = 84.1;
    const ringRadius = 4.5; // degrees

    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      const lat = centerLat + Math.sin(angle) * ringRadius * 0.6;
      const lon = centerLon + Math.cos(angle) * ringRadius;
      points.push(latLonToVec3(lat, lon, r));
    }

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    points.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    });
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [radius]);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
    }
  });

  return (
    <line ref={ringRef} geometry={ringGeo}>
      <lineBasicMaterial color="#FFB81C" transparent opacity={0.4} linewidth={1} />
    </line>
  );
}

// ═══════════════════════════════════════════════
// ARC LINES — data flow connections from Nepal
// ═══════════════════════════════════════════════

function DataArcs({ radius }) {
  const arcsRef = useRef([]);
  const data = useMemo(() => generateGlobePoints(800, radius + 0.01), [radius]);
  const arcs = useMemo(() => generateArcs(data, radius), [data, radius]);

  const arcGeometries = useMemo(() => {
    return arcs.map(({ from, to }) => {
      const mid = from.clone().add(to).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(radius * 1.3);

      const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
      const points = curve.getPoints(40);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      return geo;
    });
  }, [arcs, radius]);

  return (
    <group>
      {arcGeometries.map((geo, i) => (
        <line key={i} geometry={geo}>
          <lineBasicMaterial color="#FFB81C" transparent opacity={0.15} />
        </line>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════
// SCENE — Combines all globe elements + scroll animation
// ═══════════════════════════════════════════════

function GlobeScene({ scrollProgress, onReady }) {
  const groupRef = useRef();
  const { camera } = useThree();
  const nepalTarget = useMemo(() => latLonToVec3(NEPAL_LAT, NEPAL_LON, 5), []);
  const readyRef = useRef(false);

  const GLOBE_RADIUS = 2;

  // Camera positions for scroll animation
  const startPos = useMemo(() => new THREE.Vector3(0, 0, 6), []);
  const endPos = useMemo(() => {
    // Position looking at Nepal from close
    const dir = nepalTarget.clone().normalize();
    return dir.multiplyScalar(3.2);
  }, [nepalTarget]);

  useEffect(() => {
    camera.position.copy(startPos);
    camera.lookAt(0, 0, 0);
    if (!readyRef.current) {
      readyRef.current = true;
      onReady?.();
    }
  }, [camera, startPos, onReady]);

  useFrame(() => {
    if (!groupRef.current) return;

    // Slow auto-rotation
    const rotSpeed = 0.0008;
    const baseProgress = Math.min(scrollProgress, 1);

    // Reduce rotation as we zoom in
    groupRef.current.rotation.y += rotSpeed * (1 - baseProgress * 0.8);

    // Scroll-driven camera zoom toward Nepal
    const t = easeInOutCubic(baseProgress);

    camera.position.lerpVectors(startPos, endPos, t);

    // Look at interpolation: globe center → Nepal surface
    const lookTarget = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(0, 0, 0),
      latLonToVec3(NEPAL_LAT, NEPAL_LON, GLOBE_RADIUS),
      t,
    );
    camera.lookAt(lookTarget);
  });

  return (
    <group ref={groupRef}>
      <GlobeSphere radius={GLOBE_RADIUS} />
      <GlobeAtmosphere radius={GLOBE_RADIUS} />
      <GlobeGrid radius={GLOBE_RADIUS} />
      <NetworkDots radius={GLOBE_RADIUS} />
      <NepalHighlight radius={GLOBE_RADIUS} />
      <DataArcs radius={GLOBE_RADIUS} />
    </group>
  );
}

// Easing function
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ═══════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════

export default function GlobeVisualization({ scrollProgress = 0 }) {
  const [ready, setReady] = useState(false);

  return (
    <div className="absolute inset-0 w-full h-full" style={{ background: '#050810' }}>
      <Canvas
        camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0, 6] }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ background: '#050810' }}
      >
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 3, 5]} intensity={0.4} color="#4a90d9" />
        <directionalLight position={[-3, -2, -5]} intensity={0.15} color="#1a3a6b" />
        <pointLight position={[0, 0, 8]} intensity={0.3} color="#ffffff" />
        <GlobeScene scrollProgress={scrollProgress} onReady={() => setReady(true)} />
      </Canvas>

      {/* Stats overlay */}
      <div className={`absolute bottom-8 left-8 z-10 transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-[#FFB81C] animate-pulse" />
          <span className="text-[11px] text-white/50 uppercase tracking-widest font-medium">Nepal Network</span>
        </div>
      </div>

      {/* Scroll hint */}
      {scrollProgress < 0.05 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-white/30 uppercase tracking-widest">Scroll to explore</span>
            <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
