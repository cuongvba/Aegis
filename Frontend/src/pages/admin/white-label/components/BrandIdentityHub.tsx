import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Globe, Sparkles, Building2, Quote, ExternalLink } from 'lucide-react';
import type { WhiteLabelConfig } from '../hooks/useWhiteLabelTheme';

interface BrandIdentityHubProps {
  config: WhiteLabelConfig;
  onUpdate: (partial: Partial<WhiteLabelConfig>) => void;
}

const BRAND_PRESETS = [
  {
    name: 'Agribank (Ngân hàng NN&PTNT)',
    slogan: 'Mang phồn thịnh đến khách hàng',
    logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Agribank-V.png',
    primaryColor: '#7b1113', // Đỏ bã trầu Agribank
    secondaryColor: '#006548', // Xanh lúa Agribank
    accentColor: '#d4a017' // Vàng lúa
  },
  {
    name: 'Vietcombank',
    slogan: 'Chung niềm tin, vững tương lai',
    logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Vietcombank.png',
    primaryColor: '#005a36', // Xanh lục đậm VCB
    secondaryColor: '#78be20',
    accentColor: '#107c41'
  },
  {
    name: 'Viettel Global Enterprise',
    slogan: 'Theo cách của bạn',
    logoUrl: 'https://cdn.haitrieu.com/wp-content/uploads/2022/01/Logo-Viettel.png',
    primaryColor: '#ee0033', // Đỏ Viettel
    secondaryColor: '#111827',
    accentColor: '#f97316'
  }
];

export const BrandIdentityHub: React.FC<BrandIdentityHubProps> = ({ config, onUpdate }) => {
  const { t } = useTranslation('white_label');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-black uppercase text-white tracking-wider">
            {t('brandIdentity', '1. Căn Cước Thị Giác & Logo Doanh Nghiệp')}
          </h2>
        </div>
        <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
          Visual Identity Core
        </span>
      </div>

      {/* QUICK PRESETS PILLS */}
      <div className="space-y-1.5">
        <label className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber-400" />
          <span>{t('quickPresets', 'Áp dụng nhanh mẫu nhận diện mẫu:')}</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {BRAND_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                onUpdate({
                  organizationName: preset.name,
                  slogan: preset.slogan,
                  logoUrl: preset.logoUrl,
                  primaryColor: preset.primaryColor,
                  secondaryColor: preset.secondaryColor,
                  accentColor: preset.accentColor
                });
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.primaryColor }} />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* TÊN TỔ CHỨC */}
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">
            {t('organizationName', 'Tên tổ chức / Ngân hàng')} *
          </label>
          <input
            type="text"
            required
            value={config.organizationName}
            onChange={(e) => onUpdate({ organizationName: e.target.value })}
            placeholder="Ví dụ: Ngân hàng Nông nghiệp & PTNT Việt Nam"
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* CUSTOM DOMAIN */}
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
            <Globe size={13} className="text-cyan-400" />
            <span>{t('customDomain', 'Tên miền riêng (Custom Domain)')}</span>
          </label>
          <input
            type="text"
            value={config.customDomain}
            onChange={(e) => onUpdate({ customDomain: e.target.value })}
            placeholder="sat-hach.agribank.com.vn"
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>
      </div>

      {/* KHẨU HIỆU DOANH NGHIỆP (SLOGAN / TAGLINE) */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Quote size={13} className="text-purple-400" />
          <span>{t('sloganLabel', 'Khẩu hiệu / Tuyên ngôn hành động (Corporate Slogan)')} *</span>
        </label>
        <input
          type="text"
          value={config.slogan}
          onChange={(e) => onUpdate({ slogan: e.target.value })}
          placeholder="Ví dụ: Mang phồn thịnh đến khách hàng"
          className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 italic focus:outline-none focus:border-purple-500"
        />
        <p className="text-[11px] text-slate-500">
          {t('sloganHint', 'Khẩu hiệu sẽ xuất hiện trang trọng trên trang Đăng nhập, Bìa đề thi sát hạch và Giấy chứng nhận điện tử.')}
        </p>
      </div>

      {/* LOGO CHÍNH & FAVICON */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* LOGO CHÍNH */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Image size={13} className="text-blue-400" />
            <span>{t('logoUrl', 'URL Logo chính (Topbar / Navbar)')}</span>
          </label>
          <input
            type="text"
            value={config.logoUrl}
            onChange={(e) => onUpdate({ logoUrl: e.target.value })}
            placeholder="https://domain.com/logo.svg"
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{t('logoHeight', 'Chiều cao logo')}: {config.logoHeightPx || 36}px</span>
            <input
              type="range"
              min={24}
              max={64}
              value={config.logoHeightPx || 36}
              onChange={(e) => onUpdate({ logoHeightPx: Number(e.target.value) })}
              className="w-24 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* FAVICON / APP ICON */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <ExternalLink size={13} className="text-emerald-400" />
            <span>{t('faviconUrl', 'Favicon & Biểu tượng vuông 1:1')}</span>
          </label>
          <input
            type="text"
            value={config.faviconUrl}
            onChange={(e) => onUpdate({ faviconUrl: e.target.value })}
            placeholder="https://domain.com/favicon.png"
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
          />
          <p className="text-[11px] text-slate-500">
            {t('faviconHint', 'Icon vuông tỷ lệ 1:1 cho Tab trình duyệt và Mobile PWA.')}
          </p>
        </div>
      </div>
    </div>
  );
};

