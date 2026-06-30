"use client";

import { useT } from "@/components/i18n/LocaleProvider";

interface DeathOverlayProps {
  visible: boolean;
  cooldownLabel: string;
  onInstantRevive: () => void;
}

export function DeathOverlay({
  visible,
  cooldownLabel,
  onInstantRevive,
}: DeathOverlayProps) {
  const g = useT().game;
  if (!visible) return null;

  return (
    <div className="sl-death-overlay" role="alertdialog" aria-labelledby="death-title">
      <div className="sl-death-overlay__panel sl-glass">
        <p id="death-title" className="sl-death-overlay__title">{g.deathTitle}</p>
        <p className="sl-death-overlay__sub">{g.deathSub}</p>
        <div className="sl-death-overlay__timer" aria-live="polite">
          {cooldownLabel}
        </div>
        <button
          type="button"
          className="sl-death-overlay__revive"
          onClick={onInstantRevive}
        >
          {g.instantRevive}
        </button>
      </div>
    </div>
  );
}
