import React from 'react';
import { Check, Users, FileText } from 'lucide-react';
import type { QuestionType, LearnerQuestion } from '@/types/quiz';
import { LETTERS, getCorrectAnswerPlaceholder, type BankTopic, isOptionSelectedAsCorrect, getTopicFullPath } from '../../types';
import { parseMultiTfAnswer, serializeMultiTfAnswer, serializeMultiTfVector, convertMultiToMultiTf, convertMultiTfToMulti } from '@/shared/lib/quiz/normalizers';
import type { UserProfile } from '@/types/auth';

interface QuestionConfigSectionProps {
  questionType: QuestionType;
  setQuestionType: (v: QuestionType) => void;
  correctAnswer: string;
  setCorrectAnswer: (v: string) => void;
  options: string[];
  contentType: string;
  setContentType: (v: string) => void;
  optionType: string;
  setOptionType: (v: string) => void;
  categoryCode: string;
  setCategoryCode: (v: string) => void;
  topics: BankTopic[];
  difficulty: number;
  setDifficulty: (v: number) => void;
  durationSeconds: number;
  setDurationSeconds: (v: number) => void;
  scope: 'COMMUNITY' | 'TENANT' | 'TEAM' | 'PERSONAL';
  setScope?: (v: 'COMMUNITY' | 'TENANT' | 'TEAM' | 'PERSONAL') => void;
  currentUser?: UserProfile | null;
  activeQuestion?: LearnerQuestion;
  isEditing: boolean;
}

