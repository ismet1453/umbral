"use client";

import { Clone, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  BALL_REST,
  BALL_SIZE,
  COLORS,
  GOAL_HEIGHT,
  GOAL_WIDTH,
  GOAL_Z,
  MODELS,
  SHOOTER_POS,
  SHOT_TARGETS,
} from "@/lib/sceneConfig";
import type { Direction } from "@/lib/types";

export type BallMode = "rest" | "juggle" | "fly";

export function BallModel({
  mode,
  target,
}: {
  mode: BallMode;
  target: Direction;
}) {
  const { scene } = useGLTF(MODELS.ball);
  const ref = useRef<THREE.Group>(null);
  const flyProgress = useRef(0);

  const ball = useMemo(() => {
    const s = scene.clone(true);
    const box = new THREE.Box3().setFromObject(s);
    const size = box.getSize(new THREE.Vector3());
    const sc = size.y > 0 ? BALL_SIZE / size.y : 1;
    s.scale.setScalar(sc);
    s.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.castShadow = true;
    });
    return s;
  }, [scene]);

  useEffect(() => {
    flyProgress.current = 0;
  }, [mode, target]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;

    if (mode === "juggle") {
      // bounce near the shooter's foot
      const bounce = Math.abs(Math.sin(t * 3.2)) * 0.55 + BALL_SIZE / 2;
      ref.current.position.set(
        SHOOTER_POS[0] + Math.sin(t * 1.5) * 0.08,
        bounce,
        SHOOTER_POS[2] - 0.35
      );
      ref.current.rotation.x += delta * 6;
      return;
    }

    if (mode === "fly") {
      flyProgress.current = Math.min(1, flyProgress.current + delta * 1.6);
      const p = flyProgress.current;
      const ease = 1 - Math.pow(1 - p, 3);
      const start = new THREE.Vector3(...BALL_REST);
      const end = new THREE.Vector3(...SHOT_TARGETS[target]);
      const mid = start.clone().lerp(end, 0.5);
      mid.y += 1.1;
      const pos = new THREE.Vector3();
      if (p < 0.5) pos.lerpVectors(start, mid, ease * 2);
      else pos.lerpVectors(mid, end, (ease - 0.5) * 2);
      ref.current.position.copy(pos);
      ref.current.rotation.x += delta * 18;
      ref.current.rotation.z += delta * 10;
      return;
    }

    // rest: settle on the penalty spot
    ref.current.position.lerp(new THREE.Vector3(...BALL_REST), 0.2);
    ref.current.rotation.set(0, 0, 0);
  });

  return (
    <group ref={ref} position={BALL_REST}>
      <Clone object={ball} />
    </group>
  );
}

export function GoalNet() {
  const postR = 0.05;
  const w = GOAL_WIDTH;
  const h = GOAL_HEIGHT;
  const depth = 1.1;
  const netMat = (
    <meshStandardMaterial
      color={COLORS.netEmissive}
      emissive={COLORS.netEmissive}
      emissiveIntensity={2.2}
      transparent
      opacity={0.55}
      wireframe
      side={THREE.DoubleSide}
    />
  );

  return (
    <group position={[0, 0, GOAL_Z]}>
      {/* Frame — emissive cyan tubes */}
      {[
        [-w / 2, h / 2, 0],
        [w / 2, h / 2, 0],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <cylinderGeometry args={[postR, postR, h, 12]} />
          <meshStandardMaterial color="#eafcff" emissive={COLORS.cyan} emissiveIntensity={1.4} />
        </mesh>
      ))}
      <mesh position={[0, h, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[postR, postR, w + postR * 2, 12]} />
        <meshStandardMaterial color="#eafcff" emissive={COLORS.cyan} emissiveIntensity={1.4} />
      </mesh>

      {/* Neon energy net */}
      <mesh position={[0, h / 2, -depth]}>
        <planeGeometry args={[w, h, 8, 5]} />
        {netMat}
      </mesh>
      <mesh position={[-w / 2, h / 2, -depth / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, h, 4, 5]} />
        {netMat}
      </mesh>
      <mesh position={[w / 2, h / 2, -depth / 2]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, h, 4, 5]} />
        {netMat}
      </mesh>
      <mesh position={[0, h, -depth / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, depth, 8, 4]} />
        {netMat}
      </mesh>
    </group>
  );
}

useGLTF.preload(MODELS.ball);
