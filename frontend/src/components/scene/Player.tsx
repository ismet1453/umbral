"use client";

import { useFBX } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { ANIMS, CHARACTER_HEIGHT, COLORS } from "@/lib/sceneConfig";
import { addOutline, applyCelShading } from "@/lib/sceneUtils";

export type ShooterMode = "idle" | "juggle" | "kick";
export type KeeperMode = "idle" | "save";
export type PlayerMode = ShooterMode | KeeperMode;

interface PlayerProps {
  role: "shooter" | "keeper";
  mode: PlayerMode;
  /** save variant for keeper: 0 = dive, 1 = body block */
  saveVariant?: number;
  facing?: number; // Y rotation
}

function firstClip(group: THREE.Group): THREE.AnimationClip | null {
  return group.animations && group.animations.length > 0 ? group.animations[0]! : null;
}

export function Player({ role, mode, saveVariant = 0, facing = 0 }: PlayerProps) {
  // Shared Mixamo skeleton across all clips — load once, drei caches by url
  const juggleFbx = useFBX(ANIMS.juggle);
  const diveFbx = useFBX(ANIMS.dive);
  const kickFbx = useFBX(ANIMS.kick);
  const blockFbx = useFBX(ANIMS.block);

  const tint = role === "shooter" ? COLORS.shooter : COLORS.keeper;
  const emissive = role === "shooter" ? COLORS.shooterEmissive : COLORS.keeperEmissive;

  // Independent, cel-shaded, grounded instance
  const model = useMemo(() => {
    const inst = skeletonClone(juggleFbx) as THREE.Group;

    const box = new THREE.Box3().setFromObject(inst);
    const size = box.getSize(new THREE.Vector3());
    const scale = size.y > 0 ? CHARACTER_HEIGHT / size.y : 0.01;
    inst.scale.setScalar(scale);
    inst.updateMatrixWorld(true);
    const grounded = new THREE.Box3().setFromObject(inst);
    inst.position.y = -grounded.min.y;

    applyCelShading(inst, { tint, tintStrength: 0.5, emissive, emissiveIntensity: 0.22 });
    addOutline(inst, { thickness: size.y * 0.015, color: COLORS.outline });
    return inst;
  }, [juggleFbx, tint, emissive]);

  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model]);

  const actions = useMemo(() => {
    const make = (clip: THREE.AnimationClip | null, name: string) => {
      if (!clip) return null;
      const c = clip.clone();
      c.name = name;
      return mixer.clipAction(c);
    };
    return {
      juggle: make(firstClip(juggleFbx), "juggle"),
      dive: make(firstClip(diveFbx), "dive"),
      kick: make(firstClip(kickFbx), "kick"),
      block: make(firstClip(blockFbx), "block"),
    };
  }, [mixer, juggleFbx, diveFbx, kickFbx, blockFbx]);

  const current = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    let next: THREE.AnimationAction | null = null;
    let loop = true;
    let paused = false;

    if (role === "shooter") {
      if (mode === "juggle") {
        next = actions.juggle;
        loop = true;
      } else if (mode === "kick") {
        next = actions.kick;
        loop = false;
      } else {
        // idle = standing pre-kick pose (frozen frame 0)
        next = actions.kick;
        loop = false;
        paused = true;
      }
    } else {
      if (mode === "save") {
        next = saveVariant === 1 ? actions.block : actions.dive;
        loop = false;
      } else {
        // ready stance = frozen frame 0 of block
        next = actions.block;
        loop = false;
        paused = true;
      }
    }

    if (!next) return;

    next.reset();
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = !loop;
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.setEffectiveTimeScale(1);

    if (current.current && current.current !== next) {
      next.crossFadeFrom(current.current, 0.3, false);
    }
    next.play();

    if (paused) {
      next.time = 0;
      mixer.update(0);
      next.paused = true;
    } else {
      next.paused = false;
    }

    current.current = next;
  }, [role, mode, saveVariant, actions, mixer]);

  useFrame((_, delta) => {
    mixer.update(delta);
  });

  const auraVisible = mode === "idle" || mode === "juggle";

  return (
    <group rotation={[0, facing, 0]}>
      <primitive object={model} />
      {auraVisible && <EgoistAura color={role === "shooter" ? COLORS.blue : COLORS.keeper} />}
    </group>
  );
}

/** Neon ground aura that rises from the player's feet (does not wash the body) */
function EgoistAura({ color }: { color: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      const s = 1 + Math.sin(t * 2.0) * 0.06;
      ringRef.current.scale.set(s, s, s);
      ringRef.current.rotation.z = t * 0.6;
    }
    if (ringMat.current) {
      ringMat.current.opacity = 0.45 + (Math.sin(t * 2.2) + 1) * 0.12;
    }
    if (glowRef.current) {
      glowRef.current.rotation.y = -t * 0.3;
    }
  });

  return (
    <group>
      {/* Glowing ground ring */}
      <mesh ref={ringRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.78, 40]} />
        <meshBasicMaterial
          ref={ringMat}
          color={color}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Faint rising backdrop glow behind the player */}
      <mesh ref={glowRef} position={[0, 0.9, -0.45]}>
        <cylinderGeometry args={[0.5, 0.7, 1.8, 20, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

useFBX.preload(ANIMS.juggle);
useFBX.preload(ANIMS.dive);
useFBX.preload(ANIMS.kick);
useFBX.preload(ANIMS.block);
