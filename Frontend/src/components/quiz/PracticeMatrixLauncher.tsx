import React, { useEffect, useState } from 'react';
import { Sparkles, Building2, GraduationCap, Play, Loader2, AlertTriangle, Clock, Database } from 'lucide-react';
import { examMatrixService, ExamMatrixTemplate, MatrixInventory } from '@/services/examMatrix.service';
import type { LearnerQuestion, PracticeConfig, QuestionType } from '@/types/quiz';

interface PracticeMatrixLauncherProps {
  forcedDomainCode?: string;
  onLaunchMatrix: (questions: LearnerQuestion[], config: PracticeConfig, warning?: string) => void;
}

const GRADE_CHOICES = ['ALL', 'K06', 'K07', 'K08', 'K09', 'K10', 'K11', 'K12'];

export const PracticeMatrixLauncher: React.FC<PracticeMatrixLauncherProps> = ({
  forcedDomainCode,
  onLaunchMatrix,
}) => {
  const [templates, setTemplates] = useState<ExamMatrixTemplate[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [topicCode, setTopicCode] = useState<string>('TOAN');
  const [targetLevel, setTargetLevel] = useState<string>('K12');
  const [inventory, setInventory] = useState<MatrixInventory | null>(null);
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
        const preferred = effective.find((t) => t.templateCode === 'MOET_2025_TOAN') || effective[0];
        if (preferred) {
          setSelectedCode(preferred.templateCode);
          setTopicCode(preferred.topicCode);
          setTargetLevel(preferred.targetLevel || 'ALL');
        }
      })
      .catch(() => {
        // Silent fallback if matrix endpoint is unavailable
      });
  }, [forcedDomainCode]);

  const active = templates.find((t) => t.templateCode === selectedCode) || templates[0];

  useEffect(() => {
    if (!active || !topicCode.trim()) return;
    const timer = setTimeout(() => {
      examMatrixService
        .getInventory(active.domainCode, topicCode, targetLevel)
        .then(setInventory)
        .catch(() => setInventory(null));
    }, 150);
    return () => clearTimeout(timer);
  }, [active?.domainCode, topicCode, targetLevel]);

  if (templates.length === 0 || !active) return null;

  const totalCount = active.sections.reduce((sum, s) => sum + s.count, 0);

  const handleSelectTemplate = (code: string) => {
    setSelectedCode(code);
    setErrorMsg(null);
    const tpl = templates.find((t) => t.templateCode === code);
    if (tpl) {
      setTopicCode(tpl.topicCode);
      setTargetLevel(tpl.targetLevel || 'ALL');
    }
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    setErrorMsg(null);
    try {
      const res = await examMatrixService.generateFromRealBank({
        templateCode: active.templateCode,
        examTitle: `${active.title} (${topicCode}${targetLevel && targetLevel !== 'ALL' ? ` - ${targetLevel}` : ''})`,
        domainCode: active.domainCode,
        topicCode: topicCode.trim().toUpperCase(),
        targetLevel: targetLevel === 'ALL' ? undefined : targetLevel,
        durationMinutes: active.durationMinutes,
        bloomWeights: active.bloomWeights,
        sections: active.sections,
      });

      if (!res.questions || res.questions.length === 0) {
        setErrorMsg(
          res.warningMessage ||
            `Kho đề thật (${topicCode} • ${targetLevel}) chưa có câu hỏi phù hợp cho khung "${active.title}".`
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
        shuffleQuestions: false,
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
              Thi Thử Theo Ma Trận Chuẩn × Tọa Độ Động
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-600/10 text-indigo-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                GDPT 2025 &amp; Công ty
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn Khung Ma trận rồi xoay trục Môn học &amp; Khối lớp (Toán 7, Toán 12, KHTN...) theo kho thật
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-stretch">
        <select
          value={active.templateCode}
          onChange={(e) => handleSelectTemplate(e.target.value)}
          className="sm:col-span-5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
        >
          <optgroup label="Chuẩn Bộ GD&ĐT (GDPT 2025)">
            {templates.filter((t) => t.category === 'MOET_2025').map((t) => (
              <option key={t.templateCode} value={t.templateCode}>{t.title}</option>
            ))}
          </optgroup>
          <optgroup label="Quy chuẩn Công ty / Tổ chức">
            {templates.filter((t) => t.category !== 'MOET_2025').map((t) => (
              <option key={t.templateCode} value={t.templateCode}>
                {t.isSystemDefault ? '[Mẫu] ' : '[Công ty] '}{t.title}
              </option>
            ))}
          </optgroup>
        </select>

        <input
          list="practice-subject-suggestions"
          value={topicCode}
          onChange={(e) => { setTopicCode(e.target.value.toUpperCase()); setErrorMsg(null); }}
          placeholder="Mã môn (TOAN...)"
          className="sm:col-span-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-xs font-mono font-bold text-indigo-700 dark:text-cyan-300 focus:border-indigo-500 focus:outline-none"
        />
        <datalist id="practice-subject-suggestions">
          {(inventory?.availableSubjects || ['TOAN', 'VAT_LY', 'HOA_HOC', 'SINH_HOC', 'TIENG_ANH']).map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>

        <select
          value={GRADE_CHOICES.includes(targetLevel) ? targetLevel : 'ALL'}
          onChange={(e) => { setTargetLevel(e.target.value); setErrorMsg(null); }}
          className="sm:col-span-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
        >
          {GRADE_CHOICES.map((g) => (
            <option key={g} value={g}>{g === 'ALL' ? 'Mọi khối' : `Khối ${g.replace('K0', '').replace('K', '')}`}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleLaunch}
          disabled={isLaunching}
          className="sm:col-span-3 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 px-4 py-2.5 text-xs sm:text-sm font-black text-white shadow-md shadow-indigo-500/25 transition disabled:opacity-50"
        >
          {isLaunching ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
          {isLaunching ? 'Đang bốc đề...' : 'Vào Thi Ngay'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
        {inventory && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 font-bold">
            <Database size={12} />
            Kho thật: {inventory.totalCount} câu
            {Object.keys(inventory.byQuestionType).length > 0 &&
              ` (${Object.entries(inventory.byQuestionType).map(([k, v]) => `${k}: ${v}`).join(' · ')})`}
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold">
          {active.category === 'MOET_2025' ? <GraduationCap size={12} className="text-indigo-500" /> : <Building2 size={12} className="text-amber-500" />}
          {topicCode} • {targetLevel}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold">
          <Clock size={12} className="text-cyan-500" />
          {active.durationMinutes}p • {totalCount} câu
        </span>
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
