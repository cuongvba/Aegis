import type { InteractiveVisualLesson } from './visualLessonPresets';

export interface ShortsSceneStep {
  label: string;
  narration: string;
  formula: string;
  caption: string;
  paramFrom: number;
  paramTo: number;
}

export function buildShortsScenes(
  mode: 'SECANT_TANGENT' | 'ACTIVE_LESSON',
  lesson: InteractiveVisualLesson,
  lang: string,
): ShortsSceneStep[] {
  const isEn = lang.startsWith('en');
  if (mode === 'SECANT_TANGENT') {
    return isEn
      ? [
          {
            label: '1/4 • The Paradox',
            narration: 'How can you find the slope at just ONE single point on a curve?',
            formula: 'm = (y2 - y1) / (x2 - x1) = 0 / 0 ?',
            caption: 'Slope at ONE point? Division by zero!',
            paramFrom: 2.3,
            paramTo: 2.3,
          },
          {
            label: '2/4 • Secant Line',
            narration: 'Pick a second point Q nearby. Now we have a secant line connecting P and Q.',
            formula: 'm_sec = [f(x + dx) - f(x)] / dx',
            caption: 'Start with a secant line between P and Q',
            paramFrom: 2.3,
            paramTo: 1.4,
          },
          {
            label: '3/4 • Limit dx -> 0',
            narration: 'Now slide Q closer and closer to P as delta x shrinks toward zero.',
            formula: 'dx -> 0  |  Q -> P',
            caption: 'Watch delta x shrink toward zero...',
            paramFrom: 1.4,
            paramTo: 0.04,
          },
          {
            label: '4/4 • The Tangent!',
            narration: 'In the limit, the secant line transforms into the exact tangent line: the derivative!',
            formula: "f'(x) = lim (dx->0) [f(x+dx)-f(x)] / dx",
            caption: 'The Secant becomes the Tangent Line!',
            paramFrom: 0.04,
            paramTo: 0.01,
          },
        ]
      : [
          {
            label: '1/4 • Nghịch lý',
            narration: 'Làm sao tính được độ dốc của đường cong tại duy nhất một điểm?',
            formula: 'k = (y2 - y1) / (x2 - x1) = 0 / 0 ?',
            caption: 'Độ dốc tại 1 điểm? Chia cho 0!',
            paramFrom: 2.3,
            paramTo: 2.3,
          },
          {
            label: '2/4 • Đường Cát tuyến',
            narration: 'Hãy chọn thêm điểm Q lân cận để tạo thành đường cát tuyến nối P và Q.',
            formula: 'k_cat = [f(x + dx) - f(x)] / dx',
            caption: 'Kẻ đường cát tuyến nối hai điểm P và Q',
            paramFrom: 2.3,
            paramTo: 1.4,
          },
          {
            label: '3/4 • Giới hạn dx -> 0',
            narration: 'Bây giờ cho điểm Q trượt dần về P khi khoảng cách delta x thu hẹp về không.',
            formula: 'dx -> 0  |  Q -> P',
            caption: 'Quan sát delta x tiến dần về 0...',
            paramFrom: 1.4,
            paramTo: 0.04,
          },
          {
            label: '4/4 • Tiếp tuyến!',
            narration: 'Tại giới hạn, cát tuyến biến thành tiếp tuyến chính xác. Đó chính là đạo hàm!',
            formula: "f'(x) = lim (dx->0) [f(x+dx)-f(x)] / dx",
            caption: 'Cát tuyến đã hóa thành Tiếp tuyến!',
            paramFrom: 0.04,
            paramTo: 0.01,
          },
        ];
  }

  return [
    {
      label: `1/3 • ${lesson.subjectLabel}`,
      narration: lesson.title,
      formula: lesson.spec.title || lesson.title,
      caption: lesson.title,
      paramFrom: 0.1,
      paramTo: 0.4,
    },
    {
      label: '2/3 • Biến thiên 60fps',
      narration: lesson.summary,
      formula: 't: 0 -> 2π  |  60fps Morph',
      caption: lesson.summary.slice(0, 88),
      paramFrom: 0.4,
      paramTo: 1.8,
    },
    {
      label: '3/3 • Khám phá',
      narration: lesson.discoveryPrompt,
      formula: 'Aegis Visual Lab 60fps',
      caption: lesson.discoveryPrompt.slice(0, 88),
      paramFrom: 1.8,
      paramTo: 2.4,
    },
  ];
}

