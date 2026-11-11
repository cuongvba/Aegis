export interface CognitiveTierData {
  id: 'uar' | 'wpse' | 'symposium';
  tierNumber: string;
  badge: string;
  nameKey: string;
  subtitle: string;
  sampleInput: string;
  routingFlow: string[];
  metrics: {
    latency: string;
    tokenCost: string;
    sciConsensus: number;
    finOpsSavings: string;
    antiHallucination: string;
  };
  outputContent: string;
  cotTrace: string[];
}

export const COGNITIVE_TIERS_VI: CognitiveTierData[] = [
  {
    id: 'uar',
    tierNumber: 'TẦNG 1',
    badge: '⚡ Phản Xạ Siêu Tốc',
    nameKey: 'UAR Pareto FinOps Router',
    subtitle: 'Định tuyến Pareto FinOps & Semantic Cache Hit cho truy vấn thường quy / tra cứu nhanh.',
    sampleInput: 'Định lý Pytago mở rộng trong không gian tích trong và hình học Euclid là gì?',
    routingFlow: [
      'L0 Intent Classifier',
      'Vector Semantic Cache',
      '0-Token Fast-Path',
      'KaTeX Vector Renderer'
    ],
    metrics: {
      latency: '8.4ms',
      tokenCost: '0 Token (Miễn phí)',
      sciConsensus: 100,
      finOpsSavings: '100% Chi phí',
      antiHallucination: 'Khớp 100% AST'
    },
    outputContent: 'Trong không gian tích trong $V$, với hai vector trực giao $u, v \\in V$ ($u \\perp v \\iff \\langle u, v \\rangle = 0$):\n$$\\|u + v\\|^2 = \\|u\\|^2 + \\|v\\|^2$$\n* **Mở rộng hình học Euclid:** Trong tam giác $ABC$, định lý Cosin là dạng tổng quát hóa:\n$$a^2 = b^2 + c^2 - 2bc \\cos A$$',
    cotTrace: [
      '[L0_REFLEX] Nhận diện truy vấn thuộc lớp tri thức nền tảng (Factoid Class).',
      '[UAR_CACHE] Quét SHA-256 Cache Key -> Semantic Hit (Độ tương đồng 0.998).',
      '[PARETO_FINOPS] Cách ly hoàn toàn cổng Cloud LLM bên ngoài, bảo toàn 100% hạn ngạch token.'
    ]
  },
  {
    id: 'wpse',
    tierNumber: 'TẦNG 2',
    badge: '🐺 Bầy Sói Phản Biện',
    nameKey: 'Wolf Pack Swarm Engine (WPSE)',
    subtitle: 'Hội đồng 3 tác tử (Alpha, Scout, Critic) giải độc lập, phản biện chéo và đo lường chỉ số đồng thuận SCI.',
    sampleInput: 'Tìm tham số $m$ để phương trình $x^2 - 2(m-1)x + m^2 - 3m = 0$ có 2 nghiệm phân biệt thỏa mãn $x_1^2 + x_2^2 = 8$.',
    routingFlow: [
      'Alpha Lead Solver',
      'Scout Independent Verifier',
      'Critic Trap Auditor',
      'SCI Consensus Dial (>95%)'
    ],
    metrics: {
      latency: '240ms',
      tokenCost: '180 Tokens (Tối ưu)',
      sciConsensus: 98.6,
      finOpsSavings: '78% vs LLM Đơn',
      antiHallucination: 'Triệt tiêu 100% bẫy'
    },
    outputContent: 'Phương trình có 2 nghiệm phân biệt khi $\\Delta\' > 0 \\iff (m-1)^2 - (m^2 - 3m) = m + 1 > 0 \\iff m > -1$.\nTheo định lý Viète: $x_1 + x_2 = 2(m-1)$ và $x_1 x_2 = m^2 - 3m$.\n$$x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1 x_2 = 4(m-1)^2 - 2(m^2 - 3m) = 2m^2 - 2m + 4 = 8$$\n$$\\iff 2m^2 - 2m - 4 = 0 \\iff m^2 - m - 2 = 0 \\iff \\begin{cases} m = 2 & (\\text{nhận, do } > -1) \\\\ m = -1 & (\\text{loại, do không thỏa } \\Delta\' > 0) \\end{cases}$$\n**Kết luận:** Giá trị duy nhất thỏa mãn là $m = 2$.',
    cotTrace: [
      '[SWARM_ALPHA] Giải ra $m=2$ và $m=-1$. Cảnh báo cần kiểm tra điều kiện $\\Delta\' > 0$.',
      '[SWARM_SCOUT] Độc lập tính toán $\\Delta\' = m + 1$. Tại $m = -1$, $\\Delta\' = 0$ (nghiệm kép), không thỏa \"2 nghiệm phân biệt\".',
      '[SWARM_CRITIC] Bắt bẫy sai lầm phổ biến: Người học thường quên loại $m=-1$. Bầy sói đồng thuận tuyệt đối loại $m=-1$.',
      '[CONSENSUS_GATE] Đạt SCI = 98.6%. Duyệt phản hồi và bảo toàn chuỗi lập luận CoT.'
    ]
  },
  {
    id: 'symposium',
    tierNumber: 'TẦNG 3',
    badge: '🏛️ Đại Hội Thảo 6 Pha',
    nameKey: 'Universal Symposium Engine (USE)',
    subtitle: 'Đại Hội Thảo 6 Pha Hàn Lâm (Popperian, Bayesian, Peircean) giải quyết nghịch lý và bài toán liên ngành.',
    sampleInput: 'Phân tích Nghịch lý Fermi và xác suất của phương trình Drake dưới góc nhìn điều chỉnh niềm tin Bayesian.',
    routingFlow: [
      'Pha 1: Luận Điểm Tiên Nghiệm',
      'Pha 2: Phản Biện Popperian',
      'Pha 3: Cập Nhật Bayesian',
      'Pha 6: Tuyên Ngôn Chủ Quyền'
    ],
    metrics: {
      latency: '680ms',
      tokenCost: 'FinOps Pooled',
      sciConsensus: 99.8,
      finOpsSavings: 'Tiết kiệm 92% rủi ro',
      antiHallucination: 'Đối chứng đa nguồn 0%'
    },
    outputContent: 'Dưới góc nhìn **Bayesian Information Synthesis**, Nghịch lý Fermi không phải là sự mâu thuẫn siêu hình mà là hệ quả của hàm phân phối tiên nghiệm quá rộng (Vague Priors):\n$$P(\\text{Fermi Paradox} \\mid E) = \\frac{P(E \\mid \\text{Fermi}) \\cdot P(\\text{Fermi})}{P(E)}$$\n* **Pha Popperian:** Bác bỏ giả định phân phối đều của các biến số $\\left(f_l, f_i, f_c\\right)$ trong Phương trình Drake vì chúng trải dài qua nhiều bậc độ lớn logarit $\\left(10^{-10} \\rightarrow 10^{-1}\\right)$.\n* **Pha Bayesian:** Khi mô hình hóa các tham số bằng phân phối bất định log-normal, xác suất nhân loại là nền văn minh công nghệ duy nhất trong Ngân Hà nằm trong khoảng $[53\\%, 99.6\\%]$.',
    cotTrace: [
      '[PHASE_1_THESIS] Viện Vật Lý Thiên Văn trình bày tiên đề Phương trình Drake $N = R^* \\cdot f_p \\cdot n_e \\cdot f_l \\cdot f_i \\cdot f_c \\cdot L$.',
      '[PHASE_2_POPPER] Viện Triết Học Nhận Thức phản biện: Drake ngộ nhận tính tiền định; các biến số là phân phối xác suất bất định cao.',
      '[PHASE_3_BAYESIAN] Viện Toán Học cập nhật hàm mật độ hậu nghiệm $P(\\theta \\mid D) \\propto P(D \\mid \\theta) P(\\theta)$ bằng Monte Carlo Markov Chain.',
      '[PHASE_6_DECREE] Đại Hội Thảo ban hành Tuyên Ngôn: Fermi là nghịch lý biểu kiến do đánh giá thấp độ lệch chuẩn tích lũy.'
    ]
  }
];

