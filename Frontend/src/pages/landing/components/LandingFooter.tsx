/**
 * AegisQuiz — LandingFooter (Landing Page)
 * ===========================================
 * Chân trang động 100% quản trị từ Admin (/admin/white-label):
 * - Hiển thị thông tin Tổ chức, Trụ sở, Hotline, Email, Chứng nhận An ninh từ Database.
 * - Các liên kết thực cho Tổ chức (Về Aegis Global, Liên hệ, Cẩm nang Zen Studio, Hỏi đáp AI)
 *   và Pháp lý (Chính sách bảo mật, Điều khoản sử dụng, Chuẩn An ninh & PKI).
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Phone, Mail, MapPin, ShieldCheck, Settings,
  Sparkles, BookOpen, Scale, Building2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTenant } from '@/app/providers/TenantProvider';
import { LanguageSwitcher } from '@/widgets/app-header/LanguageSwitcher';
import { useWhiteLabelTheme } from '@/pages/admin/white-label/hooks/useWhiteLabelTheme';
import { PortalLegalOrgModal, type PortalDocTab } from './PortalLegalOrgModal';

export function LandingFooter() {
  const { t, i18n } = useTranslation('landing');
  const isVi = i18n.language?.startsWith('vi');
  const { tenantName } = useTenant();
  const { config: branding } = useWhiteLabelTheme();
  const navigate = useNavigate();
  const [activeModalTab, setActiveModalTab] = useState<PortalDocTab | null>(null);
  const year = new Date().getFullYear();

  const orgDisplayName = branding.organizationName || tenantName || 'Aegis Global';

  useEffect(() => {
    const checkHash = () => {
      const h = window.location.hash.replace('#', '');
      if (h === 'portal-about') setActiveModalTab('about');
      else if (h === 'portal-contact') setActiveModalTab('contact');
      else if (h === 'portal-guide') setActiveModalTab('guide');
      else if (h === 'portal-privacy') setActiveModalTab('privacy');
      else if (h === 'portal-terms') setActiveModalTab('terms');
      else if (h === 'portal-security') setActiveModalTab('security');
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const openPortalDoc = (tab: PortalDocTab) => {
    setActiveModalTab(tab);
  };

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid sm:grid-cols-2 lg:grid-cols-12 gap-10">
        {/* Brand & Live Admin Contact Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-white shadow-md flex-shrink-0"
              style={{ background: 'var(--tenant-brand-gradient)' }}
              aria-hidden="true"
            >
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-base font-extrabold text-white block leading-tight">{orgDisplayName}</span>
              <span className="text-[11px] font-bold text-cyan-400">
                {branding.taxOrRegistrationCode || 'ISO/IEC 27001 • NIST SP 800-63B'}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {branding.brandDescription || t('footer.tagline')}
          </p>

          {/* Live Contact Details Managed from Admin */}
          <div className="space-y-1.5 pt-1 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-cyan-400 shrink-0 mt-0.5" />
              <span>{branding.headquartersAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-emerald-400 shrink-0" />
              <a
                href={`tel:${(branding.supportHotline || '').split('•')[0].replace(/\s+/g, '')}`}
                className="font-mono font-bold text-emerald-300 hover:underline"
              >
                {branding.supportHotline}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-indigo-400 shrink-0" />
              <a
                href={`mailto:${branding.supportEmail}`}
                className="font-mono text-indigo-300 hover:underline"
              >
                {branding.supportEmail}
              </a>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => navigate('/admin/white-label')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Quản trị thông tin Tổ chức & Pháp lý tại /admin/white-label"
            >
              <Settings size={12} />
              <span>{isVi ? 'Quản trị Chân trang (Admin)' : 'Manage Footer (Admin)'}</span>
            </button>
          </div>
        </div>

        {/* Column 1: SẢN PHẨM (2 Cols) */}
        <div className="lg:col-span-2">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3.5">
            {t('footer.product', { defaultValue: isVi ? 'SẢN PHẨM' : 'PRODUCT' })}
          </p>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a href="#features" className="text-slate-400 hover:text-cyan-300 transition-colors">
                {t('footer.links.features', { defaultValue: isVi ? '9 Công nghệ Đột phá' : '9 Breakthroughs' })}
              </a>
            </li>
            <li>
              <a href="#gameshows" className="text-slate-400 hover:text-cyan-300 transition-colors">
                {t('footer.links.gameshows', { defaultValue: '6 Gameshow Arena' })}
              </a>
            </li>
            <li>
              <a href="#pricing" className="text-slate-400 hover:text-cyan-300 transition-colors">
                {t('footer.links.pricing', { defaultValue: isVi ? 'Bảng giá & Gói cước' : 'Pricing' })}
              </a>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/creator/studio')}
                className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer text-left"
              >
                {isVi ? 'Zen Studio (3 Chạm)' : 'Zen Studio (3-Touch)'}
              </button>
            </li>
          </ul>
        </div>

        {/* Column 2: TỔ CHỨC & HỖ TRỢ (3 Cols) */}
        <div className="lg:col-span-3">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3.5">
            {t('footer.company', { defaultValue: isVi ? 'TỔ CHỨC & HỖ TRỢ' : 'ORGANIZATION & HELP' })}
          </p>
          <ul className="space-y-2.5 text-sm">
            <li>
              <button
                type="button"
                onClick={() => openPortalDoc('about')}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
              >
                <Building2 size={14} className="text-cyan-400 shrink-0" />
                <span>{t('footer.links.about', { defaultValue: isVi ? 'Về Aegis Global' : 'About Aegis Global' })}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openPortalDoc('contact')}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
              >
                <Phone size={14} className="text-emerald-400 shrink-0" />
                <span>{t('footer.links.contact', { defaultValue: isVi ? 'Liên hệ & Trụ sở' : 'Contact & HQ' })}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openPortalDoc('guide')}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
              >
                <BookOpen size={14} className="text-amber-400 shrink-0" />
                <span>{isVi ? 'Cẩm nang Giáo viên Zen' : 'Educator Zen Guide'}</span>
              </button>
            </li>
            <li>
              <a
                href="#ai-docs-qa"
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors flex items-center gap-1.5"
              >
                <Sparkles size={14} className="shrink-0" />
                <span>{isVi ? 'Hỏi đáp AI Hệ thống (24/7)' : 'AI System Docs Q&A (24/7)'}</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3: PHÁP LÝ & BẢO MẬT (2 Cols) */}
        <div className="lg:col-span-2">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3.5">
            {t('footer.legal', { defaultValue: isVi ? 'PHÁP LÝ' : 'LEGAL & TRUST' })}
          </p>
          <ul className="space-y-2.5 text-sm">
            <li>
              <button
                type="button"
                onClick={() => openPortalDoc('privacy')}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
              >
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span>{t('footer.links.privacy', { defaultValue: isVi ? 'Chính sách bảo mật' : 'Privacy Policy' })}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openPortalDoc('terms')}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
              >
                <Scale size={14} className="text-purple-400 shrink-0" />
                <span>{t('footer.links.terms', { defaultValue: isVi ? 'Điều khoản sử dụng' : 'Terms of Service' })}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => openPortalDoc('security')}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
              >
                <ShieldCheck size={14} className="text-cyan-400 shrink-0" />
                <span>{isVi ? 'Chuẩn An ninh & PKI' : 'Security & PKI Audit'}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-slate-800/80 py-5 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>{branding.copyrightText || `© ${year} ${orgDisplayName}. ${t('footer.copyright')}`}</p>
          <p className="text-[11px] text-slate-600">
            {branding.workingHours || '24/7/365 Global Cognitive Infrastructure • Zero-Trust RLS'}
          </p>
        </div>
      </div>

      {/* Dynamic Organization & Legal Modal Managed by Admin */}
      <PortalLegalOrgModal
        activeTab={activeModalTab}
        onClose={() => setActiveModalTab(null)}
        onChangeTab={setActiveModalTab}
        branding={branding}
      />
    </footer>
  );
}
export default LandingFooter;
