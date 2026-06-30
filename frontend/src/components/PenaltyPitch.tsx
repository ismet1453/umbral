"use client";

import { useEffect, useState } from "react";
import type { Direction } from "@/lib/types";

type ShotOutcome = "goal" | "save" | null;

interface PenaltyPitchProps {
  role: "shooter" | "keeper" | null;
  roundPhase?: "commit" | "reveal";
  shotOutcome?: ShotOutcome;
  roundIndex?: number;
}

const SHOT_CORNERS: Record<Direction, string> = {
  left: "shot-left",
  center: "shot-center",
  right: "shot-right",
};

export function PenaltyPitch({
  role,
  roundPhase,
  shotOutcome,
  roundIndex = 0,
}: PenaltyPitchProps) {
  const [animating, setAnimating] = useState(false);
  const [keeperDive, setKeeperDive] = useState<Direction>("center");
  const [ballCorner, setBallCorner] = useState<Direction>("center");

  useEffect(() => {
    if (!shotOutcome) return;

    const corners: Direction[] = ["left", "center", "right"];
    const target =
      corners[Math.floor(Math.random() * corners.length)] ?? "center";
    const dive =
      shotOutcome === "save"
        ? target
        : corners.find((c) => c !== target) ?? "left";

    setBallCorner(target);
    setKeeperDive(dive);
    setAnimating(true);

    const timer = setTimeout(() => setAnimating(false), 1400);
    return () => clearTimeout(timer);
  }, [shotOutcome, roundIndex]);

  return (
    <div className="penalty-scene" aria-hidden>
      <div className="penalty-scene__sky" />
      <div className="penalty-scene__stand" />

      <div className="penalty-scene__viewport">
        <div className="penalty-scene__pitch">
          <div className="penalty-scene__stripe penalty-scene__stripe--a" />
          <div className="penalty-scene__stripe penalty-scene__stripe--b" />
          <div className="penalty-scene__line penalty-scene__line--box" />
          <div className="penalty-scene__line penalty-scene__line--spot" />

          <div className="penalty-scene__goal">
            <div className="penalty-scene__crossbar" />
            <div className="penalty-scene__post penalty-scene__post--left" />
            <div className="penalty-scene__post penalty-scene__post--right" />
            <div className="penalty-scene__net" />
          </div>

          <div
            className={`penalty-scene__keeper ${
              animating ? `penalty-scene__keeper--dive-${keeperDive}` : ""
            } ${role === "keeper" ? "penalty-scene__keeper--you" : ""}`}
          >
            <div className="penalty-scene__keeper-head" />
            <div className="penalty-scene__keeper-body" />
            <div className="penalty-scene__keeper-gloves" />
          </div>

          <div
            className={`penalty-scene__ball ${
              animating
                ? `penalty-scene__ball--${SHOT_CORNERS[ballCorner]}`
                : ""
            } ${shotOutcome === "goal" && animating ? "penalty-scene__ball--goal" : ""}`}
          />

          <div
            className={`penalty-scene__shooter ${
              role === "shooter" ? "penalty-scene__shooter--you" : ""
            } ${animating ? "penalty-scene__shooter--kick" : ""}`}
          >
            <div className="penalty-scene__shooter-head" />
            <div className="penalty-scene__shooter-body" />
            <div className="penalty-scene__shooter-leg" />
          </div>
        </div>
      </div>

      <div className="penalty-scene__hud">
        {role === "shooter" && roundPhase === "commit" && (
          <span className="penalty-scene__badge">Your shot — pick a corner</span>
        )}
        {role === "keeper" && roundPhase === "commit" && (
          <span className="penalty-scene__badge">Your dive — pick a corner</span>
        )}
        {animating && shotOutcome === "goal" && (
          <span className="penalty-scene__badge penalty-scene__badge--goal">
            GOAL!
          </span>
        )}
        {animating && shotOutcome === "save" && (
          <span className="penalty-scene__badge penalty-scene__badge--save">
            SAVED!
          </span>
        )}
      </div>
    </div>
  );
}