export const COGNITIVE_TIERS_EN: CognitiveTierData[] = [
  {
    id: 'uar',
    tierNumber: 'TIER 1',
    badge: '⚡ Ultra-Fast Reflex',
    nameKey: 'UAR Pareto FinOps Router',
    subtitle: 'Pareto FinOps routing & semantic cache hit for factoids and high-frequency inquiries.',
    sampleInput: 'What is the generalized Pythagorean Theorem in inner product and Euclidean spaces?',
    routingFlow: [
      'L0 Intent Classifier',
      'Vector Semantic Cache',
      '0-Token Fast-Path',
      'KaTeX Vector Renderer'
    ],
    metrics: {
      latency: '8.4ms',
      tokenCost: '0 Token (Free)',
      sciConsensus: 100,
      finOpsSavings: '100% Cost Saved',
      antiHallucination: '100% AST Match'
    },
    outputContent: 'In an inner product space $V$, for two orthogonal vectors $u, v \\in V$ ($u \\perp v \\iff \\langle u, v \\rangle = 0$):\n$$\\|u + v\\|^2 = \\|u\\|^2 + \\|v\\|^2$$\n* **Euclidean Generalization:** In any triangle $ABC$, the Law of Cosines is the generalized formulation:\n$$a^2 = b^2 + c^2 - 2bc \\cos A$$',
    cotTrace: [
      '[L0_REFLEX] Identified standard fundamental knowledge query (Factoid Class).',
      '[UAR_CACHE] SHA-256 Hash Scan -> Semantic Cache Hit (0.998 Similarity).',
      '[PARETO_FINOPS] Fully isolated external Cloud LLM gateways, preserving 100% token quota.'
    ]
  },
  {
    id: 'wpse',
    tierNumber: 'TIER 2',
    badge: '🐺 Swarm Dialectics',
    nameKey: 'Wolf Pack Swarm Engine (WPSE)',
    subtitle: '3 autonomous agents (Alpha, Scout, Critic) solve, cross-audit, and verify via Swarm Consensus Index (SCI).',
    sampleInput: 'Find all parameter values $m$ such that $x^2 - 2(m-1)x + m^2 - 3m = 0$ has 2 distinct roots satisfying $x_1^2 + x_2^2 = 8$.',
    routingFlow: [
      'Alpha Lead Solver',
      'Scout Independent Verifier',
      'Critic Trap Auditor',
      'SCI Consensus Dial (>95%)'
    ],
    metrics: {
      latency: '240ms',
      tokenCost: '180 Tokens (Optimal)',
      sciConsensus: 98.6,
      finOpsSavings: '78% vs Single LLM',
      antiHallucination: 'Zero Trap Errors'
    },
    outputContent: 'Distinct roots require $\\Delta\' > 0 \\iff (m-1)^2 - (m^2 - 3m) = m + 1 > 0 \\iff m > -1$.\nBy Viète\'s formulas: $x_1 + x_2 = 2(m-1)$ and $x_1 x_2 = m^2 - 3m$.\n$$x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1 x_2 = 4(m-1)^2 - 2(m^2 - 3m) = 2m^2 - 2m + 4 = 8$$\n$$\\iff 2m^2 - 2m - 4 = 0 \\iff m^2 - m - 2 = 0 \\iff \\begin{cases} m = 2 & (\\text{valid, since } > -1) \\\\ m = -1 & (\\text{rejected, fails } \\Delta\' > 0) \\end{cases}$$\n**Conclusion:** The only valid solution is $m = 2$.',
    cotTrace: [
      '[SWARM_ALPHA] Solved $m=2$ and $m=-1$. Warned to verify $\\Delta\' > 0$.',
      '[SWARM_SCOUT] Calculated $\\Delta\' = m + 1$. At $m = -1$, $\\Delta\' = 0$ (double root), violating distinctness.',
      '[SWARM_CRITIC] Caught standard cognitive trap: Learners frequently miss rejecting $m=-1$. Swarm achieves absolute consensus to reject $m=-1$.',
      '[CONSENSUS_GATE] Achieved SCI = 98.6%. Approved verified response with CoT preserved.'
    ]
  },
  {
    id: 'symposium',
    tierNumber: 'TIER 3',
    badge: '🏛️ 6-Phase Symposium',
    nameKey: 'Universal Symposium Engine (USE)',
    subtitle: '6-Phase Academic Dialectics (Popperian, Bayesian, Peircean) resolving paradoxes and deep interdisciplinary challenges.',
    sampleInput: 'Analyze the Fermi Paradox and the Drake Equation through the lens of Bayesian belief revision and vague priors.',
    routingFlow: [
      'Phase 1: Prior Thesis',
      'Phase 2: Popperian Falsification',
      'Phase 3: Bayesian Revision',
      'Phase 6: Sovereign Decree'
    ],
    metrics: {
      latency: '680ms',
      tokenCost: 'FinOps Pooled',
      sciConsensus: 99.8,
      finOpsSavings: '92% Risk Elimination',
      antiHallucination: 'Zero Hallucination'
    },
    outputContent: 'Through **Bayesian Information Synthesis**, the Fermi Paradox is not an ontological conflict but a mathematical consequence of wide vague priors across orders of magnitude:\n$$P(\\text{Fermi Paradox} \\mid E) = \\frac{P(E \\mid \\text{Fermi}) \\cdot P(\\text{Fermi})}{P(E)}$$\n* **Popperian Phase:** Falsifies point-estimate uniform distributions across Drake variables $\\left(f_l, f_i, f_c\\right)$ which span up to 10 orders of magnitude $\\left(10^{-10} \\rightarrow 10^{-1}\\right)$.\n* **Bayesian Phase:** Incorporating log-normal uncertainty distributions, the posterior probability that humanity is currently the solitary technological civilization in the Milky Way ranges between $[53\\%, 99.6\\%]$.',
    cotTrace: [
      '[PHASE_1_THESIS] Astrophysics Institute posits Drake Equation $N = R^* \\cdot f_p \\cdot n_e \\cdot f_l \\cdot f_i \\cdot f_c \\cdot L$.',
      '[PHASE_2_POPPER] Epistemology Institute counters: Point estimates assume false determinism over logarithmic uncertainties.',
      '[PHASE_3_BAYESIAN] Mathematics Institute updates posterior density $P(\\theta \\mid D) \\propto P(D \\mid \\theta) P(\\theta)$ via MCMC sampling.',
      '[PHASE_6_DECREE] Council ratifies Sovereign Decree: The paradox is an artifact of underestimating cumulative dispersion.'
    ]
  }
];

