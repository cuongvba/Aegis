import type { VosAcousticTelemetryDto, VosSynthRecipeDto } from '@/services/vosMusic.service';

export class VosQuantumSynthEngine {
  private ctx: AudioContext | null = null;
  private timer: number | null = null;
  private masterGain: GainNode | null = null;
  private oscs: OscillatorNode[] = [];
  private active = false;

  start(recipe: VosSynthRecipeDto, telemetry: VosAcousticTelemetryDto) {
    this.stop();
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') void ctx.resume();

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.24, ctx.currentTime + 1.2);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(recipe.lowPassCutoffHz || 1500, ctx.currentTime);
    filter.Q.setValueAtTime(2.5, ctx.currentTime);

    filter.connect(master);
    master.connect(ctx.destination);

    // Base frequency scaled to 432Hz / 528Hz / 440Hz root (sub-octave + fifth)
    const rootHz = (recipe.baseFreqHz || 432) / 4; // ~108Hz or 132Hz warm drone
    const fifthHz = rootHz * 1.498;
    const drone1 = ctx.createOscillator();
    const drone2 = ctx.createOscillator();
    drone1.type = recipe.visualArchetype === 'CYBER_SHARD' ? 'sawtooth' : 'sine';
    drone2.type = 'triangle';
    drone1.frequency.setValueAtTime(rootHz, ctx.currentTime);
    drone2.frequency.setValueAtTime(fifthHz, ctx.currentTime);

    const g1 = ctx.createGain();
    const g2 = ctx.createGain();
    g1.gain.value = 0.45;
    g2.gain.value = 0.22;
    drone1.connect(g1);
    drone2.connect(g2);
    g1.connect(filter);
    g2.connect(filter);
    drone1.start();
    drone2.start();

    this.ctx = ctx;
    this.masterGain = master;
    this.oscs = [drone1, drone2];
    this.active = true;

    // Generative pentatonic/minor arpeggio driven by V-OS tone distribution
    const scaleRatios = recipe.visualArchetype === 'CHOI_LOA'
      ? [1, 1.189, 1.335, 1.498, 1.782, 2.0]
      : [1, 1.122, 1.335, 1.498, 1.682, 2.0];
    const beatMs = Math.max(240, Math.round((60 / Math.max(50, recipe.tempoBpm)) * 1000));
    let step = 0;

    this.timer = window.setInterval(() => {
      if (!this.active || !this.ctx) return;
      const now = this.ctx.currentTime;
      const ratio = scaleRatios[(step + Math.round(telemetry.sacRatio * 10)) % scaleRatios.length];
      const note = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      note.type = recipe.visualArchetype === 'CYBER_SHARD' ? 'triangle' : 'sine';
      note.frequency.setValueAtTime(rootHz * 2 * ratio, now);

      // Hỏi/Ngã microtonal pitch bend
      if (telemetry.hoiRatio + telemetry.ngaRatio > 0.12 && step % 3 === 1) {
        note.frequency.exponentialRampToValueAtTime(rootHz * 2 * ratio * 1.03, now + 0.35);
      }

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.14 * Math.max(0.4, recipe.brightness), now + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + Math.min(2.2, recipe.reverbSeconds * 0.45));

      note.connect(noteGain);
      noteGain.connect(filter);
      note.start(now);
      note.stop(now + 2.3);

      // Sub-bass pulse on heavy Nặng/Huyền gravity
      if (step % 4 === 0 && recipe.subBassIntensity > 0.45) {
        const sub = this.ctx.createOscillator();
        const subG = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(rootHz * 0.5, now);
        sub.frequency.exponentialRampToValueAtTime(36, now + 0.28);
        subG.gain.setValueAtTime(0.28 * recipe.subBassIntensity, now);
        subG.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        sub.connect(subG);
        subG.connect(master);
        sub.start(now);
        sub.stop(now + 0.38);
      }
      step++;
    }, beatMs);
  }

  stop() {
    this.active = false;
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.oscs.forEach((o) => { try { o.stop(); } catch {} });
    this.oscs = [];
    if (this.ctx) {
      try { void this.ctx.close(); } catch {}
      this.ctx = null;
    }
    this.masterGain = null;
  }
}

