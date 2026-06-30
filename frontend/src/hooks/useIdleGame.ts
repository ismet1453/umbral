"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  accrueOnline,
  applyMobKillRewards,
  applyOfflineAccrual,
  applyStageBossKillRewards,
  applyStatBonus,
  CHARACTERS,
  COMMON_CHEST_COST,
  critChancePercent,
  goldPerSecond,
  purchaseCharacter,
  rollChestReward,
  rollCombatDamage,
  spawnNextMob,
  spawnStageBoss,
  xpForLevel,
  type CharacterId,
  type EnemyKind,
  type PlayerProfile,
} from "@/lib/idleGame";
import {
  applyEquippedItems,
  BLOODSTONE_DROP_CHANCE,
  createChestId,
  mergeItems,
  MERGE_REQUIRED,
  rollLootItem,
  type GearItem,
  type StoredChest,
} from "@/lib/lootSystem";
import {
  equipItem,
  getEquippedGear,
  getItemInSlot,
  getWeaponCombatProfile,
  quickEquip,
  unequipSlot,
  type GearSlot,
} from "@/lib/equipmentSystem";
import {
  applyPetStats,
  computePetEffects,
  PET_DROP_CHANCE,
  rollPet,
  type Pet,
  type PetEffects,
} from "@/lib/petSystem";
import {
  advanceChapterOnMobKill,
  BERSERK_DURATION_MS,
  BERSERK_SPEED_MULT,
  BERSERK_STR_MULT,
  BOSS_INCOMING_DELAY_MS,
  BOSS_LOCKED_FALLBACK_CHAPTER,
  BOSS_LOOT_CHANCE,
  CHAPTER_MAX,
  DEATH_COOLDOWN_MS,
  formatCooldownMs,
  KILLS_PER_CHAPTER,
  resetStageAfterBoss,
  type StagePhase,
} from "@/lib/stageSystem";
import { useLootTimer } from "@/hooks/useLootTimer";
import { shouldSuggest } from "@/lib/suggestEquip";
import {
  applyEnhanceAttempt,
  buyProtectionScroll as buyScroll,
  type EnhanceOutcome,
} from "@/lib/enhanceSystem";

export interface DamagePopup {
  id: number;
  amount: number;
  crit: boolean;
  offsetX: number;
}

export type ChestReward =
  | { kind: "item"; item: GearItem }
  | { kind: "pet"; pet: Pet }
  | { kind: "bloodstone" };

interface UseIdleGameResult {
  profile: PlayerProfile;
  gps: number;
  ccPercent: number;
  displayEssence: number;
  attacking: boolean;
  bossHit: boolean;
  levelFlash: boolean;
  popups: DamagePopup[];
  slashVisible: boolean;
  chestSpinning: boolean;
  lastChestReward: string | null;
  selectedChar: (typeof CHARACTERS)[CharacterId];
  enemyKind: EnemyKind;
  enemyName: string;
  killsThisCycle: number;
  currentChapter: number;
  chapterKills: number;
  chapterMax: number;
  killsPerChapter: number;
  stagePhase: StagePhase;
  bossIncoming: boolean;
  bossLockedFlash: boolean;
  killEventCounter: number;
  xp: number;
  xpToNext: number;
  xpPct: number;
  bossDropFlash: boolean;
  shake: boolean;
  varekHp: number;
  varekMaxHp: number;
  varekDeathFlash: boolean;
  isDead: boolean;
  deathCooldownMs: number;
  deathCooldownLabel: string;
  storedChests: StoredChest[];
  gearItems: GearItem[];
  equippedSlots: Record<GearSlot, string | null>;
  effectiveStats: PlayerProfile["stats"];
  bloodstones: number;
  pets: Pet[];
  equippedPets: (string | null)[];
  petEffects: PetEffects;
  isBerserk: boolean;
  berserkMsLeft: number;
  berserkLabel: string;
  suggestItem: GearItem | null;
  dismissSuggest: () => void;
  acceptSuggest: () => void;
  protectionScrolls: number;
  tryEnhance: (
    itemId: string,
    useScroll: boolean
  ) => EnhanceOutcome | { error: string };
  buyProtectionScroll: () => string | null;
  claim: () => void;
  selectCharacter: (id: CharacterId) => void;
  buyCharacter: (id: CharacterId) => string | null;
  openCommonChest: () => string | null;
  openBossChest: () => string | null;
  openStoredChest: (chestId: string) => ChestReward | null;
  mergeSelected: (itemIds: string[]) => GearItem | null;
  equipGear: (itemId: string, slot: GearSlot) => void;
  unequipGear: (slot: GearSlot) => void;
  quickEquipGear: (itemId: string) => void;
  equipPet: (petId: string, slot: number) => void;
  unequipPet: (slot: number) => void;
  activateBerserker: () => void;
  instantRevive: () => void;
}

