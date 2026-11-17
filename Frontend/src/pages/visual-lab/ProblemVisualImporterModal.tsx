import React, { useRef, useState } from 'react';
import { FileUp, Loader2, Sparkles, Wand2, X } from 'lucide-react';
import { learnerQuizService } from '@/services/learner-quiz.service';
import { convertProblemTextToVisualLesson } from '@/components/common/visual/problemToVisualConverter';
import type { InteractiveVisualLesson } from '@/components/common/visual/visualLessonPresets';
import { handleSmartRichPaste, hasRichPreviewContent } from '@/shared/lib/quiz/smartClipboardMedia';
import { MathRenderer } from '@/components/common/MathRenderer';

interface ProblemVisualImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLessonsGenerated: (lessons: InteractiveVisualLesson[]) => void;
}

export const ProblemVisualImporterModal: React.FC<ProblemVisualImporterModalProps> = ({
  isOpen,
  onClose,
  onLessonsGenerated,
}) => {
  const [rawProblem, setRawProblem] = useState(
    'Cho hàm số y = x^3 - 3mx + 1. Tìm tham số m để đồ thị đạt cực trị tại x = 1.'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const notifySmartMedia = (msg: string) => {
    setPasteNotice(msg);
    window.setTimeout(() => setPasteNotice(null), 3500);
  };

  if (!isOpen) return null;

  const handleConvertText = () => {
    setErrorMsg(null);
    const lines = rawProblem
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);

    const converted = lines
      .map((block, idx) => convertProblemTextToVisualLesson(block, idx + 1))
      .filter((x): x is InteractiveVisualLesson => x !== null);

    if (converted.length === 0) {
      setErrorMsg('Chưa nhận diện được phương trình (y = ..., x(t) = ..., u = ...) hoặc hình 3D trong văn bản. Hãy thử nhập rõ biểu thức!');
      return;
    }

    onLessonsGenerated(converted);
    onClose();
  };

  const handleUploadExamFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setIsUploading(true);
    try {
      const questions = await learnerQuizService.importQuestionsDocx(file, false);
      const converted = (questions || [])
        .map((q: any, idx: number) =>
          convertProblemTextToVisualLesson(q.content || '', idx + 1, q.topicName || q.topicCode)
        )
        .filter((x): x is InteractiveVisualLesson => x !== null);

      if (converted.length === 0) {
        setErrorMsg(`Đã đọc ${questions?.length || 0} câu hỏi từ "${file.name}", nhưng chưa thấy câu nào có phương trình/hình 3D phù hợp để dựng Visual.`);
        return;
      }

      onLessonsGenerated(converted);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Không thể đọc tệp đề thi. Vui lòng kiểm tra định dạng .docx / .pdf.');
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-cyan-500/20 p-2 text-cyan-400">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Nạp Đề / Bài Toán Bất Kỳ &rarr; Visual 60fps</h3>
              <p className="text-xs text-slate-400">Dán đề Toán/Lý/Hình học hoặc tải file Word (.docx) / PDF lên để tự động dựng bài giảng động</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Cách 1: Dán trực tiếp đề bài hoặc phương trình (hỗ trợ LaTeX, tham số m, t, hình 3D)
            </label>
            <textarea
              value={rawProblem}
              onChange={(e) => setRawProblem(e.target.value)}
              onPaste={(e) => handleSmartRichPaste(e, rawProblem, setRawProblem, notifySmartMedia)}
              rows={5}
              placeholder="Ví dụ: Sóng cơ có phương trình u = 4*cos(2*x - 3*t) hoặc Ctrl+V trực tiếp từ Word / MathType..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3.5 text-sm text-white outline-none focus:border-cyan-400"
            />
            {pasteNotice && (
              <div className="mt-1.5 text-xs font-semibold text-emerald-400">{pasteNotice}</div>
            )}
            {hasRichPreviewContent(rawProblem) && (
              <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-1">Xem trước công thức vừa dán:</div>
                <MathRenderer content={rawProblem} />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <input ref={fileRef} type="file" accept=".docx,.pdf" onChange={handleUploadExamFile} className="sr-only" />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => window.setTimeout(() => fileRef.current?.click(), 0)}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/40 px-4 py-2.5 text-xs font-extrabold text-emerald-300 transition disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
              {isUploading ? 'Đang bóc tách đề...' : 'Cách 2: Tải file Đề thi (.docx / .pdf)'}
            </button>

            <button
              type="button"
              onClick={handleConvertText}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg transition"
            >
              <Sparkles className="h-4 w-4" /> Chuyển thành Visual 60fps Ngay
            </button>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-2.5 text-xs font-medium text-rose-200">
              {errorMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
