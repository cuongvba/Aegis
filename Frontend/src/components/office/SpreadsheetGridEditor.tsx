import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { OfficeSheet } from '@/services/officeWorkspace.service';

interface SpreadsheetGridEditorProps {
  sheets: OfficeSheet[];
  onChange: (next: OfficeSheet[]) => void;
}

export const SpreadsheetGridEditor: React.FC<SpreadsheetGridEditorProps> = ({
  sheets,
  onChange,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const sheet = sheets[activeIdx] || sheets[0];
  if (!sheet) return null;

  const colCount = Math.max(1, ...sheet.rows.map((r) => r.length));

  const updateSheet = (updater: (s: OfficeSheet) => OfficeSheet) => {
    const next = sheets.map((s, idx) => (idx === activeIdx ? updater(s) : s));
    onChange(next);
  };

  const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
    updateSheet((s) => ({
      ...s,
      rows: s.rows.map((row, r) =>
        r === rIdx ? Array.from({ length: colCount }, (_, c) => (c === cIdx ? val : row[c] || '')) : row
      ),
    }));
  };

  const addRow = () => {
    updateSheet((s) => ({
      ...s,
      rows: [...s.rows, Array.from({ length: colCount }, () => '')],
    }));
  };

  const addColumn = () => {
    updateSheet((s) => ({
      ...s,
      rows: s.rows.map((r, idx) => [...r, idx === 0 ? `Cột ${colCount + 1}` : '']),
    }));
  };

  const deleteRow = (rIdx: number) => {
    if (sheet.rows.length <= 1) return;
    updateSheet((s) => ({
      ...s,
      rows: s.rows.filter((_, idx) => idx !== rIdx),
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {sheets.map((s, idx) => (
            <button
              key={`${s.name}-${idx}`}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                idx === activeIdx
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              📊 {s.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-emerald-300"
          >
            <Plus size={14} /> Thêm dòng
          </button>
          <button
            type="button"
            onClick={addColumn}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-cyan-300"
          >
            <Plus size={14} /> Thêm cột
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border border-slate-700 bg-slate-950/90 max-h-[60vh]">
        <table className="w-full border-collapse text-xs">
          <tbody>
            {sheet.rows.map((row, rIdx) => (
              <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-900 font-bold text-amber-200' : 'hover:bg-slate-900/50'}>
                <td className="w-10 border border-slate-800 px-2 py-1.5 text-center text-slate-500 select-none">
                  {rIdx + 1}
                </td>
                {Array.from({ length: colCount }).map((_, cIdx) => (
                  <td key={cIdx} className="border border-slate-800 p-0 min-w-[120px]">
                    <input
                      value={row[cIdx] || ''}
                      onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                      className="w-full bg-transparent px-2.5 py-2 text-slate-100 focus:bg-slate-800/80 focus:outline-none"
                    />
                  </td>
                ))}
                <td className="w-9 border border-slate-800 text-center">
                  {sheet.rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteRow(rIdx)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                      title="Xóa dòng"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
