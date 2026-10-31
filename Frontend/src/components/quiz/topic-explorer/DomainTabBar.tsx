import React, { useMemo } from 'react';
import type { CognitiveDomainGroupDto } from '@/types/quiz';

interface DomainTabBarProps {
  domainGroups: CognitiveDomainGroupDto[];
  selectedDomain: string;
  onSelectDomain: (domainCode: string) => void;
  isDomainLocked?: boolean;
  t?: (key: string) => string;
}

const DEFAULT_DOMAINS = [
  { domainCode: 'EDUCATION', domainName: 'Giáo dục Phổ thông (K06-K12)', icon: '🎓' },
  { domainCode: 'BANKING', domainName: 'Tài chính - Ngân hàng', icon: '🏦' },
  { domainCode: 'GENERAL', domainName: 'Chuyên đề Tổng hợp', icon: '🌐' },
];

export const DomainTabBar: React.FC<DomainTabBarProps> = ({
  domainGroups,
  selectedDomain,
  onSelectDomain,
  isDomainLocked = false,
  t,
}) => {
  if (isDomainLocked) {
    return null;
  }

  const effectiveGroups = useMemo(() => {
    if (domainGroups && domainGroups.length > 0) {
      return domainGroups;
    }
    return DEFAULT_DOMAINS.map(d => ({
      domainCode: d.domainCode,
      domainName: d.domainName,
      totalQuestions: 0,
    }));
  }, [domainGroups]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        type="button"
        onClick={() => onSelectDomain('ALL')}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
          selectedDomain === 'ALL'
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40'
            : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-850 hover:text-white'
        }`}
      >
        <span>🌐</span>
        <span>{t ? t('allDomains') : 'Tất Cả Lĩnh Vực'}</span>
      </button>

      {effectiveGroups.map(group => {
        const isSelected = selectedDomain.toUpperCase() === group.domainCode.toUpperCase();
        const icon = group.domainCode.toUpperCase() === 'BANKING' ? '🏦' : group.domainCode.toUpperCase() === 'EDUCATION' ? '🎓' : '📁';

        return (
          <button
            key={group.domainCode}
            type="button"
            onClick={() => onSelectDomain(group.domainCode)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              isSelected
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40'
                : 'bg-slate-900/90 text-slate-300 border border-slate-800 hover:bg-slate-850 hover:text-white'
            }`}
          >
            <span>{icon}</span>
            <span>{group.domainName || group.domainCode}</span>
            {group.totalQuestions && group.totalQuestions > 0 ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/80 font-normal text-cyan-300">
                {group.totalQuestions}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};
