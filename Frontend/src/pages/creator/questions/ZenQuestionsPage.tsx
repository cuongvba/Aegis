import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileQuestion, Plus, Brain, Sparkles, FolderTree, RefreshCw, ArrowUpDown, ShieldCheck } from 'lucide-react';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { learnerQuizService } from '@/services/learner-quiz.service';
import { QuestionTableSection } from '@/pages/admin/questions/components/QuestionTableSection';
import { QuestionModal } from '@/pages/admin/questions/components/QuestionModal';
import { AiGenerateModal } from '@/pages/admin/questions/components/AiGenerateModal';
import { BatchActionBar } from '@/pages/admin/questions/components/BatchActionBar';
import { BatchContextModal } from '@/pages/admin/questions/components/BatchContextModal';
import { BatchTagModal } from '@/pages/admin/questions/components/BatchTagModal';
import { UniversalContextModal } from '@/pages/admin/questions/components/UniversalContextModal';
import { CreatorWorkspaceNav } from '../components/CreatorWorkspaceNav';
import { useZenQuestions } from './hooks/useZenQuestions';

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const { t } = useTranslation('admin_questions');
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-855 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all">{t('pagination.prev')}</button>
      {Array.from({ length: totalPages }).map((_, idx) => {
        const pNum = idx + 1;
        if (pNum === 1 || pNum === totalPages || Math.abs(pNum - page) <= 1) {
          return <button key={pNum} onClick={() => onChange(pNum)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${page === pNum ? 'bg-emerald-600 border-emerald-500 text-white shadow' : 'bg-slate-950 border-slate-855 text-slate-400 hover:bg-slate-850 hover:text-white'}`}>{pNum}</button>;
        }
        if (pNum === 2 || pNum === totalPages - 1) return <span key={pNum} className="text-slate-600 text-xs px-1 select-none">...</span>;
        return null;
      })}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages || totalPages === 0} className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-855 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all">{t('pagination.next')}</button>
    </div>
  );
}

export const ZenQuestionsPage: React.FC = () => {
  const { t } = useTranslation('creator');
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const state = useZenQuestions(user);

  const renderSortIcon = (field: string, currentField: string, isAsc: boolean) => (
    <span className={`inline-flex ml-1.5 transition-colors ${field === currentField ? 'text-emerald-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
      <ArrowUpDown size={11} className={field === currentField && !isAsc ? 'rotate-180 transform transition-transform' : 'transition-transform'} />
    </span>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-4 sm:py-6 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <CreatorWorkspaceNav />

        {/* ZenQuestions Sovereign Header */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-gradient-to-r from-emerald-950/35 via-slate-900/90 to-indigo-950/30 border border-emerald-500/25 rounded-2xl p-5 shadow-xl">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileQuestion size={18} />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {t('zenQuestions.title', 'ZenQuestions — Ngân Hàng Câu Hỏi Của Tôi')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-xs font-bold">
                {state.questions.length} câu hỏi
              </span>
              {state.qFilters.missingAnswersCount > 0 && (
                <button
                  type="button"
                  onClick={() => state.qFilters.setShowMissingOnly(!state.qFilters.showMissingOnly)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border cursor-pointer bg-amber-500/10 text-amber-400 border-amber-500/30"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>{state.qFilters.missingAnswersCount} thiếu đáp án</span>
                </button>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>
                {t(
                  'zenQuestions.subtitle',
                  'Quản lý, biên tập công thức, gán bài đọc hiểu và bảo tồn toàn bộ kho câu hỏi thuộc chủ quyền của Thầy/Cô.'
                )}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={state.fetchZenQuestionsData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw size={13} className={state.loading ? 'animate-spin text-emerald-400' : ''} />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/creator/topics')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
            >
              <FolderTree size={14} className="text-amber-400" />
              <span>Cây Chủ Đề ({state.topics.length}) &rarr;</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/creator/studio')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition cursor-pointer"
            >
              <Sparkles size={14} className="text-indigo-400" />
              <span>Bóc Tách Đề (Zen Studio)</span>
            </button>

            <button
              type="button"
              onClick={() => state.setShowAiGenerateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition cursor-pointer"
            >
              <Brain size={14} className="text-purple-400" />
              <span>Sinh Bằng AI</span>
            </button>

            <button
              type="button"
              onClick={state.openAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <Plus size={14} />
              <span>Soạn Câu Hỏi Mới</span>
            </button>
          </div>
        </div>

        {/* Questions Table */}
        <div className="bg-slate-900/70 rounded-3xl border border-slate-800 overflow-hidden backdrop-blur-xl shadow-xl">
          <QuestionTableSection
            questions={state.questions}
            topics={state.topics}
            filteredQuestions={state.qFilters.filteredQuestions}
            pagedQuestions={state.qFilters.pagedQuestions}
            user={user}
            hasWritePermission={true}
            selectedQuestionIds={state.selectedQuestionIds}
            rangeFrom={state.rangeFrom}
            rangeTo={state.rangeTo}
            setRangeFrom={state.setRangeFrom}
            setRangeTo={state.setRangeTo}
            handleSelectRange={state.handleSelectRange}
            handleToggleSelect={id => state.setSelectedQuestionIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
            handleToggleSelectAll={() => state.setSelectedQuestionIds(state.qFilters.filteredQuestions.every(q => state.selectedQuestionIds.includes(q.id)) ? [] : state.qFilters.filteredQuestions.map(q => q.id))}
            qSearch={state.qFilters.qSearch}
            setQSearch={state.qFilters.setQSearch}
            qDomainFilter={state.qFilters.qDomainFilter}
            setQDomainFilter={state.qFilters.setQDomainFilter}
            qTopicFilter={state.qFilters.qTopicFilter}
            setQTopicFilter={state.qFilters.setQTopicFilter}
            qTypeFilter={state.qFilters.qTypeFilter}
            setQTypeFilter={state.qFilters.setQTypeFilter}
            showMissingOnly={state.qFilters.showMissingOnly}
            setShowMissingOnly={state.qFilters.setShowMissingOnly}
            qTagFilter={state.qFilters.qTagFilter}
            setQTagFilter={state.qFilters.setQTagFilter}
            qGradeFilter={state.qFilters.qGradeFilter}
            setQGradeFilter={state.qFilters.setQGradeFilter}
            qTreePathFilter={state.qFilters.qTreePathFilter}
            setQTreePathFilter={state.qFilters.setQTreePathFilter}
            qCanonicalTopicFilter={state.qFilters.qCanonicalTopicFilter}
            setQCanonicalTopicFilter={state.qFilters.setQCanonicalTopicFilter}
            qExamFilter={state.qFilters.qExamFilter}
            setQExamFilter={state.qFilters.setQExamFilter}
            availableExams={state.qFilters.availableExams}
            qViewMode={state.qFilters.qViewMode}
            setQViewMode={state.qFilters.setQViewMode}
            qPage={state.qFilters.qPage}
            setQPage={state.qFilters.setQPage}
            qPageSize={state.qFilters.qPageSize}
            qTotalPages={state.qFilters.qTotalPages}
            qSortField={state.qFilters.qSortField}
            setQSortField={state.qFilters.setQSortField}
            qSortAsc={state.qFilters.qSortAsc}
            setQSortAsc={state.qFilters.setQSortAsc}
            renderSortIcon={renderSortIcon}
            setSelectedContext={state.setSelectedContext}
            openEditModal={state.openEditModal}
            setIsEditing={state.setIsEditing}
            handleSuggestAnswer={async q => {
              try {
                const res = await learnerQuizService.suggestQuestionAnswer(q.id);
                state.openEditModal(q);
                state.setIsEditing(true);
                state.setCorrectAnswer(res.suggestedAnswer || '');
                state.setCitation(res.aiExplanation || '');
              } catch { alert('Lỗi gọi AI gợi ý đáp án'); }
            }}
            handleToggleActive={state.handleToggleActive}
            handleDelete={state.handleDelete}
            handleContributeToTenant={async q => {
              if (!confirm('Đề xuất câu hỏi này vào Ngân hàng Chung của Đơn vị/Tenant?')) return;
              try {
                await learnerQuizService.updateQuestion(q.id, { ...q, contributionStatus: 'SUBMITTED_FOR_TENANT' } as any);
                alert('Đã gửi đề xuất thành công!');
                state.fetchZenQuestionsData();
              } catch { alert('Gửi đề xuất thất bại'); }
            }}
            isCleaningOrphans={false}
            handleCleanupOrphans={() => {}}
            Pagination={Pagination}
          />
        </div>

        {/* Modals */}
        <QuestionModal isOpen={state.isModalOpen} isEditing={state.isEditing} editingId={state.editingId} hasWritePermission={true} currentUser={user} scope={state.formScope} setScope={state.setFormScope} questions={state.questions} topics={state.topics} content={state.content} questionType={state.questionType} difficulty={state.difficulty} categoryCode={state.categoryCode} durationSeconds={state.durationSeconds} options={state.options} citation={state.citation} correctAnswer={state.correctAnswer} contentType={state.contentType} optionType={state.optionType} setContent={state.setContent} setQuestionType={state.setQuestionType} setDifficulty={state.setDifficulty} setCategoryCode={state.setCategoryCode} setDurationSeconds={state.setDurationSeconds} setOptions={state.setOptions} setCitation={state.setCitation} setCorrectAnswer={state.setCorrectAnswer} setContentType={state.setContentType} setOptionType={state.setOptionType} setIsEditing={state.setIsEditing} contexts={state.availableContexts} contextId={state.currentContextId} contextTitle={state.currentContextTitle} contextContent={state.currentContextContent} setContextId={state.setCurrentContextId} setContextTitle={state.setCurrentContextTitle} setContextContent={state.setCurrentContextContent} isStickyContext={state.isStickyContext} setIsStickyContext={state.setIsStickyContext} stickyCount={state.stickyCount} setStickyCount={state.setStickyCount} onSaveAndContinue={state.handleSaveAndContinue} domainCode={state.formDomainCode} setDomainCode={state.setFormDomainCode} tags={state.formTags} setTags={state.setFormTags} targetLevel={state.formTargetLevel} setTargetLevel={state.setFormTargetLevel} assessmentPurpose={state.formAssessmentPurpose} setAssessmentPurpose={state.setFormAssessmentPurpose} issuingOrg={state.formIssuingOrg} setIssuingOrg={state.setFormIssuingOrg} benchmarkYear={state.formBenchmarkYear} setBenchmarkYear={state.setFormBenchmarkYear} onClose={() => state.setIsModalOpen(false)} onSave={state.handleSave} onOpenAdd={state.openAddModal} onOpenEdit={state.openEditModal} onDelete={state.handleDelete} onToggleActive={state.handleToggleActive} />
        <AiGenerateModal isOpen={state.showAiGenerateModal} onClose={() => state.setShowAiGenerateModal(false)} topics={state.topics} onSuccess={state.fetchZenQuestionsData} />
        <UniversalContextModal context={state.selectedContext} onClose={() => state.setSelectedContext(null)} />
        <BatchActionBar selectedCount={state.selectedQuestionIds.length} isBulkDeleting={state.isBulkDeleting} onOpenBatchContext={() => state.setShowBatchContextModal(true)} onOpenBatchTag={() => state.setShowBatchTagModal(true)} onBatchRemoveContext={async () => { if (!window.confirm('Gỡ bỏ bài đọc hiểu khỏi các câu đã chọn?')) return; await learnerQuizService.batchRemoveContext(state.selectedQuestionIds); state.setSelectedQuestionIds([]); state.fetchZenQuestionsData(); }} onBulkDelete={state.handleBulkDeleteQuestions} onDeselectAll={() => state.setSelectedQuestionIds([])} />
        <BatchContextModal isOpen={state.showBatchContextModal} onClose={() => state.setShowBatchContextModal(false)} selectedCount={state.selectedQuestionIds.length} contexts={state.availableContexts} onConfirm={async data => { state.setIsBatchAssigning(true); try { await learnerQuizService.batchAssignContext({ questionIds: state.selectedQuestionIds, ...data }); state.setSelectedQuestionIds([]); state.setShowBatchContextModal(false); state.fetchZenQuestionsData(); } catch { alert('Gán ngữ cảnh thất bại'); } finally { state.setIsBatchAssigning(false); } }} isAssigning={state.isBatchAssigning} />
        <BatchTagModal isOpen={state.showBatchTagModal} onClose={() => state.setShowBatchTagModal(false)} selectedCount={state.selectedQuestionIds.length} selectedQuestionIds={state.selectedQuestionIds} onApply={async data => { state.setIsBatchTagging(true); try { await learnerQuizService.batchAssignTags({ questionIds: state.selectedQuestionIds, ...data }); state.setSelectedQuestionIds([]); state.setShowBatchTagModal(false); state.fetchZenQuestionsData(); } catch { alert('Gắn thẻ thất bại'); } finally { state.setIsBatchTagging(false); } }} isSubmitting={state.isBatchTagging} />
      </div>
    </div>
  );
};

export default ZenQuestionsPage;

