import api from './api';

export interface ExamMatrixBloomWeights {
  recall: number;
  comprehend: number;
  apply: number;
  highApply: number;
}

export interface ExamMatrixSectionRule {
  code: string;
  title: string;
  questionType: string;
  count: number;
  pointsPerQuestion: number;
}

export interface ExamMatrixTemplate {
  templateCode: string;
  title: string;
  category: string;
  domainCode: string;
  topicCode: string;
  targetLevel?: string;
  durationMinutes: number;
  isSystemDefault: boolean;
  description?: string;
  bloomWeights: ExamMatrixBloomWeights;
  sections: ExamMatrixSectionRule[];
}

export interface GenerateMatrixExamRequest {
  templateCode?: string;
  examTitle?: string;
  domainCode: string;
  topicCode: string;
  targetLevel?: string;
  durationMinutes: number;
  bloomWeights: ExamMatrixBloomWeights;
  sections: ExamMatrixSectionRule[];
}

export interface MatrixSectionCoverage {
  sectionCode: string;
  sectionTitle: string;
  questionType: string;
  requestedCount: number;
  matchedCount: number;
  missingCount: number;
}

export interface MatrixGeneratedQuestion {
  order: number;
  questionId: string;
  sectionCode: string;
  sectionTitle: string;
  content: string;
  questionType: string;
  difficulty: number;
  options: string[];
  correctAnswer?: string;
  explanation?: string;
  contextId?: string;
  contextTitle?: string;
  contextContent?: string;
}

export interface GenerateMatrixExamResponse {
  success: boolean;
  examTitle: string;
  domainCode: string;
  topicCode: string;
  targetLevel?: string;
  durationMinutes: number;
  requestedTotal: number;
  totalQuestions: number;
  missingTotal: number;
  sectionCoverages: MatrixSectionCoverage[];
  questions: MatrixGeneratedQuestion[];
  warningMessage?: string;
}

export interface MatrixInventory {
  domainCode: string;
  topicCode: string;
  targetLevel?: string;
  totalCount: number;
  byQuestionType: Record<string, number>;
  byDifficulty: Record<number, number>;
  availableSubjects: string[];
  availableGrades: string[];
}

export const examMatrixService = {
  async getTemplates(): Promise<ExamMatrixTemplate[]> {
    const res = await api.get<ExamMatrixTemplate[]>('/api/creator/studio/matrix-templates');
    return res.data;
  },

  async getInventory(domainCode: string, topicCode: string, targetLevel?: string): Promise<MatrixInventory> {
    const res = await api.get<MatrixInventory>('/api/creator/studio/matrix-inventory', {
      params: { domainCode, topicCode, targetLevel: targetLevel || undefined },
    });
    return res.data;
  },

  async saveCustomTemplate(template: ExamMatrixTemplate): Promise<ExamMatrixTemplate> {
    const res = await api.post<ExamMatrixTemplate>('/api/creator/studio/matrix-templates', template);
    return res.data;
  },

  async deleteCustomTemplate(templateCode: string): Promise<void> {
    await api.delete(`/api/creator/studio/matrix-templates/${encodeURIComponent(templateCode)}`);
  },

  async generateFromRealBank(request: GenerateMatrixExamRequest): Promise<GenerateMatrixExamResponse> {
    const res = await api.post<GenerateMatrixExamResponse>('/api/creator/studio/generate-matrix-exam', request);
    return res.data;
  },
};
