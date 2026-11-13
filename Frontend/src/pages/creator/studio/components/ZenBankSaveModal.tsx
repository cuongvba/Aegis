import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { X, Check, Copy, ExternalLink, Database, BookOpen, Download } from 'lucide-react';
import { ZenBankSaveResult } from '../types/zen-studio.types';
import { UniversalSocialShareBar } from './UniversalSocialShareBar';

interface ZenBankSaveModalProps {
  result: ZenBankSaveResult;
  onClose: () => void;
}

export const ZenBankSaveModal: React.FC<ZenBankSaveModalProps> = ({ result, onClose }) => {
  const { t } = useTranslation('creator');
  const [copiedLink, setCopiedLink] = useState(false);
  const [customHost, setCustomHost] = useState(() => localStorage.getItem('aegis_custom_lan_host') || '');
  const [showHostInput, setShowHostInput] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const baseOrigin = customHost.trim()
    ? (customHost.startsWith('http') ? customHost.trim() : `http://${customHost.trim()}`)
    : window.location.origin;

  const fullPracticeUrl = baseOrigin + result.practiceUrl;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullPracticeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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
      ctx.fillText('AEGIS GLOBAL • HOMEWORK ASSIGNMENT', 300, 530);
      ctx.fillStyle = '#059669';
      ctx.font = '900 36px monospace';
      ctx.fillText(result.topicCode, 300, 585);
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Scan QR with Camera/Zalo to start practice', 300, 630);
      const downloadLink = document.createElement('a');
      downloadLink.download = `Aegis-Assignment-${result.topicCode}.png`;
      downloadLink.href = canvas.toDataURL('image/png');
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const cfg = result.homeworkConfig;
  const modeLabel = cfg?.mode === 'kids'
    ? '🎮 Kid Mode'
    : cfg?.mode === 'exam'
    ? '⏱️ Strict Exam'
    : cfg?.mode === 'paper'
    ? '📝 Paper Mode'
    : '📚 Study Mode';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-emerald-500/30 p-5 md:p-7 shadow-2xl text-center my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          title={t('bankSave.close')}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-2">
          <Database className="w-6 h-6" />
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-white mb-1">
          {t('bankSave.modalTitle')}
        </h3>
        <p className="text-xs text-slate-300 mb-3">
          {result.message || t('bankSave.modalSubtitle', { count: result.questionCount })}
        </p>

        {/* Mã QR Code & Công cụ Tải / Đổi IP LAN */}
        <div className="flex flex-col items-center mb-2">
          <div ref={qrRef} className="inline-block p-3 bg-white rounded-2xl shadow-xl shadow-emerald-950/50 mb-2 border border-slate-200">
            <QRCodeSVG value={fullPracticeUrl} size={140} level="M" includeMargin={true} />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl px-3 py-1 flex items-center gap-2">
              <span className="text-[10px] text-amber-300 font-bold uppercase">Mã PIN:</span>
              <span className="font-mono text-xs font-black text-amber-400 tracking-widest">{result.topicCode.slice(0, 8)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={handleDownloadQr}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> {t('bankSave.downloadQr')}
            </button>
            <button
              onClick={() => setShowHostInput(!showHostInput)}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition"
              title="Đổi IP để điện thoại học sinh quét được"
            >
              ⚙️ {window.location.hostname === 'localhost' ? t('bankSave.changeHost') : t('bankSave.domainOrIp')}
            </button>
          </div>

          {showHostInput && (
            <div className="mt-2 w-full max-w-sm p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-left text-xs shadow-xl animate-fadeIn">
              <label className="text-[10px] text-slate-300 font-bold block mb-1">
                {t('bankSave.lanHint')}
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
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
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
            </div>
          )}
        </div>

        {/* Khung sao chép đường link trực tiếp */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-2.5 mb-3 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={fullPracticeUrl}
            className="flex-1 bg-transparent text-xs text-emerald-300 font-mono truncate focus:outline-none select-all"
          />
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors shrink-0"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? t('bankSave.copied') : t('bankSave.copyLink')}</span>
          </button>
        </div>

        {/* Thông tin cấu hình đề thi */}
        <div className="bg-slate-950/60 rounded-xl border border-emerald-500/20 p-2.5 mb-3 text-left space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">{t('bankSave.topicCode')}</span>
            <span className="font-mono font-bold text-emerald-400">{result.topicCode}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">{t('bankSave.questionCount')}</span>
            <span className="font-bold text-white">{result.questionCount}</span>
          </div>
          {cfg && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{t('bankSave.practiceMode')}</span>
                <span className="font-semibold text-emerald-300">{modeLabel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{t('bankSave.duration')}</span>
                <span className="text-slate-200">
                  {cfg.timeLimitMin === 0 ? t('bankSave.unlimitedTime') : t('bankSave.minutes', { count: cfg.timeLimitMin })}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center">
            <span className="text-slate-400">{t('bankSave.storageMode')}</span>
            <span className="text-indigo-300 font-medium">{t('bankSave.storageDesc')}</span>
          </div>
        </div>

        {/* Omni-Channel Social Sharing */}
        <div className="mb-3">
          <UniversalSocialShareBar
            title={`[BÀI TẬP VỀ NHÀ] ${result.topicCode}`}
            url={fullPracticeUrl}
            summaryText={`${result.questionCount} câu hỏi • ${modeLabel}`}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <a
            href={result.practiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>{t('bankSave.openPractice')}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="/creator/topics"
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <span>🗂️ ZenTopics</span>
            </a>
            <a
              href={`/team?topicCode=${encodeURIComponent(result.topicCode)}`}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <span>👥 Quản Lý Học Viên</span>
            </a>
          </div>
          <button
            onClick={onClose}
            className="w-full py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            {t('bankSave.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
