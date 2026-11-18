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

  const pulse = isPlaying ? 0.5 + 0.5 * Math.sin(tick * 0.06) : 0.25;
  const glow = ctx.createRadialGradient(W / 2, H / 2, 16, W / 2, H / 2, 190 + pulse * 60);
  glow.addColorStop(0, `${accent}44`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Draw 3-layer V-OS harmonic waves (Tonal / Vowel / Consonant)
  const layers = [
    { amp: 24 + telemetry.huyenRatio * 55, freq: 0.014, speed: 0.03, color: accent },
    { amp: 16 + telemetry.sacRatio * 60, freq: 0.028, speed: 0.06, color: '#38bdf8' },
    { amp: 12 + telemetry.morphingDiphthongRatio * 65, freq: 0.042, speed: 0.09, color: '#f472b6' },
  ];

  layers.forEach((ly) => {
    ctx.beginPath();
    ctx.strokeStyle = ly.color;
    ctx.lineWidth = 2;
    for (let x = 0; x <= W; x += 6) {
      const env = Math.sin((x / W) * Math.PI);
      const y = H / 2 + Math.sin(x * ly.freq + tick * ly.speed * (isPlaying ? 1 : 0.25)) * ly.amp * env;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.fillText(
    `V-OS ${recipe.baseFreqHz}Hz • ${recipe.musicalKey} • ${recipe.tempoBpm} BPM • ${recipe.visualArchetype}`,
    16,
    H - 14,
  );
}
