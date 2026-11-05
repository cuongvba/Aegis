import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, Phone, Mail, MapPin, ShieldCheck, Clock, Building2, FileText } from 'lucide-react';
import type { WhiteLabelConfig } from '../hooks/useWhiteLabelTheme';

interface FooterAndLegalConfigProps {
  config: WhiteLabelConfig;
  onUpdate: (partial: Partial<WhiteLabelConfig>) => void;
}

export const FooterAndLegalConfig: React.FC<FooterAndLegalConfigProps> = ({ config, onUpdate }) => {
  const { t } = useTranslation('white_label');
  const [activeDocTab, setActiveDocTab] = useState<'about' | 'privacy' | 'terms' | 'security'>('about');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-black uppercase text-white tracking-wider">
            {t('legalFooterTitle', '5. Quản Trị Thông Tin Tổ Chức, Liên Hệ & Hồ Sơ Pháp Lý Chân Trang')}
          </h2>
        </div>
        <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
          Live Footer & Legal CMS
        </span>
      </div>

      {/* Contact & Organization Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
            <MapPin size={13} className="text-cyan-400" />
            <span>{t('headquartersAddress', 'Địa chỉ Trụ sở / Hội sở chính hiển thị dưới chân trang')}</span>
          </label>
          <input
            type="text"
            value={config.headquartersAddress || ''}
            onChange={(e) => onUpdate({ headquartersAddress: e.target.value })}
            placeholder="Tòa nhà Trung tâm Đổi mới Sáng tạo & Tài chính Số, Hà Nội / TP. Hồ Chí Minh"
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
            <Phone size={13} className="text-emerald-400" />
            <span>{t('supportHotline', 'Hotline Hỗ trợ Kỹ thuật & Tư vấn')}</span>
          </label>
          <input
            type="text"
            value={config.supportHotline || ''}
            onChange={(e) => onUpdate({ supportHotline: e.target.value })}
            placeholder="1900 558818 • (+84) 24 3868 9999"
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
            <Mail size={13} className="text-blue-400" />
            <span>{t('supportEmail', 'Email Tiếp nhận & Hợp tác Enterprise')}</span>
          </label>
          <input
            type="email"
            value={config.supportEmail || ''}
            onChange={(e) => onUpdate({ supportEmail: e.target.value })}
            placeholder="enterprise@aegisglobal.io"
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-amber-400" />
            <span>{t('taxOrRegistrationCode', 'Chứng nhận Bảo mật / Mã số Pháp lý')}</span>
          </label>
          <input
            type="text"
            value={config.taxOrRegistrationCode || ''}
            onChange={(e) => onUpdate({ taxOrRegistrationCode: e.target.value })}
            placeholder="ISO/IEC 27001:2022 • NIST SP 800-63B Certified"
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1.5">
            <Clock size={13} className="text-indigo-400" />
            <span>{t('workingHours', 'Khung giờ Hỗ trợ & Cam kết SLA')}</span>
          </label>
          <input
            type="text"
            value={config.workingHours || ''}
            onChange={(e) => onUpdate({ workingHours: e.target.value })}
            placeholder="Hỗ trợ Kỹ thuật & AI Co-Pilot 24/7/365 (SLA 99.99%)"
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-slate-300 block mb-1">
            {t('copyrightLabel', 'Dòng thông báo Bản quyền Chân trang (Copyright Notice)')}
          </label>
          <input
            type="text"
            value={config.copyrightText || ''}
            onChange={(e) => onUpdate({ copyrightText: e.target.value })}
            placeholder="© 2026 Aegis Global Cognitive Infrastructure (AGCI). Bảo lưu mọi quyền."
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Rich Content Editor for Organization & Legal Pages */}
      <div className="pt-3 border-t border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
            <FileText size={14} className="text-purple-400" />
            Nội dung Văn bản Tổ chức & Pháp lý (Hỗ trợ Markdown, cập nhật trực tiếp ra Chân trang & AI Hỏi-Đáp)
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'about', label: '🏛️ Về Tổ chức (About Us)', icon: Building2 },
            { id: 'privacy', label: '🛡️ Chính sách Bảo mật (Privacy)', icon: ShieldCheck },
            { id: 'terms', label: '⚖️ Điều khoản Sử dụng (Terms)', icon: Scale },
            { id: 'security', label: '🔐 Chuẩn An ninh & PKI', icon: FileText },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveDocTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeDocTab === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeDocTab === 'about' && (
          <textarea
            rows={6}
            value={config.aboutUsContent || ''}
            onChange={(e) => onUpdate({ aboutUsContent: e.target.value })}
            placeholder="Nhập nội dung giới thiệu Về Tổ chức / Về Aegis Global (Markdown)..."
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-2xl p-3 text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-purple-500"
          />
        )}

        {activeDocTab === 'privacy' && (
          <textarea
            rows={6}
            value={config.privacyPolicyContent || ''}
            onChange={(e) => onUpdate({ privacyPolicyContent: e.target.value })}
            placeholder="Nhập nội dung Chính sách Bảo mật & Bảo vệ Dữ liệu Cá nhân (Markdown)..."
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-2xl p-3 text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-purple-500"
          />
        )}

        {activeDocTab === 'terms' && (
          <textarea
            rows={6}
            value={config.termsOfServiceContent || ''}
            onChange={(e) => onUpdate({ termsOfServiceContent: e.target.value })}
            placeholder="Nhập nội dung Điều khoản Sử dụng & Cam kết SLA (Markdown)..."
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-2xl p-3 text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-purple-500"
          />
        )}

        {activeDocTab === 'security' && (
          <textarea
            rows={6}
            value={config.securityComplianceContent || ''}
            onChange={(e) => onUpdate({ securityComplianceContent: e.target.value })}
            placeholder="Nhập nội dung Tiêu chuẩn An ninh Mật mã, PKI & Kiểm toán SHA-256..."
            className="w-full text-xs bg-slate-950 border border-slate-800 rounded-2xl p-3 text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-purple-500"
          />
        )}
      </div>
    </div>
  );
};
