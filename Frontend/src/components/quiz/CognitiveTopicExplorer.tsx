import React, { useState, useMemo, useCallback } from 'react';
import { Search, Sparkles, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type {
  CognitiveDomainGroupDto,
  CognitiveTopicNodeDto,
  ExamCategoryPreset,
  PracticeTopicConfig,
  TopicSummary,
} from '@/types/quiz';
import { taxonomyPivotService, type TaxonomyPivotTreeNode } from '@/services/taxonomy-pivot.service';
import { DrivingPresetWidget } from '@/components/quiz/DrivingPresetWidget';
import { useLearnerI18n } from '@/lib/i18n';
import { DomainTabBar } from './topic-explorer/DomainTabBar';
import { TopicTreeNode } from './topic-explorer/TopicTreeNode';
import { PerspectiveSelector, type PivotPerspective } from './topic-explorer/PerspectiveSelector';
import { QuickGradeFilterChips } from './topic-explorer/QuickGradeFilterChips';
import { TaxonomyMatrixModal } from '@/pages/admin/questions/components/TaxonomyMatrixModal';

interface Props {
  domainGroups?: CognitiveDomainGroupDto[];
  legacyTopics: TopicSummary[];
  topicConfigs: PracticeTopicConfig[];
  selectedMap: Map<string, PracticeTopicConfig>;
  activePreset?: ExamCategoryPreset | null;
  onSelectDrivingPreset?: (preset: ExamCategoryPreset, count: number, mins: number) => void;
  onToggleTopic: (topicKey: string, checked: boolean) => void;
  onUpdateTopicConfig: (topicKey: string, patch: Partial<PracticeTopicConfig>) => void;
  onSelectMultipleTopics?: (topicKeys: string[], select: boolean) => void;
  isDomainLocked?: boolean;
  forcedDomainCode?: string;
  t?: (key: string, params?: any) => string;
}

// Chuyển đổi TaxonomyPivotTreeNode sang CognitiveTopicNodeDto
function mapPivotNodeToCognitive(node: TaxonomyPivotTreeNode): CognitiveTopicNodeDto {
  return {
    id: node.id || node.code,
    name: node.label,
    code: node.code,
    scope: 'COMMUNITY',
    domainCode: 'EDUCATION',
    depthLevel: 1,
    questionCount: node.questionCount,
    children: (node.children || []).map(mapPivotNodeToCognitive),
  };
}

export const CognitiveTopicExplorer: React.FC<Props> = ({
  domainGroups,
  legacyTopics,
  selectedMap,
  activePreset,
  onSelectDrivingPreset,
  onToggleTopic,
  onUpdateTopicConfig,
  onSelectMultipleTopics,
  isDomainLocked = false,
  forcedDomainCode,
  t: propT,
}) => {
  const { t: hookT } = useLearnerI18n();
  const t = propT || hookT;
  const [selectedDomain, setSelectedDomain] = useState<string>(() => forcedDomainCode || 'EDUCATION');
  const [activePivot, setActivePivot] = useState<PivotPerspective>('by-subject');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleExpand = useCallback((code: string) => {
    setExpandedFolders(prev => ({ ...prev, [code]: !prev[code] }));
  }, []);

  // Fetch Cây Phả Hệ Xoay Trục từ API Backend
  const { data: pivotTreeNodes, isLoading: isPivotLoading, isSuccess } = useQuery({
    queryKey: ['taxonomy-pivot-practice', activePivot, selectedDomain, selectedGrade],
    queryFn: () =>
      taxonomyPivotService.getPivotTree({
        pivot: activePivot,
        domainCode: selectedDomain === 'ALL' ? undefined : selectedDomain,
        grade: selectedGrade || undefined,
      }),
    staleTime: 60_000,
  });

  // Tự động mở cấp 1 của cây
  const displayNodes = useMemo<CognitiveTopicNodeDto[]>(() => {
    // 1. Khi API trả về kết quả
    if (pivotTreeNodes && Array.isArray(pivotTreeNodes)) {
      if (pivotTreeNodes.length > 0) {
        return pivotTreeNodes.map(mapPivotNodeToCognitive);
      }
      // Khi người dùng chủ động chọn lọc Khối lớp hoặc Lĩnh vực và kết quả = 0: tôn trọng bộ lọc
      if (isSuccess && (selectedGrade || (selectedDomain && selectedDomain !== 'ALL'))) {
        return [];
      }
    }

    // 2. Fallback vào legacyTopics CHỈ KHI không có bộ lọc Khối cụ thể
    if (!selectedGrade && legacyTopics && legacyTopics.length > 0) {
      return legacyTopics.map(t => ({
        id: (t as any).id || t.key,
        code: t.key,
        name: t.name,
        domainCode: 'EDUCATION',
        depthLevel: 1,
        questionCount: t.questionCount || 0,
        scope: 'COMMUNITY',
        children: [],
      }));
    }

    return [];
  }, [pivotTreeNodes, isSuccess, selectedGrade, selectedDomain, legacyTopics]);

  // Lọc theo từ khóa tìm kiếm
  const filteredNodes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return displayNodes;
    return displayNodes.filter(
      n =>
        n.name.toLowerCase().includes(q) ||
        n.code.toLowerCase().includes(q) ||
        (n.children && n.children.some(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)))
    );
  }, [displayNodes, searchQuery]);

  // Thu thập toàn bộ lá
  const collectLeafKeys = useCallback((node: CognitiveTopicNodeDto): string[] => {
    if (!node.children || node.children.length === 0) return [node.code];
    return node.children.flatMap(collectLeafKeys);
  }, []);

  const getNodeSelectionStatus = useCallback(
    (node: CognitiveTopicNodeDto) => {
      const keys = collectLeafKeys(node);
      const selCount = keys.filter(k => selectedMap.has(k)).length;
      return {
        all: keys.length > 0 && selCount === keys.length,
        some: selCount > 0 && selCount < keys.length,
      };
    },
    [collectLeafKeys, selectedMap]
  );

  const handleSelectTree = useCallback(
    (node: CognitiveTopicNodeDto, select: boolean) => {
      const keys = collectLeafKeys(node);
      if (onSelectMultipleTopics) onSelectMultipleTopics(keys, select);
      else keys.forEach(k => onToggleTopic(k, select));
    },
    [collectLeafKeys, onSelectMultipleTopics, onToggleTopic]
  );

  const isDrivingActive = useMemo(() => {
    const d = (forcedDomainCode || selectedDomain).toUpperCase();
    return d.includes('DRIV') || d.includes('GPLX');
  }, [forcedDomainCode, selectedDomain]);

  return (
    <div className="space-y-4">
      {/* ─── THANH ĐIỀU HƯỚNG VÀ LĂNG KÍNH TOẠ ĐỘ ĐA CHIỀU ─── */}
      <div className="rounded-3xl border border-slate-800/90 bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-5 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/30">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Không Gian Nhận Thức Chuyên Đề Phân Tầng
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                  Universal ISCED
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tuỳ chọn lăng kính xoay trục theo <strong>Môn học</strong>, <strong>Khối lớp</strong>, <strong>Học kỳ</strong> hoặc <strong>Ma trận</strong>
              </p>
            </div>
          </div>

          <span className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 text-cyan-300 font-bold border border-cyan-500/20 text-xs flex items-center gap-2 shadow-sm">
            <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span>Đang chọn {selectedMap.size} chuyên đề</span>
          </span>
        </div>

        {/* Thanh Domain */}
        <DomainTabBar
          domainGroups={domainGroups || []}
          selectedDomain={forcedDomainCode || selectedDomain}
          onSelectDomain={setSelectedDomain}
          isDomainLocked={isDomainLocked}
          t={t}
        />

        {/* Lăng kính xoay trục (By Subject / By Grade / By Term / Matrix) */}
        <PerspectiveSelector
          activePivot={activePivot}
          onChangePivot={setActivePivot}
          onOpenMatrix={() => setIsMatrixOpen(true)}
          isEducationDomain={selectedDomain.toUpperCase() === 'EDUCATION' || selectedDomain === 'ALL'}
        />

        {/* Chips chọn nhanh Khối lớp (K06 - K12) */}
        {(selectedDomain.toUpperCase() === 'EDUCATION' || selectedDomain === 'ALL') && (
          <QuickGradeFilterChips
            selectedGrade={selectedGrade}
            onSelectGrade={setSelectedGrade}
          />
        )}

        {/* Ô tìm kiếm */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm chuyên đề, môn học, khối lớp hoặc mã chuẩn ISCED..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-700/80 bg-slate-950/80 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-all shadow-inner"
          />
        </div>
      </div>

      {isDrivingActive && onSelectDrivingPreset && (
        <DrivingPresetWidget activePreset={activePreset || null} onSelectPreset={onSelectDrivingPreset} />
      )}

      {/* ─── DANH SÁCH THẺ CARD CHUYÊN ĐỀ CAO CẤP ─── */}
      <div className="space-y-3">
        {isPivotLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
            <span className="material-icons animate-spin text-3xl text-cyan-400">autorenew</span>
            <p className="text-xs font-semibold">Đang tổng hợp không gian tri thức theo lăng kính {activePivot}...</p>
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-300">
                {selectedGrade
                  ? `Chưa có chuyên đề câu hỏi nào khả dụng cho ${selectedGrade.startsWith('K') ? `Lớp ${parseInt(selectedGrade.substring(1), 10) || selectedGrade.substring(1)}` : selectedGrade}.`
                  : 'Không tìm thấy chuyên đề phù hợp với bộ lọc hiện tại.'}
              </p>
              <p className="text-xs text-slate-500 max-w-md">
                Hệ thống ngân hàng câu hỏi đang liên tục được bóc tách và nạp thêm. Bạn có thể chọn khối lớp khác hoặc khám phá kho đề hiện có.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {selectedGrade && (
                <button
                  type="button"
                  onClick={() => setSelectedGrade('')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all cursor-pointer"
                >
                  Xem tất cả các lớp
                </button>
              )}
              {selectedGrade !== 'K12' && (
                <button
                  type="button"
                  onClick={() => setSelectedGrade('K12')}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Khám phá Lớp 12 (414 câu hỏi có sẵn)
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredNodes.map(rootNode => (
            <TopicTreeNode
              key={rootNode.code}
              node={rootNode}
              isExpanded={Boolean(expandedFolders[rootNode.code])}
              onToggleExpand={toggleExpand}
              selStatus={getNodeSelectionStatus(rootNode)}
              selectedConfig={selectedMap.get(rootNode.code)}
              onSelectTree={handleSelectTree}
              onUpdateConfig={onUpdateTopicConfig}
              t={t}
              childrenNodes={
                rootNode.children && rootNode.children.length > 0 ? (
                  <div className="space-y-2">
                    {rootNode.children.map(child => (
                      <TopicTreeNode
                        key={child.code}
                        node={child}
                        isExpanded={Boolean(expandedFolders[child.code])}
                        onToggleExpand={toggleExpand}
                        selStatus={getNodeSelectionStatus(child)}
                        selectedConfig={selectedMap.get(child.code)}
                        onSelectTree={handleSelectTree}
                        onUpdateConfig={onUpdateTopicConfig}
                        t={t}
                      />
                    ))}
                  </div>
                ) : null
              }
            />
          ))
        )}
      </div>

      {/* Ma trận tri thức modal tương tác trực tiếp */}
      <TaxonomyMatrixModal
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        domainCode={selectedDomain === 'ALL' ? 'EDUCATION' : selectedDomain}
        onSelectCell={facet => {
          if (facet.topicCode) {
            onToggleTopic(facet.topicCode, true);
          }
          if (facet.grade) {
            setSelectedGrade(facet.grade);
          }
        }}
      />
    </div>
  );
};
