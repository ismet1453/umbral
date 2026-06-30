"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import type { StoredChest } from "@/lib/lootSystem";
import type { ChestReward } from "@/hooks/useIdleGame";
import { ChestOpenModal } from "./ChestOpenModal";

interface ChestGridProps {
  chests: StoredChest[];
  onOpenChest: (chestId: string) => ChestReward | null;
}

export function ChestGrid({ chests, onOpenChest }: ChestGridProps) {
  const g = useT().game;
  const [modalReward, setModalReward] = useState<ChestReward | null>(null);

  const handleClick = (chestId: string) => {
    const reward = onOpenChest(chestId);
    if (reward) setModalReward(reward);
  };

  return (
    <>
      <div className="sl-chest-grid">
        <p className="sl-chest-grid__title">{g.tabChests}</p>
        {chests.length === 0 ? (
          <p className="sl-chest-grid__empty">{g.chestGridEmpty}</p>
        ) : (
          <div className="sl-chest-grid__list">
            {chests.map((chest) => (
              <button
                key={chest.id}
                type="button"
                className={`sl-chest-slot sl-chest-slot--${chest.type}`}
                onClick={() => handleClick(chest.id)}
                title={
                  chest.type === "boss" ? g.chestBossName : g.chestCommonName
                }
              >
                <span className="sl-chest-slot__icon" aria-hidden>
                  {chest.type === "boss" ? "👑" : "📦"}
                </span>
                <span className="sl-chest-slot__label">
                  {chest.type === "boss"
                    ? g.chestBossName
                    : g.chestCommonName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {modalReward && (
        <ChestOpenModal
          reward={modalReward}
          onClose={() => setModalReward(null)}
        />
      )}
    </>
  );
}
