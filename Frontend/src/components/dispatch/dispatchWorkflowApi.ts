import api from '@/services/api';

export interface OfficialDispatchItem {
  id: string;
  dispatchNumber: string;
  direction: 'INCOMING' | 'OUTGOING' | 'INTERNAL_DOC';
  urgency: 'THUONG' | 'KHAN' | 'HOA_TOC';
  title: string;
  contentMarkdown: string;
  status: string;
  executiveDirective: string;
  leadAssignee: string;
  leadAssigneeEmail: string;
  dueDate: string;
  progressPercent: number;
  resultReport: string;
  qualityStars: number;
  slaScore: number;
  finalScore: number;
  auditHistory: string[];
  updatedAt: string;
}

export const dispatchWorkflowApi = {
  async list(): Promise<OfficialDispatchItem[]> {
    const res = await api.get<OfficialDispatchItem[]>('/api/dispatches');
    return res.data;
  },

  async ocrExtract(file: File): Promise<{ dispatchNumber: string; urgency: 'THUONG' | 'KHAN' | 'HOA_TOC'; title: string; contentMarkdown: string }> {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post('/api/dispatches/ocr-extract', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async upsert(payload: Partial<OfficialDispatchItem>): Promise<OfficialDispatchItem> {
    const res = await api.post<OfficialDispatchItem>('/api/dispatches', payload);
    return res.data;
  },

  async transition(
    id: string,
    body: {
      targetStatus: string;
      executiveDirective?: string;
      leadAssignee?: string;
      leadAssigneeEmail?: string;
      dueDate?: string;
      progressPercent?: number;
      resultReport?: string;
      qualityStars?: number;
      note?: string;
    },
  ): Promise<OfficialDispatchItem> {
    const res = await api.post<OfficialDispatchItem>(`/api/dispatches/${id}/transition`, body);
    return res.data;
  },
};
