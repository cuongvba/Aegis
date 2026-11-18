import React, { useMemo } from 'react';
import { ListTree } from 'lucide-react';

interface OutlineItem {
  level: number;
  text: string;
  lineIndex: number;
}

interface DocumentOutlineSidebarProps {
  markdown: string;
  onJumpToHeading: (headingText: string, lineIndex: number) => void;
}

export const DocumentOutlineSidebar: React.FC<DocumentOutlineSidebarProps> = ({
  markdown,
  onJumpToHeading,
}) => {
  const items = useMemo<OutlineItem[]>(() => {
    const lines = (markdown || '').split('\n');
    const result: OutlineItem[] = [];
    lines.forEach((raw, idx) => {
      const t = raw.trim();
      if (t.startsWith('### ')) result.push({ level: 3, text: t.slice(4).trim(), lineIndex: idx });
      else if (t.startsWith('## ')) result.push({ level: 2, text: t.slice(3).trim(), lineIndex: idx });
      else if (t.startsWith('# ')) result.push({ level: 1, text: t.slice(2).trim(), lineIndex: idx });
    });
    return result;
  }, [markdown]);

  return (
    <aside className="hidden xl:flex flex-col w-56 shrink-0 rounded-2xl border border-slate-800 bg-slate-900/75 p-3 max-h-[68vh] overflow-y-auto print:hidden">
      <div className="flex items-center gap-1.5 text-xs font-black text-slate-300 pb-2 mb-2 border-b border-slate-800">
        <ListTree size={14} className="text-sky-400" />
        Dàn ý tài liệu
      </div>
      {items.length === 0 ? (
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Thêm tiêu đề (#, ##, ###) để tự động tạo mục lục điều hướng nhanh như Google Docs.
        </p>
      ) : (
        <nav className="space-y-1">
          {items.map((item, idx) => (
            <button
              key={`${item.lineIndex}-${idx}`}
              type="button"
              onClick={() => onJumpToHeading(item.text, item.lineIndex)}
              className={`w-full text-left rounded-lg px-2 py-1.5 text-xs transition hover:bg-slate-800 truncate ${
                item.level === 1
                  ? 'font-bold text-white'
                  : item.level === 2
                    ? 'pl-4 font-semibold text-slate-300'
                    : 'pl-6 text-slate-400'
              }`}
              title={item.text}
            >
              {item.text}
            </button>
          ))}
        </nav>
      )}
    </aside>
  );
};
