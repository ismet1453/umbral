/** Web Audio synthesizer for auth / system notification UI */

let audioCtx: AudioContext | null = null;
let bgmDuckHandler: ((depth: number, ms: number) => void) | null = null;

export function registerBgmDuckHandler(
  fn: (depth: number, ms: number) => void
): void {
  bgmDuckHandler = fn;
}

function duckBgmForSfx(): void {
  bgmDuckHandler?.(0.5, 150);
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

export function unlockAuthAudio(): void {
  void getCtx()?.resume();
}

/** Shared context for auth SFX + gate BGM */
export function getAuthAudioContext(): AudioContext | null {
  return getCtx();
}

function tone(
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  freqEnd?: number
): void {
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(freqEnd, 1),
      start + duration
    );
  }
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
  if (volume >= 0.04) duckBgmForSfx();
}

/** Panel slides in — low whoosh + cyan chime */
export function playPanelReveal(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  try {
    const bufferSize = Math.floor(ctx.sampleRate * 0.35);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.25;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.3);
    filter.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.36);

    tone(523, now + 0.08, 0.4, "sine", 0.1);
    tone(784, now + 0.12, 0.35, "triangle", 0.06);
    tone(1046, now + 0.18, 0.3, "sine", 0.05);
  } catch {
    /* blocked */
  }
}

/** NOTIFICATION header appears */
export function playNotificationAlarm(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(880, now, 0.15, "square", 0.04);
  tone(1108, now + 0.08, 0.2, "sine", 0.08);
  tone(1320, now + 0.14, 0.25, "sine", 0.06);
}

/** Question text fade-in */
export function playQuestionPulse(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(440, now, 0.2, "sine", 0.05);
  tone(554, now + 0.06, 0.25, "triangle", 0.04);
}

/** Form section appears */
export function playFormReady(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(659, now, 0.18, "sine", 0.06);
  tone(880, now + 0.05, 0.22, "sine", 0.04, 660);
}

let lastTick = 0;
/** Keyboard tick while typing name */
export function playTypeTick(): void {
  const now = Date.now();
  if (now - lastTick < 45) return;
  lastTick = now;

  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(1200 + Math.random() * 200, t, 0.04, "square", 0.018);
}

/** Generic UI button */
export function playUiClick(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(620, now, 0.08, "square", 0.05);
  tone(380, now + 0.02, 0.1, "sine", 0.03);
}

/** Wallet connect button */
export function playWalletConnect(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(330, now, 0.12, "sine", 0.06);
  tone(440, now + 0.08, 0.15, "sine", 0.07);
  tone(554, now + 0.16, 0.2, "triangle", 0.08);
  tone(880, now + 0.24, 0.35, "sine", 0.1, 440);
}

/** YES / accept quest */
export function playAcceptQuest(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(523, now, 0.12, "sine", 0.08);
  tone(659, now + 0.1, 0.12, "sine", 0.09);
  tone(784, now + 0.2, 0.15, "sine", 0.1);
  tone(1046, now + 0.32, 0.4, "triangle", 0.12, 520);
}

/** Gate first-click — soft system pulse (not Metin2 taiko) */
export function playGateBum(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  try {
    const bufSize = Math.floor(ctx.sampleRate * 0.18);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.12;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.12);
    filter.Q.value = 1.2;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.04, now);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.22);

    tone(65, now, 0.22, "sine", 0.035, 42);
    tone(880, now + 0.06, 0.35, "sine", 0.045);
    tone(1046, now + 0.1, 0.4, "triangle", 0.032, 740);
    tone(523, now + 0.16, 0.5, "sine", 0.025, 392);
  } catch {
    /* blocked */
  }
}

/** NO / decline */
export function playDecline(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(220, now, 0.25, "sawtooth", 0.06, 110);
  tone(165, now + 0.12, 0.35, "sine", 0.08, 80);
}

/** Invalid input */
export function playInputError(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(180, now, 0.1, "square", 0.1);
  tone(140, now + 0.1, 0.15, "square", 0.08);
}

/** Character card select */
export function playCharacterSelect(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(698, now, 0.1, "sine", 0.06);
  tone(932, now + 0.06, 0.15, "triangle", 0.05);
}

/** Subtle tick while boot typewriter runs */
export function playBootCharTick(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(900 + Math.random() * 80, now, 0.025, "square", 0.012);
}

/** Initial power-up sweep — plays once on boot start */
export function playBootPowerUp(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  try {
    // Low electric hum that ramps up
    tone(55, now, 1.8, "sawtooth", 0.05, 110);
    tone(110, now + 0.2, 1.4, "sawtooth", 0.04, 220);

    // Noise burst (static charge)
    const bufSize = Math.floor(ctx.sampleRate * 0.6);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize) * 0.35;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(3200, now + 0.5);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.65);

    // Rising synth chord
    tone(130, now + 0.4, 1.2, "sine", 0.07, 260);
    tone(196, now + 0.55, 1.0, "triangle", 0.05, 392);
    tone(261, now + 0.7, 0.9, "sine", 0.04, 523);

    // Final cyan ping
    tone(1046, now + 1.5, 0.5, "sine", 0.08, 523);
    tone(1318, now + 1.6, 0.4, "triangle", 0.05, 659);
  } catch { /* blocked */ }
}

/** Glitch burst when last typewriter message starts */
export function playBootGlitch(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  try {
    // Rapid-fire noise pops
    for (let i = 0; i < 5; i++) {
      const t = now + i * 0.07;
      tone(200 + Math.random() * 600, t, 0.04, "square", 0.06 - i * 0.01);
    }
    // Low thud
    tone(80, now, 0.15, "sawtooth", 0.09, 40);
    // High crackle
    tone(2200 + Math.random() * 400, now + 0.05, 0.06, "square", 0.04);
  } catch { /* blocked */ }
}

/** "ACCESS GRANTED" fanfare */
export function playBootAccessGranted(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  try {
    // Ascending chord sweep
    tone(523, now,       0.18, "sine",     0.09);
    tone(659, now + 0.1, 0.18, "sine",     0.10);
    tone(784, now + 0.2, 0.20, "sine",     0.11);
    tone(1046,now + 0.3, 0.25, "triangle", 0.12);
    tone(1318,now + 0.45,0.4,  "sine",     0.10, 659);

    // Warm pad sustain
    tone(261, now + 0.1, 0.9, "triangle", 0.06, 130);
    tone(392, now + 0.2, 0.8, "sine",     0.05, 196);

    // Noise wash (success swoosh)
    const bufSize = Math.floor(ctx.sampleRate * 0.5);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const t = i / bufSize;
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.18;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(4000, now + 0.4);
    filter.Q.value = 1.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    noise.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.55);
  } catch { /* blocked */ }
}

/** Schedule staggered reveal sounds (matches CSS fade delays) */
export function scheduleAuthRevealSounds(): () => void {
  unlockAuthAudio();
  playPanelReveal();

  const t1 = window.setTimeout(playNotificationAlarm, 300);
  const t2 = window.setTimeout(playQuestionPulse, 1200);
  const t3 = window.setTimeout(playFormReady, 2500);

  return () => {
    window.clearTimeout(t1);
    window.clearTimeout(t2);
    window.clearTimeout(t3);
  };
}
