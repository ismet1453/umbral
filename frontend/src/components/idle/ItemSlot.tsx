"use client";

import type { GearItem } from "@/lib/lootSystem";
import {
  RARITY_FRAMES,
  SLOT_ITEM_ICONS,
  UI_ASSETS,
} from "@/lib/itemAssets";

export type ItemSlotVariant = "equip" | "inventory";

export interface ItemSlotProps {
  variant: ItemSlotVariant;
  item: GearItem | null;
  /** Drop target id: `equip:weapon` or `inv:3` */
  slotId: string;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  highlight?: boolean;
  dimmed?: boolean;
}

export function ItemSlot({
  variant,
  item,
  slotId,
  onClick,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  highlight = false,
  dimmed = false,
}: ItemSlotProps) {
  const isEquip = variant === "equip";
  const isEmpty = !item;
  const canInteract = !!item || !!onDrop;

  return (
    <button
      type="button"
      className={`sl-item-slot sl-item-slot--${variant}${
        item ? ` sl-item-slot--${item.rarity}` : ""
      }${isEmpty ? " sl-item-slot--empty" : ""}${
        highlight ? " sl-item-slot--highlight" : ""
      }${dimmed ? " sl-item-slot--dimmed" : ""}`}
      data-slot-id={slotId}
      onClick={onClick}
      draggable={draggable && !!item}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      title={item?.name}
      disabled={!canInteract}
    >
      <img
        className="sl-item-slot__frame"
        src={
          isEquip ? UI_ASSETS.equipSlotFrame : UI_ASSETS.inventoryCell
        }
        alt=""
        draggable={false}
      />
      {item && (
        <>
          {isEquip && (
            <img
              className="sl-item-slot__rarity"
              src={RARITY_FRAMES[item.rarity]}
              alt=""
              draggable={false}
            />
          )}
          <img
            className="sl-item-slot__icon"
            src={SLOT_ITEM_ICONS[item.slot]}
            alt=""
            draggable={false}
          />
          {item.enhance > 0 && (
            <span
              className={`sl-item-slot__plus${
                item.enhance >= 9
                  ? " sl-item-slot__plus--max"
                  : item.enhance >= 7
                    ? " sl-item-slot__plus--high"
                    : ""
              }`}
            >
              +{item.enhance}
            </span>
          )}
        </>
      )}
    </button>
  );
}

export type GearDragPayload =
  | { kind: "gear"; itemId: string; from: "inventory" }
  | { kind: "gear"; itemId: string; from: "equip"; slot: string };

export function parseGearDrag(e: React.DragEvent): GearDragPayload | null {
  try {
    const raw = e.dataTransfer.getData("application/x-umbral-gear");
    if (!raw) return null;
    return JSON.parse(raw) as GearDragPayload;
  } catch {
    return null;
  }
}

export function setGearDrag(
  e: React.DragEvent,
  payload: GearDragPayload
): void {
  e.dataTransfer.setData("application/x-umbral-gear", JSON.stringify(payload));
  e.dataTransfer.effectAllowed = "move";
}
