import React, { useState, useMemo, useEffect } from 'react';
import {
  FolderTree,
  Search,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Calendar,
  User,
  Globe,
  FolderPlus,
  Edit2,
  Trash2,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react';
import type { BankTopic } from '@/pages/admin/questions/types';
import type { HierarchicalTopicNode } from '@/shared/lib/quiz/topicTreeHelper';

interface ZenTopicTreePanelProps {
  roots: HierarchicalTopicNode[];
  allParentIds: Set<string>;
  totalTopicsCount: number;
  selectedTopicCode: string;
  topicSearch: string;
  onSearchChange: (val: string) => void;
  onSelectTopic: (code: string) => void;
  onOpenCreateRoot: () => void;
  onOpenCreateChild: (parentTopic: BankTopic) => void;
  onOpenEditTopic: (topic: BankTopic) => void;
  onDeleteTopic: (topic: BankTopic) => void;
}

const PROTECTED_ROOT_CODES = new Set(['STUDIO', 'COMMUNITY', 'GENERAL']);

export const ZenTopicTreePanel: React.FC<ZenTopicTreePanelProps> = ({
  roots,
  allParentIds,
  totalTopicsCount,
  selectedTopicCode,
  topicSearch,
  onSearchChange,
  onSelectTopic,
  onOpenCreateRoot,
  onOpenCreateChild,
  onOpenEditTopic,
  onDeleteTopic,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(allParentIds));

  // Tự động mở rộng các nhánh cha mới khi cây được tải hoặc cập nhật
  useEffect(() => {
    if (allParentIds.size > 0) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        allParentIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [allParentIds]);

  const { filteredRoots, searchExpandedIds } = useMemo(() => {
    const kw = topicSearch.trim().toLowerCase();
    if (!kw) return { filteredRoots: roots, searchExpandedIds: new Set<string>() };

    const autoExpand = new Set<string>();
    function filterNodes(nodes: HierarchicalTopicNode[]): HierarchicalTopicNode[] {
      const out: HierarchicalTopicNode[] = [];
      for (const n of nodes) {
        const selfMatch =
          n.name.toLowerCase().includes(kw) ||
          n.code.toLowerCase().includes(kw) ||
          (n.materializedPath || '').toLowerCase().includes(kw);
        const childMatches = filterNodes(n.children);
        if (selfMatch || childMatches.length > 0) {
          out.push({ ...n, children: childMatches });
          if (childMatches.length > 0) autoExpand.add(n.id);
        }
      }
      return out;
    }

    return { filteredRoots: filterNodes(roots), searchExpandedIds: autoExpand };
  }, [roots, topicSearch]);

  const isExpanded = (id: string) => expandedIds.has(id) || searchExpandedIds.has(id);

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedIds(new Set(allParentIds));
  const collapseAll = () => setExpandedIds(new Set());

  const flatVisibleNodes = useMemo(() => {
    const list: HierarchicalTopicNode[] = [];
    function walk(nodes: HierarchicalTopicNode[]) {
      for (const n of nodes) {
        list.push(n);
        if (n.children.length > 0 && isExpanded(n.id)) {
          walk(n.children);
        }
      }
    }
    walk(filteredRoots);
    return list;
  }, [filteredRoots, expandedIds, searchExpandedIds]);

  const renderNodeIcon = (node: HierarchicalTopicNode, expanded: boolean, isSelected: boolean) => {
    const code = node.code.toUpperCase();
    if (code === 'COMMUNITY' || code.startsWith('COM_')) {
      return <Globe size={14} className={isSelected ? 'text-amber-300' : 'text-emerald-400'} />;
    }
    if (code.startsWith('TP') && node.children.length === 0) {
      return <FileText size={14} className={isSelected ? 'text-amber-300' : 'text-sky-400'} />;
    }
    if (code.includes('CRT')) {
      return <User size={14} className={isSelected ? 'text-amber-300' : 'text-teal-400'} />;
    }
    if (/^STUDIO_\d{8}$/.test(code)) {
      return <Calendar size={14} className={isSelected ? 'text-amber-300' : 'text-amber-400'} />;
    }
    if (node.children.length > 0) {
      return expanded ? (
        <FolderOpen size={15} className="text-amber-400" />
      ) : (
        <Folder size={15} className="text-indigo-400" />
      );
    }
    return <FileText size={14} className="text-slate-400" />;
  };

  return (
    <div className="lg:col-span-5 rounded-2xl bg-slate-900/80 border border-slate-800 p-3.5 flex flex-col h-[540px]">
      {/* Header + Actions */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
          <FolderTree size={14} className="text-amber-400 shrink-0" />
          <span>Cây Chủ Đề Phân Cấp ({totalTopicsCount})</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={expandedIds.size > 0 ? collapseAll : expandAll}
            title={expandedIds.size > 0 ? 'Thu gọn toàn bộ nhánh' : 'Mở rộng toàn bộ nhánh'}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
          >
            {expandedIds.size > 0 ? <ChevronsDownUp size={13} /> : <ChevronsUpDown size={13} />}
          </button>
          <button
            type="button"
            onClick={onOpenCreateRoot}
            title="Tạo thư mục / chủ đề gốc mới"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition cursor-pointer"
          >
            <FolderPlus size={12} />
            <span>+ Tạo Nhánh</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-2.5">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={topicSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm nhánh chủ đề, mã đề hoặc đường dẫn..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Hierarchical Tree View */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {flatVisibleNodes.map((node) => {
          const isSelected = node.code === selectedTopicCode;
          const hasChildren = node.children.length > 0;
          const expanded = isExpanded(node.id);
          const isProtected = PROTECTED_ROOT_CODES.has(node.code.toUpperCase());

          return (
            <div
              key={node.id}
              style={{ paddingLeft: `${node.level * 14}px` }}
              className="relative group"
            >
              {node.level > 0 && (
                <span
                  className="absolute top-0 bottom-0 border-l border-slate-800/80 pointer-events-none"
                  style={{ left: `${(node.level - 1) * 14 + 11}px` }}
                />
              )}

              <div
                onClick={() => onSelectTopic(node.code)}
                className={`w-full text-left px-2.5 py-2 rounded-xl border transition flex items-center justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800/70 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(e, node.id)}
                      className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-slate-700/70 text-slate-400 hover:text-white shrink-0 cursor-pointer"
                    >
                      {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center text-slate-700 text-[10px] shrink-0">
                      └
                    </span>
                  )}

                  <span className="shrink-0">{renderNodeIcon(node, expanded, isSelected)}</span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold truncate" title={node.name}>
                        {node.name}
                      </p>
                      {hasChildren && (
                        <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 text-[9px] font-mono font-bold shrink-0">
                          {node.children.length} nhánh
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-mono text-amber-400/90">{node.code}</span>
                      <span className="text-[10px] text-slate-600">&bull;</span>
                      <span
                        className={`text-[10px] font-mono font-semibold ${
                          node.totalQuestionCount > 0 ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {node.totalQuestionCount} câu
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Tree Node Actions (Create Child, Edit, Delete) */}
                <div
                  className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onOpenCreateChild(node)}
                    title={`Tạo chủ đề con trong "${node.name}"`}
                    className="p-1 rounded-md hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 transition cursor-pointer"
                  >
                    <FolderPlus size={12} />
                  </button>
                  {!isProtected && (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenEditTopic(node)}
                        title="Đổi tên hoặc chuyển nhánh cha"
                        className="p-1 rounded-md hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition cursor-pointer"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTopic(node)}
                        title="Xóa nhánh chủ đề"
                        className="p-1 rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 size={11} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {flatVisibleNodes.length === 0 && (
          <div className="text-center py-12 text-xs text-slate-500 space-y-2">
            <p>Chưa có chủ đề nào phù hợp.</p>
            <button
              type="button"
              onClick={onOpenCreateRoot}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold cursor-pointer"
            >
              <FolderPlus size={13} />
              <span>Tạo Chủ Đề Đầu Tiên</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

