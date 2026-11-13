import React, { useState } from 'react';
import { X, Sparkles, Sliders, BookOpen, Layers, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ZenUploadResult } from '../types/zen-studio.types';

interface ExamMatrixWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatrixGenerated: (result: ZenUploadResult) => void;
}

const SUBJECT_OPTIONS = [
  { code: 'MATH', name: 'Toán Học' },
  { code: 'PHYS', name: 'Vật Lý' },
  { code: 'CHEM', name: 'Hóa Học' },
  { code: 'BIO', name: 'Sinh Học' },
  { code: 'ENG', name: 'Tiếng Anh' },
];

export const ExamMatrixWizardModal: React.FC<ExamMatrixWizardModalProps> = ({
  isOpen,
  onClose,
  onMatrixGenerated,
}) => {
  const { t } = useTranslation();
  const [subject, setSubject] = useState<string>('MATH');
  const [grade, setGrade] = useState<string>('12');
  const [recall, setRecall] = useState<number>(40);        // Nhận biết
  const [comprehend, setComprehend] = useState<number>(30); // Thông hiểu
  const [apply, setApply] = useState<number>(20);          // Vận dụng
  const [highApply, setHighApply] = useState<number>(10);  // Vận dụng cao
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    const subjName = SUBJECT_OPTIONS.find((s) => s.code === subject)?.name || 'Toán Học';
    const topicCode = `MATRIX_${subject}_K${grade}_${Date.now().toString().slice(-4)}`;

    const mockQuestions = [
      {
        id: 'q1',
        content: 'Trong không gian $Oxyz$, cho mặt cầu $(S): (x-1)^2 + (y+2)^2 + (z-3)^2 = 16$. Tọa độ tâm $I$ và bán kính $R$ là:',
        difficulty: 1,
        questionType: 'SINGLE',
        points: 0.25,
        options: [
          { key: 'A', text: '$I(1; -2; 3)$ và $R = 4$', isCorrect: true },
          { key: 'B', text: '$I(-1; 2; -3)$ và $R = 4$', isCorrect: false },
          { key: 'C', text: '$I(1; -2; 3)$ và $R = 16$', isCorrect: false },
          { key: 'D', text: '$I(-1; 2; -3)$ và $R = 16$', isCorrect: false },
        ],
        explanation: 'Mặt cầu $(x-a)^2 + (y-b)^2 + (z-c)^2 = R^2$ có tâm $I(a;b;c)$ và bán kính $R$.',
      },
      {
        id: 'q2',
        content: 'Cho hàm số $y = f(x) = x^3 - 3x + 1$. Đồ thị có điểm cực đại là:\n```visual\n{\n  "type": "function_plot",\n  "title": "Đồ thị bậc ba",\n  "fn": "x^3 - 3*x + 1",\n  "xRange": [-3, 3],\n  "yRange": [-4, 4]\n}\n```',
        difficulty: 2,
        questionType: 'SINGLE',
        points: 0.25,
        options: [
          { key: 'A', text: '$(-1; 3)$', isCorrect: true },
          { key: 'B', text: '$(1; -1)$', isCorrect: false },
          { key: 'C', text: '$(0; 1)$', isCorrect: false },
          { key: 'D', text: '$(2; 3)$', isCorrect: false },
        ],
        explanation: 'Ta có $f\'(x) = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1$. Cực đại tại $(-1; 3)$.',
      },
      {
        id: 'q3',
        content: 'Cho hình chóp $S.ABCD$ có đáy là hình vuông cạnh $a$, $SA \\perp (ABCD)$ và $SA = a\\sqrt{3}$.\n```visual\n{\n  "type": "geometry_3d",\n  "solid": "pyramid_s_abcd",\n  "title": "Hình chóp S.ABCD"\n}\n```\nCác mệnh đề sau đúng hay sai?',
        difficulty: 3,
        questionType: 'MULTI_TRUE_FALSE',
        points: 1.0,
        options: [
          { key: 'A', text: 'Đường thẳng $SA \\perp (ABCD)$.', isCorrect: true },
          { key: 'B', text: 'Thể tích khối chóp $V = \\frac{a^3\\sqrt{3}}{3}$.', isCorrect: true },
          { key: 'C', text: 'Góc giữa $SC$ và $(ABCD)$ bằng $30^\\circ$.', isCorrect: false },
          { key: 'D', text: 'Khoảng cách $d(A, (SBC)) = \\frac{a\\sqrt{3}}{2}$.', isCorrect: true },
        ],
        explanation: 'Thể tích $V = \\frac{1}{3} S_{ABCD} \\cdot SA = \\frac{1}{3} a^2 \\cdot a\\sqrt{3} = \\frac{a^3\\sqrt{3}}{3}$.',
      },
      {
        id: 'q4',
        content: 'Hải đăng $A$ cách bờ biển $AB = 4\\text{ km}$. Người gác chèo thuyền rồi đi bộ đến trạm điện. Tính thời gian nhỏ nhất (làm tròn hàng phần mười phút).',
        difficulty: 4,
        questionType: 'SHORT_ANSWER',
        points: 0.5,
        options: [{ key: 'ANS', text: '28.5', isCorrect: true }],
        explanation: 'Tối ưu hàm mục tiêu thời gian $t(x)$. Nghiệm đạt cực tiểu tại $x_0$.',
      },
    ];

    setTimeout(() => {
      onMatrixGenerated({
        success: true,
        examTitle: `Đề Khảo Thí ${subjName} Lớp ${grade} (Ma Trận GDPT 2025)`,
        totalQuestions: mockQuestions.length,
        duplicateCount: 0,
        uniqueCount: mockQuestions.length,
        deduplicationRatePercentage: 0,
        questions: mockQuestions as any,
      });
      setIsGenerating(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-5 sm:p-6 text-slate-100">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition">
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              Trình Tạo Đề Theo Ma Trận Nhận Thức
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                GDPT 2025
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Phân hóa 4 mức độ nhận thức bám sát cấu trúc đề minh họa Bộ GD&amp;ĐT</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <BookOpen size={13} className="text-cyan-400" /> Môn Học:
              </label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-cyan-400 focus:outline-none">
                {SUBJECT_OPTIONS.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Layers size={13} className="text-indigo-400" /> Khối Lớp:
              </label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-400 focus:outline-none">
                <option value="12">Lớp 12 (Tốt Nghiệp THPT)</option>
                <option value="11">Lớp 11</option>
                <option value="10">Lớp 10</option>
                <option value="DGNL">Đánh Giá Năng Lực (ĐHQG)</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between font-bold text-slate-300">
              <span className="flex items-center gap-1.5"><Sliders size={14} className="text-amber-400" /> Phân Bổ Tỷ Lệ Ma Trận 4 Mức Độ:</span>
              <span className="text-[11px] font-mono text-cyan-300 font-bold">Tổng: {recall + comprehend + apply + highApply}%</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Nhận biết (Bloom 1-2):</span>
                  <span className="font-bold text-cyan-400">{recall}%</span>
                </div>
                <input type="range" min={10} max={60} value={recall} onChange={(e) => setRecall(Number(e.target.value))} className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg" />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Thông hiểu (Bloom 3):</span>
                  <span className="font-bold text-indigo-400">{comprehend}%</span>
                </div>
                <input type="range" min={10} max={60} value={comprehend} onChange={(e) => setComprehend(Number(e.target.value))} className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg" />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Vận dụng (Bloom 4):</span>
                  <span className="font-bold text-emerald-400">{apply}%</span>
                </div>
                <input type="range" min={5} max={40} value={apply} onChange={(e) => setApply(Number(e.target.value))} className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg" />
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Vận dụng cao (Bloom 5-6):</span>
                  <span className="font-bold text-rose-400">{highApply}%</span>
                </div>
                <input type="range" min={5} max={30} value={highApply} onChange={(e) => setHighApply(Number(e.target.value))} className="w-full accent-rose-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-slate-400">Tự động sinh kèm KaTeX và mô hình hình học ADVS 60fps.</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-3 py-2 font-semibold text-slate-400 hover:text-white transition">Hủy</button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-black shadow-lg shadow-indigo-500/25 active:scale-95 disabled:opacity-50 transition cursor-pointer"
              >
                {isGenerating ? <span>Đang tổng hợp...</span> : <><span>Sinh Đề Thi Chuẩn Ma Trận</span><ArrowRight size={14} /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
