import type { CharacterId } from "@/lib/idleGame";

/** Hunter display name bounds (shared by UI + validation). */
export const HUNTER_NAME_MIN = 2;
export const HUNTER_NAME_MAX = 12;

/**
 * Auth UI phases.
 * - connect: name + Phantom wallet on notification panel
 * - character_select: pick Varek (new or returning)
 * - welcome: returning hunter — confirm before game
 * - ready: in-game (handled by GameApp)
 */
export type AuthPhase =
  | "connect"
  | "character_select"
  | "welcome"
  | "ready";

export type LoginResult = false | "welcome" | "character_select";

/** New registration vs returning hunter */
export type CharacterSelectMode = "new" | "returning";

export const CHARACTER_IDS: CharacterId[] = ["varek"];

export function sanitizeHunterName(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .slice(0, HUNTER_NAME_MAX);
}

export function isValidHunterName(name: string): boolean {
  const trimmed = name.trim();
  return (
    trimmed.length >= HUNTER_NAME_MIN && trimmed.length <= HUNTER_NAME_MAX
  );
}

export function shortWallet(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
