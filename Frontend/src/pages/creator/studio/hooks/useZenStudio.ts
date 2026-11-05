import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import {
  ZenUploadResult,
  EducatorPartnershipInfo,
  ZenRoomLaunchResult,
  ZenBankSaveResult,
  ZenQuestionPatch,
} from '../types/zen-studio.types';
import { ZenHomeworkConfig, DEFAULT_ZEN_HOMEWORK_CONFIG } from '../types/zen-homework.types';
import type { BankTopic } from '@/pages/admin/questions/types';
import type { LearnerQuestion } from '@/types/quiz';

export function useZenStudio() {
  const [partnership, setPartnership] = useState<EducatorPartnershipInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ZenUploadResult | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<ZenRoomLaunchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavingToBank, setIsSavingToBank] = useState(false);
  const [bankSaveResult, setBankSaveResult] = useState<ZenBankSaveResult | null>(null);

  // Pure bank save state (Lưu ngân hàng thuần túy)
  const [isPureSavingToBank, setIsPureSavingToBank] = useState(false);
  const [pureSaveResult, setPureSaveResult] = useState<ZenBankSaveResult | null>(null);

  // Arena game selector modal state
  const [isArenaSelectorOpen, setIsArenaSelectorOpen] = useState(false);
  const [stagedLaunchPayload, setStagedLaunchPayload] = useState<{
    title: string;
    totalQuestions: number;
    subjectCode?: string;
    questions: any[];
  } | null>(null);

  // Homework config state
  const [homeworkConfig, setHomeworkConfig] = useState<ZenHomeworkConfig>(DEFAULT_ZEN_HOMEWORK_CONFIG);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [stagedHomeworkPayload, setStagedHomeworkPayload] = useState<{
    title: string;
    subjectCode?: string;
    domainCode?: string;
    topicCode?: string;
    questions: any[];
  } | null>(null);

  // Fetch partnership on mount
  useEffect(() => {
    let isMounted = true;
    api
      .get<EducatorPartnershipInfo>('/api/creator/studio/partnership')
      .then((res) => {
        if (isMounted && res.data) {
          setPartnership(res.data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch partnership:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Upload Word docx file
  const handleUploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<ZenUploadResult>(
        '/api/creator/studio/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data && response.data.success) {
        setUploadResult(response.data);
      } else {
        setErrorMessage('Tải tệp thất bại.');
      }
    } catch (err: any) {
      console.error('Zen Studio Upload error:', err);
      setErrorMessage(
        err.response?.data?.message || 'Có lỗi xảy ra khi bóc tách tệp đề thi.'
      );
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Arena Game Selector modal handlers
  const handleOpenArenaSelector = useCallback(() => {
    setIsArenaSelectorOpen(true);
  }, []);

  const handleOpenArenaSelectorWithPayload = useCallback(
    (payload: {
      title: string;
      totalQuestions: number;
      subjectCode?: string;
      questions: any[];
    }) => {
      setStagedLaunchPayload(payload);
      setIsArenaSelectorOpen(true);
    },
    []
  );

  const handleCloseArenaSelector = useCallback(() => {
    setIsArenaSelectorOpen(false);
    setStagedLaunchPayload(null);
  }, []);

  // Launch realtime exam room with dynamic gameCode and duration
  const handleLaunchRoom = useCallback(async (gameCode: string = 'GOLDEN_BELL', durationMinutes: number = 15) => {
    const payload = stagedLaunchPayload || (uploadResult ? {
      title: uploadResult.examTitle,
      totalQuestions: uploadResult.totalQuestions,
      subjectCode: uploadResult.suggestedTaxonomy?.categoryCode || uploadResult.suggestedTaxonomy?.domainCode,
      questions: uploadResult.questions,
    } : null);

    if (!payload) return;
    setIsLaunching(true);
    try {
      const response = await api.post<{
        success: boolean;
        pinCode: string;
        roomId: string;
        gameCode?: string;
        title: string;
        joinUrl: string;
        directArenaUrl?: string;
        questionCount?: number;
        qrCodeData: string;
        launchedAt: string;
      }>('/api/creator/studio/launch', {
        title: payload.title,
        totalQuestions: payload.totalQuestions,
        subjectCode: payload.subjectCode,
        durationMinutes,
        gameCode,
        questions: payload.questions,
      });

      if (response.data && response.data.success) {
        setLaunchResult(response.data);
        setIsArenaSelectorOpen(false);
        setStagedLaunchPayload(null);
      }
    } catch (err: any) {
      console.error('Launch room error:', err);
      setErrorMessage('Không thể khởi tạo phòng thi realtime.');
    } finally {
      setIsLaunching(false);
    }
  }, [uploadResult, stagedLaunchPayload]);

  // Pure save to knowledge bank (Chỉ lưu vào ngân hàng tri thức)
  const handlePureSaveToBank = useCallback(async () => {
    if (!uploadResult) return;
    setIsPureSavingToBank(true);
    setErrorMessage(null);
    try {
      const response = await api.post<ZenBankSaveResult>('/api/creator/studio/save-to-bank', {
        title: uploadResult.examTitle,
        subjectCode: uploadResult.suggestedTaxonomy?.categoryCode || uploadResult.suggestedTaxonomy?.domainCode,
        domainCode: uploadResult.suggestedTaxonomy?.domainCode || 'EDUCATION',
        questions: uploadResult.questions,
      });

      if (response.data && response.data.success) {
        setPureSaveResult(response.data);
      }
    } catch (err: any) {
      console.error('Pure save to bank error:', err);
      setErrorMessage(err.response?.data?.message || 'Không thể lưu vào ngân hàng câu hỏi.');
    } finally {
      setIsPureSavingToBank(false);
    }
  }, [uploadResult]);

  const handleClosePureSaveModal = useCallback(() => {
    setPureSaveResult(null);
  }, []);

  // Save to knowledge bank & generate practice link with student config params
  const handleSaveToBank = useCallback(async (customConfig?: ZenHomeworkConfig) => {
    const cfg = customConfig || homeworkConfig;
    if (customConfig) {
      setHomeworkConfig(customConfig);
    }

    // Fast-path: If an existing topic was chosen, generate practice URL directly
    if (stagedHomeworkPayload?.topicCode) {
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
        message: `Đã sẵn sàng bài tập về nhà cho chủ đề "${stagedHomeworkPayload.title}"!`,
      });
      setIsHomeworkModalOpen(false);
      setStagedHomeworkPayload(null);
      return;
    }

    const payload = stagedHomeworkPayload || (uploadResult ? {
      title: uploadResult.examTitle,
      subjectCode: uploadResult.suggestedTaxonomy?.categoryCode || uploadResult.suggestedTaxonomy?.domainCode,
      domainCode: uploadResult.suggestedTaxonomy?.domainCode || 'EDUCATION',
      questions: uploadResult.questions,
    } : null);

    if (!payload) return;

    setIsSavingToBank(true);
    setErrorMessage(null);
    try {
      const response = await api.post<ZenBankSaveResult>('/api/creator/studio/save-to-bank', {
        title: payload.title,
        subjectCode: payload.subjectCode,
        domainCode: payload.domainCode || 'EDUCATION',
        questions: payload.questions,
      });

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
      console.error('Save to bank error:', err);
      setErrorMessage(err.response?.data?.message || 'Không thể lưu vào ngân hàng câu hỏi.');
    } finally {
      setIsSavingToBank(false);
    }
  }, [uploadResult, homeworkConfig, stagedHomeworkPayload]);

  const handleOpenHomeworkModal = useCallback(() => {
    setIsHomeworkModalOpen(true);
  }, []);

  const handleOpenHomeworkWithPayload = useCallback(
    (payload: {
      title: string;
      subjectCode?: string;
      domainCode?: string;
      topicCode?: string;
      questions: any[];
    }) => {
      setStagedHomeworkPayload(payload);
      setIsHomeworkModalOpen(true);
    },
    []
  );

  const handleCloseHomeworkModal = useCallback(() => {
    setIsHomeworkModalOpen(false);
    setStagedHomeworkPayload(null);
  }, []);

  const handleCloseBankModal = useCallback(() => {
    setBankSaveResult(null);
  }, []);

  const handleReset = useCallback(() => {
    setUploadResult(null);
    setLaunchResult(null);
    setErrorMessage(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setLaunchResult(null);
  }, []);

  const updateQuestion = useCallback((order: number, patch: ZenQuestionPatch) => {
    setUploadResult((prev) =>
      prev
        ? {
            ...prev,
            questions: prev.questions.map((q) =>
              q.order === order ? { ...q, ...patch, edited: true } : q,
            ),
          }
        : prev,
    );
  }, []);

  const handleLaunchArenaFromSaved = useCallback((questions: LearnerQuestion[], topic: BankTopic | null) => {
    const arenaQuestions = questions.map((q) => ({
      content: q.content,
      options: q.options || [],
      correctAnswer: q.answerRaw || (q.options && q.options[0]) || '',
      explanation: q.aiExplanation || q.citation || '',
    }));
    handleOpenArenaSelectorWithPayload({
      title: topic?.name || `Đấu trường ${questions.length} câu`,
      totalQuestions: questions.length,
      subjectCode: topic?.categoryCode || topic?.domainCode || 'GENERAL',
      questions: arenaQuestions,
    });
  }, [handleOpenArenaSelectorWithPayload]);

  const handleAssignHomeworkFromSaved = useCallback((questions: LearnerQuestion[], topic: BankTopic | null) => {
    handleOpenHomeworkWithPayload({
      title: topic?.name || `Bài tập ${questions.length} câu`,
      subjectCode: topic?.categoryCode || topic?.domainCode || 'GENERAL',
      topicCode: topic?.code,
      questions: questions.map((q) => ({
        content: q.content,
        options: q.options || [],
        correctAnswer: q.answerRaw || (q.options && q.options[0]) || '',
        explanation: q.aiExplanation || q.citation || '',
      })),
    });
  }, [handleOpenHomeworkWithPayload]);

  const handleLoadIntoStudio = useCallback((questions: LearnerQuestion[], topic: BankTopic | null) => {
    setUploadResult({
      success: true,
      examTitle: topic?.name || 'Đề thi chọn lọc từ Ngân hàng',
      totalQuestions: questions.length,
      duplicateCount: 0,
      uniqueCount: questions.length,
      deduplicationRatePercentage: 0,
      suggestedTaxonomy: {
        domainCode: topic?.domainCode || 'EDUCATION',
        domainName: topic?.name || 'Giáo dục',
        targetLevel: 'STANDARD',
        categoryCode: topic?.categoryCode || topic?.code || 'GENERAL',
        categoryName: topic?.name || 'Tổng hợp',
        benchmarkStandard: 'GENERAL_STANDARD',
        cognitiveLevel: 'THONG_HIEU',
        confidenceScore: 1.0,
      },
      questions: questions.map((q, idx) => ({
        order: idx + 1,
        content: q.content,
        canonicalHash: q.id || `q_${idx + 1}`,
        isDuplicate: false,
        options: q.options || [],
        correctAnswer: q.answerRaw || (q.options && q.options[0]) || '',
        explanation: q.aiExplanation || q.citation || '',
      })),
    });
  }, []);

  return {
    partnership,
    isUploading,
    uploadResult,
    isLaunching,
    launchResult,
    errorMessage,
    handleUploadFile,
    handleLaunchRoom,
    handleReset,
    handleCloseModal,
    updateQuestion,
    isSavingToBank,
    bankSaveResult,
    isPureSavingToBank,
    pureSaveResult,
    handlePureSaveToBank,
    handleClosePureSaveModal,
    isArenaSelectorOpen,
    handleOpenArenaSelector,
    handleCloseArenaSelector,
    handleOpenArenaSelectorWithPayload,
    stagedLaunchPayload,
    homeworkConfig,
    isHomeworkModalOpen,
    handleOpenHomeworkModal,
    handleOpenHomeworkWithPayload,
    handleCloseHomeworkModal,
    handleSaveToBank,
    handleCloseBankModal,
    setUploadResult,
    handleLaunchArenaFromSaved,
    handleAssignHomeworkFromSaved,
    handleLoadIntoStudio,
  };
}
