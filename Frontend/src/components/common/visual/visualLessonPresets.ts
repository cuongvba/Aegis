import type { DynamicVisualSpec } from './visual-types';

export interface InteractiveVisualLesson {
  id: string;
  subject: 'TOAN' | 'VAT_LY' | 'HINH_HOC_3D';
  subjectLabel: string;
  title: string;
  summary: string;
  discoveryPrompt: string;
  spec: DynamicVisualSpec;
}

export const VISUAL_LESSON_PRESETS: InteractiveVisualLesson[] = [
  {
    id: 'wave_motion_t',
    subject: 'VAT_LY',
    subjectLabel: 'Vật Lý 12 · Sóng cơ',
    title: 'Sóng cơ truyền theo thời gian u(x,t)',
    summary: 'Quan sát sự lan truyền pha dao động theo thời gian t và ảnh hưởng của biên độ A.',
    discoveryPrompt:
      'Hãy tạm dừng tại t = 2.1s, tăng biên độ A từ 1.0 lên 2.4 và quan sát bước sóng không đổi khi biên độ thay đổi.',
    spec: {
      type: 'function_plot',
      title: 'Sóng cơ truyền theo thời gian u(x,t) = A·sin(2x - 3t)',
      fn: 'A * sin(2*x - 3*t)',
      xRange: [-4, 4],
      yRange: [-3, 3],
      parameters: [{ name: 'A', value: 1.8, min: 0.5, max: 2.5, step: 0.1 }],
      timeConfig: { min: 0, max: 6.28, step: 0.04, speed: 1.4, loop: true, autoPlay: true, label: 'Thời gian t (s)' },
      morphSteps: [
        { timeAt: 0, latex: 'u(x,t) = A \\sin(kx - \\omega t)', note: 'Pha ban đầu t = 0: Sóng bắt đầu lan truyền theo chiều +Ox' },
        { timeAt: 2.1, latex: 'v = \\frac{\\omega}{k} = \\frac{3}{2}\\ (\\text{m/s})', note: 'Đỉnh sóng dịch chuyển đều theo thời gian t' },
        { timeAt: 4.2, latex: 'T = \\frac{2\\pi}{\\omega} \\approx 2.09\\text{s}', note: 'Sau mỗi chu kỳ T, trạng thái dao động lặp lại như cũ' },
      ],
      caption: 'Nhấn Play/Pause hoặc kéo thanh thời gian t để phân tích từng pha sóng',
    },
  },
  {
    id: 'projectile_motion',
    subject: 'VAT_LY',
    subjectLabel: 'Vật Lý 10 · Động học',
    title: 'Chuyển động ném xiên (x(t), y(t))',
    summary: 'Mô phỏng quỹ đạo Parabol 60fps với chấm sáng chuyển động và đồng bộ công thức theo từng pha bay.',
    discoveryPrompt:
      'Tạm dừng khi vật lên tới đỉnh cao nhất (t ≈ 0.94s): lúc này vận tốc theo phương đứng vy = 0.',
    spec: {
      type: 'function_plot',
      title: 'Quỹ đạo ném xiên (x(t), y(t)) theo thời gian',
      xRange: [-1, 9],
      yRange: [-1, 5],
      parametric: { xFn: '3.2 * t', yFn: '4.5 * t - 2.4 * t^2', showTrail: true },
      timeConfig: { min: 0, max: 2.0, step: 0.02, speed: 0.8, loop: true, autoPlay: true, label: 'Thời gian bay t (s)' },
      morphSteps: [
        { timeAt: 0, latex: 'x(t) = v_{0x}t,\\quad y(t) = v_{0y}t - \\frac{1}{2}gt^2', note: 'Vật rời bệ phóng tại t = 0' },
        { timeAt: 0.9, latex: 'v_y(t) = 0 \\Rightarrow y_{\\max}', note: 'Đạt độ cao cực đại tại đỉnh Parabol' },
        { timeAt: 1.7, latex: 'y(x) = x\\tan\\alpha - \\frac{g}{2v_0^2\\cos^2\\alpha}x^2', note: 'Phương trình quỹ đạo Parabol hoàn chỉnh' },
      ],
      caption: 'Vệt sáng thể hiện quỹ đạo tích lũy của vật từ t = 0 đến thời điểm hiện tại',
    },
  },
  {
    id: 'cubic_derivative',
    subject: 'TOAN',
    subjectLabel: 'Toán 12 · Giải tích',
    title: 'Hàm bậc ba & Đạo hàm y\'(x)',
    summary: 'Đối chiếu trực tiếp đồ thị y = x³ - 3x + 1 (đỏ) với đạo hàm y\' = 3x² - 3 (nét đứt vàng).',
    discoveryPrompt:
      'Rê chuột tại x = -1 và x = 1: để ý đúng lúc đường đạo hàm y\' cắt trục Ox (y\' = 0) thì hàm số đạt cực trị!',
    spec: {
      type: 'function_plot',
      title: 'Khảo sát y = x³ - 3x + 1 & Đạo hàm y\' = 3x² - 3',
      fn: 'x^3 - 3*x + 1',
      derivative: '3*x^2 - 3',
      xRange: [-3, 3],
      yRange: [-4, 5],
      morphSteps: [
        { timeAt: 0, latex: 'y\' = 3x^2 - 3 = 0 \\Leftrightarrow x = \\pm 1', note: 'Điểm cực đại (-1, 3) và cực tiểu (1, -1) ứng với nghiệm của y\'' },
      ],
      caption: 'Đường đỏ: f(x) · Đường nét đứt vàng: f\'(x)',
    },
  },
  {
    id: 'parabola_morph',
    subject: 'TOAN',
    subjectLabel: 'Toán 10–12 · Biện luận tham số',
    title: 'Họ Parabol biến thiên theo tham số m',
    summary: 'Tự động cho tham số m chạy từ -3 đến 3 ở 60fps để thấy quỹ đạo đỉnh Parabol dịch chuyển.',
    discoveryPrompt:
      'Nhấn Chạy m và quan sát điểm đỉnh I(m, 1 - m²) vẽ nên một Parabol ngược úp xuống!',
    spec: {
      type: 'function_plot',
      title: 'Biến thiên họ Parabol y = x² - 2mx + 1',
      fn: 'x^2 - 2*m*x + 1',
      xRange: [-4, 4],
      yRange: [-5, 6],
      animateParam: 'm',
      parameters: [{ name: 'm', value: 0, min: -3, max: 3, step: 0.1 }],
      timeConfig: { min: -3, max: 3, step: 0.05, speed: 1.2, loop: true, autoPlay: true, label: 'Tham số m' },
      morphSteps: [
        { timeAt: -3, latex: 'y = (x - m)^2 + (1 - m^2)', note: 'Đưa về dạng chính tắc để lộ tọa độ đỉnh I(m; 1 - m²)' },
        { timeAt: 0, latex: 'm = 0 \\Rightarrow y = x^2 + 1,\\quad I(0; 1)', note: 'Đỉnh đạt vị trí cao nhất khi m = 0' },
        { timeAt: 1.5, latex: 'y_I = 1 - x_I^2', note: 'Quỹ tích các đỉnh nằm trên Parabol y = 1 - x²' },
      ],
      caption: 'Tham số m tự động biến thiên 60fps hoặc kéo tay để dừng đúng giá trị cần khảo sát',
    },
  },
  {
    id: 'pyramid_3d',
    subject: 'HINH_HOC_3D',
    subjectLabel: 'Toán 11–12 · Hình học Không gian',
    title: 'Hình chóp Tứ giác đều S.ABCD (3D)',
    summary: 'Mô hình 3D xoay tương tác giúp học sinh quan sát đường cao SO, mặt bên và góc nhị diện.',
    discoveryPrompt:
      'Kéo xoay khối chóp để quan sát góc giữa cạnh bên và mặt đáy từ nhiều góc nhìn trực quan.',
    spec: {
      type: 'geometry_3d',
      title: 'Hình chóp Tứ giác đều S.ABCD (3D Tương tác)',
      solid: 'pyramid_s_abcd',
      height: 4,
      baseRadius: 3,
      showLabels: true,
      caption: 'Kéo chuột trực tiếp trên khung hình để xoay mô hình 3D 360°',
    },
  },
];
