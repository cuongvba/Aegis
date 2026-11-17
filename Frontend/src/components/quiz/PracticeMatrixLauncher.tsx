import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Building2,
  GraduationCap,
  Play,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BookOpenCheck,
  Timer,
  ArrowRight,
} from 'lucide-react';
import { examMatrixService, ExamMatrixTemplate, MatrixInventory } from '@/services/examMatrix.service';
import type { LearnerQuestion, PracticeConfig, PracticeMode, QuestionType } from '@/types/quiz';
import { countAvailableForType, formatGradeLabel, formatSubjectLabel } from './matrixLabels';

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
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('exam');
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
      .catch(() => {});
  }, [forcedDomainCode]);

  const active = templates.find((t) => t.templateCode === selectedCode) || templates[0];

  useEffect(() => {
    if (!active || !topicCode.trim()) return;
    const timer = setTimeout(() => {
      examMatrixService
        .getInventory(active.domainCode, topicCode, targetLevel)
        .then(setInventory)
        .catch(() => setInventory(null));
    }, 120);
    return () => clearTimeout(timer);
  }, [active?.domainCode, topicCode, targetLevel]);

  const subjectOptions = useMemo(() => {
    const set = new Set<string>(inventory?.availableSubjects || []);
    if (topicCode) set.add(topicCode);
    templates.filter((t) => !active || t.domainCode === active.domainCode).forEach((t) => set.add(t.topicCode));
    return Array.from(set).filter(Boolean);
  }, [inventory?.availableSubjects, topicCode, templates, active]);

  if (templates.length === 0 || !active) return null;

  const totalCount = active.sections.reduce((sum, s) => sum + s.count, 0);
  const availableGradesSet = new Set((inventory?.availableGrades || []).map((g) => g.toUpperCase()));
  const hasAnyQuestions = !inventory || inventory.totalCount > 0;

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
        examTitle: `${active.title} (${formatSubjectLabel(topicCode)}${targetLevel !== 'ALL' ? ` - ${formatGradeLabel(targetLevel)}` : ''})`,
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
            `Kho đề thật (${formatSubjectLabel(topicCode)} • ${formatGradeLabel(targetLevel)}) chưa có câu hỏi phù hợp.`
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
        sourceExamName: res.examTitle,
        sourceSectionName: q.sectionTitle,
        points: 1,
        difficulty: q.difficulty || 2,
        durationSec: 0,
        enabled: true,
        contextId: q.contextId,
        contextTitle: q.contextTitle,
        contextContent: q.contextContent,
      }));

      const config: PracticeConfig = {
        mode: practiceMode,
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
        timeLimitSec: practiceMode === 'exam' ? Math.max(0, res.durationMinutes) * 60 : 0,
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
    <section className="rounded-3xl border border-indigo-200/80 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50/90 via-white to-cyan-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              Ma Trận Chuẩn Bộ GD&amp;ĐT &amp; Quy Chuẩn Công Ty
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                KHO ĐỀ THẬT
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn khung đề chuẩn, xoay trục Môn học &amp; Khối lớp có sẵn dữ liệu và chọn chế độ Thi thử hoặc Ôn luyện sâu
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setPracticeMode('exam')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              practiceMode === 'exam'
                ? 'bg-white dark:bg-slate-950 text-indigo-700 dark:text-cyan-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Timer size={13} /> Thi thử ({active.durationMinutes}p)
          </button>
          <button
            type="button"
            onClick={() => setPracticeMode('study')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              practiceMode === 'study'
                ? 'bg-white dark:bg-slate-950 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpenCheck size={13} /> Ôn luyện (Xem giải thích)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-stretch">
        <select
          value={active.templateCode}
          onChange={(e) => handleSelectTemplate(e.target.value)}
          className="sm:col-span-5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
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

        <select
          value={topicCode}
          onChange={(e) => { setTopicCode(e.target.value); setErrorMsg(null); }}
          className="sm:col-span-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-xs sm:text-sm font-bold text-indigo-700 dark:text-cyan-300 focus:border-indigo-500 focus:outline-none"
        >
          {subjectOptions.map((code) => (
            <option key={code} value={code}>{formatSubjectLabel(code)}</option>
          ))}
        </select>

        <select
          value={GRADE_CHOICES.includes(targetLevel) ? targetLevel : 'ALL'}
          onChange={(e) => { setTargetLevel(e.target.value); setErrorMsg(null); }}
          className="sm:col-span-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
        >
          {GRADE_CHOICES.map((g) => (
            <option key={g} value={g}>
              {formatGradeLabel(g)}{availableGradesSet.has(g) ? ' ✓' : ''}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleLaunch}
          disabled={isLaunching || !hasAnyQuestions}
          className="sm:col-span-3 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 px-4 py-2.5 text-xs sm:text-sm font-black text-white shadow-md shadow-indigo-500/25 transition disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {isLaunching ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
          {isLaunching ? 'Đang bốc đề...' : practiceMode === 'exam' ? 'Vào Thi Ngay' : 'Bắt Đầu Ôn Luyện'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200">
          {active.category === 'MOET_2025' ? <GraduationCap size={12} className="text-indigo-500" /> : <Building2 size={12} className="text-amber-500" />}
          {formatSubjectLabel(topicCode)} • {formatGradeLabel(targetLevel)}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-300">
          <Clock size={12} className="text-cyan-500" />
          {practiceMode === 'exam' ? `${active.durationMinutes} phút` : 'Không giới hạn'} • {totalCount} câu
        </span>
        {active.sections.map((sec) => {
          const avail = countAvailableForType(inventory?.byQuestionType, sec.questionType);
          const ready = !inventory || avail >= sec.count;
          return (
            <span
              key={sec.code}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border font-semibold ${
                ready
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25'
              }`}
            >
              {ready ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
              {sec.title.split('.')[0]}: {inventory ? `${avail}/${sec.count}` : `${sec.count} câu`}
            </span>
          );
        })}
      </div>

      {!hasAnyQuestions && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
            Kho chưa có câu hỏi cho <strong>{formatSubjectLabel(topicCode)} ({formatGradeLabel(targetLevel)})</strong>.
            {inventory?.availableGrades && inventory.availableGrades.length > 0 && (
              <span> Khối đang có dữ liệu: <strong>{inventory.availableGrades.map(formatGradeLabel).join(', ')}</strong>.</span>
            )}
          </span>
          {inventory?.availableGrades && inventory.availableGrades.length > 0 && (
            <button
              type="button"
              onClick={() => setTargetLevel(inventory.availableGrades[0])}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition"
            >
              Chuyển sang {formatGradeLabel(inventory.availableGrades[0])} <ArrowRight size={12} />
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
          <span>{errorMsg}</span>
        </div>
      )}
    </section>
  );
};
