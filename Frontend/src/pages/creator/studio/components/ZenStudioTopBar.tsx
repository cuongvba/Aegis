import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Coffee } from 'lucide-react';
import type { EducatorPartnershipInfo } from '../types/zen-studio.types';
import type { IngestionQuotaStatus } from '@/services/antiScrapingGuard.service';

interface ZenStudioTopBarProps {
  quotaStatus: IngestionQuotaStatus;
  partnership: EducatorPartnershipInfo | null;
  onOpenCoffeeModal: () => void;
}

export const ZenStudioTopBar: React.FC<ZenStudioTopBarProps> = ({
  quotaStatus,
  partnership,
  onOpenCoffeeModal,
}) => {
  const { t } = useTranslation('creator');

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
      <div className="flex items-center gap-2 text-xs">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
        </span>
        <span className="text-slate-300 font-medium hidden sm:inline">
          {t('topBar.quotaLabel')}
        </span>
        <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          {quotaStatus.dailyUsed}/{quotaStatus.isUnlimited ? t('topBar.unlimited') : `${quotaStatus.dailyLimit} ${t('topBar.examsPerDay')}`}
        </span>
        {partnership?.referralCode && (
          <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 hidden md:inline">
            ID: {partnership.referralCode}
          </span>
        )}
        <span className="text-[10px] text-slate-500 hidden lg:inline">
          {t('topBar.securityNote')}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenCoffeeModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>{t('coffee.buttonLabel', { price: (partnership?.coffeePriceVnd || 25000).toLocaleString('vi-VN') })}</span>
        </button>
      </div>
    </div>
  );
};

