import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { learnerQuizService } from '@/services/learner-quiz.service';
import type { LearnerQuestion, QuestionType } from '@/types/quiz';
import { canManageResource } from '@/types/auth';
import type { BankTopic } from '@/pages/admin/questions/types';
import { useQuestionFilters } from '@/pages/admin/questions/hooks/useQuestionFilters';

export function useZenQuestions(user: any) {
  const [searchParams] = useSearchParams();
  const initialTopicCode = searchParams.get('topicCode') || '';

  const [questions, setQuestions] = useState<LearnerQuestion[]>([]);
  const [topics, setTopics] = useState<BankTopic[]>([]);
  const [loading, setLoading] = useState(false);

  // Question Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>('SINGLE');
  const [difficulty, setDifficulty] = useState(1);
  const [categoryCode, setCategoryCode] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [citation, setCitation] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [contentType, setContentType] = useState('text');
  const [optionType, setOptionType] = useState('text');
  const [formScope, setFormScope] = useState<'COMMUNITY' | 'TENANT' | 'TEAM' | 'PERSONAL'>('PERSONAL');
  const [formDomainCode, setFormDomainCode] = useState('EDUCATION');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formTargetLevel, setFormTargetLevel] = useState('');
  const [formAssessmentPurpose, setFormAssessmentPurpose] = useState('');
  const [formIssuingOrg, setFormIssuingOrg] = useState('');
  const [formBenchmarkYear, setFormBenchmarkYear] = useState<number | undefined>(2025);

  // Batch & Context state
  const [showAiGenerateModal, setShowAiGenerateModal] = useState(false);
  const [selectedContext, setSelectedContext] = useState<{ title: string; content: string } | null>(null);
  const [availableContexts, setAvailableContexts] = useState<any[]>([]);
  const [currentContextId, setCurrentContextId] = useState('');
  const [currentContextTitle, setCurrentContextTitle] = useState('');
  const [currentContextContent, setCurrentContextContent] = useState('');
  const [isStickyContext, setIsStickyContext] = useState(false);
  const [stickyCount, setStickyCount] = useState(0);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [showBatchContextModal, setShowBatchContextModal] = useState(false);
  const [isBatchAssigning, setIsBatchAssigning] = useState(false);
  const [showBatchTagModal, setShowBatchTagModal] = useState(false);
  const [isBatchTagging, setIsBatchTagging] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const qFilters = useQuestionFilters(questions, topics, user);

  const fetchZenQuestionsData = async () => {
    setLoading(true);
    try {
      const [qData, tData, cData] = await Promise.all([
        learnerQuizService.getQuestions({ myOnly: true }),
        learnerQuizService.getTopics(false, true),
        learnerQuizService.getContexts(),
      ]);
      setQuestions(qData);
      setTopics(tData);
      setAvailableContexts(cData);
      if (tData.length > 0 && !categoryCode) setCategoryCode(tData[0].code);
    } catch (err) {
      console.error('[useZenQuestions] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZenQuestionsData();
  }, [user?.id]);

  useEffect(() => {
    if (initialTopicCode) {
      qFilters.setQTopicFilter(initialTopicCode);
    }
  }, [initialTopicCode]);

  const openAddModal = () => {
    setEditingId(null);
    setContent('');
    setQuestionType('SINGLE');
    setDifficulty(1);
    setCategoryCode(qFilters.qTopicFilter !== 'ALL' ? qFilters.qTopicFilter : (topics[0]?.code || 'GENERAL'));
    setDurationSeconds(60);
    setOptions(['', '', '', '']);
    setCitation('');
    setCorrectAnswer('');
    setContentType('text');
    setOptionType('text');
    setIsEditing(true);
    setFormScope(user?.role === 'TeamLeader' ? 'TEAM' : 'PERSONAL');
    if (!isStickyContext) {
      setCurrentContextId('');
      setCurrentContextTitle('');
      setCurrentContextContent('');
      setStickyCount(0);
      setFormDomainCode('EDUCATION');
      setFormTags([]);
    }
    setIsModalOpen(true);
  };

  const openEditModal = (q: LearnerQuestion) => {
    setEditingId(q.id);
    setContent(q.content);
    setQuestionType(q.questionType);
    setDifficulty(q.difficulty);
    setCategoryCode(q.topicCode || topics[0]?.code || 'GENERAL');
    setDurationSeconds(q.durationSec || 60);
    const optList = q.options && q.options.length > 0 ? [...q.options] : ['', '', '', ''];
    while (optList.length < 4) optList.push('');
    setOptions(optList);
    setCitation(q.citation || '');
    setCorrectAnswer(q.answerRaw || '');
    setContentType(q.contentType || q.questionMediaType || 'text');
    setOptionType(q.optionType || q.optionMediaType || 'text');
    setCurrentContextId(q.contextId || '');
    setCurrentContextTitle(q.contextTitle || '');
    setCurrentContextContent(q.contextContent || '');
    setFormDomainCode(q.domainCode || 'EDUCATION');
    setFormTags(q.tags || []);
    setFormTargetLevel(q.targetLevel || '');
    setFormAssessmentPurpose(q.assessmentPurpose || '');
    setFormIssuingOrg(q.issuingOrg || '');
    setFormBenchmarkYear(q.benchmarkYear || 2025);
    setFormScope(q.scope || 'PERSONAL');
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (q: LearnerQuestion) => {
    if (!canManageResource(user, q)) return alert('Thầy/Cô chỉ có quyền chỉnh sửa câu hỏi của chính mình.');
    const nextEnabled = q.enabled === false;
    try {
      await learnerQuizService.updateQuestion(q.id, { ...q, payload: { correctAnswer: q.answerRaw, options: q.options, enabled: nextEnabled } } as any);
      setQuestions(prev => prev.map(item => item.id === q.id ? { ...item, enabled: nextEnabled } : item));
    } catch { alert('Cập nhật thất bại'); }
  };

  const handleDelete = async (id: string) => {
    const targetQ = questions.find(x => x.id === id);
    if (!canManageResource(user, targetQ)) return alert('Thầy/Cô chỉ có quyền xóa câu hỏi của chính mình.');
    if (!window.confirm('Xác nhận xóa câu hỏi này khỏi kho cá nhân?')) return;
    try { await learnerQuizService.deleteQuestion(id); fetchZenQuestionsData(); } catch { alert('Xóa thất bại'); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      content, questionType, difficulty, durationSeconds, categoryCode,
      options: options.filter(x => x.trim() !== ''), correctOption: correctAnswer, citation, contentType, optionType,
      contextId: currentContextId || undefined, contextTitle: currentContextTitle || undefined,
      contextContent: currentContextContent || undefined, domainCode: formDomainCode, tags: formTags,
      targetLevel: formTargetLevel || undefined, assessmentPurpose: formAssessmentPurpose || undefined,
      issuingOrg: formIssuingOrg || undefined, benchmarkYear: formBenchmarkYear,
      scope: formScope, visibilityScope: formScope === 'TEAM' ? 'TEAM' : 'PUBLIC',
    };
    try {
      if (editingId) await learnerQuizService.updateQuestion(editingId, payload);
      else await learnerQuizService.createQuestion(payload);
      setIsModalOpen(false);
      fetchZenQuestionsData();
    } catch { alert('Lưu câu hỏi thất bại'); }
  };

  const handleSaveAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return alert('Vui lòng nhập nội dung câu hỏi');
    try {
      await learnerQuizService.createQuestion({
        content, questionType, difficulty, durationSeconds, categoryCode,
        options: options.filter(x => x.trim() !== ''), correctOption: correctAnswer, citation, contentType, optionType,
        contextId: currentContextId || undefined, contextTitle: currentContextTitle || undefined,
        contextContent: currentContextContent || undefined, domainCode: formDomainCode, tags: formTags,
        scope: formScope, visibilityScope: 'PUBLIC',
      });
      setStickyCount(prev => prev + 1); setIsStickyContext(true);
      setContent(''); setOptions(['', '', '', '']); setCorrectAnswer(''); setCitation('');
      fetchZenQuestionsData();
    } catch { alert('Lưu câu hỏi thất bại'); }
  };

  const handleSelectRange = () => {
    const from = parseInt(rangeFrom), to = parseInt(rangeTo);
    if (isNaN(from) || isNaN(to) || from < 1 || to < from) return alert('Khoảng chọn không hợp lệ');
    const ids = qFilters.filteredQuestions.slice(from - 1, to).map(q => q.id);
    setSelectedQuestionIds(prev => Array.from(new Set([...prev, ...ids])));
  };

  const handleBulkDeleteQuestions = async () => {
    if (!window.confirm(`⚠️ Xác nhận xóa vĩnh viễn ${selectedQuestionIds.length} câu hỏi đã chọn của Thầy/Cô?`)) return;
    setIsBulkDeleting(true);
    try {
      await learnerQuizService.bulkDeleteQuestions(selectedQuestionIds);
      setSelectedQuestionIds([]);
      fetchZenQuestionsData();
    } catch { alert('Xóa hàng loạt thất bại'); }
    finally { setIsBulkDeleting(false); }
  };

  return {
    questions, topics, loading, qFilters, fetchZenQuestionsData,
    isModalOpen, setIsModalOpen, isEditing, setIsEditing, editingId,
    content, setContent, questionType, setQuestionType, difficulty, setDifficulty,
    categoryCode, setCategoryCode, durationSeconds, setDurationSeconds,
    options, setOptions, citation, setCitation, correctAnswer, setCorrectAnswer,
    contentType, setContentType, optionType, setOptionType,
    formScope, setFormScope, formDomainCode, setFormDomainCode, formTags, setFormTags,
    formTargetLevel, setFormTargetLevel, formAssessmentPurpose, setFormAssessmentPurpose,
    formIssuingOrg, setFormIssuingOrg, formBenchmarkYear, setFormBenchmarkYear,
    showAiGenerateModal, setShowAiGenerateModal, selectedContext, setSelectedContext,
    availableContexts, currentContextId, setCurrentContextId,
    currentContextTitle, setCurrentContextTitle, currentContextContent, setCurrentContextContent,
    isStickyContext, setIsStickyContext, stickyCount, setStickyCount,
    selectedQuestionIds, setSelectedQuestionIds, rangeFrom, setRangeFrom, rangeTo, setRangeTo,
    showBatchContextModal, setShowBatchContextModal, isBatchAssigning, setIsBatchAssigning,
    showBatchTagModal, setShowBatchTagModal, isBatchTagging, setIsBatchTagging,
    isBulkDeleting, openAddModal, openEditModal, handleToggleActive, handleDelete,
    handleSave, handleSaveAndContinue, handleSelectRange, handleBulkDeleteQuestions,
  };
}

