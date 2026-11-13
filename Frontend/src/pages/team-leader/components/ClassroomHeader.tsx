import React from 'react';
import { 
  ShieldCheck, RefreshCw, Settings, PlusCircle, UserPlus, 
  Send, Eye, EyeOff, Sparkles 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TeamManagementReturn, TeamOrgUnitInfo } from '../hooks/useTeamManagement';

interface ClassroomHeaderProps {
  team: TeamManagementReturn;
  userName?: string;
  isStudentPreview: boolean;
  onToggleStudentPreview: () => void;
  onOpenTeamSettings: (mode: 'create' | 'edit') => void;
  onOpenAddMember: () => void;
  onOpenAssignModal: () => void;
}

export const ClassroomHeader: React.FC<ClassroomHeaderProps> = ({
  team,
  userName = 'Giáo viên',
  isStudentPreview,
  onToggleStudentPreview,
  onOpenTeamSettings,
  onOpenAddMember,
  onOpenAssignModal,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-emerald-950/40 border border-indigo-500/30 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-extrabold uppercase tracking-wider">
          <ShieldCheck size={15} />
          <span>{t('classroom.badge', 'Trung Tâm Quản Trị Sư Phạm & Lớp Học Thích Ứng (PostgreSQL SSoT)')}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {team.orgUnit?.name ?? t('classroom.defaultTitle', 'Lớp Học & Đội Nhóm Sư Phạm')}
          </h1>
          {team.orgUnit?.code && (
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-mono font-bold">
              {team.orgUnit.code}
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
            {team.members.length} {t('classroom.students', 'học sinh')}
          </span>

          {team.allTeams.length > 1 && (
            <select
              value={team.selectedOrgUnitId}
              onChange={(e) => team.handleSelectTeam(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 cursor-pointer shadow-inner"
            >
              {team.allTeams.map((t: TeamOrgUnitInfo) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          )}
        </div>

        <p className="text-xs text-slate-400">
          {t('classroom.teacherLabel', 'Giáo viên phụ trách')}: <strong className="text-slate-200">{userName}</strong>
          {team.orgUnit?.address ? ` • ${team.orgUnit.address}` : ''}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Toggle Góc nhìn học sinh / giáo viên */}
        <button
          type="button"
          onClick={onToggleStudentPreview}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isStudentPreview
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10'
              : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-800'
          }`}
          title={t('classroom.toggleStudentTooltip', 'Chuyển đổi góc nhìn Học sinh để kiểm thử trải nghiệm giao diện')}
        >
          {isStudentPreview ? <EyeOff size={14} className="text-amber-400" /> : <Eye size={14} className="text-cyan-400" />}
          <span>{isStudentPreview ? t('classroom.exitStudentView', 'Về Góc Nhìn Giáo Viên') : t('classroom.studentPreview', 'Góc Nhìn Học Sinh')}</span>
        </button>

        {/* Làm mới */}
        <button
          type="button"
          onClick={() => team.fetchTeamAndResources()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw size={13} className={team.loading ? 'animate-spin text-emerald-400' : ''} />
          <span>{t('common.refresh', 'Làm mới')}</span>
        </button>

        {/* Sửa Lớp */}
        <button
          type="button"
          onClick={() => onOpenTeamSettings('edit')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-bold transition cursor-pointer"
        >
          <Settings size={13} className="text-indigo-400" />
          <span>{t('classroom.editClass', 'Cấu Hình Lớp')}</span>
        </button>

        {/* Tạo Lớp Mới */}
        <button
          type="button"
          onClick={() => onOpenTeamSettings('create')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition cursor-pointer"
        >
          <PlusCircle size={13} />
          <span>{t('classroom.newClass', '+ Tạo Lớp Mới')}</span>
        </button>

        {/* Thêm Học Viên */}
        <button
          type="button"
          onClick={onOpenAddMember}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
        >
          <UserPlus size={14} className="text-emerald-400" />
          <span>{t('classroom.addStudent', '+ Thêm Học Sinh')}</span>
        </button>

        {/* 1-Click Giao Đề Lớp Học */}
        <button
          type="button"
          onClick={onOpenAssignModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
        >
          <Send size={14} />
          <span>{t('classroom.assignExamBtn', 'Giao Đề Lớp Học')}</span>
        </button>
      </div>
    </div>
  );
};

