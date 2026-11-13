import React, { useState } from 'react';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { CreatorWorkspaceNav } from '@/pages/creator/components/CreatorWorkspaceNav';
import { TeacherCohortDashboardModal } from '@/pages/creator/studio/components/TeacherCohortDashboardModal';
import {
  useTeamManagement,
  type TeamMemberRecord,
} from './hooks/useTeamManagement';
import { ClassroomHeader } from './components/ClassroomHeader';
import { ClassroomKpiCards } from './components/ClassroomKpiCards';
import { ClassroomTopicResources } from './components/ClassroomTopicResources';
import { ClassroomAssignmentModal } from './components/ClassroomAssignmentModal';
import { StudentClassroomView } from './components/StudentClassroomView';
import { TeamMembersTableSection } from './components/TeamMembersTableSection';
import { TeamMemberManagerModal } from './components/TeamMemberManagerModal';
import { TeamSettingsModal } from './components/TeamSettingsModal';
import { LiveProctoringGrid } from './components/LiveProctoringGrid';

export const TeamDashboard: React.FC = () => {
  const { user } = useAuthContext();
  const team = useTeamManagement(user?.id);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isStudentPreview, setIsStudentPreview] = useState<boolean>(false);
  const [isLiveProctorOpen, setIsLiveProctorOpen] = useState(false);
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
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const handleCopyPracticeLink = (topicCode: string) => {
    const link = `${window.location.origin}/practice?topic=${encodeURIComponent(topicCode)}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopiedCode(topicCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRemoveMember = async (member: TeamMemberRecord) => {
    if (
      !window.confirm(
        `Thầy/Cô có chắc chắn muốn gỡ học sinh "${member.fullName}" (${member.email}) khỏi lớp "${team.orgUnit?.name}"?`
      )
    ) {
      return;
    }
    try {
      await team.removeMember(member.userId);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Lỗi khi gỡ thành viên khỏi lớp.');
    }
  };

  const handleAssignExamToClass = async (payload: {
    topicCode: string;
    deadline?: string;
    durationMinutes?: number;
    adaptiveMode: boolean;
    antiCheat: boolean;
    shuffleOptions: boolean;
  }) => {
    await team.assignExam(payload.topicCode);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-4 sm:py-6 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <CreatorWorkspaceNav />

        {/* 1. Header Quản trị Sư phạm & Lớp học */}
        <ClassroomHeader
          team={team}
          userName={user?.name}
          isStudentPreview={isStudentPreview}
          onToggleStudentPreview={() => setIsStudentPreview((v) => !v)}
          onOpenTeamSettings={(mode) => {
            setTeamSettingsMode(mode);
            setTeamSettingsOpen(true);
          }}
          onOpenAddMember={() => {
            setEditingMember(null);
            setMemberModalOpen(true);
          }}
          onOpenAssignModal={() => setAssignModalOpen(true)}
          onOpenLiveProctor={() => setIsLiveProctorOpen(true)}
        />

        {/* 2. Nội dung theo góc nhìn */}
        {isStudentPreview ? (
          /* Góc nhìn Học sinh & Tự học */
          <StudentClassroomView
            classNameTitle={team.orgUnit?.name || 'Lớp Học'}
            teacherName={user?.name || 'Thầy/Cô Phụ Trách'}
            assignedTopics={team.assignableTopicNodes}
            onExitPreview={() => setIsStudentPreview(false)}
          />
        ) : (
          /* Góc nhìn Quản trị Sư phạm của Giáo viên */
          <>
            {/* 4 Thẻ KPI Sĩ số, Chuyên đề, Ngân hàng câu hỏi, Điểm TB */}
            <ClassroomKpiCards team={team} />

            {/* Bảng Danh sách Học sinh & Tiến độ thực tế */}
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

            {/* Danh mục Chuyên đề & Học liệu Sư phạm đã giao */}
            <ClassroomTopicResources
              topics={team.assignableTopicNodes}
              copiedCode={copiedCode}
              onCopyPracticeLink={handleCopyPracticeLink}
              onOpenDiagnosticModal={setDiagnosticTopic}
            />
          </>
        )}
      </div>

      {/* Modal Quản lý Học sinh */}
      <TeamMemberManagerModal
        isOpen={memberModalOpen}
        editingMember={editingMember}
        teamName={team.orgUnit?.name || 'Lớp Học'}
        onClose={() => setMemberModalOpen(false)}
        onSearchAvailable={team.searchAvailableUsers}
        onAddMember={team.addMember}
        onUpdateMember={team.updateMember}
      />

      {/* Modal Cấu hình & Tạo Lớp học */}
      <TeamSettingsModal
        isOpen={teamSettingsOpen}
        mode={teamSettingsMode}
        currentTeam={team.orgUnit}
        onClose={() => setTeamSettingsOpen(false)}
        onUpdateTeam={team.updateTeamInfo}
        onCreateTeam={team.createNewTeam}
      />

      {/* Modal 1-Click Giao đề sư phạm */}
      <ClassroomAssignmentModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        classNameTitle={team.orgUnit?.name || 'Lớp Học'}
        topics={team.assignableTopicNodes}
        onAssignExam={handleAssignExamToClass}
      />

      {/* Modal Báo cáo Radar Sư phạm (Live Cohort Telemetry) */}
      {diagnosticTopic && (
        <TeacherCohortDashboardModal
          topicCode={diagnosticTopic.code}
          examTitle={diagnosticTopic.name}
          totalQuestions={diagnosticTopic.totalQuestions}
          onClose={() => setDiagnosticTopic(null)}
        />
      )}

      {/* Modal Giám Sát Coi Thi Live Telemetry Grid */}
      <LiveProctoringGrid
        isOpen={isLiveProctorOpen}
        onClose={() => setIsLiveProctorOpen(false)}
        classNameTitle={team.orgUnit?.name || 'Lớp Học'}
        members={team.members}
      />
    </div>
  );
};

export default TeamDashboard;
