import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileUp, Sparkles, CheckCircle2, Zap, ArrowRight,
  ClipboardPaste, RotateCcw, FileText
} from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';

interface DropzoneSample {
  id: string;
  labelKey: string;
  rawSnippet: string;
  parsedContent: string;
  parseTimeMs: string;
  storageSaved: string;
}

const SAMPLES: DropzoneSample[] = [
  {
    id: 'math',
    labelKey: 'hero.dropzone.btnSampleMath',
    rawSnippet: '[MTEF_v5_OLE_BINARY: 0105000002000000080000004571756174696f6e2e44534d5434]\nCâu 1: Cho hàm số f(x) liên tục. Tính I = \\int_{0}^{\\pi/4} \\tan x \\cdot f(\\cos^2 x) dx.',
    parsedContent: 'Cho hàm số $f(x)$ liên tục trên $\\mathbb{R}$ thỏa mãn $\\int_{0}^{1} f(x) \\, dx = 3$. Tính giá trị của biểu thức:\n$$I = \\int_{0}^{\\pi/4} \\tan x \\cdot f(\\cos^2 x) \\, dx$$\n* **A.** $I = \\frac{3}{2}$   * **B.** $I = 3$   * **C.** $I = 6$   * **D.** $I = \\frac{1}{3}$',
    parseTimeMs: '1.18',
    storageSaved: '99.4%',
  },
  {
    id: 'chem',
    labelKey: 'hero.dropzone.btnSampleChem',
    rawSnippet: '[WORD_TABLE_XML: 3 rows x 3 cols + Subscripts embedded]\nFe3O4 + HNO3 -> Fe(NO3)3 + NO + H2O. Khảo sát bảng nồng độ:',
    parsedContent: 'Cân bằng phương trình phản ứng oxi hóa - khử sau:\n$$3\\text{Fe}_3\\text{O}_4 + 28\\text{HNO}_3 \\longrightarrow 9\\text{Fe}(\\text{NO}_3)_3 + \\text{NO} \\uparrow + 14\\text{H}_2\\text{O}$$\n\n| Thời điểm (phút) | $[\\text{Fe}^{3+}]$ (M) | Vận tốc phản ứng $v$ |\n| :--- | :--- | :--- |\n| $t = 0$ | $0.00$ | $0.12 \\times 10^{-2}$ |\n| $t = 15$ | $0.45$ | $0.08 \\times 10^{-2}$ |',
    parseTimeMs: '1.32',
    storageSaved: '99.1%',
  },
  {
    id: 'gdpt',
    labelKey: 'hero.dropzone.btnSampleGdpt',
    rawSnippet: '[DOCX_GDPT_2025: 4 sub-items progressive scoring + fraction]\nXét tính đúng/sai của hàm số phân thức y = (2x - 1)/(x + 1):',
    parsedContent: 'Cho hàm số $y = f(x) = \\frac{2x - 1}{x + 1}$. Xét tính đúng/sai của các khẳng định sau:\n* **a)** Tập xác định của hàm số là $\\mathcal{D} = \\mathbb{R} \\setminus \\{-1\\}$. *(Đúng)*\n* **b)** Đồ thị có tiệm cận đứng $x = -1$ và tiệm cận ngang $y = 2$. *(Đúng)*\n* **c)** Hàm số đồng biến trên toàn trục số $\\mathbb{R}$. *(Sai)*\n* **d)** Tiếp tuyến tại hoành độ $x_0 = 0$ có hệ số góc $k = 3$. *(Đúng)*',
    parseTimeMs: '1.05',
    storageSaved: '99.6%',
  },
];

export const HeroWordDropzone: React.FC = () => {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();
  const [activeSample, setActiveSample] = useState<DropzoneSample | null>(SAMPLES[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const triggerSample = useCallback((sample: DropzoneSample) => {
    setIsScanning(true);
    setActiveSample(sample);
    setTimeout(() => {
      setIsScanning(false);
    }, 180);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // Auto simulate lightning parse on dropped file
    triggerSample(SAMPLES[0]);
  }, [triggerSample]);

  return (
    <div className="pt-8 max-w-4xl mx-auto text-left">
      <div className="rounded-3xl border border-cyan-500/40 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-900/90 backdrop-blur-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden relative">
        {/* Optical Scanning Line Animation */}
        {isScanning && (
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse z-30 pointer-events-none top-0" />
        )}

        {/* Top Header Bar */}
        <div className="px-5 sm:px-7 py-4 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="ms-2 text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={14} className="text-cyan-400 fill-cyan-400" />
              {t('hero.dropzone.badge')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeSample && (
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-mono font-bold flex items-center gap-1">
                ⚡ {activeSample.parseTimeMs}ms • -{activeSample.storageSaved} DB
              </span>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-5">
          {/* Drag & Drop Prompt + Sample Buttons */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-4 transition-all duration-200 flex flex-col sm:flex-row items-center justify-between gap-4 ${
              dragActive
                ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
                : 'border-slate-800 hover:border-cyan-500/50 bg-slate-950/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                <FileUp size={20} />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">
                  {t('hero.dropzone.dropPrompt')}
                </p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ClipboardPaste size={11} /> {t('hero.dropzone.pasteHint')}
                </p>
              </div>
            </div>

            {/* Quick 1-Click Samples */}
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {SAMPLES.map(sample => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => triggerSample(sample)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSample?.id === sample.id
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-black'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {t(sample.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Side-by-Side Deconstruction Display */}
          {activeSample && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Left: Raw Messy Input */}
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText size={12} className="text-amber-400" />
                    {t('hero.dropzone.rawWordTitle')}
                  </div>
                  <pre className="font-mono text-[11px] text-slate-400 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {activeSample.rawSnippet}
                  </pre>
                </div>
                <div className="pt-3 border-t border-slate-900 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>MTEF v5 Binary Stream</span>
                  <span className="text-amber-400 font-mono">1.2 MB DOCX</span>
                </div>
              </div>

              {/* Right: Perfect Vector KaTeX + Markdown Output */}
              <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/20 p-4 space-y-2 flex flex-col justify-between shadow-lg shadow-cyan-950/20">
                <div>
                  <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-cyan-400" />
                      {t('hero.dropzone.parsedTitle')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                      {t('hero.dropzone.metricIntegrity')}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-100 leading-relaxed py-1">
                    <MathRenderer content={activeSample.parsedContent} />
                  </div>
                </div>

                <div className="pt-3 border-t border-cyan-500/20 text-[10px] text-cyan-400/80 flex items-center justify-between">
                  <span>Vector SVG 60fps</span>
                  <span className="font-mono text-cyan-300 font-bold">420 Bytes (-99.4%)</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400 shrink-0" />
              <span>
                Không cần tạo tài khoản để thử nghiệm bóc tách đề thi thực tế!
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/creator/studio')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('hero.dropzone.btnOpenStudio')}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

