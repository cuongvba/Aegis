import { speakKidText, stopKidSpeech } from '@/components/kids/kidsSpeech';

/**
 * [ADVS 0ms Web Audio & Neural Voice Narration Engine]
 * Tổng hợp âm thanh phụ họa không độ trễ (zero external assets) cho đồ thị biến đổi theo thời gian:
 * - Chime pha (Phase Transition Chime) khi t đi qua từng mốc biến đổi KaTeX
 * - Tương tác nút Play/Pause/Scrub
 * - Thuyết minh giọng đọc Neural tiếng Việt theo từng bước biến đổi
 */
class VisualAudioEngine {
  private ctx: AudioContext | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public playTone(freq: number, durationSec = 0.12, volume = 0.06, type: OscillatorType = 'sine') {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  }

  public playPhaseChime() {
    this.playTone(587.33, 0.14, 0.06, 'sine');
    window.setTimeout(() => this.playTone(880, 0.2, 0.05, 'triangle'), 70);
  }

  public playToggleClick(active: boolean) {
    this.playTone(active ? 523.25 : 392.0, 0.08, 0.05, 'triangle');
  }

  public speakNote(text?: string, lang = 'vi-VN') {
    if (!text) return;
    speakKidText(text, lang);
  }

  public stopAllVoice() {
    stopKidSpeech();
  }
}

export const visualAudioEngine = new VisualAudioEngine();
