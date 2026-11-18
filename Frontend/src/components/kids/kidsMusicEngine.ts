// Zero-latency Web Audio Synthesizer for Kids World melodies, xylophone notes, and fairy-tale SFX

let sharedAudioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    sharedAudioCtx = new AudioCtor();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playXylophoneNote(freq: number, duration = 0.35, wave: OscillatorType = 'triangle', volume = 0.24) {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  } catch {
    // Ignore audio context restrictions
  }
}

export const XYLOPHONE_NOTES = [
  { label: 'Đồ', freq: 261.63, color: 'from-rose-400 to-rose-500' },
  { label: 'Rê', freq: 293.66, color: 'from-orange-400 to-orange-500' },
  { label: 'Mi', freq: 329.63, color: 'from-amber-400 to-amber-500' },
  { label: 'Pha', freq: 349.23, color: 'from-emerald-400 to-emerald-500' },
  { label: 'Son', freq: 392.00, color: 'from-cyan-400 to-cyan-500' },
  { label: 'La', freq: 440.00, color: 'from-blue-400 to-blue-500' },
  { label: 'Si', freq: 493.88, color: 'from-indigo-400 to-indigo-500' },
  { label: 'Đố', freq: 523.25, color: 'from-purple-400 to-purple-500' },
];

const MELODY_PRESETS: Record<string, Array<[number, number]>> = {
  twinkle: [
    [261.63, 0.32], [261.63, 0.32], [392.00, 0.32], [392.00, 0.32],
    [440.00, 0.32], [440.00, 0.32], [392.00, 0.6],
    [349.23, 0.32], [349.23, 0.32], [329.63, 0.32], [329.63, 0.32],
    [293.66, 0.32], [293.66, 0.32], [261.63, 0.65],
  ],
  happy: [
    [261.63, 0.22], [329.63, 0.22], [392.00, 0.22], [523.25, 0.36],
    [392.00, 0.22], [440.00, 0.22], [523.25, 0.55],
  ],
};

export function playKidMelody(preset: 'twinkle' | 'happy' = 'twinkle'): () => void {
  const notes = MELODY_PRESETS[preset] || MELODY_PRESETS.twinkle;
  const timers: number[] = [];
  let offsetMs = 0;

  notes.forEach(([freq, dur]) => {
    const id = window.setTimeout(() => playXylophoneNote(freq, dur + 0.1, 'triangle', 0.2), offsetMs);
    timers.push(id);
    offsetMs += dur * 1000;
  });

  return () => timers.forEach((id) => window.clearTimeout(id));
}

export function playStageSfx(type: 'pop' | 'splash' | 'unwrap' | 'bounce' = 'pop') {
  if (type === 'pop') {
    playXylophoneNote(587.33, 0.08, 'sine', 0.3);
    window.setTimeout(() => playXylophoneNote(880.0, 0.14, 'triangle', 0.25), 55);
  } else if (type === 'unwrap') {
    playXylophoneNote(523.25, 0.12, 'triangle', 0.22);
    window.setTimeout(() => playXylophoneNote(659.25, 0.12, 'triangle', 0.22), 70);
    window.setTimeout(() => playXylophoneNote(783.99, 0.2, 'sine', 0.24), 140);
  } else if (type === 'splash') {
    playXylophoneNote(392.0, 0.12, 'sine', 0.22);
    window.setTimeout(() => playXylophoneNote(523.25, 0.18, 'sine', 0.2), 65);
  } else {
    playXylophoneNote(329.63, 0.12, 'triangle', 0.25);
    window.setTimeout(() => playXylophoneNote(493.88, 0.18, 'triangle', 0.25), 80);
  }
}
