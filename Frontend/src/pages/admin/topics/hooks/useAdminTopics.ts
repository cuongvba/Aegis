import { useState, useEffect } from 'react';
import { learnerQuizService } from '@/services/learner-quiz.service';
import { canManageResource } from '@/types/auth';
import type { BankTopic } from '../../questions/types';
import { useTopicFilters } from '../../questions/hooks/useTopicFilters';

export function useAdminTopics(user: any) {
  const [topics, setTopics] = useState<BankTopic[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [myOnly, setMyOnly] = useState(false);

  // Topic Modal State
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [topicCode, setTopicCode] = useState('');
  const [topicName, setTopicName] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [topicCat, setTopicCat] = useState('');
  const [topicVisibility, setTopicVisibility] = useState('PUBLIC');
  const [topicParentId, setTopicParentId] = useState('');
  const [topicDomainCode, setTopicDomainCode] = useState('GENERAL');
  const [topicScope, setTopicScope] = useState('COMMUNITY');

  // Topic Questions Modal State
  const [selectedTopicForQuestions, setSelectedTopicForQuestions] = useState<BankTopic | null>(null);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);

  // Delete Confirm State (dự phòng)
  const [topicToDelete, setTopicToDelete] = useState<BankTopic | null>(null);
  const [isDeletingTopicLoading, setIsDeletingTopicLoading] = useState(false);

  const tFilters = useTopicFilters(topics);

  const fetchTopicsData = async () => {
    setLoading(true);
    try {
      const [tData, qData] = await Promise.all([
        learnerQuizService.getTopics(false, myOnly),
        learnerQuizService.getQuestions(),
      ]);
      setTopics(tData);
      setQuestions(qData);
    } catch (err) {
      console.error('[useAdminTopics] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopicsData();
  }, [myOnly]);

  const openAddTopicModal = (parentId = '') => {
    setEditingTopicId(null);
    setTopicCode('');
    setTopicName('');
    setTopicDesc('');
    setTopicCat('');
    setTopicParentId(parentId);
    setTopicVisibility('PUBLIC');
    setTopicDomainCode('GENERAL');
    setTopicScope(user?.role === 'TeamLeader' ? 'TEAM' : 'COMMUNITY');
    setIsEditingTopic(true);
    setIsTopicModalOpen(true);
  };

  const openEditTopicModal = (top: BankTopic) => {
    setEditingTopicId(top.id);
    setTopicCode(top.code);
    setTopicName(top.name);
    setTopicDesc(top.description || '');
    setTopicCat(top.categoryCode || top.code);
    setTopicParentId(top.parentId || '');
    setTopicVisibility(top.visibilityScope || 'PUBLIC');
    setTopicDomainCode(top.domainCode || 'GENERAL');
    setTopicScope(top.scope || 'COMMUNITY');
    setIsEditingTopic(false);
    setIsTopicModalOpen(true);
  };

  const openQuestionsModal = (top: BankTopic) => {
    setSelectedTopicForQuestions(top);
    setIsQuestionsModalOpen(true);
  };

  const closeQuestionsModal = () => {
    setSelectedTopicForQuestions(null);
    setIsQuestionsModalOpen(false);
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: topicCode,
        name: topicName,
        description: topicDesc,
        categoryCode: topicCat || topicCode,
        parentId: topicParentId || null,
        visibilityScope: topicVisibility,
        domainCode: topicDomainCode,
        scope: topicScope,
      };
      if (editingTopicId) {
        await learnerQuizService.updateTopic(editingTopicId, payload);
      } else {
        await learnerQuizService.createTopic(payload);
      }
      setIsTopicModalOpen(false);
      fetchTopicsData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi lưu chủ đề');
    }
  };

  const handleToggleActiveTopic = async (top: BankTopic) => {
    if (!canManageResource(user, top)) {
      alert('Bạn không có quyền thay đổi trạng thái chủ đề này.');
      return;
    }
    try {
      await learnerQuizService.updateTopic(top.id, { ...top, enabled: top.enabled === false });
      fetchTopicsData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi cập nhật');
    }
  };

  const confirmDeleteTopic = async (delQ: boolean) => {
    if (!topicToDelete) return;
    setIsDeletingTopicLoading(true);
    try {
      await learnerQuizService.deleteTopic(topicToDelete.id, delQ);
      setTopicToDelete(null);
      fetchTopicsData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi xóa chủ đề');
    } finally {
      setIsDeletingTopicLoading(false);
    }
  };

  return {
    topics,
    questions,
    loading,
    myOnly,
    setMyOnly,
    tFilters,
    fetchTopicsData,
    isTopicModalOpen,
    setIsTopicModalOpen,
    isEditingTopic,
    setIsEditingTopic,
    editingTopicId,
    topicCode,
    setTopicCode,
    topicName,
    setTopicName,
    topicDesc,
    setTopicDesc,
    topicCat,
    setTopicCat,
    topicVisibility,
    setTopicVisibility,
    topicParentId,
    setTopicParentId,
    topicDomainCode,
    setTopicDomainCode,
    topicScope,
    setTopicScope,
    topicToDelete,
    setTopicToDelete,
    isDeletingTopicLoading,
    selectedTopicForQuestions,
    isQuestionsModalOpen,
    openQuestionsModal,
    closeQuestionsModal,
    openAddTopicModal,
    openEditTopicModal,
    handleSaveTopic,
    handleToggleActiveTopic,
    confirmDeleteTopic,
  };
}
