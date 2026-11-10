import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { mathRegistry } from './mathRegistry';
import { MathRenderer } from '@/components/common/MathRenderer';
import {
  Divide,
  TrendingUp,
  Compass,
  Maximize2,
  Grid,
  Layers,
  CheckSquare,
  Type,
  FlaskConical,
  FileSpreadsheet,
  Search,
  History,
  Atom,
} from 'lucide-react';

interface MathPaletteCategoryProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  searchFilter: string;
  setSearchFilter: (query: string) => void;
  recentFormulas?: string[];
  onSelectSnippet: (latex: string) => void;
}

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  Divide: <Divide className="w-3.5 h-3.5" />,
  TrendingUp: <TrendingUp className="w-3.5 h-3.5" />,
  Compass: <Compass className="w-3.5 h-3.5" />,
  Maximize2: <Maximize2 className="w-3.5 h-3.5" />,
  Grid: <Grid className="w-3.5 h-3.5" />,
  Layers: <Layers className="w-3.5 h-3.5" />,
  CheckSquare: <CheckSquare className="w-3.5 h-3.5" />,
  Type: <Type className="w-3.5 h-3.5" />,
  FlaskConical: <FlaskConical className="w-3.5 h-3.5" />,
  FileSpreadsheet: <FileSpreadsheet className="w-3.5 h-3.5" />,
  History: <History className="w-3.5 h-3.5" />,
};

export const MathPaletteCategory: React.FC<MathPaletteCategoryProps> = ({
  activeTab,
  setActiveTab,
  searchFilter,
  setSearchFilter,
  recentFormulas = [],
  onSelectSnippet,
}) => {
  const { t } = useTranslation('math');
  const allCategories = useMemo(() => mathRegistry.getAll(), []);

  // Filter items if searching
  const filteredCategories = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) {
      if (activeTab === 'recent') return [];
      return allCategories.filter(c => c.id === activeTab);
    }
    return allCategories
      .map(cat => ({
        ...cat,
        items: cat.items.filter(
          item =>
            item.label.toLowerCase().includes(q) ||
            item.latex.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            t(`categories.${cat.id}`, cat.title).toLowerCase().includes(q)
        ),
      }))
      .filter(cat => cat.items.length > 0);
  }, [allCategories, activeTab, searchFilter, t]);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {recentFormulas.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('recent');
                setSearchFilter('');
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'recent' && !searchFilter
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/30'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-amber-300/80 hover:text-amber-200 border border-amber-900/40'
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('recentTab', 'Gần đây')} ({recentFormulas.length})</span>
            </button>
          )}

          {allCategories.map(cat => {
            const isActive = activeTab === cat.id && !searchFilter;
            const title = t(`categories.${cat.id}`, cat.title);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveTab(cat.id);
                  setSearchFilter('');
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {CATEGORY_ICON_MAP[cat.iconName] || <Atom className="w-3.5 h-3.5" />}
                <span>{title}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder={t('searchPlaceholder', 'Tìm công thức (sin, căn, ma trận)...')}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Symbol & Formula Grid */}
      <div className="flex-1 overflow-y-auto max-h-[220px] sm:max-h-[260px] pr-1 space-y-3">
        {/* Render Recent Formulas View */}
        {activeTab === 'recent' && !searchFilter && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>{t('recentTab', 'Công thức đã sử dụng gần đây')}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {recentFormulas.map((formula, idx) => (
                <button
                  key={`${formula}-${idx}`}
                  type="button"
                  onClick={() => onSelectSnippet(formula)}
                  title={formula}
                  className="group flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/90 hover:bg-amber-600/20 border border-slate-800 hover:border-amber-500/60 transition-all cursor-pointer"
                >
                  <div className="text-slate-100 group-hover:text-amber-200 text-sm overflow-hidden pointer-events-none truncate max-w-full">
                    <MathRenderer content={`$${formula}$`} />
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-amber-300 font-mono truncate max-w-full mt-1">
                    {formula}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Render Regular Categories View */}
        {filteredCategories.map(cat => (
          <div key={cat.id} className="space-y-1.5">
            {searchFilter && (
              <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                {t(`categories.${cat.id}`, cat.title)}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
              {cat.items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSnippet(item.latex)}
                  title={`${item.description} (${item.latex})`}
                  className="group relative flex flex-col items-center justify-center min-h-[50px] p-1.5 rounded-xl bg-slate-900/70 hover:bg-indigo-600/20 border border-slate-800/80 hover:border-indigo-500/60 transition-all cursor-pointer hover:scale-[1.03] active:scale-[0.98]"
                >
                  <div className="flex items-center justify-center text-slate-100 group-hover:text-indigo-200 text-sm overflow-hidden pointer-events-none">
                    <MathRenderer content={`$${item.label}$`} />
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-indigo-300 truncate max-w-full px-1">
                    {item.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && activeTab !== 'recent' && (
          <div className="py-8 text-center text-xs text-slate-500">
            {t('noResults', 'Không tìm thấy công thức phù hợp với từ khóa "{{query}}".', {
              query: searchFilter,
            })}
          </div>
        )}
      </div>
    </div>
  );
};
