import React, { useState, useEffect } from 'react';
import { X, Sparkles, ThumbsUp, MessageSquarePlus, CheckCircle2, Clock, Wrench, Send, AlertTriangle } from 'lucide-react';
import { telemetryFeedbackService, WishlistFeedbackItem } from '@/services/telemetry-feedback.service';

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

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('FEATURE_REQUEST');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
    if (isOpen) {
      fetchItems();
      setSubmitSuccess(false);
    }
  }, [isOpen, selectedCategory]);

  const handleUpvote = async (id: string) => {
    try {
      const res = await telemetryFeedbackService.upvoteFeedback(id);
      if (res?.success) {
        setItems(prev => prev.map(item => item.id === id ? {
          ...item,
          upvotesCount: res.upvotesCount,
          hasUpvoted: res.hasUpvoted
        } : item));
      }
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setIsSubmitting(true);
    try {
      await telemetryFeedbackService.submitFeedback({
        category,
        title,
        description,
        authorName,
        authorEmail,
      });
      setSubmitSuccess(true);
      setTitle('');
      setDescription('');
      setTimeout(() => {
        setActiveTab('board');
        setSubmitSuccess(false);
        fetchItems();
      }, 1500);
    } catch (err: any) {
      alert('Lỗi gửi góp ý: ' + (err.message || 'Vui lòng thử lại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-500 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400">
                <Sparkles size={18} />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Aegis User Voice & Wishlist Board
              </h2>
              <p className="text-xs text-slate-400">Đóng góp ý tưởng & đồng hành kiến tạo hệ sinh thái hoàn hảo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-4">
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
            <span>✨ Gửi Góp Ý / Yêu Cầu Mới</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'board' ? (
            <>
              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 pb-2">
                {CATEGORIES.map(c => (
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

              {loading ? (
                <div className="py-12 text-center text-sm text-slate-400">Đang tải bảng ý tưởng...</div>
              ) : items.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">Chưa có ý tưởng nào trong phân loại này. Hãy là người đầu tiên đóng góp!</div>
              ) : (
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition flex items-start gap-4">
                      {/* Upvote Button */}
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

                      {/* Content */}
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {item.category}
                          </span>
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
                        <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
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
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto py-2">
              {submitSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} /> Góp ý đã gửi thành công! Đang chuyển về bảng nguyện vọng...
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phân loại góp ý</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                >
                  <option value="FEATURE_REQUEST">💡 Đề xuất tính năng mới</option>
                  <option value="CURRICULUM_CONTENT">📚 Bổ sung tài liệu / Bộ sách / Ma trận đề</option>
                  <option value="UX_IMPROVEMENT">🎨 Cải tiến giao diện & Tiện ích sử dụng</option>
                  <option value="BUG_REPORT">🚩 Báo lỗi cần khắc phục</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tiêu đề ý tưởng *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Muốn xuất file đề thi xáo trộn 4 mã đề kèm phiếu tô..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mô tả chi tiết / Tình huống giảng dạy *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Mô tả cụ thể tính năng hoạt động ra sao, giúp ích gì cho Thầy/Cô và học sinh..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tên Thầy/Cô / Người gửi</label>
                  <input
                    type="text"
                    placeholder="VD: Thầy Nam (Toán)"
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email nhận thông báo kết quả</label>
                  <input
                    type="email"
                    placeholder="thaynam@gmail.com"
                    value={authorEmail}
                    onChange={e => setAuthorEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !description.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition cursor-pointer"
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Đang gửi...' : 'Đăng Ý Tưởng Lên Bảng Nguyện Vọng'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
