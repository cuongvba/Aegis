/**
 * Scientific LaTeX-to-Spoken-Text Normalizer for Accessibility & STEM Exam Reading.
 * Converts inline ($...$), display ($$...$$), and raw LaTeX expressions into natural
 * Vietnamese or English speech before Neural TTS synthesis.
 */

function replaceNestedCommand(
  input: string,
  cmd: string,
  replacer: (arg1: string, arg2: string) => string,
  twoArgs = true,
): string {
  let out = input;
  const token = `\\${cmd}`;
  let safety = 0;
  while (out.includes(token) && safety++ < 25) {
    const idx = out.indexOf(token);
    let pos = idx + token.length;
    while (pos < out.length && out[pos] === ' ') pos++;
    if (out[pos] !== '{') break;
    const arg1 = readBraced(out, pos);
    if (!arg1) break;
    pos = arg1.end;
    while (pos < out.length && out[pos] === ' ') pos++;
    if (twoArgs) {
      if (out[pos] !== '{') break;
      const arg2 = readBraced(out, pos);
      if (!arg2) break;
      out = out.slice(0, idx) + replacer(arg1.text, arg2.text) + out.slice(arg2.end);
    } else {
      out = out.slice(0, idx) + replacer(arg1.text, '') + out.slice(arg1.end);
    }
  }
  return out;
}

function readBraced(str: string, openIdx: number): { text: string; end: number } | null {
  if (str[openIdx] !== '{') return null;
  let depth = 0;
  for (let i = openIdx; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') {
      depth--;
      if (depth === 0) {
        return { text: str.slice(openIdx + 1, i), end: i + 1 };
      }
    }
  }
  return null;
}

