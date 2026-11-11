import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_THEME_TOKENS, injectThemeTokens, type ThemeTokens } from '@/shared/hooks/useThemeInjector';
import api from '@/services/api';

export interface WhiteLabelConfig extends ThemeTokens {
  organizationName: string;
  customDomain: string;
  logoUrl: string;
  logoHeightPx: number;
  faviconUrl: string;
  squareLogoUrl: string;
  slogan: string;
  brandDescription: string;
  loginBackgroundUrl: string;
  loginOverlayOpacity: number;
  enableWatermark: boolean;
  watermarkText: string;
  copyrightText: string;
  supportHotline: string;
  supportEmail: string;
  headquartersAddress: string;
  taxOrRegistrationCode: string;
  workingHours: string;
  aboutUsContent: string;
  privacyPolicyContent: string;
  termsOfServiceContent: string;
  securityComplianceContent: string;
}

export const DEFAULT_WHITE_LABEL_CONFIG: WhiteLabelConfig = {
  ...DEFAULT_THEME_TOKENS,
  organizationName: 'Aegis Global (AGCI)',
  customDomain: 'quiz.mybank.vn',
  logoUrl: 'https://cdn.aegis.com/agribank-logo.svg',
  logoHeightPx: 38,
  faviconUrl: 'https://cdn.aegis.com/agribank-icon.png',
  squareLogoUrl: 'https://cdn.aegis.com/agribank-square.png',
  slogan: 'Đo lường năng lực thực chất — Bùng nổ cảm hứng học tập đỉnh cao',
  brandDescription: 'Hệ sinh thái Hạ tầng Nhận thức, Khảo thí Thích ứng IRT 3-PL & Trí tuệ Nhân tạo Biện chứng Toàn cầu',
  loginBackgroundUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920&auto=format&fit=crop',
  loginOverlayOpacity: 65,
  enableWatermark: true,
  watermarkText: 'AEGIS GLOBAL — BẢO MẬT NỘI BỘ',
  copyrightText: `© ${new Date().getFullYear()} Aegis Global Cognitive Infrastructure (AGCI). Bảo lưu mọi quyền.`,
  supportHotline: '1900 558818 • (+84) 24 3868 9999',
  supportEmail: 'enterprise@aegisglobal.io',
  headquartersAddress: 'Tòa nhà Trung tâm Đổi mới Sáng tạo & Tài chính Số, Hà Nội / TP. Hồ Chí Minh / Singapore',
  taxOrRegistrationCode: 'ISO/IEC 27001:2022 • NIST SP 800-63B Certified',
  workingHours: 'Hỗ trợ Kỹ thuật & AI Co-Pilot 24/7/365 (SLA 99.99%)',
  aboutUsContent:
    '### 🏛️ Về Aegis Global (AEGIS GLOBAL COGNITIVE INFRASTRUCTURE)\n' +
    'Aegis Global là hạ tầng trí tuệ nhận thức và khảo thí chuẩn quốc tế, hợp nhất **Không gian Sáng tạo Giáo viên (Zen Studio PLG)** và **Pháo đài Quản trị Doanh nghiệp & Ngân hàng (Enterprise Multi-Tenant Fortress)**.\n\n' +
    '- **Sứ mệnh Giáo dục**: Giúp mọi giáo viên từ Mầm non, Tiểu học đến Đại học số hóa học liệu trong 3 chạm (10 giây), thu âm giọng nói trực tiếp, giải mã nhị phân MathType OLE sang LaTeX trong `<2ms` và giao bài qua mã QR Zalo không cần tài khoản.\n' +
    '- **Sứ mệnh Ngân hàng & Tập đoàn**: Chuẩn hóa đánh giá năng lực nhân sự bằng mô hình tâm trắc học **IRT 3-PL**, Hội đồng AI Bầy sói chống ảo giác (`SCI = 98.4%`), cô lập dữ liệu 3 tầng (`PostgreSQL RLS`) và ký số PKI USB Token.',
  privacyPolicyContent:
    '### 🛡️ Chính Sách Bảo Mật & Chủ Quyền Dữ Liệu (Privacy & Data Sovereignty)\n' +
    '1. **Cô lập dữ liệu 3 tầng (3-Layer Multi-Tenant Isolation)**: Toàn bộ dữ liệu đề thi, câu hỏi và kết quả học tập của từng Tổ chức/Giáo viên được cô lập tuyệt đối tại tầng Middleware, Entity Framework Global Query Filter và PostgreSQL Row-Level Security (RLS).\n' +
    '2. **Bảo vệ Bản quyền Học liệu Creator (Scoped Ownership)**: Các chủ đề và câu hỏi do Giáo viên khởi tạo (`PERSONAL` / `TENANT`) thuộc chủ quyền riêng biệt, không bị chia sẻ trái phép.\n' +
    '3. **Mã hóa Khóa AI & Thông tin định danh**: Mật khẩu băm chuẩn `PBKDF2-SHA256`, khóa BYOK API mã hóa `AES-256-GCM`, tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân và tiêu chuẩn GDPR quốc tế.',
  termsOfServiceContent:
    '### ⚖️ Điều Khoản Sử Dụng & Cam Kết Chất Lượng Dịch Vụ (Terms of Service & SLA)\n' +
    '1. **Quyền sử dụng Nền tảng**: Người dùng cá nhân, Giáo viên và Tổ chức được cấp quyền truy cập theo ma trận phân quyền 4 tầng (`Tenant ∩ Domain ∩ Group ∩ User`).\n' +
    '2. **Tính chính xác & Liêm chính Học thuật**: Mọi biên bản chấm thi, điểm số lũy tiến và nhật ký khảo thí đều được niêm phong bằng chuỗi băm bất biến **SHA-256 Merkle Audit Chain**.\n' +
    '3. **Cam kết SLA 99.9% & Tự phục hồi**: Hệ thống vận hành với kiến trúc Zero-DB-Hit RAM Prewarm cho phòng thi lớn và hỗ trợ đa cổng thanh toán minh bạch (VietQR EMVCo, PayOS, Stripe, Web3).',
  securityComplianceContent:
    '### 🔐 Tiêu Chuẩn An Ninh Mật Mã & Kiểm Toán Khảo Thí\n' +
    '- **NIST SP 800-63B & TOTP 2FA**: Xác thực đa nhân tố cho các tác vụ quản trị trọng yếu.\n' +
    '- **PKI USB Token Digital Signature**: Ký số biên bản thi sát hạch ngân hàng & chứng chỉ nghề nghiệp.\n' +
    '- **SHA-256 Merkle Audit Trail**: Chống can thiệp sửa điểm trái phép trong cơ sở dữ liệu.'
};

