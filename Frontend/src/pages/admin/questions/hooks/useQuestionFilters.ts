/**
 * useQuestionFilters — Tách từ AdminQuestionsPage (index.tsx)
 * =============================================================
 * Quản lý state lọc/sắp xếp/phân trang thông minh cho tab "Câu hỏi":
 * - Hỗ trợ Dual-View: HIERARCHY (Theo thứ tự Đề - Phần - Chỉ thị - Câu gốc) vs TIMELINE (Thời gian)
 * - Bộ lọc nhanh theo Đề thi (qExamFilter) tự động trích xuất từ dữ liệu.
 * - Sắp xếp đa tầng số học (Natural Hierarchy Ordering).
 */
import { useEffect, useMemo, useState } from 'react';
import type { LearnerQuestion } from '@/types/quiz';
import type { UserProfile } from '@/types/auth';
import { type BankTopic, getTopicFullPath } from '../types';

export type QuestionScopeFilter = 'ALL' | 'TEAM' | 'MY_QUESTIONS';
export type QuestionViewMode = 'HIERARCHY' | 'TIMELINE';

function readInitialScopeFilter(): QuestionScopeFilter {
  const param = new URLSearchParams(window.location.search).get('scope');
  if (param === 'TEAM') return 'TEAM';
  if (param === 'MY_QUESTIONS') return 'MY_QUESTIONS';
  return 'ALL';
}

function parseHierarchyKey(q: LearnerQuestion) {
  let examRank = 0;
  let partRank = 0;
  let subPartRank = 0;
  let dirRank = 0;

  if (q.hierarchyIndex && q.hierarchyIndex.includes('_')) {
    const parts = q.hierarchyIndex.split('_').map(p => parseInt(p, 10) || 0);
    examRank = parts[0] || 0;
    partRank = parts[1] || 0;
    subPartRank = parts[2] || 0;
    dirRank = parts[3] || 0;
  } else if (q.sourceExamName) {
    const m = q.sourceExamName.match(/\d+/);
    if (m) examRank = parseInt(m[0], 10);
  }

  let qNum = 0;
  if (q.sourceQuestionNo) {
    const m = q.sourceQuestionNo.match(/\d+/);
    if (m) qNum = parseInt(m[0], 10);
  }

  const rowIdx = q.sourceRowIndex || 0;
  return { examRank, partRank, subPartRank, dirRank, qNum, rowIdx };
}

