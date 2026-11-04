import React, { useState } from 'react';
import { X, Play, Loader2, Sparkles, BookOpen, Layers, Users } from 'lucide-react';
import { ARENA_GAMES_METADATA, type ArenaGameCode } from '@/types/arena';

interface CreateCustomArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Array<{ code: string; name: string; questionCount: number }>;
  onConfirm: (gameCode: string, roomName: string, topicCode: string, questionCount: number) => void;
  isLoading: boolean;
}

export const CreateCustomArenaModal: React.FC<CreateCustomArenaModalProps> = ({
  isOpen,
  onClose,
  topics,
  onConfirm,
  isLoading,
}) => {
  const [selectedGame, setSelectedGame] = useState<ArenaGameCode>('GOLDEN_BELL');
  const [roomName, setRoomName] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('ALL');
  const [questionCount, setQuestionCount] = useState(15);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = roomName.trim() || `Đấu Trường ${selectedGame} Tri Thức`;
    onConfirm(selectedGame, finalName, selectedTopic, questionCount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 text-xl font-bold">
            ⚔️
          </span>
          <div>
            <h3 className="text-xl font-black text-white">Tạo Phòng Đấu Trường Dữ Liệu Thật</h3>
            <p className="text-xs text-slate-400">Chọn thể thức và đề thi thật từ cơ sở dữ liệu</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tên phòng */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Tên phòng thi đấu</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="VD: Chung Kết Tri Thức Khối 12, Đấu Trường Tổ 1..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:border-amber-400"
            />
          </div>

          {/* Chọn thể thức game */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">1. Chọn Thể Thức Gameshow</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ARENA_GAMES_METADATA.map((g) => (
                <button
                  type="button"
                  key={g.gameCode}
                  onClick={() => setSelectedGame(g.gameCode as ArenaGameCode)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    selectedGame === g.gameCode
                      ? 'border-amber-400 bg-amber-500/15 shadow-md'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xl mb-1">{g.icon}</div>
                  <div className="text-xs font-bold text-white truncate">{g.displayName.split('(')[0]}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{g.badge}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chọn nguồn câu hỏi thật */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>2. Chọn Bộ Đề Thi Thật Trong Ngân Hàng</span>
              <span className="text-[10px] text-amber-400 font-normal">Dữ liệu thật 100%</span>
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-amber-400"
            >
              <option value="ALL">🌟 Toàn Bộ Ngân Hàng Câu Hỏi (Bốc ngẫu nhiên đa môn)</option>
              {topics.map((t) => (
                <option key={t.code} value={t.code}>
                  📚 {t.name} ({t.questionCount} câu hỏi thật)
                </option>
              ))}
            </select>
          </div>

          {/* Số lượng câu hỏi */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">3. Số lượng câu hỏi thi đấu</label>
            <div className="flex items-center gap-2">
              {[10, 15, 20, 30].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setQuestionCount(num)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    questionCount === num
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {num} câu
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              <span>KHỞI TẠO PHÒNG ĐẤU NGAY</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

