/**
 * Story intro audio — VO only (no BGM). Gesture-primed autoplay + cleanup.
 */

import { STORY_SCENES } from "@/lib/storyIntro";

let vo: HTMLAudioElement | null = null;
let sceneTimers: number[] = [];
let gesturePrimed = false;
let timelineRunning = false;
const voCache = new Map<number, HTMLAudioElement>();

function clearSceneTimers() {
  sceneTimers.forEach((id) => window.clearTimeout(id));
  sceneTimers = [];
}

function pauseAndReset(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

/** Warm image + voice caches before Lock In when possible */
export function preloadStoryAssets(): void {
  if (typeof window === "undefined") return;

  for (let i = 0; i < STORY_SCENES.length; i++) {
    const scene = STORY_SCENES[i]!;
    const img = new window.Image();
    img.src = scene.image;

    if (!voCache.has(i)) {
      const clip = new Audio(scene.voice);
      clip.preload = "auto";
      clip.load();
      voCache.set(i, clip);
    }
  }
}

function playVo(sceneIndex: number): void {
  const scene = STORY_SCENES[sceneIndex];
  if (!scene) return;

  if (vo && vo !== voCache.get(sceneIndex)) {
    pauseAndReset(vo);
  }

  const cached = voCache.get(sceneIndex);
  if (cached) {
    vo = cached;
    vo.currentTime = 0;
  } else {
    vo = new Audio(scene.voice);
    vo.preload = "auto";
    voCache.set(sceneIndex, vo);
  }

  void vo.play().catch(() => {});
}

/**
 * Call synchronously inside Lock In click handler (user gesture).
 * Starts scene-0 VO so autoplay policy is satisfied.
 */
export function primeStoryIntroFromGesture(): void {
  if (typeof window === "undefined") return;

  stopStoryIntroAudio();
  preloadStoryAssets();
  playVo(0);
  gesturePrimed = true;
}

export function isStoryIntroPrimed(): boolean {
  return gesturePrimed;
}

/** Advance slides on fixed durationMs schedule */
export function startStoryIntroTimeline(
  onSceneChange: (index: number) => void,
  onComplete: () => void
): void {
  if (typeof window === "undefined" || timelineRunning) return;
  timelineRunning = true;
  clearSceneTimers();

  let index = 0;
  onSceneChange(index);

  const scheduleFrom = (sceneIndex: number) => {
    const scene = STORY_SCENES[sceneIndex];
    if (!scene) {
      finishTimeline(onComplete);
      return;
    }

    const id = window.setTimeout(() => {
      const next = sceneIndex + 1;
      if (next >= STORY_SCENES.length) {
        finishTimeline(onComplete);
        return;
      }

      index = next;
      if (next > 0 || !gesturePrimed) {
        playVo(next);
      }
      onSceneChange(index);
      scheduleFrom(next);
    }, scene.durationMs);

    sceneTimers.push(id);
  };

  scheduleFrom(index);
}

function finishTimeline(onComplete: () => void) {
  timelineRunning = false;
  clearSceneTimers();
  pauseAllVo();
  onComplete();
}

function pauseAllVo() {
  if (vo) pauseAndReset(vo);
  vo = null;
  for (const clip of voCache.values()) {
    clip.pause();
    clip.currentTime = 0;
  }
}

export function skipStoryIntro(): void {
  timelineRunning = false;
  clearSceneTimers();
  pauseAllVo();
  gesturePrimed = false;
}

export function stopStoryIntroAudio(): void {
  timelineRunning = false;
  clearSceneTimers();
  pauseAllVo();
  gesturePrimed = false;
}
