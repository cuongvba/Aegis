import React, { useState, useMemo } from 'react';
import { ListTree, TableProperties } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { BankTopic } from '../types';
import { TopicTreeTable } from './TopicTreeTable';
import { buildHierarchicalTopicTree } from '@/shared/lib/quiz/topicTreeHelper';
import { TopicSocialMetricsPill } from '@/pages/creator/topics/components/TopicSocialMetricsPill';
import { TopicActionButtons } from './TopicActionButtons';

interface TopicTableSectionProps {
  topics: BankTopic[];
  questions?: Array<{ categoryCode?: string }>;
  pagedTopics: BankTopic[];
  filteredTopics: BankTopic[];
  tSearch: string;
  setTSearch: (s: string) => void;
  tPage: number;
  setTPage: (p: number) => void;
  tPageSize: number;
  tTotalPages: number;
  tSortField: string;
  setTSortField: (f: string) => void;
  tSortAsc: boolean;
  setTSortAsc: (a: boolean) => void;
  hasWritePermission: boolean;
  openEditTopicModal: (topic: BankTopic) => void;
  openAddChildTopicModal?: (parentId: string) => void;
  onOpenQuestions?: (topic: BankTopic) => void;
  handleToggleActiveTopic?: (topic: BankTopic) => void;
  handleDeleteTopic?: (id: string) => void;
  onAssignHomework?: (topic: BankTopic) => void;
  onLaunchArena?: (topic: BankTopic) => void;
  onExportDocx?: (topic: BankTopic) => void;
  renderSortIcon: (field: string, currentField: string, isAsc: boolean) => React.ReactNode;
  Pagination: React.ComponentType<{ page: number; totalPages: number; onChange: (p: number) => void }>;
}

