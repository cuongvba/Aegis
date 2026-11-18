import React, { useState } from 'react';
import { Search, Replace, X } from 'lucide-react';

interface FindReplaceBarProps {
  markdown: string;
  onChange: (next: string) => void;
  onClose: () => void;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  markdown,
  onChange,
  onClose,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const matchCount = findText
    ? markdown.split(findText).length - 1
    : 0;

  const handleReplaceAll = () => {
    if (!findText) return;
    onChange(markdown.split(findText).join(replaceText));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-500/40 bg-slate-900 px-3 py-2 text-xs print:hidden">
      <div className="inline-flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1">
        <Search size={13} className="text-sky-400" />
        <input
          value={findText}
          onChange={(e) => setFindText(e.target.value)}
          placeholder="Tìm từ..."
          className="bg-transparent text-slate-100 focus:outline-none w-36"
        />
        {findText && (
          <span className="text-[10px] font-bold text-cyan-300">{matchCount} kết quả</span>
        )}
      </div>

      <div className="inline-flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1">
        <Replace size={13} className="text-emerald-400" />
        <input
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          placeholder="Thay bằng..."
          className="bg-transparent text-slate-100 focus:outline-none w-36"
        />
      </div>

      <button
        type="button"
        disabled={!findText || matchCount === 0}
        onClick={handleReplaceAll}
        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 px-3 py-1 font-bold text-white"
      >
        Thay thế tất cả
      </button>

      <button
        type="button"
        onClick={onClose}
        className="ml-auto p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
      >
        <X size={14} />
      </button>
    </div>
  );
};
