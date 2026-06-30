import type { GearItem, StoredChest } from "@/lib/lootSystem";
import type { GearSlot } from "@/lib/lootSystem";
import {
  emptyEquippedSlots,
  migrateLegacyEquipped,
  normalizeEquippedSlots,
  normalizeGearItem,
} from "@/lib/equipmentSystem";
import type { Pet } from "@/lib/petSystem";

export type CharacterId = "varek";
export type StatKey = "str" | "agi" | "luk" | "monarch";

export const MAX_LEVEL = 99;

export interface HunterStats {
  str: number;
  agi: number;
  luk: number;
  monarch: number;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  subtitle: string;
  priceSol: number;
  focus: "balanced" | "active" | "passive";
  focusLabel: string;
}

export type EnemyKind = "mob" | "boss";

export interface PlayerProfile {
  hunterName: string;
  walletAddress: string;
  selectedCharacter: CharacterId;
  unlockedCharacters: CharacterId[];
  simulatedSol: number;
  level: number;
  xp: number;
  pendingEssence: number;
  walletCoin: number;
  lastAccrualMs: number;
  /** Set when combat progress is reset — blocks stale cloud level restore. */
  progressResetAt?: number;
  bossHp: number;
  bossMaxHp: number;
  enemyKind: EnemyKind;
  enemyName: string;
  killsThisCycle: number;
  stats: HunterStats;
  /** Current chapter 1–10 */
  currentChapter: number;
  /** Mob kills toward next chapter (0–4) */
  chapterKills: number;
  /** Chests waiting to be opened in inventory */
  storedChests: StoredChest[];
  /** All owned gear (bag + worn) */
  gearItems: GearItem[];
  /** Item id per equipment slot (null = empty) */
  equippedSlots: Record<GearSlot, string | null>;
  /** Timestamp (ms) when Varek can fight again after boss death */
  deathCooldownUntil: number | null;
  /** Bloodstone keys required to enter the chapter-10 boss */
  bloodstones: number;
  /** Owned pets */
  pets: Pet[];
  /** Equipped pet ids by slot (length 3, null = empty) */
  equippedPets: (string | null)[];
  /** Timestamp (ms) until which Berserker mode is active */
  berserkUntil: number | null;
  /** Koruma scroll stok (enhance break koruması) */
  protectionScrolls: number;
}

export const BASE_GOLD_PER_SEC = 1;
export const BOSS_MAX_HP = 1000;
export const COMMON_CHEST_COST = 150;
export const PROFILE_PREFIX = "umbral-profile";
export const SESSION_KEY = "umbral-session";

/** How many mobs are slain before a boss appears. */
export const BOSS_EVERY = 10;

export const MOB_NAMES = [
  "Hollow Husk",
  "Ashen Wraith",
  "Broken Revenant",
  "Cursed Acolyte",
  "Bone Stalker",
  "Rotting Knight",
  "Pale Shade",
  "Grave Crawler",
] as const;

export const BOSS_NAMES = [
  "Cerberus Fragment",
  "The Gilded Tyrant",
  "Throne of Rust",
  "Maw of the Abyss",
  "Crowned Despair",
] as const;

function pickName(list: readonly string[], seed: number): string {
  return list[Math.abs(Math.floor(seed)) % list.length]!;
}

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  varek: {
    id: "varek",
    name: "Varek",
    subtitle: "The Dark Messiah",
    priceSol: 0,
    focus: "active",
    focusLabel: "Greatsword & Crimson Vengeance",
  },
};

function normalizeCharacterId(_id: string): CharacterId {
  return "varek";
}

function normalizeLevel(level: number): number {
  const base = level <= 0 ? 1 : level;
  return Math.min(MAX_LEVEL, Math.max(1, base));
}

export function defaultStats(): HunterStats {
  return { str: 10, agi: 10, luk: 8, monarch: 5 };
}

