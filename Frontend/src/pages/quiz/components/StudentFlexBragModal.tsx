import React, { useRef, useState } from 'react';
import { X, Trophy, Share2, Copy, Check, Download, Zap, Flame, Swords, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface StudentFlexBragModalProps {
  score: number;
  totalCount: number;
  timeSpent: string;
  examTitle?: string;
  onClose: () => void;
}

export const StudentFlexBragModal: React.FC<StudentFlexBragModalProps> = ({
  score,
  totalCount,
  timeSpent,
  examTitle = 'Đấu Trường Trí Tuệ Toàn Cầu',
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Tính percentile và danh hiệu gamified
  const percentile = score >= 90 ? 'Top 1.5%' : score >= 80 ? 'Top 5%' : score >= 65 ? 'Top 15%' : 'Top 30%';
  const badgeTitle = score >= 90 ? 'ĐẠI KIỆN TƯỚNG' : score >= 80 ? 'CHIẾN THẦN THẦN TỐC' : 'DŨNG SĨ TRI THỨC';
  const challengeCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const challengeUrl = `${window.location.origin}/arena/join?challenge=${challengeCode}&ref=brag`;

  const inviteMessage = `🔥 Tôi vừa đạt ${score}/100 điểm (${percentile} Toàn Quốc) tại "${examTitle}" trong ${timeSpent}! Dám thi xem ai giải nhanh hơn tôi không? 👉 Click vào solo ngay: ${challengeUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(challengeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteMessage);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleShareZalo = async () => {
    try {
      await navigator.clipboard.writeText(inviteMessage);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
      window.open('https://chat.zalo.me/', '_blank');
    } catch {
      window.open('https://chat.zalo.me/', '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/30 p-5 sm:p-6 shadow-2xl text-center text-slate-100 overflow-hidden">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── 1. HOLOGRAPHIC NEON CYBER CARD (Visual Bragging) ── */}
        <div
          ref={cardRef}
          className="relative rounded-2xl bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border-2 border-amber-400/60 p-5 shadow-[0_0_30px_rgba(245,158,11,0.2)] mb-4 overflow-hidden"
        >
          {/* Background Aura */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300 tracking-widest uppercase mb-2">
              <Trophy className="w-3 h-3 text-amber-400" />
              {badgeTitle}
            </div>

            <h4 className="text-xs font-bold text-slate-300 truncate max-w-[260px] mb-3">
              {examTitle}
            </h4>

            {/* Điểm số khổng lồ */}
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-5xl font-black font-mono tracking-tight bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                {score}
              </span>
              <span className="text-sm font-bold text-slate-400">/100</span>
            </div>

            {/* Percentile Pill */}
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black">
                <Flame className="w-3 h-3 fill-current" /> {percentile} Toàn Quốc
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold font-mono">
                <Zap className="w-3 h-3 text-amber-400" /> {timeSpent}
              </span>
            </div>

            {/* QR Code Thách Đấu Solo (Level M + Quiet Zone chuẩn) */}
            <div className="p-2.5 bg-white rounded-2xl shadow-xl mb-2 flex items-center justify-center">
              <QRCodeSVG value={challengeUrl} size={100} level="M" includeMargin={true} />
            </div>
            <span className="text-[10px] text-amber-300 font-mono font-semibold">
              Quét mã QR để thách đấu solo với tôi
            </span>
          </div>
        </div>

        {/* ── 2. VIRAL SHARING BAR (Zalo, Copy Message, Copy Link) ── */}
        <div className="space-y-2 mb-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleShareZalo}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md transition active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Gửi Nhóm Zalo</span>
            </button>
            <button
              onClick={handleCopyInvite}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-900/80 hover:bg-purple-800 border border-purple-500/40 text-purple-200 text-xs font-black transition active:scale-95"
            >
              {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Swords className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedInvite ? 'Đã Sao Chép Kèo!' : 'Kèo Thách Đấu'}</span>
            </button>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Đã sao chép link thách đấu!' : 'Sao chép đường dẫn solo bạn bè'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

