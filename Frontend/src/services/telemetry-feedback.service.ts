import api from './api';

export interface FeedbackAttachment {
  url: string;
  fileName: string;
  kind: 'image' | 'video' | 'audio' | 'file';
  sizeBytes: number;
}

export interface WishlistFeedbackItem {
  id: string;
  authorName: string;
  category: string;
  title: string;
  description: string;
  attachments?: FeedbackAttachment[];
  upvotesCount: number;
  status: string;
  adminResponse?: string;
  createdAt: string;
  hasUpvoted: boolean;
}

export interface FeedbackSubmitPayload {
  category: string;
  title: string;
  description: string;
  authorName?: string;
  authorEmail?: string;
  attachments?: FeedbackAttachment[];
}

export const telemetryFeedbackService = {
  // 1. Ghi nhận lượt xem (Debounced / Rate-limited)
  async trackView(targetType: string, targetId: string): Promise<number> {
    try {
      const res = await api.post('/api/interactions/track', { targetType, targetId });
      return res.data?.viewCount ?? 0;
    } catch {
      return 0;
    }
  },

  // 2. Tương tác Like / Dislike (Idempotent toggle)
  async react(targetType: string, targetId: string, reaction: 'LIKE' | 'DISLIKE') {
    const res = await api.post('/api/interactions/react', { targetType, targetId, reaction });
    return res.data;
  },

  // 3. Chấm sao đánh giá 1-5 sao
  async rate(targetType: string, targetId: string, rating: number, comment?: string) {
    const res = await api.post('/api/interactions/rate', { targetType, targetId, rating, comment });
    return res.data;
  },

  // 4. Báo lỗi câu hỏi hoặc đề thi
  async flag(targetType: string, targetId: string, reason: string, comment?: string) {
    const res = await api.post('/api/interactions/flag', { targetType, targetId, reason, comment });
    return res.data;
  },

  // 5. Lấy bảng nguyện vọng và ý tưởng từ cộng đồng
  async getFeedbackBoard(category?: string, status?: string): Promise<WishlistFeedbackItem[]> {
    const res = await api.get('/api/feedback/board', { params: { category, status } });
    return res.data;
  },

  // 6. Gửi nguyện vọng / ý tưởng mới
  async submitFeedback(payload: FeedbackSubmitPayload) {
    const res = await api.post('/api/feedback/submit', payload);
    return res.data;
  },

  // 6B. Tải lên ảnh / video / audio / tài liệu đính kèm
  async uploadFeedbackMedia(file: File): Promise<FeedbackAttachment> {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post<FeedbackAttachment>('/api/feedback/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // 7. Bình chọn Upvote (+1) cho ý tưởng
  async upvoteFeedback(id: string) {
    const res = await api.post(`/api/feedback/${id}/upvote`);
    return res.data;
  },
};