export function defaultProfile(wallet: string, nowMs = Date.now()): PlayerProfile {
  const firstMobHp = mobMaxHp(1);
  return {
    hunterName: "",
    walletAddress: wallet,
    selectedCharacter: "varek",
    unlockedCharacters: ["varek"],
    simulatedSol: 1,
    level: 1,
    xp: 0,
    pendingEssence: 0,
    walletCoin: 0,
    lastAccrualMs: nowMs,
    bossHp: firstMobHp,
    bossMaxHp: firstMobHp,
    enemyKind: "mob",
    enemyName: MOB_NAMES[0],
    killsThisCycle: 0,
    stats: defaultStats(),
    currentChapter: 1,
    chapterKills: 0,
    storedChests: [],
    gearItems: [],
    equippedSlots: emptyEquippedSlots(),
    deathCooldownUntil: null,
    bloodstones: 0,
    pets: [],
    equippedPets: [null, null, null],
    berserkUntil: null,
    protectionScrolls: 0,
  };
}

/** LUK → Critical Chance % */
export function critChancePercent(stats: HunterStats): number {
  return Math.min(75, stats.luk * 0.85);
}

export function goldPerSecond(profile: PlayerProfile): number {
  const char = CHARACTERS[profile.selectedCharacter];
  const base = BASE_GOLD_PER_SEC * Math.pow(1.42, profile.level - 1);
  const strMult = 1 + profile.stats.str / 100;
  const agiMult = 1 + profile.stats.agi / 120;
  const monarchMult = 1 + profile.stats.monarch / 70;

  let mult = strMult * agiMult;
  if (char.focus === "active") {
    mult *= 1 + profile.stats.agi / 90 + critChancePercent(profile.stats) / 200;
  } else if (char.focus === "passive") {
    mult *= monarchMult * (1 + profile.stats.str / 80);
  } else {
    mult *= 1 + profile.stats.monarch / 150;
  }

  return base * mult;
}

export function levelUpStatGains(stats: HunterStats): HunterStats {
  return {
    ...stats,
    str: stats.str + 2,
    agi: stats.agi + 2,
    luk: stats.luk + 1,
    monarch: stats.monarch + 1,
  };
}

/* ============================================================
   Endless combat — XP / leveling / enemy scaling
   (All curves are tunable from here.)
   ============================================================ */

/** XP needed to advance FROM `level` to the next. */
export function xpForLevel(level: number): number {
  if (level >= MAX_LEVEL) return Infinity;
  return Math.floor(60 * Math.pow(1.17, level - 1));
}

/** Active-enemy max HP by player level. */
export function mobMaxHp(level: number): number {
  return Math.floor(200 * Math.pow(1.12, level - 1));
}

export function bossMaxHp(level: number): number {
  return mobMaxHp(level) * 6;
}

/** XP granted for slaying an enemy. */
export function mobXp(level: number): number {
  return Math.floor(18 * Math.pow(1.12, level - 1));
}

export function bossXp(level: number): number {
  return mobXp(level) * 8;
}

export interface EnemySpawn {
  enemyKind: EnemyKind;
  enemyName: string;
  bossHp: number;
  bossMaxHp: number;
}

/**
 * Decide the next enemy based on how many mobs have been slain this cycle.
 * After BOSS_EVERY mobs, a boss appears; killing it resets the cycle.
 */
export function spawnNextEnemy(profile: PlayerProfile): EnemySpawn {
  const isBoss = profile.killsThisCycle >= BOSS_EVERY;
  if (isBoss) {
    const hp = bossMaxHp(profile.level);
    return {
      enemyKind: "boss",
      enemyName: pickName(BOSS_NAMES, profile.level + profile.killsThisCycle),
      bossHp: hp,
      bossMaxHp: hp,
    };
  }
  const hp = mobMaxHp(profile.level);
  return {
    enemyKind: "mob",
    enemyName: pickName(
      MOB_NAMES,
      profile.level * 7 + profile.killsThisCycle
    ),
    bossHp: hp,
    bossMaxHp: hp,
  };
}

