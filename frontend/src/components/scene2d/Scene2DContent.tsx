"use client";

import { extend, useApplication, useTick } from "@pixi/react";
import { Container, Graphics } from "pixi.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { JUGGLE_DELAY, SHOT_TIMELINE } from "@/lib/sceneConfig";
import type { Direction } from "@/lib/types";
import {
  COLORS_2D,
  GOAL_TARGETS,
  KEEPER_DIVE,
  LAYOUT,
  STAGE,
} from "./scene2dConfig";
import { easeOutCubic, lerp, pickDirections } from "./scene2dUtils";
import { registerPixi } from "./pixiSetup";

registerPixi();
extend({ Container, Graphics });

type ShotOutcome = "goal" | "save" | null;
type BallMode = "rest" | "juggle" | "fly";
type ShooterMode = "idle" | "juggle" | "kick";
type KeeperMode = "idle" | "save";

interface Scene2DContentProps {
  shotOutcome?: ShotOutcome;
  roundIndex?: number;
}

function StageRoot({ children }: { children: React.ReactNode }) {
  const { app } = useApplication();
  const scale = Math.min(app.screen.width / STAGE.width, app.screen.height / STAGE.height);
  const x = (app.screen.width - STAGE.width * scale) / 2;
  const y = (app.screen.height - STAGE.height * scale) / 2;

  return (
    <pixiContainer x={x} y={y} scale={scale}>
      {children}
    </pixiContainer>
  );
}

function Background() {
  const draw = useCallback((g: Graphics) => {
    const { width, height } = STAGE;
    g.clear();
    g.rect(0, 0, width, height);
    g.fill({ color: COLORS_2D.bg });
    g.rect(0, 340, width, height - 340);
    g.fill({ color: COLORS_2D.floor });
    for (let i = 0; i < 14; i++) {
      const x0 = i * 60;
      g.moveTo(x0, 340);
      g.lineTo(x0 - 100, height);
      g.stroke({ width: 1, color: COLORS_2D.grid, alpha: 0.1 });
    }
    g.rect(250, 300, 300, 200);
    g.stroke({ width: 1.5, color: COLORS_2D.grid, alpha: 0.25 });
    g.circle(LAYOUT.ballRest.x, LAYOUT.ballRest.y, 6);
    g.fill({ color: COLORS_2D.neon, alpha: 0.9 });
  }, []);

  return <pixiGraphics draw={draw} />;
}

function Spotlight() {
  const draw = useCallback((g: Graphics) => {
    g.clear();
    g.moveTo(LAYOUT.spotlight.x - 180, 0);
    g.lineTo(LAYOUT.spotlight.x + 180, 0);
    g.lineTo(LAYOUT.spotlight.x + 320, STAGE.height);
    g.lineTo(LAYOUT.spotlight.x - 320, STAGE.height);
    g.closePath();
    g.fill({ color: 0xcfeaff, alpha: 0.05 });
  }, []);

  return <pixiGraphics draw={draw} />;
}

function Goal() {
  const draw = useCallback((g: Graphics) => {
    g.clear();
    const { x, y, w, h } = LAYOUT.goal;
    const left = x - w / 2;
    const right = x + w / 2;
    g.moveTo(left, y + h);
    g.lineTo(left, y);
    g.lineTo(right, y);
    g.lineTo(right, y + h);
    g.stroke({ width: 4, color: COLORS_2D.neon, alpha: 0.95 });
    for (let i = 0; i <= 8; i++) {
      const nx = left + (w * i) / 8;
      g.moveTo(nx, y);
      g.lineTo(nx, y + h);
      g.stroke({ width: 1, color: COLORS_2D.neon, alpha: 0.35 });
    }
  }, []);

  return <pixiGraphics draw={draw} />;
}

function drawHumanoid(
  g: Graphics,
  x: number,
  y: number,
  color: number,
  colorDark: number,
  kickPhase: number
) {
  g.clear();
  const legSwing = kickPhase * 0.9;
  g.ellipse(x, y + 52, 22, 6);
  g.fill({ color: 0x000000, alpha: 0.35 });
  g.roundRect(x - 14, y + 20, 10, 32, 3);
  g.fill({ color: colorDark });
  g.roundRect(x + 4, y + 20, 10, 32, 3);
  g.fill({ color: colorDark });
  if (kickPhase > 0.01) {
    g.moveTo(x + 4, y + 28);
    g.lineTo(x + 4 + legSwing * 40, y + 18 - legSwing * 20);
    g.lineTo(x + 4 + legSwing * 40 + 8, y + 24 - legSwing * 20);
    g.lineTo(x + 12, y + 32);
    g.closePath();
    g.fill({ color: colorDark });
  }
  g.roundRect(x - 16, y - 8, 32, 34, 6);
  g.fill({ color });
  g.roundRect(x - 16, y - 8, 32, 34, 6);
  g.stroke({ width: 2.5, color: COLORS_2D.outline });
  g.circle(x, y - 22, 14);
  g.fill({ color });
  g.circle(x, y - 22, 14);
  g.stroke({ width: 2.5, color: COLORS_2D.outline });
}

function Striker({ mode, kickProgress }: { mode: ShooterMode; kickProgress: number }) {
  const { x, y } = LAYOUT.striker;
  const kickPhase = mode === "kick" ? kickProgress : mode === "juggle" ? 0.15 : 0;
  const draw = useCallback(
    (g: Graphics) => drawHumanoid(g, x, y, COLORS_2D.shooter, COLORS_2D.shooterDark, kickPhase),
    [x, y, kickPhase]
  );
  return <pixiGraphics draw={draw} />;
}

