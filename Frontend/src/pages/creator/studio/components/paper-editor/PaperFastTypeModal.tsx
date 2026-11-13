import React, { useState } from 'react';
import { X, Sparkles, FileText, ArrowRight } from 'lucide-react';
import { PaperQuestionItem, PaperSectionType } from './paper-editor.types';

interface PaperFastTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportParsedQuestions: (questions: PaperQuestionItem[]) => void;
}

const SAMPLE_RAW_TEXT = `Câu 1: Trong không gian Oxyz, phương trình mặt cầu tâm I(1; -2; 3) bán kính R = 4 là:
A. (x-1)^2 + (y+2)^2 + (z-3)^2 = 16
B. (x+1)^2 + (y-2)^2 + (z+3)^2 = 16
C. (x-1)^2 + (y+2)^2 + (z-3)^2 = 4
D. (x+1)^2 + (y-2)^2 + (z+3)^2 = 4
ĐA: A

Câu 2: Cho hàm số y = f(x) = x^3 - 3x + 1. Các mệnh đề sau đúng hay sai?
a) Tập xác định của hàm số là R. [Đúng]
b) Đạo hàm f'(x) = 3x^2 - 3. [Đúng]
c) Điểm cực tiểu của đồ thị hàm số là (1; -1). [Đúng]
d) Giá trị lớn nhất của hàm số trên đoạn [0; 2] bằng 5. [Sai]

Câu 3: Một ngọn hải đăng cách bờ biển 4km. Tìm giá trị nhỏ nhất của thời gian di chuyển.
ĐS: 28.5`;

export const PaperFastTypeModal: React.FC<PaperFastTypeModalProps> = ({
  isOpen,
  onClose,
  onImportParsedQuestions,
}) => {
  const [rawText, setRawText] = useState(SAMPLE_RAW_TEXT);

  if (!isOpen) return null;

  const handleParse = () => {
    const blocks = rawText.split(/(?=Câu\s+\d+[:.])/i).filter((b) => b.trim().length > 0);
    const parsed: PaperQuestionItem[] = [];

    blocks.forEach((block, idx) => {
      const trimmed = block.trim();
      let sectionType: PaperSectionType = 'PART_1_SINGLE';
      let content = trimmed;
      let shortAnswerText = '';

      // Check if it's Part 2 True/False (contains a), b), c), d) or a. b. c. d.)
      const isTrueFalse = /[a-d]\s*[\).]/i.test(trimmed) && !/A\s*[\).].*B\s*[\).]/i.test(trimmed);
      // Check if it's Part 3 Short answer (contains ĐS: or Đáp số:)
      const isShortAnswer = /(?:ĐS|Đáp số|Ket qua)[:\s]+([^\n]+)/i.test(trimmed);

      if (isTrueFalse) {
        sectionType = 'PART_2_TRUE_FALSE';
        const lines = trimmed.split('\n');
        content = lines[0].replace(/^Câu\s+\d+[:.]\s*/i, '').trim();
        const options = ['a', 'b', 'c', 'd'].map((k) => {
          const match = new RegExp(`${k}\\s*[\\).]\\s*([^\\n\\[]+)(?:\\[(Đúng|Sai)\\])?`, 'i').exec(trimmed);
          const text = match ? match[1].trim() : `Mệnh đề ${k}`;
          const isCorrect = match && match[2] ? match[2].toLowerCase() === 'đúng' : true;
          return { key: k, text, isCorrect };
        });
        parsed.push({
          id: `fast_q_${Date.now()}_${idx}`,
          sectionType,
          order: idx + 1,
          content,
          options,
          points: 1.0,
        });
      } else if (isShortAnswer) {
        sectionType = 'PART_3_SHORT_ANSWER';
        const dsMatch = /(?:ĐS|Đáp số|Ket qua)[:\s]+([^\n]+)/i.exec(trimmed);
        shortAnswerText = dsMatch ? dsMatch[1].trim() : '';
        content = trimmed.replace(/^Câu\s+\d+[:.]\s*/i, '').replace(/(?:ĐS|Đáp số|Ket qua)[:\s]+[^\n]+/i, '').trim();
        parsed.push({
          id: `fast_q_${Date.now()}_${idx}`,
          sectionType,
          order: idx + 1,
          content,
          options: [],
          shortAnswerText,
          points: 0.5,
        });
      } else {
        // Part 1 Single Choice
        const correctMatch = /(?:ĐA|Đáp án)[:\s]+([A-D])/i.exec(trimmed);
        const correctKey = correctMatch ? correctMatch[1].toUpperCase() : 'A';
        content = trimmed.split(/(?=[A-D]\s*[\).])/)[0].replace(/^Câu\s+\d+[:.]\s*/i, '').trim();
        const options = ['A', 'B', 'C', 'D'].map((k) => {
          const match = new RegExp(`${k}\\s*[\\).]\\s*([^\\n]+)`, 'i').exec(trimmed);
          return {
            key: k,
            text: match ? match[1].replace(/(?:ĐA|Đáp án)[:\s]+[A-D]/i, '').trim() : `Phương án ${k}`,
            isCorrect: k === correctKey,
          };
        });
        parsed.push({
          id: `fast_q_${Date.now()}_${idx}`,
          sectionType,
          order: idx + 1,
          content,
          options,
          points: 0.25,
        });
      }
    });

    onImportParsedQuestions(parsed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-5 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Gõ Nhanh Văn Bản Thô (Fast-Type Raw Mode)
              </h3>
              <p className="text-[11px] text-slate-400">
                Tự động nhận diện Câu hỏi Trắc nghiệm, Đúng/Sai và Điền số theo định dạng tự nhiên
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X size={18} />
          </button>
        </div>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={12}
          className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs sm:text-sm font-mono text-slate-200 focus:outline-none focus:border-indigo-500 mb-3"
          placeholder="Nhập hoặc dán văn bản đề thi..."
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <button
            type="button"
            onClick={() => setRawText(SAMPLE_RAW_TEXT)}
            className="text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <Sparkles size={13} /> Nạp mẫu chuẩn 3 phần GDPT 2025
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-white">
              Hủy
            </button>
            <button
              type="button"
              onClick={handleParse}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <span>Phân tích &amp; Chuyển thành Đề Trang Giấy</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
