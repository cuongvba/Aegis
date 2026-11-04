import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, LogIn, FileText, Award, ShieldCheck, Globe, Lock, User, CheckCircle2 } from 'lucide-react';
import type { WhiteLabelConfig } from '../hooks/useWhiteLabelTheme';

interface MultiSurfaceLivePreviewProps {
  config: WhiteLabelConfig;
}

type PreviewTab = 'login' | 'exam' | 'certificate';

export const MultiSurfaceLivePreview: React.FC<MultiSurfaceLivePreviewProps> = ({ config }) => {
  const { t } = useTranslation('white_label');
  const [activeTab, setActiveTab] = useState<PreviewTab>('login');
  const [selectedOption, setSelectedOption] = useState<string>('B');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative overflow-hidden">
      {/* HEADER & SURFACE SELECTOR TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-black uppercase text-white tracking-wider">
            {t('previewHeader', 'Khung Xem Trước Trực Quan')}
          </h3>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            0ms Live
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'login' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn size={12} /> {t('tabLogin', 'Đăng nhập')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('exam')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'exam' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={12} /> {t('tabExam', 'Phòng thi')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('certificate')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'certificate' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award size={12} /> {t('tabCert', 'Chứng chỉ')}
          </button>
        </div>
      </div>

      {/* SURFACE PREVIEW CONTAINER */}
      <div
        className="transition-all duration-300 relative rounded-2xl overflow-hidden border border-slate-800 min-h-[380px]"
        style={{ fontFamily: config.fontFamily }}
      >
        {/* ─── TAB 1: LOGIN SURFACE ─── */}
        {activeTab === 'login' && (
          <div className="relative min-h-[380px] flex flex-col justify-between p-6 overflow-hidden">
            {/* Background Wallpaper with Opacity Overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-500"
              style={{ backgroundImage: `url(${config.loginBackgroundUrl})` }}
            />
            <div
              className="absolute inset-0 transition-all duration-300"
              style={{ backgroundColor: `rgba(2, 6, 23, ${(config.loginOverlayOpacity || 65) / 100})` }}
            />

            {/* Topbar in Login */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {config.logoUrl ? (
                  <img
                    src={config.logoUrl}
                    alt={config.organizationName}
                    style={{ height: `${Math.min(config.logoHeightPx || 36, 42)}px` }}
                    className="object-contain max-w-[140px]"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs" style={{ backgroundColor: config.primaryColor }}>
                    {config.organizationName?.slice(0, 2).toUpperCase() || 'AG'}
                  </div>
                )}
                <div>
                  <div className="text-xs font-black text-white leading-tight">{config.organizationName}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Globe size={10} className="text-cyan-400" /> {config.customDomain}
                  </div>
                </div>
              </div>
            </div>

            {/* Login Card Sandbox */}
            <div className="relative z-10 my-4 max-w-sm mx-auto w-full bg-slate-900/85 backdrop-blur-md p-5 border border-slate-700/60 shadow-2xl space-y-3.5" style={{ borderRadius: config.borderRadius }}>
              <div className="text-center space-y-1">
                <h4 className="text-sm font-black text-white tracking-tight">Cổng Sát Hạch Trực Tuyến</h4>
                {config.slogan && (
                  <p className="text-[11px] text-slate-300 italic font-medium">"{config.slogan}"</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs text-slate-300">
                  <User size={13} className="text-slate-500" />
                  <span>cb.nguyenvana</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs text-slate-300">
                  <Lock size={13} className="text-slate-500" />
                  <span>••••••••••••</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full py-2 text-xs font-black text-white shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                style={{ backgroundColor: config.primaryColor, borderRadius: config.borderRadius }}
              >
                <span>ĐĂNG NHẬP SÁT HẠCH</span>
              </button>
            </div>

            {/* Footer Copyright in Login */}
            <div className="relative z-10 text-center text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
              {config.copyrightText || `© 2026 ${config.organizationName}. Bảo lưu mọi quyền.`}
            </div>
          </div>
        )}

        {/* ─── TAB 2: EXAM FORTRESS SURFACE ─── */}
        {activeTab === 'exam' && (
          <div className="relative min-h-[380px] bg-slate-950 p-5 space-y-3.5 select-none overflow-hidden">
            {/* Watermark Pattern if enabled */}
            {config.enableWatermark && (
              <div className="absolute inset-0 pointer-events-none opacity-[0.06] flex items-center justify-center rotate-[-25deg] text-xs font-black text-white whitespace-pre-wrap select-none leading-loose">
                {Array(6).fill(`${config.watermarkText || config.organizationName} • SBD-20261103 • IP: 10.22.4.18`).join('\n')}
              </div>
            )}

            {/* Exam Sandbox Header */}
            <div className="relative z-10 flex items-center justify-between pb-2.5 border-b border-slate-850">
              <div className="flex items-center gap-2.5">
                {config.logoUrl ? (
                  <img src={config.logoUrl} alt="Logo" style={{ height: `${Math.min(config.logoHeightPx || 36, 32)}px` }} className="object-contain" />
                ) : (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: config.primaryColor }}>
                    {config.organizationName?.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-black text-white">{config.organizationName}</span>
              </div>
              <div className="text-[11px] font-bold px-2 py-0.5 text-white" style={{ backgroundColor: config.accentColor, borderRadius: config.borderRadius }}>
                Bài thi 60 phút
              </div>
            </div>

            {/* Question Body */}
            <div className="relative z-10 space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Câu hỏi 15 / 50</span>
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <ShieldCheck size={12} /> Sát hạch bảo mật IRT
                </span>
              </div>
              <h4 className="text-xs font-bold text-white leading-relaxed">
                Theo quy chế tín dụng {config.organizationName}, điều kiện nào sau đây là bắt buộc khi giải ngân vốn vay trung dài hạn?
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {[
                  { key: 'A', text: 'Có vốn đối ứng tối thiểu 20%' },
                  { key: 'B', text: 'Đã hoàn tất đăng ký biện pháp bảo đảm' },
                  { key: 'C', text: 'Được phê duyệt bởi Hội đồng rủi ro' },
                  { key: 'D', text: 'Tất cả các phương án trên' }
                ].map((opt) => {
                  const isSel = selectedOption === opt.key;
                  return (
                    <div
                      key={opt.key}
                      onClick={() => setSelectedOption(opt.key)}
                      className={`p-2.5 border text-xs cursor-pointer transition flex items-center justify-between ${
                        isSel ? 'text-white font-bold' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                      style={{
                        borderRadius: config.borderRadius,
                        backgroundColor: isSel ? `${config.primaryColor}25` : undefined,
                        borderColor: isSel ? config.primaryColor : undefined
                      }}
                    >
                      <span><strong>{opt.key}.</strong> {opt.text}</span>
                      {isSel && <CheckCircle2 size={13} style={{ color: config.primaryColor }} />}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  className="px-4 py-1.5 text-xs font-black text-white shadow cursor-pointer"
                  style={{ backgroundColor: config.primaryColor, borderRadius: config.borderRadius }}
                >
                  NỘP BÀI THI
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: CERTIFICATE SURFACE ─── */}
        {activeTab === 'certificate' && (
          <div className="relative min-h-[380px] bg-gradient-to-b from-slate-950 to-slate-900 p-6 flex flex-col justify-between items-center text-center border-4 border-amber-500/40 m-2 rounded-xl">
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                {config.logoUrl && (
                  <img src={config.logoUrl} alt="Logo" style={{ height: '36px' }} className="object-contain" />
                )}
                <span className="text-xs font-black text-amber-300 tracking-wider uppercase">
                  {config.organizationName}
                </span>
              </div>
              <h3 className="text-base font-black text-white tracking-widest uppercase pt-2">
                GIẤY CHỨNG NHẬN ĐẠT CHUẨN NĂNG LỰC
              </h3>
              {config.slogan && (
                <p className="text-[10px] text-amber-200/80 italic">"{config.slogan}"</p>
              )}
            </div>

            <div className="space-y-1 py-3">
              <p className="text-[11px] text-slate-400">Chứng nhận Cán bộ / Thí sinh:</p>
              <h2 className="text-lg font-black text-white tracking-wide" style={{ color: config.accentColor }}>
                NGUYỄN VĂN A
              </h2>
              <p className="text-xs text-slate-300">Đã hoàn thành xuất sắc Kỳ thi Nghiệp vụ Chuẩn Hóa 2026</p>
              <div className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black rounded-lg mt-1">
                Điểm số: 96 / 100 • Xếp loại: XUẤT SẮC
              </div>
            </div>

            <div className="w-full flex items-center justify-between text-[10px] text-slate-400 pt-3 border-t border-slate-800">
              <div>Mã tra cứu: <strong className="font-mono text-white">AGRI-CERT-2026-8899</strong></div>
              <div className="text-right">
                <span className="block font-bold text-white">HỘI ĐỒNG KHẢO THÍ</span>
                <span className="text-[9px] text-slate-500">{config.organizationName}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

