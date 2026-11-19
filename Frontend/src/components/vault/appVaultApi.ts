import api from '@/services/api';

export interface AppCatalogItem {
  id: string;
  code: string;
  name: string;
  uri: string;
  governancePolicy: string;
  rotationDays: number;
  relatedAppCodes: string[];
}

export interface AppAccountSummary {
  id: string;
  appCode: string;
  appName: string;
  appUri: string;
  governancePolicy: string;
  relatedAppCodes: string[];
  username: string;
  rotationDays: number;
  lastChangedAt: string;
  nextRotationDate: string;
  daysRemaining: number;
  expiryStatus: 'OK' | 'EXPIRING_SOON' | 'EXPIRED';
  note: string;
  hasEncryptedSecret: boolean;
}

export const appVaultApi = {
  async getCatalog(): Promise<AppCatalogItem[]> {
    const res = await api.get<AppCatalogItem[]>('/api/app-vault/catalog');
    return res.data;
  },
  async saveCatalog(payload: Partial<AppCatalogItem>) {
    const res = await api.post('/api/app-vault/catalog', payload);
    return res.data;
  },
  async getAccounts(): Promise<AppAccountSummary[]> {
    const res = await api.get<AppAccountSummary[]>('/api/app-vault/accounts');
    return res.data;
  },
  async saveAccount(payload: { id?: string; appCode: string; username: string; plainSecret: string; rotationDays?: number; note?: string }) {
    const res = await api.post('/api/app-vault/accounts', payload);
    return res.data;
  },
  async revealSecret(id: string, totpCode: string): Promise<{ id: string; appCode: string; username: string; plainSecret: string }> {
    const res = await api.post(`/api/app-vault/accounts/${id}/reveal`, { totpCode });
    return res.data;
  },
};
