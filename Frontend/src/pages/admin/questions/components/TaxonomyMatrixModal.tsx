import React, { useEffect, useState } from 'react';
import { taxonomyPivotService, type TaxonomyMatrixSummary, type TaxonomyMatrixRow } from '@/services/taxonomy-pivot.service';

interface TaxonomyMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  domainCode?: string;
  onSelectCell: (facet: { topicCode?: string; grade?: string }) => void;
}

export const TaxonomyMatrixModal: React.FC<TaxonomyMatrixModalProps> = ({
  isOpen,
  onClose,
  domainCode = 'EDUCATION',
  onSelectCell,
}) => {
  const [data, setData] = useState<TaxonomyMatrixSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeDomain, setActiveDomain] = useState(domainCode);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      taxonomyPivotService
        .getMatrixSummary(activeDomain)
        .then(res => setData(res))
        .catch(err => console.error('Failed to load matrix summary:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, activeDomain]);

  if (!isOpen) return null;

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'text-slate-500 bg-slate-900/30';
    if (count < 10) return 'text-sky-300 bg-sky-950/40 border border-sky-800/40 hover:bg-sky-700/50';
    if (count < 30) return 'text-emerald-300 bg-emerald-950/50 border border-emerald-700/50 hover:bg-emerald-600/60 font-semibold';
    return 'text-amber-200 bg-amber-950/60 border border-amber-500/60 hover:bg-amber-600/70 font-bold';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <span className="material-icons text-xl">grid_view</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Ma trận Độ phủ Tri thức (Knowledge Matrix)
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                  {activeDomain}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Thống kê số lượng câu hỏi giao thoa giữa <strong>Môn học / Chủ đề</strong> và <strong>Khối lớp</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={activeDomain}
              onChange={e => setActiveDomain(e.target.value)}
              className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
            >
              <option value="EDUCATION">Giáo dục Phổ thông (K06-K12)</option>
              <option value="BANKING">Tài chính - Ngân hàng</option>
              <option value="GENERAL">Tổng hợp / Chung</option>
            </select>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <span className="material-icons text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <span className="material-icons animate-spin text-3xl text-sky-400">autorenew</span>
              <p className="text-sm">Đang tính toán ma trận đa chiều $O(1)$...</p>
            </div>
          ) : !data || data.rows.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <span className="material-icons text-4xl mb-2">inbox</span>
              <p>Chưa có dữ liệu ma trận cho không gian này.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-300 font-semibold border-b border-slate-800">
                    <th className="py-3 px-4 min-w-[200px] sticky left-0 bg-slate-950 z-10">Môn học / Chủ đề</th>
                    <th className="py-3 px-3 text-center min-w-[70px]">Tổng</th>
                    {data.grades.map((grade: string) => (
                      <th
                        key={grade}
                        onClick={() => {
                          onSelectCell({ grade });
                          onClose();
                        }}
                        title={`Click để lọc toàn bộ câu hỏi khối ${grade}`}
                        className="py-3 px-3 text-center min-w-[75px] hover:text-sky-300 hover:bg-slate-800/80 cursor-pointer transition-colors"
                      >
                        <div className="flex flex-col items-center">
                          <span>{grade}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {grade.replace('K', 'Lớp ')}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {data.rows.map((row: TaxonomyMatrixRow) => (
                    <tr key={row.topicCode} className="hover:bg-slate-800/30 transition-colors">
                      <td
                        onClick={() => {
                          onSelectCell({ topicCode: row.topicCode });
                          onClose();
                        }}
                        title={`Click để lọc toàn bộ câu hỏi môn ${row.topicName}`}
                        className="py-2.5 px-4 font-medium text-slate-200 sticky left-0 bg-slate-900/95 hover:text-sky-300 cursor-pointer transition-colors z-10"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sky-400 text-[11px]">{row.topicCode}</span>
                          <span>{row.topicName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-300 bg-slate-950/40">
                        {row.totalQuestions}
                      </td>
                      {data.grades.map((grade: string) => {
                        const count = row.countsByGrade[grade] || 0;
                        return (
                          <td key={grade} className="p-1 text-center">
                            <button
                              onClick={() => {
                                onSelectCell({ topicCode: row.topicCode, grade });
                                onClose();
                              }}
                              disabled={count === 0}
                              className={`w-full py-1.5 px-2 rounded-md transition-all text-center ${getHeatmapColor(
                                count
                              )}`}
                            >
                              {count > 0 ? count : '—'}
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
        </div>

        {/* Footer / Legend */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/50 text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-300">Chú thích độ phủ:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
              <span>0 câu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-sky-950 border border-sky-800 text-sky-300" />
              <span>1 - 9</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-700 text-emerald-300" />
              <span>10 - 29</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-950 border border-amber-600 text-amber-200" />
              <span>30+</span>
            </div>
          </div>
          <div className="text-slate-500 italic">
            * Mẹo: Click vào ô để áp dụng bộ lọc câu hỏi ngay lập tức
          </div>
        </div>
      </div>
    </div>
  );
};
