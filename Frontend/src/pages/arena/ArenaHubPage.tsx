import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Trophy, Users, Play, Plus, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { arenaService } from '@/services/arena.service';
import { ARENA_GAMES_METADATA, type ArenaGameCode } from '@/types/arena';
import { RealTournamentsGrid } from './components/RealTournamentsGrid';
import { CreateCustomArenaModal } from './components/CreateCustomArenaModal';

export function ArenaHubPage() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [dynamicTemplates, setDynamicTemplates] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [availableTopics, setAvailableTopics] = useState<any[]>([]);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  useEffect(() => {
    arenaService.getRooms().then(setActiveRooms);
    arenaService.getTemplates().then(setDynamicTemplates);
    arenaService.getTournaments().then(setTournaments);
    arenaService.getAvailableTopics().then(setAvailableTopics);
  }, []);

  const handleQuickJoin = async (gameCode: ArenaGameCode, topicCode?: string) => {
    setIsCreating(true);
    try {
      const room = await arenaService.createRoom(
        gameCode,
        `${gameCode} Đấu Trường Tri Thức`,
        'Kiện Tướng',
        topicCode || 'ALL',
        15
      );
      navigate(`/arena/${gameCode}/${room.roomId}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTournament = async (tour: any, gameCode?: string) => {
    setIsCreating(true);
    try {
      const selectedGame = gameCode || tour.defaultGameCode || 'GOLDEN_BELL';
      const room = await arenaService.createRoom(
        selectedGame,
        tour.title,
        'Kiện Tướng Tranh Tài',
        tour.topicCode,
        15
      );
      navigate(`/arena/${selectedGame}/${room.roomId}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateCustomRoom = async (
    gameCode: string,
    roomName: string,
    topicCode: string,
    questionCount: number
  ) => {
    setIsCreating(true);
    try {
      const room = await arenaService.createRoom(
        gameCode,
        roomName,
        'Chủ Phòng',
        topicCode,
        questionCount
      );
      setIsCustomModalOpen(false);
      navigate(`/arena/${gameCode}/${room.roomId}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950 font-sans pb-20">
      {/* ─── HERO ESPORTS BANNER ─── */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 py-14 px-4">
        <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/4 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-amber-400 shadow-sm">
            <Zap className="h-3.5 w-3.5" /> AEGIS ARENA • ĐẤU TRƯỜNG DỮ LIỆU THẬT QUỐC GIA
          </span>
          <h1 className="mt-4 text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white">
            Vượt Trội Mọi Gameshow Truyền Hình
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xs sm:text-sm text-slate-400 leading-relaxed">
            Hệ thống đấu trường thời gian thực với ngân hàng câu hỏi THẬT từ Bộ GD&ĐT và Doanh nghiệp. Trọng tài Microsecond Arbiter độ trễ dưới 2ms.
          </p>

          {/* Quick PIN Join Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pinInput.trim()) navigate(`/arena/join?pin=${pinInput.trim()}`);
            }}
            className="mt-6 max-w-md mx-auto flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border-2 border-amber-500/40 shadow-xl focus-within:border-amber-400 transition-all"
          >
            <input
              type="text"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.toUpperCase())}
              placeholder="Nhập mã PIN phòng thi (VD: 829143)..."
              maxLength={10}
              className="flex-1 bg-transparent px-4 py-2 text-sm font-mono font-bold text-white placeholder:text-slate-500 outline-none"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-black text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> VÀO PHÒNG
            </button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handleQuickJoin('OLYMPIA', 'TIENG_ANH')}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 px-6 py-3.5 text-sm font-black text-slate-950 shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" /> ĐẤU OLYMPIA ĐỀ THẬT ➔
            </button>
            <button
              onClick={() => handleQuickJoin('GOLDEN_BELL', 'TD_KHDN')}
              className="flex items-center gap-2 rounded-2xl border-2 border-yellow-500/40 bg-yellow-500/10 px-6 py-3.5 text-sm font-black text-yellow-300 hover:bg-yellow-500/20 active:scale-95 transition cursor-pointer"
            >
              🔔 RUNG CHUÔNG VÀNG (240 CÂU THẬT)
            </button>
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl border-2 border-cyan-500/40 bg-cyan-500/10 px-6 py-3.5 text-sm font-black text-cyan-300 hover:bg-cyan-500/20 active:scale-95 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" /> TẠO ĐẤU TRƯỜNG TỰ CHỌN ĐỀ
            </button>
          </div>
        </div>
      </section>

      {/* ─── 1. GIẢI ĐẤU DỮ LIỆU THẬT ĐANG KHỞI TRANH (REAL TOURNAMENTS) ─── */}
      {tournaments.length > 0 && (
        <RealTournamentsGrid
          tournaments={tournaments}
          onJoinTournament={handleJoinTournament}
          isCreating={isCreating}
          onOpenCustomModal={() => setIsCustomModalOpen(true)}
        />
      )}

      {/* ─── 2. DANH MỤC 6 FORMAT GAMESHOW ARENA ─── */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Thể Thức Gameshow Bản Quyền
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chọn format đấu trường yêu thích để thi đấu với câu hỏi thật toàn hệ thống
            </p>
          </div>
          <span className="rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-xs font-bold text-amber-400">
            6 Thể Thức Hoạt Động
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ARENA_GAMES_METADATA.map((game) => (
            <div
              key={game.gameCode}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-slate-800 bg-slate-900/80 p-6 transition-all duration-300 hover:border-slate-600 hover:bg-slate-900 hover:shadow-2xl hover:-translate-y-1"
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${game.gradient}`} />
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-2xl shadow-inner group-hover:scale-110 transition-transform">
                    {game.icon}
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${game.accentColor}`}>
                    {game.badge}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-black text-white tracking-tight group-hover:text-amber-400 transition-colors">
                  {game.displayName}
                </h3>
                <p className="mt-1.5 text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {game.description}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-slate-800/80 pt-3">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-500" />
                    {game.minPlayers} - {game.maxPlayers.toLocaleString()} Người
                  </span>
                  <span className="text-emerald-400 text-[11px]">Dữ liệu thật 100%</span>
                </div>
              </div>
              <div className="mt-5">
                <button
                  disabled={isCreating}
                  onClick={() => handleQuickJoin(game.gameCode)}
                  className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-black text-xs text-slate-950 shadow-lg bg-gradient-to-r ${game.gradient} hover:opacity-95 active:scale-98 transition cursor-pointer`}
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> VÀO THI ĐẤU NGAY ➔
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modal Tự Tạo Đấu Trường Với Đề Thật */}
      <CreateCustomArenaModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        topics={availableTopics}
        onConfirm={handleCreateCustomRoom}
        isLoading={isCreating}
      />
    </div>
  );
}

export default ArenaHubPage;
