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
  {
    id: 'unit_circle_trig',
    subject: 'TOAN',
    subjectLabel: 'Toán 11 · Lượng giác',
    title: 'Đường tròn Lượng giác (cos t, sin t)',
    summary: 'Quan sát điểm M(cos t, sin t) quay tròn theo góc lượng giác t và kiểm chứng sin²t + cos²t = 1.',
    discoveryPrompt:
      'Kéo góc t đến π/2 (≈ 1.57) và π (≈ 3.14) để thấy hoành độ cos(t) và tung độ sin(t) đổi dấu như thế nào.',
    spec: {
      type: 'function_plot',
      title: 'Quỹ đạo Đường tròn Lượng giác R·(cos t, sin t)',
      xRange: [-3, 3],
      yRange: [-3, 3],
      parametric: { xFn: 'R * cos(t)', yFn: 'R * sin(t)', showTrail: true },
      parameters: [{ name: 'R', value: 2, min: 0.5, max: 2.5, step: 0.1 }],
      timeConfig: { min: 0, max: 6.28, step: 0.03, speed: 1.0, loop: true, autoPlay: true, label: 'Góc t (rad)' },
      morphSteps: [
        { timeAt: 0, latex: 'M(\\cos t, \\sin t),\\quad \\sin^2 t + \\cos^2 t = 1', note: 'Góc t = 0: Điểm M nằm tại (R, 0) trên trục hoành' },
        { timeAt: 1.57, latex: 't = \\frac{\\pi}{2} \\Rightarrow \\cos t = 0,\\ \\sin t = 1', note: 'Điểm M đạt đỉnh cao nhất trên trục tung' },
        { timeAt: 3.14, latex: 't = \\pi \\Rightarrow \\cos t = -1,\\ \\sin t = 0', note: 'Điểm M đi hết nửa vòng tròn' },
      ],
      caption: 'Điều chỉnh bán kính R để thấy đường tròn phóng to/thu nhỏ theo thời gian thực',
    },
  },
  {
    id: 'harmonic_oscillator',
    subject: 'VAT_LY',
    subjectLabel: 'Vật Lý 12 · Dao động điều hòa',
    title: 'Dao động điều hòa x(t) = A·cos(ωt)',
    summary: 'Đối chiếu trực tiếp li độ x(t) (đỏ) và đạo hàm vận tốc v(t) (nét đứt vàng) theo tần số góc ω.',
    discoveryPrompt:
      'Tăng tần số góc ω từ 2.0 lên 4.0 để thấy chu kỳ T ngắn lại và vận tốc cực đại tăng gấp đôi.',
    spec: {
      type: 'function_plot',
      title: 'Dao động điều hòa x(t) = A·cos(ωx)',
      fn: 'A * cos(w * x)',
      derivative: '-A * w * sin(w * x)',
      xRange: [0, 6.28],
      yRange: [-5, 5],
      parameters: [
        { name: 'A', value: 2, min: 0.5, max: 3, step: 0.1 },
        { name: 'w', value: 2, min: 1, max: 4, step: 0.2 },
      ],
      morphSteps: [
        { timeAt: 0, latex: 'x(t) = A\\cos(\\omega t),\\quad v(t) = -A\\omega\\sin(\\omega t)', note: 'Vận tốc sớm pha π/2 so với li độ' },
      ],
      caption: 'Đường đỏ: Li độ x(t) · Đường nét đứt vàng: Vận tốc v(t)',
    },
  },
  {
    id: 'cylinder_3d',
    subject: 'HINH_HOC_3D',
    subjectLabel: 'Toán 12 · Khối tròn xoay',
    title: 'Hình trụ tròn xoay & Thể tích V = πR²h (3D)',
    summary: 'Xoay khối trụ 360° để học sinh hình dung trực quan hai đáy tròn song song và đường sinh.',
    discoveryPrompt:
      'Kéo chuột xoay khối trụ từ góc nhìn nghiêng sang nhìn thẳng từ trên xuống để thấy thiết diện đáy.',
    spec: {
      type: 'geometry_3d',
      title: 'Hình trụ tròn xoay (3D Tương tác)',
      solid: 'cylinder',
      height: 4,
      baseRadius: 2.2,
      showLabels: true,
      caption: 'Kéo chuột trực tiếp để xoay khối trụ 360°',
    },
  },
];
