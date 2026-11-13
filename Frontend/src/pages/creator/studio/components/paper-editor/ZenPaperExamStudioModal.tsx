import React, { useState } from 'react';
import { X, Sparkles, FileText, Check, ArrowRight, BookOpen, Clock, Download } from 'lucide-react';
import { PaperExamMetadata, PaperQuestionItem } from './paper-editor.types';
import { PaperExamHeader } from './PaperExamHeader';
import { PaperSectionPart1 } from './PaperSectionPart1';
import { PaperSectionPart2 } from './PaperSectionPart2';
import { PaperSectionPart3 } from './PaperSectionPart3';
import { PaperFastTypeModal } from './PaperFastTypeModal';
import { ZenUploadResult } from '../../types/zen-studio.types';

interface ZenPaperExamStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaperExamLoaded: (result: ZenUploadResult) => void;
}

const DEFAULT_METADATA: PaperExamMetadata = {
  departmentName: 'SỞ GD&ĐT HÀ NỘI',
  schoolName: 'TRƯỜNG THPT CHUYÊN SƯ PHẠM',
  examTitle: 'KHẢO SÁT CHẤT LƯỢNG HỌC KỲ II',
  subjectName: 'TOÁN HỌC',
  gradeLevel: '12',
  durationMinutes: 50,
  examCode: '101',
  academicYear: 'NĂM HỌC 2025 - 2026',
};

