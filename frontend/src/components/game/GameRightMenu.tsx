"use client";

import { useT } from "@/components/i18n/LocaleProvider";

export type GamePanelId = "trade" | "map" | "items" | "settings";

interface GameRightMenuProps {
  active: GamePanelId | null;
  onSelect: (id: GamePanelId) => void;
}

export function GameRightMenu({ active, onSelect }: GameRightMenuProps) {
  const t = useT().game;

  const items: {
    id: GamePanelId;
    label: string;
    short: string;
    icon: string;
  }[] = [
    { id: "trade", label: t.menuTrade, short: t.menuTradeShort, icon: "⚖" },
    { id: "map", label: t.menuMap, short: t.menuMapShort, icon: "🗺" },
    { id: "items", label: t.menuItems, short: t.menuItemsShort, icon: "⚔" },
    { id: "settings", label: t.menuSettings, short: t.menuSettingsShort, icon: "⚙" },
  ];

  return (
    <nav className="um-rail" aria-label={t.menuAria}>
      <ul className="um-rail__list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`um-rail__btn${active === item.id ? " um-rail__btn--active" : ""}`}
              onClick={() => onSelect(item.id)}
              title={item.label}
            >
              <span className="um-rail__icon" aria-hidden>
                {item.icon}
              </span>
              <span className="um-rail__text">{item.short}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
