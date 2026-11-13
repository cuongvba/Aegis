import React from 'react';
import { Users, FolderTree, FileQuestion, Trophy, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TeamManagementReturn } from '../hooks/useTeamManagement';

interface ClassroomKpiCardsProps {
  team: TeamManagementReturn;
}

export const ClassroomKpiCards: React.FC<ClassroomKpiCardsProps> = ({ team }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Sĩ số lớp */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-lg backdrop-blur-xl">
        <Users className="w-5 h-5 text-indigo-400 mb-2" />
        <div className="text-2xl font-black text-white">{team.members.length}</div>
        <div className="text-xs text-slate-400 mt-1">
          {t('classroom.kpiMembers', 'Sĩ số học sinh')} ({team.activeMembersCount} {t('classroom.activeCount', 'đã hoàn thành bài')})
        </div>
      </div>

      {/* 2. Cây chủ đề phân cấp */}
      <div
        onClick={() => navigate('/creator/topics')}
        className="bg-slate-900/90 border border-amber-500/25 hover:border-amber-500/50 rounded-3xl p-4 cursor-pointer transition shadow-lg backdrop-blur-xl group"
      >
        <FolderTree className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-105 transition-transform" />
        <div className="text-2xl font-black text-white">{team.myTopics.length}</div>
        <div className="text-xs text-amber-300/80 flex items-center justify-between mt-1">
          <span>{t('classroom.kpiTopics', 'Chuyên đề bài học đã tạo')}</span>
          <ExternalLink size={12} />
        </div>
      </div>

      {/* 3. Ngân hàng câu hỏi */}
      <div
        onClick={() => navigate('/creator/questions')}
        className="bg-slate-900/90 border border-emerald-500/25 hover:border-emerald-500/50 rounded-3xl p-4 cursor-pointer transition shadow-lg backdrop-blur-xl group"
      >
        <FileQuestion className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-105 transition-transform" />
        <div className="text-2xl font-black text-white">{team.myQuestions.length}</div>
        <div className="text-xs text-emerald-300/80 flex items-center justify-between mt-1">
          <span>{t('classroom.kpiQuestions', 'Ngân hàng câu hỏi chủ quyền')}</span>
          <ExternalLink size={12} />
        </div>
      </div>

      {/* 4. Điểm trung bình */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-lg backdrop-blur-xl">
        <Trophy className="w-5 h-5 text-purple-400 mb-2" />
        <div className="text-2xl font-black text-white">{team.avgTeamScore}%</div>
        <div className="text-xs text-slate-400 mt-1">
          {t('classroom.kpiAvgScore', 'Điểm trung bình thực tế cả lớp')}
        </div>
      </div>
    </div>
  );
};

