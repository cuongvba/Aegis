import React from 'react';
import { FolderTree, Play, BarChart3, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TeamAssignableTopicNode } from '../hooks/useTeamManagement';

interface ClassroomTopicResourcesProps {
  topics: TeamAssignableTopicNode[];
  copiedCode: string | null;
  onCopyPracticeLink: (topicCode: string) => void;
  onOpenDiagnosticModal: (topic: { code: string; name: string; totalQuestions: number }) => void;
}

export const ClassroomTopicResources: React.FC<ClassroomTopicResourcesProps> = ({
  topics,
  copiedCode,
  onCopyPracticeLink,
  onOpenDiagnosticModal,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
      <div className="px-5 py-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderTree size={18} className="text-amber-400" />
          <h2 className="text-sm sm:text-base font-extrabold text-white">
            {t('classroom.topicResourcesTitle', 'Học Liệu & Đề Thi Sư Phạm Đã Giao')} ({topics.length})
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/practice')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition"
          >
            <Play size={12} />
            <span>{t('classroom.openPractice', 'Mở phòng luyện thi')} &rarr;</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/creator/topics')}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer transition"
          >
            {t('classroom.manageTopics', 'Quản lý Cây Chủ Đề')} &rarr;
          </button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {topics.slice(0, 9).map((top) => (
          <div
            key={top.id}
            className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-3 shadow-md"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                  {top.code}
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-400">
                  {top.totalQuestionCount} {t('classroom.questionsUnit', 'câu hỏi')}
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-white mt-2 line-clamp-1" title={top.name}>
                {top.name}
              </h3>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                {top.materializedPath || `/${top.code}/`}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() =>
                  onOpenDiagnosticModal({
                    code: top.code,
                    name: top.name,
                    totalQuestions: top.totalQuestionCount || 10,
                  })
                }
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition cursor-pointer"
              >
                <BarChart3 size={13} />
                <span>{t('classroom.classReport', 'Báo Cáo Lớp')}</span>
              </button>

              <button
                type="button"
                onClick={() => onCopyPracticeLink(top.code)}
                className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
              >
                {copiedCode === top.code ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedCode === top.code ? t('common.copied', 'Đã chép') : t('classroom.shareLink', 'Link Bài')}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(`/creator/questions?topicCode=${encodeURIComponent(top.code)}`)
                }
                className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                {t('classroom.viewQuestions', 'Câu hỏi')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

