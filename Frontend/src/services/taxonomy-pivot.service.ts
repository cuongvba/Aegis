import api from './api';

export interface TaxonomyPivotTreeNode {
  id: string;
  label: string;
  code: string;
  nodeType: 'DOMAIN' | 'TOPIC' | 'GRADE' | 'TERM' | 'SERIES' | 'LEAF';
  materializedPath?: string;
  questionCount: number;
  children: TaxonomyPivotTreeNode[];
}

export interface TaxonomyMatrixRow {
  topicCode: string;
  topicName: string;
  countsByGrade: Record<string, number>;
  totalQuestions: number;
}

export interface TaxonomyMatrixSummary {
  domainCode: string;
  grades: string[];
  rows: TaxonomyMatrixRow[];
  grandTotalQuestions: number;
}

export const taxonomyPivotService = {
  /**
   * Lấy cây tri thức xoay trục đa lăng kính (by-subject | by-grade | by-term)
   */
  async getPivotTree(params?: {
    pivot?: 'by-subject' | 'by-grade' | 'by-term';
    domainCode?: string;
    grade?: string;
    topicCode?: string;
  }): Promise<TaxonomyPivotTreeNode[]> {
    const res = await api.get('/api/quiz/topics/pivot-tree', { params });
    return res.data || [];
  },

  /**
   * Lấy ma trận 2 chiều tổng hợp độ phủ tri thức (Môn học x Khối lớp)
   */
  async getMatrixSummary(domainCode = 'EDUCATION'): Promise<TaxonomyMatrixSummary> {
    const res = await api.get('/api/quiz/topics/matrix-summary', {
      params: { domainCode },
    });
    return res.data || { domainCode, grades: [], rows: [], grandTotalQuestions: 0 };
  },
};
