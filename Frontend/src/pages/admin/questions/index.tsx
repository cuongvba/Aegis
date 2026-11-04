/**
 * AdminQuestionsPage — Clean Page Orchestrator (ALDS v1.0)
 * ========================================================
 * 100% MultiLang Sovereignty & Zero-Monolith Architecture
 */
import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, Cpu, UploadCloud, ChevronDown, Plus, Network, FileSpreadsheet, FileUp, Brain, ArrowUpDown, Columns } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { learnerQuizService } from '@/services/learner-quiz.service';
import type { LearnerQuestion, QuestionType } from '@/types/quiz';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { canManageResource } from '@/types/auth';
import type { BankTopic } from './types';
import { useQuestionFilters } from './hooks/useQuestionFilters';
import { useExcelDocxImport } from './hooks/useExcelDocxImport';
import { QuestionModal } from './components/QuestionModal';
import { DocxPreviewModal } from './components/DocxPreviewModal';
import { AiGenerateModal } from './components/AiGenerateModal';
import { BatchContextModal } from './components/BatchContextModal';
import { BatchTagModal } from './components/BatchTagModal';
import { TenantGovernanceModal } from './components/TenantGovernanceModal';
import { ExcelIngestionStudioModal } from './components/ExcelIngestionStudioModal';
import { UniversalContextModal } from './components/UniversalContextModal';
import { ExcelPreviewModal } from './components/ExcelPreviewModal';
import { BatchActionBar } from './components/BatchActionBar';
import { QuestionTableSection } from './components/QuestionTableSection';
import { TaxonomyPivotDrawer } from './components/TaxonomyPivotDrawer';
import { TaxonomyMatrixModal } from './components/TaxonomyMatrixModal';

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  const { t } = useTranslation('admin_questions');
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-855 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all">{t('pagination.prev')}</button>
      {Array.from({ length: totalPages }).map((_, idx) => {
        const pNum = idx + 1;
        if (pNum === 1 || pNum === totalPages || Math.abs(pNum - page) <= 1) {
          return <button key={pNum} onClick={() => onChange(pNum)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${page === pNum ? 'bg-blue-650 border-blue-500 text-white shadow' : 'bg-slate-950 border-slate-855 text-slate-400 hover:bg-slate-850 hover:text-white'}`}>{pNum}</button>;
        }
        if (pNum === 2 || pNum === totalPages - 1) return <span key={pNum} className="text-slate-600 text-xs px-1 select-none">...</span>;
        return null;
      })}
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages || totalPages === 0} className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-855 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-all">{t('pagination.next')}</button>
    </div>
  );
}

export function AdminQuestionsPage() {
  const { t } = useTranslation('admin_questions');
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const isTeamLeader = user?.role === 'TeamLeader';
  const [questions, setQuestions] = useState<LearnerQuestion[]>([]);
  const [topics, setTopics] = useState<BankTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userRoleOverride, setUserRoleOverride] = useState<'admin' | 'viewer'>('admin');
  const hasWritePermission = userRoleOverride === 'admin' || isTeamLeader;

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
  const [formScope, setFormScope] = useState<'COMMUNITY' | 'TENANT' | 'TEAM' | 'PERSONAL'>('COMMUNITY');
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
  const [showGovernanceModal, setShowGovernanceModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isCleaningOrphans, setIsCleaningOrphans] = useState(false);
  const [showPivotDrawer, setShowPivotDrawer] = useState(false);
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  // Custom Hooks
  const qFilters = useQuestionFilters(questions, topics, user);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qData, tData, cData] = await Promise.all([
        learnerQuizService.getQuestions(),
        learnerQuizService.getTopics(),
        learnerQuizService.getContexts(),
      ]);
      setQuestions(qData); setTopics(tData); setAvailableContexts(cData);
      if (tData.length > 0) setCategoryCode(tData[0].code);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const importEngine = useExcelDocxImport(topics, user, isTeamLeader, fetchData, qFilters.resetFilters);

  const renderSortIcon = (field: string, currentField: string, isAsc: boolean) => (
    <span className={`inline-flex ml-1.5 transition-colors ${field === currentField ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
      <ArrowUpDown size={11} className={field === currentField && !isAsc ? 'rotate-180 transform transition-transform' : 'transition-transform'} />
    </span>
  );

  // Handlers CRUD Questions
  const openAddModal = () => {
    setEditingId(null); setContent(''); setQuestionType('SINGLE'); setDifficulty(1);
    setCategoryCode(topics.length > 0 ? topics[0].code : ''); setDurationSeconds(60);
    setOptions(['', '', '', '']); setCitation(''); setCorrectAnswer('');
    setContentType('text'); setOptionType('text'); setIsEditing(true);
    setFormScope(isTeamLeader ? 'TEAM' : 'COMMUNITY');
    if (!isStickyContext) {
      setCurrentContextId(''); setCurrentContextTitle(''); setCurrentContextContent('');
      setStickyCount(0); setFormDomainCode('EDUCATION'); setFormTags([]);
      setFormTargetLevel(''); setFormAssessmentPurpose(''); setFormIssuingOrg(''); setFormBenchmarkYear(2025);
    }
    setIsModalOpen(true);
  };

  const openEditModal = (q: LearnerQuestion) => {
    setEditingId(q.id); setContent(q.content); setQuestionType(q.questionType);
    setDifficulty(q.difficulty); setCategoryCode(q.topicCode || (topics.length > 0 ? topics[0].code : ''));
    setDurationSeconds(q.durationSec || 60);
    const optList = q.options && q.options.length > 0 ? [...q.options] : ['', '', '', ''];
    while (optList.length < 4) optList.push('');
    setOptions(optList); setCitation(q.citation || ''); setCorrectAnswer(q.answerRaw || '');
    setContentType(q.contentType || q.questionMediaType || 'text');
    setOptionType(q.optionType || q.optionMediaType || 'text');
    setCurrentContextId(q.contextId || ''); setCurrentContextTitle(q.contextTitle || '');
    setCurrentContextContent(q.contextContent || ''); setFormDomainCode(q.domainCode || 'EDUCATION');
    setFormTags(q.tags || []); setFormTargetLevel(q.targetLevel || '');
    setFormAssessmentPurpose(q.assessmentPurpose || ''); setFormIssuingOrg(q.issuingOrg || '');
    setFormBenchmarkYear(q.benchmarkYear || 2025); setFormScope(q.scope || (isTeamLeader ? 'TEAM' : 'COMMUNITY'));
    setIsEditing(false); setIsModalOpen(true);
  };

  const handleToggleActive = async (q: LearnerQuestion) => {
    if (!canManageResource(user, q)) return alert('Access Denied');
    const nextEnabled = q.enabled === false;
    try {
      await learnerQuizService.updateQuestion(q.id, { ...q, payload: { correctAnswer: q.answerRaw, options: q.options, enabled: nextEnabled } } as any);
      setQuestions(prev => prev.map(item => item.id === q.id ? { ...item, enabled: nextEnabled } : item));
    } catch { alert('Update failed'); }
  };

  const handleDelete = async (id: string) => {
    const targetQ = questions.find(x => x.id === id);
    if (!canManageResource(user, targetQ)) return alert('Access Denied');
    if (!window.confirm('Confirm delete?')) return;
    try { await learnerQuizService.deleteQuestion(id); fetchData(); } catch { alert('Delete failed'); }
  };

  const handleContributeToTenant = async (q: LearnerQuestion) => {
    if (!confirm('Confirm propose to Tenant Bank?')) return;
    try {
      await learnerQuizService.updateQuestion(q.id, { ...q, contributionStatus: 'SUBMITTED_FOR_TENANT' } as any);
      alert('Submitted successfully!'); fetchData();
    } catch { alert('Submission failed'); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignedScope = isTeamLeader ? 'TEAM' : formScope;
    const payload = {
      content, questionType, difficulty, durationSeconds, categoryCode,
      options: options.filter(x => x.trim() !== ''), correctOption: correctAnswer, citation, contentType, optionType,
      contextId: currentContextId || undefined, contextTitle: currentContextTitle || undefined,
      contextContent: currentContextContent || undefined, domainCode: formDomainCode, tags: formTags,
      targetLevel: formTargetLevel || undefined, assessmentPurpose: formAssessmentPurpose || undefined,
      issuingOrg: formIssuingOrg || undefined, benchmarkYear: formBenchmarkYear,
      scope: assignedScope, visibilityScope: assignedScope === 'TEAM' ? 'TEAM' : 'PUBLIC',
    };
    try {
      if (editingId) await learnerQuizService.updateQuestion(editingId, payload);
      else {
        await learnerQuizService.createQuestion(payload);
        if (isStickyContext) setStickyCount(prev => prev + 1);
        else { setCurrentContextId(''); setCurrentContextTitle(''); setCurrentContextContent(''); }
      }
      setIsModalOpen(false); fetchData();
    } catch { alert('Save failed'); }
  };

  const handleSaveAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return alert('Please enter question content');
    try {
      await learnerQuizService.createQuestion({
        content, questionType, difficulty, durationSeconds, categoryCode,
        options: options.filter(x => x.trim() !== ''), correctOption: correctAnswer, citation, contentType, optionType,
        contextId: currentContextId || undefined, contextTitle: currentContextTitle || undefined,
        contextContent: currentContextContent || undefined, domainCode: formDomainCode, tags: formTags,
        scope: isTeamLeader ? 'TEAM' : formScope, visibilityScope: isTeamLeader ? 'TEAM' : 'PUBLIC',
      });
      setStickyCount(prev => prev + 1); setIsStickyContext(true);
      setContent(''); setOptions(['', '', '', '']); setCorrectAnswer(''); setCitation(''); fetchData();
    } catch { alert('Save failed'); }
  };

  const handleSelectRange = () => {
    const from = parseInt(rangeFrom), to = parseInt(rangeTo);
    if (isNaN(from) || isNaN(to) || from < 1 || to < from) return alert('Invalid range');
    const ids = qFilters.filteredQuestions.slice(from - 1, to).map(q => q.id);
    setSelectedQuestionIds(prev => Array.from(new Set([...prev, ...ids])));
  };

  const handleBulkDeleteQuestions = async () => {
    if (!window.confirm(`⚠️ Permanently delete ${selectedQuestionIds.length} questions?`)) return;
    setIsBulkDeleting(true);
    try {
      await learnerQuizService.bulkDeleteQuestions(selectedQuestionIds);
      setSelectedQuestionIds([]); fetchData();
    } catch { alert('Bulk delete failed'); }
    finally { setIsBulkDeleting(false); }
  };

  const handleCleanupOrphans = async () => {
    if (!window.confirm('🧹 Clean up orphan questions?')) return;
    setIsCleaningOrphans(true);
    try { await learnerQuizService.cleanupOrphanQuestions(); setSelectedQuestionIds([]); fetchData(); }
    catch { alert('Clean up failed'); }
    finally { setIsCleaningOrphans(false); }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 pb-1">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">{t('title')}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 font-mono text-xs font-semibold">{t('stats.questionsCount', { count: questions.length })}</span>
            {qFilters.missingAnswersCount > 0 && (
              <button type="button" onClick={() => qFilters.setShowMissingOnly(!qFilters.showMissingOnly)} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border cursor-pointer bg-amber-500/10 text-amber-400 border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>{t('stats.missingAnswers', { count: qFilters.missingAnswersCount })}</span>
                <span className="text-[10px] underline ml-0.5">{qFilters.showMissingOnly ? t('stats.unfilterMissing') : t('stats.filterMissing')}</span>
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-0.5 text-xs select-none">
            <button type="button" onClick={() => setUserRoleOverride('admin')} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${userRoleOverride === 'admin' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-slate-400'}`}>{t('roles.admin')}</button>
            <button type="button" onClick={() => setUserRoleOverride('viewer')} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${userRoleOverride === 'viewer' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40' : 'text-slate-400'}`}>{t('roles.viewer')}</button>
          </div>
          {hasWritePermission && (
            <>
              <button type="button" onClick={() => setShowGovernanceModal(true)} className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl font-semibold text-xs border border-slate-800"><Network size={14} className="text-sky-400" /> {t('actions.hierarchyAndDomain')}</button>
              <button type="button" onClick={() => navigate('/admin/topics')} className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl font-bold text-xs"><Network size={14} className="text-amber-400" /> Cây Phân Cấp Chủ Đề &rarr;</button>
              <div className="relative group">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl font-bold text-xs"><UploadCloud size={14} className="text-emerald-400" /> {t('actions.importExam')} <ChevronDown size={12} /></button>
                <div className="absolute right-0 mt-1.5 w-60 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 hidden group-hover:block z-50 backdrop-blur-xl">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2"><FileUp size={14} className="text-emerald-400" /> <div><div className="font-bold">{t('actions.uploadFiles')}</div><div className="text-[10px] text-slate-400">{t('actions.uploadFilesDesc')}</div></div></button>
                  <button type="button" onClick={importEngine.handleOpenExcelStudio} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800"><FileSpreadsheet size={14} className="text-cyan-400" /> <div><div className="font-bold">{t('actions.cognitiveStudio')}</div><div className="text-[10px] text-slate-400">{t('actions.cognitiveStudioDesc')}</div></div></button>
                  <button type="button" onClick={() => navigate('/admin/studio')} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800"><Columns size={14} className="text-indigo-400" /> <div><div className="font-bold">{t('actions.splitScreenStudio')}</div><div className="text-[10px] text-slate-400">{t('actions.splitScreenStudioDesc')}</div></div></button>
                </div>
              </div>
              <div className="relative group">
                <button type="button" onClick={openAddModal} className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs"><Plus size={14} /> {t('actions.addQuestion')} <ChevronDown size={12} /></button>
                <div className="absolute right-0 mt-1.5 w-56 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 hidden group-hover:block z-50 backdrop-blur-xl">
                  <button type="button" onClick={openAddModal} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2"><Plus size={14} className="text-blue-400" /> <div><div className="font-bold">{t('actions.manualCompose')}</div><div className="text-[10px] text-slate-400">{t('actions.manualComposeDesc')}</div></div></button>
                  <button type="button" onClick={() => setShowAiGenerateModal(true)} className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800"><Brain size={14} className="text-purple-400" /> <div><div className="font-bold">{t('actions.aiGenerate')}</div><div className="text-[10px] text-slate-400">{t('actions.aiGenerateDesc')}</div></div></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <input type="file" ref={fileInputRef} onChange={importEngine.handleFileChange} accept=".xlsx,.xls,.docx,.pdf" className="hidden" />
      {hasWritePermission && (
        <div onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={e => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files?.[0]) importEngine.handleFileImport(e.dataTransfer.files[0]); }} className={`rounded-2xl border transition-all px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 ${dragActive ? 'border-blue-500 bg-blue-500/15' : 'border-slate-800/80 bg-slate-900/40'}`}>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400"><UploadCloud size={16} /></div>
            <div className="text-xs sm:text-sm font-semibold text-slate-200">{t('dropzone.dragDropPrefix')} <span className="text-emerald-400 font-bold font-mono">DOCX/PDF/Excel</span> {t('dropzone.dragDropSuffix')}</div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate('/admin/studio')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/40 text-indigo-300 border border-indigo-500/30 font-bold text-xs hover:bg-indigo-900/50 transition-all"><Columns size={13} /> {t('actions.splitScreenStudio')}</button>
            <button type="button" onClick={importEngine.handleOpenExcelStudio} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 font-bold text-xs"><FileSpreadsheet size={13} /> {t('dropzone.studioButton')}</button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-black tracking-wide text-blue-400 uppercase">
            {t('tabs.questions')} ({questions.length})
          </span>
          <button
            type="button"
            onClick={() => navigate('/admin/topics')}
            className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1.5 bg-slate-900/60 hover:bg-slate-800 px-3 py-1 rounded-xl border border-slate-800 cursor-pointer"
          >
            <Network size={13} className="text-amber-400" />
            <span>Quản Lý Cây Chủ Đề ({topics.length}) &rarr;</span>
          </button>
        </div>
        {user?.role !== 'Learner' && user?.role !== 'GuestViewer' && (
          <button
            type="button"
            onClick={() => navigate('/admin/parsing-rules')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 text-purple-300 border border-purple-500/30 font-bold text-xs hover:bg-purple-900/50 hover:text-white transition-all cursor-pointer shadow-sm"
            title="Chỉ Admin mới có quyền cấu hình ParsingRules"
          >
            <Cpu size={13} className="text-purple-400" />
            Quản Lý Quy Tắc CIG &rarr;
          </button>
        )}
      </div>

      <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-slate-850 bg-slate-900/30 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2"><HelpCircle size={20} className="text-purple-400" /> {t('tabs.questionsCardTitle')}</h2>
          <button onClick={fetchData} className="text-xs text-slate-400 hover:text-white font-bold tracking-wider uppercase bg-slate-950/60 border border-slate-855 px-3.5 py-1.5 rounded-full cursor-pointer">{t('actions.refresh')}</button>
        </div>
        <QuestionTableSection
          questions={questions} topics={topics} filteredQuestions={qFilters.filteredQuestions} pagedQuestions={qFilters.pagedQuestions}
          user={user} hasWritePermission={hasWritePermission} selectedQuestionIds={selectedQuestionIds}
          rangeFrom={rangeFrom} rangeTo={rangeTo} setRangeFrom={setRangeFrom} setRangeTo={setRangeTo}
          handleSelectRange={handleSelectRange} handleToggleSelect={id => setSelectedQuestionIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
          handleToggleSelectAll={() => setSelectedQuestionIds(qFilters.filteredQuestions.every(q => selectedQuestionIds.includes(q.id)) ? [] : qFilters.filteredQuestions.map(q => q.id))}
          qSearch={qFilters.qSearch} setQSearch={qFilters.setQSearch} qDomainFilter={qFilters.qDomainFilter} setQDomainFilter={qFilters.setQDomainFilter}
          qTopicFilter={qFilters.qTopicFilter} setQTopicFilter={qFilters.setQTopicFilter} qTypeFilter={qFilters.qTypeFilter} setQTypeFilter={qFilters.setQTypeFilter}
          showMissingOnly={qFilters.showMissingOnly} setShowMissingOnly={qFilters.setShowMissingOnly} qTagFilter={qFilters.qTagFilter} setQTagFilter={qFilters.setQTagFilter}
          qGradeFilter={qFilters.qGradeFilter} setQGradeFilter={qFilters.setQGradeFilter}
          qTreePathFilter={qFilters.qTreePathFilter} setQTreePathFilter={qFilters.setQTreePathFilter}
          qCanonicalTopicFilter={qFilters.qCanonicalTopicFilter} setQCanonicalTopicFilter={qFilters.setQCanonicalTopicFilter}
          qExamFilter={qFilters.qExamFilter} setQExamFilter={qFilters.setQExamFilter}
          availableExams={qFilters.availableExams}
          qViewMode={qFilters.qViewMode} setQViewMode={qFilters.setQViewMode}
          onOpenPivotDrawer={() => setShowPivotDrawer(true)}
          onOpenMatrixModal={() => setShowMatrixModal(true)}
          qPage={qFilters.qPage} setQPage={qFilters.setQPage} qPageSize={qFilters.qPageSize} qTotalPages={qFilters.qTotalPages}
          qSortField={qFilters.qSortField} setQSortField={qFilters.setQSortField} qSortAsc={qFilters.qSortAsc} setQSortAsc={qFilters.setQSortAsc}
          renderSortIcon={renderSortIcon} setSelectedContext={setSelectedContext} openEditModal={openEditModal} setIsEditing={setIsEditing}
          handleSuggestAnswer={async q => { try { const res = await learnerQuizService.suggestQuestionAnswer(q.id); openEditModal(q); setIsEditing(true); setCorrectAnswer(res.suggestedAnswer || ''); setCitation(res.aiExplanation || ''); } catch { alert('AI error'); } }}
          handleToggleActive={handleToggleActive} handleDelete={handleDelete} handleContributeToTenant={handleContributeToTenant}
          isCleaningOrphans={isCleaningOrphans} handleCleanupOrphans={handleCleanupOrphans} Pagination={Pagination}
        />
      </div>

      {/* Modals */}
      <QuestionModal isOpen={isModalOpen} isEditing={isEditing} editingId={editingId} hasWritePermission={hasWritePermission} currentUser={user} scope={formScope} setScope={setFormScope} questions={questions} topics={topics} content={content} questionType={questionType} difficulty={difficulty} categoryCode={categoryCode} durationSeconds={durationSeconds} options={options} citation={citation} correctAnswer={correctAnswer} contentType={contentType} optionType={optionType} setContent={setContent} setQuestionType={setQuestionType} setDifficulty={setDifficulty} setCategoryCode={setCategoryCode} setDurationSeconds={setDurationSeconds} setOptions={setOptions} setCitation={setCitation} setCorrectAnswer={setCorrectAnswer} setContentType={setContentType} setOptionType={setOptionType} setIsEditing={setIsEditing} contexts={availableContexts} contextId={currentContextId} contextTitle={currentContextTitle} contextContent={currentContextContent} setContextId={setCurrentContextId} setContextTitle={setCurrentContextTitle} setContextContent={setCurrentContextContent} isStickyContext={isStickyContext} setIsStickyContext={setIsStickyContext} stickyCount={stickyCount} setStickyCount={setStickyCount} onSaveAndContinue={handleSaveAndContinue} domainCode={formDomainCode} setDomainCode={setFormDomainCode} tags={formTags} setTags={setFormTags} targetLevel={formTargetLevel} setTargetLevel={setFormTargetLevel} assessmentPurpose={formAssessmentPurpose} setAssessmentPurpose={setFormAssessmentPurpose} issuingOrg={formIssuingOrg} setIssuingOrg={setFormIssuingOrg} benchmarkYear={formBenchmarkYear} setBenchmarkYear={setFormBenchmarkYear} onClose={() => setIsModalOpen(false)} onSave={handleSave} onOpenAdd={openAddModal} onOpenEdit={openEditModal} onDelete={handleDelete} onToggleActive={handleToggleActive} />
      <DocxPreviewModal isOpen={importEngine.showDocxPreviewModal} onClose={() => importEngine.setShowDocxPreviewModal(false)} docxPreviewList={importEngine.docxPreviewList} setDocxPreviewList={importEngine.setDocxPreviewList} topics={topics} loading={loading} onConfirmImport={async () => { try { await learnerQuizService.confirmImportQuestionsDocx(importEngine.docxPreviewList); importEngine.setShowDocxPreviewModal(false); fetchData(); } catch (err: any) { const errDetail = err?.response?.data?.message || err?.message || 'Lỗi không xác định'; console.error('[DocxImport] Error:', err); alert(`Import thất bại: ${errDetail}`); } }} isProcessing={importEngine.isDocxProcessing} processingFileName={importEngine.processingFileName} processingDurationMs={importEngine.processingDurationMs} ingestionSource={importEngine.ingestionEngineSource} />
      <AiGenerateModal isOpen={showAiGenerateModal} onClose={() => setShowAiGenerateModal(false)} topics={topics} onSuccess={fetchData} />
      <ExcelPreviewModal isOpen={importEngine.showExcelPreviewModal} excelPreviewData={importEngine.excelPreviewData} excelSelectedSheets={importEngine.excelSelectedSheets} setExcelSelectedSheets={importEngine.setExcelSelectedSheets} isExcelImporting={importEngine.isExcelImporting} onClose={() => importEngine.setShowExcelPreviewModal(false)} onConfirm={importEngine.handleConfirmExcelImport} />
      <ExcelIngestionStudioModal isOpen={importEngine.showExcelStudioModal} isProcessing={importEngine.isExcelImporting} inspectionData={importEngine.excelPreviewData} topics={topics} onClose={() => importEngine.setShowExcelStudioModal(false)} onConfirmImport={importEngine.handleConfirmStudioImport} onLoadSampleData={importEngine.handleLoadStudioSample} />
      <UniversalContextModal context={selectedContext} onClose={() => setSelectedContext(null)} />
      <BatchActionBar selectedCount={selectedQuestionIds.length} isBulkDeleting={isBulkDeleting} onOpenBatchContext={() => setShowBatchContextModal(true)} onOpenBatchTag={() => setShowBatchTagModal(true)} onBatchRemoveContext={async () => { if (!window.confirm('Detach passage?')) return; await learnerQuizService.batchRemoveContext(selectedQuestionIds); setSelectedQuestionIds([]); fetchData(); }} onBulkDelete={handleBulkDeleteQuestions} onDeselectAll={() => setSelectedQuestionIds([])} />
      <BatchContextModal isOpen={showBatchContextModal} onClose={() => setShowBatchContextModal(false)} selectedCount={selectedQuestionIds.length} contexts={availableContexts} onConfirm={async data => { setIsBatchAssigning(true); try { await learnerQuizService.batchAssignContext({ questionIds: selectedQuestionIds, ...data }); setSelectedQuestionIds([]); setShowBatchContextModal(false); fetchData(); } catch { alert('Assign failed'); } finally { setIsBatchAssigning(false); } }} isAssigning={isBatchAssigning} />
      <BatchTagModal isOpen={showBatchTagModal} onClose={() => setShowBatchTagModal(false)} selectedCount={selectedQuestionIds.length} selectedQuestionIds={selectedQuestionIds} onApply={async data => { setIsBatchTagging(true); try { await learnerQuizService.batchAssignTags({ questionIds: selectedQuestionIds, ...data }); setSelectedQuestionIds([]); setShowBatchTagModal(false); fetchData(); } catch { alert('Tagging failed'); } finally { setIsBatchTagging(false); } }} isSubmitting={isBatchTagging} />
      <TenantGovernanceModal isOpen={showGovernanceModal} onClose={() => setShowGovernanceModal(false)} />
      <TaxonomyPivotDrawer
        isOpen={showPivotDrawer}
        onClose={() => setShowPivotDrawer(false)}
        domainCode={qFilters.qDomainFilter === 'ALL' ? 'EDUCATION' : qFilters.qDomainFilter}
        onApplyFilter={(facet: { topicCode?: string; grade?: string; series?: string; term?: string; termPhase?: string; treePath?: string }) => {
          if (facet.treePath) qFilters.setQTreePathFilter(facet.treePath);
          if (facet.topicCode) qFilters.setQTopicFilter(facet.topicCode);
          if (facet.grade) qFilters.setQGradeFilter(facet.grade);
          if (facet.series) qFilters.setQCurriculumSeriesFilter(facet.series);
          const termVal = facet.term || facet.termPhase;
          if (termVal) qFilters.setQSemesterPhaseFilter(termVal);
        }}
      />
      <TaxonomyMatrixModal
        isOpen={showMatrixModal}
        onClose={() => setShowMatrixModal(false)}
        domainCode={qFilters.qDomainFilter === 'ALL' ? 'EDUCATION' : qFilters.qDomainFilter}
        onSelectCell={facet => {
          if (facet.topicCode) qFilters.setQTopicFilter(facet.topicCode);
          if (facet.grade) qFilters.setQGradeFilter(facet.grade);
        }}
      />
    </div>
  );
}

export default AdminQuestionsPage;
