"use client";

import { useEffect, useRef, useState } from "react";
import { JUGGLE_DELAY, SHOT_TIMELINE } from "@/lib/sceneConfig";
import type { Direction } from "@/lib/types";
import { easeOutCubic, pickDirections } from "./scene2dUtils";

type ShotOutcome = "goal" | "save" | null;
type BallMode = "rest" | "juggle" | "fly";
type KeeperMode = "idle" | "save";

const GOAL_POS: Record<Direction, { x: number; y: number }> = {
  left: { x: 32, y: 28 },
  center: { x: 50, y: 24 },
  right: { x: 68, y: 28 },
};

const BALL_REST = { x: 50, y: 72 };

export function useShotAnimation(shotOutcome: ShotOutcome | null | undefined, roundIndex: number) {
  const [ballMode, setBallMode] = useState<BallMode>("rest");
  const [ballTarget, setBallTarget] = useState<Direction>("center");
  const [keeperTarget, setKeeperTarget] = useState<Direction>("center");
  const [keeperMode, setKeeperMode] = useState<KeeperMode>("idle");
  const [flyProgress, setFlyProgress] = useState(0);
  const [juggleTime, setJuggleTime] = useState(0);
  const animating = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const raf = useRef<number>(0);

  useEffect(() => {
    const clearTimers = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    clearTimers();
    animating.current = false;
    setFlyProgress(0);
    setJuggleTime(0);

    if (!shotOutcome) {
      setKeeperMode("idle");
      setBallMode("rest");
      timers.current.push(
        setTimeout(() => setBallMode("juggle"), JUGGLE_DELAY * 1000)
      );
      return clearTimers;
    }

    const dirs = pickDirections(shotOutcome);
    setBallTarget(dirs.ball);
    setKeeperTarget(dirs.keeper);
    setKeeperMode("idle");
    setBallMode("rest");

    timers.current.push(
      setTimeout(() => {
        animating.current = true;
        setBallMode("fly");
        setKeeperMode("save");
      }, SHOT_TIMELINE.kick * 1000)
    );

    timers.current.push(
      setTimeout(() => {
        animating.current = false;
        setKeeperMode("idle");
        setBallMode("rest");
        setFlyProgress(0);
      }, SHOT_TIMELINE.total * 1000)
    );

    return clearTimers;
  }, [shotOutcome, roundIndex]);

  useEffect(() => {
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (ballMode === "juggle") {
        setJuggleTime((t) => t + dt);
      }
      if (animating.current) {
        setFlyProgress((p) => Math.min(1, p + dt * 1.4));
      }

      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [ballMode]);

  let ballX = BALL_REST.x;
  let ballY = BALL_REST.y;

  if (ballMode === "juggle") {
    ballY = BALL_REST.y - 4 - Math.abs(Math.sin(juggleTime * 4)) * 5;
    ballX = BALL_REST.x + Math.sin(juggleTime * 2) * 1.5;
  } else if (ballMode === "fly") {
    const end = GOAL_POS[ballTarget];
    const t = easeOutCubic(flyProgress);
    const midX = (BALL_REST.x + end.x) / 2;
    const midY = Math.min(BALL_REST.y, end.y) - 18;
    if (t < 0.5) {
      const u = t * 2;
      ballX = BALL_REST.x + (midX - BALL_REST.x) * u;
      ballY = BALL_REST.y + (midY - BALL_REST.y) * u;
    } else {
      const u = (t - 0.5) * 2;
      ballX = midX + (end.x - midX) * u;
      ballY = midY + (end.y - midY) * u;
    }
  }

  return {
    ballX,
    ballY,
    ballMode,
    keeperMode,
    keeperTarget,
    ballTarget,
  };
}