export function drawShortsFrame(
  ctx: CanvasRenderingContext2D,
  scene: ShortsSceneStep,
  progress: number,
  mode: 'SECANT_TANGENT' | 'ACTIVE_LESSON',
  title: string,
) {
  const W = 540;
  const H = 960;
  const eased = 1 - Math.pow(1 - Math.max(0, Math.min(1, progress)), 3);
  const param = scene.paramFrom + (scene.paramTo - scene.paramFrom) * eased;

  // Deep 3Blue1Brown-inspired studio backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#050814');
  bg.addColorStop(0.5, '#0b1224');
  bg.addColorStop(1, '#040710');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Header badge
  ctx.fillStyle = '#38bdf822';
  ctx.beginPath();
  ctx.roundRect(28, 28, W - 56, 42, 21);
  ctx.fill();
  ctx.fillStyle = '#7dd3fc';
  ctx.font = '700 15px Inter, system-ui, sans-serif';
  ctx.fillText(`AEGIS SHORTS • ${scene.label}`, 48, 54);

  // Upper Stage: Coordinate Graph (y: 100..540)
  const ox = 155;
  const oy = 465;
  const scale = 88;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let gx = 40; gx < W - 40; gx += 44) {
    ctx.beginPath(); ctx.moveTo(gx, 105); ctx.lineTo(gx, 520); ctx.stroke();
  }
  for (let gy = 110; gy < 520; gy += 44) {
    ctx.beginPath(); ctx.moveTo(35, gy); ctx.lineTo(W - 35, gy); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(35, oy); ctx.lineTo(W - 35, oy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ox, 105); ctx.lineTo(ox, 520); ctx.stroke();

  if (mode === 'SECANT_TANGENT') {
    const f = (x: number) => 0.35 * x * x + 0.3;
    // Curve f(x)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let px = 45; px <= W - 45; px += 4) {
      const x = (px - ox) / scale;
      const y = f(x);
      const py = oy - y * scale;
      if (px === 45) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const x1 = 1.0;
    const y1 = f(x1);
    const dx = Math.max(0.01, param);
    const x2 = x1 + dx;
    const y2 = f(x2);
    const slope = (y2 - y1) / dx;
    const isTangent = dx < 0.12;

    // Secant / Tangent Line
    ctx.strokeStyle = isTangent ? '#fbbf24' : '#f43f5e';
    ctx.lineWidth = isTangent ? 4 : 3;
    ctx.beginPath();
    const lx1 = -0.8;
    const lx2 = 3.8;
    ctx.moveTo(ox + lx1 * scale, oy - (y1 + slope * (lx1 - x1)) * scale);
    ctx.lineTo(ox + lx2 * scale, oy - (y1 + slope * (lx2 - x1)) * scale);
    ctx.stroke();

    // Points P and Q
    const drawDot = (x: number, y: number, color: string, label: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(ox + x * scale, oy - y * scale, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 16px Inter, system-ui, sans-serif';
      ctx.fillText(label, ox + x * scale + 12, oy - y * scale - 10);
    };
    drawDot(x1, y1, '#34d399', 'P');
    if (!isTangent) drawDot(x2, y2, '#fb7185', `Q (dx=${dx.toFixed(2)})`);
  } else {
    // Dynamic harmonic wave morph for any Visual Lab lesson
    ctx.strokeStyle = '#a78bfa';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let px = 45; px <= W - 45; px += 4) {
      const x = (px - ox) / scale;
      const y = 1.4 + Math.sin(x * 2.2 + param * 3.0) * 0.9 + Math.cos(x * 1.1 - param) * 0.4;
      const py = oy - y * scale;
      if (px === 45) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Formula Card (y: 555..665)
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(28, 555, W - 56, 108, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fde68a';
  ctx.font = '700 21px "Consolas", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(scene.formula.slice(0, 38), W / 2, 616);

  // Big Shorts Caption Box (y: 690..875)
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 28px Inter, system-ui, sans-serif';
  const words = scene.caption.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > W - 80 && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  lines.slice(0, 3).forEach((ln, idx) => ctx.fillText(ln, W / 2, 745 + idx * 42));

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 13px Inter, system-ui, sans-serif';
  ctx.fillText(title.slice(0, 48), W / 2, 915);
  ctx.textAlign = 'left';

  // Progress bar
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, H - 8, W, 8);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(0, H - 8, W * Math.max(0.02, Math.min(1, progress)), 8);
}

export async function exportShortsVideo(
  canvas: HTMLCanvasElement,
  scenes: ShortsSceneStep[],
  lang: string,
  mode: 'SECANT_TANGENT' | 'ACTIVE_LESSON',
  title: string,
  onSceneIndex: (idx: number) => void,
  onProgress: (p: number) => void,
): Promise<void> {
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  const audioDest = audioCtx.createMediaStreamDestination();

  // Gentle 432Hz V-OS background bed
  const bg = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bg.type = 'sine';
  bg.frequency.value = 108;
  bgGain.gain.value = 0.03;
  bg.connect(bgGain);
  bgGain.connect(audioDest);
  bg.start();

  const stream = new MediaStream([
    ...canvas.captureStream(30).getVideoTracks(),
    ...audioDest.stream.getAudioTracks(),
  ]);
  const mimes = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
  const mime = mimes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';
  const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
  const recorder = new MediaRecorder(stream, { mimeType: mime });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  const done = new Promise<Blob>((r) => { recorder.onstop = () => r(new Blob(chunks, { type: mime.split(';')[0] })); });

  const buffers = await Promise.all(scenes.map(async (sc) => {
    try {
      const res = await fetch('/api/kids/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sc.narration, localeCode: lang }),
      });
      if (res.status !== 200) return null;
      return await audioCtx.decodeAudioData(await res.arrayBuffer());
    } catch { return null; }
  }));

  recorder.start();
  try {
    for (let i = 0; i < scenes.length; i++) {
      onSceneIndex(i);
      const buf = buffers[i];
      let stepMs = 2400;
      if (buf) {
        const src = audioCtx.createBufferSource();
        src.buffer = buf;
        src.connect(audioDest);
        src.start();
        stepMs = Math.max(2000, Math.ceil(buf.duration * 1000) + 300);
      }
      const start = Date.now();
      while (Date.now() - start < stepMs) {
        onProgress((Date.now() - start) / stepMs);
        await new Promise((r) => setTimeout(r, 40));
      }
      onProgress(1);
    }
  } finally {
    try { bg.stop(); } catch {}
    recorder.stop();
  }

  const blob = await done;
  await audioCtx.close();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aegis_shorts_${mode.toLowerCase()}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}
