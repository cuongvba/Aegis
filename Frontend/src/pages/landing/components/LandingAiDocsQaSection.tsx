import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bot, Send, Sparkles, BookOpen, ShieldCheck, Wand2,
  Scale, Loader2, CheckCircle2, ArrowRight
} from 'lucide-react';
import api from '@/services/api';
import { MathRenderer } from '@/components/common/MathRenderer';

interface DocsQaResponse {
  answer: string;
  sources: string[];
  modelUsed: string;
  latencyMs: number;
  suggestedFollowUps: string[];
}

export const LandingAiDocsQaSection: React.FC = () => {
  const { i18n } = useTranslation('landing');
  const isVi = i18n.language?.startsWith('vi');

  const presetQuestions = isVi
    ? [
        {
          cat: '👩‍🏫 Giáo viên & Zen Studio',
          icon: Wand2,
          q: 'Giáo viên mầm non và phổ thông tạo đề thu âm giọng đọc, gửi bài qua QR Zalo không cần tài khoản như thế nào?',
        },
        {
          cat: '📐 MathType OLE & Bảng Word',
          icon: Sparkles,
          q: 'Khi copy công thức MathType hoặc bảng biểu từ Word/Excel dán vào hệ thống thì được chuyển sang LaTeX/Markdown ra sao?',
        },
        {
          cat: '🧠 AI Bầy Sói & Tâm Trắc IRT',
          icon: BookOpen,
          q: 'Hội đồng AI Bầy Sói (WPSE) chống ảo giác và cách tính điểm lũy tiến Đúng/Sai 4 ý chuẩn GDPT 2025 hoạt động thế nào?',
        },
        {
          cat: '🏛️ Tổ Chức, Bảo Mật & Pháp Lý',
          icon: Scale,
          q: 'Cho tôi biết thông tin liên hệ chính thức của Tổ chức, chính sách bảo mật 3 tầng RLS và gói cước của hệ thống?',
        },
      ]
    : [
        {
          cat: '👩‍🏫 Teachers & Zen Studio',
          icon: Wand2,
          q: 'How do Preschool and K-12 teachers record voice questions and share exams via zero-account QR links?',
        },
        {
          cat: '📐 MathType OLE & Word Tables',
          icon: Sparkles,
          q: 'How does Aegis decode MathType OLE equations and Word/Excel tables directly from Clipboard into Vector LaTeX & Markdown?',
        },
        {
          cat: '🧠 Wolf Pack AI & IRT 3-PL',
          icon: BookOpen,
          q: 'How does the Wolf Pack AI Swarm prevent hallucinations and how does 4-Statement Progressive True/False scoring work?',
        },
        {
          cat: '🏛️ Organization, Security & Legal',
          icon: Scale,
          q: 'What are the official organization contact details, 3-layer RLS banking security standards, and privacy policies?',
        },
      ];

  const [questionInput, setQuestionInput] = useState('');
  const [activeQuestion, setActiveQuestion] = useState<string>(presetQuestions[0].q);
  const [loading, setLoading] = useState(false);
  const [qaResult, setQaResult] = useState<DocsQaResponse | null>({
    answer: isVi
      ? 'Dưới đây là giải đáp chính thức dựa trên **Hệ thống Tài liệu & Cẩm nang Giáo viên Zen Studio (`TEACHER_CREATOR_ZEN_STUDIO_GUIDE.md`)**:\n\n' +
        '**Quy trình 3 Chạm / 10 Giây dành cho Giáo viên Mầm non, Tiểu học & Phổ thông (`/creator/studio`, `/creator/questions`)**:\n' +
        '1. **Thu âm giọng cô & Đa phương tiện trực tiếp**: Giáo viên bấm nút `🎙️ Thu âm giọng cô` ngay trên thanh công cụ câu hỏi để đọc đề cho các bé chưa biết chữ, dán ảnh minh họa (`Ctrl+V`) hoặc nhúng Video hoạt hình.\n' +
        '2. **Giao bài qua Mã QR Zalo Không Tài Khoản**: Khi bấm `🚀 Phát đề ngay`, hệ thống cấp mã PIN 6 số và **Mã QR / Link Zalo**. Học sinh hoặc phụ huynh chỉ cần quét mã, gõ tên bé là vào làm bài ngay trong 3 giây mà **không cần tạo tài khoản hay nhớ mật khẩu**.\n' +
        '3. **Quản lý độc lập & Chấm điểm tự động**: Kết quả, thời gian làm bài và bảng xếp hạng được tổng hợp tức thời tại `/creator/team`.'
      : 'Here is the official answer grounded in the **Aegis Zen Studio Educator Manual (`TEACHER_CREATOR_ZEN_STUDIO_GUIDE.md`)**:\n\n' +
        '**3-Touch / 10-Second Workflow for Preschool & K-12 Educators (`/creator/studio`, `/creator/questions`)**:\n' +
        '1. **1-Click Browser Voice Recording & Multimedia**: Teachers click `🎙️ Record Voice` directly inside the question editor so young learners can listen to the prompt, or paste images/videos (`Ctrl+V`).\n' +
        '2. **Zero-Account QR / Instant Link Sharing**: Click `🚀 Launch Room` to generate a 6-digit PIN and QR code. Students scan and start immediately with **zero account registration or password required**.\n' +
        '3. **Real-Time Analytics**: Scores and progress are tracked automatically in `/creator/team`.',
    sources: [
      'Cẩm nang Giáo viên Zen Studio (docs/manuals/TEACHER_CREATOR_ZEN_STUDIO_GUIDE.md)',
      'Hồ sơ Kiến trúc AGCI v5.0 (AGENTS.md)',
    ],
    modelUsed: 'Aegis-Docs-RAG-Engine',
    latencyMs: 4,
    suggestedFollowUps: isVi
      ? [
          'Copy công thức MathType từ Word dán vào hệ thống chuyển thành LaTeX ra sao?',
          'Hệ thống bảo mật 3 tầng RLS và ký số PKI cho Ngân hàng hoạt động thế nào?',
          'Thông tin liên hệ, trụ sở và chính sách bảo mật của Tổ chức?',
        ]
      : [
          'How does Aegis convert MathType OLE equations from Word to LaTeX?',
          'What security standards protect Enterprise & Banking tenants?',
          'How do I contact the organization or review the Privacy Policy?',
        ],
  });

  const askAi = async (qText: string) => {
    const clean = qText.trim();
    if (!clean || loading) return;
    setActiveQuestion(clean);
    setLoading(true);
    try {
      const res = await api.post<DocsQaResponse>('/api/v1/copilot/docs-qa', {
        question: clean,
        language: isVi ? 'vi' : 'en',
      });
      if (res.data && res.data.answer) {
        setQaResult(res.data);
      }
    } catch {
      // Giữ kết quả hiện hành nếu mạng gián đoạn
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim()) return;
    askAi(questionInput);
    setQuestionInput('');
  };

  return (
    <section id="ai-docs-qa" className="py-16 sm:py-24 border-t border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
            <Bot size={14} /> {isVi ? 'TRỢ LÝ AI GIẢI ĐÁP TÀI LIỆU & PHÁP LÝ HỆ THỐNG (24/7)' : 'AI SYSTEM DOCUMENTATION & GOVERNANCE ASSISTANT (24/7)'}
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {isVi ? 'Hỏi Bất Kỳ Điều Gì — AI Trả Lời Từ Tài Liệu Sống Của Hệ Thống' : 'Ask Anything — Grounded in Official System Docs & Live Admin Policy'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {isVi
              ? 'Được kết nối trực tiếp với Cẩm nang Giáo viên Zen Studio, Hồ sơ Kiến trúc AGCI v5.0 và Cấu hình Tổ chức & Pháp lý do Admin quản trị trong Database.'
              : 'Directly connected to the Educator Zen Studio Manual, AGCI v5.0 Architecture Specifications, and Live Organization & Legal Policies managed by Admin.'}
          </p>
        </div>

        {/* Preset Topic Pills */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {presetQuestions.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = activeQuestion === item.q;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => askAi(item.q)}
                className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400/60 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-black text-cyan-300">
                  <span>{item.cat}</span>
                  <Icon size={14} className="text-cyan-400 shrink-0" />
                </div>
                <p className="text-xs font-semibold text-slate-200 line-clamp-3 leading-relaxed">{item.q}</p>
              </button>
            );
          })}
        </div>

        {/* Interactive AI Console */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-5 sm:p-7 shadow-2xl space-y-5">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={questionInput}
                onChange={e => setQuestionInput(e.target.value)}
                placeholder={
                  isVi
                    ? 'Nhập câu hỏi về cách dùng Zen Studio, dán MathType, bảo mật Ngân hàng, bảng giá hoặc liên hệ pháp lý...'
                    : 'Ask about Zen Studio, MathType paste, Banking RLS security, pricing, or legal policies...'
                }
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:brightness-110 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
              <span>{isVi ? 'Hỏi AI Hệ Thống' : 'Ask System AI'}</span>
            </button>
          </form>

          {/* Answer Viewport */}
          {qaResult && (
            <div className="rounded-2xl bg-slate-950/90 border border-slate-800/90 p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <Sparkles size={14} className="text-cyan-400 shrink-0" />
                  <span>{activeQuestion}</span>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 size={11} /> {qaResult.modelUsed} • {qaResult.latencyMs}ms
                </span>
              </div>

              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2">
                <MathRenderer content={qaResult.answer} />
              </div>

              {/* Verified Document Sources */}
              {qaResult.sources && qaResult.sources.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    {isVi ? 'Nguồn tài liệu xác thực:' : 'Verified System Sources:'}
                  </span>
                  {qaResult.sources.map((src, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300 font-medium"
                    >
                      📄 {src}
                    </span>
                  ))}
                </div>
              )}

              {/* Suggested Follow-up Questions */}
              {qaResult.suggestedFollowUps && qaResult.suggestedFollowUps.length > 0 && (
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {isVi ? 'Hỏi tiếp:' : 'Follow-up:'}
                  </span>
                  {qaResult.suggestedFollowUps.map((fq, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => askAi(fq)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/40 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{fq}</span>
                      <ArrowRight size={11} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
export default LandingAiDocsQaSection;