const STORAGE_KEY = 'aegis_tenant_theme_tokens';
const LEGACY_STORAGE_KEY = 'aegisquiz_tenant_theme_tokens';

export function useWhiteLabelTheme() {
  const [config, setConfig] = useState<WhiteLabelConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_WHITE_LABEL_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_WHITE_LABEL_CONFIG;
  });

  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchRemote = async () => {
      try {
        const res = await api.get<Partial<WhiteLabelConfig>>('/api/admin/tenants/branding');
        if (mounted && res.data && res.data.organizationName) {
          setConfig(prev => {
            const merged = { ...prev, ...res.data };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            injectThemeTokens(merged);
            return merged;
          });
        }
      } catch {
        // Fallback to local
      }
    };
    fetchRemote();
    return () => { mounted = false; };
  }, []);

  const updateConfig = useCallback((partial: Partial<WhiteLabelConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...partial };
      injectThemeTokens(next);
      return next;
    });
    setIsSaved(false);
  }, []);

  const saveConfig = useCallback(async () => {
    setLoading(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      injectThemeTokens(config);
      await api.put('/api/admin/tenants/branding', config);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.warn('Lỗi lưu branding lên server, đã lưu cục bộ:', err);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  }, [config]);

  const resetDefaults = useCallback(() => {
    setConfig(DEFAULT_WHITE_LABEL_CONFIG);
    injectThemeTokens(DEFAULT_WHITE_LABEL_CONFIG);
    localStorage.removeItem(STORAGE_KEY);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  }, []);

  return {
    config,
    updateConfig,
    saveConfig,
    resetDefaults,
    isSaved,
    loading
  };
}
