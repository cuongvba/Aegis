import React from 'react';
import { BookOpen, GraduationCap, Calendar, Grid } from 'lucide-react';

export type PivotPerspective = 'by-subject' | 'by-grade' | 'by-term';

interface PerspectiveSelectorProps {
  activePivot: PivotPerspective;
  onChangePivot: (pivot: PivotPerspective) => void;
  onOpenMatrix: () => void;
  isEducationDomain: boolean;
}

export const PerspectiveSelector: React.FC<PerspectiveSelectorProps> = ({
  activePivot,
  onChangePivot,
  onOpenMatrix,
  isEducationDomain,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl backdrop-blur-md">
      <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
        <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider">
          Góc nhìn:
        </span>
        <button
          type="button"
          onClick={() => onChangePivot('by-subject')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activePivot === 'by-subject'
              ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Theo Môn học</span>
        </button>

        {isEducationDomain && (
          <>
            <button
              type="button"
              onClick={() => onChangePivot('by-grade')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activePivot === 'by-grade'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Theo Khối lớp</span>
            </button>

            <button
              type="button"
              onClick={() => onChangePivot('by-term')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activePivot === 'by-term'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Theo Học kỳ</span>
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenMatrix}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
        title="Xem bảng ma trận độ phủ tri thức 2 chiều (Môn x Lớp)"
      >
        <Grid className="w-3.5 h-3.5 text-emerald-400" />
        <span>Ma trận tri thức</span>
      </button>
    </div>
  );
};
