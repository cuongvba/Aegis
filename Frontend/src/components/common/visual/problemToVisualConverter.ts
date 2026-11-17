import type { DynamicVisualSpec, VisualParameter } from './visual-types';
import type { InteractiveVisualLesson } from './visualLessonPresets';

const RESERVED_TOKENS = new Set([
  'x', 't', 'e', 'pi', 'sin', 'cos', 'tan', 'sqrt', 'abs', 'ln', 'log', 'exp',
]);

function normalizeMathFragment(raw: string): string {
  return raw
    .replace(/\$/g, '')
    .replace(/\\left|\\right/g, '')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))')
    .replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)')
    .replace(/\\cdot|\\times|·/g, '*')
    .replace(/\\pi|π/gi, 'pi')
    .replace(/\\(sin|cos|tan|ln|log|exp|abs)/g, '$1')
    .replace(/[{}]/g, '')
    .replace(/(\d)([a-zA-Z(])/g, '$1*$2')
    .replace(/([a-zA-Z])(\()/g, (m, fn) => (RESERVED_TOKENS.has(fn) ? m : `${fn}*(`))
    .replace(/\s+/g, ' ')
    .trim();
}

function detectFreeParameters(expr: string): VisualParameter[] {
  const tokens = expr.match(/\b[a-zA-Z]\b/g) || [];
  const unique = Array.from(new Set(tokens)).filter((tok) => !RESERVED_TOKENS.has(tok));
  return unique.slice(0, 3).map((name) => ({
    name,
    value: 1,
    min: -5,
    max: 5,
    step: 0.2,
  }));
}

export function convertProblemTextToVisualLesson(
  rawText: string,
  index = 1,
  subjectHint?: string
): InteractiveVisualLesson | null {
  const clean = (rawText || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean) return null;

  const lower = clean.toLowerCase();

  // 1. Hình học không gian 3D
  const solidMap: Array<{ kw: RegExp; solid: DynamicVisualSpec['solid']; label: string }> = [
    { kw: /hình\s*chóp\s*(?:tứ\s*giác|s\.abcd)|chóp\s*s\.abcd/i, solid: 'pyramid_s_abcd', label: 'Hình chóp S.ABCD (3D)' },
    { kw: /hình\s*chóp\s*(?:tam\s*giác|s\.abc)|tứ\s*diện/i, solid: 'pyramid_s_abc', label: 'Hình chóp S.ABC (3D)' },
    { kw: /lăng\s*trụ/i, solid: 'prism_triangular', label: 'Hình lăng trụ (3D)' },
    { kw: /hình\s*nón|khối\s*nón/i, solid: 'cone', label: 'Hình nón tròn xoay (3D)' },
    { kw: /hình\s*trụ|khối\s*trụ/i, solid: 'cylinder', label: 'Hình trụ tròn xoay (3D)' },
    { kw: /hình\s*cầu|mặt\s*cầu/i, solid: 'sphere', label: 'Mặt cầu 3D' },
  ];

  for (const item of solidMap) {
    if (item.kw.test(clean)) {
      return {
        id: `auto_3d_${index}_${Date.now()}`,
        subject: 'HINH_HOC_3D',
        subjectLabel: subjectHint || 'Hình học 3D Tự động',
        title: `${item.label} — Câu ${index}`,
        summary: clean.slice(0, 140),
        discoveryPrompt: 'Xoay mô hình 3D để quan sát trực quan các yếu tố hình học trong đề bài.',
        spec: {
          type: 'geometry_3d',
          title: item.label,
          solid: item.solid,
          height: 4,
          baseRadius: 3,
          showLabels: true,
          caption: clean.slice(0, 120),
        },
      };
    }
  }

  // 2. Hệ phương trình tham số chuyển động (x(t), y(t)) hoặc ném xiên
  const paramMatch = clean.match(/x\s*(?:\(t\))?\s*=\s*([^,;]+)[,;]\s*y\s*(?:\(t\))?\s*=\s*([^,.;\n]+)/i);
  if (paramMatch) {
    const xFn = normalizeMathFragment(paramMatch[1]);
    const yFn = normalizeMathFragment(paramMatch[2]);
    return {
      id: `auto_param_${index}_${Date.now()}`,
      subject: 'VAT_LY',
      subjectLabel: subjectHint || 'Động học / Tham số (t)',
      title: `Quỹ đạo (x(t), y(t)) — Câu ${index}`,
      summary: clean.slice(0, 140),
      discoveryPrompt: 'Bấm Play để quan sát vật chuyển động dọc theo quỹ đạo theo thời gian t.',
      spec: {
        type: 'function_plot',
        title: `x(t) = ${xFn} ; y(t) = ${yFn}`,
        xRange: [-2, 10],
        yRange: [-2, 8],
        parametric: { xFn, yFn, showTrail: true },
        timeConfig: { min: 0, max: 3.0, step: 0.02, speed: 0.9, loop: true, autoPlay: true, label: 'Thời gian t' },
        morphSteps: [{ timeAt: 0, latex: `x(t)=${paramMatch[1].trim()},\\ y(t)=${paramMatch[2].trim()}`, note: 'Phương trình chuyển động bóc tách tự động' }],
      },
    };
  }

  // 3. Phương trình hàm số / Sóng / Dao động: y = ..., f(x) = ..., u = ...
  const fnMatch = clean.match(/(?:y|u(?:\(x,\s*t\))?|f\(x\)|x\(t\))\s*=\s*([^,;.\n\?]{2,80})/i);
  if (fnMatch) {
    let rawExpr = fnMatch[1].trim();
    // Nếu là x(t) = ... thì ánh xạ t -> x hoặc giữ t làm biến thời gian
    const isOscillation = /^x\(t\)|^u/i.test(fnMatch[0]) || /\bt\b/.test(rawExpr);
    const expr = normalizeMathFragment(rawExpr);
    const params = detectFreeParameters(expr);
    const animateParam = !/\bt\b/.test(expr) && params.length > 0 ? params[0].name : undefined;

    return {
      id: `auto_fn_${index}_${Date.now()}`,
      subject: isOscillation ? 'VAT_LY' : 'TOAN',
      subjectLabel: subjectHint || (isOscillation ? 'Dao động & Sóng' : 'Hàm số & Đồ thị'),
      title: `Đồ thị ${fnMatch[0].trim()} — Câu ${index}`,
      summary: clean.slice(0, 140),
      discoveryPrompt: isOscillation
        ? 'Nhấn Chạy t để quan sát đồ thị biến đổi theo thời gian thực 60fps.'
        : 'Rê chuột trên đường cong để đọc tọa độ và điều chỉnh thanh trượt tham số.',
      spec: {
        type: 'function_plot',
        title: fnMatch[0].trim(),
        fn: expr,
        xRange: [-5, 5],
        yRange: [-5, 5],
        parameters: params,
        animateParam,
        timeConfig: (isOscillation || animateParam)
          ? { min: animateParam ? -3 : 0, max: animateParam ? 3 : 6.28, step: 0.05, speed: 1.2, loop: true, autoPlay: true, label: animateParam ? `Tham số ${animateParam}` : 'Thời gian t' }
          : undefined,
        morphSteps: [{ timeAt: 0, latex: fnMatch[0].trim(), note: 'Phương trình bóc tách tự động từ đề bài' }],
      },
    };
  }

  // 4. Fallback thông minh cho câu hỏi chứa từ khóa ném xiên / sóng
  if (lower.includes('ném xiên') || lower.includes('quỹ đạo')) {
    return {
      id: `auto_proj_${index}_${Date.now()}`,
      subject: 'VAT_LY',
      subjectLabel: 'Vật Lý · Ném xiên',
      title: `Mô phỏng Ném xiên — Câu ${index}`,
      summary: clean.slice(0, 140),
      discoveryPrompt: 'Tạm dừng tại đỉnh quỹ đạo để phân tích vận tốc cực tiểu.',
      spec: {
        type: 'function_plot',
        title: 'Quỹ đạo ném xiên (x(t), y(t))',
        xRange: [-1, 9],
        yRange: [-1, 5],
        parametric: { xFn: '3.2 * t', yFn: '4.5 * t - 2.4 * t^2', showTrail: true },
        timeConfig: { min: 0, max: 2.0, step: 0.02, speed: 0.8, loop: true, autoPlay: true, label: 'Thời gian bay t' },
      },
    };
  }

  return null;
}
