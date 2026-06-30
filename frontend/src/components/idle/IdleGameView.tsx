"use client";

import { useEffect, useState } from "react";
import { useIdleGame } from "@/hooks/useIdleGame";
import { useFirebaseSync } from "@/hooks/useFirebaseSync";
import { useT } from "@/components/i18n/LocaleProvider";
import { formatMsg } from "@/lib/i18n/format";
import type { PlayerProfile } from "@/lib/idleGame";
import { formatGold } from "@/lib/idleGame";
import type { WeaponId } from "@/lib/weapons";
import { BattleStage } from "./BattleStage";
import { BossIncomingBanner } from "./BossIncomingBanner";
import { ChestGrid } from "./ChestGrid";
import { CinematicBottomBar, type BottomTabId } from "./CinematicBottomBar";
import { CinematicTopHud } from "./CinematicTopHud";
import { DeathOverlay } from "./DeathOverlay";
import { EquipmentPanel } from "./EquipmentPanel";
import { EquipSuggestToast } from "./EquipSuggestToast";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { MergePanel } from "./MergePanel";
import { PetPanel } from "./PetPanel";

// v1: combat weapon is driven by the equipped weapon slot; the battle
// stage visual uses a single archetype for now.
const ACTIVE_WEAPON: WeaponId = "longsword";

interface IdleGameViewProps {
  profile: PlayerProfile;
  updateProfile: (fn: (p: PlayerProfile) => PlayerProfile) => void;
}

