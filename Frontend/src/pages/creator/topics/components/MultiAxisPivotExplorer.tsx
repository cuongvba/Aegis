import React, { useState } from 'react';
import { Layers, School, GraduationCap, BookOpen, Target, Grid3X3, FolderTree, RotateCcw, ChevronRight } from 'lucide-react';
import type { PivotMode, TopicPivotFilter, TopicPivotSummary } from '@/services/topic-pivot.service';

interface MultiAxisPivotExplorerProps {
  summary: TopicPivotSummary | null;
  filter: TopicPivotFilter;
  selectedTopicCodes: string[] | null;
  onChangeFilter: (next: TopicPivotFilter) => void;
  onSelectTopicCodes: (codes: string[] | null, label?: string) => void;
  activeSliceLabel?: string | null;
}

const PIVOT_MODES: { id: PivotMode; label: string; icon: React.FC<any> }[] = [
  { id: 'grade', label: 'Khối (1–12) × Năm', icon: GraduationCap },
  { id: 'school', label: 'Trường / Sở × Năm', icon: School },
  { id: 'subject', label: 'Môn × Khối', icon: BookOpen },
  { id: 'purpose', label: 'Kỳ thi × Năm', icon: Target },
];

export const MultiAxisPivotExplorer: React.FC<MultiAxisPivotExplorerProps> = ({
  summary,
  filter,
  selectedTopicCodes,
  onChangeFilter,
  onSelectTopicCodes,
  activeSliceLabel,
}) => {
  const [viewTab, setViewTab] = useState<'tree' | 'matrix'>('tree');
  const [expandedL1, setExpandedL1] = useState<string | null>(null);

  if (!summary) return null;

  const hasActiveFilter = Boolean(
    filter.targetLevel || filter.benchmarkYear || filter.issuingOrg || filter.domainCode || filter.assessmentPurpose || selectedTopicCodes
  );

  const resetAll = () => {
    onChangeFilter({ pivotMode: filter.pivotMode, myOnly: filter.myOnly });
    onSelectTopicCodes(null);
    setExpandedL1(null);
  };

  const grades = Array.from(new Set(summary.coverageMatrix.map((c) => c.targetLevel)));
  const years = Array.from(new Set(summary.coverageMatrix.map((c) => c.benchmarkYear)));

  return (
    <div className="bg-slate-900/80 border border-indigo-500/25 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
      {/* Top Bar: 4 Lăng Kính Xoay Trục + Chuyển Tab Cây / Ma Trận */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-300 mr-1">
            <Layers size={14} className="text-indigo-400" />
            Lăng kính Xoay trục:
          </span>
          {PIVOT_MODES.map((m) => {
            const Icon = m.icon;
            const active = filter.pivotMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onChangeFilter({ ...filter, pivotMode: m.id })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/25'
                    : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <Icon size={13} />
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-950 border border-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setViewTab('tree')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewTab === 'tree' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderTree size={13} /> Cây Phân Tầng
            </button>
            <button
              type="button"
              onClick={() => setViewTab('matrix')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewTab === 'matrix' ? 'bg-emerald-600/30 text-emerald-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid3X3 size={13} /> Ma Trận Phủ (Khối × Năm)
            </button>
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition cursor-pointer"
            >
              <RotateCcw size={12} /> Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* 5 Bộ Lọc Tọa Độ Trực Giao Động (Zero Hard-code) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <select
          value={filter.targetLevel || ''}
          onChange={(e) => { onSelectTopicCodes(null); onChangeFilter({ ...filter, targetLevel: e.target.value || undefined }); }}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
        >
          <option value="">🎓 Tất cả Khối ({summary.facets.targetLevels.length})</option>
          {summary.facets.targetLevels.map((f) => (
            <option key={f.value} value={f.value}>{f.label} ({f.topicCount} đề)</option>
          ))}
        </select>

        <select
          value={filter.benchmarkYear || ''}
          onChange={(e) => { onSelectTopicCodes(null); onChangeFilter({ ...filter, benchmarkYear: e.target.value || undefined }); }}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
        >
          <option value="">📅 Tất cả Năm ({summary.facets.benchmarkYears.length})</option>
          {summary.facets.benchmarkYears.map((f) => (
            <option key={f.value} value={f.value}>{f.label} ({f.topicCount} đề)</option>
          ))}
        </select>

        <select
          value={filter.issuingOrg || ''}
          onChange={(e) => { onSelectTopicCodes(null); onChangeFilter({ ...filter, issuingOrg: e.target.value || undefined }); }}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
        >
          <option value="">🏫 Tất cả Trường/Sở ({summary.facets.issuingOrgs.length})</option>
          {summary.facets.issuingOrgs.map((f) => (
            <option key={f.value} value={f.value}>{f.label} ({f.topicCount})</option>
          ))}
        </select>

        <select
          value={filter.domainCode || ''}
          onChange={(e) => { onSelectTopicCodes(null); onChangeFilter({ ...filter, domainCode: e.target.value || undefined }); }}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
        >
          <option value="">📚 Tất cả Môn/Lĩnh vực ({summary.facets.domains.length})</option>
          {summary.facets.domains.map((f) => (
            <option key={f.value} value={f.value}>{f.label} ({f.topicCount})</option>
          ))}
        </select>

        <select
          value={filter.assessmentPurpose || ''}
          onChange={(e) => { onSelectTopicCodes(null); onChangeFilter({ ...filter, assessmentPurpose: e.target.value || undefined }); }}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
        >
          <option value="">🎯 Mọi Kỳ thi ({summary.facets.assessmentPurposes.length})</option>
          {summary.facets.assessmentPurposes.map((f) => (
            <option key={f.value} value={f.value}>{f.label} ({f.topicCount})</option>
          ))}
        </select>
      </div>

      {/* Tab 1: Cây Xoay Trục 3 Tầng */}
      {viewTab === 'tree' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
          {summary.pivotTree.map((n1) => {
            const isExpanded = expandedL1 === n1.key;
            return (
              <div key={n1.key} className="rounded-xl bg-slate-950/80 border border-slate-800/90 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedL1(isExpanded ? null : n1.key);
                      onSelectTopicCodes(n1.topicCodes, n1.label);
                    }}
                    className="flex items-center gap-1.5 text-left text-xs font-bold text-white hover:text-indigo-300 transition truncate cursor-pointer"
                  >
                    <ChevronRight size={14} className={`shrink-0 transition-transform ${isExpanded ? 'rotate-90 text-indigo-400' : 'text-slate-500'}`} />
                    <span className="truncate">{n1.label}</span>
                  </button>
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-[10px] font-mono font-bold">
                    {n1.topicCount} đề · {n1.questionCount} câu
                  </span>
                </div>

                {n1.children.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-4">
                    {n1.children.slice(0, isExpanded ? 20 : 4).map((n2) => (
                      <button
                        key={n2.key}
                        type="button"
                        onClick={() => onSelectTopicCodes(n2.topicCodes, `${n1.label} → ${n2.label}`)}
                        className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-indigo-600/30 border border-slate-800 hover:border-indigo-500/40 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
                      >
                        {n2.label} <span className="text-slate-500 font-mono">({n2.topicCount})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Ma Trận Phủ Học Liệu (Khối × Năm học) */}
      {viewTab === 'matrix' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-3 text-left font-bold">Khối lớp \ Năm</th>
                {years.map((y) => (
                  <th key={y} className="py-2 px-3 text-center font-mono font-bold">{y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g} className="border-b border-slate-800/50">
                  <td className="py-1.5 px-3 font-bold text-slate-200 whitespace-nowrap">{g}</td>
                  {years.map((y) => {
                    const cell = summary.coverageMatrix.find((c) => c.targetLevel === g && c.benchmarkYear === y);
                    const tone =
                      cell?.status === 'HEALTHY'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        : cell?.status === 'SPARSE'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-slate-950/60 text-slate-600 border-slate-800/60';
                    return (
                      <td key={y} className="p-1 text-center">
                        <button
                          type="button"
                          disabled={!cell || cell.topicCount === 0}
                          onClick={() => {
                            onSelectTopicCodes(null);
                            onChangeFilter({ ...filter, targetLevel: g, benchmarkYear: y });
                          }}
                          className={`w-full py-1 px-2 rounded-lg border text-[11px] font-mono transition cursor-pointer disabled:cursor-default ${tone}`}
                        >
                          {cell && cell.topicCount > 0 ? `${cell.topicCount}đ / ${cell.questionCount}c` : '—'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSliceLabel && (
        <div className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-3 py-1.5 inline-flex items-center gap-2">
          <span>Đang xem lát cắt: <strong>{activeSliceLabel}</strong></span>
        </div>
      )}
    </div>
  );
};
