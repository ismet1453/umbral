/**
 * Gate BGM — cyber / Solo Leveling system ambient (procedural).
 * Tuned to sit UNDER authAudio SFX; no Metin2 MP3.
 *
 * Optional: set mode to "shadowborn" after placing /audio/shadowborn.mp3
 */

import {
  getAuthAudioContext,
  unlockAuthAudio,
  registerBgmDuckHandler,
} from "@/lib/authAudio";

const LOOP_SEC = 32;
const FADE_IN_MS = 2800;
const FADE_OUT_MS = 2200;

/** BGM master — keep low so UI clicks stay audible */
const GATE_VOL = 0.1;
const CHARACTER_VOL = 0.14;

type BgmMode = "procedural" | "shadowborn";
type Scene = "idle" | "gate" | "character";

/** Switch to "shadowborn" when you drop a licensed track in public/audio */
const BGM_MODE: BgmMode = "procedural";

const SHADOWBORN = {
  src: "/audio/shadowborn.mp3",
  loopStart: 0,
  loopEnd: 18,
  gateVol: 0.16,
  characterVol: 0.22,
  lowpassHz: 4200,
} as const;

type MelodyNote = {
  at: number;
  freq: number;
  dur: number;
  vol: number;
  wave: OscillatorType;
};

/** Sparse cyan arpeggio — matches notification chimes */
const MELODY: MelodyNote[] = [
  { at: 0, freq: 880, dur: 2.8, vol: 0.012, wave: "sine" },
  { at: 4.2, freq: 1046.5, dur: 2.2, vol: 0.01, wave: "triangle" },
  { at: 8.5, freq: 784, dur: 2.6, vol: 0.011, wave: "sine" },
  { at: 12.8, freq: 659.25, dur: 2.0, vol: 0.009, wave: "sine" },
  { at: 16.5, freq: 523.25, dur: 3.2, vol: 0.012, wave: "triangle" },
  { at: 21.0, freq: 880, dur: 2.4, vol: 0.01, wave: "sine" },
  { at: 25.5, freq: 1318.5, dur: 2.8, vol: 0.009, wave: "sine" },
  { at: 29.5, freq: 1046.5, dur: 2.2, vol: 0.008, wave: "triangle" },
];

let scene: Scene = "idle";
let playing = false;
let master: GainNode | null = null;
let duckGain: GainNode | null = null;
let drones: OscillatorNode[] = [];
let windSrc: AudioBufferSourceNode | null = null;
let loopTimer: number | null = null;
let fadeRaf: number | null = null;
let loopAnchor = 0;
let loopGeneration = 0;
let targetVol: number = GATE_VOL;
let duckTimer: number | null = null;

let mp3Audio: HTMLAudioElement | null = null;
let mp3Source: MediaElementAudioSourceNode | null = null;

function cancelFade() {
  if (fadeRaf !== null) {
    cancelAnimationFrame(fadeRaf);
    fadeRaf = null;
  }
}

function rampMaster(to: number, ms: number, onDone?: () => void) {
  if (!master) {
    onDone?.();
    return;
  }
  cancelFade();
  const from = master.gain.value;
  const start = performance.now();
  const tick = (now: number) => {
    if (!master) return;
    const t = Math.min(1, (now - start) / ms);
    master.gain.value = from + (to - from) * t;
    if (t < 1) fadeRaf = requestAnimationFrame(tick);
    else {
      fadeRaf = null;
      onDone?.();
    }
  };
  fadeRaf = requestAnimationFrame(tick);
}

function sceneVolume(): number {
  if (BGM_MODE === "shadowborn") {
    return scene === "character"
      ? SHADOWBORN.characterVol
      : SHADOWBORN.gateVol;
  }
  return scene === "character" ? CHARACTER_VOL : GATE_VOL;
}

/** Brief dip when UI SFX fire — keeps clicks readable */
export function duckAuthBgm(depth = 0.55, ms = 140): void {
  if (!playing || !duckGain) return;
  if (duckTimer !== null) window.clearTimeout(duckTimer);
  const ctx = getAuthAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  duckGain.gain.cancelScheduledValues(now);
  duckGain.gain.setValueAtTime(duckGain.gain.value, now);
  duckGain.gain.linearRampToValueAtTime(depth, now + 0.04);
  duckGain.gain.linearRampToValueAtTime(1, now + ms / 1000);
}

function playMelodyNote(
  ctx: AudioContext,
  bus: GainNode,
  time: number,
  freq: number,
  dur: number,
  vol: number,
  wave: OscillatorType
) {
  const osc = ctx.createOscillator();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, time);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1800;
  filter.Q.value = 0.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.35);
  gain.gain.setValueAtTime(vol * 0.7, time + dur * 0.6);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(bus);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}

function scheduleLoop(
  ctx: AudioContext,
  index: number,
  gen: number,
  bus: GainNode
) {
  if (!playing || gen !== loopGeneration) return;

  const base = loopAnchor + index * LOOP_SEC;
  for (const n of MELODY) {
    playMelodyNote(ctx, bus, base + n.at, n.freq, n.dur, n.vol, n.wave);
  }
}

