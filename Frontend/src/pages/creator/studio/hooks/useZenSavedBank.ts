import { useState, useEffect, useMemo, useCallback } from 'react';
import { learnerQuizService } from '@/services/learner-quiz.service';
import type { BankTopic } from '@/pages/admin/questions/types';
import type { LearnerQuestion } from '@/types/quiz';

export function useZenSavedBank() {
  const [topics, setTopics] = useState<BankTopic[]>([]);
  const [questions, setQuestions] = useState<LearnerQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [searchTopic, setSearchTopic] = useState('');
  const [searchQuestion, setSearchQuestion] = useState('');

  const fetchBankData = useCallback(async () => {
    setLoading(true);
    try {
      const [tData, qData] = await Promise.all([
        learnerQuizService.getTopics(false, true),
        learnerQuizService.getQuestions({ myOnly: true }),
      ]);
      setTopics(Array.isArray(tData) ? tData : []);
      setQuestions(Array.isArray(qData) ? qData : []);
    } catch (err) {
      console.error('[useZenSavedBank] Error fetching saved bank data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBankData();
  }, [fetchBankData]);

  // Filter topics
  const filteredTopics = useMemo(() => {
    if (!searchTopic.trim()) return topics;
    const q = searchTopic.toLowerCase().trim();
    return topics.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.code?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    );
  }, [topics, searchTopic]);

  // Questions of currently selected topic or all
  const topicQuestions = useMemo(() => {
    if (!selectedTopicId) return questions;
    const selectedTopic = topics.find((t) => t.id === selectedTopicId);
    if (!selectedTopic) return questions;

    return questions.filter(
      (q) =>
        (q.topicCode && q.topicCode.toLowerCase() === selectedTopic.code.toLowerCase()) ||
        (q as any).topicId === selectedTopic.id ||
        (q as any).bankTopicId === selectedTopic.id
    );
  }, [questions, selectedTopicId, topics]);

  // Filter questions with search
  const filteredQuestions = useMemo(() => {
    if (!searchQuestion.trim()) return topicQuestions;
    const q = searchQuestion.toLowerCase().trim();
    return topicQuestions.filter(
      (item) =>
        item.content?.toLowerCase().includes(q) ||
        item.topicCode?.toLowerCase().includes(q)
    );
  }, [topicQuestions, searchQuestion]);

  // When a topic is selected, select all its questions
  const handleSelectTopic = useCallback(
    (topic: BankTopic) => {
      if (selectedTopicId === topic.id) {
        // Deselect
        setSelectedTopicId(null);
        setSelectedQuestionIds([]);
        return;
      }
      setSelectedTopicId(topic.id);
      const matched = questions.filter(
        (q) =>
          (q.topicCode && q.topicCode.toLowerCase() === topic.code.toLowerCase()) ||
          (q as any).topicId === topic.id ||
          (q as any).bankTopicId === topic.id
      );
      setSelectedQuestionIds(matched.map((q) => q.id));
    },
    [selectedTopicId, questions]
  );

  // Toggle single question selection
  const handleToggleQuestion = useCallback((id: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  // Select all in currently filtered view
  const handleSelectAllCurrent = useCallback(() => {
    const currentIds = filteredQuestions.map((q) => q.id);
    setSelectedQuestionIds((prev) => {
      const set = new Set([...prev, ...currentIds]);
      return Array.from(set);
    });
  }, [filteredQuestions]);

  // Deselect all
  const handleDeselectAll = useCallback(() => {
    setSelectedQuestionIds([]);
    setSelectedTopicId(null);
  }, []);

  // Active selected questions objects
  const selectedQuestions = useMemo(() => {
    const idSet = new Set(selectedQuestionIds);
    return questions.filter((q) => idSet.has(q.id));
  }, [questions, selectedQuestionIds]);

  const activeTopic = useMemo(() => {
    return topics.find((t) => t.id === selectedTopicId) || null;
  }, [topics, selectedTopicId]);

  return {
    topics,
    questions,
    loading,
    selectedTopicId,
    activeTopic,
    selectedQuestionIds,
    selectedQuestions,
    filteredTopics,
    filteredQuestions,
    searchTopic,
    setSearchTopic,
    searchQuestion,
    setSearchQuestion,
    handleSelectTopic,
    handleToggleQuestion,
    handleSelectAllCurrent,
    handleDeselectAll,
    fetchBankData,
  };
}

