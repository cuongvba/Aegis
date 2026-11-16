import api from '@/services/api';

export type PivotMode = 'grade' | 'school' | 'subject' | 'purpose';

export interface PivotFacetItem {
  value: string;
  label: string;
  topicCount: number;
  questionCount: number;
}

export interface PivotFacets {
  targetLevels: PivotFacetItem[];
  benchmarkYears: PivotFacetItem[];
  issuingOrgs: PivotFacetItem[];
  domains: PivotFacetItem[];
  assessmentPurposes: PivotFacetItem[];
}

export interface PivotGroupNode {
  key: string;
  label: string;
  axis: string;
  topicCount: number;
  questionCount: number;
  topicCodes: string[];
  children: PivotGroupNode[];
}

export interface CoverageMatrixCell {
  targetLevel: string;
  benchmarkYear: string;
  topicCount: number;
  questionCount: number;
  status: 'EMPTY' | 'SPARSE' | 'HEALTHY';
}

export interface TopicCoordinateProfile {
  topicCode: string;
  domainCode: string;
  targetLevel: string;
  benchmarkYear: string;
  issuingOrg: string;
  assessmentPurpose: string;
  questionCount: number;
}

export interface TopicPivotSummary {
  pivotMode: PivotMode;
  totalTopics: number;
  totalQuestions: number;
  facets: PivotFacets;
  pivotTree: PivotGroupNode[];
  coverageMatrix: CoverageMatrixCell[];
  topicCoordinates: Record<string, TopicCoordinateProfile>;
}

export interface TopicPivotFilter {
  pivotMode: PivotMode;
  domainCode?: string;
  targetLevel?: string;
  benchmarkYear?: string;
  issuingOrg?: string;
  assessmentPurpose?: string;
  myOnly?: boolean;
}

export const topicPivotService = {
  async getPivotSummary(filter: TopicPivotFilter): Promise<TopicPivotSummary | null> {
    try {
      const res = await api.get<TopicPivotSummary>('/api/quiz/topics/pivot-summary', {
        params: {
          pivotMode: filter.pivotMode,
          domainCode: filter.domainCode || undefined,
          targetLevel: filter.targetLevel || undefined,
          benchmarkYear: filter.benchmarkYear || undefined,
          issuingOrg: filter.issuingOrg || undefined,
          assessmentPurpose: filter.assessmentPurpose || undefined,
          myOnly: filter.myOnly ?? false,
        },
      });
      return res.data;
    } catch (err) {
      console.error('[topicPivotService] Failed to fetch pivot summary:', err);
      return null;
    }
  },
};
