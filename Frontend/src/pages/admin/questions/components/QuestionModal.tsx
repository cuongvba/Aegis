import React, { useState, useEffect } from 'react';
import type { LearnerQuestion, QuestionType } from '@/types/quiz';
import type { BankTopic } from '../types';
import { canManageResource, type UserProfile } from '@/types/auth';
import { QuestionModalHeader } from './modal/QuestionModalHeader';
import { QuestionContextSection } from './modal/QuestionContextSection';
import { QuestionContentSection } from './modal/QuestionContentSection';
import { QuestionOptionsSection } from './modal/QuestionOptionsSection';
import { QuestionConfigSection } from './modal/QuestionConfigSection';
import { QuestionExplanationSection } from './modal/QuestionExplanationSection';
import { QuestionTaxonomySection } from './modal/QuestionTaxonomySection';
import { QuestionModalFooter } from './modal/QuestionModalFooter';

export interface QuestionModalProps {
  isOpen: boolean;
  isEditing: boolean;
  editingId: string | null;
  hasWritePermission: boolean;
  currentUser?: UserProfile | null;
  questions: LearnerQuestion[];
  topics: BankTopic[];

  // Scope & Ownership
  scope?: 'COMMUNITY' | 'TENANT' | 'TEAM' | 'PERSONAL';
  setScope?: (v: 'COMMUNITY' | 'TENANT' | 'TEAM' | 'PERSONAL') => void;

  // Form state
  content: string;
  questionType: QuestionType;
  difficulty: number;
  categoryCode: string;
  durationSeconds: number;
  options: string[];
  citation: string;
  correctAnswer: string;
  contentType: string;
  optionType: string;

  // Setters
  setContent: (v: string) => void;
  setQuestionType: (v: QuestionType) => void;
  setDifficulty: (v: number) => void;
  setCategoryCode: (v: string) => void;
  setDurationSeconds: (v: number) => void;
  setOptions: (v: string[]) => void;
  setCitation: (v: string) => void;
  setCorrectAnswer: (v: string) => void;
  setContentType: (v: string) => void;
  setOptionType: (v: string) => void;
  setIsEditing: (v: boolean) => void;

  // Universal Context props
  contexts?: any[];
  contextId?: string;
  contextTitle?: string;
  contextContent?: string;
  setContextId?: (v: string) => void;
  setContextTitle?: (v: string) => void;
  setContextContent?: (v: string) => void;
  isStickyContext?: boolean;
  setIsStickyContext?: (v: boolean) => void;
  stickyCount?: number;
  setStickyCount?: (v: React.SetStateAction<number>) => void;
  onSaveAndContinue?: (e: React.FormEvent) => void;

  // Universal Multi-Industry & Smart Tag props
  domainCode?: string;
  setDomainCode?: (v: string) => void;
  tags?: string[];
  setTags?: (v: string[]) => void;
  targetLevel?: string;
  setTargetLevel?: (v: string) => void;
  assessmentPurpose?: string;
  setAssessmentPurpose?: (v: string) => void;
  issuingOrg?: string;
  setIssuingOrg?: (v: string) => void;
  benchmarkYear?: number;
  setBenchmarkYear?: (v: number | undefined) => void;

