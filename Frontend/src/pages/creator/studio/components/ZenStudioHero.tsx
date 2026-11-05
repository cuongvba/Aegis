import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { ZenTrialBanner } from './ZenTrialBanner';
import type { EducatorPartnershipInfo } from '../types/zen-studio.types';

interface ZenStudioHeroProps {
  partnership: EducatorPartnershipInfo | null;
}

export const ZenStudioHero: React.FC<ZenStudioHeroProps> = ({ partnership }) => {
  const { t } = useTranslation('creator');

  return (
    <>
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t('ecosystemTag')}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
          {t('title')}
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>
      <ZenTrialBanner partnership={partnership} />
    </>
  );
};

