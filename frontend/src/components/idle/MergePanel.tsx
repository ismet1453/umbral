"use client";

import { useMemo, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { formatMsg } from "@/lib/i18n/format";
import {
  countByRarity,
  MERGE_REQUIRED,
  RARITY_LABEL,
  RARITY_ORDER,
  type GearItem,
  type ItemRarity,
} from "@/lib/lootSystem";

interface MergePanelProps {
  items: GearItem[];
  onMerge: (itemIds: string[]) => GearItem | null;
}

export function MergePanel({ items, onMerge }: MergePanelProps) {
  const g = useT().game;
  const [selected, setSelected] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<GearItem | null>(null);

  const counts = useMemo(() => countByRarity(items), [items]);

  // rarity locked to first picked item
  const lockedRarity: ItemRarity | null = useMemo(() => {
    if (selected.length === 0) return null;
    const first = items.find((i) => i.id === selected[0]);
    return first?.rarity ?? null;
  }, [selected, items]);

  // legendary cannot merge upward
  const mergeable = items.filter((i) => i.rarity !== "legendary");

  const toggle = (item: GearItem) => {
    setSelected((prev) => {
      if (prev.includes(item.id)) return prev.filter((id) => id !== item.id);
      if (lockedRarity && item.rarity !== lockedRarity) return prev;
      if (prev.length >= MERGE_REQUIRED) return prev;
      return [...prev, item.id];
    });
  };

  const canMerge = selected.length === MERGE_REQUIRED;

  const doMerge = () => {
    const result = onMerge(selected);
    if (result) {
      setLastResult(result);
      setSelected([]);
    }
  };

  return (
    <div className="sl-merge-panel">
      <p className="sl-merge-panel__title">{g.mergeTitle}</p>
      <p className="sl-merge-panel__hint">{g.mergeHint}</p>

      <div className="sl-merge-panel__counts">
        {RARITY_ORDER.map((r) => (
          <span
            key={r}
            className={`sl-merge-count sl-merge-count--${r}`}
            title={RARITY_LABEL[r]}
          >
            {RARITY_LABEL[r]} ×{counts[r]}
          </span>
        ))}
      </div>

      {mergeable.length === 0 ? (
        <p className="sl-merge-panel__empty">{g.mergeEmpty}</p>
      ) : (
        <ul className="sl-merge-panel__list">
          {mergeable.map((item) => {
            const isSel = selected.includes(item.id);
            const disabled =
              !isSel &&
              ((lockedRarity !== null && item.rarity !== lockedRarity) ||
                selected.length >= MERGE_REQUIRED);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`sl-merge-item sl-merge-item--${item.rarity}${
                    isSel ? " sl-merge-item--selected" : ""
                  }`}
                  onClick={() => toggle(item)}
                  disabled={disabled}
                >
                  <span className="sl-merge-item__name">{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="sl-merge-panel__footer">
        <span className="sl-merge-panel__status">
          {lockedRarity
            ? formatMsg(g.mergeNeed, {
                rarity: RARITY_LABEL[lockedRarity],
                count: selected.length,
              })
            : formatMsg(g.mergeNeed, { rarity: "—", count: 0 })}
        </span>
        <button
          type="button"
          className="sl-merge-panel__btn"
          onClick={doMerge}
          disabled={!canMerge}
        >
          {g.mergeButton}
        </button>
      </div>

      {lastResult && (
        <div
          className={`sl-merge-panel__result sl-merge-item--${lastResult.rarity}`}
          role="status"
        >
          ✨ {g.mergeResult} — {lastResult.name}
        </div>
      )}
    </div>
  );
}
