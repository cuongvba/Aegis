import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { BankTopic } from '../types';
import { CreateTopicModal } from './CreateTopicModal';
import { BulkTaxonomyModal } from './BulkTaxonomyModal';

// Sub-components kiến trúc Zero-Monolith
import { DOMAIN_OPTIONS, DOMAIN_SUGGESTED_TAGS, generateTopicCode } from './docx/docx-constants';
import { DocxProcessingOverlay } from './docx/DocxProcessingOverlay';
import { DocxModalHeader } from './docx/DocxModalHeader';
import { DocxTaxonomyBar } from './docx/DocxTaxonomyBar';
import { DocxTopicDecisionBanner } from './docx/DocxTopicDecisionBanner';
import { DocxMathTypographyStudio } from './docx/DocxMathTypographyStudio';
import { DocxCigRulesPanel } from './docx/DocxCigRulesPanel';
import { DocxQuestionCardRow } from './docx/DocxQuestionCardRow';
import { DocxModalFooter } from './docx/DocxModalFooter';
import { useDocxPreviewState } from './docx/useDocxPreviewState';

// Export các hằng số và helper để bảo đảm 100% tính tương thích ngược (OCP)
export { DOMAIN_OPTIONS, DOMAIN_SUGGESTED_TAGS, generateTopicCode };

interface DocxPreviewModalProps {
  isOpen: boolean;
  isProcessing: boolean;
  isAiSolving?: boolean;
  isConvertingLatex?: boolean;
  processingFileName?: string;
  processingDurationMs?: number | null;
  ingestionSource?: 'client_edge' | 'cloud_server' | 'cloud_fallback';
  docxPreviewList: any[];
  topics: BankTopic[];
  loading: boolean;
  setDocxPreviewList: (v: any[]) => void;
  onClose: () => void;
  onConfirmImport: () => Promise<void>;
  onAiSolveBatch?: () => Promise<void>;
  onConvertLatex?: () => Promise<void>;
  onTopicCreated?: (topic: BankTopic) => void;
}

/**
 * DocxPreviewModal — Orchestrator duyệt đề thi Word/PDF/Excel đỉnh cao (Zero-Monolith)
 * Đã phân rã toàn diện từ 2,054 dòng code thành các Micro-Components độc lập theo chuẩn AGENTS.md.
 */
