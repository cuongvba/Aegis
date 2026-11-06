import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight, ChevronDown, Folder, FolderOpen, FileText,
  Calendar, User, Eye, ToggleLeft, ToggleRight, Trash2, FolderPlus, HelpCircle, Send, Play
} from 'lucide-react';
import type { BankTopic } from '../types';

export interface TopicTreeNode extends BankTopic {
  children: TopicTreeNode[];
  level: number;
}

interface TopicTreeTableProps {
  topics: BankTopic[];
  searchKeyword: string;
  questionCountsByTopic: Record<string, number>;
  hasWritePermission: boolean;
  onOpenEdit: (topic: BankTopic) => void;
  onOpenAddChild: (parentTopicId: string) => void;
  onOpenQuestions?: (topic: BankTopic) => void;
  onToggleActive?: (topic: BankTopic) => void;
  onDelete?: (id: string) => void;
  onAssignHomework?: (topic: BankTopic) => void;
  onLaunchArena?: (topic: BankTopic) => void;
  onExportDocx?: (topic: BankTopic) => void;
}

export const TopicTreeTable: React.FC<TopicTreeTableProps> = ({
  topics,
  searchKeyword,
  questionCountsByTopic,
  hasWritePermission,
  onOpenEdit,
  onOpenAddChild,
  onOpenQuestions,
  onToggleActive,
  onDelete,
  onAssignHomework,
  onLaunchArena,
  onExportDocx,
}) => {
  const { t } = useTranslation('admin_questions');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  // 1. Xây dựng cấu trúc Cây (Tree Hierarchy)
  const { tree, allParentIds } = useMemo(() => {
    const map = new Map<string, TopicTreeNode>();
    const roots: TopicTreeNode[] = [];
    const parentSet = new Set<string>();

    topics.forEach((top) => {
      map.set(top.id, { ...top, children: [], level: 0 });
    });

    topics.forEach((top) => {
      const node = map.get(top.id)!;
      if (top.parentId && map.has(top.parentId)) {
        const parent = map.get(top.parentId)!;
        node.level = parent.level + 1;
        parent.children.push(node);
        parentSet.add(parent.id);
      } else {
        roots.push(node);
      }
    });

    return { tree: roots, allParentIds: parentSet };
  }, [topics]);

  // 2. Tìm kiếm thông minh: Lọc và tự động mở các nhánh cha khớp từ khóa
  const { filteredTree, autoExpandedIds } = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    if (!kw) return { filteredTree: tree, autoExpandedIds: new Set<string>() };

    const matchingExpanded = new Set<string>();

    function filterNodes(nodes: TopicTreeNode[]): TopicTreeNode[] {
      const result: TopicTreeNode[] = [];
      nodes.forEach((node) => {
        const isSelfMatch =
          node.name.toLowerCase().includes(kw) ||
          node.code.toLowerCase().includes(kw) ||
          (node.materializedPath || '').toLowerCase().includes(kw);

        const filteredChildren = filterNodes(node.children);
        if (isSelfMatch || filteredChildren.length > 0) {
          result.push({ ...node, children: filteredChildren });
          if (filteredChildren.length > 0) matchingExpanded.add(node.id);
        }
      });
      return result;
    }

    return { filteredTree: filterNodes(tree), autoExpandedIds: matchingExpanded };
  }, [tree, searchKeyword]);

  // Hợp nhất expanded state (bao gồm auto-expanded khi search)
  const isExpanded = (id: string) => expandedIds.has(id) || autoExpandedIds.has(id);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => setExpandedIds(new Set(allParentIds));
  const handleCollapseAll = () => setExpandedIds(new Set());

  // 3. Phẳng hóa cây DFS để render dạng bảng
  const flatRows = useMemo(() => {
    const rows: TopicTreeNode[] = [];
    function traverse(nodes: TopicTreeNode[]) {
      nodes.forEach((node) => {
        rows.push(node);
        if (node.children.length > 0 && isExpanded(node.id)) {
          traverse(node.children);
        }
      });
    }
    traverse(filteredTree);
    return rows;
  }, [filteredTree, expandedIds, autoExpandedIds]);

  // Nhận diện Icon phù hợp theo cấp độ phả hệ
  const getNodeIcon = (node: TopicTreeNode, expanded: boolean) => {
    if (node.code.startsWith('TP')) return <FileText size={15} className="text-blue-400 shrink-0" />;
    if (node.code.includes('CRT')) return <User size={15} className="text-emerald-400 shrink-0" />;
    if (node.code.startsWith('STUDIO_202') || /\d{8}/.test(node.code)) {
      return <Calendar size={15} className="text-amber-400 shrink-0" />;
    }
    return expanded ? (
      <FolderOpen size={16} className="text-indigo-400 shrink-0" />
    ) : (
      <Folder size={16} className="text-indigo-400 shrink-0" />
    );
  };

  return (
    <div className="w-full">
      {/* Thanh tác vụ điều khiển Cây */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/40 border-b border-slate-850 text-xs">
        <span className="text-slate-400">
          Hiển thị <strong className="text-indigo-300">{flatRows.length}</strong> / {topics.length} nút phân cấp
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
          >
            Mở rộng tất cả
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
          >
            Thu gọn tất cả
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-850 text-slate-400 text-xs font-black tracking-wider uppercase bg-slate-900/20 select-none">
              <th className="p-4 w-72">Cấu Trúc Phân Cấp & Chủ Đề</th>
              <th className="p-4 w-36">Mã Định Danh</th>
              <th className="p-4">Đường Dẫn (Materialized Path)</th>
              <th className="p-4 w-24 text-center">Câu Hỏi</th>
              <th className="p-4 w-28">Phạm Vi</th>
              <th className="p-4 w-28 text-right sticky right-0 bg-slate-900 z-10 border-l border-slate-800 shadow-[-4px_0_8px_rgba(0,0,0,0.15)]">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {flatRows.map((node) => {
              const hasKids = node.children.length > 0;
              const expanded = isExpanded(node.id);
              const qCount = questionCountsByTopic[node.code] || node.questionCountCached || 0;

              return (
                <tr key={node.id} className="border-b border-slate-850/60 hover:bg-slate-800/20 transition-colors group">
                  {/* Cột 1: Cây thụt dòng + Tên + Badge số lượng con */}
                  <td className="p-3 pl-4">
                    <div className="flex items-center gap-1.5" style={{ paddingLeft: `${node.level * 22}px` }}>
                      {hasKids ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(node.id)}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                        >
                          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      ) : (
                        <span className="w-5 h-5 shrink-0" />
                      )}
                      {getNodeIcon(node, expanded)}
                      <span className="font-bold text-slate-200 text-xs truncate max-w-xs ml-1" title={node.name}>
                        {node.name}
                      </span>
                      {hasKids && (
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 ml-1">
                          {node.children.length}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Cột 2: Mã định danh */}
                  <td className="p-3 font-mono text-xs font-black text-cyan-400 select-all">{node.code}</td>

                  {/* Cột 3: Materialized Path */}
                  <td className="p-3 text-xs text-slate-300">
                    <span className="font-mono text-[11px] text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800/80">
                      {node.materializedPath || `/${node.code}/`}
                    </span>
                  </td>

                  {/* Cột 4: Số lượng câu hỏi */}
                  <td className="p-3 text-center">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      qCount > 0 ? 'bg-blue-500/20 text-blue-300' : 'text-slate-600'
                    }`}>
                      {qCount}
                    </span>
                  </td>

                  {/* Cột 5: Phạm vi hiển thị */}
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                      node.visibilityScope === 'PUBLIC'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    }`}>
                      {node.visibilityScope}
                    </span>
                  </td>

                  {/* Cột 6: Thao tác nhanh */}
                  <td className="p-3 text-right sticky right-0 bg-slate-900/95 z-10 border-l border-slate-850/60 shadow-[-4px_0_8px_rgba(0,0,0,0.15)]">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenQuestions?.(node)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-sky-400 hover:text-white bg-sky-950/60 hover:bg-sky-900/80 border border-sky-500/30 hover:border-sky-500/60 rounded-lg transition cursor-pointer shadow-sm"
                        title={`Xem danh sách ${qCount} câu hỏi của chủ đề này`}
                      >
                        <HelpCircle size={13} />
                        <span>Câu hỏi</span>
                        {qCount > 0 && (
                          <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-500/30 text-sky-200 font-mono">
                            {qCount}
                          </span>
                        )}
                      </button>
                      {onAssignHomework && (
                        <button
                          type="button"
                          onClick={() => onAssignHomework(node)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-lg transition cursor-pointer shadow-sm"
                          title={`Giao bài tập về nhà cho học sinh từ chủ đề "${node.name}"`}
                        >
                          <Send size={11} />
                          <span>Giao bài</span>
                        </button>
                      )}
                      {onLaunchArena && (
                        <button
                          type="button"
                          onClick={() => onLaunchArena(node)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 rounded-lg transition cursor-pointer shadow-sm"
                          title={`Kích hoạt Đấu trường trực tiếp từ chủ đề "${node.name}"`}
                        >
                          <Play size={11} />
                          <span>Đấu trường</span>
                        </button>
                      )}
                      {onExportDocx && (
                        <button
                          type="button"
                          onClick={() => onExportDocx(node)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-blue-300 hover:text-white bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/40 rounded-lg transition cursor-pointer shadow-sm"
                          title={`Xuất đề thi chuẩn Bộ GD&ĐT ra file Word từ "${node.name}"`}
                        >
                          <FileText size={11} />
                          <span>Xuất Word</span>
                        </button>
                      )}
                      {hasWritePermission && (
                        <button
                          type="button"
                          onClick={() => onOpenAddChild(node.id)}
                          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/40 rounded-lg transition cursor-pointer"
                          title="Thêm thư mục / chủ đề con vào nhánh này"
                        >
                          <FolderPlus size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenEdit(node)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title={t('tooltips.viewDetails')}
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {flatRows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-500 text-xs font-bold">
                  Không tìm thấy chủ đề nào phù hợp với bộ lọc cây.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

