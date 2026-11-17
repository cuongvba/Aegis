/**
 * Bộ ước lượng biểu thức toán học an toàn (Shared Helper)
 * Hỗ trợ đa biến: x, t, và các tham số động (m, a, b, A, w, phi...).
 */
export function evaluateMathExpression(
  rawExpression: string,
  variables: Record<string, number>
): number | null {
  try {
    let expression = rawExpression || '0';

    for (const [k, v] of Object.entries(variables)) {
      if (!Number.isFinite(v)) continue;
      const regex = new RegExp(`\\b${k}\\b`, 'g');
      expression = expression.replace(regex, `(${v})`);
    }

    const sanitized = expression
      .replace(/\^/g, '**')
      .replace(/\bsin\(/g, 'Math.sin(')
      .replace(/\bcos\(/g, 'Math.cos(')
      .replace(/\btan\(/g, 'Math.tan(')
      .replace(/\bsqrt\(/g, 'Math.sqrt(')
      .replace(/\babs\(/g, 'Math.abs(')
      .replace(/\bln\(/g, 'Math.log(')
      .replace(/\blog\(/g, 'Math.log10(')
      .replace(/\bexp\(/g, 'Math.exp(')
      .replace(/e\^/g, 'Math.exp(')
      .replace(/\bpi\b/gi, 'Math.PI')
      .replace(/\be\b/g, 'Math.E');

    const fnCalc = new Function(`"use strict"; return (${sanitized});`);
    const res = fnCalc();
    if (typeof res !== 'number' || Number.isNaN(res) || !Number.isFinite(res)) {
      return null;
    }
    return res;
  } catch {
    return null;
  }
}
