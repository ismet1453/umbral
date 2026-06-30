"use client";

import { useT } from "@/components/i18n/LocaleProvider";
import { PET_SLOTS, type Pet } from "@/lib/petSystem";

interface PetPanelProps {
  pets: Pet[];
  equippedPets: (string | null)[];
  onEquip: (petId: string, slot: number) => void;
  onUnequip: (slot: number) => void;
}

function petEffectLabel(pet: Pet): string {
  if (pet.kind === "xp_gain") return `+${pet.value}% XP/Gold`;
  if (pet.kind === "crit_chance") return `+${pet.value}% Crit`;
  return `+${pet.value} STR`;
}

export function PetPanel({
  pets,
  equippedPets,
  onEquip,
  onUnequip,
}: PetPanelProps) {
  const g = useT().game;

  const firstEmptySlot = equippedPets.findIndex((p) => p === null);
  const ownedNotEquipped = pets.filter((p) => !equippedPets.includes(p.id));

  return (
    <div className="sl-pet-panel">
      <p className="sl-pet-panel__title">{g.petTitle}</p>

      <div className="sl-pet-panel__slots">
        {Array.from({ length: PET_SLOTS }, (_, slot) => {
          const petId = equippedPets[slot];
          const pet = petId ? pets.find((p) => p.id === petId) : null;
          return (
            <div
              key={slot}
              className={`sl-pet-slot${pet ? " sl-pet-slot--filled" : ""}`}
            >
              {pet ? (
                <>
                  <span className="sl-pet-slot__emoji" aria-hidden>
                    {pet.emoji}
                  </span>
                  <span className="sl-pet-slot__name">{pet.name}</span>
                  <span className="sl-pet-slot__effect">
                    {petEffectLabel(pet)}
                  </span>
                  <button
                    type="button"
                    className="sl-pet-slot__remove"
                    onClick={() => onUnequip(slot)}
                    aria-label={g.petUnequip}
                  >
                    ×
                  </button>
                </>
              ) : (
                <span className="sl-pet-slot__empty">{g.petSlotLabel}</span>
              )}
            </div>
          );
        })}
      </div>

      {ownedNotEquipped.length === 0 ? (
        <p className="sl-pet-panel__empty">{g.petOwnedEmpty}</p>
      ) : (
        <ul className="sl-pet-panel__owned">
          {ownedNotEquipped.map((pet) => (
            <li key={pet.id} className="sl-pet-owned">
              <span className="sl-pet-owned__emoji" aria-hidden>
                {pet.emoji}
              </span>
              <span className="sl-pet-owned__info">
                <span className="sl-pet-owned__name">{pet.name}</span>
                <span className="sl-pet-owned__effect">
                  {petEffectLabel(pet)}
                </span>
              </span>
              <button
                type="button"
                className="sl-pet-owned__equip"
                onClick={() => onEquip(pet.id, firstEmptySlot)}
                disabled={firstEmptySlot === -1}
              >
                {g.petEquip}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
