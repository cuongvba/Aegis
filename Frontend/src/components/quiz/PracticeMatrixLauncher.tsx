import React, { useEffect, useState } from 'react';
import { Sparkles, Building2, GraduationCap, Play, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { examMatrixService, ExamMatrixTemplate } from '@/services/examMatrix.service';
import type { LearnerQuestion, PracticeConfig, QuestionType } from '@/types/quiz';

interface PracticeMatrixLauncherProps {
  forcedDomainCode?: string;
  onLaunchMatrix: (questions: LearnerQuestion[], config: PracticeConfig, warning?: string) => void;
}

export const PracticeMatrixLauncher: React.FC<PracticeMatrixLauncherProps> = ({
  forcedDomainCode,
  onLaunchMatrix,
}) => {
  const [templates, setTemplates] = useState<ExamMatrixTemplate[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    examMatrixService
      .getTemplates()
      .then((list) => {
        const filtered = forcedDomainCode
          ? list.filter((t) => t.domainCode.toUpperCase() === forcedDomainCode.toUpperCase())
          : list;
        const effective = filtered.length > 0 ? filtered : list;
        setTemplates(effective);
        if (effective[0]) setSelectedCode(effective[0].templateCode);
      })
      .catch(() => {
        // Silent fallback if matrix endpoint is unavailable
      });
  }, [forcedDomainCode]);

  if (templates.length === 0) return null;

  const active = templates.find((t) => t.templateCode === selectedCode) || templates[0];
  const totalCount = active.sections.reduce((sum, s) => sum + s.count, 0);

  const handleLaunch = async () => {
    setIsLaunching(true);
    setErrorMsg(null);
    try {
      const res = await examMatrixService.generateFromRealBank({
        templateCode: active.templateCode,
        examTitle: active.title,
        domainCode: active.domainCode,
        topicCode: active.topicCode,
        targetLevel: active.targetLevel,
        durationMinutes: active.durationMinutes,
        bloomWeights: active.bloomWeights,
        sections: active.sections,
      });

      if (!res.questions || res.questions.length === 0) {
        setErrorMsg(
          res.warningMessage ||
            `Kho đề thật (${active.topicCode}) chưa có câu hỏi phù hợp cho ma trận "${active.title}".`
        );
        return;
      }

      const mapped: LearnerQuestion[] = res.questions.map((q) => ({
        id: q.questionId,
        questNo: q.order,
        content: q.content,
        questionType: (q.questionType || 'SINGLE') as QuestionType,
        options: q.options || [],
        answerRaw: q.correctAnswer || '',
        citation: q.explanation || '',
        aiExplanation: q.explanation,
        topicCode: res.topicCode,
        categoryCode: res.topicCode,
        domainCode: res.domainCode,
        targetLevel: res.targetLevel,
        points: 1,
        difficulty: q.difficulty || 2,
        durationSec: 0,
        enabled: true,
        contextId: q.contextId,
        contextTitle: q.contextTitle,
        contextContent: q.contextContent,
      }));

      const config: PracticeConfig = {
        mode: 'exam',
        topicConfigs: [
          {
            topicKey: res.topicCode,
            numberOfQuestions: mapped.length,
            isRandom: true,
            startIndex: 1,
          },
        ],
        shuffleOptions: true,
        shuffleQuestions: false, // Giữ đúng thứ tự Phần I -> Phần II -> Phần III của ma trận
        enableQuestionTimer: false,
        timeLimitSec: Math.max(0, res.durationMinutes) * 60,
        autoNextOnTimeout: false,
      };

      onLaunchMatrix(mapped, config, res.warningMessage);
    } catch {
      setErrorMsg('Không thể khởi tạo đề từ kho thật. Vui lòng thử lại.');
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <section className="rounded-3xl border border-indigo-200/80 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50/90 via-white to-cyan-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 p-4 sm:p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/20">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              Thi Thử Theo Ma Trận Chuẩn (Kho Thật)
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-600/10 text-indigo-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                GDPT 2025 &amp; Công ty
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bốc đề trực tiếp từ kho thật đúng cấu trúc 3 phần Bộ GD&amp;ĐT hoặc quy chuẩn riêng của Công ty
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <select
          value={active.templateCode}
          onChange={(e) => {
            setSelectedCode(e.target.value);
            setErrorMsg(null);
          }}
          className="flex-1 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
        >
          <optgroup label="Chuẩn Bộ GD&ĐT (GDPT 2025)">
            {templates
              .filter((t) => t.category === 'MOET_2025')
              .map((t) => (
                <option key={t.templateCode} value={t.templateCode}>
                  {t.title}
                </option>
              ))}
          </optgroup>
          <optgroup label="Quy chuẩn Công ty / Tổ chức">
            {templates
              .filter((t) => t.category !== 'MOET_2025')
              .map((t) => (
                <option key={t.templateCode} value={t.templateCode}>
                  {t.isSystemDefault ? '[Mẫu] ' : '[Công ty] '}
                  {t.title}
                </option>
              ))}
          </optgroup>
        </select>

        <button
          type="button"
          onClick={handleLaunch}
          disabled={isLaunching}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 px-5 py-2.5 text-xs sm:text-sm font-black text-white shadow-md shadow-indigo-500/25 transition disabled:opacity-50"
        >
          {isLaunching ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
          {isLaunching ? 'Đang bốc đề...' : 'Vào Thi Ngay'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold">
          {active.category === 'MOET_2025' ? <GraduationCap size={12} className="text-indigo-500" /> : <Building2 size={12} className="text-amber-500" />}
          {active.topicCode} {active.targetLevel ? `• ${active.targetLevel}` : ''}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold">
          <Clock size={12} className="text-cyan-500" />
          {active.durationMinutes} phút • {totalCount} câu
        </span>
        {active.sections.map((s) => (
          <span key={s.code} className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-700/50 font-medium">
            {s.title}: {s.count} câu
          </span>
        ))}
      </div>

      {errorMsg && (
        <div className="mt-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
          <span>{errorMsg}</span>
        </div>
      )}
    </section>
  );
};
