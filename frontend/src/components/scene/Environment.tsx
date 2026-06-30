"use client";

import { Grid } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CAMERA, COLORS, GOAL_Z } from "@/lib/sceneConfig";

function makeSmokeTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.5)");
  g.addColorStop(0.4, "rgba(255,255,255,0.18)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

/** Low-count drifting dust/smoke particles caught in the light */
function Particles({ count = 140 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const texture = useMemo(() => makeSmokeTexture(), []);

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 6;
      positions[i * 3 + 2] = -8 + Math.random() * 14;
      speeds[i] = 0.1 + Math.random() * 0.25;
    }
    return { positions, speeds };
  }, [count]);

  useFrame((_, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const arr = pts.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i]! * delta;
      if (arr[i * 3 + 1] > 6) arr[i * 3 + 1] = 0;
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        color={COLORS.ice}
        size={0.18}
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/** Volumetric-style light shaft from above */
function LightShaft({
  position,
  color,
  radiusTop = 0.15,
  radiusBottom = 2.4,
  height = 8,
  opacity = 0.06,
}: {
  position: [number, number, number];
  color: string;
  radiusTop?: number;
  radiusBottom?: number;
  height?: number;
  opacity?: number;
}) {
  return (
    <mesh position={position}>
      <coneGeometry args={[radiusBottom, height, 32, 1, true]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/** Procedural dark arena enclosure (replaces the heavy stadium GLB) */
function NeonStrip({
  width,
  position,
  rotation,
  color,
}: {
  width: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, 0.04]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

export function ArenaBackdrop() {
  const wallMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COLORS.wall,
        metalness: 0.8,
        roughness: 0.55,
      }),
    []
  );

  return (
    <group>
      {/* Back wall behind the goal */}
      <mesh position={[0, 5, GOAL_Z - 9]} material={wallMat}>
        <planeGeometry args={[60, 22]} />
      </mesh>
      {/* Side walls */}
      <mesh position={[-15, 5, -2]} rotation={[0, Math.PI / 2, 0]} material={wallMat}>
        <planeGeometry args={[44, 22]} />
      </mesh>
      <mesh position={[15, 5, -2]} rotation={[0, -Math.PI / 2, 0]} material={wallMat}>
        <planeGeometry args={[44, 22]} />
      </mesh>
      {/* Back wall behind the camera (subtle) */}
      <mesh position={[0, 5, 12]} rotation={[0, Math.PI, 0]} material={wallMat}>
        <planeGeometry args={[60, 22]} />
      </mesh>

      {/* Neon accent strips on the back wall */}
      <NeonStrip width={26} position={[0, 2.4, GOAL_Z - 8.9]} color={COLORS.blue} />
      <NeonStrip width={26} position={[0, 6.0, GOAL_Z - 8.9]} color={COLORS.cyan} />
      {/* Side wall strips */}
      <NeonStrip
        width={30}
        position={[-14.9, 3.2, -2]}
        rotation={[0, Math.PI / 2, 0]}
        color={COLORS.blue}
      />
      <NeonStrip
        width={30}
        position={[14.9, 3.2, -2]}
        rotation={[0, -Math.PI / 2, 0]}
        color={COLORS.blue}
      />
    </group>
  );
}

/** Camera controller: holds the cinematic framing and shakes on kick impact */
export function CameraRig({ kickTrigger }: { kickTrigger: number }) {
  const { camera } = useThree();
  const shakeStart = useRef(-1);
  const lookTarget = useMemo(() => new THREE.Vector3(...CAMERA.lookAt), []);

  useEffect(() => {
    if (kickTrigger > 0) shakeStart.current = performance.now();
  }, [kickTrigger]);

  useFrame((state) => {
    const base = CAMERA.position;
    let ox = 0;
    let oy = 0;

    if (shakeStart.current >= 0) {
      const el = (performance.now() - shakeStart.current) / 1000;
      const dur = 0.55;
      if (el > dur) {
        shakeStart.current = -1;
      } else {
        const amp = (1 - el / dur) * 0.16;
        ox = (Math.random() - 0.5) * amp;
        oy = (Math.random() - 0.5) * amp;
      }
    }

    // gentle idle drift for life
    const t = state.clock.elapsedTime;
    const driftX = Math.sin(t * 0.25) * 0.06;

    camera.position.set(base[0] + ox + driftX, base[1] + oy, base[2]);
    camera.lookAt(lookTarget);
  });

  return null;
}

export function TechFloor() {
  return (
    <group>
      {/* Solid dark metallic base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1.5]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color={COLORS.floor}
          metalness={0.85}
          roughness={0.4}
          envMapIntensity={0.6}
        />
      </mesh>

      {/* Cyan tech grid */}
      <Grid
        position={[0, 0.01, -1.5]}
        args={[40, 40]}
        cellSize={0.6}
        cellThickness={0.6}
        cellColor={COLORS.blue}
        sectionSize={3}
        sectionThickness={1.1}
        sectionColor={COLORS.cyan}
        fadeDistance={26}
        fadeStrength={2}
        followCamera={false}
        infiniteGrid
      />

      {/* Glowing penalty spot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0.9]}>
        <circleGeometry args={[0.1, 24]} />
        <meshBasicMaterial color={COLORS.cyan} />
      </mesh>
    </group>
  );
}

export function ArenaLighting() {
  const spotShooter = useRef<THREE.SpotLight>(null);
  const spotGoal = useRef<THREE.SpotLight>(null);
  const targetShooter = useMemo(() => new THREE.Object3D(), []);
  const targetGoal = useMemo(() => new THREE.Object3D(), []);

  return (
    <group>
      <ambientLight intensity={0.12} color="#1a2740" />
      <hemisphereLight args={["#13243f", "#04060a", 0.18]} />

      {/* Harsh top spotlight on shooter */}
      <primitive object={targetShooter} position={[0, 0, 1.6]} />
      <spotLight
        ref={spotShooter}
        position={[0, 8.5, 3.5]}
        target={targetShooter}
        angle={0.42}
        penumbra={0.55}
        intensity={120}
        distance={22}
        color="#dff1ff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
      />

      {/* Spotlight on goal */}
      <primitive object={targetGoal} position={[0, 0, GOAL_Z]} />
      <spotLight
        ref={spotGoal}
        position={[0, 8, GOAL_Z - 1]}
        target={targetGoal}
        angle={0.5}
        penumbra={0.7}
        intensity={70}
        distance={20}
        color="#bfe6ff"
      />

      {/* Cool rim lights for cel separation */}
      <directionalLight position={[-6, 4, -2]} intensity={0.8} color={COLORS.blue} />
      <directionalLight position={[6, 3, 4]} intensity={0.5} color={COLORS.cyan} />
      {/* Soft camera-side fill so players read clearly */}
      <directionalLight position={[0, 3.5, 8]} intensity={0.55} color="#cfe2ff" />
    </group>
  );
}

export function Atmosphere() {
  return (
    <>
      <fog attach="fog" args={["#04070d", 11, 34]} />
      <ArenaLighting />
      <ArenaBackdrop />
      <TechFloor />
      <LightShaft position={[0, 4.5, 2.0]} color="#cfeaff" opacity={0.05} />
      <LightShaft position={[0, 4.5, GOAL_Z]} color={COLORS.cyan} opacity={0.05} />
      <Particles count={120} />
    </>
  );
}