export function drawVosSynesthesiaFrame(
  ctx: CanvasRenderingContext2D,
  recipe: VosSynthRecipeDto,
  telemetry: VosAcousticTelemetryDto,
  tick: number,
  isPlaying: boolean,
) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const accent = recipe.accentColor || '#8b5cf6';

  ctx.fillStyle = '#060913';
  ctx.fillRect(0, 0, W, H);

  const speedMul = isPlaying ? 1.35 : 0.45;
  const pulse = 0.5 + 0.5 * Math.sin(tick * 0.08 * speedMul);
  const glow = ctx.createRadialGradient(W / 2, H / 2, 8, W / 2, H / 2, 170 + pulse * 80);
  glow.addColorStop(0, `${accent}77`);
  glow.addColorStop(0.5, `${accent}22`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Cymatics concentric resonance rings
  for (let r = 1; r <= 4; r++) {
    const rad = 18 * r + pulse * 14 * (r % 2 === 0 ? 1 : -0.5);
    ctx.beginPath();
    ctx.strokeStyle = `${accent}${isPlaying ? '66' : '33'}`;
    ctx.lineWidth = 1.5;
    ctx.arc(W / 2, H / 2, Math.max(8, rad), 0, Math.PI * 2);
    ctx.stroke();
  }

  // Orbiting V-OS particles
  for (let i = 0; i < 20; i++) {
    const angle = tick * 0.025 * speedMul + (i * Math.PI * 2) / 20;
    const orbitR = 38 + (i % 4) * 24 + Math.sin(tick * 0.05 + i) * 8;
    const px = W / 2 + Math.cos(angle) * orbitR * 1.9;
    const py = H / 2 + Math.sin(angle) * orbitR * 0.65;
    ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#f472b6';
    ctx.beginPath();
    ctx.arc(px, py, isPlaying ? 2.6 : 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Spectrum equalizer bars
  const barCount = 28;
  const barW = (W - 32) / barCount;
  for (let b = 0; b < barCount; b++) {
    const mag = (0.3 + 0.7 * Math.abs(Math.sin(tick * 0.09 * speedMul + b * 0.45))) * (isPlaying ? 36 : 14);
    ctx.fillStyle = `${accent}55`;
    ctx.fillRect(16 + b * barW, H - 26 - mag, Math.max(3, barW - 4), mag);
  }

  // Draw 3-layer V-OS harmonic waves (Tonal / Vowel / Consonant)
  const layers = [
    { amp: 24 + telemetry.huyenRatio * 55, freq: 0.015, speed: 0.045, color: accent },
    { amp: 16 + telemetry.sacRatio * 60, freq: 0.028, speed: 0.08, color: '#38bdf8' },
    { amp: 12 + telemetry.morphingDiphthongRatio * 65, freq: 0.042, speed: 0.11, color: '#f472b6' },
  ];

  ctx.save();
  ctx.shadowBlur = isPlaying ? 14 : 6;
  layers.forEach((ly) => {
    ctx.beginPath();
    ctx.strokeStyle = ly.color;
    ctx.shadowColor = ly.color;
    ctx.lineWidth = isPlaying ? 2.5 : 1.8;
    for (let x = 0; x <= W; x += 5) {
      const env = Math.sin((x / W) * Math.PI);
      const y = H / 2 + Math.sin(x * ly.freq + tick * ly.speed * speedMul) * ly.amp * env;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
  ctx.restore();

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.fillText(
    `V-OS ${recipe.baseFreqHz}Hz • ${recipe.musicalKey} • ${recipe.tempoBpm} BPM • ${recipe.visualArchetype} ${isPlaying ? '● LIVE SYNTH' : '○ READY'}`,
    16,
    H - 8,
  );
}

function encodeWavPcm16(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const len = buffer.length * numCh * 2;
  const ab = new ArrayBuffer(44 + len);
  const view = new DataView(ab);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + len, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * numCh * 2, true);
  view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, len, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numCh; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
}

export async function exportVosWav(
  recipe: VosSynthRecipeDto,
  telemetry: VosAcousticTelemetryDto,
  durationSec = 16,
  filePrefix = 'aegis_vos_music',
): Promise<void> {
  const sampleRate = 44100;
  const offline = new OfflineAudioContext(2, sampleRate * durationSec, sampleRate);
  const master = offline.createGain();
  master.gain.setValueAtTime(0.001, 0);
  master.gain.exponentialRampToValueAtTime(0.28, 1.0);
  master.gain.setValueAtTime(0.28, durationSec - 1.5);
  master.gain.exponentialRampToValueAtTime(0.001, durationSec);

  const filter = offline.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(recipe.lowPassCutoffHz || 1500, 0);
  filter.Q.setValueAtTime(2.2, 0);
  filter.connect(master);
  master.connect(offline.destination);

  const rootHz = (recipe.baseFreqHz || 432) / 4;
  const d1 = offline.createOscillator();
  const d2 = offline.createOscillator();
  d1.type = recipe.visualArchetype === 'CYBER_SHARD' ? 'sawtooth' : 'sine';
  d2.type = 'triangle';
  d1.frequency.setValueAtTime(rootHz, 0);
  d2.frequency.setValueAtTime(rootHz * 1.498, 0);

  const g1 = offline.createGain();
  const g2 = offline.createGain();
  g1.gain.value = 0.42;
  g2.gain.value = 0.2;
  d1.connect(g1);
  d2.connect(g2);
  g1.connect(filter);
  g2.connect(filter);
  d1.start(0);
  d2.start(0);
  d1.stop(durationSec);
  d2.stop(durationSec);

  const scale = recipe.visualArchetype === 'CYBER_SHARD'
    ? [1, 1.189, 1.335, 1.498, 1.782, 2.0]
    : [1, 1.122, 1.335, 1.498, 1.682, 2.0];
  const stepSec = Math.max(0.28, 60 / Math.max(50, recipe.tempoBpm));
  for (let t = 0.3, s = 0; t < durationSec - 1.2; t += stepSec, s++) {
    const ratio = scale[(s + Math.round(telemetry.sacRatio * 10)) % scale.length];
    const osc = offline.createOscillator();
    const g = offline.createGain();
    osc.type = recipe.visualArchetype === 'CYBER_SHARD' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(rootHz * 2 * ratio, t);
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.15 * Math.max(0.4, recipe.brightness), t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + Math.min(2.0, stepSec * 1.8));
    osc.connect(g);
    g.connect(filter);
    osc.start(t);
    osc.stop(t + 2.1);
  }

  const rendered = await offline.startRendering();
  const wavBlob = encodeWavPcm16(rendered);
  const url = URL.createObjectURL(wavBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filePrefix.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${recipe.baseFreqHz}hz.wav`;
  a.click();
  URL.revokeObjectURL(url);
}
