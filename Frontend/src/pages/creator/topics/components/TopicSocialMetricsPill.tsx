import React, { useState } from 'react';
import { Eye, Heart, Star, GitFork } from 'lucide-react';
import type { BankTopic } from '@/pages/admin/questions/types';
import { telemetryFeedbackService } from '@/services/telemetry-feedback.service';

interface TopicSocialMetricsPillProps {
  topic: BankTopic;
  compact?: boolean;
}

export const TopicSocialMetricsPill: React.FC<TopicSocialMetricsPillProps> = ({ topic, compact = false }) => {
  const [likes, setLikes] = useState(topic.likeCount || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await telemetryFeedbackService.react('TOPIC', topic.id, 'LIKE');
      if (res?.success) {
        setLikes(res.likeCount ?? (hasLiked ? Math.max(0, likes - 1) : likes + 1));
        setHasLiked(res.currentStatus === 'LIKE');
      }
    } catch {
      // optimistic fallback
      setHasLiked(!hasLiked);
      setLikes(hasLiked ? Math.max(0, likes - 1) : likes + 1);
    } finally {
      setIsLiking(false);
    }
  };

  const views = topic.viewCount || 0;
  const rating = topic.ratingAverage && topic.ratingAverage > 0 ? topic.ratingAverage.toFixed(1) : '5.0';

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 text-[11px] font-mono font-medium text-slate-400">
        <span className="flex items-center gap-1 hover:text-cyan-400 transition-colors" title={`${views} lượt xem`}>
          <Eye size={12} className="text-cyan-400" />
          <span>{views > 999 ? `${(views / 1000).toFixed(1)}k` : views}</span>
        </span>
        <button
          type="button"
          onClick={handleToggleLike}
          className={`flex items-center gap-0.5 transition-colors cursor-pointer ${
            hasLiked ? 'text-rose-400 font-bold' : 'hover:text-rose-400'
          }`}
          title="Thích đề này"
        >
          <Heart size={12} className={hasLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
          <span>{likes}</span>
        </button>
        <span className="flex items-center gap-0.5 text-amber-400" title={`Đánh giá: ${rating}/5.0`}>
          <Star size={11} className="fill-amber-400 text-amber-400" />
          <span>{rating}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-950/70 border border-slate-800 text-xs font-mono">
      <span className="flex items-center gap-1 text-slate-400" title="Lượt xem / truy cập đề">
        <Eye size={13} className="text-sky-400" />
        <span>{views > 999 ? `${(views / 1000).toFixed(1)}k` : views}</span>
      </span>
      <span className="text-slate-700">|</span>
      <button
        type="button"
        onClick={handleToggleLike}
        className={`flex items-center gap-1 transition-all cursor-pointer ${
          hasLiked ? 'text-rose-400 font-bold scale-105' : 'text-slate-400 hover:text-rose-400'
        }`}
        title="Bấm để Thích / Bỏ thích"
      >
        <Heart size={13} className={hasLiked ? 'fill-rose-500 text-rose-500' : ''} />
        <span>{likes}</span>
      </button>
      <span className="text-slate-700">|</span>
      <span className="flex items-center gap-1 text-amber-400 font-semibold" title={`Điểm đánh giá: ${rating} sao`}>
        <Star size={12} className="fill-amber-400 text-amber-400" />
        <span>{rating}</span>
      </span>
      {(topic.forkCount ?? 0) > 0 && (
        <>
          <span className="text-slate-700">|</span>
          <span className="flex items-center gap-1 text-emerald-400" title="Số lần được nhân bản về làm đề">
            <GitFork size={12} />
            <span>{topic.forkCount}</span>
          </span>
        </>
      )}
    </div>
  );
};
