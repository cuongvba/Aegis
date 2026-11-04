import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wallpaper, ShieldAlert, Sliders, Eye } from 'lucide-react';
import type { WhiteLabelConfig } from '../hooks/useWhiteLabelTheme';

interface SurfaceBackgroundConfigProps {
  config: WhiteLabelConfig;
  onUpdate: (partial: Partial<WhiteLabelConfig>) => void;
}

const WALLPAPER_PRESETS = [
  {
    name: 'Tòa nhà Trụ sở Hiện đại (Enterprise HQ)',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920&auto=format&fit=crop'
  },
  {
    name: 'Hội nghị & Công nghệ Số (FinTech Summit)',
    url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1920&auto=format&fit=crop'
  },
  {
    name: 'Thư viện Tri thức Hàn Lâm (Academic Hall)',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1920&auto=format&fit=crop'
  },
  {
    name: 'Tối giản Sang trọng (Obsidian Minimal)',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop'
  }
];

export const SurfaceBackgroundConfig: React.FC<SurfaceBackgroundConfigProps> = ({ config, onUpdate }) => {
  const { t } = useTranslation('white_label');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Wallpaper className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-black uppercase text-white tracking-wider">
            {t('surfaceTitle', '2. Không Gian Hình Nền & Watermark Bảo Mật')}
          </h2>
        </div>
        <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
          Atmosphere & Security
        </span>
      </div>

      {/* WALLPAPER URL & PRESETS */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-300 block">
          {t('loginWallpaperLabel', 'Ảnh nền trang Đăng nhập / Chào mừng (Login Hero Wallpaper)')}
        </label>
        <input
          type="text"
          value={config.loginBackgroundUrl}
          onChange={(e) => onUpdate({ loginBackgroundUrl: e.target.value })}
          placeholder="https://images.unsplash.com/..."
          className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {WALLPAPER_PRESETS.map((wp) => (
            <button
              key={wp.name}
              type="button"
              onClick={() => onUpdate({ loginBackgroundUrl: wp.url })}
              className={`group relative h-16 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                config.loginBackgroundUrl === wp.url ? 'border-cyan-400 ring-2 ring-cyan-500/30' : 'border-slate-800 hover:border-slate-600'
              }`}
            >
              <img src={wp.url} alt={wp.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-1 text-center">
                <span className="text-[10px] font-bold text-white line-clamp-2">{wp.name.split(' (')[0]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* OVERLAY DARKNESS SLIDER */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Sliders size={13} className="text-cyan-400" />
            {t('overlayDarkness', 'Độ tối lớp phủ hình nền (Overlay Opacity)')}
          </span>
          <span className="font-mono text-cyan-400">{config.loginOverlayOpacity || 65}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={95}
          step={5}
          value={config.loginOverlayOpacity || 65}
          onChange={(e) => onUpdate({ loginOverlayOpacity: Number(e.target.value) })}
          className="w-full accent-cyan-400 cursor-pointer"
        />
        <p className="text-[11px] text-slate-500">
          {t('overlayHint', 'Giữ lớp phủ từ 60% - 75% giúp form đăng nhập và logo thương hiệu hiển thị rõ ràng và thẩm mỹ nhất.')}
        </p>
      </div>

      {/* WATERMARK BẢO MẬT PHÒNG THI */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">
              {t('antiCheatWatermark', 'Watermark chìm chống chụp trộm đề thi')}
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableWatermark ?? true}
              onChange={(e) => onUpdate({ enableWatermark: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {config.enableWatermark && (
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] text-slate-400 font-medium">
              {t('watermarkPattern', 'Nội dung Watermark (Mã nhân viên / SBD sẽ tự động nối đuôi khi thi thật):')}
            </label>
            <input
              type="text"
              value={config.watermarkText || `${config.organizationName} — BẢO MẬT`}
              onChange={(e) => onUpdate({ watermarkText: e.target.value })}
              className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-300 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};

