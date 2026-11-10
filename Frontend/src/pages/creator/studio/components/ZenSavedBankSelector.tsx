import React, { useState } from 'react';
import {
  FileQuestion,
  CheckSquare,
  Square,
  Play,
  Send,
  Search,
  RefreshCw,
  Database,
  FileText,
  FolderPlus,
} from 'lucide-react';
import { MathRenderer } from '@/components/common/MathRenderer';
import type { BankTopic } from '@/pages/admin/questions/types';
import type { LearnerQuestion } from '@/types/quiz';
import { useZenSavedBank } from '../hooks/useZenSavedBank';
import { ZenTopicTreePanel } from './ZenTopicTreePanel';
import { ZenQuickTopicModal } from './ZenQuickTopicModal';

interface ZenSavedBankSelectorProps {
  onLaunchArena: (questions: LearnerQuestion[], topic: BankTopic | null) => void;
  onAssignHomework: (questions: LearnerQuestion[], topic: BankTopic | null) => void;
  onLoadIntoStudio?: (questions: LearnerQuestion[], topic: BankTopic | null) => void;
}

export const ZenSavedBankSelector: React.FC<ZenSavedBankSelectorProps> = ({
  onLaunchArena,
  onAssignHomework,
  onLoadIntoStudio,
}) => {
  const bank = useZenSavedBank();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<BankTopic | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

  const activeTopic = bank.selectedTopicNode || null;
  const activeQuestions = bank.selectedQuestions;

  const handleArenaClick = () => {
    if (activeQuestions.length === 0) {
      alert('Vui lòng chọn chủ đề hoặc tích chọn ít nhất 1 câu hỏi để kích hoạt Đấu trường.');
      return;
    }
    onLaunchArena(activeQuestions, activeTopic);
  };

  const handleHomeworkClick = () => {
    if (activeQuestions.length === 0) {
      alert('Vui lòng chọn chủ đề hoặc tích chọn ít nhất 1 câu hỏi để Giao bài tập.');
      return;
    }
    onAssignHomework(activeQuestions, activeTopic);
  };

  const handleLoadStudioClick = () => {
    if (activeQuestions.length === 0) {
      alert('Vui lòng chọn chủ đề hoặc tích chọn ít nhất 1 câu hỏi để nạp vào Studio.');
      return;
    }
    onLoadIntoStudio?.(activeQuestions, activeTopic);
  };

  const openCreateRoot = () => {
    setEditingTopic(null);
    setDefaultParentId(null);
    setModalOpen(true);
  };

  const openCreateChild = (parent: BankTopic) => {
    setEditingTopic(null);
    setDefaultParentId(parent.id);
    setModalOpen(true);
  };

  const openEditTopic = (topic: BankTopic) => {
    setEditingTopic(topic);
    setDefaultParentId(topic.parentId || null);
    setModalOpen(true);
  };

  const handleDeleteTopic = async (topic: BankTopic) => {
    if (
      !window.confirm(
        `Thầy/Cô có chắc chắn muốn xóa nhánh chủ đề "${topic.name}" (${topic.code})? Các câu hỏi bên trong sẽ được giữ an toàn.`
      )
    ) {
      return;
    }
    try {
      await bank.deleteTopicNode(topic);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi xóa nhánh chủ đề.');
    }
  };

  const allInTopicSelected =
    bank.topicQuestions.length > 0 &&
    bank.topicQuestions.every((q) => bank.selectedQuestionIds.includes(q.id));

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/90 border border-amber-500/25 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Database size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white">
                Kho Chủ Đề Phân Cấp &amp; Câu Hỏi Đã Lưu
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold">
                {bank.topics.length} nhánh chủ đề &bull; {bank.allQuestions.length} câu hỏi
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Chọn nhánh cha để gom toàn bộ câu hỏi nhánh con, hoặc tạo cây thư mục đa cấp Môn &rarr; Chương &rarr; Bài
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => bank.fetchMyBank()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw size={13} className={bank.loading ? 'animate-spin text-amber-400' : ''} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={() =>
              activeTopic ? openCreateChild(activeTopic) : openCreateRoot()
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
          >
            <FolderPlus size={14} />
            <span>{activeTopic ? `+ Nhánh con (${activeTopic.code})` : '+ Tạo Chủ Đề'}</span>
          </button>

          <button
            type="button"
            onClick={handleHomeworkClick}
            disabled={activeQuestions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Send size={13} />
            <span>Giao Bài Tập ({activeQuestions.length} câu)</span>
          </button>

          {onLoadIntoStudio && (
            <button
              type="button"
              onClick={handleLoadStudioClick}
              disabled={activeQuestions.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <FileText size={13} />
              <span>Biên Tập Studio ({activeQuestions.length} câu)</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleArenaClick}
            disabled={activeQuestions.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Play size={13} />
            <span>Kích Hoạt Đấu Trường ({activeQuestions.length} câu)</span>
          </button>
        </div>
      </div>

      {/* 2-Column Split: Left = Hierarchical Topic Tree (5 cols), Right = Questions in Subtree (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <ZenTopicTreePanel
          roots={bank.topicTreeRoots}
          allParentIds={bank.allParentIds}
          totalTopicsCount={bank.topics.length}
          selectedTopicCode={bank.selectedTopicCode}
          topicSearch={bank.topicSearch}
          onSearchChange={bank.setTopicSearch}
          onSelectTopic={bank.setSelectedTopicCode}
          onOpenCreateRoot={openCreateRoot}
          onOpenCreateChild={openCreateChild}
          onOpenEditTopic={openEditTopic}
          onDeleteTopic={handleDeleteTopic}
        />

        {/* Right: Questions in Selected Topic Subtree */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-3.5 flex flex-col h-[540px]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <FileQuestion size={14} className="text-emerald-400" />
              <span>
                {activeTopic
                  ? `${activeTopic.name} (${bank.topicQuestions.length} câu toàn nhánh)`
                  : `Tất cả câu hỏi (${bank.topicQuestions.length})`}
              </span>
              {bank.selectedQuestionIds.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                  Đã chọn {bank.selectedQuestionIds.length} câu
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={bank.toggleSelectAllInTopic}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-bold transition cursor-pointer"
              >
                {allInTopicSelected ? (
                  <CheckSquare size={13} className="text-emerald-400" />
                ) : (
                  <Square size={13} />
                )}
                <span>{allInTopicSelected ? 'Bỏ chọn chủ đề này' : 'Chọn cả nhánh này'}</span>
              </button>
              {bank.selectedQuestionIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => bank.setSelectedQuestionIds([])}
                  className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                >
                  Xóa chọn ({bank.selectedQuestionIds.length})
                </button>
              )}
            </div>
          </div>

          <div className="relative mb-2.5">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={bank.questionSearch}
              onChange={(e) => bank.setQuestionSearch(e.target.value)}
              placeholder="Tìm nội dung câu hỏi hoặc mã đề con trong nhánh..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {bank.topicQuestions.map((q, idx) => {
              const checked = bank.selectedQuestionIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => bank.toggleSelectQuestion(q.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    checked
                      ? 'bg-emerald-950/25 border-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <button type="button" className="mt-0.5 text-slate-400 shrink-0">
                    {checked ? (
                      <CheckSquare size={15} className="text-emerald-400" />
                    ) : (
                      <Square size={15} />
                    )}
                  </button>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-indigo-400">
                          Câu {idx + 1}
                        </span>
                        {(q.topicCode || q.categoryCode) && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-amber-400">
                            {q.topicCode || q.categoryCode}
                          </span>
                        )}
                      </div>
                      {q.answerRaw && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono font-bold">
                          Đáp án: {q.answerRaw}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-200 line-clamp-2">
                      <MathRenderer content={q.content || ''} />
                    </div>
                  </div>
                </div>
              );
            })}

            {bank.topicQuestions.length === 0 && (
              <div className="text-center py-14 text-xs text-slate-500 space-y-2">
                <p>Nhánh chủ đề đang chọn chưa có câu hỏi nào.</p>
                {activeTopic && (
                  <button
                    type="button"
                    onClick={() => openCreateChild(activeTopic)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-pointer"
                  >
                    <FolderPlus size={13} />
                    <span>+ Tạo Chủ Đề Con Trong &ldquo;{activeTopic.name}&rdquo;</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ZenQuickTopicModal
        isOpen={modalOpen}
        editingTopic={editingTopic}
        defaultParentId={defaultParentId}
        topics={bank.topics}
        questions={bank.allQuestions}
        onClose={() => setModalOpen(false)}
        onSubmit={async (payload, editingId) => {
          if (editingId) {
            await bank.updateTopicNode(editingId, payload);
          } else {
            await bank.createTopicNode(payload);
          }
        }}
      />
    </div>
  );
};
