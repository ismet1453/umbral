import type { Direction } from "./types";

export function createSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function buildCommitPayload(direction: Direction, salt: string): string {
  return `${direction}:${salt}`;
}

export async function hashCommitment(
  direction: Direction,
  salt: string
): Promise<string> {
  const payload = buildCommitPayload(direction, salt);
  const data = new TextEncoder().encode(payload);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

export function pendingRevealKey(matchId: string, wallet: string): string {
  return `umbral:reveal:${matchId}:${wallet}`;
}

export interface PendingReveal {
  direction: Direction;
  salt: string;
}

export function storePendingReveal(
  matchId: string,
  wallet: string,
  data: PendingReveal
): void {
  sessionStorage.setItem(
    pendingRevealKey(matchId, wallet),
    JSON.stringify(data)
  );
}

export function loadPendingReveal(
  matchId: string,
  wallet: string
): PendingReveal | null {
  const raw = sessionStorage.getItem(pendingRevealKey(matchId, wallet));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingReveal;
  } catch {
    return null;
  }
}

export function clearPendingReveal(matchId: string, wallet: string): void {
  sessionStorage.removeItem(pendingRevealKey(matchId, wallet));
}
