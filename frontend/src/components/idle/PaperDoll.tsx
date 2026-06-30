"use client";

import { useState } from "react";
import {
  canEquipToSlot,
  EQUIP_SLOT_LAYOUT,
  getItemInSlot,
  type GearSlot,
} from "@/lib/equipmentSystem";
import type { GearItem } from "@/lib/lootSystem";
import { ItemSlot, parseGearDrag, setGearDrag } from "./ItemSlot";

interface PaperDollProps {
  gearItems: GearItem[];
  equippedSlots: Record<GearSlot, string | null>;
  onEquip: (itemId: string, slot: GearSlot) => void;
  onUnequip: (slot: GearSlot) => void;
}

/** Slot → CSS grid-area (Metin2-style paper doll layout). */
const SLOT_AREA: Record<GearSlot, string> = {
  helm: "helm",
  weapon: "weapon",
  armor: "armor",
  gauntlet: "gauntlet",
  ring: "ring",
  talisman: "talisman",
};

export function PaperDoll({
  gearItems,
  equippedSlots,
  onEquip,
  onUnequip,
}: PaperDollProps) {
  const [dragOverSlot, setDragOverSlot] = useState<GearSlot | null>(null);

  const profileSlice = { gearItems, equippedSlots };

  const allowDragOver = (slot: GearSlot) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSlot(slot);
  };

  const handleDrop = (slot: GearSlot) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSlot(null);
    const payload = parseGearDrag(e);
    if (!payload || payload.kind !== "gear") return;
    const item = gearItems.find((i) => i.id === payload.itemId);
    if (!item || !canEquipToSlot(item, slot)) return;
    onEquip(payload.itemId, slot);
  };

  return (
    <div className="sl-paperdoll">
      <div className="sl-paperdoll__grid">
        {EQUIP_SLOT_LAYOUT.map((slot) => {
          const item = getItemInSlot(profileSlice, slot);
          const slotId = `equip:${slot}`;
          return (
            <div
              key={slot}
              className="sl-paperdoll__cell"
              style={{ gridArea: SLOT_AREA[slot] }}
            >
              <span className="sl-paperdoll__label">{slot.toUpperCase()}</span>
              <ItemSlot
                variant="equip"
                item={item}
                slotId={slotId}
                draggable={!!item}
                highlight={dragOverSlot === slot}
                onClick={() => {
                  if (item) onUnequip(slot);
                }}
                onDragStart={
                  item
                    ? (e) =>
                        setGearDrag(e, {
                          kind: "gear",
                          itemId: item.id,
                          from: "equip",
                          slot,
                        })
                    : undefined
                }
                onDragOver={allowDragOver(slot)}
                onDrop={handleDrop(slot)}
              />
              {item && (
                <span className="sl-paperdoll__name">
                  {item.name.split("·")[0]?.trim()}
                </span>
              )}
            </div>
          );
        })}

        {/* Center silhouette */}
        <div className="sl-paperdoll__hero" style={{ gridArea: "varek" }}>
          <span className="sl-paperdoll__hero-name">VAREK</span>
        </div>
      </div>
    </div>
  );
}