/** Always spawn a normal mob (stage loop). */
export function spawnNextMob(profile: PlayerProfile): EnemySpawn {
  const hp = mobMaxHp(profile.level);
  return {
    enemyKind: "mob",
    enemyName: pickName(
      MOB_NAMES,
      profile.level * 7 + profile.killsThisCycle + profile.currentChapter
    ),
    bossHp: hp,
    bossMaxHp: hp,
  };
}

/** Chapter-10 stage boss — higher HP pool. */
export function spawnStageBoss(profile: PlayerProfile): EnemySpawn {
  const hp = Math.floor(bossMaxHp(profile.level) * 1.8);
  return {
    enemyKind: "boss",
    enemyName: pickName(BOSS_NAMES, profile.level * 13 + profile.currentChapter),
    bossHp: hp,
    bossMaxHp: hp,
  };
}

export interface KillOutcome {
  profile: PlayerProfile;
  leveledUp: boolean;
  bossDefeated: boolean;
}

/**
 * Apply rewards for slaying the current enemy: grant XP, auto level-up
 * (possibly multiple times), advance the boss cycle, and spawn the next enemy.
 */
export function applyKillRewards(profile: PlayerProfile): KillOutcome {
  const wasBoss = profile.enemyKind === "boss";
  const gainedXp = wasBoss ? bossXp(profile.level) : mobXp(profile.level);

  let level = profile.level;
  let xp = profile.xp + gainedXp;
  let stats = profile.stats;
  let leveledUp = false;

  while (level < MAX_LEVEL && xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
    stats = levelUpStatGains(stats);
    leveledUp = true;
  }
  if (level >= MAX_LEVEL) xp = 0;

  // Advance / reset the boss cycle.
  const killsThisCycle = wasBoss ? 0 : profile.killsThisCycle + 1;

  const staged: PlayerProfile = {
    ...profile,
    level,
    xp,
    stats,
    killsThisCycle,
  };

  const spawn = spawnNextEnemy(staged);

  return {
    profile: { ...staged, ...spawn },
    leveledUp,
    bossDefeated: wasBoss,
  };
}

/** Mob kill for chapter progression — always spawns next mob. */
export function applyMobKillRewards(
  profile: PlayerProfile,
  xpMultiplier = 1
): KillOutcome {
  const gainedXp = Math.floor(mobXp(profile.level) * xpMultiplier);

  let level = profile.level;
  let xp = profile.xp + gainedXp;
  let stats = profile.stats;
  let leveledUp = false;

  while (level < MAX_LEVEL && xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
    stats = levelUpStatGains(stats);
    leveledUp = true;
  }
  if (level >= MAX_LEVEL) xp = 0;

  const staged: PlayerProfile = {
    ...profile,
    level,
    xp,
    stats,
    killsThisCycle: profile.killsThisCycle + 1,
  };

  const spawn = spawnNextMob(staged);
  return {
    profile: { ...staged, ...spawn },
    leveledUp,
    bossDefeated: false,
  };
}

/** Stage boss kill — XP + reset kill cycle, caller handles chapter reset. */
export function applyStageBossKillRewards(
  profile: PlayerProfile,
  xpMultiplier = 1
): KillOutcome {
  const gainedXp = Math.floor(bossXp(profile.level) * xpMultiplier);

  let level = profile.level;
  let xp = profile.xp + gainedXp;
  let stats = profile.stats;
  let leveledUp = false;

  while (level < MAX_LEVEL && xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
    stats = levelUpStatGains(stats);
    leveledUp = true;
  }
  if (level >= MAX_LEVEL) xp = 0;

  const staged: PlayerProfile = {
    ...profile,
    level,
    xp,
    stats,
    killsThisCycle: 0,
  };

  return { profile: staged, leveledUp, bossDefeated: true };
}

/** Largest online tick (sec) that can be rewarded at once. Prevents a
 *  backgrounded/slept tab from dumping a huge catch-up chunk on resume. */
export const ONLINE_TICK_CAP_SEC = 2;

