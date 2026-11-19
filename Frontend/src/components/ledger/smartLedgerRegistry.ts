export type LedgerKind =
  | 'WORK_KPI'
  | 'ATTENDANCE'
  | 'TIMETABLE_MONTH'
  | 'GOOD_DEEDS'
  | 'GROUP_SURVEY'
  | 'STUDY_HABIT'
  | 'PMC_SERVER_ROOM'
  | 'MPD_GENERATOR'
  | 'IT_DEVICE_GATE'
  | 'IT_MAINTENANCE'
  | 'DOC_VAULT_LOG';

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

export interface ResourceAccessPolicy {
  resourceType: string;
  resourceId: string;
  ownerUserId: string;
  orgUnitId?: string;
  visibility: number; // 0=Private, 1=AssignedOnly, 2=OrgUnit, 3=Tenant, 4=Public
  memberPermissions: Record<string, string>;
  lockedFields: string[];
  isApprovedLocked: boolean;
}

export interface SmartLedgerDoc {
  id: string;
  kind: LedgerKind;
  title: string;
  groupName: string;
  columns: LedgerColumnDef[];
  rows: LedgerRowItem[];
  accessPolicy?: ResourceAccessPolicy;
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
  PMC_SERVER_ROOM: {
    label: 'IT: Nhật Ký Phòng Máy Chủ (PMC-01)',
    emoji: '🖥️',
    columns: [
      { key: 'dueDate', label: 'Ngày/Giờ kiểm tra', type: 'text' },
      { key: 'assignee', label: 'Cán bộ vào/kiểm tra', type: 'text' },
      { key: 'task', label: 'Mục đích / Nội dung', type: 'text' },
      { key: 'temp', label: 'Nhiệt độ / Độ ẩm', type: 'text' },
      { key: 'status', label: 'Trạng thái hệ thống', type: 'status', options: ['Bình thường', 'Cảnh báo nhẹ', 'Đang xử lý', 'Hoàn thành'] },
    ],
    sampleRows: [
      { dueDate: '2026-11-19 08:30', assignee: 'Cán bộ IT trực', task: 'Kiểm tra Server, UPS, Điều hòa định kỳ sáng', temp: '21°C / 50%', status: 'Bình thường' },
    ],
  },
  MPD_GENERATOR: {
    label: 'IT: Nhật Ký Máy Phát Điện (MPĐ)',
    emoji: '⚡',
    columns: [
      { key: 'dueDate', label: 'Ngày/Giờ vận hành', type: 'text' },
      { key: 'task', label: 'Mục đích vận hành', type: 'text' },
      { key: 'fuelBefore', label: 'Mức dầu trước (%)', type: 'text' },
      { key: 'fuelAfter', label: 'Mức dầu sau (%)', type: 'text' },
      { key: 'duration', label: 'Tổng phút & Thông số', type: 'text' },
      { key: 'assignee', label: 'Người vận hành', type: 'text' },
      { key: 'status', label: 'Trạng thái', type: 'status', options: ['Đạt chuẩn', 'Cần nạp dầu', 'Bảo trì', 'Hoàn thành'] },
    ],
    sampleRows: [
      { dueDate: '2026-11-19 08:30', task: 'Chạy thử không tải định kỳ hàng tuần', fuelBefore: '85%', fuelAfter: '82%', duration: '30 phút • 380V / 50Hz', assignee: 'Nguyễn Văn A', status: 'Đạt chuẩn' },
    ],
  },
  IT_DEVICE_GATE: {
    label: 'IT: Mang Thiết Bị Vào/Ra (Mẫu 01/04)',
    emoji: '🔐',
    columns: [
      { key: 'dueDate', label: 'Ngày, giờ', type: 'text' },
      { key: 'assignee', label: 'Người yêu cầu & Đơn vị', type: 'text' },
      { key: 'task', label: 'Tên thiết bị & Serial', type: 'text' },
      { key: 'reason', label: 'Lý do mang vào/ra', type: 'text' },
      { key: 'guard', label: 'Xác nhận bảo vệ / IT', type: 'text' },
      { key: 'status', label: 'Trạng thái', type: 'status', options: ['Chờ duyệt', 'Đã cho phép', 'Đã thu hồi/trả', 'Hoàn thành'] },
    ],
    sampleRows: [
      { dueDate: '2026-11-19 09:00', assignee: 'Phòng Tổng hợp', task: 'Laptop Dell Latitude (SN: DL-2026-88)', reason: 'Mang đi bảo hành / công tác', guard: 'Bảo vệ trực cổng', status: 'Đã cho phép' },
    ],
  },
  IT_MAINTENANCE: {
    label: 'IT: Bảo Trì, Bảo Hành (BTBH01/02)',
    emoji: '🛠️',
    columns: [
      { key: 'task', label: 'Tên hệ thống / Thiết bị', type: 'text' },
      { key: 'mode', label: 'Hình thức & Phương thức', type: 'text' },
      { key: 'dueDate', label: 'Thời gian thực hiện', type: 'date' },
      { key: 'assignee', label: 'Người thực hiện', type: 'text' },
      { key: 'status', label: 'Kết quả', type: 'status', options: ['Đang thực hiện', 'Chờ nghiệm thu', 'Hoàn thành'] },
    ],
    sampleRows: [
      { task: 'Hệ thống Firewall & Switch Core', mode: 'Bảo trì định kỳ • Tại chỗ', dueDate: '2026-11-20', assignee: 'Tổ Kỹ thuật IT', status: 'Hoàn thành' },
    ],
  },
  DOC_VAULT_LOG: {
    label: 'IT/Kho: Nhật Ký Kho Chứng Từ (Kho CT)',
    emoji: '🗄️',
    columns: [
      { key: 'dueDate', label: 'Ngày mượn / tra cứu', type: 'date' },
      { key: 'task', label: 'Tên / Số hiệu chứng từ', type: 'text' },
      { key: 'assignee', label: 'Người mượn & Phòng ban', type: 'text' },
      { key: 'approver', label: 'Người duyệt', type: 'text' },
      { key: 'returnDate', label: 'Ngày hẹn trả / Thực trả', type: 'text' },
      { key: 'status', label: 'Tình trạng trả', type: 'status', options: ['Đang mượn', 'Quá hạn', 'Hoàn thành'] },
    ],
    sampleRows: [
      { dueDate: '2026-11-19', task: 'Chứng từ kế toán Tập 02', assignee: 'Nguyễn Thị F - Phòng KTNQ', approver: 'Trưởng phòng KTNQ', returnDate: '2026-11-20', status: 'Hoàn thành' },
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

function normalizeLedger(raw: SmartLedgerDoc): SmartLedgerDoc {
  const tpl = LEDGER_TEMPLATES[raw.kind] || LEDGER_TEMPLATES.WORK_KPI;
  return {
    ...raw,
    columns: Array.isArray(raw.columns) && raw.columns.length > 0 ? raw.columns : tpl.columns,
    rows: Array.isArray(raw.rows) ? raw.rows.map((r, i) => ({ id: r.id || `r-${i}`, cells: r.cells || {} })) : [],
  };
}

export function getLocalLedgers(): SmartLedgerDoc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SmartLedgerDoc[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeLedger);
    }
  } catch { /* ignore */ }
  return [createLedgerFromTemplate('WORK_KPI'), createLedgerFromTemplate('PMC_SERVER_ROOM'), createLedgerFromTemplate('MPD_GENERATOR')];
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
      .map((s) => { try { return normalizeLedger(JSON.parse(s) as SmartLedgerDoc); } catch { return null; } })
      .filter((x): x is SmartLedgerDoc => Boolean(x && x.id));
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
