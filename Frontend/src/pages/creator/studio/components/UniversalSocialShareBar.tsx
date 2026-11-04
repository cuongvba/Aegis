import React, { useState } from 'react';
import { Copy, Check, Share2, MessageSquare, Send, Globe } from 'lucide-react';

export interface UniversalSocialShareBarProps {
  title: string;
  url: string;
  pinCode?: string;
  summaryText?: string;
  compact?: boolean;
}

export const UniversalSocialShareBar: React.FC<UniversalSocialShareBarProps> = ({
  title,
  url,
  pinCode,
  summaryText,
  compact = false,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Soạn thảo nội dung chia sẻ chuẩn mực sư phạm
  const formattedMessage = [
    `📢 BÀI THI / ĐẤU TRƯỜNG TRỰC TUYẾN: ${title}`,
    pinCode ? `🔑 Mã PIN tham gia: ${pinCode}` : '',
    summaryText ? `📝 Thông tin: ${summaryText}` : '',
    `👉 Bấm link để vào làm ngay (Không cần tạo nick):`,
    url,
    `\n🌟 Được phát triển trên nền tảng Khảo thí Aegis Global.`,
  ]
    .filter(Boolean)
    .join('\n');

  const triggerFeedback = (key: string, msg: string) => {
    setCopiedKey(key);
    setFeedbackNotice(msg);
    setTimeout(() => {
      setCopiedKey(null);
      setFeedbackNotice(null);
    }, 3500);
  };

  // 1. Zalo: Giải quyết triệt để lỗi "Tài khoản không tồn tại"
  // Zalo không có web-share public hợp lệ cho localhost/non-whitelisted domain.
  // Giải pháp chuẩn: Copy nội dung vào clipboard + mở Zalo Web để dán (Ctrl+V)
  const handleShareZalo = async () => {
    try {
      await navigator.clipboard.writeText(formattedMessage);
      triggerFeedback('zalo', 'Đã sao chép nội dung! Đang mở Zalo Web để bạn dán (Ctrl+V) vào nhóm lớp...');
      setTimeout(() => {
        window.open('https://chat.zalo.me/', '_blank');
      }, 600);
    } catch {
      window.open('https://chat.zalo.me/', '_blank');
    }
  };

  // 2. Facebook Share
  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(formattedMessage)}`;
    window.open(fbUrl, '_blank', 'width=640,height=580');
  };

  // 3. Telegram Share
  const handleShareTelegram = () => {
    const teleUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(formattedMessage)}`;
    window.open(teleUrl, '_blank', 'width=640,height=580');
  };

  // 4. Google Classroom
  const handleShareClassroom = () => {
    const gclassUrl = `https://classroom.google.com/share?url=${encodeURIComponent(url)}`;
    window.open(gclassUrl, '_blank', 'width=680,height=600');
  };

  // 5. Microsoft Teams
  const handleShareTeams = () => {
    const teamsUrl = `https://teams.microsoft.com/share?href=${encodeURIComponent(url)}&msgText=${encodeURIComponent(formattedMessage)}`;
    window.open(teamsUrl, '_blank', 'width=680,height=600');
  };

  // 6. Native Web Share API (Hỗ trợ iOS Safari, Android Chrome, Windows 11)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: formattedMessage,
          url,
        });
        triggerFeedback('native', 'Đã mở bảng chia sẻ hệ thống!');
        return;
      } catch (err) {
        // User cancelled or share failed
      }
    }
    // Fallback: Copy link
    await navigator.clipboard.writeText(url);
    triggerFeedback('link', 'Đã sao chép liên kết vào bộ nhớ tạm!');
  };

  // 7. Copy toàn bộ lời mời
  const handleCopyFullInvite = async () => {
    await navigator.clipboard.writeText(formattedMessage);
    triggerFeedback('invite', 'Đã sao chép trọn vẹn lời mời & PIN!');
  };

  return (
    <div className="w-full space-y-2">
      {/* Feedback banner */}
      {feedbackNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs text-center font-medium animate-fadeIn">
          {feedbackNotice}
        </div>
      )}

      {/* Grid các kênh chia sẻ đa mạng xã hội */}
      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'} gap-2`}>
        {/* Zalo */}
        <button
          type="button"
          onClick={handleShareZalo}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          title="Sao chép nội dung & mở Zalo Web"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-blue-600 font-black text-[9px]">
            Z
          </span>
          <span>{copiedKey === 'zalo' ? 'Đã Sao Chép!' : 'Gửi Nhóm Zalo'}</span>
        </button>

        {/* Facebook */}
        <button
          type="button"
          onClick={handleShareFacebook}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#1877F2]/90 hover:bg-[#1877F2] text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          title="Chia sẻ lên Facebook / Messenger"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#1877F2] font-black text-[10px]">
            f
          </span>
          <span>Facebook</span>
        </button>

        {/* Telegram */}
        <button
          type="button"
          onClick={handleShareTelegram}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#229ED9]/90 hover:bg-[#229ED9] text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          title="Gửi vào nhóm Telegram"
        >
          <Send className="w-3.5 h-3.5 text-white" />
          <span>Telegram</span>
        </button>

        {/* Google Classroom */}
        <button
          type="button"
          onClick={handleShareClassroom}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          title="Giao bài vào lớp học Google Classroom"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-emerald-900 font-black text-[9px]">
            G
          </span>
          <span>Classroom</span>
        </button>

        {/* Microsoft Teams */}
        <button
          type="button"
          onClick={handleShareTeams}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#505AC9]/90 hover:bg-[#505AC9] text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          title="Giao bài vào kênh Microsoft Teams"
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[#505AC9] font-black text-[9px]">
            T
          </span>
          <span>MS Teams</span>
        </button>

        {/* Native Share / Copy All */}
        {typeof navigator !== 'undefined' && 'share' in navigator ? (
          <button
            type="button"
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            title="Mở menu chia sẻ hệ thống (AirDrop, Gmail, Viber, Slack...)"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Kênh Khác...</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCopyFullInvite}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            title="Sao chép toàn bộ tin nhắn lời mời"
          >
            {copiedKey === 'invite' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-purple-400" />
            )}
            <span>{copiedKey === 'invite' ? 'Đã Chép!' : 'Chép Lời Mời'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

