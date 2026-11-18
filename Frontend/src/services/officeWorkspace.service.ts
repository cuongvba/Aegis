import api from './api';

export interface OfficeSheet {
  name: string;
  rows: string[][];
}

export interface OfficeParsedDocument {
  fileName: string;
  documentKind: 'DOCX' | 'PDF' | 'XLSX' | 'MARKDOWN';
  title: string;
  markdownContent: string;
  pageCount: number;
  sheets: OfficeSheet[];
  warnings: string[];
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const officeWorkspaceService = {
  async parseFile(file: File): Promise<OfficeParsedDocument> {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post<OfficeParsedDocument>('/api/office-workspace/parse', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async downloadDocx(title: string, markdownContent: string): Promise<void> {
    const res = await api.post(
      '/api/office-workspace/export-docx',
      { title, markdownContent },
      { responseType: 'blob' }
    );
    triggerBlobDownload(res.data as Blob, `${(title || 'aegis-document').trim()}.docx`);
  },

  async downloadXlsx(title: string, sheets: OfficeSheet[]): Promise<void> {
    const res = await api.post(
      '/api/office-workspace/export-xlsx',
      { title, sheets },
      { responseType: 'blob' }
    );
    triggerBlobDownload(res.data as Blob, `${(title || 'aegis-workbook').trim()}.xlsx`);
  },
};
