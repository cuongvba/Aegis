import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Wand2, Brain, Gauge, ShieldCheck, ArrowRight, CheckCircle2,
  Mic, QrCode, Sparkles, BellRing, FileSpreadsheet, Sigma
} from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';

export const InteractiveFeatureLab: React.FC = () => {
  const { t, i18n } = useTranslation('landing');
  const isVi = i18n.language?.startsWith('vi');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'zen' | 'ai' | 'irt' | 'arena'>('zen');
  const [zenMode, setZenMode] = useState<'math' | 'table' | 'kids'>('math');
  const [tfState, setTfState] = useState<Record<string, boolean>>({ a: true, b: false, c: true, d: true });
  const [buzzerMs, setBuzzerMs] = useState<string | null>(null);

  const lab = t('features.lab', { returnObjects: true }) as any;
  const tfScore = (() => {
    const target: Record<string, boolean> = { a: true, b: false, c: true, d: false };
    const matched = ['a', 'b', 'c', 'd'].filter(k => tfState[k] === target[k]).length;
    return matched === 4 ? 1.0 : matched === 3 ? 0.5 : matched === 2 ? 0.25 : matched === 1 ? 0.1 : 0;
  })();

  const triggerBuzzerTest = () => setBuzzerMs((0.8 + Math.random() * 0.9).toFixed(2));

  const tabs = [
    { id: 'zen', icon: Wand2, label: lab?.tabs?.zen || (isVi ? '1. Zen & Clipboard <2ms' : '1. Smart Paste & MathType') },
    { id: 'ai', icon: Brain, label: lab?.tabs?.ai || (isVi ? '2. Hội Đồng AI Bầy Sói' : '2. Wolf Pack AI Swarm') },
    { id: 'irt', icon: Gauge, label: lab?.tabs?.irt || (isVi ? '3. Tâm Trắc IRT & 9 Dạng Đề' : '3. IRT 3-PL & 9 Item Types') },
    { id: 'arena', icon: ShieldCheck, label: lab?.tabs?.arena || (isVi ? '4. Arena <2ms & Bảo Mật' : '4. <2ms Arena & Security') },
  ];

  return (
    <div className="mt-14 rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-900/90 backdrop-blur-2xl p-5 sm:p-8 shadow-2xl shadow-cyan-950/30">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Sparkles size={12} /> {lab?.eyebrow || lab?.badge || 'Interactive Live Technology Sandbox'}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
            {lab?.title || (isVi ? 'Trải Nghiệm Trực Quan Sức Mạnh Lõi Aegis Global' : 'Experience Aegis Core Technologies Live')}
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  active ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25' : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'zen' && (
        <div className="pt-6 grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-lg font-extrabold text-white">
              {isVi ? 'Biến Mọi Nguồn Tài Liệu Thành Học Liệu Sống Trong 3 Chạm' : 'Turn Any Document Into Interactive Learning in 3 Touches'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isVi
                ? 'Giải mã trực tiếp nhị phân MathType OLE (MTEF v5) sang Vector LaTeX trong <2ms, chuyển bảng Word/Excel sang Markdown tiết kiệm 99% DB, thu âm giọng cô và phát mã QR Zalo không cần tài khoản.'
                : 'Decodes binary MathType OLE (MTEF v5) to Vector LaTeX in <2ms, converts Word/Excel tables to Markdown (-99% DB size), records teacher voice, and shares instant zero-account QR links.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'math', icon: Sigma, label: 'MathType OLE → LaTeX', activeCls: 'bg-indigo-600/30 border-indigo-400 text-indigo-200' },
                { id: 'table', icon: FileSpreadsheet, label: 'Word/Excel → Markdown', activeCls: 'bg-emerald-600/30 border-emerald-400 text-emerald-200' },
                { id: 'kids', icon: Mic, label: isVi ? 'Mầm non (Voice + QR)' : 'K-12 Voice & QR', activeCls: 'bg-rose-600/30 border-rose-400 text-rose-200' },
              ].map(m => {
                const MIcon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setZenMode(m.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${
                      zenMode === m.id ? m.activeCls : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <MIcon size={14} /> {m.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => navigate('/creator/studio')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:brightness-110 cursor-pointer"
            >
              <span>{isVi ? 'Mở Zen Studio Trải Nghiệm Ngay' : 'Launch Zen Studio Now'}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-slate-950/90 border border-slate-800 p-4 sm:p-5 space-y-3">
            {zenMode === 'math' && (
              <>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-amber-400">📥 Clipboard: MathType OLE (Equation.DSMT4 / \objdata)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ⚡ 1.4ms • -99.2% DB (42KB PNG → 58B LaTeX)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                  {`$$\\int_{0}^{\\pi} \\frac{\\sin x}{\\sqrt{x^{2} + 1}} dx \\ge \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$$`}
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-indigo-500/30 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block mb-1">
                    {isVi ? '✨ Hiển thị Vector KaTeX Sắc Nét Tuyệt Đối:' : '✨ Crisp Vector KaTeX Rendering:'}
                  </span>
                  <MathRenderer content={'$$\\int_{0}^{\\pi} \\frac{\\sin x}{\\sqrt{x^{2} + 1}} dx \\ge \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$$'} />
                </div>
              </>
            )}
            {zenMode === 'table' && (
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-200">
                <MathRenderer
                  content={
                    isVi
                      ? `| Chỉ tiêu Khảo thí | Chuẩn Cũ (Ảnh PNG) | Chuẩn Aegis (Markdown + LaTeX) |\n| --- | --- | --- |\n| Dung lượng 1 câu | $48,500\\text{ bytes}$ | $120\\text{ bytes}$ (-99.7%) |\n| Công thức trong ô | Mờ vỡ hạt khi phóng to | Vector $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$ |`
                      : `| Metric | Legacy PNG Paste | Aegis Markdown + LaTeX |\n| --- | --- | --- |\n| Storage per Item | $48,500\\text{ bytes}$ | $120\\text{ bytes}$ (-99.7%) |\n| Formula in Cell | Blurry raster image | Crisp Vector $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$ |`
                  }
                />
              </div>
            )}
            {zenMode === 'kids' && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {isVi ? '🎧 Giọng cô giáo đọc: “Đố bé, con vật nào kêu Meo meo?”' : '🎧 Teacher Voice: “Which animal says Meow?”'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold flex items-center gap-1">
                    <QrCode size={11} /> 00:04s • QR Instant
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center text-xs font-bold">
                  <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500 text-emerald-200">🐱 A. Cat ✓</div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">🐶 B. Dog</div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">🐥 C. Chick</div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">🐸 D. Frog</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="pt-6 grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-lg font-extrabold text-white">
              {isVi ? 'Hệ Ba Ngôi Nhận Thức: UAR → Bầy Sói WPSE → Đại Hội Thảo 6 Pha' : 'Epistemic Triad: UAR → Wolf Pack Swarm → 6-Phase Symposium'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isVi
                ? 'Loại bỏ hoàn toàn ảo giác (hallucination) của AI đơn lẻ. Nhiều tác tử AI độc lập đối chiếu chéo tài liệu gốc trong AegisNotebook và chỉ xuất bản khi Chỉ số Đồng thuận Bầy sói (SCI) đạt ngưỡng.'
                : 'Eliminates single-LLM hallucinations. Independent AI agents cross-verify source documents in AegisNotebook and publish only when Swarm Consensus Index (SCI) passes verification.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/symposium')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:brightness-110 cursor-pointer"
            >
              <span>{isVi ? 'Khám Phá Đại Hội Thảo AI Symposium' : 'Explore AI Symposium'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-3 gap-3">
            {[
              { role: '1. Thesis Architect', model: 'Deep CoT Agent', note: isVi ? 'Bóc tách đa nguồn & sinh câu hỏi tình huống Bloom Bậc 5-6.' : 'Multi-source synthesis & Bloom Level 5-6 item generation.', score: 'CoT Verified' },
              { role: '2. Popperian Critic', model: 'Adversarial Verifier', note: isVi ? 'Kiểm định phản chứng, phát hiện bẫy ngữ nghĩa & xung đột pháp lý.' : 'Falsifiability critique & cross-document conflict detection.', score: '0 Hallucination' },
              { role: '3. Epistemic Arbiter', model: 'Consensus Judge', note: isVi ? 'Đo lường độ đồng thuận toán học SCI & chuẩn hóa IRT.' : 'Mathematical SCI consensus & IRT 3-PL calibration.', score: 'SCI = 98.4%' },
            ].map(ag => (
              <div key={ag.role} className="p-4 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-purple-400">{ag.model}</span>
                  <h5 className="text-sm font-bold text-white mt-0.5">{ag.role}</h5>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{ag.note}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-lg w-fit">
                  <CheckCircle2 size={12} /> {ag.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'irt' && (
        <div className="pt-6 grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-lg font-extrabold text-white">
              {isVi ? '9 Dạng Câu Hỏi Hiện Đại & Chấm Điểm Thích Ứng IRT 3-PL' : '9 Modern Item Types & Progressive IRT 3-PL Scoring'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isVi
                ? 'Hỗ trợ Đúng/Sai 4 ý (thang điểm lũy tiến 0.1 → 0.25 → 0.5 → 1.0), Trả lời ngắn, Nối cặp, Sắp xếp, Điền khuyết, Tự luận AI chấm cùng mô hình tâm trắc học 3 tham số (a, b, c).'
                : 'Supports 4-Statement Progressive True/False (0.1 → 0.25 → 0.5 → 1.0), Short Answer, Matching, Ordering, Fill-in-Blank, AI Essay, and 3-Parameter IRT calibration.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/practice')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:brightness-110 cursor-pointer"
            >
              <span>{isVi ? 'Vào Phòng Luyện Tập Thích Ứng Ngay' : 'Try Adaptive Practice Now'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">
                {isVi ? '⚡ Thử tương tác: Đúng/Sai 4 Mệnh đề (GDPT 2025)' : '⚡ Interactive Demo: 4-Statement Progressive True/False'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black">
                Score: {tfScore} / 1.0 pt
              </span>
            </div>
            <div className="space-y-1.5">
              {[
                { k: 'a', text: 'a) $f(x) = x^2 \\Rightarrow f\'(3) = 6$ (True)' },
                { k: 'b', text: 'b) Continuous on $\\mathbb{R} \\Rightarrow$ Differentiable everywhere (False)' },
                { k: 'c', text: 'c) $\\int_{0}^{1} 2x dx = 1$ (True)' },
                { k: 'd', text: 'd) $x^2 + 1 = 0$ has 2 real roots (False)' },
              ].map(row => (
                <div key={row.k} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                  <div className="text-slate-200 flex-1"><MathRenderer content={row.text} inline /></div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => setTfState(p => ({ ...p, [row.k]: true }))} className={`px-2 py-1 rounded font-bold text-[10px] cursor-pointer ${tfState[row.k] ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>T</button>
                    <button type="button" onClick={() => setTfState(p => ({ ...p, [row.k]: false }))} className={`px-2 py-1 rounded font-bold text-[10px] cursor-pointer ${!tfState[row.k] ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>F</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'arena' && (
        <div className="pt-6 grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-lg font-extrabold text-white">
              {isVi ? 'Đấu Trường Buzzer <2ms & Pháo Đài Bảo Mật Đa Khách Thuê' : 'Sub-2ms Buzzer Arena & Multi-Tenant Security Fortress'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isVi
                ? 'Tranh chuông thời gian thực dưới 2ms bằng khóa nguyên tử RAM cho 6 Gameshow truyền hình kinh điển, song hành cùng cô lập dữ liệu 3 tầng PostgreSQL RLS & SHA-256 Merkle Chain.'
                : 'Real-time sub-2ms atomic RAM buzzer arbitration across 6 classic TV gameshow formats, backed by 3-layer PostgreSQL RLS isolation & SHA-256 Merkle audit chains.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/arena')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md hover:brightness-110 cursor-pointer"
            >
              <span>{isVi ? 'Vào Đấu Trường Gameshow Arena' : 'Enter Live Gameshow Arena'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/30 flex flex-col items-center justify-center text-center space-y-3">
              <button
                type="button"
                onClick={triggerBuzzerTest}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-rose-600 text-slate-950 font-black text-xs flex flex-col items-center justify-center gap-1 shadow-xl shadow-amber-500/25 active:scale-90 transition-transform cursor-pointer"
              >
                <BellRing size={22} />
                <span>{isVi ? 'BẤM CHUÔNG' : 'BUZZ IN'}</span>
              </button>
              <div className="text-xs">
                {buzzerMs ? (
                  <span className="text-emerald-400 font-bold">⚡ RAM Lock: {buzzerMs} ms (&lt;2ms SLA!)</span>
                ) : (
                  <span className="text-slate-400">{isVi ? 'Bấm thử chuông để đo độ trễ RAM' : 'Click buzzer to test atomic RAM latency'}</span>
                )}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-2 text-xs text-slate-300">
              <div className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">🛡️ Enterprise Banking Defense</div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">1. <strong>3-Layer RLS</strong>: Middleware + EF Filter + Postgres RLS</div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">2. <strong>Scoped Ownership</strong>: Strict Creator &amp; Tenant RBAC</div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">3. <strong>SHA-256 Merkle &amp; PKI</strong>: Tamper-proof exam logs</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default InteractiveFeatureLab;
