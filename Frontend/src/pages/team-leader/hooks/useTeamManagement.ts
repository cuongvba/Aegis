import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/services/api';
import { learnerQuizService } from '@/services/learner-quiz.service';
import type { BankTopic } from '@/pages/admin/questions/types';
import type { LearnerQuestion } from '@/types/quiz';
import {
  buildHierarchicalTopicTree,
  type HierarchicalTopicNode,
} from '@/shared/lib/quiz/topicTreeHelper';

export interface TeamOrgUnitInfo {
  id: string;
  name: string;
  code: string;
  unitType: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  hierarchyPath?: string;
}

export interface TeamMemberRecord {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  subscriptionTier?: string;
  isActive: boolean;
  assignedAt: string;
  totalAttempts: number;
  totalQuestions: number;
  correctAnswers: number;
  avgScore: number;
  lastAttemptDate: string | null;
}

export interface AvailableUserOption {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  subscriptionTier?: string;
}

export function useTeamManagement(userId?: string) {
  const [orgUnit, setOrgUnit] = useState<TeamOrgUnitInfo | null>(null);
  const [allTeams, setAllTeams] = useState<TeamOrgUnitInfo[]>([]);
  const [selectedOrgUnitId, setSelectedOrgUnitId] = useState<string>('');
  const [members, setMembers] = useState<TeamMemberRecord[]>([]);
  const [myTopics, setMyTopics] = useState<BankTopic[]>([]);
  const [myQuestions, setMyQuestions] = useState<LearnerQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamAndResources = useCallback(
    async (targetUnitId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const unitParam = targetUnitId || selectedOrgUnitId;
        const query = unitParam ? `?orgUnitId=${encodeURIComponent(unitParam)}` : '';

        const [teamRes, topicsRes, questionsRes] = await Promise.all([
          api.get(`/api/team-leader/my-team${query}`),
          learnerQuizService.getTopics(false, true),
          learnerQuizService.getQuestions({ myOnly: true }),
        ]);

        const data = teamRes.data;
        if (data?.orgUnit) {
          setOrgUnit(data.orgUnit);
          if (!selectedOrgUnitId || targetUnitId) {
            setSelectedOrgUnitId(data.orgUnit.id);
          }
        }
        setAllTeams(Array.isArray(data?.allTeams) ? data.allTeams : data?.orgUnit ? [data.orgUnit] : []);
        setMembers(Array.isArray(data?.members) ? data.members : []);
        setMyTopics(topicsRes);
        setMyQuestions(questionsRes);
      } catch (err: any) {
        console.error('[useTeamManagement] Failed to load real team data:', err);
        setError(err?.response?.data?.message || 'Không thể tải dữ liệu đội nhóm từ máy chủ.');
      } finally {
        setLoading(false);
      }
    },
    [selectedOrgUnitId]
  );

  useEffect(() => {
    fetchTeamAndResources();
  }, [userId]);

  const handleSelectTeam = async (unitId: string) => {
    setSelectedOrgUnitId(unitId);
    await fetchTeamAndResources(unitId);
  };

  const updateTeamInfo = async (payload: {
    name: string;
    code?: string;
    description?: string;
    email?: string;
    phoneNumber?: string;
  }) => {
    await api.put('/api/team-leader/my-team', {
      orgUnitId: orgUnit?.id || selectedOrgUnitId || undefined,
      ...payload,
    });
    await fetchTeamAndResources(orgUnit?.id);
  };

  const createNewTeam = async (payload: { name: string; code?: string; description?: string }) => {
    const res = await api.post('/api/team-leader/teams', payload);
    const newId = res.data?.orgUnit?.id;
    await fetchTeamAndResources(newId);
    return res.data;
  };

  const searchAvailableUsers = async (search = ''): Promise<AvailableUserOption[]> => {
    const params = new URLSearchParams();
    if (orgUnit?.id) params.set('orgUnitId', orgUnit.id);
    if (search.trim()) params.set('search', search.trim());
    const res = await api.get<AvailableUserOption[]>(
      `/api/team-leader/available-users?${params.toString()}`
    );
    return Array.isArray(res.data) ? res.data : [];
  };

  const addMember = async (payload: {
    userId?: string;
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    password?: string;
  }) => {
    const res = await api.post('/api/team-leader/my-team/members', {
      orgUnitId: orgUnit?.id || undefined,
      ...payload,
    });
    await fetchTeamAndResources(orgUnit?.id);
    return res.data;
  };

  const updateMember = async (
    memberId: string,
    payload: { fullName?: string; email?: string; phoneNumber?: string }
  ) => {
    const res = await api.put(`/api/team-leader/my-team/members/${memberId}`, payload);
    await fetchTeamAndResources(orgUnit?.id);
    return res.data;
  };

  const removeMember = async (memberId: string) => {
    const query = orgUnit?.id ? `?orgUnitId=${encodeURIComponent(orgUnit.id)}` : '';
    await api.delete(`/api/team-leader/my-team/members/${memberId}${query}`);
    await fetchTeamAndResources(orgUnit?.id);
  };

  const { roots: topicTreeRoots, nodeByCode } = useMemo(
    () => buildHierarchicalTopicTree(myTopics, myQuestions),
    [myTopics, myQuestions]
  );

  // Danh sách các nhánh chủ đề có câu hỏi (hoặc chủ đề lá) để giao bài & xem báo cáo
  const assignableTopicNodes: HierarchicalTopicNode[] = useMemo(() => {
    const allNodes = Array.from(nodeByCode.values());
    const leafOrPopulated = allNodes.filter(
      (n) =>
        n.code !== 'STUDIO' &&
        n.code !== 'COMMUNITY' &&
        !/^STUDIO_\d{8}/.test(n.code) &&
        (n.totalQuestionCount > 0 || n.children.length === 0)
    );
    return leafOrPopulated.length > 0 ? leafOrPopulated : allNodes;
  }, [nodeByCode]);

  const activeMembersCount = useMemo(
    () => members.filter((m) => m.totalAttempts > 0).length,
    [members]
  );

  const avgTeamScore = useMemo(() => {
    const withAttempts = members.filter((m) => m.totalAttempts > 0);
    if (withAttempts.length === 0) return 0;
    const sum = withAttempts.reduce((acc, m) => acc + m.avgScore, 0);
    return Number((sum / withAttempts.length).toFixed(1));
  }, [members]);

  return {
    orgUnit,
    allTeams,
    selectedOrgUnitId,
    handleSelectTeam,
    members,
    myTopics,
    myQuestions,
    topicTreeRoots,
    assignableTopicNodes,
    loading,
    error,
    activeMembersCount,
    avgTeamScore,
    fetchTeamAndResources,
    updateTeamInfo,
    createNewTeam,
    searchAvailableUsers,
    addMember,
    updateMember,
    removeMember,
  };
}

