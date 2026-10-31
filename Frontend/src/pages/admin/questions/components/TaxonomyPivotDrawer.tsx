import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  X,
  Layers,
  BookOpen,
  GraduationCap,
  Calendar,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Search,
  Sparkles,
  Loader2,
  Filter,
} from 'lucide-react';
import {
  taxonomyPivotService,
  TaxonomyPivotTreeNode,
} from '@/services/taxonomy-pivot.service';

interface TaxonomyPivotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  domainCode: string;
  onApplyFilter: (facet: {
    topicCode?: string;
    grade?: string;
    treePath?: string;
    termPhase?: string;
    term?: string;
  }) => void;
  currentFilter?: {
    topicCode?: string;
    grade?: string;
    treePath?: string;
  };
}

export const TaxonomyPivotDrawer: React.FC<TaxonomyPivotDrawerProps> = ({
  isOpen,
  onClose,
  domainCode,
  onApplyFilter,
  currentFilter,
}) => {
  const { t } = useTranslation('admin_questions');
  const [pivot, setPivot] = useState<'by-subject' | 'by-grade' | 'by-term'>('by-subject');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const { data: treeNodes = [], isLoading } = useQuery<TaxonomyPivotTreeNode[]>({
    queryKey: ['taxonomy-pivot-tree', pivot, domainCode],
    queryFn: () => taxonomyPivotService.getPivotTree({ pivot, domainCode }),
    enabled: isOpen,
    staleTime: 60_000,
  });

  if (!isOpen) return null;

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleNodeClick = (node: TaxonomyPivotTreeNode) => {
    if (node.nodeType === 'TOPIC') {
      onApplyFilter({ topicCode: node.code, treePath: node.materializedPath });
    } else if (node.nodeType === 'GRADE') {
      onApplyFilter({ grade: node.code, treePath: node.materializedPath });
    } else if (node.nodeType === 'TERM') {
      onApplyFilter({ termPhase: node.code, term: node.code, treePath: node.materializedPath });
    } else if (node.materializedPath) {
      onApplyFilter({ treePath: node.materializedPath });
    }
    onClose();
  };

  const renderTree = (nodes: TaxonomyPivotTreeNode[], depth = 0) => {
    return (
      <ul className={`space-y-1 ${depth > 0 ? 'ml-4 pl-2 border-l border-slate-800' : ''}`}>
        {nodes.map(node => {
          const hasChildren = node.children && node.children.length > 0;
          const isExpanded = expandedNodes[node.id] ?? (depth < 1);
          const isSelected =
            (currentFilter?.treePath && node.materializedPath === currentFilter.treePath) ||
            (currentFilter?.topicCode && node.code === currentFilter.topicCode) ||
            (currentFilter?.grade && node.code === currentFilter.grade);

          return (
            <li key={node.id} className="text-xs">
              <div
                className={`flex items-center justify-between p-2 rounded-xl transition-all group cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-bold'
                    : 'hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <div
                  className="flex items-center gap-2 flex-1 overflow-hidden"
                  onClick={() => handleNodeClick(node)}
                >
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        toggleExpand(node.id);
                      }}
                      className="p-0.5 rounded text-slate-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  ) : (
                    <span className="w-3.5" />
                  )}

                  {node.nodeType === 'GRADE' ? (
                    <GraduationCap size={15} className="text-amber-400 flex-shrink-0" />
                  ) : node.nodeType === 'TOPIC' ? (
                    <BookOpen size={15} className="text-cyan-400 flex-shrink-0" />
                  ) : node.nodeType === 'TERM' ? (
                    <Calendar size={15} className="text-emerald-400 flex-shrink-0" />
                  ) : hasChildren ? (
                    isExpanded ? (
                      <FolderOpen size={15} className="text-indigo-400 flex-shrink-0" />
                    ) : (
                      <Folder size={15} className="text-indigo-400 flex-shrink-0" />
                    )
                  ) : (
                    <FileText size={14} className="text-slate-400 flex-shrink-0" />
                  )}

                  <span className="truncate">{node.label}</span>
                </div>

                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300">
                  {node.questionCount}
                </span>
              </div>

              {hasChildren && isExpanded && renderTree(node.children, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Layers size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Cây Phả Hệ Xoay Trục
                <Sparkles size={14} className="text-cyan-400" />
              </h3>
              <p className="text-[11px] text-slate-400">Định vị & phân phối câu hỏi theo 3 lăng kính</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3 Lăng kính Tabs */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/20">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setPivot('by-subject')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                pivot === 'by-subject' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen size={13} />
              Theo Môn
            </button>
            <button
              onClick={() => setPivot('by-grade')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                pivot === 'by-grade' ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap size={13} />
              Theo Khối
            </button>
            <button
              onClick={() => setPivot('by-term')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                pivot === 'by-term' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar size={13} />
              Theo Đợt
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-800/80">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm nhánh tri thức..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Tree Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
              <Loader2 size={24} className="animate-spin text-cyan-400" />
              <span className="text-xs">Đang tổng hợp phả hệ...</span>
            </div>
          ) : treeNodes.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Chưa có dữ liệu phân loại cho ngành này.
            </div>
          ) : (
            renderTree(treeNodes)
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <button
            onClick={() => {
              onApplyFilter({ topicCode: '', grade: '', treePath: '', termPhase: '' });
              onClose();
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Xóa bộ lọc phả hệ
          </button>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Filter size={12} /> B-Tree O(1) Prefix
          </span>
        </div>
      </div>
    </div>
  );
};
