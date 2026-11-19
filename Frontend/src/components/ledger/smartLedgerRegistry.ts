export type LedgerKind =
  | 'WORK_KPI'
  | 'ATTENDANCE'
  | 'TIMETABLE_MONTH'
  | 'GOOD_DEEDS'
  | 'GROUP_SURVEY'
  | 'STUDY_HABIT';

export type LedgerColType = 'text' | 'email' | 'date' | 'status' | 'percent' | 'stars';

export interface LedgerColumnDef {
  key: string;
  label: string;
  type: LedgerColType;
  options?: string[];
}

export interface LedgerRowItem {
  id: string;
  cells: Record<string, string>;
}

export interface SmartLedgerDoc {
  id: string;
  kind: LedgerKind;
  title: string;
  groupName: string;
  columns: LedgerColumnDef[];
  rows: LedgerRowItem[];
  updatedAt: string;
}

const STORAGE_KEY = 'aegis-smart-ledgers-v1';

export const LEDGER_TEMPLATES: Record<LedgerKind, { label: string; emoji: string; columns: LedgerColumnDef[]; sampleRows: Record<string, string>[] }> = {
  WORK_KPI: {
    label: 'Sổ Công Việc & KPI Cơ Quan',
    emoji: '📋',
    columns: [
      { key: 'task', label: 'Đầu việc / Nhiệm vụ', type: 'text' },
      { key: 'assignee', label: 'Người phụ trách', type: 'text' },
      { key: 'email', label: 'Email (Lịch Google)', type: 'email' },
      { key: 'dueDate', label: 'Hạn chót', type: 'date' },
      { key: 'status', label: 'Trạng thái', type: 'status', options: ['Chờ làm', 'Đang làm', 'Chờ duyệt', 'Hoàn thành'] },
      { key: 'progress', label: 'Tiến độ (%)', type: 'percent' },
      { key: 'rating', label: 'Đánh giá KPI', type: 'stars' },
    ],
    sampleRows: [
      { task: 'Hoàn thiện báo cáo tổng kết quý IV', assignee: 'Nguyễn Minh Anh', email: 'minhanh@example.com', dueDate: '2026-11-25', status: 'Đang làm', progress: '70', rating: '4' },
      { task: 'Chuẩn hóa bộ đề kiểm tra năng lực', assignee: 'Trần Quốc Bảo', email: 'quocbao@example.com', dueDate: '2026-11-22', status: 'Hoàn thành', progress: '100', rating: '5' },
    ],
  },
  ATTENDANCE: {
    label: 'Sổ Điểm Danh Lớp / Nhóm',
    emoji: '✅',
    columns: [
      { key: 'member', label: 'Họ và tên', type: 'text' },
      { key: 'date', label: 'Ngày', type: 'date' },
      { key: 'status', label: 'Trạng thái', type: 'status', options: ['Có mặt', 'Đi muộn', 'Có phép', 'Không phép'] },
      { key: 'note', label: 'Ghi chú', type: 'text' },
    ],
    sampleRows: [
      { member: 'Lê Hoàng Nam', date: '2026-11-19', status: 'Có mặt', note: '' },
      { member: 'Phạm Thảo Vy', date: '2026-11-19', status: 'Có mặt', note: 'Tích cực phát biểu' },
    ],
  },
  TIMETABLE_MONTH: {
    label: 'Thời Khóa Biểu & Lịch Tháng',
    emoji: '🗓️',
    columns: [
      { key: 'task', label: 'Môn học / Hoạt động sinh hoạt', type: 'text' },
      { key: 'dueDate', label: 'Ngày diễn ra', type: 'date' },
      { key: 'slot', label: 'Khung giờ', type: 'text' },
      { key: 'assignee', label: 'Phụ trách / Giáo viên', type: 'text' },
      { key: 'status', label: 'Trạng thái', type: 'status', options: ['Sắp tới', 'Đang diễn ra', 'Hoàn thành'] },
    ],
    sampleRows: [
      { task: 'Sinh hoạt chuyên đề STEM & Robotics', dueDate: '2026-11-21', slot: '08:00 - 10:00', assignee: 'Cô Lan Anh', status: 'Sắp tới' },
      { task: 'Hội thao & Văn nghệ cuối tháng', dueDate: '2026-11-28', slot: '14:00 - 16:30', assignee: 'Ban Chấp Hành', status: 'Sắp tới' },
    ],
  },
  GOOD_DEEDS: {
    label: 'Sổ Thành Tích & Việc Tốt',
    emoji: '🌟',
    columns: [
      { key: 'member', label: 'Thành viên / Học sinh', type: 'text' },
      { key: 'deed', label: 'Việc tốt / Thành tích đã làm', type: 'text' },
      { key: 'date', label: 'Ngày ghi nhận', type: 'date' },
      { key: 'rating', label: 'Sao thưởng (1-5)', type: 'stars' },
      { key: 'mentor', label: 'Người xác nhận', type: 'text' },
    ],
    sampleRows: [
      { member: 'Nguyễn Gia Hân', deed: 'Hướng dẫn bạn mới làm bài tập Toán & nhặt rác sân trường', date: '2026-11-19', rating: '5', mentor: 'Cô Minh' },
    ],
  },
  GROUP_SURVEY: {
    label: 'Khảo Sát Tập Thể & Bình Chọn',
    emoji: '📊',
    columns: [
      { key: 'respondent', label: 'Người tham gia (hoặc Ẩn danh)', type: 'text' },
      { key: 'topic', label: 'Nội dung / Đề xuất cải tiến', type: 'text' },
      { key: 'choice', label: 'Phương án chọn', type: 'status', options: ['Đồng ý cao', 'Cần điều chỉnh', 'Ý kiến khác'] },
      { key: 'rating', label: 'Mức hài lòng', type: 'stars' },
    ],
    sampleRows: [
      { respondent: 'Thành viên #1', topic: 'Tổ chức thêm buổi thực hành ngoại khóa vào sáng thứ 7', choice: 'Đồng ý cao', rating: '5' },
    ],
  },
  STUDY_HABIT: {
    label: 'Lịch Học Tập & Rèn Luyện',
    emoji: '🎯',
    columns: [
      { key: 'task', label: 'Mục tiêu học tập / Rèn luyện', type: 'text' },
      { key: 'dueDate', label: 'Ngày thực hiện', type: 'date' },
      { key: 'status', label: 'Trạng thái', type: 'status', options: ['Chờ làm', 'Đang làm', 'Hoàn thành'] },
      { key: 'progress', label: 'Hoàn thành (%)', type: 'percent' },
      { key: 'rating', label: 'Tự đánh giá', type: 'stars' },
    ],
    sampleRows: [
      { task: 'Đọc 20 trang sách & luyện 15 phút tiếng Anh', dueDate: '2026-11-19', status: 'Hoàn thành', progress: '100', rating: '5' },
    ],
  },
};

