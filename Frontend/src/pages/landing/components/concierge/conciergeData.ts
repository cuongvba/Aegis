import { Building2, Wand2, Sparkles, Scale, BookOpen } from 'lucide-react';

export interface ConciergePreset {
  id: string;
  category: string;
  icon: any;
  prompt: string;
}

export interface ConciergeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  latencyMs?: number;
  modelUsed?: string;
  suggestedFollowUps?: string[];
  timestamp: string;
}

export const CONCIERGE_PRESETS_VI: ConciergePreset[] = [
  {
    id: 'enterprise',
    category: '🏛️ Ngân hàng & Tập đoàn',
    icon: Building2,
    prompt: 'Giải pháp bảo mật 3 tầng RLS, ký số PKI và kiến trúc On-Premise cho Ngân hàng và Tập đoàn hoạt động thế nào?'
  },
  {
    id: 'teacher',
    category: '👩‍🏫 Giáo viên & Mầm non',
    icon: Wand2,
    prompt: 'Giáo viên mầm non và phổ thông tạo đề thu âm giọng đọc và gửi bài qua Zalo QR không cần tài khoản ra sao?'
  },
  {
    id: 'mathtype',
    category: '📐 Bóc tách MathType <2ms',
    icon: Sparkles,
    prompt: 'Công nghệ giải mã nhị phân MathType OLE và bảng Word sang Vector LaTeX trong <2ms giúp tiết kiệm 99.2% DB như thế nào?'
  },
  {
    id: 'psychometrics',
    category: '📊 Tâm trắc học IRT 3-PL',
    icon: BookOpen,
    prompt: 'Mô hình tâm trắc học IRT 3-PL và cách chấm điểm lũy tiến Đúng/Sai 4 ý chuẩn GDPT 2025 hoạt động ra sao?'
  }
];

export const CONCIERGE_PRESETS_EN: ConciergePreset[] = [
  {
    id: 'enterprise',
    category: '🏛️ Enterprise & Banking',
    icon: Building2,
    prompt: 'How does Aegis enforce 3-tier RLS isolation, PKI digital signatures, and On-Premise deployment for Banking & Enterprises?'
  },
  {
    id: 'teacher',
    category: '👩‍🏫 K-12 & Preschool Teachers',
    icon: Wand2,
    prompt: 'How do K-12 and Preschool teachers record voice questions and launch Zero-Account QR exam rooms in 10 seconds?'
  },
  {
    id: 'mathtype',
    category: '📐 MathType OLE <2ms',
    icon: Sparkles,
    prompt: 'How does the binary MathType OLE deconstruction translate Word equations into Vector LaTeX in <2ms with 99.2% DB savings?'
  },
  {
    id: 'psychometrics',
    category: '📊 Psychometrics IRT 3-PL',
    icon: BookOpen,
    prompt: 'How does the IRT 3-PL adaptive testing and progressive 4-statement True/False scoring engine work?'
  }
];

export const INITIAL_GREETING_VI = `Xin chào Quý khách! Tôi là **Aegis Sovereign Public Concierge** — Cố vấn Kiến trúc & Giải pháp Toàn cầu của hệ sinh thái **Aegis Global (AGCI v5.0)**.

Tôi sẵn sàng tư vấn chuyên sâu 24/7 mọi khía cạnh:
* 🏛️ **Bảo mật Cấp Ngân hàng**: Cô lập 3 tầng RLS, chữ ký số PKI, Audit Merkle SHA-256
* 👩‍🏫 **Quy trình Giáo viên 3 Chạm / 10 Giây**: Giao bài qua QR Zalo không cần đăng ký tài khoản
* 📐 **Bóc tách Word & MathType OLE &lt;2ms**: Giảm 99.2% dung lượng DB so với ảnh PNG
* 📊 **Tâm trắc học IRT 3-PL**: Chấm điểm lũy tiến 9 dạng câu hỏi chuẩn GDPT 2025

*Quý khách có thể bấm chọn câu hỏi gợi ý bên dưới hoặc đặt câu hỏi trực tiếp!*`;

export const INITIAL_GREETING_EN = `Welcome! I am the **Aegis Sovereign Public Concierge** — Global Solution & Architecture Advisor for **Aegis Global (AGCI v5.0)**.

I am ready 24/7 to provide in-depth consultation on:
* 🏛️ **Banking-Grade Trust**: 3-tier RLS data isolation, PKI USB Token signatures, SHA-256 Merkle chain
* 👩‍🏫 **Zen Studio 3-Touch Workflow**: Zero-Account QR links for students without registration
* 📐 **MathType OLE Deconstruction &lt;2ms**: 99.2% Database storage saving vs legacy PNG images
* 📊 **Psychometrics IRT 3-PL**: Progressive scoring for 9 modern question types

*Feel free to select a topic below or type your inquiry directly!*`;
