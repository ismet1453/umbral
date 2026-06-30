"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import type { ChestReward } from "@/hooks/useIdleGame";

interface ChestOpenModalProps {
  reward: ChestReward;
  onClose: () => void;
}

export function ChestOpenModal({ reward, onClose }: ChestOpenModalProps) {
  const g = useT().game;

  const rarityClass =
    reward.kind === "item"
      ? `sl-chest-modal--${reward.item.rarity}`
      : reward.kind === "pet"
        ? "sl-chest-modal--epic"
        : "sl-chest-modal--legendary";

  return (
    <div
      className="sl-chest-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`sl-chest-modal sl-glass ${rarityClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="sl-chest-modal__title">{g.chestOpened}</p>

        {reward.kind === "item" && (
          <>
            <div className="sl-chest-modal__item">
              <span className="sl-chest-modal__glow" aria-hidden />
              <p className="sl-chest-modal__name">{reward.item.name}</p>
              <p className="sl-chest-modal__rarity">
                {reward.item.rarity.toUpperCase()}
              </p>
            </div>
            <p className="sl-chest-modal__hint">{g.chestEquipped}</p>
          </>
        )}

        {reward.kind === "pet" && (
          <>
            <div className="sl-chest-modal__item">
              <span className="sl-chest-modal__glow" aria-hidden />
              <p className="sl-chest-modal__emoji">{reward.pet.emoji}</p>
              <p className="sl-chest-modal__name">{reward.pet.name}</p>
            </div>
            <p className="sl-chest-modal__hint">{g.petFound}</p>
          </>
        )}

        {reward.kind === "bloodstone" && (
          <>
            <div className="sl-chest-modal__item">
              <span className="sl-chest-modal__glow" aria-hidden />
              <p className="sl-chest-modal__emoji">🩸</p>
              <p className="sl-chest-modal__name">{g.bloodstoneName}</p>
            </div>
            <p className="sl-chest-modal__hint">{g.bloodstoneFound}</p>
          </>
        )}

        <button type="button" className="sl-chest-modal__btn" onClick={onClose}>
          {g.modalClose}
        </button>
      </div>
    </div>
  );
}
