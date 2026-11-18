import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, ThumbsUp, MessageSquarePlus, FileText, ExternalLink } from 'lucide-react';
import { telemetryFeedbackService, WishlistFeedbackItem } from '@/services/telemetry-feedback.service';
import { FeedbackSubmitForm } from './FeedbackSubmitForm';

interface UserVoiceFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'FEATURE_REQUEST', label: '💡 Tính năng mới' },
  { key: 'CURRICULUM_CONTENT', label: '📚 Sách & Nội dung' },
  { key: 'UX_IMPROVEMENT', label: '🎨 Trải nghiệm UX' },
  { key: 'BUG_REPORT', label: '🚩 Báo lỗi hệ thống' },
];

export const UserVoiceFeedbackModal: React.FC<UserVoiceFeedbackModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'board' | 'submit'>('board');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [items, setItems] = useState<WishlistFeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await telemetryFeedbackService.getFeedbackBoard(selectedCategory);
      setItems(data || []);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchItems();
  }, [isOpen, selectedCategory]);

  const handleUpvote = async (id: string) => {
    try {
      const res = await telemetryFeedbackService.upvoteFeedback(id);
      if (res?.success) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, upvotesCount: res.upvotesCount, hasUpvoted: res.hasUpvoted } : item
          )
        );
      }
    } catch {
      // ignore
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-500 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400">
                <Sparkles size={18} />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Aegis User Voice &amp; Wishlist Board</h2>
              <p className="text-xs text-slate-400">Đóng góp ý tưởng (Text + Ảnh/Video/Tài liệu) &amp; kiến tạo hệ sinh thái</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-4 shrink-0">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('board')}
              className={`pb-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
                activeTab === 'board' ? 'border-amber-400 text-amber-300' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              💡 Bảng Nguyện Vọng ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('submit')}
              className={`pb-2.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'submit' ? 'border-indigo-400 text-indigo-300' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquarePlus size={14} />
              <span>✨ Gửi Ý Tưởng &amp; Đính Kèm File</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'board' ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setSelectedCategory(c.key)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                        selectedCategory === c.key
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/60'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('submit')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-xs font-black shadow-md hover:brightness-110 transition"
                >
                  <MessageSquarePlus size={13} /> Đóng góp ý tưởng
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-sm text-slate-400">Đang tải bảng ý tưởng...</div>
              ) : items.length === 0 ? (
                <div className="py-10 text-center space-y-4">
                  <p className="text-slate-400 text-sm">Chưa có ý tưởng nào trong phân loại này. Hãy là người đầu tiên đóng góp!</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('submit')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-xs sm:text-sm font-black shadow-lg hover:brightness-110 transition"
                  >
                    <MessageSquarePlus size={16} /> Nhập Ý Tưởng &amp; Đính Kèm Media/File Ngay
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition flex items-start gap-4">
                      <button
                        onClick={() => handleUpvote(item.id)}
                        className={`flex flex-col items-center justify-center min-w-[48px] py-2 px-2 rounded-xl border transition ${
                          item.hasUpvoted
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                        title="Bấm để bình chọn (+1 Upvote)"
                      >
                        <ThumbsUp size={16} className={item.hasUpvoted ? 'fill-amber-400 text-amber-400' : ''} />
                        <span className="text-xs font-black mt-1 font-mono">{item.upvotesCount}</span>
                      </button>

                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">{item.category}</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            item.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            item.status === 'IN_PROGRESS' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
                            item.status === 'PLANNED' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {item.status === 'RESOLVED' ? '✅ Đã bàn giao' :
                             item.status === 'IN_PROGRESS' ? '⚡ Đang phát triển' :
                             item.status === 'PLANNED' ? '📌 Đã lên lộ trình' : '⏳ Chờ xem xét'}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-auto">{item.authorName}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-snug">{item.title}</h4>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{item.description}</p>

                        {item.attachments && item.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {item.attachments.map((att, idx) =>
                              att.kind === 'image' ? (
                                <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-400">
                                  <img src={att.url} alt={att.fileName} className="max-h-36 object-cover" />
                                </a>
                              ) : att.kind === 'video' ? (
                                <video key={idx} src={att.url} controls className="max-h-40 rounded-lg border border-slate-700" />
                              ) : att.kind === 'audio' ? (
                                <audio key={idx} src={att.url} controls className="h-9" />
                              ) : (
                                <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-cyan-300 hover:border-cyan-400">
                                  <FileText size={13} /> {att.fileName} <ExternalLink size={11} />
                                </a>
                              )
                            )}
                          </div>
                        )}

                        {item.adminResponse && (
                          <div className="mt-2 text-xs p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-200">
                            <span className="font-bold text-indigo-400">Phản hồi từ No.1: </span>
                            {item.adminResponse}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <FeedbackSubmitForm
              defaultCategory={selectedCategory}
              onSubmitted={() => {
                setActiveTab('board');
                fetchItems();
              }}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