function convertMathExpression(expr: string, isEn: boolean): string {
  let s = expr.trim();
  if (!s) return '';

  // Fractions: \frac, \dfrac, \tfrac
  for (const f of ['dfrac', 'tfrac', 'frac']) {
    s = replaceNestedCommand(
      s,
      f,
      (a, b) => (isEn ? ` ${a} over ${b} ` : ` ${a} phần ${b} `),
      true,
    );
  }

  // Nth root: \sqrt[n]{x} -> căn bậc n của x
  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, (_, n, x) =>
    isEn ? ` ${n}th root of ${x} ` : ` căn bậc ${n} của ${x} `,
  );
  s = replaceNestedCommand(
    s,
    'sqrt',
    (a) => (isEn ? ` square root of ${a} ` : ` căn bậc hai của ${a} `),
    false,
  );

  // Vectors & decorators
  s = replaceNestedCommand(s, 'vec', (a) => (isEn ? ` vector ${a} ` : ` véc tơ ${a} `), false);
  s = replaceNestedCommand(s, 'overrightarrow', (a) => (isEn ? ` vector ${a} ` : ` véc tơ ${a} `), false);
  s = replaceNestedCommand(s, 'overline', (a) => (isEn ? ` ${a} bar ` : ` ${a} ngang `), false);
  s = replaceNestedCommand(s, 'mathbb', (a) => ` ${a} `, false);
  s = replaceNestedCommand(s, 'text', (a) => ` ${a} `, false);

  // Integrals, Sums, Limits with bounds
  s = s.replace(/\\int_\{?([^}\s^]+)\}?\^\{?([^}\s]+)\}?/g, (_, a, b) =>
    isEn ? ` integral from ${a} to ${b} of ` : ` tích phân từ ${a} đến ${b} của `,
  );
  s = s.replace(/\\sum_\{?([^}\s^]+)\}?\^\{?([^}\s]+)\}?/g, (_, a, b) =>
    isEn ? ` sum from ${a} to ${b} of ` : ` tổng từ ${a} đến ${b} của `,
  );
  s = s.replace(/\\lim_\{([^}]+)\}/g, (_, cond) =>
    isEn ? ` limit as ${cond} of ` : ` giới hạn khi ${cond} của `,
  );

  // Powers & Subscripts
  s = s.replace(/\^\{2\}|\^2(?![0-9])/g, isEn ? ' squared ' : ' bình phương ');
  s = s.replace(/\^\{3\}|\^3(?![0-9])/g, isEn ? ' cubed ' : ' lập phương ');
  s = s.replace(/\^\{([^}]+)\}/g, (_, p) => (isEn ? ` to the power of ${p} ` : ` mũ ${p} `));
  s = s.replace(/\^([a-zA-Z0-9])/g, (_, p) => (isEn ? ` to the power of ${p} ` : ` mũ ${p} `));
  s = s.replace(/_\{([^}]+)\}/g, (_, sub) => ` ${sub} `);
  s = s.replace(/_([a-zA-Z0-9])/g, (_, sub) => ` ${sub} `);

  // Functions, Greek letters & Mathematical symbols
  const dict: Array<[RegExp, string, string]> = [
    [/\\int\b/g, ' nguyên hàm của ', ' integral of '],
    [/\\infty\b/g, ' vô cùng ', ' infinity '],
    [/\\alpha\b/g, ' an pha ', ' alpha '],
    [/\\beta\b/g, ' bê ta ', ' beta '],
    [/\\gamma\b/g, ' gam ma ', ' gamma '],
    [/\\delta\b/gi, ' đen ta ', ' delta '],
    [/\\theta\b/g, ' thê ta ', ' theta '],
    [/\\lambda\b/g, ' lam đa ', ' lambda '],
    [/\\pi\b/g, ' pi ', ' pi '],
    [/\\sigma\b/gi, ' xích ma ', ' sigma '],
    [/\\omega\b/gi, ' ô mê ga ', ' omega '],
    [/\\sin\b/g, ' sin ', ' sine '],
    [/\\cos\b/g, ' cốt ', ' cosine '],
    [/\\tan\b/g, ' tang ', ' tangent '],
    [/\\cot\b/g, ' cô tang ', ' cotangent '],
    [/\\ln\b/g, ' lô ga rít tự nhiên ', ' natural log '],
    [/\\log\b/g, ' lô ga rít ', ' log '],
    [/\\leq?|\\le\b/g, ' nhỏ hơn hoặc bằng ', ' less than or equal to '],
    [/\\geq?|\\ge\b/g, ' lớn hơn hoặc bằng ', ' greater than or equal to '],
    [/\\neq?/g, ' khác ', ' not equal to '],
    [/\\approx\b/g, ' xấp xỉ ', ' approximately '],
    [/\\Leftrightarrow|\\iff\b/g, ' tương đương ', ' if and only if '],
    [/\\Rightarrow|\\implies\b/g, ' suy ra ', ' implies '],
    [/\\to\b|\\rightarrow\b/g, ' tiến tới ', ' approaches '],
    [/\\forall\b/g, ' với mọi ', ' for all '],
    [/\\exists\b/g, ' tồn tại ', ' there exists '],
    [/\\notin\b/g, ' không thuộc ', ' not in '],
    [/\\in\b/g, ' thuộc ', ' in '],
    [/\\subset\b/g, ' là tập con của ', ' subset of '],
    [/\\cup\b/g, ' hợp ', ' union '],
    [/\\cap\b/g, ' giao ', ' intersection '],
    [/\\emptyset\b/g, ' tập rỗng ', ' empty set '],
    [/\\pm\b/g, ' cộng trừ ', ' plus or minus '],
    [/\\cdot\b|\\times\b/g, ' nhân ', ' times '],
    [/\\div\b/g, ' chia ', ' divided by '],
    [/\\degree|\^\\circ/g, ' độ ', ' degrees '],
    [/=/g, ' bằng ', ' equals '],
    [/\+/g, ' cộng ', ' plus '],
    [/</g, ' nhỏ hơn ', ' less than '],
    [/>/g, ' lớn hơn ', ' greater than '],
  ];

  for (const [rx, viWord, enWord] of dict) {
    s = s.replace(rx, isEn ? enWord : viWord);
  }

  return s
    .replace(/\\left|\\right|\\cdot|\\,|\\;|\\!/g, ' ')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function latexToSpeech(raw: string, langOrBcp47 = 'vi'): string {
  if (!raw) return '';
  const isEn = langOrBcp47.toLowerCase().startsWith('en');

  let out = raw.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => ` ${convertMathExpression(math, isEn)} `);
  out = out.replace(/\$([^$]+)\$/g, (_, math) => ` ${convertMathExpression(math, isEn)} `);
  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => ` ${convertMathExpression(math, isEn)} `);
  out = out.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => ` ${convertMathExpression(math, isEn)} `);

  return out.replace(/\s+/g, ' ').trim();
}
