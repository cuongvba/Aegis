import { useState, useEffect, useMemo, useCallback } from 'react';
import { learnerQuizService } from '@/services/learner-quiz.service';
import type { BankTopic } from '@/pages/admin/questions/types';
import type { LearnerQuestion } from '@/types/quiz';
import type { ZenQuestionPreview } from '../types/zen-studio.types';
import {
  buildHierarchicalTopicTree,
  getQuestionsForTopicSubtree,
  type HierarchicalTopicNode,
} from '@/shared/lib/quiz/topicTreeHelper';

export function mapLearnerToZenQuestion(q: LearnerQuestion, idx: number): ZenQuestionPreview {
  const anyQ = q as any;
  return {
    order: idx + 1,
    content: q.content || '',
    canonicalHash: q.id || `bank-${idx}`,
    isDuplicate: false,
    questionType: q.questionType || 'SINGLE',
    options: q.options || [],
    correctAnswer: q.answerRaw || '',
    explanation: q.aiExplanation || q.citation || '',
    contextId: q.contextId,
    contextTitle: q.contextTitle,
    contextContent: q.contextContent,
    sourceQuestionNo: q.sourceQuestionNo,
    hierarchyIndex: q.hierarchyIndex,
    fullQuestionIndex: anyQ.fullQuestionIndex,
    subItems: anyQ.subItems,
  };
}

export interface QuickTopicPayload {
  code: string;
  name: string;
  description?: string;
  parentId?: string | null;
  domainCode?: string;
}

export function useZenSavedBank() {
  const [topics, setTopics] = useState<BankTopic[]>([]);
  const [allQuestions, setAllQuestions] = useState<LearnerQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedTopicCode, setSelectedTopicCode] = useState<string>('');
  const [topicSearch, setTopicSearch] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const fetchMyBank = useCallback(async (preferredCode?: string) => {
    setLoading(true);
    try {
      const [tData, qData] = await Promise.all([
        learnerQuizService.getTopics(false, true),
        learnerQuizService.getQuestions({ myOnly: true }),
      ]);
      setTopics(tData);
      setAllQuestions(qData);

      if (preferredCode) {
        setSelectedTopicCode(preferredCode);
      } else if (tData.length > 0) {
        setSelectedTopicCode((prev) => {
          if (prev && tData.some((t) => t.code === prev)) return prev;
          const tree = buildHierarchicalTopicTree(tData, qData);
          const firstWithQuestions = Array.from(tree.nodeByCode.values()).find(
            (n) => n.totalQuestionCount > 0
          );
          return firstWithQuestions?.code || tData[0].code;
        });
      }
    } catch (err) {
      console.error('[useZenSavedBank] Failed to load saved bank:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyBank();
  }, [fetchMyBank]);

  const { roots: topicTreeRoots, nodeByCode, nodeById, allParentIds } = useMemo(
    () => buildHierarchicalTopicTree(topics, allQuestions),
    [topics, allQuestions]
  );

  const selectedTopicNode: HierarchicalTopicNode | undefined = useMemo(
    () => (selectedTopicCode ? nodeByCode.get(selectedTopicCode.toUpperCase()) : undefined),
    [selectedTopicCode, nodeByCode]
  );

  const filteredTopics = useMemo(() => {
    const kw = topicSearch.trim().toLowerCase();
    if (!kw) return topics;
    return topics.filter(
      (t) =>
        t.name.toLowerCase().includes(kw) ||
        t.code.toLowerCase().includes(kw) ||
        (t.description || '').toLowerCase().includes(kw)
    );
  }, [topics, topicSearch]);

  const topicQuestions = useMemo(() => {
    const kw = questionSearch.trim().toLowerCase();
    const subtreeQuestions = selectedTopicCode
      ? getQuestionsForTopicSubtree(selectedTopicCode, topics, allQuestions)
      : allQuestions;

    return subtreeQuestions.filter((q) => {
      if (!kw) return true;
      return (
        (q.content || '').toLowerCase().includes(kw) ||
        (q.topicCode || '').toLowerCase().includes(kw) ||
        (q.tags || []).some((tag) => tag.toLowerCase().includes(kw))
      );
    });
  }, [allQuestions, topics, selectedTopicCode, questionSearch]);

  const selectedQuestions = useMemo(() => {
    if (selectedQuestionIds.length > 0) {
      return allQuestions.filter((q) => selectedQuestionIds.includes(q.id));
    }
    return topicQuestions;
  }, [allQuestions, topicQuestions, selectedQuestionIds]);

  const toggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllInTopic = () => {
    const idsInTopic = topicQuestions.map((q) => q.id);
    const allSelected =
      idsInTopic.length > 0 && idsInTopic.every((id) => selectedQuestionIds.includes(id));
    if (allSelected) {
      setSelectedQuestionIds((prev) => prev.filter((id) => !idsInTopic.includes(id)));
    } else {
      setSelectedQuestionIds((prev) => Array.from(new Set([...prev, ...idsInTopic])));
    }
  };

  const createTopicNode = async (payload: QuickTopicPayload) => {
    const cleanCode = payload.code.trim().toUpperCase().replace(/\s+/g, '_');
    await learnerQuizService.createTopic({
      code: cleanCode,
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
      categoryCode: cleanCode,
      parentId: payload.parentId || null,
      visibilityScope: 'PUBLIC',
      domainCode: payload.domainCode || 'EDUCATION',
      scope: 'PERSONAL',
      enabled: true,
    });
    await fetchMyBank(cleanCode);
  };

  const updateTopicNode = async (id: string, payload: QuickTopicPayload) => {
    const cleanCode = payload.code.trim().toUpperCase().replace(/\s+/g, '_');
    await learnerQuizService.updateTopic(id, {
      code: cleanCode,
      name: payload.name.trim(),
      description: payload.description?.trim() || '',
      categoryCode: cleanCode,
      parentId: payload.parentId || null,
      visibilityScope: 'PUBLIC',
      domainCode: payload.domainCode || 'EDUCATION',
      scope: 'PERSONAL',
      enabled: true,
    });
    await fetchMyBank(cleanCode);
  };

  const deleteTopicNode = async (topic: BankTopic) => {
    await learnerQuizService.deleteTopic(topic.id, false);
    await fetchMyBank();
  };

  return {
    topics,
    filteredTopics,
    topicTreeRoots,
    nodeByCode,
    nodeById,
    allParentIds,
    selectedTopicNode,
    allQuestions,
    topicQuestions,
    selectedQuestions,
    loading,
    selectedTopicCode,
    setSelectedTopicCode,
    topicSearch,
    setTopicSearch,
    questionSearch,
    setQuestionSearch,
    selectedQuestionIds,
    setSelectedQuestionIds,
    toggleSelectQuestion,
    toggleSelectAllInTopic,
    fetchMyBank,
    createTopicNode,
    updateTopicNode,
    deleteTopicNode,
  };
}
