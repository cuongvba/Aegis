import type { NotebookVideoSlideDto } from '@/services/notebook.service';

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxW && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function drawSlideCanvas(
  ctx: CanvasRenderingContext2D,
  slide: NotebookVideoSlideDto,
  deckTitle: string,
  total: number,
  progress: number,
  tick: number,
) {
  const W = 960;
  const H = 540;
  const accent = slide.accentColor || '#6366f1';

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#090d1a');
  bg.addColorStop(0.55, '#11182c');
  bg.addColorStop(1, '#070a14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const pulse = 0.5 + 0.5 * Math.sin(tick * 0.04);
  const glow = ctx.createRadialGradient(780, 120, 20, 780, 120, 290 + pulse * 30);
  glow.addColorStop(0, `${accent}3d`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 15px Inter, system-ui, sans-serif';
  ctx.fillText(`AEGIS NOTEBOOK • ${deckTitle.slice(0, 48)}`, 48, 44);

  ctx.fillStyle = `${accent}33`;
  ctx.beginPath();
  ctx.roundRect(W - 148, 22, 100, 30, 15);
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '700 13px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SLIDE ${slide.slideNumber}/${total}`, W - 98, 42);
  ctx.textAlign = 'left';

  ctx.fillStyle = `${accent}26`;
  ctx.beginPath();
  ctx.roundRect(48, 76, 68, 68, 18);
  ctx.fill();
  ctx.font = '38px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(slide.visualEmoji || '✨', 82, 123);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 30px Inter, system-ui, sans-serif';
  const titleLines = wrapLines(ctx, slide.title, 740).slice(0, 2);
  titleLines.forEach((line, i) => ctx.fillText(line, 134, 106 + i * 36));

  let y = 192;
  slide.bulletPoints.slice(0, 4).forEach((bp, idx) => {
    const threshold = idx * 0.14;
    const alpha = Math.max(0.18, Math.min(1, (progress - threshold) / 0.25 + 0.35));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(60, y - 6, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 20px Inter, system-ui, sans-serif';
    const lines = wrapLines(ctx, bp, 810).slice(0, 2);
    lines.forEach((ln) => {
      ctx.fillText(ln, 80, y);
      y += 28;
    });
    y += 10;
  });
  ctx.globalAlpha = 1;

  if (slide.highlightQuote) {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(48, H - 104, W - 96, 58, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'italic 600 17px Inter, system-ui, sans-serif';
    const q = slide.highlightQuote.length > 92
      ? `${slide.highlightQuote.slice(0, 89)}...`
      : slide.highlightQuote;
    ctx.fillText(`💡 ${q}`, 68, H - 69);
  }

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, H - 6, W, 6);
  ctx.fillStyle = accent;
  ctx.fillRect(0, H - 6, W * Math.max(0.02, Math.min(1, progress)), 6);
}

async function fetchSlideAudioBuffer(
  audioCtx: AudioContext,
  slide: NotebookVideoSlideDto,
  locale: string,
): Promise<AudioBuffer | null> {
  const text = (slide.narrationText || slide.title).trim();
  if (!text) return null;
  try {
    const res = await fetch('/api/kids/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, locale, voiceId: slide.voiceId || undefined }),
    });
    if (res.status !== 200) return null;
    const arr = await res.arrayBuffer();
    if (arr.byteLength === 0) return null;
    return await audioCtx.decodeAudioData(arr);
  } catch {
    return null;
  }
}

function playSoftTransitionChime(audioCtx: AudioContext, dest: MediaStreamAudioDestinationNode) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.18);
  gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
  osc.connect(gain);
  gain.connect(dest);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.36);
}

export async function exportAudioMuxedWebm(
  canvas: HTMLCanvasElement,
  slides: NotebookVideoSlideDto[],
  title: string,
  language: string,
  onSlideChange: (idx: number) => void,
  onProgress: (p: number) => void,
  preferredFormat: 'mp4' | 'webm' = 'mp4',
): Promise<'mp4' | 'webm'> {
  const locale = language === 'en' ? 'en-US' : 'vi-VN';
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  const audioDest = audioCtx.createMediaStreamDestination();
  const videoStream = canvas.captureStream(30);
  const combined = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...audioDest.stream.getAudioTracks(),
  ]);

  const mp4Mimes = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
  ];
  const webmMimes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  const candidateMimes = preferredFormat === 'mp4' ? [...mp4Mimes, ...webmMimes] : webmMimes;
  const mimeType = candidateMimes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  const actualExt: 'mp4' | 'webm' = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
  const recorder = new MediaRecorder(combined, { mimeType });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: actualExt === 'mp4' ? 'video/mp4' : 'video/webm' }));
  });

  // Pre-fetch Neural TTS buffers in parallel for smooth zero-gap muxing
  const audioBuffers = await Promise.all(
    slides.map((s) => fetchSlideAudioBuffer(audioCtx, s, locale)),
  );

  // Subtle 432Hz V-OS ambient drone bed (-22dB) underneath Neural TTS voiceover
  const bgOsc1 = audioCtx.createOscillator();
  const bgOsc2 = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc1.type = 'sine';
  bgOsc2.type = 'triangle';
  bgOsc1.frequency.setValueAtTime(108, audioCtx.currentTime); // 432Hz / 4
  bgOsc2.frequency.setValueAtTime(161.8, audioCtx.currentTime);
  bgGain.gain.setValueAtTime(0.035, audioCtx.currentTime);
  bgOsc1.connect(bgGain);
  bgOsc2.connect(bgGain);
  bgGain.connect(audioDest);
  bgOsc1.start();
  bgOsc2.start();

  recorder.start();
  try {
    for (let i = 0; i < slides.length; i++) {
      onSlideChange(i);
      const buf = audioBuffers[i];
      playSoftTransitionChime(audioCtx, audioDest);

      let stepMs = 2200;
      if (buf) {
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        src.connect(audioDest);
        src.start();
        stepMs = Math.max(2000, Math.ceil(buf.duration * 1000) + 350);
      }

      const start = Date.now();
      while (Date.now() - start < stepMs) {
        onProgress((Date.now() - start) / stepMs);
        await new Promise((r) => setTimeout(r, 50));
      }
      onProgress(1);
    }
  } finally {
    try { bgOsc1.stop(); bgOsc2.stop(); } catch {}
    recorder.stop();
  }

  const blob = await done;
  await audioCtx.close();

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_overview.${actualExt}`;
  a.click();
  URL.revokeObjectURL(url);
  return actualExt;
}