function Keeper({
  mode,
  diveDir,
  diveProgress,
}: {
  mode: KeeperMode;
  diveDir: Direction;
  diveProgress: number;
}) {
  const base = LAYOUT.keeper;
  const dive = KEEPER_DIVE[diveDir];
  const t = mode === "save" ? easeOutCubic(Math.min(1, diveProgress)) : 0;
  const x = lerp(base.x, dive.x, t);
  const y = lerp(base.y, dive.y, t);
  const draw = useCallback(
    (g: Graphics) => drawHumanoid(g, x, y, COLORS_2D.keeper, COLORS_2D.keeperDark, t * 0.3),
    [x, y, t]
  );
  return <pixiGraphics draw={draw} />;
}

function Ball({
  mode,
  target,
  flyProgress,
  juggleTime,
}: {
  mode: BallMode;
  target: Direction;
  flyProgress: number;
  juggleTime: number;
}) {
  const rest = LAYOUT.ballRest;
  let bx: number = rest.x;
  let by: number = rest.y;
  if (mode === "juggle") {
    by = rest.y - 18 - Math.abs(Math.sin(juggleTime * 4)) * 22;
    bx = rest.x + Math.sin(juggleTime * 2) * 6;
  } else if (mode === "fly") {
    const end = GOAL_TARGETS[target];
    const t = easeOutCubic(Math.min(1, flyProgress));
    const midX = (rest.x + end.x) / 2;
    const midY = Math.min(rest.y, end.y) - 80;
    if (t < 0.5) {
      const u = t * 2;
      bx = lerp(rest.x, midX, u);
      by = lerp(rest.y, midY, u);
    } else {
      const u = (t - 0.5) * 2;
      bx = lerp(midX, end.x, u);
      by = lerp(midY, end.y, u);
    }
  }
  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      g.circle(bx, by, 9);
      g.fill({ color: COLORS_2D.ball });
      g.circle(bx, by, 9);
      g.stroke({ width: 2, color: COLORS_2D.outline });
    },
    [bx, by]
  );
  return <pixiGraphics draw={draw} />;
}

function Particles() {
  const ref = useRef<Graphics>(null);
  const seeds = useRef(
    Array.from({ length: 40 }, () => ({
      x: Math.random() * STAGE.width,
      y: Math.random() * STAGE.height,
      speed: 0.15 + Math.random() * 0.35,
      size: 1 + Math.random() * 2,
    }))
  );
  useTick(() => {
    const g = ref.current;
    if (!g) return;
    g.clear();
    for (const p of seeds.current) {
      p.y -= p.speed;
      if (p.y < 0) {
        p.y = STAGE.height;
        p.x = Math.random() * STAGE.width;
      }
      g.circle(p.x, p.y, p.size);
      g.fill({ color: COLORS_2D.neon, alpha: 0.25 });
    }
  });
  return <pixiGraphics ref={ref} draw={() => {}} />;
}

export function Scene2DContent({ shotOutcome, roundIndex = 0 }: Scene2DContentProps) {
  const [shooterMode, setShooterMode] = useState<ShooterMode>("idle");
  const [keeperMode, setKeeperMode] = useState<KeeperMode>("idle");
  const [ballMode, setBallMode] = useState<BallMode>("rest");
  const [ballTarget, setBallTarget] = useState<Direction>("center");
  const [keeperTarget, setKeeperTarget] = useState<Direction>("center");
  const [kickProgress, setKickProgress] = useState(0);
  const [diveProgress, setDiveProgress] = useState(0);
  const [juggleTime, setJuggleTime] = useState(0);
  const [flyProgress, setFlyProgress] = useState(0);
  const animating = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const clearTimers = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    clearTimers();
    animating.current = false;
    setFlyProgress(0);
    setKickProgress(0);
    setDiveProgress(0);

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
    setKeeperTarget(dirs.keeper);
    setShooterMode("idle");
    setKeeperMode("idle");
    setBallMode("rest");

    timers.current.push(
      setTimeout(() => {
        animating.current = true;
        setShooterMode("kick");
        setBallMode("fly");
        setKeeperMode("save");
      }, SHOT_TIMELINE.kick * 1000)
    );

    timers.current.push(
      setTimeout(() => {
        animating.current = false;
        setShooterMode("idle");
        setKeeperMode("idle");
        setBallMode("rest");
        setFlyProgress(0);
        setKickProgress(0);
        setDiveProgress(0);
      }, SHOT_TIMELINE.total * 1000)
    );

    return clearTimers;
  }, [shotOutcome, roundIndex]);

  useTick((ticker) => {
    if (ballMode === "juggle") {
      setJuggleTime((t) => t + ticker.deltaTime * 0.05);
    }
    if (animating.current) {
      setKickProgress((p) => Math.min(1, p + ticker.deltaTime * 0.04));
      setDiveProgress((p) => Math.min(1, p + ticker.deltaTime * 0.045));
      setFlyProgress((p) => Math.min(1, p + ticker.deltaTime * 0.025));
    }
  });

  return (
    <StageRoot>
      <Background />
      <Spotlight />
      <Particles />
      <Goal />
      <Keeper mode={keeperMode} diveDir={keeperTarget} diveProgress={diveProgress} />
      <Striker mode={shooterMode} kickProgress={kickProgress} />
      <Ball mode={ballMode} target={ballTarget} flyProgress={flyProgress} juggleTime={juggleTime} />
    </StageRoot>
  );
}
