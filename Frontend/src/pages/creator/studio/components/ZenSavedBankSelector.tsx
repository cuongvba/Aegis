import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FolderTree,
  FileQuestion,
  Search,
  CheckCircle2,
  Send,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  CheckSquare,
  Square,
  ShieldCheck,
  ChevronRight,
  Database,
} from 'lucide-react';
import { useZenSavedBank } from '../hooks/useZenSavedBank';
import type { BankTopic } from '@/pages/admin/questions/types';
import type { LearnerQuestion } from '@/types/quiz';

interface ZenSavedBankSelectorProps {
  onLaunchArena: (questions: LearnerQuestion[], topic: BankTopic | null) => void;
  onAssignHomework: (questions: LearnerQuestion[], topic: BankTopic | null) => void;
  onLoadIntoStudio: (questions: LearnerQuestion[], topic: BankTopic | null) => void;
}

export const ZenSavedBankSelector: React.FC<ZenSavedBankSelectorProps> = ({
  onLaunchArena,
  onAssignHomework,
  onLoadIntoStudio,
}) => {
  const { t } = useTranslation('creator');
  const bank = useZenSavedBank();

  const selectedCount = bank.selectedQuestionIds.length;

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      {/* Top Banner Guide */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 border border-amber-500/20 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Database size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{t('savedBank.title', 'Kho Chủ Đề & Câu Hỏi Đã Lưu Của Tôi')}</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                {bank.topics.length} chủ đề • {bank.questions.length} câu hỏi
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {t('savedBank.subtitle', 'Chọn chủ đề hoặc tích chọn câu hỏi để Kích hoạt Đấu trường hoặc Giao bài tập tức thì')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={bank.handleDeselectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>{t('savedBank.clearSelection', 'Bỏ chọn')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Master-Detail 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Topics List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FolderTree size={14} className="text-amber-400" />
                <span>{t('savedBank.topicListTitle', 'Cây Chủ Đề')} ({bank.filteredTopics.length})</span>
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder={t('savedBank.searchTopicPlaceholder', 'Tìm tên hoặc mã chủ đề...')}
                value={bank.searchTopic}
                onChange={(e) => bank.setSearchTopic(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              {bank.filteredTopics.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  {bank.loading ? 'Đang tải danh sách...' : 'Chưa có chủ đề phù hợp'}
                </div>
              ) : (
                bank.filteredTopics.map((top) => {
                  const isSelected = bank.selectedTopicId === top.id;
                  const qCount = bank.questions.filter(
                    (q) =>
                      (q.topicCode && q.topicCode.toLowerCase() === top.code.toLowerCase()) ||
                      (q as any).topicId === top.id ||
                      (q as any).bankTopicId === top.id
                  ).length;

                  return (
                    <div
                      key={top.id}
                      onClick={() => bank.handleSelectTopic(top)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-md shadow-amber-500/5'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs truncate">{top.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="font-mono text-amber-400/90">{top.code}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">{qCount} câu</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className={isSelected ? 'text-amber-400 rotate-90' : 'text-slate-600'} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Questions List (8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileQuestion size={14} className="text-emerald-400" />
                <span>
                  {bank.activeTopic ? bank.activeTopic.name : t('savedBank.allQuestions', 'Tất Cả Câu Hỏi')}{' '}
                  ({bank.filteredQuestions.length})
                </span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={bank.handleSelectAllCurrent}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                >
                  {t('savedBank.selectAll', 'Chọn tất cả')}
                </button>
                <span className="text-slate-700">|</span>
                <button
                  type="button"
                  onClick={bank.handleDeselectAll}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  {t('savedBank.deselectAll', 'Bỏ chọn')}
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder={t('savedBank.searchQuestionPlaceholder', 'Tìm nội dung câu hỏi...')}
                value={bank.searchQuestion}
                onChange={(e) => bank.setSearchQuestion(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              {bank.filteredQuestions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  {bank.loading ? 'Đang tải câu hỏi...' : 'Không có câu hỏi nào trong chủ đề này'}
                </div>
              ) : (
                bank.filteredQuestions.map((q, idx) => {
                  const isChecked = bank.selectedQuestionIds.includes(q.id);
                  return (
                    <div
                      key={q.id || idx}
                      onClick={() => bank.handleToggleQuestion(q.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-950/25 border-emerald-500/40 text-slate-100 shadow-sm'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-750'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button type="button" className="mt-0.5 text-emerald-400 shrink-0">
                          {isChecked ? <CheckSquare size={16} /> : <Square size={16} className="text-slate-600" />}
                        </button>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-amber-400">
                              Câu {idx + 1}
                            </span>
                            {q.topicCode && (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                                {q.topicCode}
                              </span>
                            )}
                          </div>
                          <p className="text-xs line-clamp-2 leading-relaxed text-slate-200">
                            {q.content}
                          </p>
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] text-slate-400">
                              {q.options.slice(0, 4).map((opt, optIdx) => (
                                <div key={optIdx} className="truncate">
                                  <span className="font-bold text-slate-500 mr-1">{String.fromCharCode(65 + optIdx)}.</span>
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Bar (Xuất hiện khi chọn chủ đề hoặc câu hỏi) */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-emerald-500/40 backdrop-blur-xl shadow-2xl rounded-2xl px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-5 w-[92%] max-w-3xl">
          <div className="flex items-center gap-2 text-white font-bold whitespace-nowrap">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span>
              {t('savedBank.selectedQuestionsCount', { count: selectedCount })}
            </span>
            {bank.activeTopic && (
              <span className="text-[11px] text-slate-400 font-normal hidden sm:inline truncate max-w-[200px]">
                ({bank.activeTopic.name})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => onAssignHomework(bank.selectedQuestions, bank.activeTopic)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/30 active:scale-95 transition cursor-pointer whitespace-nowrap"
            >
              <Send size={13} />
              <span>{t('savedBank.btnAssignHomework', 'Giao Bài Tập')}</span>
            </button>

            <button
              type="button"
              onClick={() => onLaunchArena(bank.selectedQuestions, bank.activeTopic)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-indigo-600/30 active:scale-95 transition cursor-pointer whitespace-nowrap"
            >
              <Play size={13} />
              <span>{t('savedBank.btnLaunchArena', 'Kích Hoạt Đấu Trường')}</span>
            </button>

            <button
              type="button"
              onClick={() => onLoadIntoStudio(bank.selectedQuestions, bank.activeTopic)}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-medium transition cursor-pointer whitespace-nowrap"
              title={t('savedBank.btnOpenInStudio', 'Nạp vào Studio để sửa chi tiết')}
            >
              <Sparkles size={12} className="text-amber-400" />
              <span>{t('savedBank.openInStudio', 'Mở Trong Studio')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

