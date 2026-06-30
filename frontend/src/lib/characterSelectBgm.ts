/**
 * Character-select themes — dual-slot crossfade so tracks never stack.
 */

import { CHARACTER_IDS } from "@/lib/authFlow";
import type { CharacterId } from "@/lib/idleGame";
import { CHARACTER_THEMES } from "@/lib/characterThemes";

const CROSSFADE_MS = 900;
const ENTER_FADE_MS = 400;
const LEAVE_FADE_MS = 500;

let slotA: HTMLAudioElement | null = null;
let slotB: HTMLAudioElement | null = null;
let active: HTMLAudioElement | null = null;
let currentId: CharacterId | null = null;
let fadeRaf: number | null = null;

function ensureSlots(): [HTMLAudioElement, HTMLAudioElement] {
  if (!slotA) {
    slotA = new Audio();
    slotA.preload = "auto";
    slotB = new Audio();
    slotB.preload = "auto";
  }
  return [slotA!, slotB!];
}

function cancelFade() {
  if (fadeRaf !== null) {
    cancelAnimationFrame(fadeRaf);
    fadeRaf = null;
  }
}

function rampVolume(
  audio: HTMLAudioElement,
  from: number,
  to: number,
  ms: number,
  onDone?: () => void
) {
  cancelFade();
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    audio.volume = from + (to - from) * t;
    if (t < 1) fadeRaf = requestAnimationFrame(tick);
    else {
      fadeRaf = null;
      onDone?.();
    }
  };
  fadeRaf = requestAnimationFrame(tick);
}

function pauseAndReset(audio: HTMLAudioElement) {
  audio.pause();
  audio.currentTime = 0;
  audio.volume = 0;
}

function playWhenReady(audio: HTMLAudioElement, onReady: () => void) {
  if (audio.readyState >= 2) onReady();
  else audio.addEventListener("canplaythrough", onReady, { once: true });
}

/** Warm caches so arrow-key swaps don't hitch. */
export function preloadCharacterThemes(): void {
  if (typeof window === "undefined") return;
  for (const id of CHARACTER_IDS) {
    const probe = new Audio(CHARACTER_THEMES[id].src);
    probe.preload = "auto";
    probe.load();
  }
}

export function enterCharacterSelect(id: CharacterId): void {
  if (typeof window === "undefined") return;

  stopCharacterSelectBgm();
  const theme = CHARACTER_THEMES[id];
  const [a] = ensureSlots();
  a.src = theme.src;
  a.loop = theme.loop ?? true;
  a.volume = 0;
  active = a;
  currentId = id;

  playWhenReady(a, () => {
    if (active !== a || currentId !== id) return;
    void a.play().catch(() => {});
    rampVolume(a, 0, theme.volume, ENTER_FADE_MS);
  });
}

export function switchCharacterTrack(id: CharacterId): void {
  if (typeof window === "undefined") return;
  if (currentId === id) return;

  if (!active) {
    enterCharacterSelect(id);
    return;
  }

  const theme = CHARACTER_THEMES[id];
  const [a, b] = ensureSlots();
  const outgoing = active;
  const incoming = outgoing === a ? b : a;

  incoming.src = theme.src;
  incoming.loop = theme.loop ?? true;
  incoming.volume = 0;

  const startCrossfade = () => {
    if (currentId === id) return;

    cancelFade();
    const outStart = outgoing.volume;
    const inTarget = theme.volume;

    void incoming.play().catch(() => {});

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / CROSSFADE_MS);
      outgoing.volume = outStart * (1 - t);
      incoming.volume = inTarget * t;

      if (t < 1) {
        fadeRaf = requestAnimationFrame(tick);
        return;
      }

      fadeRaf = null;
      pauseAndReset(outgoing);
      active = incoming;
      currentId = id;
    };
    fadeRaf = requestAnimationFrame(tick);
  };

  playWhenReady(incoming, startCrossfade);
}

export function leaveCharacterSelect(onDone?: () => void): void {
  if (typeof window === "undefined" || !active) {
    onDone?.();
    return;
  }

  cancelFade();
  const out = active;
  const vol = out.volume;
  rampVolume(out, vol, 0, LEAVE_FADE_MS, () => {
    stopCharacterSelectBgm();
    onDone?.();
  });
}

export function stopCharacterSelectBgm(): void {
  cancelFade();
  currentId = null;
  active = null;
  if (slotA) pauseAndReset(slotA);
  if (slotB) pauseAndReset(slotB);
}

export function isCharacterSelectBgmPlaying(): boolean {
  return active !== null;
}
