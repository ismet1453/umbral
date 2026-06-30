"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { formatMsg } from "@/lib/i18n/format";
import { formatGold } from "@/lib/idleGame";
import {
  MAX_ENHANCE,
  PROTECTION_SCROLL_COST,
  canEnhance,
  enhanceCoinCost,
  successRatePercent,
  type EnhanceOutcome,
} from "@/lib/enhanceSystem";
import type { GearItem } from "@/lib/lootSystem";
import { ItemSlot } from "./ItemSlot";

interface EnhancePanelProps {
  gearItems: GearItem[];
  walletCoin: number;
  protectionScrolls: number;
  onEnhance: (
    itemId: string,
    useScroll: boolean
  ) => EnhanceOutcome | { error: string };
  onBuyScroll: () => string | null;
}

export function EnhancePanel({
  gearItems,
  walletCoin,
  protectionScrolls,
  onEnhance,
  onBuyScroll,
}: EnhancePanelProps) {
  const g = useT().game;
  const [selectedId, setSelectedId] = useState<string | null>(
    gearItems[0]?.id ?? null
  );
  const [useScroll, setUseScroll] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<EnhanceOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = gearItems.find((i) => i.id === selectedId) ?? null;
  const cost = selected ? enhanceCoinCost(selected.enhance) : 0;
  const rate = selected ? successRatePercent(selected.enhance) : 0;
  const atMax = selected ? !canEnhance(selected) : true;

  const handleEnhance = () => {
    if (!selectedId) return;
    setError(null);
    const result = onEnhance(selectedId, useScroll);
    if (typeof result === "object" && "error" in result) {
      setError(result.error);
      return;
    }
    setLastOutcome(result);
    setTimeout(() => setLastOutcome(null), 2800);
    if (result === "break") setSelectedId(null);
  };

  const handleBuyScroll = () => {
    setError(null);
    const err = onBuyScroll();
    if (err) setError(err);
  };

  const outcomeLabel: Record<EnhanceOutcome, string> = {
    success: g.enhanceSuccess ?? "SUCCESS!",
    fail: g.enhanceFail ?? "FAILED",
    break: g.enhanceBreak ?? "BROKEN!",
  };

  const outcomeClass: Record<EnhanceOutcome, string> = {
    success: "sl-enhance__result--success",
    fail: "sl-enhance__result--fail",
    break: "sl-enhance__result--break",
  };

  return (
    <div className="sl-enhance">
      {gearItems.length === 0 ? (
        <p className="sl-enhance__empty">{g.enhanceNoItems ?? "No items to enhance"}</p>
      ) : (
        <>
          <div className="sl-enhance__picker">
            {gearItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sl-enhance__pick${
                  item.id === selectedId ? " sl-enhance__pick--active" : ""
                }`}
                onClick={() => setSelectedId(item.id)}
              >
                <ItemSlot variant="inventory" item={item} slotId={`enh:${item.id}`} />
              </button>
            ))}
          </div>

          {selected && (
            <div className="sl-enhance__info">
              <p className="sl-enhance__name">{selected.name.split("·")[0]?.trim()}</p>
              <p className="sl-enhance__level">
                {formatMsg(g.enhanceCurrent ?? "+{n} / +{max}", {
                  n: selected.enhance,
                  max: MAX_ENHANCE,
                })}
              </p>
              {!atMax && (
                <>
                  <p className="sl-enhance__rate">
                    {formatMsg(g.enhanceRate ?? "Success: {rate}%", { rate })}
                  </p>
                  <p className="sl-enhance__cost">
                    {formatMsg(g.enhanceCost ?? "Cost: {cost} Coin", {
                      cost: formatGold(cost),
                    })}
                  </p>
                </>
              )}
            </div>
          )}

          <label className="sl-enhance__scroll">
            <input
              type="checkbox"
              checked={useScroll}
              onChange={(e) => setUseScroll(e.target.checked)}
              disabled={protectionScrolls < 1}
            />
            {formatMsg(g.enhanceUseScroll ?? "Protection Scroll ({count})", {
              count: protectionScrolls,
            })}
          </label>

          <div className="sl-enhance__actions">
            <button
              type="button"
              className="sl-enhance__btn sl-enhance__btn--enhance"
              onClick={handleEnhance}
              disabled={!selected || atMax || walletCoin < cost}
            >
              {g.enhanceButton ?? "+ ENHANCE"}
            </button>
            <button
              type="button"
              className="sl-enhance__btn sl-enhance__btn--buy"
              onClick={handleBuyScroll}
              disabled={walletCoin < PROTECTION_SCROLL_COST}
            >
              {formatMsg(g.enhanceBuyScroll ?? "Buy Scroll · {cost}", {
                cost: formatGold(PROTECTION_SCROLL_COST),
              })}
            </button>
          </div>

          {lastOutcome && (
            <p className={`sl-enhance__result ${outcomeClass[lastOutcome]}`}>
              {outcomeLabel[lastOutcome]}
            </p>
          )}
          {error && <p className="sl-enhance__error">{error}</p>}
        </>
      )}
    </div>
  );
}
