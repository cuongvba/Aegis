import React from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Globe2,
  Building2,
  CheckSquare,
  Square,
  BookOpen,
  GraduationCap,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type {
  CognitiveTopicNodeDto,
  PracticeTopicConfig,
} from '@/types/quiz';

interface TopicTreeNodeProps {
  node: CognitiveTopicNodeDto;
  isExpanded: boolean;
  onToggleExpand: (code: string) => void;
  selStatus: { all: boolean; some: boolean };
  selectedConfig?: PracticeTopicConfig;
  onSelectTree: (node: CognitiveTopicNodeDto, select: boolean) => void;
  onUpdateConfig: (topicKey: string, patch: Partial<PracticeTopicConfig>) => void;
  childrenNodes?: React.ReactNode;
  t?: (key: string) => string;
}

const getBadgeStyle = (code: string) => {
  const c = code.toUpperCase();
  if (c.includes('MATH') || c.includes('TOAN')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  if (c.includes('KHTN') || c.includes('PHYS') || c.includes('CHEM') || c.includes('BIO')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  if (c.includes('TIENG_ANH') || c.includes('LANG_EN') || c.includes('ENG')) return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
  if (c.includes('TIN_HOC') || c.includes('CS') || c.includes('IT')) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
  if (c.startsWith('K0') || c.startsWith('K1') || c.includes('LOP')) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  return 'bg-slate-800 text-slate-300 border-slate-700';
};

const getNodeIcon = (node: CognitiveTopicNodeDto, hasChildren: boolean, isExpanded: boolean) => {
  const c = node.code.toUpperCase();
  if (c.startsWith('K0') || c.startsWith('K1')) {
    return <GraduationCap className="h-4.5 w-4.5 text-amber-400 shrink-0" />;
  }
  if (c.includes('HK1') || c.includes('HK2')) {
    return <Calendar className="h-4.5 w-4.5 text-orange-400 shrink-0" />;
  }
  if (hasChildren) {
    return isExpanded ? (
      <FolderOpen className="h-4.5 w-4.5 text-sky-400 shrink-0" />
    ) : (
      <Folder className="h-4.5 w-4.5 text-slate-400 shrink-0" />
    );
  }
  return <BookOpen className="h-4.5 w-4.5 text-cyan-400 shrink-0" />;
};

export const TopicTreeNode: React.FC<TopicTreeNodeProps> = ({
  node,
  isExpanded,
  onToggleExpand,
  selStatus,
  selectedConfig,
  onSelectTree,
  onUpdateConfig,
  childrenNodes,
  t,
}) => {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isSelected = selStatus.all || selStatus.some;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'border-cyan-500/60 bg-gradient-to-r from-cyan-950/30 via-slate-900/90 to-indigo-950/20 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/20'
          : 'border-slate-800/80 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900/90'
      }`}
    >
      {/* Node Header Row */}
      <div className="flex items-center justify-between p-3.5 gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggleExpand(node.code)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-7 shrink-0 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            </div>
          )}

          {/* Checkbox select */}
          <button
            type="button"
            onClick={() => onSelectTree(node, !selStatus.all)}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <span className="shrink-0">
              {selStatus.all ? (
                <CheckSquare className="h-5 w-5 text-cyan-400" />
              ) : selStatus.some ? (
                <span className="flex h-5 w-5 items-center justify-center rounded border-2 border-cyan-500 bg-cyan-600 text-white text-[10px] font-black">
                  -
                </span>
              ) : (
                <Square className="h-5 w-5 text-slate-500 group-hover:text-slate-400" />
              )}
            </span>

            {getNodeIcon(node, hasChildren, isExpanded)}
          </button>

          {/* Title & Metadata */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-bold cursor-pointer transition-colors ${
                  isSelected ? 'text-white' : 'text-slate-200 hover:text-cyan-300'
                }`}
                onClick={() => (hasChildren ? onToggleExpand(node.code) : onSelectTree(node, !selStatus.all))}
              >
                {node.name}
              </span>

              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold ${getBadgeStyle(node.code)}`}>
                {node.code}
              </span>

              {node.scope === 'COMMUNITY' ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                  <Globe2 className="h-2.5 w-2.5" /> Cộng đồng
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                  <Building2 className="h-2.5 w-2.5" /> Doanh nghiệp
                </span>
              )}

              {hasChildren && (
                <span className="rounded-md bg-sky-950/60 px-2 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-500/30">
                  {(node.children || []).length} mục con
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span className="font-semibold text-cyan-300">
                {(node.questionCount ?? 0).toLocaleString()} câu hỏi khả dụng
              </span>
            </div>
          </div>
        </div>

        {/* 1-touch select button for parent folders */}
        {hasChildren && (
          <button
            type="button"
            onClick={() => onSelectTree(node, !selStatus.all)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition border cursor-pointer ${
              selStatus.all
                ? 'bg-rose-950/60 text-rose-300 border-rose-500/40 hover:bg-rose-900/80'
                : 'bg-cyan-950/50 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/70'
            }`}
          >
            {selStatus.all ? 'Bỏ chọn cả cây' : '1-Chạm Chọn Hết'}
          </button>
        )}
      </div>

      {/* Inline Configuration for selected leaf */}
      {!hasChildren && selectedConfig && (
        <div className="border-t border-slate-800/80 bg-slate-950/80 p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium">Số câu ôn tập:</span>
            <div className="flex items-center gap-1.5">
              {[10, 20, 40].map((presetNum) => (
                <button
                  key={presetNum}
                  type="button"
                  onClick={() => onUpdateConfig(node.code, { numberOfQuestions: presetNum })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedConfig.numberOfQuestions === presetNum
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {presetNum}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={Math.max(1, node.questionCount || 100)}
                value={selectedConfig.numberOfQuestions}
                onChange={(e) => onUpdateConfig(node.code, { numberOfQuestions: Math.max(1, Number(e.target.value) || 1) })}
                className="w-16 h-7 rounded-lg border border-slate-700 bg-slate-900 px-2 text-white text-center font-bold focus:border-cyan-500 focus:outline-hidden"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedConfig.isRandom}
              onChange={(e) => onUpdateConfig(node.code, { isRandom: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
            />
            <span className="font-medium">Xáo trộn câu hỏi</span>
          </label>
        </div>
      )}

      {/* Children Container */}
      {hasChildren && isExpanded && childrenNodes && (
        <div className="border-t border-slate-800/80 p-3.5 pl-6 space-y-2.5 bg-slate-950/40">
          {childrenNodes}
        </div>
      )}
    </div>
  );
};
