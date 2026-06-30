"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import { CHARACTERS, type PlayerProfile } from "@/lib/idleGame";

interface ItemsPanelProps {
  profile: PlayerProfile;
}

export function ItemsPanel({ profile }: ItemsPanelProps) {
  const t = useT();
  const g = t.game;
  const copy = t.characters.varek;
  const char = CHARACTERS.varek;

  return (
    <div className="um-panel um-panel--items">
      <p className="um-panel__lead">{g.itemsLead}</p>
      <div className="um-varek-card sl-glass">
        <div
          className="um-varek-card__portrait"
          style={{ backgroundImage: "url(/characters/varek.png)" }}
          aria-hidden
        />
        <div className="um-varek-card__body">
          <p className="um-varek-card__name">{char.name}</p>
          <p className="um-varek-card__subtitle">{copy.subtitle}</p>
          <p className="um-varek-card__role">{copy.role}</p>
          <p className="um-varek-card__focus">{copy.focus}</p>
          <p className="um-varek-card__level">
            Lv {profile.level} / 99
          </p>
        </div>
      </div>
    </div>
  );
}
