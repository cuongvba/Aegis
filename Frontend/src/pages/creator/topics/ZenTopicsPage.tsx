import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Network, FolderTree, Plus, RefreshCw, Sparkles, FileQuestion, Users, ShieldCheck } from 'lucide-react';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { canManageResource } from '@/types/auth';
import { TopicTableSection } from '@/pages/admin/questions/components/TopicTableSection';
import { TopicModal } from '@/pages/admin/questions/components/TopicModal';
import { DeleteTopicConfirmModal } from '@/pages/admin/questions/components/DeleteTopicConfirmModal';
import { TopicQuestionsModal } from '@/pages/admin/topics/components/TopicQuestionsModal';
import { CreatorWorkspaceNav } from '../components/CreatorWorkspaceNav';
import { useZenTopics } from './hooks/useZenTopics';
import { useZenLauncher } from '../studio/hooks/useZenLauncher';
import { ZenArenaGameSelectorModal } from '../studio/components/ZenArenaGameSelectorModal';
import { ZenHomeworkConfigModal } from '../studio/components/ZenHomeworkConfigModal';
import { ZenRoomLauncherModal } from '../studio/components/ZenRoomLauncherModal';
import { ZenBankSaveModal } from '../studio/components/ZenBankSaveModal';

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const { t } = useTranslation('admin_questions');
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-855 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all">{t('pagination.prev')}</button>
      {Array.from({ length: totalPages }).map((_, idx) => {
        const pNum = idx + 1;
        if (pNum === 1 || pNum === totalPages || Math.abs(pNum - page) <= 1) {
          return <button key={pNum} onClick={() => onChange(pNum)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${page === pNum ? 'bg-amber-600 border-amber-500 text-white shadow' : 'bg-slate-950 border-slate-855 text-slate-400 hover:bg-slate-850 hover:text-white'}`}>{pNum}</button>;
        }
        if (pNum === 2 || pNum === totalPages - 1) return <span key={pNum} className="text-slate-600 text-xs px-1 select-none">...</span>;
        return null;
      })}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages || totalPages === 0} className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-855 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all">{t('pagination.next')}</button>
    </div>
  );
}

export const ZenTopicsPage: React.FC = () => {
  const { t } = useTranslation('creator');
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const state = useZenTopics(user);
  const launcher = useZenLauncher();

  const directOwnedCount = state.topics.filter(
    top => top.createdByUserId && String(top.createdByUserId) === String(user?.id)
  ).length;

  const handleDeleteTopic = (id: string) => {
    const top = state.topics.find(x => x.id === id);
    if (!top) return;
    if (!canManageResource(user, top)) {
      alert('Thầy/Cô chỉ có quyền xóa chủ đề hoặc đề thi do chính mình tạo ra.');
      return;
    }
    state.setTopicToDelete(top);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-4 sm:py-6 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <CreatorWorkspaceNav />

        {/* ZenTopics Sovereign Header */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-indigo-950/30 border border-amber-500/25 rounded-2xl p-5 shadow-xl">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FolderTree size={18} />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {t('zenTopics.title', 'ZenTopics — Cây Chủ Đề & Đề Thi Của Tôi')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono text-xs font-bold">
                {directOwnedCount || state.topics.length} chủ đề
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-xs font-bold">
                {state.questions.length} câu hỏi sở hữu
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
              <span>
                {t(
                  'zenTopics.subtitle',
                  'Không gian chủ quyền tác giả: Quản lý, phân cấp và bảo vệ toàn vẹn các chủ đề, đề thi do chính Thầy/Cô khởi tạo.'
                )}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={state.fetchZenTopicsData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw size={13} className={state.loading ? 'animate-spin text-amber-400' : ''} />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/creator/questions')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
            >
              <FileQuestion size={14} className="text-emerald-400" />
              <span>Kho Câu Hỏi Của Tôi &rarr;</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/creator/studio')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition cursor-pointer"
            >
              <Sparkles size={14} className="text-indigo-400" />
              <span>Nạp Đề Từ Zen Studio</span>
            </button>

            <button
              type="button"
              onClick={() => state.openAddTopicModal()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus size={14} />
              <span>Tạo Chủ Đề Mới</span>
            </button>
          </div>
        </div>

        {/* Topic Hierarchy & Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative">
          <TopicTableSection
            topics={state.topics}
            questions={state.questions}
            pagedTopics={state.tFilters.pagedTopics}
            filteredTopics={state.tFilters.filteredTopics}
            tSearch={state.tFilters.tSearch}
            setTSearch={state.tFilters.setTSearch}
            tPage={state.tFilters.tPage}
            setTPage={state.tFilters.setTPage}
            tPageSize={state.tFilters.tPageSize}
            tTotalPages={state.tFilters.tTotalPages}
            tSortField={state.tFilters.tSortField}
            setTSortField={state.tFilters.setTSortField}
            tSortAsc={state.tFilters.tSortAsc}
            setTSortAsc={state.tFilters.setTSortAsc}
            hasWritePermission={true}
            openEditTopicModal={state.openEditTopicModal}
            openAddChildTopicModal={(parentId: string) => state.openAddTopicModal(parentId)}
            onOpenQuestions={state.openQuestionsModal}
            onAssignHomework={(top) => launcher.openHomeworkForTopic(top, state.questions)}
            onLaunchArena={(top) => launcher.openArenaForTopic(top, state.questions)}
            renderSortIcon={(field, currentField, isAsc) => (
              <span className={`inline-flex ml-1.5 ${field === currentField ? 'text-amber-400' : 'text-slate-600'}`}>
                <Network size={11} className={field === currentField && !isAsc ? 'rotate-180 transform' : ''} />
              </span>
            )}
            Pagination={Pagination}
          />
        </div>

        <TopicModal
          isOpen={state.isTopicModalOpen}
          isEditingTopic={state.isEditingTopic}
          editingTopicId={state.editingTopicId}
          hasWritePermission={true}
          topics={state.topics}
          questions={state.questions}
          topicCode={state.topicCode}
          topicName={state.topicName}
          topicDesc={state.topicDesc}
          topicCat={state.topicCat}
          topicVisibility={state.topicVisibility}
          topicParentId={state.topicParentId}
          topicDomainCode={state.topicDomainCode}
          topicScope={state.topicScope}
          setTopicCode={state.setTopicCode}
          setTopicName={state.setTopicName}
          setTopicDesc={state.setTopicDesc}
          setTopicCat={state.setTopicCat}
          setTopicVisibility={state.setTopicVisibility}
          setTopicParentId={state.setTopicParentId}
          setTopicDomainCode={state.setTopicDomainCode}
          setTopicScope={state.setTopicScope}
          setIsEditingTopic={state.setIsEditingTopic}
          onClose={() => state.setIsTopicModalOpen(false)}
          onSave={state.handleSaveTopic}
          onOpenAdd={() => state.openAddTopicModal()}
          onOpenEdit={state.openEditTopicModal}
          onOpenQuestions={state.openQuestionsModal}
          onDelete={handleDeleteTopic}
          onContributeCommunity={state.handleContributeCommunity}
          isContributing={state.isContributing}
          onAssignHomework={(top) => launcher.openHomeworkForTopic(top, state.questions)}
          onLaunchArena={(top) => launcher.openArenaForTopic(top, state.questions)}
        />

        <TopicQuestionsModal
          isOpen={state.isQuestionsModalOpen}
          topic={state.selectedTopicForQuestions}
          questions={state.questions}
          allTopics={state.topics}
          questionBankBasePath="/creator/questions"
          onClose={state.closeQuestionsModal}
        />

        <DeleteTopicConfirmModal
          topicToDelete={state.topicToDelete}
          topics={state.topics}
          questions={state.questions}
          isDeletingTopicLoading={state.isDeletingTopicLoading}
          onClose={() => state.setTopicToDelete(null)}
          onConfirm={state.confirmDeleteTopic}
        />

        {/* Realtime Arena & Homework Practice Modals */}
        <ZenArenaGameSelectorModal
          isOpen={launcher.isArenaSelectorOpen}
          isLoading={launcher.isLaunching}
          totalQuestions={launcher.stagedArenaPayload?.totalQuestions ?? 0}
          onClose={launcher.closeArenaSelector}
          onConfirm={(code, dur) => launcher.confirmLaunchArena(code, dur)}
        />
        <ZenHomeworkConfigModal
          isOpen={launcher.isHomeworkModalOpen}
          isLoading={launcher.isSavingHomework}
          initialConfig={launcher.homeworkConfig}
          onClose={launcher.closeHomeworkModal}
          onConfirm={(cfg) => launcher.confirmHomework(cfg)}
        />
        {launcher.launchResult && (
          <ZenRoomLauncherModal
            room={launcher.launchResult}
            onClose={launcher.closeRoomLauncher}
          />
        )}
        {launcher.bankSaveResult && (
          <ZenBankSaveModal
            result={launcher.bankSaveResult}
            onClose={launcher.closeBankSaveModal}
          />
        )}
      </div>
    </div>
  );
};

export default ZenTopicsPage;