export function resetCombatProgress(profile: PlayerProfile): PlayerProfile {
  const nowMs = Date.now();
  const staged: PlayerProfile = {
    ...profile,
    level: 1,
    xp: 0,
    stats: defaultStats(),
    killsThisCycle: 0,
    currentChapter: 1,
    chapterKills: 0,
    deathCooldownUntil: null,
    berserkUntil: null,
    lastAccrualMs: nowMs,
    progressResetAt: nowMs,
  };
  const spawn = spawnNextMob(staged);
  return { ...staged, ...spawn };
}

/**
 * UMBRAL: NO offline / AFK earnings. The game must stay open to earn.
 * Reopening only resets the accrual clock so no catch-up is ever granted.
 */
export function applyOfflineAccrual(
  profile: PlayerProfile,
  nowMs: number
): PlayerProfile {
  return {
    ...profile,
    lastAccrualMs: nowMs,
  };
}

export function accrueOnline(
  profile: PlayerProfile,
  nowMs: number,
  opts?: { gainMultiplier?: number; stats?: HunterStats }
): PlayerProfile {
  const p = opts?.stats ? { ...profile, stats: opts.stats } : profile;
  const gainMult = opts?.gainMultiplier ?? 1;

  const elapsedSec = Math.max(0, (nowMs - profile.lastAccrualMs) / 1000);
  if (elapsedSec <= 0) return profile;

  const rewardedSec = Math.min(elapsedSec, ONLINE_TICK_CAP_SEC);
  const earned = rewardedSec * goldPerSecond(p) * gainMult;
  return {
    ...profile,
    pendingEssence: profile.pendingEssence + earned,
    lastAccrualMs: nowMs,
  };
}

export function rollCombatDamage(profile: PlayerProfile): {
  amount: number;
  crit: boolean;
} {
  const cc = critChancePercent(profile.stats) / 100;
  const crit = Math.random() < cc;
  const char = CHARACTERS[profile.selectedCharacter];

  let base = 80 + profile.level * 22 + profile.stats.str * 3.5;
  if (char.focus === "active") {
    base += profile.stats.agi * 4;
  } else if (char.focus === "passive") {
    base += profile.stats.str * 2 + profile.stats.monarch * 2;
  } else {
    base += profile.stats.agi * 2;
  }

  const amount = Math.floor(base * (crit ? 2.5 : 1));
  return { amount, crit };
}

export function combatIntervalMs(profile: PlayerProfile): number {
  const char = CHARACTERS[profile.selectedCharacter];
  const agiFactor = 1 + profile.stats.agi / 100;
  const base = char.focus === "active" ? 850 : 1000;
  return Math.max(450, Math.floor(base / agiFactor));
}

export function rollChestReward(isBoss: boolean): {
  stat: StatKey;
  amount: number;
} {
  const stats: StatKey[] = isBoss
    ? ["str", "agi", "luk", "monarch"]
    : ["str", "agi", "luk"];
  const stat = stats[Math.floor(Math.random() * stats.length)]!;
  const amount = isBoss
    ? Math.floor(Math.random() * 8) + 8
    : Math.floor(Math.random() * 5) + 1;
  return { stat, amount };
}

export function applyStatBonus(
  stats: HunterStats,
  stat: StatKey,
  amount: number
): HunterStats {
  return { ...stats, [stat]: stats[stat] + amount };
}

export function formatGold(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(n < 100 ? 2 : 0);
}

