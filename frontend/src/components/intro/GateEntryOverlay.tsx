"use client";

import { GateAtmosphere } from "./GateAtmosphere";

interface GateEntryOverlayProps {
  onEnter: () => void;
}

export function GateEntryOverlay({ onEnter }: GateEntryOverlayProps) {
  return (
    <div className="gate-entry">
      <GateAtmosphere intense />
      <div className="gate-entry__vignette" aria-hidden />
      <div className="gate-entry__content">
        <p className="gate-entry__eyebrow">Shadow Monarch Protocol</p>
        <h1 className="gate-entry__title">UMBRAL</h1>
        <p className="gate-entry__subtitle">
          The gate is sealed. Only awakened hunters may pass.
        </p>
        <button type="button" className="gate-entry__btn" onClick={onEnter}>
          <span className="gate-entry__btn-glow" aria-hidden />
          ENTER THE GATE
        </button>
        <p className="gate-entry__hint">Audio unlocks on entry</p>
      </div>
    </div>
  );
}
