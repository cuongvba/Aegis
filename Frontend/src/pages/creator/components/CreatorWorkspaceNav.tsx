import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, FolderTree, FileQuestion, Users, GraduationCap } from 'lucide-react';
import { LanguageSwitcher } from '@/widgets/app-header/LanguageSwitcher';
import { UserProfileDropdown } from '@/widgets/app-header/UserProfileDropdown';

interface CreatorWorkspaceNavProps {
  rightSlot?: React.ReactNode;
}

export const CreatorWorkspaceNav: React.FC<CreatorWorkspaceNavProps> = ({ rightSlot }) => {
  const { t } = useTranslation('creator');
  const navigate = useNavigate();
  const location = useLocation();

  const navTabs = [
    {
      id: 'studio',
      label: t('workspaceNav.studio', 'Zen Studio (Soạn Đề)'),
      path: '/creator/studio',
      icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
      activeClass: 'bg-indigo-600/25 text-indigo-300 border-indigo-500/40 shadow-sm shadow-indigo-500/10',
    },
    {
      id: 'topics',
      label: t('workspaceNav.topics', 'ZenTopics (Chủ Đề Của Tôi)'),
      path: '/creator/topics',
      icon: <FolderTree className="w-4 h-4 text-amber-400" />,
      activeClass: 'bg-amber-600/25 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10',
    },
    {
      id: 'questions',
      label: t('workspaceNav.questions', 'ZenQuestions (Câu Hỏi Của Tôi)'),
      path: '/creator/questions',
      icon: <FileQuestion className="w-4 h-4 text-emerald-400" />,
      activeClass: 'bg-emerald-600/25 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10',
    },
    {
      id: 'team',
      label: t('workspaceNav.team', 'Đội Nhóm & Học Viên'),
      path: '/team',
      icon: <Users className="w-4 h-4 text-cyan-400" />,
      activeClass: 'bg-cyan-600/25 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/10',
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-slate-900/95 border border-slate-800/90 shadow-lg backdrop-blur-xl">
      {/* Left: Learning Area shortcut + Creator Ecosystem Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer"
          title={t('workspaceNav.backToDashboard', 'Về Khu vực Học tập')}
        >
          <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">{t('workspaceNav.learningHub', 'Học tập')}</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-0.5 hidden sm:block" />

        {navTabs.map((tab) => {
          const isActive =
            location.pathname === tab.path ||
            (tab.id === 'team' && location.pathname.startsWith('/creator/team'));
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isActive
                  ? tab.activeClass
                  : 'bg-slate-950/60 border-transparent text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Custom slot OR LanguageSwitcher + UserProfileDropdown */}
      <div className="flex items-center gap-2.5 ml-auto">
        {rightSlot}
        <LanguageSwitcher />
        <UserProfileDropdown />
      </div>
    </div>
  );
};

export default CreatorWorkspaceNav;

