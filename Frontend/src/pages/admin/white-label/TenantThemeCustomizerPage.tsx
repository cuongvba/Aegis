import React from 'react';
import { useTranslation } from 'react-i18next';
import { FeatureGate } from '@/shared/components/entitlement';
import { FeatureKey } from '@/types/entitlement';
import { Save, RotateCcw, CheckCircle2, Building2, Loader2 } from 'lucide-react';
import { useWhiteLabelTheme } from './hooks/useWhiteLabelTheme';
import { BrandIdentityHub } from './components/BrandIdentityHub';
import { SurfaceBackgroundConfig } from './components/SurfaceBackgroundConfig';
import { ThemeColorPalettePicker } from './components/ThemeColorPalettePicker';
import { ThemeFontSelector } from './components/ThemeFontSelector';
import { FooterAndLegalConfig } from './components/FooterAndLegalConfig';
import { MultiSurfaceLivePreview } from './components/MultiSurfaceLivePreview';
import { WhiteLabelPaywallTeaser } from './components/WhiteLabelPaywallTeaser';

export const TenantThemeCustomizerPage: React.FC = () => {
  const { t } = useTranslation('white_label');
  const { config, updateConfig, saveConfig, resetDefaults, isSaved, loading } = useWhiteLabelTheme();

  return (
    <FeatureGate feature={FeatureKey.WhiteLabelTheming} fallback={<WhiteLabelPaywallTeaser />}>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Building2 className="w-6 h-6 text-indigo-400" />
                {t('title', 'Tùy Biến Thương Hiệu & Giao Diện Doanh Nghiệp (White-Labeling)')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                ENTERPRISE TIER
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {t('subtitle', 'Cấu hình bản sắc thương hiệu, logo đa thể thức, slogan, hình nền và CSS Tokens động 100% hướng cơ sở dữ liệu')}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={resetDefaults}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 border border-slate-700/80 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('resetDefault', 'Khôi phục mặc định')}</span>
            </button>

            <button
              type="button"
              onClick={saveConfig}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-400 hover:to-purple-500 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{t('saveChanges', 'Lưu cấu hình thương hiệu')}</span>
            </button>
          </div>
        </div>

        {/* SUCCESS ALERT */}
        {isSaved && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{t('savedSuccess', 'Đã lưu và áp dụng bản sắc thương hiệu thành công cho toàn bộ hệ sinh thái!')}</span>
          </div>
        )}

        {/* TWO-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI: CẤU HÌNH THƯƠNG HIỆU (7 COLS) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Brand Identity & Logo */}
            <BrandIdentityHub config={config} onUpdate={updateConfig} />

            {/* 2. Surfaces & Backgrounds */}
            <SurfaceBackgroundConfig config={config} onUpdate={updateConfig} />

            {/* 3. Color Palette */}
            <ThemeColorPalettePicker config={config} onUpdate={updateConfig} />

            {/* 4. Font & Border Radius */}
            <ThemeFontSelector config={config} onUpdate={updateConfig} />

            {/* 5. Legal & Footer */}
            <FooterAndLegalConfig config={config} onUpdate={updateConfig} />
          </div>

          {/* CỘT PHẢI: KHUNG XEM TRƯỚC ĐA KHÔNG GIAN (5 COLS - STICKY) */}
          <div className="lg:col-span-5 sticky top-6">
            <MultiSurfaceLivePreview config={config} />
          </div>
        </div>
      </div>
    </FeatureGate>
  );
};

export default TenantThemeCustomizerPage;