export const TopicTableSection: React.FC<TopicTableSectionProps> = ({
  topics,
  questions = [],
  pagedTopics,
  filteredTopics,
  tSearch,
  setTSearch,
  tPage,
  setTPage,
  tPageSize,
  tTotalPages,
  tSortField,
  setTSortField,
  tSortAsc,
  setTSortAsc,
  hasWritePermission,
  openEditTopicModal,
  openAddChildTopicModal = () => {},
  onOpenQuestions,
  handleToggleActiveTopic,
  handleDeleteTopic,
  onAssignHomework,
  onLaunchArena,
  onExportDocx,
  renderSortIcon,
  Pagination,
}) => {
  const { t } = useTranslation('admin_questions');
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');

  const questionCountsByTopic = useMemo(() => {
    const { nodeByCode } = buildHierarchicalTopicTree(topics, questions as any[]);
    const map: Record<string, number> = {};
    nodeByCode.forEach((node) => { map[node.code] = node.totalQuestionCount; });
    return map;
  }, [topics, questions]);

  const handleSort = (field: string) => {
    if (tSortField === field) setTSortAsc(!tSortAsc);
    else { setTSortField(field); setTSortAsc(true); }
  };

  return (
    <div>
      {/* Search & View Mode Switcher Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-850 bg-slate-900/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:max-w-md space-y-1">
          <input
            type="text"
            placeholder={t('filters.searchTopicPlaceholder') || 'Tìm theo tên, mã hoặc đường dẫn phả hệ...'}
            value={tSearch}
            onChange={(e) => setTSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:border-indigo-500 shadow-inner"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-end md:self-center">
          <button
            type="button"
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'tree' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ListTree size={14} />
            <span>Phân Cấp Cây</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('flat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'flat' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TableProperties size={14} />
            <span>Bảng Phẳng</span>
          </button>
        </div>
      </div>

      {viewMode === 'tree' ? (
        <TopicTreeTable
          topics={topics}
          questions={questions as any[]}
          searchKeyword={tSearch}
          questionCountsByTopic={questionCountsByTopic}
          hasWritePermission={hasWritePermission}
          onOpenEdit={openEditTopicModal}
          onOpenAddChild={openAddChildTopicModal}
          onOpenQuestions={onOpenQuestions}
          onToggleActive={handleToggleActiveTopic}
          onDelete={handleDeleteTopic}
          onAssignHomework={onAssignHomework}
          onLaunchArena={onLaunchArena}
          onExportDocx={onExportDocx}
        />
      ) : (
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-black tracking-wider uppercase text-slate-400 bg-slate-900/80 select-none">
                <th className="p-4 w-32 cursor-pointer hover:bg-slate-850/50 hover:text-white group transition-colors" onClick={() => handleSort('code')}>
                  <div className="flex items-center">{t('table.topicCode')} {renderSortIcon('code', tSortField, tSortAsc)}</div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-slate-850/50 hover:text-white group transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center">{t('table.topicName')} {renderSortIcon('name', tSortField, tSortAsc)}</div>
                </th>
                <th className="p-4"><div className="flex items-center text-slate-400">{t('table.path')}</div></th>
                <th className="p-4 cursor-pointer hover:bg-slate-850/50 hover:text-white group transition-colors" onClick={() => handleSort('description')}>
                  <div className="flex items-center">{t('table.description')} {renderSortIcon('description', tSortField, tSortAsc)}</div>
                </th>
                <th className="p-4 w-32 cursor-pointer hover:bg-slate-850/50 hover:text-white group transition-colors" onClick={() => handleSort('visibilityScope')}>
                  <div className="flex items-center">{t('table.visibilityScope')} {renderSortIcon('visibilityScope', tSortField, tSortAsc)}</div>
                </th>
                <th className="p-4 w-24 text-right sticky right-0 bg-slate-900 z-10 border-l border-slate-800 shadow-[-4px_0_8px_rgba(0,0,0,0.15)]">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pagedTopics.map((topicItem: BankTopic, idx: number) => (
                <tr key={topicItem.id || idx} className="border-b border-slate-850/60 hover:bg-slate-800/10 transition-colors">
                  <td className="p-4 font-mono text-xs font-black text-cyan-400 select-all">{topicItem.code}</td>
                  <td className="p-4 font-bold text-slate-200 text-sm">
                    <div>{topicItem.name}</div>
                    <div className="mt-1">
                      <TopicSocialMetricsPill topic={topicItem} compact />
                    </div>
                  </td>
                  <td className="p-4 text-xs text-slate-300">
                    <span className="font-mono text-[11px] text-cyan-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                      {topicItem.materializedPath || `/${topicItem.code}/`}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-400 leading-relaxed max-w-xs truncate">{topicItem.description || '_'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase border ${
                      topicItem.visibilityScope === 'PUBLIC'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    }`}>
                      {topicItem.visibilityScope}
                    </span>
                  </td>
                  <td className="p-4 text-right sticky right-0 bg-slate-900/95 z-10 border-l border-slate-850/60 shadow-[-4px_0_8px_rgba(0,0,0,0.15)]">
                    <TopicActionButtons
                      topic={topicItem}
                      questionCount={questionCountsByTopic[topicItem.code] || 0}
                      hasWritePermission={hasWritePermission}
                      onOpenQuestions={onOpenQuestions}
                      openEditModal={openEditTopicModal}
                      onAssignHomework={onAssignHomework}
                      onLaunchArena={onLaunchArena}
                      onExportDocx={onExportDocx}
                      handleToggleActive={handleToggleActiveTopic}
                      handleDelete={handleDeleteTopic}
                    />
                  </td>
                </tr>
              ))}
              {pagedTopics.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-20 text-slate-500 text-xs font-bold">
                    {t('table.noTopicsFound')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="p-4 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/10">
            <span className="text-xs text-slate-400 font-semibold">
              {t('table.paginationDisplay', {
                from: filteredTopics.length > 0 ? (tPage - 1) * tPageSize + 1 : 0,
                to: Math.min(tPage * tPageSize, filteredTopics.length),
                total: filteredTopics.length,
              })}
            </span>
            <Pagination page={tPage} totalPages={tTotalPages} onChange={setTPage} />
          </div>
        </div>
      )}
    </div>
  );
};
