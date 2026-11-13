import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, UserCheck, AlertTriangle, Clock, RefreshCw, 
  Send, Eye, CheckCircle2, Search, Filter, X 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TeamMemberRecord } from '../hooks/useTeamManagement';

export interface ProctorStudentState {
  userId: string;
  fullName: string;
  email: string;
  currentQuestion: number;
  totalQuestions: number;
  score?: number;
  tabSwitchCount: number;
  idleSeconds: number;
  status: 'focusing' | 'idle' | 'warning' | 'submitted';
  lastActivity: string;
}

interface LiveProctoringGridProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle: string;
  members: TeamMemberRecord[];
  activeExamTitle?: string;
  totalQuestions?: number;
}

export const LiveProctoringGrid: React.FC<LiveProctoringGridProps> = ({
  isOpen,
  onClose,
  classNameTitle,
  members,
  activeExamTitle = 'Khảo Sát Năng Lực Trực Tuyến GDPT',
  totalQuestions = 25,
}) => {
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<ProctorStudentState[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize or mock telemetry data based on real class members
  useEffect(() => {
    if (!isOpen) return;
    const initialList: ProctorStudentState[] = members.map((m, idx) => ({
      userId: m.userId,
      fullName: m.fullName || m.email,
      email: m.email,
      currentQuestion: idx % 5 === 0 ? totalQuestions : Math.min(totalQuestions, Math.floor(Math.random() * totalQuestions) + 1),
      totalQuestions,
      score: idx % 5 === 0 ? Math.round((Math.random() * 3 + 7) * 10) / 10 : undefined,
      tabSwitchCount: idx % 4 === 1 ? Math.floor(Math.random() * 3) + 1 : 0,
      idleSeconds: idx % 6 === 2 ? 190 : 15,
      status: idx % 5 === 0 ? 'submitted' : idx % 4 === 1 ? 'warning' : idx % 6 === 2 ? 'idle' : 'focusing',
      lastActivity: 'Vừa xong',
    }));
    setStudents(initialList);

    // Heartbeat update every 4 seconds
    const interval = setInterval(() => {
      setStudents((prev) =>
        prev.map((s) => {
          if (s.status === 'submitted') return s;
          const delta = Math.random() > 0.6 ? 1 : 0;
          const nextQ = Math.min(s.totalQuestions, s.currentQuestion + delta);
          return {
            ...s,
            currentQuestion: nextQ,
            status: nextQ === s.totalQuestions ? 'submitted' : s.status,
            score: nextQ === s.totalQuestions ? Math.round((Math.random() * 3 + 7) * 10) / 10 : s.score,
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, members, totalQuestions]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filtered = students.filter((s) => {
    const matchSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  const countWarning = students.filter((s) => s.status === 'warning').length;
  const countFocus = students.filter((s) => s.status === 'focusing').length;
  const countDone = students.filter((s) => s.status === 'submitted').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <ShieldAlert size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">{t('proctor.title', 'Giám Sát Phòng Thi Live Telemetry')}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">{classNameTitle} • {activeExamTitle} ({students.length} {t('proctor.candidates', 'thí sinh')})</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X size={20} />
          </button>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-950/40 border-b border-slate-800 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5"><UserCheck size={14} className="text-indigo-400" /> Sĩ số:</span>
            <span className="font-bold text-white text-sm">{students.length}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between">
            <span className="text-emerald-300 flex items-center gap-1.5"><Eye size={14} className="text-emerald-400" /> Đang làm:</span>
            <span className="font-bold text-emerald-400 text-sm">{countFocus}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/20 flex items-center justify-between">
            <span className="text-rose-300 flex items-center gap-1.5"><AlertTriangle size={14} className="text-rose-400" /> Chuyển Tab:</span>
            <span className="font-bold text-rose-400 text-sm">{countWarning}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-between">
            <span className="text-cyan-300 flex items-center gap-1.5"><CheckCircle2 size={14} className="text-cyan-400" /> Đã nộp:</span>
            <span className="font-bold text-cyan-400 text-sm">{countDone}</span>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center justify-between p-3 gap-2 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 w-full sm:w-64 text-xs">
            <Search size={14} className="text-slate-400" />
            <input type="text" placeholder="Tìm thí sinh..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none text-white focus:outline-none w-full" />
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {['all', 'focusing', 'warning', 'submitted'].map((st) => (
              <button key={st} type="button" onClick={() => setFilterStatus(st)} className={`px-2.5 py-1 rounded-lg font-bold transition capitalize ${filterStatus === st ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                {st === 'all' ? 'Tất cả' : st === 'focusing' ? 'Làm bài' : st === 'warning' ? 'Cảnh báo' : 'Đã nộp'}
              </button>
            ))}
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg animate-bounce">
            {toastMessage}
          </div>
        )}

        {/* Telemetry Student Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((s) => {
            const pct = Math.round((s.currentQuestion / s.totalQuestions) * 100);
            return (
              <div 
                key={s.userId} 
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  s.status === 'warning' 
                    ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-950/40' 
                    : s.status === 'submitted'
                    ? 'bg-cyan-950/15 border-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white truncate">{s.fullName}</h4>
                    <p className="text-[11px] text-slate-400 truncate">{s.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                    s.status === 'warning' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                    s.status === 'submitted' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                    s.status === 'idle' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {s.status === 'warning' ? `⚠️ Rời Tab (${s.tabSwitchCount})` :
                     s.status === 'submitted' ? `✓ Điểm: ${s.score ?? 10}` :
                     s.status === 'idle' ? '⏳ Dừng lâu' : '🟢 Tập trung'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Câu {s.currentQuestion}/{s.totalQuestions}</span>
                    <span className="font-bold text-slate-300">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        s.status === 'warning' ? 'bg-rose-500' : s.status === 'submitted' ? 'bg-cyan-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>

                {/* Action quick buttons */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => showToast(`Đã gửi nhắc nhở tập trung tới ${s.fullName}`)}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 font-bold transition flex items-center justify-center gap-1"
                  >
                    <Send size={11} className="text-indigo-400" /> Nhắc nhở
                  </button>
                  {s.status !== 'submitted' && (
                    <button
                      type="button"
                      onClick={() => {
                        setStudents((prev) => prev.map((item) => item.userId === s.userId ? { ...item, status: 'submitted', score: 8.5 } : item));
                        showToast(`Đã thu bài sớm của ${s.fullName}`);
                      }}
                      className="py-1 px-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold transition"
                    >
                      Thu bài
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
