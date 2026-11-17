export const SUBJECT_DISPLAY_MAP: Record<string, { vi: string; en: string }> = {
  TOAN: { vi: 'Toán học', en: 'Mathematics' },
  VAT_LY: { vi: 'Vật lý', en: 'Physics' },
  HOA_HOC: { vi: 'Hóa học', en: 'Chemistry' },
  SINH_HOC: { vi: 'Sinh học', en: 'Biology' },
  TIENG_ANH: { vi: 'Tiếng Anh', en: 'English' },
  NGU_VAN: { vi: 'Ngữ văn', en: 'Literature' },
  LICH_SU: { vi: 'Lịch sử', en: 'History' },
  DIA_LY: { vi: 'Địa lý', en: 'Geography' },
  TIN_HOC: { vi: 'Tin học', en: 'Computer Science' },
  GDCD: { vi: 'GDCD / GDKT&PL', en: 'Civic & Economics' },
  KHTN: { vi: 'Khoa học Tự nhiên', en: 'Natural Sciences' },
  KHXH: { vi: 'Khoa học Xã hội', en: 'Social Sciences' },
  TIN_DUNG_AML: { vi: 'Tín dụng & AML', en: 'Credit & AML' },
  ISO_27001: { vi: 'An ninh mạng & ISO 27001', en: 'Cybersecurity & ISO 27001' },
  HSE_SAFETY: { vi: 'An toàn Lao động (HSE)', en: 'HSE Safety' },
};

export function formatSubjectLabel(code: string, lang: string = 'vi'): string {
  const norm = (code || '').trim().toUpperCase();
  const entry = SUBJECT_DISPLAY_MAP[norm];
  if (!entry) return norm;
  return lang === 'vi' ? entry.vi : entry.en;
}

export function formatGradeLabel(grade: string, lang: string = 'vi'): string {
  const norm = (grade || '').trim().toUpperCase();
  const isVi = lang === 'vi';
  if (!norm || norm === 'ALL') return isVi ? 'Tất cả khối / cấp bậc' : 'All Grades / Levels';
  const m = norm.match(/^K?0?(\d{1,2})$/);
  if (m) return isVi ? `Khối ${Number(m[1])}` : `Grade ${Number(m[1])}`;
  return grade;
}

export function formatSectionTitle(title: string, code: string, lang: string = 'vi'): string {
  if (lang === 'vi') return title.split('.')[0];
  const idx = code.replace('PART_', '');
  return `Part ${idx}`;
}

export function countAvailableForType(
  byType: Record<string, number> | undefined,
  requestedType: string
): number {
  if (!byType) return 0;
  const req = (requestedType || 'SINGLE').toUpperCase();
  if (req === 'MULTI_TRUE_FALSE') {
    return (byType.MULTI_TRUE_FALSE || 0) + (byType.TRUE_FALSE_GROUP || 0) + (byType.MULTI_TF || 0);
  }
  if (req === 'SHORT_ANSWER') {
    return (byType.SHORT_ANSWER || 0) + (byType.FILL_BLANK || 0) + (byType.NUMERIC || 0);
  }
  return byType[req] || 0;
}
