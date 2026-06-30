"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import { formatMsg } from "@/lib/i18n/format";
import { PET_SLOTS, type Pet } from "@/lib/petSystem";

export type BottomTabId = "inventory" | "chests" | "merge" | "pets";

interface CinematicBottomBarProps {
  activeTab: BottomTabId | null;
  onTabChange: (tab: BottomTabId) => void;
  onBerserker: () => void;
  chestSpinning?: boolean;
  chestCount?: number;
  pets: Pet[];
  equippedPets: (string | null)[];
  isBerserk: boolean;
  berserkLabel: string;
}

export function CinematicBottomBar({
  activeTab,
  onTabChange,
  onBerserker,
  chestSpinning = false,
  chestCount = 0,
  pets,
  equippedPets,
  isBerserk,
  berserkLabel,
}: CinematicBottomBarProps) {
  const g = useT().game;

  const tabs: { id: BottomTabId; label: string; icon: string }[] = [
    { id: "inventory", label: g.tabInventory, icon: "⚔" },
    { id: "chests", label: g.tabChests, icon: "📦" },
    { id: "merge", label: g.tabMerge, icon: "⚒" },
    { id: "pets", label: g.tabPets, icon: "🐾" },
  ];

  return (
    <footer className="sl-cine-bottom sl-glass">
      {/* Tab nav */}
      <nav className="sl-cine-bottom__tabs" aria-label={g.bottomBarAria}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`sl-cine-bottom__tab${activeTab === tab.id ? " sl-cine-bottom__tab--active" : ""}${tab.id === "chests" && chestSpinning ? " sl-cine-bottom__tab--spin" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="sl-cine-bottom__tab-icon" aria-hidden>
              {tab.icon}
            </span>
            <span className="sl-cine-bottom__tab-label">{tab.label}</span>
            {tab.id === "chests" && chestCount > 0 && (
              <span className="sl-cine-bottom__tab-badge">{chestCount}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Pet slots (live) */}
      <div className="sl-cine-bottom__pets" aria-label={g.tabPets}>
        {Array.from({ length: PET_SLOTS }, (_, i) => {
          const petId = equippedPets[i];
          const pet = petId ? pets.find((p) => p.id === petId) : null;
          return (
            <button
              key={i}
              type="button"
              className={`sl-cine-bottom__pet-slot${pet ? " sl-cine-bottom__pet-slot--filled" : ""}`}
              title={pet ? pet.name : g.petSlotEmpty}
              onClick={() => onTabChange("pets")}
            >
              {pet ? (
                <span aria-hidden>{pet.emoji}</span>
              ) : (
                <span className="sl-cine-bottom__pet-plus">+</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Berserker ability button */}
      <button
        type="button"
        className={`sl-cine-bottom__berserker${isBerserk ? " sl-cine-bottom__berserker--active" : ""}`}
        onClick={onBerserker}
        disabled={isBerserk}
      >
        {isBerserk
          ? formatMsg(g.berserkActive, { time: berserkLabel })
          : g.berserkReady}
      </button>
    </footer>
  );
}
