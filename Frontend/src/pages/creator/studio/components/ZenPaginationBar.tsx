import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Play, Database, Loader2, Send } from 'lucide-react';
import { ZEN_PAGE_SIZES } from '../hooks/useZenPagination';

interface ZenPaginationBarProps {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  pageWindow: number[];
  editedCount: number;
  isLaunching: boolean;
  onGoTo: (page: number) => void;
  onPageSize: (size: number) => void;
  onOpenArenaSelector: () => void;
  onPureSaveToBank?: () => void;
  isPureSavingToBank?: boolean;
  onOpenHomeworkConfig?: () => void;
}

/** Thanh điều khiển nổi (sticky) luôn hiển thị ở đáy màn hình — gom đầy đủ các nút tác vụ cốt lõi. */
export const ZenPaginationBar: React.FC<ZenPaginationBarProps> = ({
  page, totalPages, pageSize, total, rangeStart, rangeEnd, pageWindow, editedCount, isLaunching,
  onGoTo, onPageSize, onOpenArenaSelector, onPureSaveToBank, isPureSavingToBank, onOpenHomeworkConfig,
}) => {
  const { t } = useTranslation('creator');
  const [jump, setJump] = useState('');

  const submitJump = (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseInt(jump, 10);
    if (!Number.isNaN(q) && q >= 1 && q <= total) {
      onGoTo(Math.ceil(q / pageSize));
      setJump('');
    }
  };

  const navBtn = 'w-8 h-8 inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div className="fixed bottom-3 inset-x-3 z-40 flex justify-center pointer-events-none">
      <nav
        aria-label={t('pagination.label')}
        className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-indigo-500/30 shadow-2xl backdrop-blur-md text-xs text-slate-200 max-w-5xl w-full"
      >
        {/* Phân trang */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={t('pagination.prev')}
            disabled={page <= 1}
            onClick={() => onGoTo(page - 1)}
            className={navBtn}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pageWindow.map((p, idx) =>
            p === -1 ? (
              <span key={`gap-${idx}`} className="px-1 text-slate-500">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onGoTo(p)}
                className={`w-8 h-8 rounded-lg font-semibold transition-colors ${
                  p === page
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            type="button"
            aria-label={t('pagination.next')}
            disabled={page >= totalPages}
            onClick={() => onGoTo(page + 1)}
            className={navBtn}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Thông tin phạm vi & Nhảy trang */}
        <div className="hidden lg:flex items-center gap-3 text-slate-400 text-xs">
          <span>{t('pagination.range', { from: rangeStart + 1, to: rangeEnd, total })}</span>
          <form onSubmit={submitJump} className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={total}
              value={jump}
              onChange={(e) => setJump(e.target.value)}
              placeholder={t('pagination.jumpTo')}
              className="w-24 h-8 rounded-lg bg-slate-950 border border-slate-700 px-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </form>
        </div>

        {/* Kích thước trang & Cụm nút hành động sư phạm */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>{t('pagination.perPage')}</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}
              className="h-8 rounded-lg bg-slate-950 border border-slate-700 px-1.5 text-xs text-slate-100"
            >
              {ZEN_PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          {editedCount > 0 && (
            <span className="hidden sm:inline-block px-2 py-1 rounded-md bg-amber-500/15 text-amber-300 text-xs font-semibold border border-amber-500/30">
              {t('pagination.edited', { count: editedCount })}
            </span>
          )}

          {/* 1. NÚT LƯU NGÂN HÀNG (Lưu trữ tài sản thuần túy) */}
          {onPureSaveToBank && (
            <button
              onClick={onPureSaveToBank}
              disabled={isPureSavingToBank}
              title="Lưu trữ vĩnh viễn vào Ngân hàng Tri thức cá nhân"
              type="button"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-60 transition active:scale-95 cursor-pointer shadow-md"
            >
              {isPureSavingToBank ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <Database className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isPureSavingToBank ? 'Đang lưu...' : 'Lưu Ngân Hàng'}</span>
            </button>
          )}

          {/* 2. NÚT GIAO BÀI TẬP (Mở modal thiết lập hạn nộp & QR Code chia sẻ) */}
          {onOpenHomeworkConfig && (
            <button
              onClick={onOpenHomeworkConfig}
              type="button"
              title="Thiết lập chế độ thi (Kids/Paper/Exam) và sinh link/QR giao bài"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 border border-emerald-500/40 transition active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Giao Bài Tập</span>
            </button>
          )}

          {/* 3. NÚT KÍCH HOẠT ĐẤU TRƯỜNG (Mở modal chọn Rung Chuông Vàng, Nhanh Như Chớp, Olympia...) */}
          <button
            onClick={onOpenArenaSelector}
            disabled={isLaunching}
            type="button"
            title="Chọn thể thức gameshow (Rung Chuông Vàng, Nhanh Như Chớp...) và mở phòng thi thời gian thực"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-lg shadow-teal-500/25 disabled:opacity-60 transition active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Kích Hoạt Đấu Trường</span>
          </button>
        </div>
      </nav>
    </div>
  );
};