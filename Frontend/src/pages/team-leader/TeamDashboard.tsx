import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Trophy,
  Play,
  FolderTree,
  FileQuestion,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  BarChart3,
  UserPlus,
  Settings,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { CreatorWorkspaceNav } from '@/pages/creator/components/CreatorWorkspaceNav';
import { TeacherCohortDashboardModal } from '@/pages/creator/studio/components/TeacherCohortDashboardModal';
import {
  useTeamManagement,
  type TeamMemberRecord,
} from './hooks/useTeamManagement';
import { TeamMembersTableSection } from './components/TeamMembersTableSection';
import { TeamMemberManagerModal } from './components/TeamMemberManagerModal';
import { TeamSettingsModal } from './components/TeamSettingsModal';

export const TeamDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const team = useTeamManagement(user?.id);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [diagnosticTopic, setDiagnosticTopic] = useState<{
    code: string;
    name: string;
    totalQuestions: number;
  } | null>(null);

  // Modals state
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMemberRecord | null>(null);
  const [teamSettingsOpen, setTeamSettingsOpen] = useState(false);
  const [teamSettingsMode, setTeamSettingsMode] = useState<'edit' | 'create'>('edit');

  const handleCopyPracticeLink = (topicCode: string) => {
    const link = `${window.location.origin}/practice?topic=${encodeURIComponent(topicCode)}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopiedCode(topicCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRemoveMember = async (member: TeamMemberRecord) => {
    if (
      !window.confirm(
        `Thầy/Cô có chắc chắn muốn gỡ học viên "${member.fullName}" (${member.email}) khỏi nhóm "${team.orgUnit?.name}"?`
      )
    ) {
      return;
    }
    try {
      await team.removeMember(member.userId);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi gỡ thành viên khỏi nhóm.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-4 sm:py-6 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <CreatorWorkspaceNav />

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/50 via-slate-900 to-emerald-950/30 border border-indigo-500/25 rounded-2xl p-5 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold uppercase tracking-wider">
              <ShieldCheck size={14} />
              <span>Không Gian Quản Trị Lớp Học &amp; Đội Nhóm Thực Tế (PostgreSQL SSoT)</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {team.orgUnit?.name ?? 'Lớp Học & Đội Nhóm Aegis'}
              </h1>
              {team.orgUnit?.code && (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold">
                  {team.orgUnit.code}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                {team.members.length} thành viên
              </span>

              {team.allTeams.length > 1 && (
                <select
                  value={team.selectedOrgUnitId}
                  onChange={(e) => team.handleSelectTeam(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                >
                  {team.allTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      Chuyển nhóm: {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Trưởng nhóm / Giáo viên: <strong className="text-slate-200">{user?.name || 'Giáo viên'}</strong>
              {team.orgUnit?.address ? ` • ${team.orgUnit.address}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => team.fetchTeamAndResources()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw size={13} className={team.loading ? 'animate-spin text-emerald-400' : ''} />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTeamSettingsMode('edit');
                setTeamSettingsOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <Settings size={13} className="text-indigo-400" />
              <span>Sửa Thông Tin Nhóm</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTeamSettingsMode('create');
                setTeamSettingsOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition cursor-pointer"
            >
              <PlusCircle size={13} />
              <span>+ Tạo Lớp/Nhóm Mới</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingMember(null);
                setMemberModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <UserPlus size={14} />
              <span>+ Thêm Học Viên</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/creator/studio')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Zen Studio</span>
            </button>
          </div>
        </div>

        {/* 4 Real KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <Users className="w-5 h-5 text-indigo-400 mb-2" />
            <div className="text-2xl font-bold text-white">{team.members.length}</div>
            <div className="text-xs text-slate-400">
              Thành viên thật trong nhóm ({team.activeMembersCount} đã làm bài)
            </div>
          </div>

          <div
            onClick={() => navigate('/creator/topics')}
            className="bg-slate-900 border border-amber-500/25 hover:border-amber-500/50 rounded-2xl p-4 cursor-pointer transition"
          >
            <FolderTree className="w-5 h-5 text-amber-400 mb-2" />
            <div className="text-2xl font-bold text-white">{team.myTopics.length}</div>
            <div className="text-xs text-amber-300/80 flex items-center justify-between">
              <span>Nhánh chủ đề phân cấp</span>
              <ExternalLink size={12} />
            </div>
          </div>

          <div
            onClick={() => navigate('/creator/questions')}
            className="bg-slate-900 border border-emerald-500/25 hover:border-emerald-500/50 rounded-2xl p-4 cursor-pointer transition"
          >
            <FileQuestion className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="text-2xl font-bold text-white">{team.myQuestions.length}</div>
            <div className="text-xs text-emerald-300/80 flex items-center justify-between">
              <span>Câu hỏi thuộc chủ quyền</span>
              <ExternalLink size={12} />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <Trophy className="w-5 h-5 text-purple-400 mb-2" />
            <div className="text-2xl font-bold text-white">{team.avgTeamScore}%</div>
            <div className="text-xs text-slate-400">Điểm TB thực tế của nhóm</div>
          </div>
        </div>

        {/* Real Member Management & Progress Table */}
        <TeamMembersTableSection
          members={team.members}
          activeMembersCount={team.activeMembersCount}
          onOpenAddMember={() => {
            setEditingMember(null);
            setMemberModalOpen(true);
          }}
          onOpenEditMember={(m) => {
            setEditingMember(m);
            setMemberModalOpen(true);
          }}
          onRemoveMember={handleRemoveMember}
        />

        {/* Hierarchical Topics & Exam Resources Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree size={16} className="text-amber-400" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                Tài Nguyên Đề Thi &amp; Cây Chủ Đề Đã Giao ({team.assignableTopicNodes.length})
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/practice')}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <Play size={12} />
                <span>Mở phòng luyện thi &rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/creator/topics')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                Quản lý Cây Chủ Đề &rarr;
              </button>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {team.assignableTopicNodes.slice(0, 9).map((top) => (
              <div
                key={top.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/30 transition flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono text-[10px] font-bold">
                      {top.code}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-emerald-400">
                      {top.totalQuestionCount} câu hỏi
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-2 line-clamp-1" title={top.name}>
                    {top.name}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                    {top.materializedPath || `/${top.code}/`}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() =>
                      setDiagnosticTopic({
                        code: top.code,
                        name: top.name,
                        totalQuestions: top.totalQuestionCount || 10,
                      })
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition cursor-pointer"
                  >
                    <BarChart3 size={12} />
                    <span>Báo cáo Lớp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyPracticeLink(top.code)}
                    className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
                  >
                    {copiedCode === top.code ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedCode === top.code ? 'Đã chép' : 'Giao bài'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/creator/questions?topicCode=${encodeURIComponent(top.code)}`)
                    }
                    className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Câu hỏi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TeamMemberManagerModal
        isOpen={memberModalOpen}
        editingMember={editingMember}
        teamName={team.orgUnit?.name || 'Lớp Học & Đội Nhóm'}
        onClose={() => setMemberModalOpen(false)}
        onSearchAvailable={team.searchAvailableUsers}
        onAddMember={team.addMember}
        onUpdateMember={team.updateMember}
      />

      <TeamSettingsModal
        isOpen={teamSettingsOpen}
        mode={teamSettingsMode}
        currentTeam={team.orgUnit}
        onClose={() => setTeamSettingsOpen(false)}
        onUpdateTeam={team.updateTeamInfo}
        onCreateTeam={team.createNewTeam}
      />

      {diagnosticTopic && (
        <TeacherCohortDashboardModal
          topicCode={diagnosticTopic.code}
          examTitle={diagnosticTopic.name}
          totalQuestions={diagnosticTopic.totalQuestions}
          onClose={() => setDiagnosticTopic(null)}
        />
      )}
    </div>
  );
};

export default TeamDashboard;
