import React from 'react';
import { Plus, Edit, Lock, Unlock, Trash2, Sparkles, Save } from 'lucide-react';
import type { LearnerQuestion } from '@/types/quiz';

interface QuestionModalFooterProps {
  isEditing: boolean;
  editingId: string | null;
  hasWritePermission: boolean;
  isManageable: boolean;
  activeQuestion?: LearnerQuestion;
  questions: LearnerQuestion[];
  onOpenAdd: () => void;
  onOpenEdit: (q: LearnerQuestion) => void;
  onDelete: (id: string) => void;
  onToggleActive: (q: LearnerQuestion) => void;
  setIsEditing: (v: boolean) => void;
  onClose: () => void;
  onSaveAndContinue?: (e: React.FormEvent) => void;
}

export const QuestionModalFooter: React.FC<QuestionModalFooterProps> = ({
  isEditing,
  editingId,
  hasWritePermission,
  isManageable,
  activeQuestion,
  questions,
  onOpenAdd,
  onOpenEdit,
  onDelete,
  onToggleActive,
  setIsEditing,
  onClose,
  onSaveAndContinue,
}) => {
  if (!isEditing) {
    return (
      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        {hasWritePermission ? (
          <>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenAdd();
                  setIsEditing(true);
                }}
                className="py-2.5 bg-slate-950 hover:bg-slate-850 text-blue-400 border border-slate-850 rounded-xl font-bold transition-all text-[10px] flex flex-col items-center justify-center gap-1 cursor-pointer"
                title="Tạo câu hỏi mới"
              >
                <Plus size={14} /> Mới
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isManageable) {
                    alert('Bạn chỉ có quyền chỉnh sửa câu hỏi do chính bạn hoặc nhóm bạn tạo ra.');
                    return;
                  }
                  setIsEditing(true);
                }}
                disabled={!isManageable}
                className={`py-2.5 border rounded-xl font-bold transition-all text-[10px] flex flex-col items-center justify-center gap-1 ${
                  isManageable
                    ? 'bg-slate-950 hover:bg-slate-850 text-amber-400 border-slate-850 cursor-pointer'
                    : 'bg-slate-950/40 text-slate-600 border-slate-800/40 cursor-not-allowed opacity-50'
                }`}
                title={isManageable ? 'Chỉnh sửa' : 'Bạn không sở hữu câu hỏi này'}
              >
                <Edit size={14} /> Sửa
              </button>
              <button
                type="button"
                disabled={!isManageable}
                onClick={async () => {
                  if (!isManageable) {
                    alert('Bạn chỉ có quyền khóa/mở câu hỏi do chính bạn hoặc nhóm bạn tạo ra.');
                    return;
                  }
                  if (editingId && activeQuestion) await onToggleActive(activeQuestion);
                }}
                className={`py-2.5 border rounded-xl font-bold transition-all text-[10px] flex flex-col items-center justify-center gap-1 ${
                  isManageable
                    ? `bg-slate-950 hover:bg-slate-850 cursor-pointer border-slate-850 ${
                        activeQuestion?.enabled !== false ? 'text-orange-400' : 'text-emerald-400'
                      }`
                    : 'bg-slate-950/40 text-slate-600 border-slate-800/40 cursor-not-allowed opacity-50'
                }`}
                title={isManageable ? 'Bật/Tắt Kích hoạt' : 'Bạn không sở hữu câu hỏi này'}
              >
                {activeQuestion?.enabled !== false ? <Lock size={14} /> : <Unlock size={14} />}
                {activeQuestion?.enabled !== false ? 'Khóa' : 'Kích hoạt'}
              </button>
              <button
                type="button"
                disabled={!isManageable}
                onClick={() => {
                  if (!isManageable) {
                    alert('Bạn chỉ có quyền xóa câu hỏi do chính bạn hoặc nhóm bạn tạo ra.');
                    return;
                  }
                  if (editingId) {
                    onDelete(editingId);
                    onClose();
                  }
                }}
                className={`py-2.5 border rounded-xl font-bold transition-all text-[10px] flex flex-col items-center justify-center gap-1 ${
                  isManageable
                    ? 'bg-slate-950 hover:bg-slate-850 text-red-400 border-slate-850 cursor-pointer'
                    : 'bg-slate-950/40 text-slate-600 border-slate-800/40 cursor-not-allowed opacity-50'
                }`}
                title={isManageable ? 'Xóa câu hỏi' : 'Bạn không sở hữu câu hỏi này'}
              >
                <Trash2 size={14} /> Xóa
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 rounded-xl font-bold transition-all text-xs cursor-pointer"
            >
              Đóng
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 rounded-xl font-bold transition-all text-xs cursor-pointer"
          >
            Đóng
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-slate-800/80">
      <button
        type="button"
        onClick={() => {
          if (editingId) {
            const original = questions.find(q => q.id === editingId);
            if (original) onOpenEdit(original);
            setIsEditing(false);
          } else {
            onClose();
          }
        }}
        className="py-3 px-4 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl font-bold transition-all text-xs border border-slate-800 cursor-pointer"
      >
        Hủy bỏ
      </button>

      {!editingId && onSaveAndContinue && (
        <button
          type="button"
          onClick={onSaveAndContinue}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-400/30"
          title="Lưu câu hiện tại và giữ nguyên bài đọc để nhập tiếp câu sau"
        >
          <Sparkles size={14} className="text-amber-300 animate-pulse" />
          <span>💾 Lưu &amp; Thêm câu tiếp (Ctrl+Enter)</span>
        </button>
      )}

      <button
        type="submit"
        className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/10 active:scale-95 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Save size={14} /> {!editingId ? 'Lưu & Hoàn tất' : 'Lưu Thay đổi'}
      </button>
    </div>
  );
};

