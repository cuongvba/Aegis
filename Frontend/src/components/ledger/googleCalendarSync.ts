import type { LedgerRowItem } from './smartLedgerRegistry';

function toCompactDate(dateStr?: string): string {
  const clean = (dateStr || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
  return /^\d{8}$/.test(clean) ? clean : new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

export function buildGoogleCalendarDeepLink(params: {
  title: string;
  details: string;
  dateStr?: string;
  assigneeEmail?: string;
}): string {
  const d = toCompactDate(params.dateStr);
  const query = new URLSearchParams({
    action: 'TEMPLATE',
    text: params.title || 'Nhiệm vụ Aegis',
    dates: `${d}T090000/${d}T100000`,
    details: params.details || 'Giao việc từ Aegis Smart Work & Ledger OS',
  });
  if (params.assigneeEmail?.trim()) query.set('add', params.assigneeEmail.trim());
  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

export function downloadIcsCalendarFile(ledgerTitle: string, rows: LedgerRowItem[]): void {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AegisGlobal//SmartWorkLedger//VI',
    'CALSCALE:GREGORIAN',
  ];

  rows.forEach((r, idx) => {
    const summary = r.cells.task || r.cells.deed || r.cells.topic || r.cells.member || `Mục #${idx + 1}`;
    const d = toCompactDate(r.cells.dueDate || r.cells.date);
    const desc = [
      r.cells.assignee ? `Phụ trách: ${r.cells.assignee}` : '',
      r.cells.status ? `Trạng thái: ${r.cells.status}` : '',
      r.cells.slot ? `Khung giờ: ${r.cells.slot}` : '',
    ].filter(Boolean).join(' | ');

    lines.push(
      'BEGIN:VEVENT',
      `UID:${r.id}-${idx}@aegisglobal`,
      `DTSTAMP:${d}T000000Z`,
      `DTSTART:${d}T090000`,
      `DTEND:${d}T100000`,
      `SUMMARY:[${ledgerTitle}] ${summary}`,
      `DESCRIPTION:${desc}`,
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(ledgerTitle || 'aegis-schedule').replace(/[^a-z0-9_\-]/gi, '_')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function pushEventToGoogleCalendarApi(params: {
  accessToken: string;
  title: string;
  description: string;
  dateStr?: string;
  assigneeEmail?: string;
}): Promise<{ htmlLink: string }> {
  const dateIso = /^\d{4}-\d{2}-\d{2}$/.test(params.dateStr || '') ? params.dateStr! : new Date().toISOString().slice(0, 10);
  const body: Record<string, unknown> = {
    summary: params.title,
    description: params.description,
    start: { dateTime: `${dateIso}T09:00:00+07:00` },
    end: { dateTime: `${dateIso}T10:00:00+07:00` },
  };
  if (params.assigneeEmail?.trim()) {
    body.attendees = [{ email: params.assigneeEmail.trim() }];
  }

  const resp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Google Calendar API lỗi (${resp.status})`);
  return (await resp.json()) as { htmlLink: string };
}
