"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DamagePopup } from "@/hooks/useIdleGame";
import { VarekSprite } from "./VarekSprite";
import type { WeaponId } from "@/lib/weapons";
import { WEAPONS } from "@/lib/weapons";

/* ── Types ─────────────────────────────────────────────────────────────── */

/** State machine for a visual enemy on stage */
type EnemyPhase =
  | "marching"   // moving right → left
  | "engaged"    // stopped at collision zone, fighting Varek
  | "dying"      // death animation playing
  | "dead";      // removed

interface StageEnemy {
  id: number;
  phase: EnemyPhase;
  isBoss: boolean;
  variant: 0 | 1 | 2;
  /** 0–100 visual HP driven by game state (bossHpPct) */
  hpPct: number;
}

interface FloatText {
  id: number;
  text: string;
  crit: boolean;
  x: number; // % from left
  y: number; // % from bottom
}

import type { StagePhase } from "@/lib/stageSystem";

export interface BattleStageProps {
  attacking: boolean;
  weaponId: WeaponId;
  popups: DamagePopup[];
  shake: boolean;
  enemyKind: "mob" | "boss";
  enemyName: string;
  bossHp: number;
  bossMaxHp: number;
  killEventCounter: number;
  stagePhase: StagePhase;
  bossIncoming: boolean;
  spawnPaused: boolean;
}

/* ── Constants ─────────────────────────────────────────────────────────── */
const MARCH_MS = 5500;        // how long to march across the stage
const SPAWN_INTERVAL_MS = 4000; // extra passive enemies from the right

