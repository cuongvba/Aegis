import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Copy, Disc3, Music, Pause, Play, Sparkles } from 'lucide-react';
import { vosMusicService, type VosMusicCompilationResultDto } from '@/services/vosMusic.service';
import { VosQuantumSynthEngine, drawVosSynesthesiaFrame } from '@/components/music/vosQuantumSynth';

const PRESETS = [
  'Đêm huyền không tĩnh mịch, ánh trăng uya tan vào sương thu...',
  'Sắt thép vỡ nát! Ánh chớp xé toạc bầu trời kỹ thuật số!',
  'Mênh mang dòng chảy ngân hà, tiếng sáo khẽ vọng giữa ngàn mây...',
];

export const VosSonicStudioPage: React.FC = () => {
  const [inputText, setInputText] = useState(PRESETS[0]);
  const [mode, setMode] = useState<'MUSE' | 'ARCHITECT'>('MUSE');
  const [tuningHz, setTuningHz] = useState<432 | 528 | 440>(432);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VosMusicCompilationResultDto | null>(null);
  const [activeTab, setActiveTab] = useState<'SUNO' | 'LYRIA' | 'OMNI' | 'EXPORT'>('SUNO');
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const synthRef = useRef<VosQuantumSynthEngine | null>(null);

  useEffect(() => {
    void handleCompile();
    return () => synthRef.current?.stop();
  }, []);

  useEffect(() => {
    if (!result) return;
    let raf = 0;
    let tick = 0;
    const loop = () => {
      tick++;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawVosSynesthesiaFrame(ctx, result.synthRecipe, result.telemetry, tick, playing);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [result, playing]);

  const handleCompile = async () => {
    if (!inputText.trim() || loading) return;
    setLoading(true);
    try {
      const data = await vosMusicService.compile({ inputText, mode, tuningHz, language: 'vi' });
      setResult(data);
      if (playing) {
        synthRef.current?.start(data.synthRecipe, data.telemetry);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSynth = () => {
    if (!result) return;
    if (!synthRef.current) synthRef.current = new VosQuantumSynthEngine();
    if (playing) {
      synthRef.current.stop();
      setPlaying(false);
    } else {
      synthRef.current.start(result.synthRecipe, result.telemetry);
      setPlaying(true);
    }
  };

  const copyText = (key: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  };

  const t = result?.telemetry;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-100">
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-slate-950 via-violet-950/30 to-slate-950 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-violet-600/20 border border-violet-400/30 text-violet-300">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Aegis V-OS Sonic Studio (V-∞G 7D Music Forge)</h1>
            <p className="text-xs text-slate-400">
              Biên dịch 7 Chiều Tiếng Việt $\rightarrow$ Suno v5.5/v6+, Google Lyria, Omni Veo & Web Audio Synth 432Hz/528Hz
            </p>
          </div>
        </div>
        {result && (
          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-violet-500/15 border border-violet-400/30 text-violet-200 font-semibold">
              {t?.dominantVibeLabel}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Ý niệm / Thơ / Kịch bản Tiếng Việt</span>
              <div className="flex gap-1">
                {PRESETS.map((p, i) => (
                  <button key={i} onClick={() => setInputText(p)} className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300">
                    Mẫu {i + 1}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={4}
              className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-sm text-white focus:outline-none focus:border-violet-500"
              placeholder="Nhập câu thơ, ý niệm hoặc lời bài giảng tiếng Việt..."
            />
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex gap-1.5">
                {(['MUSE', 'ARCHITECT'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${mode === m ? 'bg-violet-600 border-violet-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                  >
                    MODE: {m}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                {([432, 528, 440] as const).map((hz) => (
                  <button
                    key={hz}
                    onClick={() => setTuningHz(hz)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${tuningHz === hz ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                  >
                    {hz}Hz
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleCompile}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-95 font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Đang biên dịch 7 chiều V-OS...' : 'Biên dịch V-OS 7D & Sinh Nhạc'}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <Disc3 className={`w-4 h-4 ${playing ? 'animate-spin' : ''}`} />
                Web Audio V-OS Quantum Synth ({tuningHz}Hz)
              </span>
              <button
                onClick={toggleSynth}
                disabled={!result}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white"
              >
                {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {playing ? 'Dừng Synth' : 'Nghe Rung Động V-OS'}
              </button>
            </div>
            <canvas ref={canvasRef} width={480} height={150} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
            {t && (
              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                <div className="p-2 rounded bg-slate-900">Ngang: {(t.ngangRatio * 100).toFixed(0)}%</div>
                <div className="p-2 rounded bg-slate-900">Huyền: {(t.huyenRatio * 100).toFixed(0)}%</div>
                <div className="p-2 rounded bg-slate-900">Sắc: {(t.sacRatio * 100).toFixed(0)}%</div>
                <div className="p-2 rounded bg-slate-900">Nặng: {(t.nangRatio * 100).toFixed(0)}%</div>
                <div className="p-2 rounded bg-slate-900">Hỏi: {(t.hoiRatio * 100).toFixed(0)}%</div>
                <div className="p-2 rounded bg-slate-900">Ngã: {(t.ngaRatio * 100).toFixed(0)}%</div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {result && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-4">
              <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
                {(['SUNO', 'LYRIA', 'OMNI', 'EXPORT'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === tab ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                  >
                    {tab === 'SUNO' && 'Suno v5.5 / v6+'}
                    {tab === 'LYRIA' && 'Google Lyria / MusicFX'}
                    {tab === 'OMNI' && 'Omni Veo + Nano Banana 2'}
                    {tab === 'EXPORT' && 'Markdown / CSV'}
                  </button>
                ))}
              </div>

              {activeTab === 'SUNO' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="font-semibold text-violet-300 mb-1">Song Title</div>
                    <div className="text-white font-medium">{result.sunoMasterPack.songTitle}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-violet-300">Styles Prompt</span>
                      <button onClick={() => copyText('styles', result.sunoMasterPack.stylesPrompt)} className="text-cyan-300 inline-flex items-center gap-1">
                        <Copy className="w-3 h-3" /> {copied === 'styles' ? 'Đã chép' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{result.sunoMasterPack.stylesPrompt}</p>
                    <div className="text-slate-400 pt-1">Exclude: {result.sunoMasterPack.excludeStyles} • Weirdness: {result.sunoMasterPack.weirdness} • Influence: {result.sunoMasterPack.styleInfluence}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-violet-300">Lyrics Box (V-OS Tags `[[ ]]`)</span>
                      <button onClick={() => copyText('lyrics', result.sunoMasterPack.lyricsBoxWithTags)} className="text-cyan-300 inline-flex items-center gap-1">
                        <Copy className="w-3 h-3" /> {copied === 'lyrics' ? 'Đã chép' : 'Copy'}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap text-slate-200 font-sans leading-relaxed">{result.sunoMasterPack.lyricsBoxWithTags}</pre>
                  </div>
                </div>
              )}

              {activeTab === 'LYRIA' && (
                <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap">{result.lyriaPrompt}</pre>
              )}

              {activeTab === 'OMNI' && (
                <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap">{result.omniMultimodalPrompt}</pre>
              )}

              {activeTab === 'EXPORT' && (
                <div className="space-y-3">
                  <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap">{result.sunoMasterPack.markdownExport}</pre>
                  <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-emerald-300 whitespace-pre-wrap">{result.sunoMasterPack.csvRow}</pre>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  Tài liệu Cơ sở V-OS Đang Tham Chiếu Trực Tiếp (Embedded Kernel SSoT):
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {result.groundedKernelSources.map((doc) => (
                    <div key={doc.fileName} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px]">
                      <div className="font-semibold text-amber-300 truncate">{doc.fileName}</div>
                      <div className="text-slate-400 truncate">{doc.title}</div>
                      <div className="text-slate-500 mt-0.5">{doc.characterCount.toLocaleString()} ký tự</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VosSonicStudioPage;
