import { useState, useCallback } from 'react';
import api from '@/services/api';
import type { BankTopic } from '@/pages/admin/questions/types';
import type {
  ZenRoomLaunchResult,
  ZenBankSaveResult,
} from '../types/zen-studio.types';
import {
  ZenHomeworkConfig,
  DEFAULT_ZEN_HOMEWORK_CONFIG,
} from '../types/zen-homework.types';

export function useZenLauncher() {
  // Arena State
  const [isArenaSelectorOpen, setIsArenaSelectorOpen] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<ZenRoomLaunchResult | null>(null);
  const [stagedArenaPayload, setStagedArenaPayload] = useState<{
    title: string;
    totalQuestions: number;
    subjectCode?: string;
    questions: any[];
  } | null>(null);

  // Homework State
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [isSavingHomework, setIsSavingHomework] = useState(false);
  const [bankSaveResult, setBankSaveResult] = useState<ZenBankSaveResult | null>(null);
  const [homeworkConfig, setHomeworkConfig] = useState<ZenHomeworkConfig>(DEFAULT_ZEN_HOMEWORK_CONFIG);
  const [stagedHomeworkPayload, setStagedHomeworkPayload] = useState<{
    title: string;
    topicCode?: string;
    subjectCode?: string;
    questions: any[];
  } | null>(null);

  // Helper map questions
  const mapQuestionsForArena = (questions: any[]) => {
    return questions.map((q) => ({
      content: q.content,
      options: q.options || [],
      correctAnswer: q.answerRaw || (q.options && q.options[0]) || '',
      explanation: q.aiExplanation || q.citation || '',
      contextContent: q.contextContent,
      contextTitle: q.contextTitle,
    }));
  };

  // Open Arena for a specific topic
  const openArenaForTopic = useCallback((topic: BankTopic, allQuestions: any[] = []) => {
    const matched = allQuestions.filter(
      (q) =>
        (q.topicCode && q.topicCode.toLowerCase() === topic.code.toLowerCase()) ||
        q.categoryCode === topic.code ||
        q.topicId === topic.id ||
        q.bankTopicId === topic.id
    );

    const questionsToUse = matched.length > 0 ? matched : [
      {
        content: `Khảo thí chủ đề: ${topic.name}`,
        options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
        answerRaw: 'Phương án A',
      },
    ];

    setStagedArenaPayload({
      title: topic.name,
      totalQuestions: questionsToUse.length,
      subjectCode: topic.categoryCode || topic.domainCode || topic.code,
      questions: mapQuestionsForArena(questionsToUse),
    });
    setIsArenaSelectorOpen(true);
  }, []);

  // Open Arena for a list of questions
  const openArenaForQuestions = useCallback(
    (questions: any[], title = 'Đấu Trường Trực Tiếp', subjectCode = 'GENERAL') => {
      if (!questions || questions.length === 0) return;
      setStagedArenaPayload({
        title,
        totalQuestions: questions.length,
        subjectCode,
        questions: mapQuestionsForArena(questions),
      });
      setIsArenaSelectorOpen(true);
    },
    []
  );

  // Confirm and launch arena room
  const confirmLaunchArena = useCallback(
    async (gameCode: string = 'GOLDEN_BELL', durationMinutes: number = 15) => {
      if (!stagedArenaPayload) return;
      setIsLaunching(true);
      try {
        const response = await api.post<ZenRoomLaunchResult>(
          '/api/creator/studio/launch',
          {
            title: stagedArenaPayload.title,
            totalQuestions: stagedArenaPayload.totalQuestions,
            subjectCode: stagedArenaPayload.subjectCode,
            durationMinutes,
            gameCode,
            questions: stagedArenaPayload.questions,
          }
        );

        if (response.data && (response.data.pinCode || response.data.roomId)) {
          setLaunchResult(response.data);
          setIsArenaSelectorOpen(false);
          setStagedArenaPayload(null);
        }
      } catch (err: any) {
        console.error('[useZenLauncher] Launch error:', err);
        alert(err.response?.data?.message || 'Không thể khởi tạo phòng thi realtime.');
      } finally {
        setIsLaunching(false);
      }
    },
    [stagedArenaPayload]
  );

  // Open Homework for a topic
  const openHomeworkForTopic = useCallback((topic: BankTopic, allQuestions: any[] = []) => {
    const matched = allQuestions.filter(
      (q) =>
        (q.topicCode && q.topicCode.toLowerCase() === topic.code.toLowerCase()) ||
        q.categoryCode === topic.code ||
        q.topicId === topic.id ||
        q.bankTopicId === topic.id
    );

    setStagedHomeworkPayload({
      title: topic.name,
      topicCode: topic.code,
      subjectCode: topic.categoryCode || topic.domainCode || topic.code,
      questions: matched,
    });
    setIsHomeworkModalOpen(true);
  }, []);

  // Open Homework for questions
  const openHomeworkForQuestions = useCallback(
    (questions: any[], title = 'Bài Tập Chọn Lọc', subjectCode = 'GENERAL') => {
      if (!questions || questions.length === 0) return;
      setStagedHomeworkPayload({
        title,
        subjectCode,
        questions,
      });
      setIsHomeworkModalOpen(true);
    },
    []
  );

  // Confirm Homework
  const confirmHomework = useCallback(
    async (cfg: ZenHomeworkConfig) => {
      if (!stagedHomeworkPayload) return;
      setHomeworkConfig(cfg);

      // Fast-path: Existing topic
      if (stagedHomeworkPayload.topicCode) {
        const query = new URLSearchParams({
          topic: stagedHomeworkPayload.topicCode,
          mode: cfg.mode,
          timeLimit: String(cfg.timeLimitMin),
          shuffleOptions: cfg.shuffleOptions ? '1' : '0',
          shuffleQuestions: cfg.shuffleQuestions ? '1' : '0',
          qTimer: cfg.enableQuestionTimer ? '1' : '0',
          autoNext: cfg.autoNextOnTimeout ? '1' : '0',
        });
        const practiceUrlWithConfig = `/practice?${query.toString()}`;

        setBankSaveResult({
          success: true,
          topicId: stagedHomeworkPayload.topicCode,
          topicCode: stagedHomeworkPayload.topicCode,
          questionCount: stagedHomeworkPayload.questions.length,
          practiceUrl: practiceUrlWithConfig,
          homeworkConfig: cfg,
          message: `Đã thiết lập bài tập về nhà cho chủ đề "${stagedHomeworkPayload.title}"!`,
        });
        setIsHomeworkModalOpen(false);
        setStagedHomeworkPayload(null);
        return;
      }

      // Ad-hoc questions: save to bank first
      setIsSavingHomework(true);
      try {
        const response = await api.post<ZenBankSaveResult>(
          '/api/creator/studio/save-to-bank',
          {
            title: stagedHomeworkPayload.title,
            subjectCode: stagedHomeworkPayload.subjectCode || 'GENERAL',
            domainCode: 'EDUCATION',
            questions: stagedHomeworkPayload.questions,
          }
        );

        if (response.data && response.data.success) {
          const query = new URLSearchParams({
            topic: response.data.topicCode,
            mode: cfg.mode,
            timeLimit: String(cfg.timeLimitMin),
            shuffleOptions: cfg.shuffleOptions ? '1' : '0',
            shuffleQuestions: cfg.shuffleQuestions ? '1' : '0',
            qTimer: cfg.enableQuestionTimer ? '1' : '0',
            autoNext: cfg.autoNextOnTimeout ? '1' : '0',
          });
          const practiceUrlWithConfig = `/practice?${query.toString()}`;

          setBankSaveResult({
            ...response.data,
            practiceUrl: practiceUrlWithConfig,
            homeworkConfig: cfg,
          });
          setIsHomeworkModalOpen(false);
          setStagedHomeworkPayload(null);
        }
      } catch (err: any) {
        console.error('[useZenLauncher] Save error:', err);
        alert(err.response?.data?.message || 'Không thể tạo bài tập về nhà.');
      } finally {
        setIsSavingHomework(false);
      }
    },
    [stagedHomeworkPayload]
  );

  return {
    isArenaSelectorOpen,
    isLaunching,
    launchResult,
    stagedArenaPayload,
    openArenaForTopic,
    openArenaForQuestions,
    confirmLaunchArena,
    closeArenaSelector: () => {
      setIsArenaSelectorOpen(false);
      setStagedArenaPayload(null);
    },
    closeRoomLauncher: () => setLaunchResult(null),

    isHomeworkModalOpen,
    isSavingHomework,
    bankSaveResult,
    homeworkConfig,
    openHomeworkForTopic,
    openHomeworkForQuestions,
    confirmHomework,
    closeHomeworkModal: () => {
      setIsHomeworkModalOpen(false);
      setStagedHomeworkPayload(null);
    },
    closeBankSaveModal: () => setBankSaveResult(null),
  };
}