export function IdleGameView({ profile, updateProfile }: IdleGameViewProps) {
  const t = useT();
  const g = t.game;

  const [activeTab, setActiveTab] = useState<BottomTabId | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [showTabHint, setShowTabHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("umbral-tab-hint") === "1") return;
    sessionStorage.setItem("umbral-tab-hint", "1");
    setShowTabHint(true);
    const t = window.setTimeout(() => setShowTabHint(false), 12_000);
    return () => window.clearTimeout(t);
  }, []);

  const {
    profile: live,
    gps,
    displayEssence,
    attacking,
    levelFlash,
    popups,
    chestSpinning,
    lastChestReward,
    enemyKind,
    enemyName,
    currentChapter,
    chapterMax,
    chapterKills,
    killsPerChapter,
    stagePhase,
    bossIncoming,
    bossLockedFlash,
    killEventCounter,
    xpPct,
    bossDropFlash,
    shake,
    varekHp,
    varekMaxHp,
    varekDeathFlash,
    isDead,
    deathCooldownLabel,
    storedChests,
    gearItems,
    equippedSlots,
    effectiveStats,
    bloodstones,
    pets,
    equippedPets,
    isBerserk,
    berserkLabel,
    suggestItem,
    dismissSuggest,
    acceptSuggest,
    protectionScrolls,
    tryEnhance,
    buyProtectionScroll,
    claim,
    openStoredChest,
    mergeSelected,
    equipGear,
    unequipGear,
    quickEquipGear,
    equipPet,
    unequipPet,
    activateBerserker,
    instantRevive,
  } = useIdleGame(profile, updateProfile);

  const {
    enabled: leaderboardEnabled,
    leaderboard,
    leaderboardLoading,
    refreshLeaderboard,
  } = useFirebaseSync(live);

  const isBoss = enemyKind === "boss";
  const enemyHpPct = Math.max(0, (live.bossHp / live.bossMaxHp) * 100);
  const spawnPaused =
    bossIncoming ||
    stagePhase === "boss_incoming" ||
    stagePhase === "dead" ||
    currentChapter >= chapterMax;

  const toggleTab = (tab: BottomTabId) =>
    setActiveTab((prev) => (prev === tab ? null : tab));

  return (
    <div
      className={`sl-cinematic${levelFlash ? " sl-cinematic--flash" : ""}${varekDeathFlash ? " sl-cinematic--varek-death" : ""}${isDead ? " sl-cinematic--dead" : ""}${isBerserk ? " sl-cinematic--berserk" : ""}`}
    >
      {levelFlash && <div className="sl-level-burst" aria-hidden />}
      {bossDropFlash && <div className="sl-boss-drop-flash" aria-hidden />}

      <div className="sl-bloodstone-tag sl-glass" title={g.bloodstoneName}>
        🩸 {formatMsg(g.bloodstoneCount, { count: bloodstones })}
      </div>

      {leaderboardEnabled && (
        <button
          type="button"
          className="sl-leaderboard-btn sl-glass"
          onClick={() => setLeaderboardOpen(true)}
          title={g.leaderboardTitle ?? "Hunter Rankings"}
        >
          🏆 {g.leaderboardOpen ?? "Rankings"}
        </button>
      )}

      {bossLockedFlash && (
        <div className="sl-boss-locked-toast sl-glass" role="status">
          🔒 {g.bossLockedMsg}
        </div>
      )}

      {showTabHint && g.tabStayOpen && (
        <div className="sl-tab-hint sl-glass" role="status">
          {g.tabStayOpen}
        </div>
      )}

      <BossIncomingBanner visible={bossIncoming} />

      <CinematicTopHud
        level={live.level}
        xpPct={xpPct}
        currentChapter={currentChapter}
        chapterMax={chapterMax}
        chapterKills={chapterKills}
        killsPerChapter={killsPerChapter}
        essence={displayEssence}
        essencePerSec={gps}
        coin={live.walletCoin}
        enemyName={enemyName}
        isBoss={isBoss}
        enemyHpPct={enemyHpPct}
        varekHp={varekHp}
        varekMaxHp={varekMaxHp}
        varekDeathFlash={varekDeathFlash}
      />

      <div className="sl-cinematic__stage-wrap">
        <div className="sl-stage-shell">
          <BattleStage
            attacking={attacking}
            weaponId={ACTIVE_WEAPON}
            popups={popups}
            shake={shake}
            enemyKind={enemyKind}
            enemyName={enemyName}
            bossHp={live.bossHp}
            bossMaxHp={live.bossMaxHp}
            killEventCounter={killEventCounter}
            stagePhase={stagePhase}
            bossIncoming={bossIncoming}
            spawnPaused={spawnPaused}
          />
          <DeathOverlay
            visible={isDead}
            cooldownLabel={deathCooldownLabel}
            onInstantRevive={instantRevive}
          />
        </div>
      </div>

      {displayEssence >= 1 && (
        <div className="sl-cine-claim">
          <button
            type="button"
            className="sl-cine-claim__btn"
            onClick={claim}
          >
            {formatMsg(g.claim, { gold: formatGold(displayEssence) })}
          </button>
        </div>
      )}

      <CinematicBottomBar
        activeTab={activeTab}
        onTabChange={toggleTab}
        onBerserker={activateBerserker}
        chestSpinning={chestSpinning}
        chestCount={storedChests.length}
        pets={pets}
        equippedPets={equippedPets}
        isBerserk={isBerserk}
        berserkLabel={berserkLabel}
      />

      {activeTab === "chests" && (
        <div className="sl-cinematic__drawer sl-glass">
          <ChestGrid chests={storedChests} onOpenChest={openStoredChest} />
        </div>
      )}

      {activeTab === "inventory" && (
        <div className="sl-equip-modal-overlay" onClick={() => toggleTab("inventory")}>
          <div className="sl-equip-modal" onClick={(e) => e.stopPropagation()}>
            <EquipmentPanel
              gearItems={gearItems}
              equippedSlots={equippedSlots}
              baseStats={live.stats}
              effectiveStats={effectiveStats}
              onEquip={equipGear}
              onUnequip={unequipGear}
              onQuickEquip={quickEquipGear}
              onClose={() => toggleTab("inventory")}
              walletCoin={live.walletCoin}
              protectionScrolls={protectionScrolls}
              onEnhance={tryEnhance}
              onBuyScroll={buyProtectionScroll}
            />
          </div>
        </div>
      )}

      {activeTab === "merge" && (
        <div className="sl-cinematic__drawer sl-glass">
          <MergePanel items={gearItems} onMerge={mergeSelected} />
        </div>
      )}

      {activeTab === "pets" && (
        <div className="sl-cinematic__drawer sl-glass">
          <PetPanel
            pets={pets}
            equippedPets={equippedPets}
            onEquip={equipPet}
            onUnequip={unequipPet}
          />
        </div>
      )}

      {leaderboardOpen && (
        <div
          className="sl-leaderboard-overlay"
          onClick={() => setLeaderboardOpen(false)}
        >
          <div
            className="sl-leaderboard-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <LeaderboardPanel
              entries={leaderboard}
              loading={leaderboardLoading}
              selfWallet={live.walletAddress}
              onRefresh={refreshLeaderboard}
              onClose={() => setLeaderboardOpen(false)}
            />
          </div>
        </div>
      )}

      {suggestItem && (
        <EquipSuggestToast
          item={suggestItem}
          onEquip={acceptSuggest}
          onDismiss={dismissSuggest}
        />
      )}

      {bossDropFlash && lastChestReward && (
        <div className="sl-boss-drop-toast sl-glass" role="status">
          <span className="sl-boss-drop-toast__icon">🎁</span>
          <span className="sl-boss-drop-toast__text">
            {formatMsg(g.chestDropped, { reward: lastChestReward })}
          </span>
        </div>
      )}
    </div>
  );
}
