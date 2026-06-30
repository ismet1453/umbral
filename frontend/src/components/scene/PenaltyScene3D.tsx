"use client";

import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import { Atmosphere, CameraRig } from "./Environment";
import { Effects } from "./Effects";
import { Player, type KeeperMode, type ShooterMode } from "./Player";
import { BallModel, GoalNet, type BallMode } from "./SceneModels";
import {
  CAMERA,
  JUGGLE_DELAY,
  KEEPER_POS,
  SHOOTER_POS,
  SHOT_TIMELINE,
} from "@/lib/sceneConfig";
import type { Direction } from "@/lib/types";

type ShotOutcome = "goal" | "save" | null;

interface PenaltyScene3DProps {
  roundIndex?: number;
  shotOutcome?: ShotOutcome;
  fullscreen?: boolean;
}

function pickDirections(outcome: "goal" | "save"): {
  ball: Direction;
  keeper: Direction;
} {
  const dirs: Direction[] = ["left", "center", "right"];
  const ball = dirs[Math.floor(Math.random() * dirs.length)]!;
  if (outcome === "save") return { ball, keeper: ball };
  const keeper = dirs.find((d) => d !== ball) ?? "left";
  return { ball, keeper };
}

function SceneContent({ shotOutcome, roundIndex = 0 }: PenaltyScene3DProps) {
  const [shooterMode, setShooterMode] = useState<ShooterMode>("idle");
  const [keeperMode, setKeeperMode] = useState<KeeperMode>("idle");
  const [ballMode, setBallMode] = useState<BallMode>("rest");
  const [ballTarget, setBallTarget] = useState<Direction>("center");
  const [saveVariant, setSaveVariant] = useState(0);
  const [kickTrigger, setKickTrigger] = useState(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const clearTimers = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    clearTimers();

    if (!shotOutcome) {
      setShooterMode("idle");
      setKeeperMode("idle");
      setBallMode("rest");
      timers.current.push(
        setTimeout(() => {
          setShooterMode("juggle");
          setBallMode("juggle");
        }, JUGGLE_DELAY * 1000)
      );
      return clearTimers;
    }

    const dirs = pickDirections(shotOutcome);
    setBallTarget(dirs.ball);
    setSaveVariant(Math.random() < 0.5 ? 0 : 1);

    setShooterMode("idle");
    setBallMode("rest");
    setKeeperMode("idle");

    timers.current.push(
      setTimeout(() => {
        setShooterMode("kick");
        setBallMode("fly");
        setKeeperMode("save");
        setKickTrigger((n) => n + 1);
      }, SHOT_TIMELINE.kick * 1000)
    );

    timers.current.push(
      setTimeout(() => {
        setShooterMode("idle");
        setKeeperMode("idle");
        setBallMode("rest");
      }, SHOT_TIMELINE.total * 1000)
    );

    return clearTimers;
  }, [shotOutcome, roundIndex]);

  return (
    <>
      <color attach="background" args={["#04070d"]} />
      <CameraRig kickTrigger={kickTrigger} />

      <Atmosphere />
      <GoalNet />

      <group position={SHOOTER_POS}>
        <Player role="shooter" mode={shooterMode} facing={Math.PI} />
      </group>

      <group position={KEEPER_POS}>
        <Player role="keeper" mode={keeperMode} saveVariant={saveVariant} facing={0} />
      </group>

      <BallModel mode={ballMode} target={ballTarget} />

      <Effects />
    </>
  );
}

export function PenaltyScene3D({
  shotOutcome,
  roundIndex = 0,
  fullscreen = false,
}: PenaltyScene3DProps) {
  return (
    <div
      className={
        fullscreen
          ? "absolute inset-0 bg-[#04070d]"
          : "relative h-[360px] w-full overflow-hidden rounded-2xl border border-neon-cyan/20 bg-[#04070d]"
      }
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        className="h-full w-full"
        style={{ width: "100%", height: "100%", display: "block" }}
        camera={{ position: CAMERA.position, fov: CAMERA.fov }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <SceneContent shotOutcome={shotOutcome} roundIndex={roundIndex} />
        </Suspense>
      </Canvas>

      <Loader
        containerStyles={{ background: "rgba(4,7,13,0.92)" }}
        innerStyles={{ width: "220px", height: "4px", background: "#0b1626" }}
        barStyles={{ background: "linear-gradient(90deg,#2b6bff,#22e6ff)" }}
        dataStyles={{
          color: "#7fdfff",
          fontFamily: "var(--font-display), sans-serif",
          fontSize: "13px",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          marginTop: "14px",
        }}
        dataInterpolation={(p) => `Entering Arena ${p.toFixed(0)}%`}
      />
    </div>
  );
}
