import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ExamMatrixSectionRule } from '../../../../services/examMatrix.service';

interface MatrixSectionEditorProps {
  sections: ExamMatrixSectionRule[];
  onChange: (next: ExamMatrixSectionRule[]) => void;
}

const QUESTION_TYPE_OPTIONS = [
  { value: 'SINGLE', label: 'Trắc nghiệm 1 đáp án' },
  { value: 'MULTI_TRUE_FALSE', label: 'Đúng / Sai chùm (4 ý)' },
  { value: 'SHORT_ANSWER', label: 'Trả lời ngắn' },
  { value: 'MULTI', label: 'Nhiều lựa chọn' },
  { value: 'ESSAY', label: 'Tự luận' },
];

export const MatrixSectionEditor: React.FC<MatrixSectionEditorProps> = ({ sections, onChange }) => {
  const updateRow = (idx: number, patch: Partial<ExamMatrixSectionRule>) => {
    onChange(sections.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const addRow = () => {
    const nextIdx = sections.length + 1;
    onChange([
      ...sections,
      {
        code: `PART_${nextIdx}`,
        title: `Phần ${nextIdx}`,
        questionType: 'SINGLE',
        count: 10,
        pointsPerQuestion: 0.25,
      },
    ]);
  };

  const removeRow = (idx: number) => {
    if (sections.length <= 1) return;
    onChange(sections.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-300">Cấu trúc các phần đề ({sections.reduce((s, x) => s + (x.count || 0), 0)} câu)</span>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold transition"
        >
          <Plus size={12} /> Thêm phần
        </button>
      </div>
      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
        {sections.map((sec, idx) => (
          <div key={`${sec.code}-${idx}`} className="grid grid-cols-12 gap-1.5 items-center">
            <input
              type="text"
              value={sec.title}
              onChange={(e) => updateRow(idx, { title: e.target.value })}
              placeholder="Tên phần"
              className="col-span-5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 focus:border-cyan-400 focus:outline-none"
            />
            <select
              value={sec.questionType}
              onChange={(e) => updateRow(idx, { questionType: e.target.value })}
              className="col-span-4 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-slate-100 focus:border-cyan-400 focus:outline-none"
            >
              {QUESTION_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={100}
              value={sec.count}
              onChange={(e) => updateRow(idx, { count: Math.max(1, Number(e.target.value) || 1) })}
              title="Số câu"
              className="col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center text-cyan-300 font-bold focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeRow(idx)}
              disabled={sections.length <= 1}
              className="col-span-1 p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 transition flex justify-center"
              title="Xóa phần"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
