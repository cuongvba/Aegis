import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Play, Bell, Zap, Trophy, Crown, GraduationCap, CheckCircle2, Clock } from 'lucide-react';

export interface ArenaModeItem {
  gameCode: string;
  displayName: string;
  description: string;
  badge: string;
  icon: string;
  themeColor: string;
  minPlayers: number;
  maxPlayers: number;
  recommendedTarget: string;
}

export const ARENA_MODES: ArenaModeItem[] = [
  {
    gameCode: 'GOLDEN_BELL',
    displayName: 'Rung Chuông Vàng (Battle Royale)',
    description: 'Đấu trường 30 đến 10,000 học sinh cùng lúc trên một sàn đấu số Canvas. Sai 1 câu là rời sàn! Thầy Cô có quyền Cứu Trợ hồi sinh cả lớp.',
    badge: 'Khuyên dùng cho cả lớp',
    icon: 'Bell',
    themeColor: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300',
    minPlayers: 1,
    maxPlayers: 10000,
    recommendedTarget: 'Cả lớp (30-100 em) hoặc toàn trường',
  },
  {
    gameCode: 'LIGHTNING',
    displayName: 'Nhanh Như Chớp (Lightning Incline)',
    description: 'Cỗ máy leo dốc 10 bậc đứng! Đúng leo 1 bậc, sai tụt ngay về vạch số 0. Rèn luyện tốc độ và bản lĩnh phản xạ dưới áp lực 2 phút.',
    badge: 'Kiểm tra 15 phút',
    icon: 'Zap',
    themeColor: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-300',
    minPlayers: 1,
    maxPlayers: 8,
    recommendedTarget: 'Kiểm tra tổ nhóm, thi đấu đối đầu',
  },
  {
    gameCode: 'OLYMPIA',
    displayName: 'Olympia Supreme (Đường Lên Đỉnh Tri Thức)',
    description: 'Format 4 vòng thi truyền hình: Khởi Động 60s, Vượt Chướng Ngại Vật ma trận hình ảnh, Tăng Tốc, Về Đích & Ngôi Sao Hy Vọng.',
    badge: 'Chung kết 4 Đội/Thí sinh',
    icon: 'Trophy',
    themeColor: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/40 text-indigo-300',
    minPlayers: 1,
    maxPlayers: 4,
    recommendedTarget: '4 thí sinh hoặc 4 đội tuyển tinh hoa',
  },
  {
    gameCode: 'TRIEU_PHU_AI',
    displayName: 'Ai Là Triệu Phú (Millionaire)',
    description: '15 câu hỏi leo thang với 3 mốc an toàn. 4 quyền trợ giúp độc bản: 50:50, Hỏi Gia Sư AI Socrates, Hỏi ý kiến cả lớp qua QR, Đổi câu hỏi.',
    badge: 'Kiểm tra miệng 1-1',
    icon: 'Crown',
    themeColor: 'from-blue-500/20 to-sky-500/20 border-blue-500/40 text-blue-300',
    minPlayers: 1,
    maxPlayers: 1,
    recommendedTarget: '1 học sinh lên bảng, cả lớp theo dõi',
  },
  {
    gameCode: 'UNIVERSITY_CHALLENGE',
    displayName: 'Đấu Trường Đại Học (Team vs Team)',
    description: 'Đối kháng học thuật 4 vs 4 (Team A vs Team B). Bấm chuông Starter giành quyền và chuỗi câu hỏi Bonus có kênh thảo luận kín.',
    badge: 'Đối kháng 2 Tổ/Đội',
    icon: 'GraduationCap',
    themeColor: 'from-pink-500/20 to-rose-500/20 border-pink-500/40 text-pink-300',
    minPlayers: 2,
    maxPlayers: 8,
    recommendedTarget: 'Hai đội tuyển thi đấu đối kháng trực diện',
  },
];

interface ZenArenaGameSelectorModalProps {
  isOpen: boolean;
  isLoading: boolean;
  totalQuestions?: number;
  onClose: () => void;
  onConfirm: (gameCode: string, durationMinutes: number) => void;
}

const renderIcon = (icon: string) => {
  switch (icon) {
    case 'Bell': return <Bell className="w-5 h-5 text-amber-400" />;
    case 'Zap': return <Zap className="w-5 h-5 text-cyan-400" />;
    case 'Trophy': return <Trophy className="w-5 h-5 text-indigo-400" />;
    case 'Crown': return <Crown className="w-5 h-5 text-blue-400" />;
    case 'GraduationCap': return <GraduationCap className="w-5 h-5 text-pink-400" />;
    default: return <Play className="w-5 h-5 text-emerald-400" />;
  }
};

export const ZenArenaGameSelectorModal: React.FC<ZenArenaGameSelectorModalProps> = ({
  isOpen,
  isLoading,
  totalQuestions,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation('creator');
  const [selectedCode, setSelectedCode] = useState<string>('GOLDEN_BELL');
  const [duration, setDuration] = useState<number>(15);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-teal-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-white">
                Chọn Thể Thức Đấu Trường Trực Tiếp
              </h3>
              <p className="text-xs text-slate-400">
                Sử dụng {totalQuestions} câu hỏi đã nạp để mở phòng thi đấu trực tiếp cho học sinh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {ARENA_MODES.map((mode) => {
              const isSelected = selectedCode === mode.gameCode;
              return (
                <div
                  key={mode.gameCode}
                  onClick={() => setSelectedCode(mode.gameCode)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                    isSelected
                      ? `bg-slate-800/90 ${mode.themeColor} shadow-lg shadow-teal-500/10`
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                    {renderIcon(mode.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-bold text-sm text-white">{mode.displayName}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-700 text-amber-300">
                        {mode.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {mode.description}
                    </p>
                    <div className="mt-2 text-[11px] text-teal-400 font-medium">
                      🎯 Thích hợp: {mode.recommendedTarget}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-1" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Duration Selector */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>Thời lượng phòng thi dự kiến:</span>
            </div>
            <div className="flex items-center gap-2">
              {[10, 15, 20, 30].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDuration(m)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    duration === m
                      ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {m} phút
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-800 bg-slate-950/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onConfirm(selectedCode, duration)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-lg shadow-teal-500/25 disabled:opacity-60 transition active:scale-95 cursor-pointer"
          >
            {isLoading ? (
              <span>Đang khởi tạo phòng thi...</span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Kích Hoạt Phòng Thi Đấu Trường</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
