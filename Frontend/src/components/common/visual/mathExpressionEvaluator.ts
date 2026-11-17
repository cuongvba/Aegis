/**
 * Bộ ước lượng biểu thức toán học an toàn (Shared Helper)
 * Hỗ trợ nhân ẩn (2x -> 2*x, 2mx -> 2*m*x), đa biến (x, t, m, A, w, phi...) và hàm toán học.
 */
export function evaluateMathExpression(
  rawExpression: string,
  variables: Record<string, number>
): number | null {
  try {
    let expression = (rawExpression || '0')
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))')
      .replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)')
      .replace(/\\cdot|\\times/g, '*')
      .replace(/\\pi/gi, 'pi')
      .replace(/\\(sin|cos|tan|ln|log|exp|abs)/g, '$1')
      .replace(/[{}]/g, '')
      .replace(/(\d)([a-zA-Z(])/g, '$1*$2')
      .replace(/\)(\d|[a-zA-Z(])/g, ')*$1');

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
