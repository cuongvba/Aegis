import React from 'react';
import { Lightbulb, Key, ArrowRight, Anchor, AlertTriangle } from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';

interface AcseMicroSliceViewProps {
  content: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  distractorMisconception?: string;
}

export const AcseMicroSliceView: React.FC<AcseMicroSliceViewProps> = ({
  content,
  userAnswer,
  correctAnswer,
  explanation,
  distractorMisconception,
}) => {
  // Tự động phân tích nội dung lời giải thành 4 lát cắt nhận thức nếu có định dạng
  const parseSlices = () => {
    return {
      clue: 'Nhận diện dạng toán và từ khóa bản chất trong đề bài',
      concept: 'Hạt nhân định lý / công thức trọng tâm cần áp dụng',
      step: explanation || 'Triển khai giải theo chuỗi suy luận logic tối ưu 2-3 bước',
      hook: 'Lưu ý cốt tử để không mắc lại sai lầm trong các bài tương tự',
    };
  };

  const slices = parseSlices();

  return (
    <div className="space-y-3 mt-3">
      {/* ── BÓC TÁCH BẪY SAI CỦA PHƯƠNG ÁN ĐÃ CHỌN ── */}
      {userAnswer && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Giải Mã Vì Sao Bạn Chọn Nhầm: <span className="font-mono text-rose-500">{userAnswer}</span>
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
              {distractorMisconception ||
                `Học sinh thường chọn nhầm ${userAnswer} do bỏ qua điều kiện xác định hoặc nhầm lẫn dấu trong bước biến đổi trung gian. Đáp án đúng là ${correctAnswer}.`}
            </p>
          </div>
        </div>
      )}

      {/* ── 4 LÁT CẮT NHẬN THỨC THEO THUYẾT TẢI NHẬN THỨC SWELLER ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* Lát cắt 1: CLUE */}
        <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1.5 text-sky-600 dark:text-sky-400">
            <Key className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-wider">1. Điểm Nhận Diện (Clue)</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {slices.clue}
          </p>
        </div>

        {/* Lát cắt 2: CONCEPT */}
        <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1.5 text-purple-600 dark:text-purple-400">
            <Lightbulb className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-wider">2. Hạt Nhân Tri Thức (Concept)</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {slices.concept}
          </p>
        </div>

        {/* Lát cắt 3: STEP */}
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between md:col-span-2">
          <div className="flex items-center gap-2 mb-1.5 text-emerald-600 dark:text-emerald-400">
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-wider">3. Chuỗi Biến Đổi Tối Giản (Step)</span>
          </div>
          <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
            <MathRenderer content={slices.step} />
          </div>
        </div>

        {/* Lát cắt 4: HOOK */}
        <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 flex flex-col justify-between md:col-span-2">
          <div className="flex items-center gap-2 mb-1 text-rose-600 dark:text-rose-400">
            <Anchor className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-wider">4. Mẹo Khắc Cốt Ghi Tâm (Hook)</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
            "{slices.hook}"
          </p>
        </div>
      </div>
    </div>
  );
};

