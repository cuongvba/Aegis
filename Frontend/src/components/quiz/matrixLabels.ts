export const SUBJECT_DISPLAY_MAP: Record<string, string> = {
  TOAN: 'Toán học',
  VAT_LY: 'Vật lý',
  HOA_HOC: 'Hóa học',
  SINH_HOC: 'Sinh học',
  TIENG_ANH: 'Tiếng Anh',
  NGU_VAN: 'Ngữ văn',
  LICH_SU: 'Lịch sử',
  DIA_LY: 'Địa lý',
  TIN_HOC: 'Tin học',
  GDCD: 'GDCD / GDKT&PL',
  KHTN: 'Khoa học Tự nhiên',
  KHXH: 'Khoa học Xã hội',
  TIN_DUNG_AML: 'Tín dụng & AML',
  ISO_27001: 'An ninh mạng & ISO 27001',
  HSE_SAFETY: 'An toàn Lao động (HSE)',
};

export function formatSubjectLabel(code: string): string {
  const norm = (code || '').trim().toUpperCase();
  return SUBJECT_DISPLAY_MAP[norm] || norm;
}

export function formatGradeLabel(grade: string): string {
  const norm = (grade || '').trim().toUpperCase();
  if (!norm || norm === 'ALL') return 'Tất cả khối / cấp bậc';
  const m = norm.match(/^K?0?(\d{1,2})$/);
  if (m) return `Khối ${Number(m[1])}`;
  return grade;
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
