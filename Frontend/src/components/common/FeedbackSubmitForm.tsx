import React, { useRef, useState } from 'react';
import { CheckCircle2, Send, Paperclip, Image as ImageIcon, FileText, Trash2, Loader2 } from 'lucide-react';
import { FeedbackAttachment, telemetryFeedbackService } from '@/services/telemetry-feedback.service';

interface FeedbackSubmitFormProps {
  defaultCategory?: string;
  onSubmitted: () => void;
}

export const FeedbackSubmitForm: React.FC<FeedbackSubmitFormProps> = ({
  defaultCategory = 'FEATURE_REQUEST',
  onSubmitted,
}) => {
  const [category, setCategory] = useState(defaultCategory === 'ALL' ? 'FEATURE_REQUEST' : defaultCategory);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [attachments, setAttachments] = useState<FeedbackAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of arr) {
        const uploaded = await telemetryFeedbackService.uploadFeedbackMedia(file);
        setAttachments((prev) => [...prev, uploaded]);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể tải tệp đính kèm (tối đa 15MB).');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const f = items[i].getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      await uploadFiles(files);
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
        attachments,
      });
      setSubmitSuccess(true);
      setTitle('');
      setDescription('');
      setAttachments([]);
      setTimeout(() => {
        setSubmitSuccess(false);
        onSubmitted();
      }, 1100);
    } catch (err: any) {
      alert('Lỗi gửi góp ý: ' + (err?.message || 'Vui lòng thử lại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto py-1">
      {submitSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} /> Ý tưởng &amp; tài liệu đã gửi thành công! Đang chuyển về bảng nguyện vọng...
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">Phân loại góp ý</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
        >
          <option value="FEATURE_REQUEST">💡 Đề xuất tính năng mới</option>
          <option value="CURRICULUM_CONTENT">📚 Bổ sung tài liệu / Bộ sách / Ma trận đề</option>
          <option value="UX_IMPROVEMENT">🎨 Cải tiến giao diện &amp; Tiện ích sử dụng</option>
          <option value="BUG_REPORT">🚩 Báo lỗi cần khắc phục</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">Tiêu đề ý tưởng *</label>
        <input
          type="text"
          required
          placeholder="VD: Đề xuất nâng cấp giao diện luyện tập hoặc bổ sung tài liệu..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-300 mb-1">
          Mô tả chi tiết * <span className="font-normal text-slate-400">(Hỗ trợ Ctrl+V dán ảnh trực tiếp)</span>
        </label>
        <textarea
          required
          rows={4}
          placeholder="Nhập mô tả chi tiết, tình huống thực tế hoặc dán ảnh chụp màn hình (Ctrl+V)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onPaste={handlePaste}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none resize-y"
        />
      </div>

      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Paperclip size={14} className="text-cyan-400" />
            Đính kèm Ảnh / Video / Audio / Tài liệu (tối đa 15MB/tệp)
          </span>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
            {isUploading ? 'Đang tải lên...' : 'Chọn Media / File'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.docx,.xlsx,.txt,.mp3,.wav,.mp4,.webm"
            className="hidden"
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
        </div>

        {attachments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {attachments.map((att, idx) => (
              <div key={`${att.url}-${idx}`} className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 p-2">
                {att.kind === 'image' ? (
                  <img src={att.url} alt={att.fileName} className="w-10 h-10 rounded object-cover shrink-0 border border-slate-700" />
                ) : (
                  <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                    <FileText size={18} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-slate-200 truncate">{att.fileName}</div>
                  <div className="text-[10px] text-slate-400">{Math.max(1, Math.round(att.sizeBytes / 1024))} KB</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-1 text-slate-500 hover:text-rose-400"
                  title="Gỡ tệp"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Tên của bạn (Không bắt buộc)"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
        />
        <input
          type="email"
          placeholder="Email nhận phản hồi (Không bắt buộc)"
          value={authorEmail}
          onChange={(e) => setAuthorEmail(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || isUploading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:brightness-110 py-2.5 text-xs sm:text-sm font-black text-white shadow-lg transition disabled:opacity-50"
      >
        <Send size={15} />
        {isSubmitting ? 'Đang gửi đóng góp...' : 'Gửi Ý Tưởng & Đính Kèm Lên Bảng Nguyện Vọng'}
      </button>
    </form>
  );
};