export function loadProfile(wallet: string): PlayerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${PROFILE_PREFIX}:${wallet}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
    const level = normalizeLevel(parsed.level ?? 1);
    const killsThisCycle = Math.min(
      BOSS_EVERY,
      Math.max(0, parsed.killsThisCycle ?? 0)
    );

    const base: PlayerProfile = {
      ...defaultProfile(wallet),
      ...parsed,
      stats: { ...defaultStats(), ...parsed.stats },
      selectedCharacter: normalizeCharacterId(
        (parsed.selectedCharacter as string) ?? "varek"
      ),
      unlockedCharacters: ["varek"] as CharacterId[],
      level,
      xp: Math.max(0, parsed.xp ?? 0),
      // Economy migration: legacy saves used pendingGold / walletGold.
      pendingEssence: Math.max(
        0,
        parsed.pendingEssence ??
          (parsed as { pendingGold?: number }).pendingGold ??
          0
      ),
      walletCoin: Math.max(
        0,
        parsed.walletCoin ??
          (parsed as { walletGold?: number }).walletGold ??
          0
      ),
      killsThisCycle,
      enemyKind: parsed.enemyKind === "boss" ? "boss" : "mob",
      enemyName: parsed.enemyName ?? MOB_NAMES[0],
      currentChapter: Math.min(
        10,
        Math.max(1, parsed.currentChapter ?? 1)
      ),
      chapterKills: Math.min(
        4,
        Math.max(0, parsed.chapterKills ?? 0)
      ),
      storedChests: Array.isArray(parsed.storedChests)
        ? parsed.storedChests
        : [],
      ...(Array.isArray((parsed as { gearItems?: GearItem[] }).gearItems)
        ? {
            gearItems: (parsed as { gearItems: GearItem[] }).gearItems.map(
              normalizeGearItem
            ),
            equippedSlots: normalizeEquippedSlots(
              (parsed as { equippedSlots?: Record<GearSlot, string | null> })
                .equippedSlots
            ),
          }
        : migrateLegacyEquipped(
            Array.isArray(
              (parsed as { equippedItems?: GearItem[] }).equippedItems
            )
              ? (parsed as { equippedItems: GearItem[] }).equippedItems
              : []
          )),
      deathCooldownUntil:
        typeof parsed.deathCooldownUntil === "number"
          ? parsed.deathCooldownUntil
          : null,
      bloodstones: Math.max(0, parsed.bloodstones ?? 0),
      pets: Array.isArray(parsed.pets) ? parsed.pets : [],
      equippedPets:
        Array.isArray(parsed.equippedPets) && parsed.equippedPets.length === 3
          ? parsed.equippedPets
          : [null, null, null],
      berserkUntil:
        typeof parsed.berserkUntil === "number" ? parsed.berserkUntil : null,
      protectionScrolls: Math.max(0, parsed.protectionScrolls ?? 0),
    };

    // Re-derive enemy HP if missing/stale (legacy profiles used a flat boss).
    if (
      typeof parsed.bossMaxHp !== "number" ||
      typeof parsed.bossHp !== "number" ||
      typeof parsed.enemyKind === "undefined"
    ) {
      const spawn = spawnNextEnemy(base);
      return { ...base, ...spawn };
    }

    return base;
  } catch {
    return null;
  }
}

export function persistProfile(profile: PlayerProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${PROFILE_PREFIX}:${profile.walletAddress}`,
    JSON.stringify(profile)
  );
}

export function loadSessionWallet(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function persistSessionWallet(wallet: string | null): void {
  if (typeof window === "undefined") return;
  if (wallet) localStorage.setItem(SESSION_KEY, wallet);
  else localStorage.removeItem(SESSION_KEY);
}

export function isProfileReady(profile: PlayerProfile): boolean {
  return profile.hunterName.trim().length >= 2;
}

export function isCharacterUnlocked(
  profile: PlayerProfile,
  id: CharacterId
): boolean {
  return profile.unlockedCharacters.includes(id);
}

export function purchaseCharacter(
  profile: PlayerProfile,
  id: CharacterId
): { ok: true; profile: PlayerProfile } | { ok: false; reason: string } {
  const char = CHARACTERS[id];
  if (isCharacterUnlocked(profile, id)) {
    return { ok: true, profile: { ...profile, selectedCharacter: id } };
  }
  if (profile.simulatedSol < char.priceSol) {
    return { ok: false, reason: "Insufficient SOL (simulated)" };
  }
  return {
    ok: true,
    profile: {
      ...profile,
      simulatedSol: profile.simulatedSol - char.priceSol,
      unlockedCharacters: ["varek"] as CharacterId[],
      selectedCharacter: id,
    },
  };
}