export const ZenPaperExamStudioModal: React.FC<ZenPaperExamStudioModalProps> = ({
  isOpen,
  onClose,
  onPaperExamLoaded,
}) => {
  const [metadata, setMetadata] = useState<PaperExamMetadata>(DEFAULT_METADATA);
  const [isFastTypeOpen, setIsFastTypeOpen] = useState(false);
  const [questions, setQuestions] = useState<PaperQuestionItem[]>([
    {
      id: 'p1_q1',
      sectionType: 'PART_1_SINGLE',
      order: 1,
      content: 'Trong không gian $Oxyz$, cho mặt cầu $(S): (x-1)^2 + (y+2)^2 + (z-3)^2 = 16$. Bán kính $R$ của $(S)$ bằng:',
      options: [
        { key: 'A', text: '$R = 4$', isCorrect: true },
        { key: 'B', text: '$R = 16$', isCorrect: false },
        { key: 'C', text: '$R = 2$', isCorrect: false },
        { key: 'D', text: '$R = 8$', isCorrect: false },
      ],
      points: 0.25,
    },
    {
      id: 'p2_q1',
      sectionType: 'PART_2_TRUE_FALSE',
      order: 2,
      content: 'Cho hàm số $y = f(x) = x^3 - 3x + 1$. Các mệnh đề sau đúng hay sai?',
      options: [
        { key: 'a', text: 'Tập xác định của hàm số là $D = \\mathbb{R}$.', isCorrect: true },
        { key: 'b', text: 'Đạo hàm $f\'(x) = 3x^2 - 3$.', isCorrect: true },
        { key: 'c', text: 'Hàm số đồng biến trên khoảng $(-1; 1)$.', isCorrect: false },
        { key: 'd', text: 'Điểm cực đại của đồ thị hàm số là $(-1; 3)$.', isCorrect: true },
      ],
      points: 1.0,
    },
    {
      id: 'p3_q1',
      sectionType: 'PART_3_SHORT_ANSWER',
      order: 3,
      content: 'Một ngọn hải đăng đặt tại $A$ cách bờ biển $AB = 4\\text{ km}$. Người gác chèo thuyền với vận tốc $4\\text{ km/h}$ rồi đi bộ với vận tốc $6\\text{ km/h}$. Tính thời gian ngắn nhất (phút) để di chuyển.',
      options: [],
      shortAnswerText: '28.5',
      points: 0.5,
    },
  ]);

  if (!isOpen) return null;

  const part1 = questions.filter((q) => q.sectionType === 'PART_1_SINGLE');
  const part2 = questions.filter((q) => q.sectionType === 'PART_2_TRUE_FALSE');
  const part3 = questions.filter((q) => q.sectionType === 'PART_3_SHORT_ANSWER');

  const handleUpdateQuestion = (id: string, patch: Partial<PaperQuestionItem>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleAddQuestion = (sectionType: PaperQuestionItem['sectionType']) => {
    const newId = `paper_q_${Date.now()}`;
    const newQ: PaperQuestionItem = {
      id: newId,
      sectionType,
      order: questions.length + 1,
      content: 'Nội dung câu hỏi mới...',
      options: sectionType === 'PART_2_TRUE_FALSE'
        ? ['a', 'b', 'c', 'd'].map((k) => ({ key: k, text: `Mệnh đề ${k}`, isCorrect: true }))
        : sectionType === 'PART_1_SINGLE'
        ? ['A', 'B', 'C', 'D'].map((k, idx) => ({ key: k, text: `Phương án ${k}`, isCorrect: idx === 0 }))
        : [],
      points: sectionType === 'PART_2_TRUE_FALSE' ? 1.0 : sectionType === 'PART_3_SHORT_ANSWER' ? 0.5 : 0.25,
      shortAnswerText: sectionType === 'PART_3_SHORT_ANSWER' ? '' : undefined,
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  const handleExportToStudio = () => {
    const zenQuestions = questions.map((q, idx) => ({
      order: idx + 1,
      content: q.content,
      canonicalHash: `PAPER_HASH_${q.id}`,
      isDuplicate: false,
      questionType: q.sectionType === 'PART_2_TRUE_FALSE' ? 'MULTI_TRUE_FALSE' : q.sectionType === 'PART_3_SHORT_ANSWER' ? 'SHORT_ANSWER' : 'SINGLE',
      options: q.sectionType === 'PART_3_SHORT_ANSWER' ? [q.shortAnswerText || ''] : q.options.map((o) => o.text),
      correctAnswer: q.sectionType === 'PART_3_SHORT_ANSWER' ? q.shortAnswerText : q.sectionType === 'PART_2_TRUE_FALSE' ? q.options.map((o) => `${o.key}:${o.isCorrect ? 'T' : 'F'}`).join(',') : q.options.find((o) => o.isCorrect)?.key || 'A',
      explanation: q.explanation || 'Hướng dẫn giải chi tiết chuẩn mực.',
    }));

    onPaperExamLoaded({
      success: true,
      examTitle: `${metadata.examTitle} - MÔN ${metadata.subjectName} LỚP ${metadata.gradeLevel}`,
      totalQuestions: zenQuestions.length,
      duplicateCount: 0,
      uniqueCount: zenQuestions.length,
      deduplicationRatePercentage: 0,
      questions: zenQuestions as any,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-hidden">
      <div className="relative w-full max-w-5xl h-[95vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between p-3.5 sm:p-4 bg-slate-950 border-b border-slate-800 gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-600/30">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                Trình Soạn Đề Trang Giấy A4 WYSIWYG
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Chuẩn GDPT 2025
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Soạn thảo trực tiếp như trên Microsoft Word • Hỗ trợ đầy đủ 3 phần thi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFastTypeOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} className="text-indigo-400" />
              <span>Gõ Nhanh Văn Bản</span>
            </button>
            <button
              type="button"
              onClick={handleExportToStudio}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Đưa Vào Studio &amp; Phát Hành</span>
              <ArrowRight size={14} />
            </button>
            <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Paper Canvas Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/60 flex justify-center">
          <div className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 border border-slate-300 min-h-full">
            <PaperExamHeader metadata={metadata} onChange={(patch) => setMetadata((m) => ({ ...m, ...patch }))} />
            <PaperSectionPart1 questions={part1} onUpdateQuestion={handleUpdateQuestion} onRemoveQuestion={handleRemoveQuestion} onAddQuestion={() => handleAddQuestion('PART_1_SINGLE')} />
            <PaperSectionPart2 questions={part2} startIndex={part1.length + 1} onUpdateQuestion={handleUpdateQuestion} onRemoveQuestion={handleRemoveQuestion} onAddQuestion={() => handleAddQuestion('PART_2_TRUE_FALSE')} />
            <PaperSectionPart3 questions={part3} startIndex={part1.length + part2.length + 1} onUpdateQuestion={handleUpdateQuestion} onRemoveQuestion={handleRemoveQuestion} onAddQuestion={() => handleAddQuestion('PART_3_SHORT_ANSWER')} />
          </div>
        </div>

        {/* Fast-Type Parser Modal */}
        <PaperFastTypeModal isOpen={isFastTypeOpen} onClose={() => setIsFastTypeOpen(false)} onImportParsedQuestions={(imported) => setQuestions((prev) => [...prev, ...imported])} />
      </div>
    </div>
  );
};
