export interface MathTemplateItem {
  id: string;
  label: string; // KaTeX snippet for button preview or plain text
  latex: string; // Actual LaTeX code inserted
  description: string;
  cursorOffset?: number; // Cursor placement offset
}

export interface MathCategory {
  id: string;
  title: string;
  iconName: string;
  items: MathTemplateItem[];
}

export const MATH_STUDIO_CATEGORIES: MathCategory[] = [
  {
    id: 'basic',
    title: 'Đại số & Số học',
    iconName: 'Divide',
    items: [
      { id: 'frac', label: '\\frac{a}{b}', latex: '\\frac{a}{b}', description: 'Phân số thường' },
      { id: 'dfrac', label: '\\dfrac{a}{b}', latex: '\\dfrac{a}{b}', description: 'Phân số lớn (Display style)' },
      { id: 'sqrt', label: '\\sqrt{x}', latex: '\\sqrt{x}', description: 'Căn bậc hai' },
      { id: 'sqrt_n', label: '\\sqrt[n]{x}', latex: '\\sqrt[n]{x}', description: 'Căn bậc n' },
      { id: 'pow', label: 'x^n', latex: 'x^{n}', description: 'Lũy thừa / Số mũ' },
      { id: 'sub', label: 'x_i', latex: 'x_{i}', description: 'Chỉ số dưới (Subscript)' },
      { id: 'pow_sub', label: 'x_i^n', latex: 'x_{i}^{n}', description: 'Chỉ số trên và dưới' },
      { id: 'abs', label: '|x|', latex: '|x|', description: 'Giá trị tuyệt đối' },
      { id: 'norm', label: '\\|x\\|', latex: '\\|x\\|', description: 'Chuẩn / Độ dài véc-tơ' },
      { id: 'pm', label: '\\pm', latex: '\\pm ', description: 'Cộng trừ (±)' },
      { id: 'mp', label: '\\mp', latex: '\\mp ', description: 'Trừ cộng (∓)' },
      { id: 'times', label: '\\times', latex: '\\times ', description: 'Dấu nhân (×)' },
      { id: 'div', label: '\\div', latex: '\\div ', description: 'Dấu chia (÷)' },
      { id: 'cdot', label: '\\cdot', latex: '\\cdot ', description: 'Dấu chấm nhân (·)' },
      { id: 'approx', label: '\\approx', latex: '\\approx ', description: 'Xấp xỉ (≈)' },
      { id: 'neq', label: '\\neq', latex: '\\neq ', description: 'Khác (≠)' },
      { id: 'le', label: '\\le', latex: '\\le ', description: 'Nhỏ hơn hoặc bằng (≤)' },
      { id: 'ge', label: '\\ge', latex: '\\ge ', description: 'Lớn hơn hoặc bằng (≥)' },
      { id: 'infty', label: '\\infty', latex: '\\infty ', description: 'Vô cực (∞)' },
    ],
  },
  {
    id: 'calculus',
    title: 'Giải tích & Giới hạn',
    iconName: 'TrendingUp',
    items: [
      { id: 'lim', label: '\\lim_{x \\to x_0}', latex: '\\lim_{x \\to x_0} f(x)', description: 'Giới hạn' },
      { id: 'lim_inf', label: '\\lim_{x \\to \\infty}', latex: '\\lim_{x \\to +\\infty} f(x)', description: 'Giới hạn ở vô cực' },
      { id: 'diff', label: 'f\'(x)', latex: 'f\'(x)', description: 'Đạo hàm cấp 1' },
      { id: 'diff2', label: 'f\'\'(x)', latex: 'f\'\'(x)', description: 'Đạo hàm cấp 2' },
      { id: 'df_dx', label: '\\frac{df}{dx}', latex: '\\frac{df}{dx}', description: 'Đạo hàm dạng vi phân' },
      { id: 'partial', label: '\\frac{\\partial f}{\\partial x}', latex: '\\frac{\\partial f}{\\partial x}', description: 'Đạo hàm riêng' },
      { id: 'int', label: '\\int f(x)dx', latex: '\\int f(x)\\,dx', description: 'Tích phân bất định' },
      { id: 'int_ab', label: '\\int_a^b', latex: '\\int_{a}^{b} f(x)\\,dx', description: 'Tích phân xác định từ a đến b' },
      { id: 'iint', label: '\\iint_D', latex: '\\iint_{D} f(x, y)\\,dxdy', description: 'Tích phân kép' },
      { id: 'sum', label: '\\sum_{i=1}^n', latex: '\\sum_{i=1}^{n} a_i', description: 'Tổng Sigma' },
      { id: 'prod', label: '\\prod_{i=1}^n', latex: '\\prod_{i=1}^{n} x_i', description: 'Tích Pi' },
    ],
  },
  {
    id: 'trig',
    title: 'Lượng giác & Logarit',
    iconName: 'Compass',
    items: [
      { id: 'sin', label: '\\sin x', latex: '\\sin(x)', description: 'Hàm Sin' },
      { id: 'cos', label: '\\cos x', latex: '\\cos(x)', description: 'Hàm Cosin' },
      { id: 'tan', label: '\\tan x', latex: '\\tan(x)', description: 'Hàm Tang' },
      { id: 'cot', label: '\\cot x', latex: '\\cot(x)', description: 'Hàm Cotang' },
      { id: 'sin2', label: '\\sin^2 x', latex: '\\sin^2(x)', description: 'Sin bình phương' },
      { id: 'arcsin', label: '\\arcsin x', latex: '\\arcsin(x)', description: 'Arcsin' },
      { id: 'log_a_b', label: '\\log_a b', latex: '\\log_{a}(b)', description: 'Logarit cơ số a' },
      { id: 'ln', label: '\\ln x', latex: '\\ln(x)', description: 'Logarit tự nhiên Nepe' },
      { id: 'deg', label: '30^\\circ', latex: '30^\\circ', description: 'Độ (°)' },
      { id: 'pi_rad', label: '\\frac{\\pi}{2}', latex: '\\frac{\\pi}{2}', description: 'Góc radian Pi' },
    ],
  },
  {
    id: 'geometry',
    title: 'Hình học & Véc-tơ',
    iconName: 'Maximize2',
    items: [
      { id: 'vec_u', label: '\\vec{u}', latex: '\\vec{u}', description: 'Véc-tơ đơn' },
      { id: 'vec_AB', label: '\\overrightarrow{AB}', latex: '\\overrightarrow{AB}', description: 'Véc-tơ qua 2 điểm' },
      { id: 'angle', label: '\\angle ABC', latex: '\\angle{ABC}', description: 'Góc ABC' },
      { id: 'triangle', label: '\\triangle ABC', latex: '\\triangle ABC', description: 'Tam giác ABC' },
      { id: 'perp', label: '\\perp', latex: '\\perp ', description: 'Vuông góc (⊥)' },
      { id: 'parallel', label: '\\parallel', latex: '\\parallel ', description: 'Song song (∥)' },
      { id: 'sim', label: '\\sim', latex: '\\sim ', description: 'Đồng dạng (∼)' },
      { id: 'dot_prod', label: '\\vec{a}\\cdot\\vec{b}', latex: '\\vec{a} \\cdot \\vec{b}', description: 'Tích vô hướng 2 véc-tơ' },
      { id: 'cross_prod', label: '[\\vec{a},\\vec{b}]', latex: '[\\vec{a}, \\vec{b}]', description: 'Tích có hướng trong không gian' },
    ],
  },
  {
    id: 'systems',
    title: 'Hệ PT & Ma trận',
    iconName: 'Grid',
    items: [
      {
        id: 'sys2',
        label: '\\begin{cases} a \\\\ b \\end{cases}',
        latex: '\\begin{cases} a_1 x + b_1 y = c_1 \\\\ a_2 x + b_2 y = c_2 \\end{cases}',
        description: 'Hệ 2 phương trình bậc nhất',
      },
      {
        id: 'sys3',
        label: '\\begin{cases} a \\\\ b \\\\ c \\end{cases}',
        latex: '\\begin{cases} a_1 x + b_1 y + c_1 z = d_1 \\\\ a_2 x + b_2 y + c_2 z = d_2 \\\\ a_3 x + b_3 y + c_3 z = d_3 \\end{cases}',
        description: 'Hệ 3 phương trình 3 ẩn',
      },
      {
        id: 'matrix2x2',
        label: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
        latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
        description: 'Ma trận vuông cấp 2 (ngoặc tròn)',
      },
      {
        id: 'b_matrix2x2',
        label: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}',
        latex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}',
        description: 'Ma trận vuông cấp 2 (ngoặc vuông)',
      },
      {
        id: 'det2x2',
        label: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}',
        latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}',
        description: 'Định thức ma trận cấp 2',
      },
    ],
  },
  {
    id: 'stats',
    title: 'Xác suất & Tổ hợp',
    iconName: 'Layers',
    items: [
      { id: 'C_n_k', label: 'C_n^k', latex: 'C_{n}^{k}', description: 'Tổ hợp chập k của n' },
      { id: 'A_n_k', label: 'A_n^k', latex: 'A_{n}^{k}', description: 'Chỉnh hợp chập k của n' },
      { id: 'P_n', label: 'P_n = n!', latex: 'P_{n} = n!', description: 'Hoán vị của n phần tử' },
      { id: 'P_A_B', label: 'P(A|B)', latex: 'P(A|B) = \\frac{P(AB)}{P(B)}', description: 'Xác suất có điều kiện' },
      { id: 'E_X', label: 'E(X)', latex: 'E(X) = \\sum x_i p_i', description: 'Kỳ vọng toán' },
      { id: 'Var_X', label: 'V(X)', latex: 'V(X) = E(X^2) - [E(X)]^2', description: 'Phương sai' },
      { id: 'sigma_X', label: '\\sigma(X)', latex: '\\sigma(X) = \\sqrt{V(X)}', description: 'Độ lệch chuẩn' },
    ],
  },
  {
    id: 'sets_logic',
    title: 'Tập hợp & Logic',
    iconName: 'CheckSquare',
    items: [
      { id: 'in', label: '\\in', latex: '\\in ', description: 'Thuộc (∈)' },
      { id: 'notin', label: '\\notin', latex: '\\notin ', description: 'Không thuộc (∉)' },
      { id: 'subset', label: '\\subset', latex: '\\subset ', description: 'Tập con (⊂)' },
      { id: 'cup', label: '\\cup', latex: '\\cup ', description: 'Hợp (∪)' },
      { id: 'cap', label: '\\cap', latex: '\\cap ', description: 'Giao (∩)' },
      { id: 'setminus', label: '\\setminus', latex: '\\setminus ', description: 'Hiệu tập hợp (\\)' },
      { id: 'emptyset', label: '\\emptyset', latex: '\\emptyset ', description: 'Tập rỗng (∅)' },
      { id: 'forall', label: '\\forall', latex: '\\forall ', description: 'Với mọi (∀)' },
      { id: 'exists', label: '\\exists', latex: '\\exists ', description: 'Tồn tại (∃)' },
      { id: 'implies', label: '\\implies', latex: '\\implies ', description: 'Suy ra (⇒)' },
      { id: 'iff', label: '\\iff', latex: '\\iff ', description: 'Tương đương (⇔)' },
      { id: 'set_R', label: '\\mathbb{R}', latex: '\\mathbb{R}', description: 'Tập số thực ℝ' },
      { id: 'set_N', label: '\\mathbb{N}', latex: '\\mathbb{N}', description: 'Tập số tự nhiên ℕ' },
      { id: 'set_Z', label: '\\mathbb{Z}', latex: '\\mathbb{Z}', description: 'Tập số nguyên ℤ' },
      { id: 'set_Q', label: '\\mathbb{Q}', latex: '\\mathbb{Q}', description: 'Tập số hữu tỉ ℚ' },
    ],
  },
  {
    id: 'greek',
    title: 'Ký tự Hy Lạp',
    iconName: 'Type',
    items: [
      { id: 'alpha', label: '\\alpha', latex: '\\alpha ', description: 'Alpha (α)' },
      { id: 'beta', label: '\\beta', latex: '\\beta ', description: 'Beta (β)' },
      { id: 'gamma', label: '\\gamma', latex: '\\gamma ', description: 'Gamma (γ)' },
      { id: 'delta', label: '\\delta', latex: '\\delta ', description: 'Delta (δ)' },
      { id: 'Delta_upper', label: '\\Delta', latex: '\\Delta ', description: 'Delta lớn (Δ biệt thức)' },
      { id: 'epsilon', label: '\\epsilon', latex: '\\epsilon ', description: 'Epsilon (ε)' },
      { id: 'theta', label: '\\theta', latex: '\\theta ', description: 'Theta (θ)' },
      { id: 'lambda', label: '\\lambda', latex: '\\lambda ', description: 'Lambda (λ)' },
      { id: 'mu', label: '\\mu', latex: '\\mu ', description: 'Mu (μ)' },
      { id: 'pi', label: '\\pi', latex: '\\pi ', description: 'Pi (π)' },
      { id: 'sigma', label: '\\sigma', latex: '\\sigma ', description: 'Sigma (σ)' },
      { id: 'phi', label: '\\phi', latex: '\\phi ', description: 'Phi (φ)' },
      { id: 'omega', label: '\\omega', latex: '\\omega ', description: 'Omega (ω)' },
      { id: 'Omega_upper', label: '\\Omega', latex: '\\Omega ', description: 'Omega lớn (Ω)' },
    ],
  },
  {
    id: 'chemistry',
    title: 'Hóa học & Phương trình',
    iconName: 'FlaskConical',
    items: [
      { id: 'ce_acid', label: '\\ce{H2SO4}', latex: '\\ce{H2SO4}', description: 'Axit Sunfuric' },
      { id: 'ce_reaction', label: '\\ce{A + B -> C}', latex: '\\ce{2H2 + O2 -> 2H2O}', description: 'Phương trình phản ứng' },
      { id: 'ce_temp', label: '\\ce{->[t^o]}', latex: '\\ce{CaCO3 ->[{t^\\circ}] CaO + CO2 ^}', description: 'Phản ứng có điều kiện nhiệt độ' },
      { id: 'ce_ion', label: '\\ce{Fe^{3+}}', latex: '\\ce{Fe^{3+} + 3OH^- -> Fe(OH)3 v}', description: 'Ion & Kết tủa' },
      { id: 'ce_equil', label: '\\ce{<=>}', latex: '\\ce{N2 + 3H2 <=> 2NH3}', description: 'Phản ứng thuận nghịch' },
    ],
  },
  {
    id: 'templates',
    title: 'Kho Mẫu Đề Thi Chuẩn',
    iconName: 'FileSpreadsheet',
    items: [
      {
        id: 'tpl_quad',
        label: 'ax^2 + bx + c',
        latex: 'ax^2 + bx + c = 0 \\quad (a \\neq 0)',
        description: 'Dạng tổng quát phương trình bậc hai',
      },
      {
        id: 'tpl_delta',
        label: '\\Delta = b^2 - 4ac',
        latex: '\\Delta = b^2 - 4ac, \\quad x_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}',
        description: 'Công thức nghiệm phương trình bậc 2',
      },
      {
        id: 'tpl_cauchy',
        label: '\\frac{a + b}{2} \\ge \\sqrt{ab}',
        latex: '\\frac{a + b}{2} \\ge \\sqrt{ab} \\quad (\\forall a, b \\ge 0)',
        description: 'Bất đẳng thức Cauchy (AM-GM)',
      },
      {
        id: 'tpl_asymptote',
        label: '\\lim_{x \\to +\\infty} y',
        latex: '\\lim_{x \\to +\\infty} y = y_0 \\implies y = y_0 \\text{ là tiệm cận ngang}',
        description: 'Định nghĩa tiệm cận hàm số',
      },
      {
        id: 'tpl_compound_interest',
        label: 'A = P(1 + r)^t',
        latex: 'A = P \\left(1 + \\frac{r}{n}\\right)^{nt}',
        description: 'Công thức lãi kép tài chính / bài toán thực tế',
      },
    ],
  },
];
