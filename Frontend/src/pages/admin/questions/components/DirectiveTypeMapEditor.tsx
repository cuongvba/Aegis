import React, { useState } from 'react';
import { Tag, Plus, Trash2, Edit2, Check, X, HelpCircle } from 'lucide-react';

interface DirectiveTypeMapEditorProps {
  directiveMap?: Record<string, string[]>;
  onChange: (updatedMap: Record<string, string[]>) => void;
}

const QUESTION_TYPES: Array<{ key: string; label: string; color: string; desc: string }> = [
  { key: 'MULTI_TRUE_FALSE', label: 'Đúng / Sai Nhiều Ý (TF)', color: 'text-purple-400 border-purple-500/40 bg-purple-500/10', desc: 'Nhận diện chỉ thị dạng Đúng/Sai (True/False)' },
  { key: 'SHORT_ANSWER', label: 'Trả Lời Ngắn / Điền Số', color: 'text-blue-400 border-blue-500/40 bg-blue-500/10', desc: 'Nhận diện chỉ thị điền giá trị số, đáp số ngắn' },
  { key: 'ORDERING', label: 'Sắp Xếp Thứ Tự', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10', desc: 'Nhận diện chỉ thị sắp xếp các bước, thứ tự từ' },
  { key: 'MATCHING', label: 'Ghép Nối Cột (Matching)', color: 'text-teal-400 border-teal-500/40 bg-teal-500/10', desc: 'Nhận diện chỉ thị nối cột A với cột B' },
  { key: 'MULTI', label: 'Nhiều Lựa Chọn (Multi-Select)', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10', desc: 'Nhận diện chỉ thị chọn nhiều hơn 1 phương án' },
  { key: 'FILL_BLANK', label: 'Điền Vào Chỗ Trống', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10', desc: 'Nhận diện chỉ thị điền từ hoặc số vào chỗ trống' },
  { key: 'ESSAY', label: 'Tự Luận / Trình Bày', color: 'text-pink-400 border-pink-500/40 bg-pink-500/10', desc: 'Nhận diện chỉ thị tự luận, chứng minh chi tiết' },
  { key: 'SINGLE', label: 'Trắc Nghiệm Đơn (Single Choice)', color: 'text-slate-300 border-slate-600 bg-slate-800/40', desc: 'Chỉ thị chọn 1 đáp án đúng duy nhất' }
];

export const DirectiveTypeMapEditor: React.FC<DirectiveTypeMapEditorProps> = ({
  directiveMap = {},
  onChange
}) => {
  const [selectedType, setSelectedType] = useState<string>(QUESTION_TYPES[0].key);
  const [newPattern, setNewPattern] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const currentPatterns = directiveMap[selectedType] || [];

  const handleAddPattern = () => {
    if (!newPattern.trim()) return;
    const updated = {
      ...directiveMap,
      [selectedType]: [...currentPatterns, newPattern.trim()]
    };
    onChange(updated);
    setNewPattern('');
  };

  const handleRemovePattern = (idx: number) => {
    const nextList = currentPatterns.filter((_, i) => i !== idx);
    const updated = { ...directiveMap, [selectedType]: nextList };
    onChange(updated);
    if (editingIndex === idx) {
      setEditingIndex(null);
      setEditingText('');
    }
  };

  const handleStartEdit = (idx: number, currentText: string) => {
    setEditingIndex(idx);
    setEditingText(currentText);
  };

  const handleSaveEdit = (idx: number) => {
    if (!editingText.trim()) return;
    const nextList = [...currentPatterns];
    nextList[idx] = editingText.trim();
    const updated = { ...directiveMap, [selectedType]: nextList };
    onChange(updated);
    setEditingIndex(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  const activeMeta = QUESTION_TYPES.find(q => q.key === selectedType) || QUESTION_TYPES[0];

  return (
    <div className="space-y-3 font-sans bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-purple-400" />
          <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider">
            Luật Tiền Luận Giải QuestionType Theo Chỉ Thị (PISA v7.0)
          </h4>
        </div>
        <span className="text-[10px] text-slate-500 flex items-center gap-1">
          <HelpCircle size={11} />
          Directive-Driven Type Inference
        </span>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Tự động gán loại câu hỏi khi gặp chỉ thị trong đề thi (ví dụ: &ldquo;Chọn đúng hoặc sai&rdquo; &rarr; MULTI_TRUE_FALSE). Nhấp đúp hoặc bấm biểu tượng bút để sửa regex trực tiếp.
      </p>

      {/* Question Type selector pills */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {QUESTION_TYPES.map((type) => {
          const count = (directiveMap[type.key] || []).length;
          const isSelected = selectedType === type.key;
          return (
            <button
              key={type.key}
              type="button"
              onClick={() => {
                setSelectedType(type.key);
                setEditingIndex(null);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? `${type.color} ring-1 ring-white/30 shadow-sm`
                  : 'text-slate-400 border-slate-800 bg-slate-900/50 hover:bg-slate-800'
              }`}
            >
              <span>{type.label}</span>
              {count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-slate-300 font-mono">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Pattern list for selected question type */}
      <div className="mt-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            Mẫu regex chỉ thị cho <span className="font-mono text-purple-300">[{selectedType}]</span>
          </span>
          <span className="text-slate-500 text-[10px]">{activeMeta.desc}</span>
        </div>

        {currentPatterns.length === 0 ? (
          <div className="text-[11px] text-slate-500 italic py-2 text-center">
            Chưa có mẫu regex chỉ thị nào cho dạng câu hỏi này. Hãy thêm bên dưới.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {currentPatterns.map((pat, idx) => {
              const isEditing = editingIndex === idx;

              if (isEditing) {
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-purple-500/80 shadow-md shadow-purple-500/10"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); handleSaveEdit(idx); }
                        if (e.key === 'Escape') { e.preventDefault(); handleCancelEdit(); }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-amber-200 font-mono focus:outline-none focus:border-purple-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(idx)}
                      className="p-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                      title="Lưu thay đổi (Enter)"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      title="Hủy bỏ (Esc)"
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800/80 hover:border-slate-700 text-[11px] font-mono group transition-colors"
                >
                  <span
                    onDoubleClick={() => handleStartEdit(idx, pat)}
                    className="text-amber-300/90 truncate flex-1 cursor-pointer select-text"
                    title="Nhấp đúp hoặc bấm biểu tượng bút để chỉnh sửa regex"
                  >
                    {pat}
                  </span>
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(idx, pat)}
                      className="text-slate-400 hover:text-purple-300 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Chỉnh sửa mẫu regex này"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePattern(idx)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Xóa mẫu regex này"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add new pattern input */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
          <input
            type="text"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPattern(); } }}
            placeholder="Nhập regex hoặc chuỗi chỉ thị mới (ví dụ: đúng\\s*hoặc\\s*sai)..."
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 font-mono focus:outline-none focus:border-purple-500"
          />
          <button
            type="button"
            onClick={handleAddPattern}
            className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <Plus size={13} />
            Thêm
          </button>
        </div>
      </div>
    </div>
  );
};
