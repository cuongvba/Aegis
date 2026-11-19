import api from '@/services/api';

export interface IsmsControlItem {
  controlId: string;
  theme: string;
  title: string;
  applicable: boolean;
  status: string;
  evidenceSource: string;
  autoEvidence: boolean;
}

export interface IsmsAssetItem {
  id: string;
  name: string;
  category: string;
  classification: string;
  owner: string;
  controlNote: string;
}

export interface IsmsRiskItem {
  id: string;
  title: string;
  assetName: string;
  likelihood: number;
  impact: number;
  controlEffectiveness: number;
  rawScore: number;
  residualScore: number;
  riskLevel: string;
  requiresRtp: boolean;
  treatmentOwner: string;
  dueDate: string;
  status: string;
  auditSeal: string;
}

export interface IsmsIncidentItem {
  id: string;
  title: string;
  description: string;
  severity: string;
  assignee: string;
  dueDate: string;
  mappedControls: string[];
  containmentAction: string;
  capaChecklist: string[];
  status: string;
  auditSeal: string;
}

export interface IsmsOverviewResponse {
  standard: string;
  compliancePercent: number;
  totpEnabledCount: number;
  highRiskCount: number;
  openIncidentCount: number;
  controls: IsmsControlItem[];
  assets: IsmsAssetItem[];
  risks: IsmsRiskItem[];
  incidents: IsmsIncidentItem[];
}

export const ismsApi = {
  async getOverview(): Promise<IsmsOverviewResponse> {
    const res = await api.get<IsmsOverviewResponse>('/api/isms/overview');
    return res.data;
  },
  async saveAsset(payload: Partial<IsmsAssetItem>) {
    const res = await api.post('/api/isms/assets', payload);
    return res.data;
  },
  async saveRisk(payload: Partial<IsmsRiskItem>) {
    const res = await api.post('/api/isms/risks', payload);
    return res.data;
  },
  async approveRisk(id: string, totpCode?: string) {
    const res = await api.post(`/api/isms/risks/${id}/approve`, { totpCode });
    return res.data;
  },
  async toggleSoa(payload: { controlId: string; status: string; applicable: boolean; evidenceSource: string }) {
    const res = await api.post('/api/isms/soa/toggle', payload);
    return res.data;
  },
  async saveIncident(payload: Partial<IsmsIncidentItem>) {
    const res = await api.post('/api/isms/incidents', payload);
    return res.data;
  },
  async closeIncident(id: string, totpCode?: string) {
    const res = await api.post(`/api/isms/incidents/${id}/close`, { totpCode });
    return res.data;
  },
  async copilot(description: string) {
    const res = await api.post('/api/isms/copilot', { description });
    return res.data;
  },
  async exportAudit() {
    const res = await api.get('/api/isms/audit-export');
    return res.data;
  },
};
