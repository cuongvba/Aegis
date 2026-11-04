import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, ExternalLink, Play, Share2, Download, MessageSquare, BarChart3 } from 'lucide-react';
import { ZenRoomLaunchResult } from '../types/zen-studio.types';
import { TeacherCohortDashboardModal } from './TeacherCohortDashboardModal';
import { UniversalSocialShareBar } from './UniversalSocialShareBar';

interface ZenRoomLauncherModalProps {
  room: ZenRoomLaunchResult;
  onClose: () => void;
}

export const ZenRoomLauncherModal: React.FC<ZenRoomLauncherModalProps> = ({ room, onClose }) => {
  const { t } = useTranslation('creator');
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showCohortDashboard, setShowCohortDashboard] = useState(false);
  const [customHost, setCustomHost] = useState(() => localStorage.getItem('aegis_custom_lan_host') || '');
  const [showHostInput, setShowHostInput] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const baseOrigin = customHost.trim()
    ? (customHost.startsWith('http') ? customHost.trim() : `http://${customHost.trim()}`)
    : window.location.origin;

  const fullJoinUrl = baseOrigin + room.joinUrl;

  const invitationMessage = `📢 BÀI THI / ĐẤU TRƯỜNG TRỰC TUYẾN: ${room.title}
🔑 Mã PIN: ${room.pinCode}
👉 Bấm vào link để vào làm ngay (Không cần tạo nick):
${fullJoinUrl}`;

  const handleCopyPin = () => { navigator.clipboard.writeText(room.pinCode); setCopiedPin(true); setTimeout(() => setCopiedPin(false), 2000); };
  const handleCopyLink = () => { navigator.clipboard.writeText(fullJoinUrl); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); };
  const handleCopyInvite = () => { navigator.clipboard.writeText(invitationMessage); setCopiedInvite(true); setTimeout(() => setCopiedInvite(false), 2000); };
  const handleShareZalo = () => { window.open(`https://zalo.me/share?url=${encodeURIComponent(fullJoinUrl)}&title=${encodeURIComponent(invitationMessage)}`, '_blank'); };

  const handleDownloadQr = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 600;
      canvas.height = 700;
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 75, 40, 450, 450);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AEGIS LIVE ARENA • ĐẤU TRƯỜNG', 300, 530);
      ctx.fillStyle = '#4f46e5';
      ctx.font = '900 38px monospace';
      ctx.fillText(`MÃ PIN: ${room.pinCode}`, 300, 585);
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('Quét mã bằng Camera/Zalo để vào thi ngay', 300, 630);
      const downloadLink = document.createElement('a');
      downloadLink.download = `Aegis-QR-${room.pinCode}.png`;
      downloadLink.href = canvas.toDataURL('image/png');
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-indigo-500/30 p-6 md:p-8 shadow-2xl text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-3">
            <Play className="w-6 h-6 fill-current" />
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
            {t('launcher.modalTitle')}
          </h3>
          <p className="text-xs md:text-sm text-slate-300 mb-4">
            {t('launcher.modalSubtitle')}
          </p>

          {/* QR Code Canvas (Độ tương phản cao, Level M quét siêu nhạy) */}
          <div className="flex flex-col items-center mb-4">
            <div ref={qrRef} className="inline-block p-4 bg-white rounded-3xl shadow-2xl shadow-indigo-950/60 mb-2 border-2 border-slate-200">
              <QRCodeSVG value={fullJoinUrl} size={180} level="M" includeMargin={true} />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              <button
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20"
              >
                <Download className="w-3.5 h-3.5" /> {t('launcher.downloadQrText', 'Tải ảnh mã QR in ra giấy')}
              </button>
              <button
                onClick={() => setShowHostInput(!showHostInput)}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 cursor-pointer"
                title="WiFi LAN IP"
              >
                ⚙️ {window.location.hostname === 'localhost' ? t('launcher.changeHost', 'Đổi IP WiFi') : t('launcher.domainOrIp', 'Tên miền/IP')}
              </button>
            </div>

            {showHostInput && (
              <div className="mt-2.5 w-full max-w-sm p-3 rounded-2xl bg-slate-950 border border-slate-700 text-left text-xs shadow-xl animate-fadeIn">
                <label className="text-[10px] text-slate-300 font-bold block mb-1">
                  Nhập IP máy tính trong mạng WiFi (Ví dụ: 192.168.1.15:3000):
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customHost}
                    onChange={(e) => {
                      setCustomHost(e.target.value);
                      localStorage.setItem('aegis_custom_lan_host', e.target.value);
                    }}
                    placeholder="192.168.1.xxx:3000"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                  {customHost && (
                    <button
                      onClick={() => {
                        setCustomHost('');
                        localStorage.removeItem('aegis_custom_lan_host');
                      }}
                      className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-amber-400/90 mt-1.5">
                  💡 Giúp học sinh quét mã bằng camera điện thoại kết nối ngay mà không bị chặn localhost!
                </p>
              </div>
            )}
          </div>

          {/* PIN Code Box */}
          <div className="bg-slate-950/80 rounded-2xl border border-indigo-500/40 p-4 mb-4">
            <div className="text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-0.5">
              {t('launcher.pinLabel')}
            </div>
            <div className="text-4xl md:text-5xl font-mono font-black tracking-widest text-white mb-3">
              {room.pinCode}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={handleCopyPin}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                {copiedPin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPin ? t('trialBanner.copied') : t('launcher.copyPin')}
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                {copiedLink ? t('trialBanner.copied') : t('launcher.copyLink')}
              </button>
            </div>
          </div>

          {/* ── OMNI-CHANNEL SOCIAL SHARING (ZALO, FB, TELEGRAM, CLASSROOM, TEAMS) ── */}
          <div className="mb-3">
            <UniversalSocialShareBar
              title={room.title}
              url={fullJoinUrl}
              pinCode={room.pinCode}
            />
          </div>

          {/* Nút Giám Sát Nhận Thức Lớp Học (Cohort Heatmap) */}
          <button
            onClick={() => setShowCohortDashboard(true)}
            className="w-full mb-3 py-2.5 px-4 rounded-xl border border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>📊 Giám Sát Nhận Thức Lớp Học (Live Cohort Heatmap)</span>
          </button>

          {/* Action Button */}
          <div className="flex flex-col gap-2">
            <a
              href={room.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              {t('launcher.openArena')}
            </a>
            <button
              onClick={onClose}
              className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              {t('launcher.close')}
            </button>
          </div>
        </div>
      </div>

      {showCohortDashboard && (
        <TeacherCohortDashboardModal
          examTitle={room.title}
          totalQuestions={10}
          onClose={() => setShowCohortDashboard(false)}
        />
      )}
    </>
  );
};