/* ── Helpers ───────────────────────────────────────────────────────────── */
function fmtDmg(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

/* ── Component ─────────────────────────────────────────────────────────── */
export function BattleStage({
  attacking,
  weaponId,
  popups,
  shake,
  enemyKind,
  bossHp,
  bossMaxHp,
  killEventCounter,
  stagePhase,
  bossIncoming,
  spawnPaused,
}: BattleStageProps) {
  const weapon = WEAPONS[weaponId];

  /* Main enemy in the stage (at most 1 is "engaged") */
  const [enemy, setEnemy] = useState<StageEnemy>(() => ({
    id: 1,
    phase: "marching",
    isBoss: enemyKind === "boss",
    variant: 0,
    hpPct: 100,
  }));

  /* Extra passive enemies that just walk through */
  const [passives, setPassives] = useState<{ id: number; variant: 0 | 1 | 2 }[]>([]);

  /* Floating damage texts */
  const [floats, setFloats] = useState<FloatText[]>([]);

  const eidRef = useRef(2);
  const fidRef = useRef(0);
  const seenKillsRef = useRef(killEventCounter);
  const seenPopupsRef = useRef(0);
  const prevBossHpRef = useRef(bossHp);

  /* ── Sync enemy HP from game state ── */
  useEffect(() => {
    const pct = bossMaxHp > 0 ? Math.max(0, (bossHp / bossMaxHp) * 100) : 100;
    setEnemy((prev) => {
      if (prev.phase === "dead" || prev.phase === "dying") return prev;
      return { ...prev, hpPct: pct };
    });
    prevBossHpRef.current = bossHp;
  }, [bossHp, bossMaxHp]);

  /* ── Kill detected → death animation → spawn fresh enemy ── */
  useEffect(() => {
    if (killEventCounter <= seenKillsRef.current) return;
    seenKillsRef.current = killEventCounter;

    setEnemy((prev) => ({ ...prev, phase: "dying", hpPct: 0 }));

    if (spawnPaused || bossIncoming) {
      setTimeout(() => {
        setEnemy((prev) => ({ ...prev, phase: "dead" }));
      }, 550);
      return;
    }

    setTimeout(() => {
      const id = ++eidRef.current;
      setEnemy({
        id,
        phase: "marching",
        isBoss: enemyKind === "boss",
        variant: (id % 3) as 0 | 1 | 2,
        hpPct: 100,
      });
    }, 550);
  }, [killEventCounter, enemyKind, spawnPaused, bossIncoming]);

  const bossSpawnedRef = useRef(false);

  /* ── Stage boss spawn from right ── */
  useEffect(() => {
    if (stagePhase === "normal") {
      bossSpawnedRef.current = false;
      return;
    }
    if (stagePhase !== "boss_fight" || enemyKind !== "boss") return;
    if (bossSpawnedRef.current) return;
    bossSpawnedRef.current = true;

    const id = ++eidRef.current;
    setEnemy({
      id,
      phase: "marching",
      isBoss: true,
      variant: 0,
      hpPct: 100,
    });
  }, [stagePhase, enemyKind]);

  /* ── Enemy kind changes (mob → boss or vice versa) ── */
  useEffect(() => {
    setEnemy((prev) => {
      if (prev.phase === "dying" || prev.phase === "dead") return prev;
      return { ...prev, isBoss: enemyKind === "boss" };
    });
  }, [enemyKind]);

  /* ── Marching enemy reaches collision zone → engaged ── */
  const onEnemyArrived = useCallback(() => {
    setEnemy((prev) => {
      if (prev.phase !== "marching") return prev;
      return { ...prev, phase: "engaged" };
    });
  }, []);

  /* ── Passive extra enemies ── */
  useEffect(() => {
    if (spawnPaused) return;
    const t = setInterval(() => {
      const id = ++eidRef.current;
      setPassives((prev) => [
        ...prev.slice(-3),
        { id, variant: (id % 3) as 0 | 1 | 2 },
      ]);
      setTimeout(
        () => setPassives((prev) => prev.filter((p) => p.id !== id)),
        MARCH_MS + 500
      );
    }, SPAWN_INTERVAL_MS);
    return () => clearInterval(t);
  }, [spawnPaused]);

  /* ── Build floating damage texts from popups ── */
  useEffect(() => {
    if (popups.length <= seenPopupsRef.current) return;
    seenPopupsRef.current = popups.length;
    const last = popups[popups.length - 1];
    if (!last) return;

    const txt = last.crit ? `CRIT  ${fmtDmg(last.amount)}` : fmtDmg(last.amount);
    const fid = ++fidRef.current;
    const x = 18 + Math.random() * 18; // near weapon tip (left quadrant)
    const y = 40 + Math.random() * 20;

    setFloats((prev) => [...prev.slice(-8), { id: fid, text: txt, crit: last.crit, x, y }]);
    setTimeout(
      () => setFloats((prev) => prev.filter((f) => f.id !== fid)),
      last.crit ? 1250 : 1050
    );
  }, [popups]);

  /* ── Chainsaw blood burst: extra floats at high freq ── */
  const isCritWeapon = weaponId === "chainsaw";

  /* ── Render ─────────────────────────────────────────────────────────── */
  const isBossEnemy = enemy.isBoss;
  const isEngaged = enemy.phase === "engaged";
  const isStageBoss = stagePhase === "boss_fight" && isBossEnemy;

  return (
    <div
      className={[
        "sl-battle-stage",
        shake && weapon.hasShake ? "sl-battle-stage--shake" : "",
        isCritWeapon && attacking ? "sl-battle-stage--blood" : "",
        isStageBoss ? "sl-battle-stage--stage-boss" : "",
      ].join(" ")}
    >
      {/* Varek — layered body + weapon */}
      <VarekSprite weapon={weaponId} attacking={attacking} />

      {/* Main enemy */}
      {enemy.phase !== "dead" && (
        <div
          key={enemy.id}
          className={[
            "sl-stage-enemy",
            isBossEnemy ? "sl-stage-enemy--boss" : "",
            isStageBoss ? "sl-stage-enemy--stage-boss" : "",
            `sl-stage-enemy--v${enemy.variant}`,
            isEngaged ? "sl-stage-enemy--engaged" : "sl-stage-enemy--marching",
            enemy.phase === "dying" ? "sl-stage-enemy--dying" : "",
          ].join(" ")}
          style={
            isEngaged
              ? undefined
              : ({ "--march-ms": `${MARCH_MS}ms` } as React.CSSProperties)
          }
          onAnimationEnd={(ev) => {
            const aName = ev.animationName;
            if (aName === "sl-stage-march") onEnemyArrived();
            if (aName === "sl-stage-die")
              setEnemy((prev) => ({ ...prev, phase: "dead" }));
          }}
        >
          <div className="sl-stage-enemy__body" />
          <div className="sl-stage-enemy__eye" />
          <div className="sl-stage-enemy__weapon" />

          {/* Enemy HP bar (visible when engaged) */}
          {isEngaged && (
            <div className="sl-stage-enemy__hp-wrap" aria-hidden>
              <div
                className="sl-stage-enemy__hp-fill"
                style={{ width: `${enemy.hpPct}%` }}
              />
            </div>
          )}

          {/* Hit flash overlay */}
          {attacking && isEngaged && (
            <div className="sl-stage-enemy__hit-flash" aria-hidden />
          )}
        </div>
      )}

      {/* Passive extra enemies */}
      {passives.map((p) => (
        <div
          key={p.id}
          className={`sl-stage-passive sl-stage-passive--v${p.variant}`}
          style={{ "--march-ms": `${MARCH_MS}ms` } as React.CSSProperties}
          onAnimationEnd={(ev) => {
            if (ev.animationName === "sl-passive-march")
              setPassives((prev) => prev.filter((x) => x.id !== p.id));
          }}
        >
          <div className="sl-stage-passive__body" />
          <div className="sl-stage-passive__eye" />
        </div>
      ))}

      {/* Floating damage numbers */}
      {floats.map((f) => (
        <span
          key={f.id}
          className={`sl-float-dmg${f.crit ? " sl-float-dmg--crit" : ""}`}
          style={{ left: `${f.x}%`, bottom: `${f.y}%` }}
        >
          {f.text}
        </span>
      ))}

      {/* Stone ground */}
      <div className="sl-battle-ground" aria-hidden />
      <div className="sl-battle-ground-fog" aria-hidden />
    </div>
  );
}