export const QuestionConfigSection: React.FC<QuestionConfigSectionProps> = ({
  questionType,
  setQuestionType,
  correctAnswer,
  setCorrectAnswer,
  options,
  contentType,
  setContentType,
  optionType,
  setOptionType,
  categoryCode,
  setCategoryCode,
  topics,
  difficulty,
  setDifficulty,
  durationSeconds,
  setDurationSeconds,
  scope,
  setScope,
  currentUser,
  activeQuestion,
  isEditing,
}) => {
  const hasOptions =
    questionType === 'SINGLE' ||
    questionType === 'MULTI' ||
    questionType === 'ORDERING' ||
    questionType === 'MATCHING' ||
    questionType === 'MULTI_TRUE_FALSE';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Loại câu hỏi
          </label>
          <select
            value={questionType}
            onChange={e => {
              const newType = e.target.value as QuestionType;
              const oldType = questionType;
              if (newType === 'MULTI_TRUE_FALSE' && oldType !== 'MULTI_TRUE_FALSE') {
                setCorrectAnswer(convertMultiToMultiTf(correctAnswer, options.length));
              } else if (oldType === 'MULTI_TRUE_FALSE' && (newType === 'MULTI' || newType === 'SINGLE')) {
                setCorrectAnswer(convertMultiTfToMulti(correctAnswer));
              }
              setQuestionType(newType);
            }}
            disabled={!isEditing}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            <option value="SINGLE">Trắc nghiệm 1 đáp án</option>
            <option value="MULTI">Nhiều đáp án đúng</option>
            <option value="TRUE_FALSE">Đúng / Sai</option>
            <option value="MULTI_TRUE_FALSE">Đúng / Sai 4 ý (GDPT 2025)</option>
            <option value="SHORT_ANSWER">Trả lời ngắn</option>
            <option value="FILL_BLANK">Điền vào chỗ trống</option>
            <option value="ORDERING">Sắp xếp thứ tự</option>
            <option value="MATCHING">Nối cặp</option>
            <option value="ESSAY">Tự luận (AI chấm)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Đáp án chính xác
          </label>
          {questionType === 'TRUE_FALSE' ? (
            <div className="flex gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setCorrectAnswer('1')}
                disabled={!isEditing}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                  correctAnswer === '1'
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                Đúng (1)
              </button>
              <button
                type="button"
                onClick={() => setCorrectAnswer('2')}
                disabled={!isEditing}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                  correctAnswer === '2'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-400'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                Sai (2)
              </button>
            </div>
          ) : questionType === 'MULTI_TRUE_FALSE' ? (
            <div className="space-y-1.5 p-2 bg-slate-950/90 border border-slate-800 rounded-xl">
              <div className="text-[10px] text-cyan-400 uppercase font-black flex items-center justify-between">
                <span>Ma trận Đúng/Sai:</span>
                <span className="font-mono text-amber-400">
                  {serializeMultiTfVector(parseMultiTfAnswer(correctAnswer))}
                </span>
              </div>
              {['a', 'b', 'c', 'd'].map((letter, i) => {
                const currentMap = parseMultiTfAnswer(correctAnswer);
                const userVal = currentMap[letter];
                return (
                  <div key={letter} className="flex items-center justify-between gap-1.5 text-xs">
                    <span className="font-bold text-purple-400 font-mono w-4">{letter})</span>
                    <span className="truncate flex-1 text-slate-300 text-[11px]">{options[i] || `(Mệnh đề ${letter})`}</span>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={!isEditing}
                        onClick={() => {
                          const next = { ...currentMap, [letter]: true };
                          setCorrectAnswer(serializeMultiTfAnswer(next));
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          userVal === true ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Đ
                      </button>
                      <button
                        type="button"
                        disabled={!isEditing}
                        onClick={() => {
                          const next = { ...currentMap, [letter]: false };
                          setCorrectAnswer(serializeMultiTfAnswer(next));
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          userVal === false ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        S
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : questionType === 'SINGLE' || questionType === 'MULTI' ? (
            <div className="space-y-1.5">
              {isEditing && questionType === 'SINGLE' && (
                <select
                  value={(() => {
                    const idx = options.findIndex((opt, i) => isOptionSelectedAsCorrect(opt, i, correctAnswer, 'SINGLE', options));
                    return idx !== -1 ? String(idx + 1) : '';
                  })()}
                  onChange={e => setCorrectAnswer(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-emerald-300 focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  <option value="">-- Chọn phương án đúng --</option>
                  {options.map((opt, i) => (
                    <option key={i} value={String(i + 1)}>
                      Phương án {LETTERS[i]} ({i + 1}): {opt ? (opt.length > 30 ? opt.slice(0, 30) + '...' : opt) : `(Phương án ${LETTERS[i]})`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <input
              type="text"
              required={questionType !== 'ESSAY'}
              placeholder={getCorrectAnswerPlaceholder(questionType)}
              value={correctAnswer}
              onChange={e => setCorrectAnswer(e.target.value)}
              disabled={!isEditing}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-75"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chủ đề phân nhóm</label>
          {topics.length > 0 ? (
            <select
              value={categoryCode}
              onChange={e => setCategoryCode(e.target.value)}
              disabled={!isEditing}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-75"
            >
              {topics.map(t => (
                <option key={t.code} value={t.code}>
                  {getTopicFullPath(t, topics)} ({t.code})
                </option>
              ))}
            </select>
          ) : (
            <div className="text-xs text-amber-500 p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 font-bold">
              Cần tạo Chủ đề trước!
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Độ khó (1-5)</label>
            <input
              type="number"
              min={1}
              max={5}
              required
              value={difficulty}
              onChange={e => setDifficulty(Number(e.target.value))}
              disabled={!isEditing}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-75"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thời gian (s)</label>
            <input
              type="number"
              min={10}
              required
              value={durationSeconds}
              onChange={e => setDurationSeconds(Number(e.target.value))}
              disabled={!isEditing}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-75"
            />
          </div>
        </div>
      </div>

      {/* Phạm vi sở hữu & Phân quyền */}
      <div className="space-y-1.5 p-3 bg-slate-950/40 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users size={12} className="text-amber-400" /> Phạm vi sở hữu
          </label>
        </div>
        <select
          value={scope}
          onChange={e => setScope?.(e.target.value as any)}
          disabled={!isEditing}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer disabled:opacity-75"
        >
          {currentUser?.role === 'TeamLeader' ? (
            <>
              <option value="TEAM">👥 Nhóm nội bộ ({currentUser?.orgUnitName || 'Đơn vị của tôi'})</option>
              <option value="PERSONAL">👤 Cá nhân (Chỉ tôi nhìn thấy)</option>
            </>
          ) : (
            <>
              <option value="COMMUNITY">🌐 Toàn cơ quan / Hệ thống</option>
              <option value="TEAM">👥 Cấp Nhóm / Đơn vị nội bộ</option>
              <option value="PERSONAL">👤 Cá nhân riêng tư</option>
            </>
          )}
        </select>
      </div>
    </div>
  );
};

