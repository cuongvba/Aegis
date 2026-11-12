import React, { useState } from 'react';
import { Smartphone, Download, Share2, Copy, Check, ExternalLink, X, WifiOff, Zap, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { usePwaInstall } from '@/shared/hooks/usePwaInstall';

interface MobileAppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVariant?: string;
}

const APP_VARIANTS = [
  { id: 'all', label: 'Toàn diện', path: '/m' },
  { id: 'banking', label: 'Ngân hàng', path: '/m/banking' },
  { id: 'driving', label: 'Lái xe GPLX', path: '/m/driving' },
  { id: 'kids', label: 'Tiếng Anh nhí', path: '/m/kids' },
  { id: 'thpt', label: 'Luyện thi THPT', path: '/m/thpt' },
];

export const MobileAppInstallModal: React.FC<MobileAppInstallModalProps> = ({
  isOpen,
  onClose,
  initialVariant = 'all',
}) => {
  const { t } = useTranslation();
  const { canInstall, isIos, installPwa } = usePwaInstall();
  const [selectedVariant, setSelectedVariant] = useState<string>(initialVariant);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentPath = APP_VARIANTS.find(v => v.id === selectedVariant)?.path || '/m';
  const fullAppUrl = `${window.location.origin}${currentPath}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors"
          aria-label={t('common.close', 'Đóng')}
        >
          <X size={18} />
        </button>

        {/* Tiêu đề & Icon */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
            <Smartphone size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              {t('mobileModal.title', 'Ứng Dụng Di Động Aegis')}
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PWA 60fps
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('mobileModal.subtitle', 'Trải nghiệm mượt mà, cảm ứng gốc & luyện thi ngoại tuyến 100%')}
            </p>
          </div>
        </div>

        {/* Bộ chọn phân hệ ngành */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
            {t('mobileModal.selectDomain', 'Chọn chuyên đề di động:')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {APP_VARIANTS.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v.id)}
                className={`px-3 py-1 text-xs rounded-xl font-medium transition-all ${
                  selectedVariant === v.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Khu vực trung tâm: QR Code & Hướng dẫn */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 mb-5 items-center">
          {/* Mã QR */}
          <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-inner mx-auto">
            <QRCodeSVG value={fullAppUrl} size={140} level="M" />
            <span className="text-[10px] font-bold text-slate-600 mt-1.5">
              {t('mobileModal.scanToOpen', 'Quét để mở trên điện thoại')}
            </span>
          </div>

          {/* 3 Trụ cột Năng lực & Hướng dẫn */}
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <Zap size={15} className="text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Cảm ứng 60fps</strong>: Thao tác kéo-thả ghép nối, sắp xếp quy trình nhạy bén.</span>
            </div>
            <div className="flex items-start gap-2">
              <WifiOff size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Ngoại tuyến 100%</strong>: Tải bộ đề về IndexedDB, thi không cần mạng/4G.</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck size={15} className="text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>Zero-Friction PWA</strong>: Cài đặt tức thì không cần qua App Store cồng kềnh.</span>
            </div>
          </div>
        </div>

        {/* Hướng dẫn riêng cho iOS */}
        {isIos && (
          <div className="mb-4 p-3 rounded-xl bg-sky-950/50 border border-sky-800/60 text-xs text-sky-200 flex items-start gap-2">
            <Share2 size={16} className="shrink-0 mt-0.5 text-sky-400" />
            <div>
              <strong>Cách cài trên iPhone/iPad</strong>: Mở bằng Safari $\rightarrow$ bấm nút <strong>Chia sẻ (Share)</strong> $\rightarrow$ chọn <strong>&quot;Thêm vào MH chính&quot;</strong>.
            </div>
          </div>
        )}

        {/* Nút tác vụ chân trang */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? t('common.copied', 'Đã chép link') : t('mobileModal.copyLink', 'Sao chép Link')}</span>
          </button>

          <div className="flex items-center gap-2">
            {canInstall && (
              <button
                onClick={installPwa}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <Download size={14} />
                <span>{t('mobileModal.installNow', 'Cài Đặt Ngay (WebAPK)')}</span>
              </button>
            )}

            <a
              href={currentPath}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <ExternalLink size={14} />
              <span>{t('mobileModal.openMobileView', 'Mở Giao Diện Mobile')}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

