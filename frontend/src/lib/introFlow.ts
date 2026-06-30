export const HUNTER_NAME_MIN = 2;
export const HUNTER_NAME_MAX = 12;

export type IntroStep =
  | "loading"
  | "collapse"
  | "system_box"
  | "igris_cutscene"
  | "gate_dissolve"
  | "game";

export const INTRO_COMPLETE_KEY = "umbral-intro-v1-complete";

export const INTRO_TIMINGS = {
  /** Loading after ENTER THE GATE (~12s) */
  loadingMs: 12000,
  collapseMs: 900,
  /** First alarm — Welcome Player */
  welcomeAlarmMs: 5000,
  /** Transition between alarms */
  alarmSwapMs: 600,
  igrisPlayMs: 6000,
  gateDissolveMs: 1100,
  splitMs: 500,
} as const;

export const LOADING_STATUS_LINES = [
  "Descending into the Gate…",
  "Synchronizing Hunter Protocol…",
  "Scanning dimensional boundary…",
  "Calibrating Shadow Monarch link…",
  "Preparing System Awakening…",
] as const;

export function sanitizeHunterName(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .slice(0, HUNTER_NAME_MAX);
}

export function isIntroComplete(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(INTRO_COMPLETE_KEY) === "1";
}

export function markIntroComplete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(INTRO_COMPLETE_KEY, "1");
}

export function resetIntroComplete(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(INTRO_COMPLETE_KEY);
}