export function createLedgerFromTemplate(kind: LedgerKind, customTitle?: string): SmartLedgerDoc {
  const tpl = LEDGER_TEMPLATES[kind];
  return {
    id: `ledger-${Date.now()}`,
    kind,
    title: customTitle?.trim() || tpl.label,
    groupName: 'Nhóm / Cơ quan Mặc định',
    columns: tpl.columns,
    rows: tpl.sampleRows.map((cells, i) => ({ id: `row-${Date.now()}-${i}`, cells: { ...cells } })),
    updatedAt: new Date().toISOString(),
  };
}

export function getLocalLedgers(): SmartLedgerDoc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SmartLedgerDoc[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [createLedgerFromTemplate('WORK_KPI'), createLedgerFromTemplate('ATTENDANCE'), createLedgerFromTemplate('GOOD_DEEDS')];
}

export function saveLocalLedger(doc: SmartLedgerDoc): SmartLedgerDoc[] {
  const list = getLocalLedgers();
  const next = [doc, ...list.filter((l) => l.id !== doc.id)];
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

export async function syncLedgersFromCloud(): Promise<SmartLedgerDoc[]> {
  try {
    const res = await fetch('/api/smart-ledgers');
    if (!res.ok) return getLocalLedgers();
    const rawList = (await res.json()) as string[];
    const remote = rawList
      .map((s) => { try { return JSON.parse(s) as SmartLedgerDoc; } catch { return null; } })
      .filter((x): x is SmartLedgerDoc => Boolean(x && x.id && Array.isArray(x.rows)));
    if (remote.length === 0) return getLocalLedgers();

    const byId = new Map<string, SmartLedgerDoc>();
    [...getLocalLedgers(), ...remote].forEach((d) => byId.set(d.id, d));
    const merged = Array.from(byId.values());
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch { /* ignore */ }
    return merged;
  } catch {
    return getLocalLedgers();
  }
}

export async function pushLedgerToCloud(doc: SmartLedgerDoc): Promise<boolean> {
  try {
    const res = await fetch('/api/smart-ledgers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    return res.ok;
  } catch {
    return false;
  }
}
