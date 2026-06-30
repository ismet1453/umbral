"use client";

import { useEffect, useState } from "react";
import { GateAtmosphere } from "./GateAtmosphere";
import { INTRO_TIMINGS, LOADING_STATUS_LINES } from "@/lib/introFlow";

interface CatacombsLoaderProps {
  collapsing: boolean;
  active?: boolean;
}

export function CatacombsLoader({ collapsing, active = true }: CatacombsLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(100, (elapsed / INTRO_TIMINGS.loadingMs) * 100));
    }, 50);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const interval = INTRO_TIMINGS.loadingMs / LOADING_STATUS_LINES.length;
    const id = setInterval(() => {
      setStatusIdx((i) => (i + 1) % LOADING_STATUS_LINES.length);
    }, interval);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div
      className={`intro-catacombs${collapsing ? " intro-catacombs--collapse" : ""}`}
    >
      <GateAtmosphere />
      <div className="intro-catacombs__mist intro-catacombs__mist--a" aria-hidden />
      <div className="intro-catacombs__mist intro-catacombs__mist--b" aria-hidden />
      <div className="intro-catacombs__vignette intro-catacombs__vignette--tl" aria-hidden />
      <div className="intro-catacombs__vignette intro-catacombs__vignette--br" aria-hidden />

      <div className="intro-catacombs__center">
        <div className="intro-catacombs__ring" aria-hidden>
          <div className="intro-catacombs__core">
            <div className="intro-catacombs__core-slash" aria-hidden />
          </div>
        </div>
        <div className="intro-catacombs__bar-track">
          <div
            className="intro-catacombs__bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p
          key={statusIdx}
          className="intro-catacombs__label intro-catacombs__label--cycle"
        >
          {LOADING_STATUS_LINES[statusIdx]}
        </p>
        <p className="intro-catacombs__pct">{Math.floor(progress)}%</p>
      </div>
    </div>
  );
}
