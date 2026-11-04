import React from 'react';
import { Network } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { canManageResource } from '@/types/auth';
import { TopicTableSection } from '../questions/components/TopicTableSection';
import { TopicModal } from '../questions/components/TopicModal';
import { DeleteTopicConfirmModal } from '../questions/components/DeleteTopicConfirmModal';
import { useAdminTopics } from './hooks/useAdminTopics';
import { AdminTopicsHeader } from './components/AdminTopicsHeader';
import { TopicQuestionsModal } from './components/TopicQuestionsModal';

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const { t } = useTranslation('admin_questions');
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-855 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all">{t('pagination.prev')}</button>
      {Array.from({ length: totalPages }).map((_, idx) => {
        const pNum = idx + 1;
        if (pNum === 1 || pNum === totalPages || Math.abs(pNum - page) <= 1) {
          return <button key={pNum} onClick={() => onChange(pNum)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${page === pNum ? 'bg-blue-650 border-blue-500 text-white shadow' : 'bg-slate-950 border-slate-855 text-slate-400 hover:bg-slate-850 hover:text-white'}`}>{pNum}</button>;
        }
        if (pNum === 2 || pNum === totalPages - 1) return <span key={pNum} className="text-slate-600 text-xs px-1 select-none">...</span>;
        return null;
      })}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages || totalPages === 0} className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-855 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all">{t('pagination.next')}</button>
    </div>
  );
}

export function AdminTopicsPage() {
  const { user } = useAuthContext();
  const state = useAdminTopics(user);

  const myTopicsCount = state.topics.filter(
    t => t.createdByUserId && String(t.createdByUserId) === String(user?.id)
  ).length;

  const handleDeleteTopic = (id: string) => {
    const top = state.topics.find(t => t.id === id);
    if (!top) return;
    if (!canManageResource(user, top)) {
      alert('Bạn không có quyền xóa chủ đề này. Chỉ chủ sở hữu hoặc quản trị viên tenant/hệ thống mới được xóa.');
      return;
    }
    state.setTopicToDelete(top);
  };

  return (
    <div className="space-y-6 font-sans">
      <AdminTopicsHeader
        totalTopics={state.topics.length}
        myTopicsCount={myTopicsCount}
        hasUser={!!user}
        myOnly={state.myOnly}
        setMyOnly={state.setMyOnly}
        loading={state.loading}
        onRefresh={state.fetchTopicsData}
        onOpenAddModal={() => state.openAddTopicModal()}
      />

      <div className="bg-slate-900 border border-slate-855 rounded-2xl p-6 shadow-xl relative">
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
      />

      <TopicQuestionsModal
        isOpen={state.isQuestionsModalOpen}
        topic={state.selectedTopicForQuestions}
        questions={state.questions}
        allTopics={state.topics}
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
    </div>
  );
}

export default AdminTopicsPage;
