import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, BookOpen, ShieldAlert, Sparkles, FileText, Check, Settings2, Clock, Shuffle, Timer, Loader2 } from 'lucide-react';
import { ZenHomeworkConfig, ZenPracticeMode } from '../types/zen-homework.types';

interface ZenHomeworkConfigModalProps {
  initialConfig: ZenHomeworkConfig;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (config: ZenHomeworkConfig) => void;
}

export const ZenHomeworkConfigModal: React.FC<ZenHomeworkConfigModalProps> = ({
  initialConfig, isOpen, isLoading, onClose, onConfirm,
}) => {
  const { t } = useTranslation('creator');
  const [config, setConfig] = useState<ZenHomeworkConfig>(initialConfig);

  if (!isOpen) return null;

  const MODES: { id: ZenPracticeMode; icon: React.FC<any>; labelKey: string; descKey: string; color: string }[] = [
    { id: 'study', icon: BookOpen, labelKey: 'homeworkConfig.modeStudy', descKey: 'homeworkConfig.modeStudyDesc', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400' },
    { id: 'exam', icon: ShieldAlert, labelKey: 'homeworkConfig.modeExam', descKey: 'homeworkConfig.modeExamDesc', color: 'from-amber-500/20 to-rose-500/20 border-amber-500/40 text-amber-400' },
    { id: 'kids', icon: Sparkles, labelKey: 'homeworkConfig.modeKids', descKey: 'homeworkConfig.modeKidsDesc', color: 'from-pink-500/20 to-purple-500/20 border-pink-500/40 text-pink-400' },
    { id: 'paper', icon: FileText, labelKey: 'homeworkConfig.modePaper', descKey: 'homeworkConfig.modePaperDesc', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/40 text-blue-400' },
  ];

  const TIME_OPTIONS = [0, 15, 30, 45, 60, 90];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-emerald-500/30 p-5 sm:p-6 shadow-2xl text-left my-auto space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t('homeworkConfig.title')}</h3>
              <p className="text-xs text-slate-400">{t('homeworkConfig.subtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isLoading} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Chọn chế độ làm bài */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-2">
            {t('homeworkConfig.modeTitle')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MODES.map((m) => {
              const Icon = m.icon;
              const isSelected = config.mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setConfig({ ...config, mode: m.id })}
                  className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? `bg-gradient-to-br ${m.color} shadow-lg shadow-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400/50`
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-2 font-bold text-xs text-white">
                      <Icon className="w-4 h-4 shrink-0 text-emerald-400" />
                      {t(m.labelKey)}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <span className="text-[11px] text-slate-400 leading-tight">{t(m.descKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Thời lượng làm bài */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {t('homeworkConfig.timeTitle')}
            </label>
            <span className="text-xs font-mono font-bold text-emerald-300">
              {config.timeLimitMin === 0 ? t('homeworkConfig.timeUnlimited') : `${config.timeLimitMin} phút`}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TIME_OPTIONS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setConfig({ ...config, timeLimitMin: mins })}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  config.timeLimitMin === mins
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {mins === 0 ? t('homeworkConfig.timeUnlimited') : `${mins}'`}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Tùy chọn nâng cao */}
        <div className="pt-2 border-t border-slate-800 space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Shuffle className="w-3.5 h-3.5" />
            {t('homeworkConfig.advancedTitle')}
          </label>
          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-950">
              <div>
                <p className="font-semibold text-slate-200">{t('homeworkConfig.shuffleOptions')}</p>
                <p className="text-[10px] text-slate-500">{t('homeworkConfig.shuffleOptionsHint')}</p>
              </div>
              <input
                type="checkbox"
                checked={config.shuffleOptions}
                onChange={(e) => setConfig({ ...config, shuffleOptions: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 border-slate-700 bg-slate-900"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-950">
              <div>
                <p className="font-semibold text-slate-200">{t('homeworkConfig.shuffleQuestions')}</p>
                <p className="text-[10px] text-slate-500">{t('homeworkConfig.shuffleQuestionsHint')}</p>
              </div>
              <input
                type="checkbox"
                checked={config.shuffleQuestions}
                onChange={(e) => setConfig({ ...config, shuffleQuestions: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 border-slate-700 bg-slate-900"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-950">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-emerald-400" />
                <p className="font-semibold text-slate-200">{t('homeworkConfig.enableQuestionTimer')}</p>
              </div>
              <input
                type="checkbox"
                checked={config.enableQuestionTimer}
                onChange={(e) => setConfig({ ...config, enableQuestionTimer: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 border-slate-700 bg-slate-900"
              />
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {t('homeworkConfig.cancel')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(config)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{t('homeworkConfig.saveAndAssignBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

