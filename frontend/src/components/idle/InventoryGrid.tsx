"use client";

import { useMemo, useState } from "react";
import { INVENTORY_CAPACITY, type GearSlot } from "@/lib/equipmentSystem";
import type { GearItem } from "@/lib/lootSystem";
import { ItemSlot, parseGearDrag, setGearDrag } from "./ItemSlot";

interface InventoryGridProps {
  items: GearItem[];
  emptyLabel: string;
  onQuickEquip: (itemId: string) => void;
  /** Called when an equipped item is dropped onto the bag (→ unequip). */
  onDropFromEquip: (slot: GearSlot) => void;
}

const PAGE_SIZE = INVENTORY_CAPACITY; // 24 → 6 cols × 4 rows

export function InventoryGrid({
  items,
  emptyLabel,
  onQuickEquip,
  onDropFromEquip,
}: InventoryGridProps) {
  const [page, setPage] = useState(0);

  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const pageItems = useMemo(
    () => items.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [items, safePage]
  );

  const allowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const payload = parseGearDrag(e);
    if (!payload || payload.kind !== "gear") return;
    if (payload.from === "equip") onDropFromEquip(payload.slot as GearSlot);
  };

  // Fixed 24 cells: items first, empty fillers after.
  const cells = Array.from({ length: PAGE_SIZE }, (_, i) => pageItems[i] ?? null);

  return (
    <div className="sl-invgrid" onDragOver={allowDragOver} onDrop={handleDrop}>
      {items.length === 0 && (
        <p className="sl-invgrid__empty">{emptyLabel}</p>
      )}

      <div className="sl-invgrid__grid">
        {cells.map((item, i) => (
          <div key={item?.id ?? `empty-${i}`} className="sl-invgrid__cell">
            <ItemSlot
              variant="inventory"
              item={item}
              slotId={item ? `inv:${item.id}` : `inv-empty:${i}`}
              draggable={!!item}
              onClick={item ? () => onQuickEquip(item.id) : undefined}
              onDragStart={
                item
                  ? (e) =>
                      setGearDrag(e, {
                        kind: "gear",
                        itemId: item.id,
                        from: "inventory",
                      })
                  : undefined
              }
            />
            {item && (
              <span
                className={`sl-invgrid__rarity sl-invgrid__rarity--${item.rarity}`}
              >
                {item.name.split("·")[0]?.trim()}
              </span>
            )}
          </div>
        ))}
      </div>

      {pages > 1 && (
        <div className="sl-invgrid__pagination">
          <button
            type="button"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ‹
          </button>
          <span>
            {safePage + 1} / {pages}
          </span>
          <button
            type="button"
            disabled={safePage >= pages - 1}
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