  // Actions
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onOpenAdd: () => void;
  onOpenEdit: (q: LearnerQuestion) => void;
  onDelete: (id: string) => void;
  onToggleActive: (q: LearnerQuestion) => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  isEditing,
  editingId,
  hasWritePermission,
  currentUser,
  scope = 'COMMUNITY',
  setScope,
  questions,
  topics,
  content,
  questionType,
  difficulty,
  categoryCode,
  durationSeconds,
  options,
  citation,
  correctAnswer,
  contentType,
  optionType,
  setContent,
  setQuestionType,
  setDifficulty,
  setCategoryCode,
  setDurationSeconds,
  setOptions,
  setCitation,
  setCorrectAnswer,
  setContentType,
  setOptionType,
  setIsEditing,
  contexts = [],
  contextId = '',
  contextTitle = '',
  contextContent = '',
  setContextId,
  setContextTitle,
  setContextContent,
  isStickyContext = false,
  setIsStickyContext,
  stickyCount = 0,
  setStickyCount,
  onSaveAndContinue,
  domainCode = 'EDUCATION',
  setDomainCode,
  tags = [],
  setTags,
  targetLevel = '',
  setTargetLevel,
  assessmentPurpose = '',
  setAssessmentPurpose,
  issuingOrg = '',
  setIssuingOrg,
  benchmarkYear = 2025,
  setBenchmarkYear,
  onClose,
  onSave,
  onOpenAdd,
  onOpenEdit,
  onDelete,
  onToggleActive,
}) => {
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);

  const notifySmartMedia = (msg: string) => {
    setPasteNotice(msg);
    window.setTimeout(() => setPasteNotice(prev => (prev === msg ? null : prev)), 4000);
  };

  // Keyboard shortcut: Ctrl + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (isEditing && !editingId && onSaveAndContinue) {
          e.preventDefault();
          onSaveAndContinue(e as any);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editingId, onSaveAndContinue]);

  if (!isOpen) return null;

  const activeQuestion = questions.find(q => q.id === editingId);
  const isManageable = editingId ? canManageResource(currentUser, activeQuestion) : hasWritePermission;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl lg:max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative space-y-6 max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
        <QuestionModalHeader
          isEditing={isEditing}
          editingId={editingId}
          activeQuestion={activeQuestion}
          onClose={onClose}
        />

        <form onSubmit={onSave} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* PANEL TRÁI: Nội dung, Ngữ cảnh & Phương án */}
            <div className="lg:col-span-3 space-y-4 bg-slate-950/20 p-4 rounded-2xl border border-slate-800/40">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Nội dung &amp; Phương án
              </h3>

              <QuestionContextSection
                isEditing={isEditing}
                editingId={editingId}
                activeQuestion={activeQuestion}
                contexts={contexts}
                contextId={contextId}
                contextTitle={contextTitle}
                contextContent={contextContent}
                setContextId={setContextId}
                setContextTitle={setContextTitle}
                setContextContent={setContextContent}
                isStickyContext={isStickyContext}
                setIsStickyContext={setIsStickyContext}
                stickyCount={stickyCount}
                setStickyCount={setStickyCount}
                notifySmartMedia={notifySmartMedia}
              />

              <QuestionContentSection
                content={content}
                setContent={setContent}
                isEditing={isEditing}
                pasteNotice={pasteNotice}
                notifySmartMedia={notifySmartMedia}
              />

              <QuestionOptionsSection
                questionType={questionType}
                options={options}
                setOptions={setOptions}
                correctAnswer={correctAnswer}
                setCorrectAnswer={setCorrectAnswer}
                isEditing={isEditing}
                notifySmartMedia={notifySmartMedia}
              />
            </div>

            {/* PANEL PHẢI: Cấu hình, Đáp án & Phân loại */}
            <div className="lg:col-span-2 space-y-4 bg-slate-950/20 p-4 rounded-2xl border border-slate-800/40 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Cấu hình &amp; Đáp án
                </h3>

                <QuestionConfigSection
                  questionType={questionType}
                  setQuestionType={setQuestionType}
                  correctAnswer={correctAnswer}
                  setCorrectAnswer={setCorrectAnswer}
                  options={options}
                  contentType={contentType}
                  setContentType={setContentType}
                  optionType={optionType}
                  setOptionType={setOptionType}
                  categoryCode={categoryCode}
                  setCategoryCode={setCategoryCode}
                  topics={topics}
                  difficulty={difficulty}
                  setDifficulty={setDifficulty}
                  durationSeconds={durationSeconds}
                  setDurationSeconds={setDurationSeconds}
                  scope={scope}
                  setScope={setScope}
                  currentUser={currentUser}
                  activeQuestion={activeQuestion}
                  isEditing={isEditing}
                />

                <QuestionExplanationSection
                  citation={citation}
                  setCitation={setCitation}
                  isEditing={isEditing}
                  notifySmartMedia={notifySmartMedia}
                />

                <QuestionTaxonomySection
                  domainCode={domainCode}
                  setDomainCode={setDomainCode}
                  targetLevel={targetLevel}
                  setTargetLevel={setTargetLevel}
                  assessmentPurpose={assessmentPurpose}
                  setAssessmentPurpose={setAssessmentPurpose}
                  issuingOrg={issuingOrg}
                  setIssuingOrg={setIssuingOrg}
                  benchmarkYear={benchmarkYear}
                  setBenchmarkYear={setBenchmarkYear}
                  tags={tags}
                  setTags={setTags}
                  activeQuestion={activeQuestion}
                  isEditing={isEditing}
                />
              </div>

              <QuestionModalFooter
                isEditing={isEditing}
                editingId={editingId}
                hasWritePermission={hasWritePermission}
                isManageable={isManageable}
                activeQuestion={activeQuestion}
                questions={questions}
                onOpenAdd={onOpenAdd}
                onOpenEdit={onOpenEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
                setIsEditing={setIsEditing}
                onClose={onClose}
                onSaveAndContinue={onSaveAndContinue}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default QuestionModal;