export function useQuestionFilters(
  questions: LearnerQuestion[],
  topics: BankTopic[],
  user: UserProfile | null | undefined,
) {
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [qSearch, setQSearch]           = useState('');
  const [qTypeFilter, setQTypeFilter]   = useState('');
  const [qTopicFilter, setQTopicFilter] = useState('');
  const [qDomainFilter, setQDomainFilter] = useState('ALL');
  const [qTagFilter, setQTagFilter]     = useState<string | null>(null);
  const [qGradeFilter, setQGradeFilter] = useState('');
  const [qTreePathFilter, setQTreePathFilter] = useState('');
  const [qCanonicalTopicFilter, setQCanonicalTopicFilter] = useState('');
  const [qCurriculumSeriesFilter, setQCurriculumSeriesFilter] = useState('');
  const [qSemesterPhaseFilter, setQSemesterPhaseFilter] = useState('');
  const [qScopeFilter, setQScopeFilter] = useState<QuestionScopeFilter>(readInitialScopeFilter);
  const [qExamFilter, setQExamFilter]   = useState<string>('');
  const [qViewMode, setQViewMode]       = useState<QuestionViewMode>('HIERARCHY');
  const [qPage, setQPage]               = useState(1);
  const [qSortField, setQSortField]     = useState('stt');
  const [qSortAsc, setQSortAsc]         = useState(true);
  const qPageSize = 10;

  // Danh sách các đề thi xuất hiện trong ngân hàng câu hỏi
  const availableExams = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => {
      if (q.sourceExamName && q.sourceExamName.trim()) {
        set.add(q.sourceExamName.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [questions]);

  // Reset về trang đầu mỗi khi bộ lọc thay đổi
  useEffect(() => {
    setQPage(1);
  }, [
    qSearch,
    qTypeFilter,
    qTopicFilter,
    qDomainFilter,
    qTagFilter,
    qGradeFilter,
    qTreePathFilter,
    qCanonicalTopicFilter,
    qCurriculumSeriesFilter,
    qSemesterPhaseFilter,
    qScopeFilter,
    qExamFilter,
    qViewMode,
  ]);

  const missingAnswersCount = useMemo(() =>
    questions.filter(q => !q.answerRaw || !q.answerRaw.trim()).length, [questions]);

  const filteredQuestions = useMemo(() => {
    const list = questions.filter(q => {
      const searchLower = qSearch.toLowerCase().trim();
      let matchSearch = true;
      if (searchLower) {
        if (searchLower.startsWith('#')) {
          const tagKeyword = searchLower.substring(1);
          matchSearch = (q.tags || []).some(t => t.toLowerCase().includes(tagKeyword)) || q.content.toLowerCase().includes(searchLower);
        } else {
          matchSearch =
            q.content.toLowerCase().includes(searchLower) ||
            q.id.toLowerCase().includes(searchLower) ||
            (q.tags || []).some(t => t.toLowerCase().includes(searchLower)) ||
            (q.issuingOrg || '').toLowerCase().includes(searchLower) ||
            (q.targetLevel || '').toLowerCase().includes(searchLower);
        }
      }

      const matchType    = !qTypeFilter || q.questionType === qTypeFilter;
      const matchTopic   =
        !qTopicFilter ||
        q.topicCode === qTopicFilter ||
        (q.categoryCode && q.categoryCode === qTopicFilter) ||
        (q.treePath && q.treePath.includes('/' + qTopicFilter + '/'));

      const matchDomain  = !qDomainFilter || qDomainFilter === 'ALL' || q.domainCode === qDomainFilter;
      const matchTag     = !qTagFilter || (q.tags || []).some(t => t.toLowerCase() === qTagFilter.toLowerCase());
      const matchMissing = !showMissingOnly || !q.answerRaw || !q.answerRaw.trim();
      const matchScope =
        qScopeFilter === 'ALL'
          ? true
          : qScopeFilter === 'TEAM'
          ? (q.scope === 'TEAM' || (user?.orgUnitId && q.orgUnitId === user.orgUnitId))
          : qScopeFilter === 'MY_QUESTIONS'
          ? (user?.id && q.creatorId === user.id)
          : true;

      const matchExam = !qExamFilter || q.sourceExamName === qExamFilter;

      // Coordinate facets matching
      const cleanGradeNum = qGradeFilter ? qGradeFilter.replace(/\D/g, '') : '';
      const matchGrade =
        !qGradeFilter ||
        q.grade === qGradeFilter ||
        (cleanGradeNum !== '' && (
          q.grade === `K${cleanGradeNum.padStart(2, '0')}` ||
          (q.targetLevel && (
            q.targetLevel.toLowerCase().includes(qGradeFilter.toLowerCase()) ||
            q.targetLevel.includes(cleanGradeNum) ||
            (cleanGradeNum === '12' && /(?:thpt|tnpt|tốt\s*nghiệp)/i.test(q.targetLevel))
          )) ||
          (cleanGradeNum === '12' && q.topicCode && /(?:thpt|tnpt)/i.test(q.topicCode)) ||
          (q.tags || []).some(t => {
            const ut = t.toUpperCase();
            return ut.includes(`K${cleanGradeNum.padStart(2, '0')}`) ||
                   ut.includes(`LOP${cleanGradeNum}`) ||
                   (cleanGradeNum === '12' && (ut.includes('TNPT') || ut.includes('THPT') || ut.includes('TOTNGHIEP')));
          })
        )) ||
        (q.treePath && q.treePath.includes('/' + qGradeFilter));

      const matchTreePath =
        !qTreePathFilter ||
        (q.treePath && q.treePath.startsWith(qTreePathFilter)) ||
        (q.domainCode && `/${q.domainCode}/${q.topicCode || ''}`.startsWith(qTreePathFilter));

      const matchCanonical =
        !qCanonicalTopicFilter ||
        q.canonicalTopicCode === qCanonicalTopicFilter;

      const matchSeries =
        !qCurriculumSeriesFilter ||
        q.curriculumSeries === qCurriculumSeriesFilter ||
        (q.tags || []).some(t => t.toUpperCase() === qCurriculumSeriesFilter.toUpperCase());

      const matchTerm =
        !qSemesterPhaseFilter ||
        q.semesterPhase === qSemesterPhaseFilter ||
        (q.tags || []).some(t => t.toUpperCase() === qSemesterPhaseFilter.toUpperCase());

      return (
        matchSearch &&
        matchType &&
        matchTopic &&
        matchDomain &&
        matchTag &&
        matchMissing &&
        matchScope &&
        matchExam &&
        matchGrade &&
        matchTreePath &&
        matchCanonical &&
        matchSeries &&
        matchTerm
      );
    });

    list.sort((a, b) => {
      if (qSortField === 'stt') {
        if (qViewMode === 'HIERARCHY') {
          const tA = parseHierarchyKey(a);
          const tB = parseHierarchyKey(b);
          if (tA.examRank !== tB.examRank) return qSortAsc ? tA.examRank - tB.examRank : tB.examRank - tA.examRank;
          if (tA.partRank !== tB.partRank) return qSortAsc ? tA.partRank - tB.partRank : tB.partRank - tA.partRank;
          if (tA.subPartRank !== tB.subPartRank) return qSortAsc ? tA.subPartRank - tB.subPartRank : tB.subPartRank - tA.subPartRank;
          if (tA.dirRank !== tB.dirRank) return qSortAsc ? tA.dirRank - tB.dirRank : tB.dirRank - tA.dirRank;
          if (tA.qNum !== tB.qNum) return qSortAsc ? tA.qNum - tB.qNum : tB.qNum - tA.qNum;
          if (tA.rowIdx !== tB.rowIdx) return qSortAsc ? tA.rowIdx - tB.rowIdx : tB.rowIdx - tA.rowIdx;
          return qSortAsc ? questions.indexOf(a) - questions.indexOf(b) : questions.indexOf(b) - questions.indexOf(a);
        } else {
          // TIMELINE MODE: Mặc định câu mới nhất lên đầu
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (timeA !== timeB) return qSortAsc ? timeA - timeB : timeB - timeA;
          return qSortAsc ? questions.indexOf(a) - questions.indexOf(b) : questions.indexOf(b) - questions.indexOf(a);
        }
      }

      let valA: any = '';
      let valB: any = '';
      if (qSortField === 'content') { valA = a.content || ''; valB = b.content || ''; }
      else if (qSortField === 'questionType') { valA = a.questionType || ''; valB = b.questionType || ''; }
      else if (qSortField === 'topicCode') {
        const tA = topics.find(t => t.code === a.topicCode || t.categoryCode === a.topicCode);
        const tB = topics.find(t => t.code === b.topicCode || t.categoryCode === b.topicCode);
        valA = tA ? getTopicFullPath(tA, topics) : a.topicCode || '';
        valB = tB ? getTopicFullPath(tB, topics) : b.topicCode || '';
      }
      else if (qSortField === 'difficulty') { valA = a.difficulty || 0; valB = b.difficulty || 0; }
      if (typeof valA === 'string') return qSortAsc ? valA.localeCompare(valB, 'vi', { sensitivity: 'base' }) : valB.localeCompare(valA, 'vi', { sensitivity: 'base' });
      return qSortAsc ? valA - valB : valB - valA;
    });

    return list;
  }, [
    questions,
    qSearch,
    qTypeFilter,
    qTopicFilter,
    qDomainFilter,
    qTagFilter,
    qGradeFilter,
    qTreePathFilter,
    qCanonicalTopicFilter,
    qCurriculumSeriesFilter,
    qSemesterPhaseFilter,
    qScopeFilter,
    qExamFilter,
    qViewMode,
    qSortField,
    qSortAsc,
    showMissingOnly,
    topics,
    user,
  ]);

  const pagedQuestions = useMemo(() => {
    const start = (qPage - 1) * qPageSize;
    return filteredQuestions.slice(start, start + qPageSize);
  }, [filteredQuestions, qPage]);

  const qTotalPages = Math.ceil(filteredQuestions.length / qPageSize);

  // Reset về mặc định (dùng sau khi import hàng loạt câu hỏi mới)
  const resetFilters = (preferredExam?: string) => {
    setQTopicFilter('');
    setQDomainFilter('ALL');
    setQTagFilter(null);
    setQGradeFilter('');
    setQTreePathFilter('');
    setQCanonicalTopicFilter('');
    setQCurriculumSeriesFilter('');
    setQSemesterPhaseFilter('');
    setQSearch('');
    setQExamFilter(preferredExam || '');
    setQViewMode('HIERARCHY');
    setQSortField('stt');
    setQSortAsc(true);
    setQPage(1);
  };

  return {
    // filter state
    showMissingOnly, setShowMissingOnly,
    qSearch, setQSearch,
    qTypeFilter, setQTypeFilter,
    qTopicFilter, setQTopicFilter,
    qDomainFilter, setQDomainFilter,
    qTagFilter, setQTagFilter,
    qGradeFilter, setQGradeFilter,
    qTreePathFilter, setQTreePathFilter,
    qCanonicalTopicFilter, setQCanonicalTopicFilter,
    qCurriculumSeriesFilter, setQCurriculumSeriesFilter,
    qSemesterPhaseFilter, setQSemesterPhaseFilter,
    qScopeFilter, setQScopeFilter,
    qExamFilter, setQExamFilter,
    availableExams,
    qViewMode, setQViewMode,
    qPage, setQPage,
    qSortField, setQSortField,
    qSortAsc, setQSortAsc,
    qPageSize,
    // derived
    missingAnswersCount,
    filteredQuestions,
    pagedQuestions,
    qTotalPages,
    resetFilters,
  };
}
