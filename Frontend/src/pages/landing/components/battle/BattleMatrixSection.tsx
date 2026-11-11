import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Crown, CheckCircle2, XCircle, AlertTriangle,
  Sparkles, ArrowRight, Zap, Shield, Cpu
} from 'lucide-react';

interface NormalizedMatrixRow {
  title: string;
  criterion: string;
  aegis: string;
  gameshowTools: string;
  traditionalLms: string;
  genericAi: string;
}

export const BattleMatrixSection: React.FC = () => {
  const { t } = useTranslation('landing');
  const navigate = useNavigate();
  const matrix = (t('features.matrix', { returnObjects: true }) as any) || {};

  const rows: NormalizedMatrixRow[] = useMemo(() => {
    const rawRows = Array.isArray(matrix.rows) ? matrix.rows : [];
    return rawRows.map((r: any, idx: number) => {
      const criterionText = r.criterion || r.criteria || `Trụ cột ${idx + 1}`;
      const shortTitle = criterionText.split('(')[0]?.trim() || criterionText;
      return {
        title: shortTitle,
        criterion: criterionText,
        aegis: r.aegis || '',
        gameshowTools: r.gameshowTools || r.kahoot || '',
        traditionalLms: r.traditionalLms || r.lms || '',
        genericAi: r.genericAi || r.ai || '',
      };
    });
  }, [matrix]);

  const [filterIdx, setFilterIdx] = useState<number | 'all'>('all');
  const filteredRows = filterIdx === 'all' ? rows : rows.filter((_, idx) => idx === filterIdx);

  const colCriterion = matrix.colCriterion || matrix.columns?.criteria || 'Trụ Cột Năng Lực Cốt Lõi';
  const colAegis = matrix.colAegis || matrix.columns?.aegis || 'AEGIS GLOBAL (AGCI)';
  const colGameshow = matrix.colGameshow || matrix.columns?.kahoot || 'Kahoot! / Quizizz';
  const colLms = matrix.colLms || matrix.columns?.lms || 'Moodle / Canvas LMS';
  const colAi = matrix.colAi || matrix.columns?.ai || 'ChatGPT / NotebookLM';

  return (
    <section id="battle-matrix" className="py-20 sm:py-28 relative bg-slate-950 border-t border-slate-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <Crown size={14} className="text-amber-400" />
            <span>{matrix.badge || matrix.eyebrow || 'Category-King Battle Matrix'}</span>
          </span>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {matrix.title || 'Aegis Global vs. 4 Hệ Thống Truyền Thống'}
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {matrix.subtitle ||
              'So sánh trực diện 6 trụ cột năng lực công nghệ và sư phạm giữa Aegis với các ứng dụng Quiz đơn điệu, LMS cũ kỹ và Chatbot AI thông thường.'}
          </p>
        </div>

        {/* Quantified Supremacy KPI Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-cyan-950/20 to-slate-900 p-5 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
              <Zap size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tốc Độ Bóc Tách &amp; Chuông</div>
              <div className="text-2xl font-black text-cyan-300">&lt;2ms <span className="text-xs text-slate-400 font-normal">(Nhanh gấp 100x)</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 p-5 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Cpu size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Chỉ Số Đồng Thuận AI</div>
              <div className="text-2xl font-black text-indigo-300">SCI 98.4% <span className="text-xs text-slate-400 font-normal">(Chống ảo giác)</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 p-5 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Shield size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tiết Kiệm Dung Lượng CSDL</div>
              <div className="text-2xl font-black text-emerald-300">99.2% <span className="text-xs text-slate-400 font-normal">(Vector LaTeX)</span></div>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            type="button"
            onClick={() => setFilterIdx('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterIdx === 'all'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Tất cả 6 Trụ Cột
          </button>
          {rows.map((row, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setFilterIdx(idx)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer truncate max-w-[200px] ${
                filterIdx === idx
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {row.title}
            </button>
          ))}
        </div>

        {/* The Matrix Table */}
        <div className="overflow-x-auto rounded-3xl border border-slate-800/90 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-wider">
                <th className="py-4 px-5 text-slate-400 w-[28%]">{colCriterion}</th>
                <th className="py-4 px-5 bg-gradient-to-b from-cyan-950/70 to-slate-950/90 border-x border-cyan-500/40 text-cyan-300 w-[28%] shadow-inner">
                  <div className="flex items-center gap-2 text-sm font-black text-white">
                    <Crown size={16} className="text-amber-400 fill-amber-400" />
                    <span>{colAegis}</span>
                  </div>
                </th>
                <th className="py-4 px-5 text-slate-400 w-[15%]">{colGameshow}</th>
                <th className="py-4 px-5 text-slate-400 w-[14%]">{colLms}</th>
                <th className="py-4 px-5 text-slate-400 w-[15%]">{colAi}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredRows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-200">{r.criterion}</td>
                  <td className="py-4 px-5 bg-cyan-950/30 border-x border-cyan-500/30 text-white font-bold">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-cyan-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{r.aegis}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-400">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{r.gameshowTools}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-400">
                    <div className="flex items-start gap-2">
                      <XCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{r.traditionalLms}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-400">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{r.genericAi}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Matrix CTA Footer */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => navigate('/creator/studio')}
            className="px-8 py-3.5 rounded-full font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 shadow-lg shadow-amber-500/25 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={16} className="fill-slate-950" />
            <span>Trải Nghiệm Chuẩn Mực Aegis Ngay</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default BattleMatrixSection;
