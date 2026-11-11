export interface DropzoneSample {
  id: string;
  labelKey: string;
  rawSnippet: string;
  parsedContent: string;
  parseTimeMs: string;
  storageSaved: string;
}

export const BENCHMARK_SAMPLES: DropzoneSample[] = [
  {
    id: 'math',
    labelKey: 'hero.dropzone.btnSampleMath',
    rawSnippet: '[MTEF_v5_OLE_BINARY: 0105000002000000080000004571756174696f6e2e44534d5434]\nCâu 1: Cho hàm số f(x) liên tục. Tính I = \\int_{0}^{\\pi/4} \\tan x \\cdot f(\\cos^2 x) dx.',
    parsedContent: 'Cho hàm số $f(x)$ liên tục trên $\\mathbb{R}$ thỏa mãn $\\int_{0}^{1} f(x) \\, dx = 3$. Tính giá trị của biểu thức:\n$$I = \\int_{0}^{\\pi/4} \\tan x \\cdot f(\\cos^2 x) \\, dx$$\n* **A.** $I = \\frac{3}{2}$   * **B.** $I = 3$   * **C.** $I = 6$   * **D.** $I = \\frac{1}{3}$',
    parseTimeMs: '1.18',
    storageSaved: '99.4%',
  },
  {
    id: 'chem',
    labelKey: 'hero.dropzone.btnSampleChem',
    rawSnippet: '[WORD_TABLE_XML: 3 rows x 3 cols + Subscripts embedded]\nFe3O4 + HNO3 -> Fe(NO3)3 + NO + H2O. Khảo sát bảng nồng độ:',
    parsedContent: 'Cân bằng phương trình phản ứng oxi hóa - khử sau:\n$$3\\text{Fe}_3\\text{O}_4 + 28\\text{HNO}_3 \\longrightarrow 9\\text{Fe}(\\text{NO}_3)_3 + \\text{NO} \\uparrow + 14\\text{H}_2\\text{O}$$\n\n| Thời điểm (phút) | $[\\text{Fe}^{3+}]$ (M) | Vận tốc phản ứng $v$ |\n| :--- | :--- | :--- |\n| $t = 0$ | $0.00$ | $0.12 \\times 10^{-2}$ |\n| $t = 15$ | $0.45$ | $0.08 \\times 10^{-2}$ |',
    parseTimeMs: '1.32',
    storageSaved: '99.1%',
  },
  {
    id: 'gdpt',
    labelKey: 'hero.dropzone.btnSampleGdpt',
    rawSnippet: '[DOCX_GDPT_2025: 4 sub-items progressive scoring + fraction]\nXét tính đúng/sai của hàm số phân thức y = (2x - 1)/(x + 1):',
    parsedContent: 'Cho hàm số $y = f(x) = \\frac{2x - 1}{x + 1}$. Xét tính đúng/sai của các khẳng định sau:\n* **a)** Tập xác định của hàm số là $\\mathcal{D} = \\mathbb{R} \\setminus \\{-1\\}$. *(Đúng)*\n* **b)** Đồ thị có tiệm cận đứng $x = -1$ và tiệm cận ngang $y = 2$. *(Đúng)*\n* **c)** Hàm số đồng biến trên toàn trục số $\\mathbb{R}$. *(Sai)*\n* **d)** Tiếp tuyến tại hoành độ $x_0 = 0$ có hệ số góc $k = 3$. *(Đúng)*',
    parseTimeMs: '1.05',
    storageSaved: '99.6%',
  },
];

