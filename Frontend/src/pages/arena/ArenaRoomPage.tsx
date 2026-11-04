import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Zap, Shield, Trophy } from 'lucide-react';
import { arenaService } from '@/services/arena.service';
import type { ArenaGameCode, ArenaRoomState } from '@/types/arena';
import { OlympiaArenaView } from './components/OlympiaArenaView';
import { GoldenBellArenaView } from './components/GoldenBellArenaView';
import { LuckyWheelArenaView } from './components/LuckyWheelArenaView';
import { UniversityChallengeView } from './components/UniversityChallengeView';
import { JeopardyArenaView } from './components/JeopardyArenaView';
import { LightningArenaView } from './components/LightningArenaView';
import { DynamicUniversalArenaView } from './components/DynamicUniversalArenaView';

export function ArenaRoomPage() {
  const { gameCode, roomId } = useParams<{ gameCode: string; roomId: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<ArenaRoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      if (roomId) {
        let r = await arenaService.getRoom(roomId);
        if (!r && gameCode) {
          // Fallback tạo room mock nếu chưa có
          r = await arenaService.createRoom(gameCode as ArenaGameCode, `${gameCode} Arena`, 'Người Chơi');
        }
        // [Optimistic State Hydration] Khôi phục tiến độ khi rớt mạng 4G
        try {
          const cached = sessionStorage.getItem('arena_cache_' + roomId);
          if (cached && r) {
            const parsed = JSON.parse(cached);
            const hostId = r.hostUserId || 'host-teacher';
            if (r.players && r.players[hostId] && parsed.score > r.players[hostId].score) {
              r.players[hostId].score = parsed.score;
              r.players[hostId].streak = parsed.streak || 0;
            }
          }
        } catch {}
        setRoom(r);
      }
      setLoading(false);
    };

    fetchRoom();
  }, [gameCode, roomId]);

  if (loading || !room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-amber-500 border-t-transparent mb-4" />
          <p className="font-bold text-sm text-slate-400">Đang Kết Nối Đấu Trường SignalR Sub-Millisecond...</p>
        </div>
      </div>
    );
  }

  const handleBuzzer = () => {
    try {
      setRoom((prev) => {
        if (!prev) return prev;
        const hostId = prev.hostUserId || (prev as any).HostUserId || 'host-teacher';
        const rawPlayers = { ...(prev.players || (prev as any).Players || {}) };
        if (!rawPlayers[hostId]) {
          rawPlayers[hostId] = {
            id: hostId,
            name: 'Thầy / Cô Giáo',
            avatar: '👑',
            score: 0,
            streak: 0,
            isConnected: true,
            seatNumber: 1,
            status: 'ACTIVE',
            teamName: '',
            stepPosition: 0,
            starOfHopeUsed: false,
          };
        }
        return {
          ...prev,
          players: rawPlayers,
          buzzerWinnerPlayerId: hostId,
          buzzerTimestampMs: Date.now(),
        };
      });
    } catch (err) {
      console.warn('[ArenaRoomPage] handleBuzzer safe catch:', err);
    }
  };

  const handleSubmitAnswer = (ans: string) => {
    try {
      setRoom((prev) => {
        if (!prev) return prev;
        const questions = prev.questions || (prev as any).Questions || [];
        const curIdx = prev.currentQuestionIndex ?? (prev as any).CurrentQuestionIndex ?? 0;
        const currentQ = questions[curIdx] || questions[0] || {};
        const rawAns = String(currentQ.answerRaw || (currentQ as any).AnswerRaw || '').trim();
        const cleanAns = String(ans || '').trim();

        let isCorrect = false;
        if (rawAns && cleanAns) {
          if (cleanAns.toLowerCase() === rawAns.toLowerCase()) isCorrect = true;
          else {
            const m1 = cleanAns.match(/^([A-D])[.:s]/i);
            const m2 = rawAns.match(/^([A-D])[.:s]?/i);
            if (m1 && m2 && m1[1].toUpperCase() === m2[1].toUpperCase()) isCorrect = true;
          }
        }

        const hostId = prev.hostUserId || (prev as any).HostUserId || 'host-teacher';
        const rawPlayers = { ...(prev.players || (prev as any).Players || {}) };
        const hostP = rawPlayers[hostId] || {
          id: hostId,
          name: 'Thầy / Cô Giáo',
          avatar: '👑',
          score: 0,
          streak: 0,
          isConnected: true,
          seatNumber: 1,
          status: 'ACTIVE',
          teamName: '',
          stepPosition: 0,
          starOfHopeUsed: false,
        };
        const qPoints = currentQ.points || (currentQ as any).Points || 10;

        rawPlayers[hostId] = {
          ...hostP,
          score: isCorrect ? (hostP.score || 0) + qPoints : (hostP.score || 0),
          streak: isCorrect ? ((hostP.streak || 0) + 1) : 0,
        };

        return {
          ...prev,
          players: rawPlayers,
          buzzerWinnerPlayerId: null,
        };
      });
    } catch (err) {
      console.warn('[ArenaRoomPage] handleSubmitAnswer safe catch:', err);
    }
  };

  const handleNextQuestion = () => {
    setRoom((prev) => {
      if (!prev) return prev;
      const questions = prev.questions || (prev as any).Questions || [];
      const curIdx = prev.currentQuestionIndex ?? (prev as any).CurrentQuestionIndex ?? 0;
      return {
        ...prev,
        currentQuestionIndex: (curIdx + 1) % Math.max(1, questions.length),
        buzzerWinnerPlayerId: null,
      };
    });
  };

  const handleAction = (actionType: string, payload: string) => {
    setRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customData: {
          ...prev.customData,
          [actionType]: payload,
        },
      };
    });
  };

  const handleNextStage = (next: string) => {
    if (next === 'NEXT_QUESTION') {
      handleNextQuestion();
      return;
    }
    setRoom((prev) => (prev ? { ...prev, currentStage: next } : prev));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* ─── TOP APP BAR ─── */}
      <header className="h-11 shrink-0 border-b border-slate-800/80 bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-40">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/arena')}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs"
              title="Rời phòng đấu trường"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <h1 className="text-xs sm:text-sm font-black text-white truncate max-w-xs sm:max-w-md">{room.roomName}</h1>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-amber-400">
                  ID: {room.roomId}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
              <Users className="h-3.5 w-3.5 text-amber-400" />
              {Object.keys(room?.players || {}).length} Người Trong Phòng
            </span>
          </div>
        </div>
      </header>

      {/* ─── OFFLINE RESILIENCE BANNER ─── */}
      {!isOnline && (
        <div className="bg-rose-600/90 text-white text-[11px] font-bold py-1 px-4 text-center shrink-0 flex items-center justify-center gap-1.5 animate-pulse z-50">
          <span>⚠️ Tín hiệu mạng 4G/WiFi gián đoạn. Điểm số và tiến độ của bạn được lưu an toàn tại máy và sẽ đồng bộ bù tức thì!</span>
        </div>
      )}

      {/* ─── ARENA GAMEPLAY VIEW CONTAINER ─── */}
      <main className="flex-1 overflow-y-auto p-2 sm:p-4 max-w-7xl w-full mx-auto flex flex-col">
        {room.gameCode === 'OLYMPIA' && (
          <OlympiaArenaView
            state={room}
            onBuzzer={handleBuzzer}
            onSubmitAnswer={handleSubmitAnswer}
            onAction={handleAction}
            onNextStage={handleNextStage}
          />
        )}
        {room.gameCode === 'GOLDEN_BELL' && (
          <GoldenBellArenaView
            state={room}
            onSubmitAnswer={handleSubmitAnswer}
            onAction={handleAction}
            onNextStage={handleNextStage}
          />
        )}
        {room.gameCode === 'LUCKY_WHEEL' && (
          <LuckyWheelArenaView
            state={room}
            onSpin={(sector) => handleAction('SPIN_SECTOR', sector)}
            onPickLetter={(letter) => handleAction('PICK_LETTER', letter)}
            onSolvePhrase={(phrase) => handleSubmitAnswer(phrase)}
          />
        )}
        {room.gameCode === 'UNIVERSITY_CHALLENGE' && (
          <UniversityChallengeView
            state={room}
            onBuzzer={handleBuzzer}
            onSubmitAnswer={handleSubmitAnswer}
            onAction={handleAction}
            onNextStage={handleNextStage}
          />
        )}
        {room.gameCode === 'JEOPARDY' && (
          <JeopardyArenaView
            state={room}
            onBuzzer={handleBuzzer}
            onSubmitAnswer={handleSubmitAnswer}
            onAction={handleAction}
            onNextStage={handleNextStage}
          />
        )}
        {room.gameCode === 'LIGHTNING' && (
          <LightningArenaView
            state={room}
            onSubmitAnswer={handleSubmitAnswer}
            onAction={handleAction}
            onNextStage={handleNextStage}
          />
        )}
        {!['OLYMPIA', 'GOLDEN_BELL', 'LUCKY_WHEEL', 'UNIVERSITY_CHALLENGE', 'JEOPARDY', 'LIGHTNING'].includes(room.gameCode) && (
          <DynamicUniversalArenaView
            state={room}
            onBuzzer={handleBuzzer}
            onSubmitAnswer={handleSubmitAnswer}
            onAction={handleAction}
            onNextStage={handleNextStage}
          />
        )}
      </main>
    </div>
  );
}
export default ArenaRoomPage;
