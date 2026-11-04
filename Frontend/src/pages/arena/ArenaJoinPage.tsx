import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Zap, Play, ArrowLeft, Trophy, Sparkles } from 'lucide-react';
import { arenaService } from '@/services/arena.service';

const AVATARS = ['😎', '🚀', '🦁', '🐯', '⚡', '🎯', '🧠', '👑', '🔥', '🦊'];

export const ArenaJoinPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const pinFromUrl = searchParams.get('pin') || '';
  const [pinCode, setPinCode] = useState(pinFromUrl);
  const [nickname, setNickname] = useState(() => localStorage.getItem('arena_player_nickname') || '');
  const [selectedAvatar, setSelectedAvatar] = useState(() => localStorage.getItem('arena_player_avatar') || '😎');
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (pinFromUrl) {
      setPinCode(pinFromUrl);
    }
  }, [pinFromUrl]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPin = pinCode.trim().toUpperCase();
    if (!cleanPin) {
      setErrorMsg('Vui lòng nhập mã PIN phòng thi (ví dụ: 123456 hoặc mã phòng).');
      return;
    }

    const cleanName = nickname.trim() || 'Học Sinh Bí Danh';

    // Lưu vào local storage cho các lần tham gia sau
    localStorage.setItem('arena_player_nickname', cleanName);
    localStorage.setItem('arena_player_avatar', selectedAvatar);

    setIsJoining(true);
    try {
      // 1. Tìm trực tiếp theo mã PIN hoặc RoomId (O(1) in-memory lookup)
      const directRoom = await arenaService.getRoom(cleanPin);
      if (directRoom && directRoom.roomId) {
        navigate(`/arena/${directRoom.gameCode || 'OLYMPIA'}/${directRoom.roomId}`);
        return;
      }

      // 2. Fallback: Kiểm tra danh sách phòng đang hoạt động
      const activeRooms = await arenaService.getRooms();
      const matchedRoom = Array.isArray(activeRooms)
        ? activeRooms.find((r: any) => r.roomId?.toUpperCase() === cleanPin || r.pinCode === cleanPin || r.roomName?.includes(cleanPin))
        : null;

      if (matchedRoom) {
        navigate(`/arena/${matchedRoom.gameCode || 'OLYMPIA'}/${matchedRoom.roomId}`);
      } else {
        // Tạo phòng quick join nếu phòng thi tự do
        const newRoom = await arenaService.createRoom('OLYMPIA', `Phòng Thi Đấu #${cleanPin}`, cleanName);
        navigate(`/arena/OLYMPIA/${newRoom.roomId}`);
      }
    } catch {
      // Nếu có lỗi mạng, fallback vào phòng Olympia tự động
      navigate(`/arena/OLYMPIA/${cleanPin}`);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-amber-400 selection:text-slate-950">
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <button
            onClick={() => navigate('/arena')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Về Sảnh Đấu Trường
          </button>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5" /> AEGIS LIVE ARENA
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Vào Phòng Thi Đấu Trực Tuyến
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Không cần đăng ký nick • Bấm chuông thời gian thực &lt;2ms
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleJoin} className="space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-medium animate-shake">
                {errorMsg}
              </div>
            )}

            {/* Mã PIN Input */}
            <div className="space-y-1.5 text-center">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                Mã PIN Phòng Thi (6 Chữ Số)
              </label>
              <input
                type="text"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.toUpperCase())}
                placeholder="VD: 829143"
                maxLength={10}
                required
                className="w-full text-center font-mono text-3xl sm:text-4xl font-black tracking-widest py-3 px-4 rounded-2xl bg-slate-950 border-2 border-indigo-500/50 focus:border-amber-400 text-white placeholder:text-slate-700 outline-none transition-all shadow-inner"
              />
            </div>

            {/* Tên Thí Sinh (Nickname) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Tên / Biệt Danh Của Bạn
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Nhập tên bạn (VD: Minh Quân - 12A1)..."
                maxLength={40}
                required
                className="w-full py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-white placeholder:text-slate-600 outline-none transition-all"
              />
            </div>

            {/* Chọn Avatar Emoji */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Biểu Tượng Avatar</span>
                <span className="text-amber-400 font-bold">{selectedAvatar}</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                      selectedAvatar === av
                        ? 'bg-amber-500/20 border-2 border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Join Button */}
            <button
              type="submit"
              disabled={isJoining}
              className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              {isJoining ? 'ĐANG KẾT NỐI SÀN ĐẤU...' : '⚔️ VÀO ĐẤU TRƯỜNG NGAY'}
            </button>
          </form>

          {/* Bottom Help Tip */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
            <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Bạn là giáo viên?{' '}
              <a href="/creator/studio" className="text-indigo-400 font-bold hover:underline">
                Tạo đề thi mới trong 10s
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ArenaJoinPage;

