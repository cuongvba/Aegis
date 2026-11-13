import React, { useState } from 'react';
import { X, Send, Calendar, Clock, ShieldCheck, Shuffle, Copy, Check, QrCode, Sparkles, BookOpen } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import type { TeamAssignableTopicNode } from '../hooks/useTeamManagement';

interface ClassroomAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle: string;
  topics: TeamAssignableTopicNode[];
  onAssignExam: (payload: {
    topicCode: string;
    deadline?: string;
    durationMinutes?: number;
    adaptiveMode: boolean;
    antiCheat: boolean;
    shuffleOptions: boolean;
  }) => Promise<void>;
}

export const ClassroomAssignmentModal: React.FC<ClassroomAssignmentModalProps> = ({
  isOpen,
  onClose,
  classNameTitle,
  topics,
  onAssignExam,
}) => {
  const { t } = useTranslation();
  const [selectedTopicCode, setSelectedTopicCode] = useState<string>(topics[0]?.code || '');
  const [deadlinePreset, setDeadlinePreset] = useState<'24h' | '3d' | '1w' | 'none'>('3d');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [adaptiveMode, setAdaptiveMode] = useState<boolean>(true);
  const [antiCheat, setAntiCheat] = useState<boolean>(true);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [assignedLink, setAssignedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDispatch = async () => {
    if (!selectedTopicCode) return;
    setSubmitting(true);
    try {
      await onAssignExam({
        topicCode: selectedTopicCode,
        durationMinutes,
        adaptiveMode,
        antiCheat,
        shuffleOptions,
      });
      const link = `${window.location.origin}/practice?topic=${encodeURIComponent(selectedTopicCode)}&cls=${encodeURIComponent(classNameTitle)}`;
      setAssignedLink(link);
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi giao bài tập cho lớp.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!assignedLink) return;
    navigator.clipboard.writeText(assignedLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Tiêu đề Modal */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Send size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              {t('assignmentModal.title', '1-Click Giao Đề Lớp Học')}
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Sư Phạm 4.0
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Lớp mục tiêu: <strong className="text-slate-200">{classNameTitle}</strong>
            </p>
          </div>
        </div>

        {assignedLink ? (
          /* Trạng thái Giao bài thành công */
          <div className="space-y-4 py-2 text-center animate-in zoom-in-95 duration-200">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Check size={32} />
            </div>
            <h3 className="text-base font-extrabold text-white">Đã Giao Đề Thành Công Xuống Cả Lớp!</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Học sinh trong lớp đã nhận được bài tập. Thầy/Cô có thể gửi link trực tiếp hoặc chia sẻ mã QR vào nhóm Zalo/Telegram của lớp.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 my-3">
              <div className="p-2 bg-white rounded-xl shadow-inner">
                <QRCodeSVG value={assignedLink} size={110} level="M" />
              </div>
              <div className="text-start space-y-2 flex-1">
                <div className="text-[11px] font-bold text-slate-400">Liên kết làm bài trực tiếp:</div>
                <div className="p-2 rounded-lg bg-slate-900 text-xs font-mono text-cyan-300 break-all border border-slate-800">
                  {assignedLink}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition cursor-pointer"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copied ? 'Đã sao chép vào bộ nhớ tạm' : 'Sao chép Link Zalo/Lớp'}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              Hoàn tất &amp; Đóng
            </button>
          </div>
        ) : (
          /* Form cấu hình sư phạm */
          <div className="space-y-4">
            {/* 1. Chọn đề / chủ đề */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                1. Chọn Chuyên Đề / Bài Thi Khảo Thí:
              </label>
              <select
                value={selectedTopicCode}
                onChange={(e) => setSelectedTopicCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                {topics.map((top) => (
                  <option key={top.id} value={top.code}>
                    [{top.code}] {top.name} ({top.totalQuestionCount} câu hỏi)
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Cấu hình thời gian & Hạn nộp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-400" />
                  <span>Thời gian làm bài:</span>
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value={15}>15 phút (Bài kiểm tra nhanh)</option>
                  <option value={45}>45 phút (Kiểm tra 1 tiết)</option>
                  <option value={90}>90 phút (Thi học kỳ / ĐGNL)</option>
                  <option value={0}>Không giới hạn (Tự học tự do)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-indigo-400" />
                  <span>Hạn chót nộp bài:</span>
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['24h', '3d', '1w', 'none'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDeadlinePreset(p)}
                      className={`py-1.5 text-[11px] rounded-lg font-bold transition-all ${
                        deadlinePreset === p
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {p === '24h' ? '24 Giờ' : p === '3d' ? '3 Ngày' : p === '1w' ? '1 Tuần' : 'Tự do'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Tùy chọn Sư phạm & Giám sát */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                <span className="flex items-center gap-2 text-slate-200 font-semibold">
                  <Sparkles size={14} className="text-cyan-400" />
                  <span>Chế độ Luyện thi Thích ứng (IRT CAT thích ứng theo lực học)</span>
                </span>
                <input
                  type="checkbox"
                  checked={adaptiveMode}
                  onChange={(e) => setAdaptiveMode(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                <span className="flex items-center gap-2 text-slate-200 font-semibold">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Giám sát chống gian lận (Ghi nhận số lần chuyển Tab &amp; Cửa sổ)</span>
                </span>
                <input
                  type="checkbox"
                  checked={antiCheat}
                  onChange={(e) => setAntiCheat(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                <span className="flex items-center gap-2 text-slate-200 font-semibold">
                  <Shuffle size={14} className="text-amber-400" />
                  <span>Xáo trộn ngẫu nhiên vị trí các phương án A/B/C/D</span>
                </span>
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-900 border-slate-700"
                />
              </label>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDispatch}
                disabled={submitting || !selectedTopicCode}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50 transition cursor-pointer"
              >
                <Send size={14} />
                <span>{submitting ? 'Đang giao bài...' : 'Xác Nhận & Giao Đề Cho Cả Lớp'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

