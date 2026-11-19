import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, FileBarChart2, Loader2, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { speakExamSegments, stopKidSpeech } from '@/components/kids/kidsSpeech';
import { officeWorkspaceService } from '@/services/officeWorkspace.service';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  markdown: string;
}

const READER_LANGS = [
  { code: 'vi-VN', label: 'Tiếng Việt' },
  { code: 'en-US', label: 'English' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'ko-KR', label: '한국어' },
  { code: 'zh-CN', label: '中文' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'es-ES', label: 'Español' },
  { code: 'de-DE', label: 'Deutsch' },
];

const THEME_CLASSES = {
  light: 'bg-white text-slate-900 border-slate-200',
  sepia: 'bg-[#f4ecd8] text-[#3d3121] border-[#e2d4b5]',
  dark: 'bg-slate-950 text-slate-100 border-slate-800',
};

export const DocumentOverviewAndReaderModal: React.FC<Props> = ({ open, onClose, title, markdown }) => {
  const [tab, setTab] = useState<'READER' | 'OVERVIEW'>('READER');
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('sepia');
  const [fontSize, setFontSize] = useState(17);
  const [lang, setLang] = useState('vi-VN');
  const [speaking, setSpeaking] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => () => stopKidSpeech(), []);

  const telemetry = useMemo(() => {
    const raw = markdown || '';
    const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
    const readMinutes = Math.max(1, Math.ceil(words / 200));
    const formulas = (raw.match(/\$[^$\n]+\$/g) || []).length;
    const images = (raw.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
    const headings = raw.split('\n').map((l) => l.trim()).filter((l) => /^#{1,3}\s+/.test(l));
    const pages = Math.max(1, (raw.match(/---page---/g) || []).length + Math.ceil(words / 450));
    return { words, readMinutes, formulas, images, headings, pages };
  }, [markdown]);

  if (!open) return null;

  const toggleSpeak = () => {
    if (speaking) {
      stopKidSpeech();
      setSpeaking(false);
      return;
    }
    const paragraphs = (markdown || '')
      .split(/\n{2,}/)
      .map((p) => p.replace(/!\[[^\]]*\]\([^)]+\)/g, ' ').trim())
      .filter((p) => p.length > 0 && p !== '---page---');
    if (paragraphs.length === 0) return;
    setSpeaking(true);
    void speakExamSegments(paragraphs, lang, () => setSpeaking(false));
  };

  const generateOverview = async () => {
    setAiBusy(true);
    try {
      const res = await officeWorkspaceService.runAiAssist({
        action: 'SUMMARY',
        title,
        markdownContent: markdown,
      });
      setAiSummary(res.resultMarkdown);
    } catch {
      setAiSummary('Không thể kết nối AI lúc này. Vui lòng xem thống kê cấu trúc bên trên.');
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('READER')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${tab === 'READER' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Chế độ Đọc Tập Trung
            </button>
            <button
              onClick={() => setTab('OVERVIEW')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${tab === 'OVERVIEW' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              <FileBarChart2 className="w-3.5 h-3.5" /> Tổng quan Tài liệu
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-200"
              title="Ngôn ngữ giọng đọc"
            >
              {READER_LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <button
              onClick={toggleSpeak}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${speaking ? 'bg-rose-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
            >
              {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              {speaking ? 'Dừng đọc' : 'Nghe đọc (Cả Toán)'}
            </button>
            <button onClick={() => { stopKidSpeech(); onClose(); }} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {tab === 'READER' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                {(['light', 'sepia', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-2.5 py-1 rounded-lg border font-semibold ${theme === t ? 'border-sky-400 bg-sky-500/20 text-white' : 'border-slate-700 text-slate-400'}`}
                  >
                    {t === 'light' ? 'Giấy trắng' : t === 'sepia' ? 'Sepia dịu mắt' : 'Đêm tối'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span>Cỡ chữ: {fontSize}px</span>
                <button onClick={() => setFontSize((s) => Math.max(13, s - 1))} className="px-2 py-0.5 rounded bg-slate-800">-</button>
                <button onClick={() => setFontSize((s) => Math.min(24, s + 1))} className="px-2 py-0.5 rounded bg-slate-800">+</button>
              </div>
            </div>

            <article
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
              className={`max-w-3xl mx-auto rounded-2xl border p-6 sm:p-10 shadow-xl ${THEME_CLASSES[theme]}`}
            >
              <h1 className="text-2xl font-black mb-4 pb-3 border-b border-current/15">{title}</h1>
              <MathRenderer content={markdown.replace(/---page---/g, '\n\n---\n\n')} />
            </article>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-lg font-black text-sky-400">{telemetry.words}</div><div className="text-[11px] text-slate-400">Số từ</div></div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-lg font-black text-emerald-400">~{telemetry.readMinutes} phút</div><div className="text-[11px] text-slate-400">Thời gian đọc</div></div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-lg font-black text-violet-400">{telemetry.pages}</div><div className="text-[11px] text-slate-400">Trang A4</div></div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-lg font-black text-amber-400">{telemetry.formulas}</div><div className="text-[11px] text-slate-400">Công thức Toán</div></div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-lg font-black text-rose-400">{telemetry.images}</div><div className="text-[11px] text-slate-400">Hình minh họa</div></div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-lg font-black text-cyan-400">{telemetry.headings.length}</div><div className="text-[11px] text-slate-400">Đề mục</div></div>
            </div>

            {telemetry.headings.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                <div className="text-xs font-bold text-slate-300">Khung Xương Nội Dung</div>
                <ul className="space-y-1 text-xs text-slate-300">
                  {telemetry.headings.slice(0, 12).map((h, i) => <li key={i} className="truncate">• {h.replace(/^#+\s*/, '')}</li>)}
                </ul>
              </div>
            )}

            <div className="rounded-2xl border border-violet-500/30 bg-slate-950/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-300">Tóm tắt Điều hành AI</span>
                <button
                  onClick={generateOverview}
                  disabled={aiBusy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white"
                >
                  {aiBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {aiBusy ? 'Đang tổng hợp...' : 'Sinh Tổng Quan AI'}
                </button>
              </div>
              {aiSummary && (
                <div className="rounded-xl bg-slate-900 p-4 text-sm text-slate-200 border border-slate-800">
                  <MathRenderer content={aiSummary} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
