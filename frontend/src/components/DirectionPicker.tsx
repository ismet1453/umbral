"use client";

import { useState } from "react";
import type { Direction } from "@/lib/types";

const LABELS: Record<Direction, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
};

const ICONS: Record<Direction, string> = {
  left: "◤",
  center: "▲",
  right: "◥",
};

interface DirectionPickerProps {
  disabled?: boolean;
  loading?: boolean;
  overlay?: boolean;
  onPick: (direction: Direction) => void;
}

export function DirectionPicker({
  disabled,
  loading,
  onPick,
}: DirectionPickerProps) {
  const [selected, setSelected] = useState<Direction | null>(null);

  const handle = (d: Direction) => {
    setSelected(d);
    onPick(d);
  };

  return (
    <div className="esports-picker">
      {(Object.keys(LABELS) as Direction[]).map((direction) => {
        const isActive = selected === direction;
        return (
          <button
            key={direction}
            type="button"
            disabled={disabled || loading}
            onClick={() => handle(direction)}
            className={`esports-btn esports-btn--${direction}${isActive ? " esports-btn--active" : ""}`}
            data-text={LABELS[direction].toUpperCase()}
          >
            <span className="esports-btn__icon">{ICONS[direction]}</span>
            <span className="esports-btn__label">{LABELS[direction]}</span>
            <span className="esports-btn__glitch" aria-hidden>
              {LABELS[direction]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
