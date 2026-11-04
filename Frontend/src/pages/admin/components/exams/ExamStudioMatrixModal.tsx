import { useState, useEffect } from 'react';
import { Brain, Clock, BookOpen, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';

export interface TenantTopicOption {
  topicCode: string;
  topicName: string;
  categoryCode: string;
  availableQuestions: number;
  domainCode: string;
}

export interface BlueprintSliceItem {
  sliceName: string;
  topicKeyword: string;
  quota: number;
  weightPerItem: number;
}

interface ExamStudioMatrixModalProps {
  campaignId: string;
  trackId: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function ExamStudioMatrixModal({ campaignId, trackId, onClose, onSuccess }: ExamStudioMatrixModalProps) {
  const { t } = useTranslation('admin');
  const [paperCode, setPaperCode] = useState(`PAPER-${Math.floor(Math.random() * 900 + 100)}`);
  const [paperTitle, setPaperTitle] = useState('Đề thi Nghiệp vụ Ma trận Chuẩn');
  const [duration, setDuration] = useState(60);
  const [minSubmissionMinutes, setMinSubmissionMinutes] = useState(20);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(5);
  const [tabSwitchTolerance, setTabSwitchTolerance] = useState(3);
  const [tenantTopics, setTenantTopics] = useState<TenantTopicOption[]>([]);
  const [slices, setSlices] = useState<BlueprintSliceItem[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchTopics = async () => {
      setLoadingTopics(true);
      try {
        const res = await api.get<TenantTopicOption[]>(`/api/exam-campaigns/${campaignId}/tenant-topics`);
        if (!isMounted) return;
        const list = res.data || [];
        setTenantTopics(list);

        if (list.length > 0) {
          const t1 = list[0];
          const t2 = list.length > 1 ? list[1] : list[0];
          setSlices([
            { sliceName: t1.topicName, topicKeyword: t1.topicCode, quota: Math.min(25, t1.availableQuestions || 25), weightPerItem: 1.0 },
            { sliceName: t2.topicName, topicKeyword: t2.topicCode, quota: Math.min(15, t2.availableQuestions || 15), weightPerItem: 1.0 }
          ]);
        } else {
          setSlices([{ sliceName: 'Chuyên môn', topicKeyword: 'CHUNG', quota: 40, weightPerItem: 1.0 }]);
        }
      } catch (err) {
        console.error('Failed to load tenant topics', err);
      } finally {
        if (isMounted) setLoadingTopics(false);
      }
    };
    fetchTopics();
    return () => { isMounted = false; };
  }, [campaignId]);

  const computedTotalQuestions = slices.reduce((acc, s) => acc + (Number(s.quota) || 0), 0);

  const handleAddSlice = () => {
    const defaultTopic = tenantTopics[0];
    setSlices([
      ...slices,
      {
        sliceName: defaultTopic?.topicName || 'Chủ đề bổ sung',
        topicKeyword: defaultTopic?.topicCode || '',
        quota: 10,
        weightPerItem: 1.0
      }
    ]);
  };

  const handleRemoveSlice = (idx: number) => {
    setSlices(slices.filter((_, i) => i !== idx));
  };

  const handleUpdateSlice = (idx: number, field: keyof BlueprintSliceItem, value: string | number) => {
    const updated = [...slices];
    updated[idx] = { ...updated[idx], [field]: value };
    setSlices(updated);
  };

  const handleSelectTopic = (idx: number, selectedCode: string) => {
    const found = tenantTopics.find(t_item => t_item.topicCode === selectedCode);
    const updated = [...slices];
    updated[idx] = {
      ...updated[idx],
      topicKeyword: selectedCode,
      sliceName: found?.topicName || selectedCode
    };
    setSlices(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setErrorMessage(null);
    try {
      await api.post(`/api/exam-campaigns/${campaignId}/papers/auto-matrix`, {
        trackId,
        paperCode,
        title: paperTitle,
        durationMinutes: duration,
        passingScorePercent: 70,
        totalQuestions: computedTotalQuestions,
        minSubmissionMinutes,
        gracePeriodMinutes,
        tabSwitchTolerance,
        slices
      });
      onSuccess(t('exams.studio.successGenerate', 'Đã sinh đề tự động theo Ma trận tỷ lệ thành công!'));
      onClose();
    } catch {
      setErrorMessage(t('errors.generic', 'Có lỗi xảy ra khi tạo đề tự động.'));
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 my-8">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Brain className="text-cyan-400" size={20} />
            <span>{t('exams.studio.matrixModalTitle', 'Thiết Lập Ma Trận Khung Đề & Thông Số Thời Gian')}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('exams.studio.matrixModalSubtitle', 'Phối gán hạn mức từng chủ đề, tỷ lệ nhận thức Bloom và ràng buộc thời gian nghiêm ngặt.')}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle size={15} /> <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-300">{t('exams.studio.paperCode', 'Mã đề thi')}</label>
            <input
              type="text"
              required
              value={paperCode}
              onChange={e => setPaperCode(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-300">{t('exams.studio.paperTitle', 'Tên bộ đề')}</label>
            <input
              type="text"
              required
              value={paperTitle}
              onChange={e => setPaperTitle(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
        </div>

        {/* TIMING PARAMETERS SECTION */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <h4 className="text-xs font-black uppercase text-cyan-400 flex items-center gap-1.5">
            <Clock size={14} /> {t('exams.studio.examTimingSection', 'Thông Số Thời Gian & Vận Hành Kỳ Thi')}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 font-medium">{t('exams.studio.durationMinutes', 'Thời lượng (phút)')}</label>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium">{t('exams.studio.minSubmissionMinutes', 'Khóa nộp bài tối thiểu')}</label>
              <input
                type="number"
                value={minSubmissionMinutes}
                onChange={e => setMinSubmissionMinutes(Number(e.target.value))}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium">{t('exams.studio.gracePeriodMinutes', 'Bù giờ rớt mạng')}</label>
              <input
                type="number"
                value={gracePeriodMinutes}
                onChange={e => setGracePeriodMinutes(Number(e.target.value))}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-medium">{t('exams.studio.tabSwitchTolerance', 'Giới hạn chuyển tab')}</label>
              <input
                type="number"
                value={tabSwitchTolerance}
                onChange={e => setTabSwitchTolerance(Number(e.target.value))}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* TOPIC ALLOCATION MATRIX SECTION (TENANT TOPICS DROPDOWN) */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-blue-400 flex items-center gap-1.5">
              <BookOpen size={14} /> {t('exams.studio.topicMatrixSection', 'Ma Trận Giới Hạn Chủ Đề & Số Lượng Câu')}
            </h4>
            <button
              type="button"
              onClick={handleAddSlice}
              className="px-2.5 py-1 text-[11px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} /> {t('exams.studio.addTopic', 'Thêm Chủ Đề')}
            </button>
          </div>

          <div className="space-y-2.5">
            {slices.map((slice, idx) => {
              const matchedTopic = tenantTopics.find(tp => tp.topicCode === slice.topicKeyword);
              const isOverQuota = matchedTopic && slice.quota > matchedTopic.availableQuestions;

              return (
                <div key={idx} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <select
                      value={slice.topicKeyword}
                      onChange={e => handleSelectTopic(idx, e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- {t('exams.studio.selectTenantTopic', 'Chọn chủ đề của Tenant')} --</option>
                      {tenantTopics.map(topic => (
                        <option key={topic.topicCode} value={topic.topicCode}>
                          {topic.topicName} ({topic.availableQuestions} {t('exams.studio.questionsSuffix', 'câu')}) [{topic.topicCode}]
                        </option>
                      ))}
                    </select>

                    <div className="w-24">
                      <input
                        type="number"
                        placeholder={t('exams.studio.questionQuota', 'Số câu')}
                        value={slice.quota}
                        onChange={e => handleUpdateSlice(idx, 'quota', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {slices.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSlice(idx)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {matchedTopic && (
                    <div className="flex items-center justify-between text-[11px] px-1">
                      <span className="text-slate-400">
                        {t('exams.studio.availableCount', 'Khả dụng trong kho')}: <strong className="text-cyan-400 font-mono">{matchedTopic.availableQuestions}</strong> {t('exams.studio.questionsSuffix', 'câu')}
                      </span>
                      {isOverQuota && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-1 font-medium">
                          <AlertCircle size={11} /> {t('exams.studio.quotaExceededWarn', 'Vượt quá số câu sẵn có; sẽ tự động bù kho chung.')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-right text-xs font-bold text-slate-300 pt-1">
            {t('exams.studio.totalQuestions', 'Tổng số câu hỏi')}: <strong className="text-cyan-400 font-mono text-sm">{computedTotalQuestions} {t('exams.studio.questionsSuffix', 'câu')}</strong>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
          >
            {t('exams.studio.cancel', 'HỦY')}
          </button>
          <button
            type="submit"
            disabled={loadingSubmit || loadingTopics}
            className="px-5 py-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 rounded-xl transition shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
          >
            {loadingSubmit ? t('exams.studio.generating', 'Đang sinh đề...') : t('exams.studio.btnGenerate', 'BẮT ĐẦU SINH ĐỀ')}
          </button>
        </div>
      </form>
    </div>
  );
}