function calcVarekMaxHp(level: number, str: number, defBonus: number): number {
  return 500 + level * 80 + str * 8 + defBonus * 10;
}

function deriveEffectiveStats(
  profile: PlayerProfile,
  petEffects: PetEffects,
  berserk: boolean
): PlayerProfile["stats"] {
  const itemStats = applyEquippedItems(
    profile.stats,
    getEquippedGear(profile)
  );
  const withPets = applyPetStats(itemStats, petEffects);
  if (!berserk) return withPets;
  return { ...withPets, str: Math.round(withPets.str * BERSERK_STR_MULT) };
}

export function useIdleGame(
  profile: PlayerProfile,
  updateProfile: (fn: (p: PlayerProfile) => PlayerProfile) => void
): UseIdleGameResult {
  const weapon = getWeaponCombatProfile(getItemInSlot(profile, "weapon"));

  const [displayEssence, setDisplayEssence] = useState(profile.pendingEssence);
  const [attacking, setAttacking] = useState(false);
  const [bossHit, setBossHit] = useState(false);
  const [levelFlash, setLevelFlash] = useState(false);
  const [slashVisible, setSlashVisible] = useState(false);
  const [popups, setPopups] = useState<DamagePopup[]>([]);
  const [chestSpinning, setChestSpinning] = useState(false);
  const [lastChestReward, setLastChestReward] = useState<string | null>(null);
  const [bossDropFlash, setBossDropFlash] = useState(false);
  const [bossLockedFlash, setBossLockedFlash] = useState(false);
  const [shake, setShake] = useState(false);
  const [varekDeathFlash, setVarekDeathFlash] = useState(false);
  const [stagePhase, setStagePhase] = useState<StagePhase>(() => {
    if (profile.deathCooldownUntil && profile.deathCooldownUntil > Date.now()) {
      return "dead";
    }
    if (profile.currentChapter >= CHAPTER_MAX && profile.enemyKind === "boss") {
      return "boss_fight";
    }
    return "normal";
  });
  const [bossIncoming, setBossIncoming] = useState(false);
  const [killEventCounter, setKillEventCounter] = useState(0);
  const [deathCooldownMs, setDeathCooldownMs] = useState(() => {
    if (!profile.deathCooldownUntil) return 0;
    return Math.max(0, profile.deathCooldownUntil - Date.now());
  });
  const [berserkMsLeft, setBerserkMsLeft] = useState(() => {
    if (!profile.berserkUntil) return 0;
    return Math.max(0, profile.berserkUntil - Date.now());
  });
  const [suggestItem, setSuggestItem] = useState<GearItem | null>(null);

  const isBerserk = berserkMsLeft > 0;

  const petEffects = computePetEffects(profile.pets, profile.equippedPets);
  const effectiveStats = deriveEffectiveStats(profile, petEffects, isBerserk);
  const varekMaxHp = calcVarekMaxHp(
    profile.level,
    effectiveStats.str,
    effectiveStats.monarch
  );

  const [varekHp, setVarekHp] = useState(varekMaxHp);

  const isDead = stagePhase === "dead" && deathCooldownMs > 0;
  const combatEnabled = !isDead && stagePhase !== "boss_incoming";

  const popupId = useRef(0);
  const chestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bossIncomingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileRef = useRef(profile);
  const varekMaxHpRef = useRef(varekMaxHp);
  const weaponRef = useRef(weapon);
  const weaponIntervalMs = weapon.attackIntervalMs;
  const stagePhaseRef = useRef(stagePhase);
  const combatEnabledRef = useRef(combatEnabled);
  const isBerserkRef = useRef(isBerserk);
  const petEffectsRef = useRef(petEffects);

  useEffect(() => {
    stagePhaseRef.current = stagePhase;
  }, [stagePhase]);

  useEffect(() => {
    combatEnabledRef.current = combatEnabled;
  }, [combatEnabled]);

  useEffect(() => {
    isBerserkRef.current = isBerserk;
  }, [isBerserk]);

  useEffect(() => {
    profileRef.current = profile;
    setDisplayEssence(profile.pendingEssence);
    weaponRef.current = getWeaponCombatProfile(getItemInSlot(profile, "weapon"));
    const eff = deriveEffectiveStats(
      profile,
      computePetEffects(profile.pets, profile.equippedPets),
      isBerserkRef.current
    );
    petEffectsRef.current = computePetEffects(
      profile.pets,
      profile.equippedPets
    );
    varekMaxHpRef.current = calcVarekMaxHp(profile.level, eff.str, eff.monarch);
  }, [profile]);

  useLootTimer(updateProfile, combatEnabled && stagePhase !== "dead");

  // Berserker countdown
  useEffect(() => {
    if (berserkMsLeft <= 0) return;
    const id = setInterval(() => {
      const until = profileRef.current.berserkUntil;
      if (!until) {
        setBerserkMsLeft(0);
        return;
      }
      const remaining = until - Date.now();
      if (remaining <= 0) {
        setBerserkMsLeft(0);
        updateProfile((p) => ({ ...p, berserkUntil: null }));
      } else {
        setBerserkMsLeft(remaining);
      }
    }, 250);
    return () => clearInterval(id);
  }, [berserkMsLeft, updateProfile]);

  // Reset accrual clock on mount (no offline catch-up).
  useEffect(() => {
    updateProfile((p) => applyOfflineAccrual(p, Date.now()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onUnload = () => {
      updateProfile((p) => ({ ...p, lastAccrualMs: Date.now() }));
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [updateProfile]);

  useEffect(() => {
    const tick = () => {
      updateProfile((p) => {
        const pets = computePetEffects(p.pets, p.equippedPets);
        const eff = deriveEffectiveStats(p, pets, isBerserkRef.current);
        const next = accrueOnline(p, Date.now(), {
          gainMultiplier: pets.gainMultiplier,
          stats: eff,
        });
        profileRef.current = next;
        setDisplayEssence(next.pendingEssence);
        return next;
      });
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [updateProfile]);

  // Death cooldown countdown
  const reviveFromDeath = useCallback(() => {
    setDeathCooldownMs(0);
    setStagePhase("normal");
    setVarekHp(varekMaxHpRef.current);
    updateProfile((p) => {
      const spawn = spawnNextMob(p);
      const next = {
        ...p,
        deathCooldownUntil: null,
        ...spawn,
      };
      profileRef.current = next;
      return next;
    });
  }, [updateProfile]);

  useEffect(() => {
    if (stagePhase !== "dead") return;
    const id = setInterval(() => {
      const until = profileRef.current.deathCooldownUntil;
      if (!until) {
        reviveFromDeath();
        return;
      }
      const remaining = until - Date.now();
      if (remaining <= 0) {
        reviveFromDeath();
      } else {
        setDeathCooldownMs(remaining);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [stagePhase, reviveFromDeath]);

  const triggerBossSpawn = useCallback(() => {
    updateProfile((p) => {
      const spawn = spawnStageBoss(p);
      const next = { ...p, ...spawn };
      profileRef.current = next;
      return next;
    });
    setBossIncoming(false);
    setStagePhase("boss_fight");
  }, [updateProfile]);

  const startBossIncoming = useCallback(() => {
    setStagePhase("boss_incoming");
    setBossIncoming(true);
    if (bossIncomingTimer.current) clearTimeout(bossIncomingTimer.current);
    bossIncomingTimer.current = setTimeout(() => {
      triggerBossSpawn();
    }, BOSS_INCOMING_DELAY_MS);
  }, [triggerBossSpawn]);

  // Enemy damage to Varek
  useEffect(() => {
    if (!combatEnabled) return;

    const id = setInterval(() => {
      const p = profileRef.current;
      const phase = stagePhaseRef.current;
      const isBossFight = phase === "boss_fight";
      const dmg = isBossFight ? 15 + p.level * 4 : 4 + p.level * 1.8;
      const maxHp = varekMaxHpRef.current;

      setVarekHp((prev) => {
        const next = prev - dmg;
        if (next <= 0) {
          if (isBossFight) {
            const until = Date.now() + DEATH_COOLDOWN_MS;
            updateProfile((prof) => ({ ...prof, deathCooldownUntil: until }));
            setStagePhase("dead");
            setDeathCooldownMs(DEATH_COOLDOWN_MS);
            setVarekDeathFlash(true);
            setTimeout(() => setVarekDeathFlash(false), 800);
            return 0;
          }
          setVarekDeathFlash(true);
          setTimeout(() => setVarekDeathFlash(false), 500);
          return maxHp;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [combatEnabled, updateProfile]);

  const triggerCombat = useCallback(() => {
    const p = profileRef.current;
    const w = weaponRef.current;
    const phase = stagePhaseRef.current;
    if (!combatEnabledRef.current) return;
    if (phase === "boss_incoming" || phase === "dead") return;

    const berserk = isBerserkRef.current;
    const pets = petEffectsRef.current;

    // fold pet crit bonus into LUK for the damage roll
    const eff = deriveEffectiveStats(p, pets, berserk);
    const lukWithPets = eff.luk + pets.critBonus / 0.85;
    const { amount: rawAmount, crit } = rollCombatDamage({
      ...p,
      stats: { ...eff, luk: lukWithPets },
    });
    let amount = Math.floor(rawAmount * w.strMultiplier);
    if (berserk) amount = Math.floor(amount * BERSERK_STR_MULT);

    setAttacking(true);
    setBossHit(true);
    setSlashVisible(true);

    if (w.hasShake) {
      setShake(true);
      setTimeout(() => setShake(false), 260);
    }

    const id = ++popupId.current;
    setPopups((prev) => [
      ...prev.slice(-6),
      { id, amount, crit, offsetX: (Math.random() - 0.5) * 56 },
    ]);

    updateProfile((prev) => {
      const bossHp = prev.bossHp - amount;
      if (bossHp > 0) {
        const next = { ...prev, bossHp };
        profileRef.current = next;
        return next;
      }

      // ── Stage boss slain ──
      if (phase === "boss_fight" && prev.enemyKind === "boss") {
        const outcome = applyStageBossKillRewards(prev, pets.gainMultiplier);
        let next = outcome.profile;

        if (Math.random() < BOSS_LOOT_CHANCE) {
          next = {
            ...next,
            storedChests: [
              ...next.storedChests,
              { id: createChestId(), type: "boss", earnedAt: Date.now() },
            ],
          };
        }

        const reset = resetStageAfterBoss();
        const spawn = spawnNextMob({ ...next, ...reset });
        next = { ...next, ...reset, ...spawn, deathCooldownUntil: null };

        if (outcome.leveledUp) {
          setLevelFlash(true);
          setTimeout(() => setLevelFlash(false), 700);
        }

        setBossDropFlash(true);
        setLastChestReward("BOSS DEFEATED");
        if (chestTimer.current) clearTimeout(chestTimer.current);
        chestTimer.current = setTimeout(() => {
          setLastChestReward(null);
          setBossDropFlash(false);
        }, 3200);

        profileRef.current = next;
        setStagePhase("normal");
        setVarekHp(varekMaxHpRef.current);
        setKillEventCounter((c) => c + 1);
        return next;
      }

      // ── Normal mob kill → chapter progression ──
      const outcome = applyMobKillRewards(prev, pets.gainMultiplier);
      let next = outcome.profile;

      // Bloodstone drop (5%)
      if (Math.random() < BLOODSTONE_DROP_CHANCE) {
        next = { ...next, bloodstones: next.bloodstones + 1 };
      }

      const adv = advanceChapterOnMobKill(
        prev.currentChapter,
        prev.chapterKills
      );

      if (adv.triggerBoss) {
        // Gate behind Bloodstone key
        if (next.bloodstones > 0) {
          next = {
            ...next,
            bloodstones: next.bloodstones - 1,
            currentChapter: adv.chapter,
            chapterKills: 0,
          };
          profileRef.current = next;
          setKillEventCounter((c) => c + 1);
          setTimeout(() => startBossIncoming(), 0);
          return next;
        }
        // No key → fall back, keep farming
        next = {
          ...next,
          currentChapter: BOSS_LOCKED_FALLBACK_CHAPTER,
          chapterKills: 0,
        };
        profileRef.current = next;
        setBossLockedFlash(true);
        setTimeout(() => setBossLockedFlash(false), 2600);
        setKillEventCounter((c) => c + 1);
        return next;
      }

      next = {
        ...next,
        currentChapter: adv.chapter,
        chapterKills: adv.chapterKills,
      };

      if (outcome.leveledUp) {
        setLevelFlash(true);
        setTimeout(() => setLevelFlash(false), 700);
      }

      profileRef.current = next;
      setKillEventCounter((c) => c + 1);
      return next;
    });

    setTimeout(() => setAttacking(false), 320);
    setTimeout(() => setBossHit(false), 380);
    setTimeout(() => setSlashVisible(false), 280);
    setTimeout(
      () => setPopups((prev) => prev.filter((x) => x.id !== id)),
      crit ? 1200 : 900
    );
  }, [startBossIncoming, updateProfile]);

  // Combat interval — berserk speeds it up
  useEffect(() => {
    if (!combatEnabled) return;
    const interval = isBerserk
      ? Math.max(120, Math.floor(weapon.attackIntervalMs / BERSERK_SPEED_MULT))
      : weapon.attackIntervalMs;
    const id = setInterval(triggerCombat, interval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weaponIntervalMs, combatEnabled, isBerserk, triggerCombat]);

  const claim = useCallback(() => {
    updateProfile((prev) => {
      if (prev.pendingEssence <= 0) return prev;
      const next = {
        ...prev,
        walletCoin: prev.walletCoin + prev.pendingEssence,
        pendingEssence: 0,
        lastAccrualMs: Date.now(),
      };
      profileRef.current = next;
      setDisplayEssence(0);
      return next;
    });
  }, [updateProfile]);

  const activateBerserker = useCallback(() => {
    const until = Date.now() + BERSERK_DURATION_MS;
    setBerserkMsLeft(BERSERK_DURATION_MS);
    updateProfile((p) => {
      const next = { ...p, berserkUntil: until };
      profileRef.current = next;
      return next;
    });
  }, [updateProfile]);

  const instantRevive = useCallback(() => {
    if (stagePhaseRef.current !== "dead") return;
    reviveFromDeath();
  }, [reviveFromDeath]);

  const recalcMaxHp = useCallback(() => {
    const p = profileRef.current;
    const eff = deriveEffectiveStats(
      p,
      computePetEffects(p.pets, p.equippedPets),
      isBerserkRef.current
    );
    varekMaxHpRef.current = calcVarekMaxHp(p.level, eff.str, eff.monarch);
  }, []);

  const openStoredChest = useCallback(
    (chestId: string): ChestReward | null => {
      const outcome: { reward: ChestReward | null; rolledItem: GearItem | null } = {
        reward: null,
        rolledItem: null,
      };
      updateProfile((prev) => {
        const chest = prev.storedChests.find((c) => c.id === chestId);
        if (!chest) return prev;

        const remaining = prev.storedChests.filter((c) => c.id !== chestId);
        const roll = Math.random();

        if (roll < BLOODSTONE_DROP_CHANCE) {
          outcome.reward = { kind: "bloodstone" };
          const next = {
            ...prev,
            storedChests: remaining,
            bloodstones: prev.bloodstones + 1,
          };
          profileRef.current = next;
          return next;
        }

        if (roll < BLOODSTONE_DROP_CHANCE + PET_DROP_CHANCE) {
          const pet = rollPet();
          outcome.reward = { kind: "pet", pet };
          const next = {
            ...prev,
            storedChests: remaining,
            pets: [...prev.pets, pet],
          };
          profileRef.current = next;
          return next;
        }

        const item = rollLootItem(chest.type === "boss", prev.currentChapter);
        outcome.reward = { kind: "item", item };
        outcome.rolledItem = item;
        const next = {
          ...prev,
          storedChests: remaining,
          gearItems: [...prev.gearItems, item],
        };
        profileRef.current = next;
        return next;
      });
      recalcMaxHp();
      if (outcome.rolledItem) {
        const worn = getItemInSlot(profileRef.current, outcome.rolledItem.slot);
        if (shouldSuggest(outcome.rolledItem, worn)) setSuggestItem(outcome.rolledItem);
      }
      return outcome.reward;
    },
    [recalcMaxHp, updateProfile]
  );

  const mergeSelected = useCallback(
    (itemIds: string[]): GearItem | null => {
      if (itemIds.length !== MERGE_REQUIRED) return null;
      let result: GearItem | null = null;
      updateProfile((prev) => {
        const selected = prev.gearItems.filter((i) =>
          itemIds.includes(i.id)
        );
        const merged = mergeItems(selected);
        if (!merged) return prev;
        result = merged;
        const slots = { ...prev.equippedSlots };
        for (const s of Object.keys(slots) as GearSlot[]) {
          if (itemIds.includes(slots[s] ?? "")) slots[s] = null;
        }
        const next = {
          ...prev,
          equippedSlots: slots,
          gearItems: [
            ...prev.gearItems.filter((i) => !itemIds.includes(i.id)),
            merged,
          ],
        };
        profileRef.current = next;
        return next;
      });
      recalcMaxHp();
      return result;
    },
    [recalcMaxHp, updateProfile]
  );

  const equipGear = useCallback(
    (itemId: string, slot: GearSlot) => {
      updateProfile((prev) => {
        const next = equipItem(prev, itemId, slot);
        profileRef.current = next;
        return next;
      });
      recalcMaxHp();
    },
    [recalcMaxHp, updateProfile]
  );

  const unequipGear = useCallback(
    (slot: GearSlot) => {
      updateProfile((prev) => {
        const next = unequipSlot(prev, slot);
        profileRef.current = next;
        return next;
      });
      recalcMaxHp();
    },
    [recalcMaxHp, updateProfile]
  );

  const quickEquipGear = useCallback(
    (itemId: string) => {
      updateProfile((prev) => {
        const next = quickEquip(prev, itemId);
        profileRef.current = next;
        return next;
      });
      recalcMaxHp();
    },
    [recalcMaxHp, updateProfile]
  );

  const dismissSuggest = useCallback(() => setSuggestItem(null), []);

  const acceptSuggest = useCallback(() => {
    setSuggestItem((cur) => {
      if (cur) quickEquipGear(cur.id);
      return null;
    });
  }, [quickEquipGear]);

  const tryEnhance = useCallback(
    (
      itemId: string,
      useScroll: boolean
    ): EnhanceOutcome | { error: string } => {
      const prev = profileRef.current;
      const res = applyEnhanceAttempt(prev, itemId, useScroll);
      if ("error" in res) return { error: res.error };
      updateProfile(() => res.profile);
      profileRef.current = res.profile;
      recalcMaxHp();
      return res.outcome;
    },
    [recalcMaxHp, updateProfile]
  );

  const buyProtectionScroll = useCallback((): string | null => {
    let err: string | null = null;
    updateProfile((prev) => {
      const res = buyScroll(prev);
      if ("error" in res) {
        err = res.error;
        return prev;
      }
      profileRef.current = res;
      return res;
    });
    return err;
  }, [updateProfile]);

  const equipPet = useCallback(
    (petId: string, slot: number) => {
      if (slot < 0 || slot > 2) return;
      updateProfile((prev) => {
        const slots = [...prev.equippedPets];
        for (let i = 0; i < slots.length; i++) {
          if (slots[i] === petId) slots[i] = null;
        }
        slots[slot] = petId;
        const next = { ...prev, equippedPets: slots };
        profileRef.current = next;
        return next;
      });
      recalcMaxHp();
    },
    [recalcMaxHp, updateProfile]
  );

  const unequipPet = useCallback(
    (slot: number) => {
      if (slot < 0 || slot > 2) return;
      updateProfile((prev) => {
        const slots = [...prev.equippedPets];
        slots[slot] = null;
        const next = { ...prev, equippedPets: slots };
        profileRef.current = next;
        return next;
      });
      recalcMaxHp();
    },
    [recalcMaxHp, updateProfile]
  );

  const selectCharacter = useCallback(
    (id: CharacterId) => {
      updateProfile((p) => {
        if (!p.unlockedCharacters.includes(id)) return p;
        return { ...p, selectedCharacter: id };
      });
    },
    [updateProfile]
  );

  const buyCharacter = useCallback(
    (id: CharacterId): string | null => {
      let err: string | null = null;
      updateProfile((p) => {
        const res = purchaseCharacter(p, id);
        if (!res.ok) {
          err = res.reason;
          return p;
        }
        profileRef.current = res.profile;
        return res.profile;
      });
      return err;
    },
    [updateProfile]
  );

  const openChest = useCallback(
    (isBoss: boolean): string | null => {
      if (chestSpinning) return "Chest already opening";
      const cost = isBoss ? 0 : COMMON_CHEST_COST;
      const p = profileRef.current;
      if (!isBoss && p.pendingEssence < cost && p.walletCoin < cost) {
        return "Not enough essence";
      }
      setChestSpinning(true);
      setTimeout(() => {
        const { stat, amount } = rollChestReward(isBoss);
        updateProfile((prev) => {
          if (!isBoss) {
            if (prev.pendingEssence >= cost) {
              return {
                ...prev,
                pendingEssence: prev.pendingEssence - cost,
                stats: applyStatBonus(prev.stats, stat, amount),
              };
            }
            if (prev.walletCoin >= cost) {
              return {
                ...prev,
                walletCoin: prev.walletCoin - cost,
                stats: applyStatBonus(prev.stats, stat, amount),
              };
            }
            return prev;
          }
          return {
            ...prev,
            stats: applyStatBonus(prev.stats, stat, amount),
          };
        });
        const label = stat === "monarch" ? "MONARCH" : stat.toUpperCase();
        setLastChestReward(`+${amount} ${label}`);
        setChestSpinning(false);
        setTimeout(() => setLastChestReward(null), 3000);
      }, 1400);
      return null;
    },
    [chestSpinning, updateProfile]
  );

  const xpToNext = xpForLevel(profile.level);
  const xpPct = Number.isFinite(xpToNext)
    ? Math.min(100, (profile.xp / xpToNext) * 100)
    : 100;

  return {
    profile,
    gps:
      goldPerSecond({ ...profile, stats: effectiveStats }) *
      petEffects.gainMultiplier,
    ccPercent: Math.min(
      75,
      critChancePercent(effectiveStats) + petEffects.critBonus
    ),
    displayEssence,
    attacking,
    bossHit,
    levelFlash,
    popups,
    slashVisible,
    chestSpinning,
    lastChestReward,
    selectedChar: CHARACTERS[profile.selectedCharacter],
    enemyKind: profile.enemyKind,
    enemyName: profile.enemyName,
    killsThisCycle: profile.killsThisCycle,
    currentChapter: profile.currentChapter,
    chapterKills: profile.chapterKills,
    chapterMax: CHAPTER_MAX,
    killsPerChapter: KILLS_PER_CHAPTER,
    stagePhase,
    bossIncoming,
    bossLockedFlash,
    killEventCounter,
    xp: profile.xp,
    xpToNext,
    xpPct,
    bossDropFlash,
    shake,
    varekHp,
    varekMaxHp,
    varekDeathFlash,
    isDead,
    deathCooldownMs,
    deathCooldownLabel: formatCooldownMs(deathCooldownMs),
    storedChests: profile.storedChests,
    gearItems: profile.gearItems,
    equippedSlots: profile.equippedSlots,
    effectiveStats,
    bloodstones: profile.bloodstones,
    pets: profile.pets,
    equippedPets: profile.equippedPets,
    petEffects,
    isBerserk,
    berserkMsLeft,
    berserkLabel: formatCooldownMs(berserkMsLeft),
    suggestItem,
    dismissSuggest,
    acceptSuggest,
    protectionScrolls: profile.protectionScrolls,
    tryEnhance,
    buyProtectionScroll,
    claim,
    selectCharacter,
    buyCharacter,
    openCommonChest: () => openChest(false),
    openBossChest: () => openChest(true),
    openStoredChest,
    mergeSelected,
    equipGear,
    unequipGear,
    quickEquipGear,
    equipPet,
    unequipPet,
    activateBerserker,
    instantRevive,
  };
}
