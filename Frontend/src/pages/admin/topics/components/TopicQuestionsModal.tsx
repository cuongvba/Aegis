import React, { useState, useMemo } from 'react';
import { X, Search, HelpCircle, CheckCircle2, BookOpen, ExternalLink, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MathRenderer } from '@/components/common/MathRenderer';
import {
  doesQuestionMatchTopicCode,
  getQuestionsForTopicSubtree,
} from '@/shared/lib/quiz/topicTreeHelper';
import type { BankTopic } from '../../questions/types';
import type { LearnerQuestion } from '@/types/quiz';

interface TopicQuestionsModalProps {
  isOpen: boolean;
  topic: BankTopic | null;
  questions: LearnerQuestion[];
  allTopics?: BankTopic[];
  questionBankBasePath?: string;
  onClose: () => void;
}

export const TopicQuestionsModal: React.FC<TopicQuestionsModalProps> = ({
  isOpen,
  topic,
  questions,
  allTopics = [],
  questionBankBasePath = '/admin/questions',
  onClose,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [includeDescendants, setIncludeDescendants] = useState(true);

  // Lọc danh sách câu hỏi thuộc chủ đề hoặc toàn bộ nhánh con cháu (Roll-up Subtree)
  const topicQuestions = useMemo(() => {
    if (!topic) return [];
    if (includeDescendants) {
      return getQuestionsForTopicSubtree(topic.code, allTopics.length > 0 ? allTopics : [topic], questions);
    }
    return questions.filter((q) => doesQuestionMatchTopicCode(q, topic.code));
  }, [questions, topic, includeDescendants, allTopics]);

  // Lọc theo từ khóa tìm kiếm
  const filteredQuestions = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return topicQuestions;
    return topicQuestions.filter(q =>
      (q.content || '').toLowerCase().includes(kw) ||
      (q.citation || '').toLowerCase().includes(kw) ||
      (q.options || []).some(opt => opt.toLowerCase().includes(kw))
    );
  }, [topicQuestions, search]);

  if (!isOpen || !topic) return null;

  const handleOpenInQuestionBank = () => {
    onClose();
    navigate(`${questionBankBasePath}?topicCode=${encodeURIComponent(topic.code)}`);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[70] flex items-center justify-center p-3 sm:p-5 animate-in fade-in">
      <div className="w-full max-w-4xl bg-slate-900 border border-sky-500/30 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
              <HelpCircle size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-sky-400 uppercase bg-sky-950/80 border border-sky-800/40 px-2 py-0.5 rounded-full font-mono">
                  {topic.code}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700/60">
                  {topicQuestions.length} câu hỏi
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                {topic.name}
              </h2>
              <p className="text-xs font-mono text-slate-400 mt-0.5 truncate max-w-xl">
                Đường dẫn: {topic.materializedPath || `/${topic.code}/`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Đóng modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Thanh tìm kiếm & bộ lọc */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm câu hỏi theo nội dung, đáp án..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIncludeDescendants(!includeDescendants)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold border transition cursor-pointer text-xs ${
                includeDescendants
                  ? 'bg-sky-950/60 text-sky-300 border-sky-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Layers size={13} />
              <span>Gồm chủ đề con</span>
            </button>

            <button
              type="button"
              onClick={handleOpenInQuestionBank}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer text-xs"
            >
              <span>Mở trong Ngân Hàng</span>
              <ExternalLink size={12} className="text-sky-400" />
            </button>
          </div>
        </div>

        {/* Danh sách câu hỏi */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {filteredQuestions.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <HelpCircle size={36} className="mx-auto text-slate-600 opacity-60" />
              <p className="text-xs font-bold text-slate-400">Không tìm thấy câu hỏi nào thuộc chủ đề này.</p>
              <p className="text-[11px] text-slate-500">Thầy/Cô có thể nhập đề thi từ Creator Zen Studio hoặc soạn mới trong Ngân hàng câu hỏi.</p>
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const correctRaw = (q.answerRaw || '').trim().toUpperCase();
              return (
                <div
                  key={q.id || idx}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-sky-500/30 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/50">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-300 text-[11px] bg-slate-800/60 px-2 py-0.5 rounded">
                        {q.questionType}
                      </span>
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Độ khó: {q.difficulty}/5
                      </span>
                    </div>
                    {q.topicCode && (
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {q.topicCode}
                      </span>
                    )}
                  </div>

                  {/* Nội dung câu hỏi */}
                  <div className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed">
                    <MathRenderer content={q.content || ''} />
                  </div>

                  {/* Danh sách đáp án */}
                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      {q.options.map((opt, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx);
                        const isCorrect = correctRaw === letter || correctRaw.includes(letter) || opt.trim() === correctRaw;
                        return (
                          <div
                            key={oIdx}
                            className={`flex items-start gap-2 p-2.5 rounded-xl border transition ${
                              isCorrect
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 font-bold'
                                : 'bg-slate-900/60 border-slate-800/60 text-slate-300'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {letter}
                            </span>
                            <span className="flex-1 leading-snug">
                              <MathRenderer content={opt || ''} />
                            </span>
                            {isCorrect && <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Lời giải thích / Trích dẫn */}
                  {q.citation && (
                    <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-start gap-1.5">
                      <BookOpen size={12} className="text-sky-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold text-slate-300">Lời giải / Gợi ý: </span>
                        <MathRenderer content={q.citation} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            Hiển thị <span className="font-bold text-white">{filteredQuestions.length}</span> câu hỏi
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

