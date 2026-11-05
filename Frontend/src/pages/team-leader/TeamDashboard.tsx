import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users, BarChart3, ChevronRight, TrendingUp, Clock, CheckCircle2, Trophy,
  Send, RefreshCw, AlertCircle, ShieldCheck, Target, FileQuestion, Play,
  Sparkles, FolderTree, Copy, Check
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import { learnerQuizService } from '@/services/learner-quiz.service';
import { CreatorWorkspaceNav } from '@/pages/creator/components/CreatorWorkspaceNav';
import { TeacherCohortDashboardModal } from '@/pages/creator/studio/components/TeacherCohortDashboardModal';
import type { BankTopic } from '@/pages/admin/questions/types';

interface TeamMember {
  userId: string;
  name?: string;
  assignedAt: string;
}

interface MemberProgress {
  userId: string;
  totalAttempts: number;
  avgScore: number;
  lastAttemptDate: string | null;
  correctAnswers: number;
  totalQuestions: number;
}

interface TeamInfo {
  orgUnit: { id: string; name: string; code: string; unitType: number };
  memberCount: number;
  members: TeamMember[];
}

const MOCK_TEAM: TeamInfo = {
  orgUnit: { id: 'team-demo-guid', name: 'Lớp Học & Đội Nhóm Sáng Tạo Aegis', code: 'AEGIS_CLASSROOM', unitType: 5 },
  memberCount: 6,
  members: [
    { userId: 'learner-001', name: 'Nguyễn Văn An', assignedAt: '2026-08-01' },
    { userId: 'learner-002', name: 'Trần Thị Bình', assignedAt: '2026-08-01' },
    { userId: 'learner-003', name: 'Lê Minh Cường', assignedAt: '2026-08-15' },
    { userId: 'learner-004', name: 'Phạm Thu Dung', assignedAt: '2026-09-01' },
    { userId: 'learner-005', name: 'Hoàng Văn Em', assignedAt: '2026-09-01' },
    { userId: 'learner-006', name: 'Vũ Thị Phương', assignedAt: '2026-09-05' },
  ],
};

const MOCK_PROGRESS: Record<string, MemberProgress> = {
  'learner-001': { userId: 'learner-001', totalAttempts: 24, avgScore: 87.5, lastAttemptDate: '2026-11-04', correctAnswers: 210, totalQuestions: 240 },
  'learner-002': { userId: 'learner-002', totalAttempts: 18, avgScore: 92.1, lastAttemptDate: '2026-11-04', correctAnswers: 165, totalQuestions: 180 },
  'learner-003': { userId: 'learner-003', totalAttempts: 31, avgScore: 79.3, lastAttemptDate: '2026-11-03', correctAnswers: 246, totalQuestions: 310 },
  'learner-004': { userId: 'learner-004', totalAttempts: 12, avgScore: 68.0, lastAttemptDate: '2026-11-02', correctAnswers: 81, totalQuestions: 120 },
  'learner-005': { userId: 'learner-005', totalAttempts: 7, avgScore: 55.4, lastAttemptDate: '2026-11-01', correctAnswers: 38, totalQuestions: 70 },
  'learner-006': { userId: 'learner-006', totalAttempts: 3, avgScore: 43.2, lastAttemptDate: '2026-11-01', correctAnswers: 13, totalQuestions: 30 },
};

function scoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-400';
  if (score >= 70) return 'text-amber-400';
  if (score >= 50) return 'text-orange-400';
  return 'text-red-400';
}

