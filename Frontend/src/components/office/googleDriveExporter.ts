export type GoogleDriveTargetKind = 'GOOGLE_DOC' | 'GOOGLE_SHEET' | 'RAW_FILE';

export interface GoogleDriveUploadResult {
  id: string;
  name: string;
  webViewLink: string;
}

const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as { google?: { accounts?: { oauth2?: unknown } } }).google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.getElementById('aegis-google-gis-oauth');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Không thể tải Google Identity Services.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = 'aegis-google-gis-oauth';
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Không thể kết nối Google Identity Services.'));
    document.head.appendChild(script);
  });
}

export async function requestGoogleDriveAccessToken(clientId: string): Promise<string> {
  const cleanId = clientId.trim();
  if (!cleanId) throw new Error('Vui lòng cấu hình Google Client ID hoặc nhập Access Token.');
  await loadGisScript();

  return new Promise((resolve, reject) => {
    const oauth2 = (window as unknown as {
      google?: {
        accounts?: {
          oauth2?: {
            initTokenClient: (cfg: {
              client_id: string;
              scope: string;
              callback: (resp: { access_token?: string; error?: string }) => void;
            }) => { requestAccessToken: () => void };
          };
        };
      };
    }).google?.accounts?.oauth2;

    if (!oauth2) {
      reject(new Error('Google OAuth2 client chưa sẵn sàng.'));
      return;
    }

    const tokenClient = oauth2.initTokenClient({
      client_id: cleanId,
      scope: DRIVE_FILE_SCOPE,
      callback: (resp) => {
        if (resp?.access_token) resolve(resp.access_token);
        else reject(new Error(resp?.error || 'Người dùng đã hủy cấp quyền Google Drive.'));
      },
    });
    tokenClient.requestAccessToken();
  });
}

export async function uploadToGoogleDrive(params: {
  blob: Blob;
  fileName: string;
  targetKind: GoogleDriveTargetKind;
  accessToken: string;
}): Promise<GoogleDriveUploadResult> {
  const token = params.accessToken.trim();
  if (!token) throw new Error('Thiếu Google Drive Access Token.');

  const metadata: Record<string, string> = { name: params.fileName };
  if (params.targetKind === 'GOOGLE_DOC') {
    metadata.mimeType = 'application/vnd.google-apps.document';
  } else if (params.targetKind === 'GOOGLE_SHEET') {
    metadata.mimeType = 'application/vnd.google-apps.spreadsheet';
  }

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', params.blob, params.fileName);

  const resp = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    },
  );

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Google Drive từ chối (${resp.status}): ${errText.slice(0, 180)}`);
  }

  const data = (await resp.json()) as GoogleDriveUploadResult;
  return {
    id: data.id,
    name: data.name,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
  };
}

export function buildUtf8CsvBlob(rows: string[][]): Blob {
  const csv = rows
    .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  return new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
}
