import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  X, Building2, Phone, Mail, MapPin, ShieldCheck,
  Scale, FileText, Clock, BookOpen, Settings, ExternalLink
} from 'lucide-react';
import type { WhiteLabelConfig } from '@/pages/admin/white-label/hooks/useWhiteLabelTheme';
import { MathRenderer } from '@/components/common/MathRenderer';

export type PortalDocTab = 'about' | 'contact' | 'guide' | 'privacy' | 'terms' | 'security';

interface PortalLegalOrgModalProps {
  activeTab: PortalDocTab | null;
  onClose: () => void;
  onChangeTab: (tab: PortalDocTab) => void;
  branding: WhiteLabelConfig;
}

export const PortalLegalOrgModal: React.FC<PortalLegalOrgModalProps> = ({
  activeTab,
  onClose,
  onChangeTab,
  branding,
}) => {
  const { i18n } = useTranslation('landing');
  const isVi = i18n.language?.startsWith('vi');
  const navigate = useNavigate();

  if (!activeTab) return null;

  const tabs: Array<{ id: PortalDocTab; label: string; icon: React.ComponentType<any> }> = [
    { id: 'about', label: isVi ? 'Về Tổ chức' : 'About Organization', icon: Building2 },
    { id: 'contact', label: isVi ? 'Liên hệ & Trụ sở' : 'Contact & HQ', icon: Phone },
    { id: 'guide', label: isVi ? 'Cẩm nang Zen Studio' : 'Zen Educator Guide', icon: BookOpen },
    { id: 'privacy', label: isVi ? 'Chính sách Bảo mật' : 'Privacy Policy', icon: ShieldCheck },
    { id: 'terms', label: isVi ? 'Điều khoản Sử dụng' : 'Terms of Service', icon: Scale },
    { id: 'security', label: isVi ? 'Chuẩn An ninh & PKI' : 'Security & PKI', icon: FileText },
  ];

  const guideMarkdown = isVi
    ? `### 🎓 Cẩm Nang Sử Dụng Nhanh Cho Giáo Viên (Mầm Non, Tiểu Học, THCS/THPT & Đại Học)\n\n` +
      `1. **Bước 1 — Quản lý Chủ đề (\`/creator/topics\`)**: Tạo thư mục môn học hoặc chủ đề bài giảng của riêng thầy/cô.\n` +
      `2. **Bước 2 — Soạn Câu hỏi Đa phương tiện & MathType (\`/creator/questions\`)**:\n` +
      `   - **Dành cho Mầm non & Tiểu học**: Bấm nút \`🎙️ Thu âm giọng cô\` trên thanh công cụ để đọc câu hỏi trực tiếp trên trình duyệt; dán ảnh minh họa (\`Ctrl+V\`) hoặc nhúng Video hoạt hình.\n` +
      `   - **Dành cho Toán / Lý / Hóa / Đại học**: Copy trực tiếp công thức **MathType OLE** hoặc **Bảng biểu từ Word/Excel** và nhấn \`Ctrl+V\` — hệ thống tự động giải mã nhị phân sang **Vector LaTeX & Markdown Table** trong \`<2ms\` (hoặc bấm nút \`✨ Đổi Ảnh -> LaTeX\`).\n` +
      `3. **Bước 3 — Phát đề 3 Chạm & Quét QR Zalo Không Cần Tài Khoản (\`/creator/studio\`)**:\n` +
      `   - Chọn câu hỏi $\\rightarrow$ Bấm \`🚀 Phát đề ngay\` $\\rightarrow$ Gửi mã QR hoặc Link qua nhóm Zalo lớp. Học sinh chỉ cần nhập tên là làm bài ngay, kết quả tự động báo về \`/creator/team\`.`
    : `### 🎓 Quick-Start Guide for Educators (Preschool, K-12 & University)\n\n` +
      `1. **Step 1 — Manage Topics (\`/creator/topics\`)**: Organize your private subject folders.\n` +
      `2. **Step 2 — Author Multimodal & MathType Questions (\`/creator/questions\`)**:\n` +
      `   - **Preschool & Primary**: Click \`🎙️ Record Voice\` to record audio prompts directly in browser, or paste images/videos (\`Ctrl+V\`).\n` +
      `   - **STEM & Higher Ed**: Copy **MathType OLE** equations or **Word/Excel tables** and press \`Ctrl+V\` to convert into crisp **Vector LaTeX & Markdown** in \`<2ms\`.\n` +
      `3. **Step 3 — 3-Touch Launch & Zero-Account QR (\`/creator/studio\`)**:\n` +
      `   - Select items $\\rightarrow$ Click \`🚀 Launch Room\` $\\rightarrow$ Share QR/Link. Students join instantly without needing an account.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl max-h-[88vh] rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
              {branding.organizationName} • Official Governance & Legal Portal
            </span>
            <h3 className="text-base sm:text-lg font-black text-white">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/admin/white-label');
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold cursor-pointer"
              title="Quản trị viên chỉnh sửa nội dung này tại /admin/white-label"
            >
              <Settings size={13} />
              <span>{isVi ? 'Quản trị (Admin)' : 'Edit in Admin'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 px-6 py-3 bg-slate-950/40 border-b border-slate-800">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangeTab(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon size={13} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-200 leading-relaxed flex-1">
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
                <MathRenderer content={branding.aboutUsContent} />
              </div>
              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 block">Chứng nhận & Tiêu chuẩn</span>
                  <strong className="text-emerald-300 mt-1 block">{branding.taxOrRegistrationCode}</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 block">Khung giờ Vận hành & Hỗ trợ</span>
                  <strong className="text-cyan-300 mt-1 block">{branding.workingHours}</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 block">Tên miền Định danh</span>
                  <strong className="text-indigo-300 mt-1 block">{branding.customDomain}</strong>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Phone size={16} /> <span>Hotline Hỗ Trợ Kỹ Thuật & Tư Vấn 24/7</span>
                  </div>
                  <p className="text-base font-black text-white font-mono">{branding.supportHotline}</p>
                  <p className="text-xs text-slate-400">{branding.workingHours}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold">
                    <Mail size={16} /> <span>Email Tiếp Nhận & Hợp Tác Enterprise</span>
                  </div>
                  <a
                    href={`mailto:${branding.supportEmail}`}
                    className="text-base font-black text-cyan-300 hover:underline font-mono block"
                  >
                    {branding.supportEmail}
                  </a>
                  <p className="text-xs text-slate-400">Phản hồi SLA trong vòng 15 phút làm việc</p>
                </div>
                <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold">
                    <MapPin size={16} /> <span>Địa Chỉ Trụ Sở / Hội Sở Chính</span>
                  </div>
                  <p className="text-sm font-bold text-white">{branding.headquartersAddress}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                    <Clock size={13} /> <span>{branding.taxOrRegistrationCode}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
                <MathRenderer content={guideMarkdown} />
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/creator/studio');
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Mở Zen Studio Ngay</span>
                  <ExternalLink size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/creator/questions');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Quản lý Câu hỏi ZenQuestions</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
              <MathRenderer content={branding.privacyPolicyContent} />
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
              <MathRenderer content={branding.termsOfServiceContent} />
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
              <MathRenderer content={branding.securityComplianceContent} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>{branding.copyrightText}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
          >
            {isVi ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default PortalLegalOrgModal;