function DocxPreviewModalContent({
  isOpen,
  isProcessing,
  isAiSolving,
  isConvertingLatex,
  processingFileName,
  processingDurationMs,
  ingestionSource,
  docxPreviewList,
  topics,
  loading,
  setDocxPreviewList,
  onClose,
  onConfirmImport,
  onAiSolveBatch,
  onConvertLatex,
  onTopicCreated,
}: DocxPreviewModalProps) {
  const state = useDocxPreviewState({
    docxPreviewList,
    topics,
    setDocxPreviewList,
    processingFileName,
    onTopicCreated,
  });

  // Tối ưu cuộn lũy tiến (Progressive Chunk Rendering) cho đề thi lớn (200-500+ câu)
  const [renderLimit, setRenderLimit] = useState(30);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUpdatingChunkRef = useRef(false);

  useEffect(() => {
    // Reset số lượng hiển thị khi danh sách hoặc bộ lọc đề thi thay đổi
    setRenderLimit(30);
  }, [state.selectedExamFilter, state.displayedList.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isUpdatingChunkRef.current) return;
    const target = e.currentTarget;
    const remainingScroll = target.scrollHeight - target.scrollTop - target.clientHeight;
    // Khi cuộn gần tới đáy (< 450px), tự động nạp tiếp 25 câu tiếp theo với throttle bảo vệ CPU/RAM
    if (remainingScroll < 450 && renderLimit < state.displayedList.length) {
      isUpdatingChunkRef.current = true;
      requestAnimationFrame(() => {
        setRenderLimit(prev => Math.min(prev + 25, state.displayedList.length));
        setTimeout(() => {
          isUpdatingChunkRef.current = false;
        }, 120);
      });
    }
  };

  if (isProcessing || isAiSolving || isConvertingLatex) {
    return (
      <DocxProcessingOverlay
        isProcessing={isProcessing}
        isAiSolving={isAiSolving}
        isConvertingLatex={isConvertingLatex}
        processingFileName={processingFileName}
      />
    );
  }

  if (!isOpen) return null;

  const singleMultiCount = docxPreviewList.filter(q => q.questionType !== 'ESSAY').length;
  const essayCount = docxPreviewList.filter(q => q.questionType === 'ESSAY').length;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden font-sans text-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer z-10"
        >
          <X size={20} />
        </button>

        {/* 1. Header Bar */}
        <DocxModalHeader
          totalQuestions={docxPreviewList.length}
          processingDurationMs={processingDurationMs}
          singleMultiCount={singleMultiCount}
          essayCount={essayCount}
          ingestionSource={ingestionSource}
        />

        {/* 2. Taxonomy & Master Control Capsule */}
        <DocxTaxonomyBar
          bulkTopic={state.bulkTopic}
          setBulkTopic={state.setBulkTopic}
          localTopics={state.localTopics}
          openCreateTopicModal={state.openCreateTopicModal}
          bulkDifficulty={state.bulkDifficulty}
          setBulkDifficulty={state.setBulkDifficulty}
          bulkDomain={state.bulkDomain}
          setBulkDomain={state.setBulkDomain}
          activeDomains={state.activeDomains}
          onApplyAllCore={state.handleApplyAllCore}
          totalCount={docxPreviewList.length}
          onCorrectVietnamese={state.handleCorrectVietnamese}
          isCorrectingVN={state.isCorrectingVN}
          rawOriginalList={state.rawOriginalList}
          onRevertRawText={state.handleRevertRawText}
          onOpenBulkTaxonomyModal={() => state.setShowBulkTaxonomyModal(true)}
          onAutoClassifyTaxonomyAndTags={state.handleAutoClassifyTaxonomyAndTags}
          showAdvancedBulkTools={state.showAdvancedBulkTools}
          setShowAdvancedBulkTools={state.setShowAdvancedBulkTools}
          bulkTagInput={state.bulkTagInput}
          setBulkTagInput={state.setBulkTagInput}
          onAddBulkTag={state.handleAddBulkTag}
          onAutoClassifyTopics={state.handleAutoClassifyTopics}
          onConvertLatex={onConvertLatex}
          hasFormulaImages={state.hasFormulaImages}
          showMathStudio={state.showMathStudio}
          setShowMathStudio={state.setShowMathStudio}
          mathSettings={state.mathContext.settings}
          showCigRules={state.showCigRules}
          setShowCigRules={state.setShowCigRules}
          hasMultipleExams={state.hasMultipleExams}
          examGroups={state.examGroups}
          selectedExamFilter={state.selectedExamFilter}
          setSelectedExamFilter={state.setSelectedExamFilter}
          docxPreviewList={docxPreviewList}
        />

        {/* 2.5. Quyết định áp dụng chủ đề mới hay đồng bộ chủ đề chọn */}
        {state.showTopicDecisionBanner && (
          <DocxTopicDecisionBanner
            detectedTopicInfo={state.detectedTopicInfo}
            bulkTopic={state.bulkTopic}
            localTopics={state.localTopics}
            totalQuestions={docxPreviewList.length}
            isCreatingTopic={state.isCreatingVirtualTopic}
            onApplyDetectedTopic={state.handleApplyDetectedTopic}
            onSyncWithSelectedTopic={state.handleSyncWithSelectedTopic}
            onDismiss={state.handleDismissTopicDecision}
          />
        )}

        {/* 3. Math Studio Drawer (nếu bật) */}
        <DocxMathTypographyStudio
          showMathStudio={state.showMathStudio}
          setShowMathStudio={state.setShowMathStudio}
          mathSettings={state.mathContext.settings}
          updateMathSettings={state.mathContext.updateSettings}
          availablePresets={state.mathContext.availablePresets}
          currentPreset={state.mathContext.currentPreset}
          applyPreset={state.mathContext.applyPreset}
          applySubjectProfile={state.mathContext.applySubjectProfile}
          resetMathDefaults={state.mathContext.resetToDefaults}
        />

        {/* 4. CIG Rules Studio Drawer (nếu bật) */}
        <DocxCigRulesPanel
          showCigRules={state.showCigRules}
          setShowCigRules={state.setShowCigRules}
        />

        {/* 5. Question Preview List */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto space-y-3 pr-1 my-1 [will-change:scroll-position] overscroll-contain"
        >
          {state.displayedList.slice(0, renderLimit).map((item, displayedIdx) => {
            const originalIdx = docxPreviewList.indexOf(item);
            const idx = originalIdx >= 0 ? originalIdx : displayedIdx;
            return (
              <DocxQuestionCardRow
                key={item.tempId || idx}
                item={item}
                idx={idx}
                activeDomains={state.activeDomains}
                localTopics={state.localTopics}
                expandedCoords={state.expandedCoords}
                showRawOptions={state.showRawOptions}
                showRawContent={state.showRawContent}
                showRawExplanation={state.showRawExplanation}
                tagInputPerQ={state.tagInputPerQ}
                onUpdateItem={state.updateItem}
                onDeleteItem={state.handleDeleteItem}
                onToggleExpandCoords={state.toggleExpandCoords}
                onToggleShowRawOptions={state.toggleShowRawOptions}
                onToggleShowRawContent={state.toggleShowRawContent}
                onToggleShowRawExplanation={state.toggleShowRawExplanation}
                onAddTagToQuestion={state.handleAddTagToQuestion}
                onRemoveTagFromQuestion={state.handleRemoveTagFromQuestion}
                onSetTagInputPerQ={(qIdx, val) => state.setTagInputPerQ(prev => ({ ...prev, [qIdx]: val }))}
                onOpenCreateTopicModal={state.openCreateTopicModal}
                onOptionChange={state.handleOptionChange}
              />
            );
          })}
          {renderLimit < state.displayedList.length && (
            <div className="py-4 text-center">
              <button
                type="button"
                onClick={() => setRenderLimit(prev => Math.min(prev + 50, state.displayedList.length))}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-sky-400 font-bold border border-slate-800 hover:border-sky-500/40 transition-all shadow-md"
              >
                Đang hiển thị {renderLimit} / {state.displayedList.length} câu • Nhấn hoặc cuộn để tải thêm...
              </button>
            </div>
          )}
        </div>

        {/* 6. Footer Action Bar */}
        <DocxModalFooter
          onClose={onClose}
          loading={loading}
          isAiSolving={isAiSolving}
          isExportingExcel={state.isExportingExcel}
          totalQuestions={docxPreviewList.length}
          showExportMenu={state.showExportMenu}
          setShowExportMenu={state.setShowExportMenu}
          onExportExcel={state.handleExportExcel}
          customTemplateInputRef={state.customTemplateInputRef}
          onExportCustomTemplate={state.handleExportCustomTemplate}
          isTranspilingStandard={state.isTranspilingStandard}
          showTranspileMenu={state.showTranspileMenu}
          setShowTranspileMenu={state.setShowTranspileMenu}
          onTranspileStandard={state.handleTranspileStandard}
          onAiSolveBatch={onAiSolveBatch}
          onConfirmImport={onConfirmImport}
        />

        {/* Sub-modals độc lập */}
        {state.showCreateTopicModal && (
          <CreateTopicModal
            isOpen={state.showCreateTopicModal}
            topics={state.localTopics}
            targetQuestionIdx={state.targetQuestionIdx}
            totalQuestions={docxPreviewList.length}
            onClose={() => state.setShowCreateTopicModal(false)}
            onTopicCreated={(newTopic, applyToAll, targetIdx) => {
              state.setLocalTopics(prev => [...prev, newTopic]);
              if (applyToAll) {
                state.setBulkTopic(newTopic.code);
                const updated = docxPreviewList.map(q => ({ ...q, topicCode: newTopic.code }));
                setDocxPreviewList(updated);
              } else if (targetIdx !== null) {
                state.updateItem(targetIdx, 'topicCode', newTopic.code);
              } else {
                state.setBulkTopic(newTopic.code);
              }
              onTopicCreated?.(newTopic);
              state.setShowCreateTopicModal(false);
            }}
          />
        )}

        {state.showBulkTaxonomyModal && (
          <BulkTaxonomyModal
            isOpen={state.showBulkTaxonomyModal}
            onClose={() => state.setShowBulkTaxonomyModal(false)}
            onApply={state.handleApplyBulkTaxonomy}
            totalQuestions={docxPreviewList.length}
            processingFileName={processingFileName}
            docxPreviewList={docxPreviewList}
            availableDomains={state.activeDomains}
            initialDomain={state.bulkDomain}
            showToast={state.showToast}
          />
        )}

        {/* Toast Notification */}
        {state.toastMessage && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150 z-50">
            {state.toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export function DocxPreviewModal(props: DocxPreviewModalProps) {
  if (!props.isOpen && !props.isProcessing && !props.isAiSolving && !props.isConvertingLatex) {
    return null;
  }
  return <DocxPreviewModalContent {...props} />;
}
