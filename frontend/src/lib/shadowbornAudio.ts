/**
 * Shadowborn soundtrack — place your file at:
 *   /public/audio/shadowborn.mp3  (or .wav — update SHADOWBORN.src)
 *
 * Tune drop/loop seconds to match your track.
 */
export const SHADOWBORN = {
  src: "/audio/shadowborn.mp3",
  /** Build-up loop region (holds tension until Enter Dungeon) */
  buildUpLoopStart: 0,
  buildUpLoopEnd: 20,
  /** Jump here on Igris cutscene (THE DROP) */
  dropAt: 20,
  introVolume: 0.48,
  dropVolume: 1,
  fadeInMs: 2000,
  fadeOutMs: 2000,
} as const;

type Phase = "idle" | "buildup" | "drop" | "fadeout";

let audio: HTMLAudioElement | null = null;
let phase: Phase = "idle";
let fadeRaf: number | null = null;
let onLoopEnd: (() => void) | null = null;

function cancelFade() {
  if (fadeRaf !== null) {
    cancelAnimationFrame(fadeRaf);
    fadeRaf = null;
  }
}

function fadeTo(target: number, durationMs: number, onDone?: () => void) {
  if (!audio) {
    onDone?.();
    return;
  }
  cancelFade();
  const startVol = audio.volume;
  const start = performance.now();
  const tick = (now: number) => {
    if (!audio) return;
    const t = Math.min(1, (now - start) / durationMs);
    audio.volume = startVol + (target - startVol) * t;
    if (t < 1) {
      fadeRaf = requestAnimationFrame(tick);
    } else {
      fadeRaf = null;
      onDone?.();
    }
  };
  fadeRaf = requestAnimationFrame(tick);
}

function attachBuildUpLoop() {
  if (!audio) return;
  detachBuildUpLoop();
  onLoopEnd = () => {
    if (!audio || phase !== "buildup") return;
    if (audio.currentTime >= SHADOWBORN.buildUpLoopEnd - 0.08) {
      audio.currentTime = SHADOWBORN.buildUpLoopStart + 0.5;
    }
  };
  audio.addEventListener("timeupdate", onLoopEnd);
}

function detachBuildUpLoop() {
  if (audio && onLoopEnd) {
    audio.removeEventListener("timeupdate", onLoopEnd);
  }
  onLoopEnd = null;
}

/** Called when player clicks ENTER THE GATE */
export function startShadowbornBuildUp(): void {
  if (typeof window === "undefined") return;
  stopShadowborn();

  audio = new Audio(SHADOWBORN.src);
  audio.preload = "auto";
  audio.volume = 0;
  audio.currentTime = SHADOWBORN.buildUpLoopStart;
  phase = "buildup";

  attachBuildUpLoop();

  const play = () => {
    if (!audio) return;
    void audio.play().catch(() => {
      /* user gesture already provided via gate button */
    });
    fadeTo(SHADOWBORN.introVolume, SHADOWBORN.fadeInMs);
  };

  if (audio.readyState >= 2) play();
  else audio.addEventListener("canplaythrough", play, { once: true });
}

/** Synced with Igris cutscene — THE DROP */
export function triggerShadowbornDrop(): void {
  if (!audio) return;
  phase = "drop";
  detachBuildUpLoop();
  audio.currentTime = SHADOWBORN.dropAt;
  audio.volume = SHADOWBORN.dropVolume;
  void audio.play().catch(() => {});
}

export function fadeOutShadowborn(onDone?: () => void): void {
  if (!audio || phase === "idle") {
    onDone?.();
    return;
  }
  phase = "fadeout";
  detachBuildUpLoop();
  fadeTo(0, SHADOWBORN.fadeOutMs, () => {
    stopShadowborn();
    onDone?.();
  });
}

export function stopShadowborn(): void {
  cancelFade();
  detachBuildUpLoop();
  if (audio) {
    audio.pause();
    audio.src = "";
    audio = null;
  }
  phase = "idle";
}

export function getShadowbornPhase(): Phase {
  return phase;
}