function startAmbientLayers(ctx: AudioContext, bus: GainNode) {
  startDrones(ctx, bus);
  startWind(ctx, bus);
  loopAnchor = ctx.currentTime + 0.4;
  loopGeneration += 1;
  const gen = loopGeneration;
  let index = 0;
  const tick = () => {
    if (!playing || gen !== loopGeneration) return;
    scheduleLoop(ctx, index, gen, bus);
    index += 1;
    loopTimer = window.setTimeout(tick, (LOOP_SEC - 0.5) * 1000);
  };
  tick();
}

function startDrones(ctx: AudioContext, bus: GainNode) {
  const specs = [
    { freq: 55, vol: 0.006, type: "sawtooth" as const },
    { freq: 110, vol: 0.005, type: "sine" as const },
    { freq: 130.81, vol: 0.007, type: "triangle" as const },
  ];

  for (const s of specs) {
    const osc = ctx.createOscillator();
    osc.type = s.type;
    osc.frequency.value = s.freq;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 260;
    const gain = ctx.createGain();
    gain.gain.value = s.vol;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(bus);
    osc.start();
    drones.push(osc);
  }
}

function startWind(ctx: AudioContext, bus: GainNode) {
  const len = Math.floor(ctx.sampleRate * 3);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.2;

  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 700;
  filter.Q.value = 0.25;
  const gain = ctx.createGain();
  gain.gain.value = 0.0025;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(bus);
  src.start();
  windSrc = src;
}

function attachMp3Loop() {
  if (!mp3Audio) return;
  const onTime = () => {
    if (!mp3Audio || !playing) return;
    if (mp3Audio.currentTime >= SHADOWBORN.loopEnd - 0.1) {
      mp3Audio.currentTime = SHADOWBORN.loopStart + 0.2;
    }
  };
  mp3Audio.addEventListener("timeupdate", onTime);
  return () => mp3Audio?.removeEventListener("timeupdate", onTime);
}

let detachMp3Loop: (() => void) | null = null;

function startShadowbornTrack(ctx: AudioContext, bus: GainNode) {
  mp3Audio = new Audio(SHADOWBORN.src);
  mp3Audio.preload = "auto";
  mp3Audio.currentTime = SHADOWBORN.loopStart;

  mp3Source = ctx.createMediaElementSource(mp3Audio);
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = SHADOWBORN.lowpassHz;
  mp3Source.connect(lowpass);
  lowpass.connect(bus);

  detachMp3Loop = attachMp3Loop() ?? null;

  const play = () => {
    void mp3Audio?.play().catch(() => {
      if (duckGain) startAmbientLayers(ctx, duckGain);
    });
  };
  if (mp3Audio.readyState >= 2) play();
  else {
    mp3Audio.addEventListener("canplaythrough", play, { once: true });
    mp3Audio.addEventListener(
      "error",
      () => {
        if (duckGain) startAmbientLayers(ctx, duckGain);
      },
      { once: true }
    );
  }
}

function teardown() {
  if (loopTimer !== null) {
    window.clearTimeout(loopTimer);
    loopTimer = null;
  }
  if (duckTimer !== null) {
    window.clearTimeout(duckTimer);
    duckTimer = null;
  }
  loopGeneration += 1;
  cancelFade();

  detachMp3Loop?.();
  detachMp3Loop = null;

  for (const osc of drones) {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      /* */
    }
  }
  drones = [];

  if (windSrc) {
    try {
      windSrc.stop();
      windSrc.disconnect();
    } catch {
      /* */
    }
    windSrc = null;
  }

  if (mp3Audio) {
    mp3Audio.pause();
    mp3Audio.src = "";
    mp3Audio = null;
  }
  mp3Source = null;
  duckGain = null;
  master = null;
}

export function startAuthBgm(): void {
  if (typeof window === "undefined" || playing) return;

  unlockAuthAudio();
  const ctx = getAuthAudioContext();
  if (!ctx) return;

  playing = true;
  scene = "gate";
  targetVol = sceneVolume();

  master = ctx.createGain();
  master.gain.value = 0;

  duckGain = ctx.createGain();
  duckGain.gain.value = 1;
  duckGain.connect(master);
  master.connect(ctx.destination);

  if (BGM_MODE === "shadowborn") {
    startShadowbornTrack(ctx, duckGain);
  } else {
    startAmbientLayers(ctx, duckGain);
  }

  rampMaster(targetVol, FADE_IN_MS);
}

registerBgmDuckHandler(duckAuthBgm);

export function setAuthBgmScene(next: "gate" | "character"): void {
  if (!playing || !master) return;
  scene = next;
  targetVol = sceneVolume();
  rampMaster(targetVol, 1000);
}

export function fadeOutAuthBgm(onDone?: () => void, fadeMs = FADE_OUT_MS): void {
  if (!playing || !master) {
    onDone?.();
    return;
  }
  playing = false;
  scene = "idle";
  rampMaster(0, fadeMs, () => {
    teardown();
    onDone?.();
  });
}

export function stopAuthBgm(): void {
  playing = false;
  scene = "idle";
  teardown();
}

export function isAuthBgmPlaying(): boolean {
  return playing;
}
