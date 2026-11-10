import React from 'react';
import { X, Users, User, ShieldCheck } from 'lucide-react';
import type { LearnerQuestion } from '@/types/quiz';

interface QuestionModalHeaderProps {
  isEditing: boolean;
  editingId: string | null;
  activeQuestion?: LearnerQuestion;
  onClose: () => void;
}

export const QuestionModalHeader: React.FC<QuestionModalHeaderProps> = ({
  isEditing,
  editingId,
  activeQuestion,
  onClose,
}) => {
  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
        title="Đóng (Esc)"
      >
        <X size={18} />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
        <div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            {isEditing ? (editingId ? 'Cập nhật Câu hỏi' : 'Tạo Câu hỏi Mới') : 'Chi tiết Câu hỏi'}
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            Cấu hình ngân hàng đề thi đa tầng &amp; quyền sở hữu
          </p>
        </div>

        {/* Attribution & Scope Badge */}
        {activeQuestion && (
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border ${
                activeQuestion.scope === 'TEAM'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                  : activeQuestion.scope === 'PERSONAL'
                  ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                  : 'bg-blue-950/60 text-blue-300 border-blue-500/40'
              }`}
            >
              {activeQuestion.scope === 'TEAM' ? (
                <Users size={12} />
              ) : activeQuestion.scope === 'PERSONAL' ? (
                <User size={12} />
              ) : (
                <ShieldCheck size={12} />
              )}
              {activeQuestion.scope === 'TEAM'
                ? 'Cấp Nhóm'
                : activeQuestion.scope === 'PERSONAL'
                ? 'Cá nhân'
                : 'Toàn cơ quan'}
            </span>

            {(activeQuestion.orgUnitName || activeQuestion.creatorName) && (
              <span className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-950/80 text-slate-300 border border-slate-800 flex items-center gap-1.5">
                {activeQuestion.orgUnitName && <span>🏢 {activeQuestion.orgUnitName}</span>}
                {activeQuestion.creatorName && <span>✍️ {activeQuestion.creatorName}</span>}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
};

