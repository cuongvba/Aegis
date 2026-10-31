import React from 'react';

interface QuickGradeFilterChipsProps {
  selectedGrade: string;
  onSelectGrade: (grade: string) => void;
}

const GRADES = [
  { code: '', label: 'Tất cả lớp' },
  { code: 'K06', label: 'Lớp 6' },
  { code: 'K07', label: 'Lớp 7' },
  { code: 'K08', label: 'Lớp 8' },
  { code: 'K09', label: 'Lớp 9' },
  { code: 'K10', label: 'Lớp 10' },
  { code: 'K11', label: 'Lớp 11' },
  { code: 'K12', label: 'Lớp 12' },
];

export const QuickGradeFilterChips: React.FC<QuickGradeFilterChipsProps> = ({
  selectedGrade,
  onSelectGrade,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs">
      <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider pl-1">
        Lọc nhanh:
      </span>
      {GRADES.map((g) => {
        const isSelected = selectedGrade === g.code;
        return (
          <button
            key={g.code}
            type="button"
            onClick={() => onSelectGrade(g.code)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              isSelected
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400'
                : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {g.label}
          </button>
        );
      })}
    </div>
  );
};
