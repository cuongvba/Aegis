import { ArrowDown, ArrowUp, GripHorizontal, Layers, RotateCcw, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MathRenderer } from '@/components/common/MathRenderer';
import { getDisplayOptions } from '@/lib/quiz-helpers';
import type { QuestionWidgetProps } from './types';
import { playSynthGameSound } from './sound-effects';

export default function OrderingWidget({
  question,
  answer,
  onUpdate,
  disabled,
  soundEnabled
}: QuestionWidgetProps) {
  const displayOptions = getDisplayOptions(question);
  const isWordTileFriendly = useMemo(
    () => displayOptions.length >= 2 && displayOptions.every((o) => (o.value || '').trim().length <= 28),
    [displayOptions]
  );
  const [tapMode, setTapMode] = useState<boolean>(isWordTileFriendly);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const currentOrder = answer?.ordering && answer.ordering.length > 0 
    ? answer.ordering 
    : (tapMode ? [] : displayOptions.map((x) => x.id));

  const remainingTiles = useMemo(
    () => displayOptions.filter((opt) => !currentOrder.includes(opt.id)),
    [displayOptions, currentOrder]
  );

  const appendTile = (optionId: string) => {
    if (disabled || currentOrder.includes(optionId)) return;
    onUpdate({ ordering: [...currentOrder, optionId] });
    playSynthGameSound('gem', soundEnabled);
  };

  const removeTileAt = (index: number) => {
    if (disabled) return;
    const next = [...currentOrder];
    next.splice(index, 1);
    onUpdate({ ordering: next });
    playSynthGameSound('gem', soundEnabled);
  };

  const resetTiles = () => {
    if (disabled) return;
    onUpdate({ ordering: [] });
  };

  const move = (index: number, offset: number) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= currentOrder.length) return;
    const next = [...currentOrder];
    const tmp = next[index];
    next[index] = next[nextIndex];
    next[nextIndex] = tmp;
    onUpdate({ ordering: next });
    playSynthGameSound('gem', soundEnabled);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const sourceIndex = Number(e.dataTransfer.getData('text/plain'));
    if (sourceIndex === targetIndex) return;
    const next = [...currentOrder];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    onUpdate({ ordering: next });
    playSynthGameSound('gem', soundEnabled);
  };

  return (
    <div className="space-y-4 select-none">
      <div className="flex items-center justify-between rounded-2xl border border-indigo-200/70 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <Layers className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
            {tapMode ? 'Chạm từ ghép câu siêu tốc (Olympiad)' : 'Sắp Xếp Trật Tự Chuẩn Xác'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTapMode((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 transition"
          >
            <Sparkles className="h-3 w-3" />
            {tapMode ? 'Chế độ Kéo thả' : 'Chế độ Chạm nhanh'}
          </button>
          {tapMode && currentOrder.length > 0 && !disabled && (
            <button
              type="button"
              onClick={resetTiles}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              <RotateCcw className="h-3 w-3" /> Xóa lại
            </button>
          )}
        </div>
      </div>

      {tapMode ? (
        <div className="space-y-4">
          <div className="min-h-[68px] rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/40 p-3 flex flex-wrap items-center gap-2">
            {currentOrder.length === 0 ? (
              <span className="text-xs font-medium text-slate-400 italic">
                Chạm vào từng từ bên dưới theo đúng thứ tự để ghép câu...
              </span>
            ) : (
              currentOrder.map((optionId, idx) => {
                const opt = displayOptions.find((x) => x.id === optionId);
                if (!opt) return null;
                return (
                  <button
                    key={`${opt.id}-${idx}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => removeTileAt(idx)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-400 bg-white px-3 py-1.5 text-sm font-bold text-indigo-900 shadow-sm hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700 transition"
                  >
                    <span className="text-[10px] font-black text-indigo-400">{idx + 1}.</span>
                    <MathRenderer content={opt.value} inline />
                  </button>
                );
              })
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {remainingTiles.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => appendTile(opt.id)}
                className="rounded-xl border-2 border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-800 active:scale-95 transition disabled:opacity-40"
              >
                <MathRenderer content={opt.value} inline />
              </button>
            ))}
          </div>
        </div>
      ) : (
      <div className="space-y-2.5" onDragLeave={() => setDragOverIndex(null)}>
        {currentOrder.map((optionId, index) => {
          const option = displayOptions.find((x) => x.id === optionId);
          if (!option) return null;
          const isDragOver = dragOverIndex === index;

          return (
            <div
              key={option.id}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`flex items-center gap-3.5 rounded-2xl border-2 p-3.5 transition-all duration-200 ${
                isDragOver
                  ? 'border-indigo-400 bg-indigo-50 scale-[1.02] shadow-lg ring-2 ring-indigo-200'
                  : 'border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-md'
              } ${!disabled ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              <GripHorizontal className="h-4 w-4 flex-shrink-0 text-slate-400" />
              
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 font-extrabold text-xs text-white shadow-sm">
                {index + 1}
              </div>

              <div className="min-w-0 flex-1 text-sm font-semibold text-slate-800">
                <MathRenderer content={option.value} inline />
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-20 transition"
                  title="Đẩy lên"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={disabled || index === currentOrder.length - 1}
                  onClick={() => move(index, 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-20 transition"
                  title="Hạ xuống"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
