import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, CopyCheck, FolderTree, FolderPlus } from 'lucide-react';
import { learnerQuizService } from '@/services/learner-quiz.service';
import type { BankTopic } from '@/pages/admin/questions/types';
import type { LearnerQuestion } from '@/types/quiz';
import { flattenTopicTreeForSelect } from '@/shared/lib/quiz/topicTreeHelper';
import { ZenQuestionPatch, ZenUploadResult } from '../types/zen-studio.types';
import { ZenTaxonomyBadge } from './ZenTaxonomyBadge';
import { ZenQuestionCard } from './ZenQuestionCard';
import { ZenPaginationBar } from './ZenPaginationBar';
import { ZenQuickTopicModal } from './ZenQuickTopicModal';
import { useZenPagination } from '../hooks/useZenPagination';

interface ZenExamPreviewProps {
  data: ZenUploadResult;
  onOpenArenaSelector: () => void;
  onPureSaveToBank?: (parentTopicId?: string | null) => void;
  isPureSavingToBank?: boolean;
  onOpenHomeworkConfig?: () => void;
  onOpenExportModal?: () => void;
  onReset: () => void;
  onUpdateQuestion: (order: number, patch: ZenQuestionPatch) => void;
  isLaunching: boolean;
}

export const ZenExamPreview: React.FC<ZenExamPreviewProps> = ({
  data,
  onOpenArenaSelector,
  onPureSaveToBank,
  isPureSavingToBank,
  onOpenHomeworkConfig,
  onOpenExportModal,
  onReset,
  onUpdateQuestion,
  isLaunching,
}) => {
  const { t } = useTranslation('creator');
  const pager = useZenPagination(data.questions.length);
  const visible = data.questions.slice(pager.range.start, pager.range.end);
  const editedCount = data.questions.filter((q) => q.edited).length;

  const [topics, setTopics] = useState<BankTopic[]>([]);
  const [questions, setQuestions] = useState<LearnerQuestion[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [quickTopicModalOpen, setQuickTopicModalOpen] = useState(false);

  const loadTopics = async () => {
    try {
      const [tData, qData] = await Promise.all([
        learnerQuizService.getTopics(false, true),
        learnerQuizService.getQuestions({ myOnly: true }),
      ]);
      setTopics(tData);
      setQuestions(qData);
    } catch {
      // Ignore background load error
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const treeOptions = useMemo(
    () => flattenTopicTreeForSelect(topics, questions),
    [topics, questions]
  );

  return (
    <div className="space-y-6 pb-28 animate-fadeIn">
      {/* Header Info Card + Hierarchical Topic Selector */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                {data.examTitle}
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {t('preview.totalQuestions', { count: data.totalQuestions })}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-emerald-400 font-medium">
              <CopyCheck className="w-4 h-4 shrink-0" />
              <span>{t('preview.casDeduplication', { rate: data.deduplicationRatePercentage })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('actions.reset')}
            </button>
          </div>
        </div>

        {/* Hierarchical Parent Folder Picker for Saving to Bank */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <FolderTree size={15} className="text-amber-400 shrink-0" />
            <span className="font-bold text-amber-300">Nhánh lưu vào Cây Chủ Đề:</span>
          </div>
          <div className="flex flex-1 sm:max-w-xl items-center gap-2">
            <select
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">
                📂 Tự động phân cấp theo ngày (/STUDIO/YYYYMMDD/Creator/...)
              </option>
              {treeOptions.map((opt) => (
                <option key={opt.topic.id} value={opt.topic.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setQuickTopicModalOpen(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold shrink-0 cursor-pointer"
            >
              <FolderPlus size={13} />
              <span>+ Tạo Nhánh</span>
            </button>
          </div>
        </div>
      </div>

      <ZenTaxonomyBadge taxonomy={data.suggestedTaxonomy} />

      <div className="space-y-4">
        {visible.map((q) => (
          <ZenQuestionCard key={q.order} question={q} onUpdate={onUpdateQuestion} />
        ))}
      </div>

      <ZenPaginationBar
        page={pager.page}
        totalPages={pager.totalPages}
        pageSize={pager.pageSize}
        total={data.questions.length}
        rangeStart={pager.range.start}
        rangeEnd={pager.range.end}
        pageWindow={pager.pageWindow}
        editedCount={editedCount}
        isLaunching={isLaunching}
        onGoTo={pager.goTo}
        onPageSize={pager.changePageSize}
        onOpenArenaSelector={onOpenArenaSelector}
        onPureSaveToBank={
          onPureSaveToBank ? () => onPureSaveToBank(selectedParentId || null) : undefined
        }
        isPureSavingToBank={isPureSavingToBank}
        onOpenHomeworkConfig={onOpenHomeworkConfig}
        onOpenExportModal={onOpenExportModal}
        onCancel={onReset}
      />

      <ZenQuickTopicModal
        isOpen={quickTopicModalOpen}
        editingTopic={null}
        defaultParentId={selectedParentId || null}
        topics={topics}
        questions={questions}
        onClose={() => setQuickTopicModalOpen(false)}
        onSubmit={async (payload) => {
          const created = await learnerQuizService.createTopic({
            code: payload.code,
            name: payload.name,
            description: payload.description || '',
            categoryCode: payload.code,
            parentId: payload.parentId || null,
            visibilityScope: 'PUBLIC',
            domainCode: payload.domainCode || 'EDUCATION',
            scope: 'PERSONAL',
            enabled: true,
          });
          await loadTopics();
          if (created?.id) {
            setSelectedParentId(created.id);
          }
        }}
      />
    </div>
  );
};