export function TeamDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [progress, setProgress] = useState<Record<string, MemberProgress>>({});
  const [myTopics, setMyTopics] = useState<BankTopic[]>([]);
  const [myQuestionCount, setMyQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);
  const [copiedTopicCode, setCopiedTopicCode] = useState<string | null>(null);
  const [cohortModalTopic, setCohortModalTopic] = useState<BankTopic | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [topicsData, questionsData] = await Promise.all([
          learnerQuizService.getTopics(false, true),
          learnerQuizService.getQuestions({ myOnly: true }),
        ]);
        const leafTopics = topicsData.filter((t: BankTopic) => !t.code.startsWith('STUDIO_') && t.code !== 'STUDIO');
        setMyTopics(leafTopics.length > 0 ? leafTopics : topicsData);
        setMyQuestionCount(questionsData.length);

        const initialCode = searchParams.get('topicCode');
        if (initialCode) {
          const found = topicsData.find((t: BankTopic) => t.code === initialCode);
          if (found) setCohortModalTopic(found);
        }

        try {
          const [teamRes, progressRes] = await Promise.all([
            api.get('/api/team-leader/my-team'),
            api.get('/api/team-leader/my-team/progress'),
          ]);
          setTeamInfo(teamRes.data);
          const prog: Record<string, MemberProgress> = {};
          (progressRes.data.memberProgress as MemberProgress[]).forEach(p => { prog[p.userId] = p; });
          setProgress(prog);
        } catch {
          setTeamInfo(MOCK_TEAM);
          setProgress(MOCK_PROGRESS);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleCopyHomeworkLink = (topicCode: string) => {
    const url = `${window.location.origin}/practice?topicCode=${encodeURIComponent(topicCode)}&mode=study`;
    navigator.clipboard.writeText(url);
    setCopiedTopicCode(topicCode);
    setAssignMsg(`Đã sao chép đường dẫn giao bài [${topicCode}] cho học viên!`);
    setTimeout(() => { setCopiedTopicCode(null); setAssignMsg(null); }, 3500);
  };

  const members = teamInfo?.members ?? [];
  const progList = members.map(m => progress[m.userId]).filter(Boolean);
  const avgScore = progList.length ? progList.reduce((s, p) => s + p.avgScore, 0) / progList.length : 0;
  const activeCount = progList.filter(p => p.totalAttempts > 0).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white py-4 sm:py-6 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <CreatorWorkspaceNav />

        {assignMsg && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs sm:text-sm font-bold">
            <CheckCircle2 size={16} /> {assignMsg}
          </div>
        )}

        {/* Hero Banner: Quản lý Đội nhóm, Tài nguyên & Học viên */}
        <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-emerald-950/40 border border-cyan-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase text-cyan-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                <ShieldCheck size={13} /> Không Gian Quản Trị Lớp Học & Đội Nhóm (Creator & Teacher Hub)
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-white flex flex-wrap items-center gap-2.5">
                <span>{user?.orgUnitName || teamInfo?.orgUnit.name || 'Lớp Học & Đội Nhóm Của Tôi'}</span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {members.length} học viên
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Giáo viên / Chủ sở hữu: <strong className="text-white">{user?.name || 'Creator'}</strong> • Quản lý trực tiếp đề thi Zen Studio, Chủ đề cá nhân và Tiến độ học viên.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link to="/creator/studio" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/20 transition">
                <Sparkles size={14} /> <span>Soạn Đề (Zen Studio)</span>
              </Link>
              <Link to="/creator/topics" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-black transition">
                <FolderTree size={14} /> <span>ZenTopics ({myTopics.length})</span>
              </Link>
              <Link to="/creator/questions" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-black transition">
                <FileQuestion size={14} /> <span>ZenQuestions ({myQuestionCount})</span>
              </Link>
              <Link to="/practice?scope=TEAM" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition">
                <Play size={14} /> <span>Luyện Thi Nhóm</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Học viên trong nhóm', value: members.length, icon: <Users size={16} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
            { label: 'Chủ đề / Đề thi của tôi', value: myTopics.length, icon: <FolderTree size={16} />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Câu hỏi sở hữu', value: myQuestionCount, icon: <FileQuestion size={16} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Điểm TB Học viên', value: avgScore > 0 ? `${avgScore.toFixed(1)}%` : '—', icon: <Trophy size={16} />, color: scoreColor(avgScore), bg: 'bg-indigo-500/10 border-indigo-500/20' },
          ].map(stat => (
            <div key={stat.label} className={`rounded-2xl border p-4 ${stat.bg}`}>
              <div className={`mb-2 ${stat.color}`}>{stat.icon}</div>
              <p className="text-xl font-black text-white">{stat.value}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Kho Đề Thi & Chủ Đề Giao Cho Học Viên */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree size={16} className="text-amber-400" />
              <span className="font-black text-sm text-white">Tài Nguyên Đề Thi & Chủ Đề Đã Giao Cho Học Viên</span>
            </div>
            <Link to="/creator/topics" className="text-xs font-bold text-amber-400 hover:text-amber-300">
              Quản lý toàn bộ ZenTopics &rarr;
            </Link>
          </div>

          {myTopics.length === 0 ? (
            <div className="p-6 text-center rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400">
              Thầy/Cô chưa có chủ đề hoặc đề thi cá nhân nào. Hãy bấm <strong>Soạn Đề (Zen Studio)</strong> hoặc <strong>ZenTopics</strong> để tạo mới!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {myTopics.slice(0, 6).map(top => (
                <div key={top.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 transition flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/40">
                        {top.code}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{top.domainCode || 'EDUCATION'}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-100 line-clamp-1">{top.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setCohortModalTopic(top)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition cursor-pointer"
                    >
                      📊 Báo cáo Lớp
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyHomeworkLink(top.code)}
                      className="py-1.5 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      {copiedTopicCode === top.code ? <Check size={12} /> : <Copy size={12} />}
                      <span>Giao bài</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/creator/questions?topicCode=${encodeURIComponent(top.code)}`)}
                      className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition cursor-pointer"
                      title="Xem câu hỏi của chủ đề này"
                    >
                      Câu hỏi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bảng Tiến độ Học viên trong Đội nhóm */}
        {!loading && (
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-emerald-400" />
                <span className="font-black text-sm text-white">Tiến Độ Học Tập Của Học Viên ({activeCount}/{members.length} đang hoạt động)</span>
              </div>
            </div>
            <div className="divide-y divide-slate-800/40">
              {members.map((member, idx) => {
                const prog = progress[member.userId];
                const completion = prog ? Math.round((prog.correctAnswers / Math.max(prog.totalQuestions, 1)) * 100) : 0;
                return (
                  <div key={member.userId} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
                    <span className="text-xs text-slate-500 font-mono w-5 text-center">{idx + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-cyan-300">
                      {(member.name ?? member.userId).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{member.name ?? member.userId}</p>
                      <p className="text-[11px] text-slate-400">
                        {prog ? `${prog.totalAttempts} lần làm bài · Gần nhất: ${prog.lastAttemptDate || '—'}` : 'Chưa làm bài'}
                      </p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-1 w-32">
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${completion}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400">{completion}% chính xác</span>
                    </div>
                    <div className="w-16 text-right">
                      <span className={`text-sm font-black ${prog ? scoreColor(prog.avgScore) : 'text-slate-600'}`}>
                        {prog ? `${prog.avgScore.toFixed(1)}%` : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {cohortModalTopic && (
          <TeacherCohortDashboardModal
            examTitle={cohortModalTopic.name}
            totalQuestions={cohortModalTopic.questionCountCached || 20}
            topicCode={cohortModalTopic.code}
            onClose={() => setCohortModalTopic(null)}
          />
        )}
      </div>
    </div>
  );
}

export default TeamDashboard;
