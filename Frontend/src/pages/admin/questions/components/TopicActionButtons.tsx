import React from 'react';
import { Eye, HelpCircle, Send, Play, FileText, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BankTopic } from '../types';

interface TopicActionButtonsProps {
  topic: BankTopic;
  questionCount: number;
  hasWritePermission: boolean;
  onOpenQuestions?: (topic: BankTopic) => void;
  openEditModal: (topic: BankTopic) => void;
  onAssignHomework?: (topic: BankTopic) => void;
  onLaunchArena?: (topic: BankTopic) => void;
  onExportDocx?: (topic: BankTopic) => void;
  handleToggleActive?: (topic: BankTopic) => void;
  handleDelete?: (id: string) => void;
}

export const TopicActionButtons: React.FC<TopicActionButtonsProps> = ({
  topic,
  questionCount,
  hasWritePermission,
  onOpenQuestions,
  openEditModal,
  onAssignHomework,
  onLaunchArena,
  onExportDocx,
  handleToggleActive,
  handleDelete,
}) => {
  const { t } = useTranslation('admin_questions');

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => onOpenQuestions?.(topic)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-sky-400 hover:text-white bg-sky-950/60 hover:bg-sky-900/80 border border-sky-500/30 hover:border-sky-500/60 rounded-lg transition cursor-pointer shadow-sm"
        title="Xem danh sách câu hỏi của chủ đề này"
      >
        <HelpCircle size={13} />
        <span>Câu hỏi</span>
        {questionCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-500/30 text-sky-200 font-mono">
            {questionCount}
          </span>
        )}
      </button>
      <button
        onClick={() => openEditModal(topic)}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        title={t('tooltips.viewDetails')}
      >
        <Eye size={14} />
      </button>
      {onAssignHomework && (
        <button
          type="button"
          onClick={() => onAssignHomework(topic)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-lg transition cursor-pointer shadow-sm"
          title="Giao bài tập cho học sinh từ chủ đề này"
        >
          <Send size={12} />
          <span>Giao bài</span>
        </button>
      )}
      {onLaunchArena && (
        <button
          type="button"
          onClick={() => onLaunchArena(topic)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 rounded-lg transition cursor-pointer shadow-sm"
          title="Mở phòng Đấu Trường Trực Tiếp (Arena Gameshow)"
        >
          <Play size={12} />
          <span>Đấu trường</span>
        </button>
      )}
      {onExportDocx && (
        <button
          type="button"
          onClick={() => onExportDocx(topic)}
          className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Xuất file Word đề thi chuẩn GDPT 2025"
        >
          <FileText size={14} />
        </button>
      )}
      {hasWritePermission && handleToggleActive && (
        <button
          onClick={() => handleToggleActive(topic)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title={topic.enabled ? t('tooltips.deactivate') : t('tooltips.activate')}
        >
          {topic.enabled ? <ToggleRight size={16} className="text-green-400" /> : <ToggleLeft size={16} className="text-slate-600" />}
        </button>
      )}
      {hasWritePermission && handleDelete && (
        <button
          onClick={() => handleDelete(topic.id)}
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
          title={t('tooltips.delete')}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};
