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
}

export const DEFAULT_WHITE_LABEL_CONFIG: WhiteLabelConfig = {
  ...DEFAULT_THEME_TOKENS,
  organizationName: 'Tập đoàn Ngân hàng Agribank',
  customDomain: 'sat-hach.agribank.com.vn',
  logoUrl: 'https://cdn.aegisquiz.com/agribank-logo.svg',
  logoHeightPx: 38,
  faviconUrl: 'https://cdn.aegisquiz.com/agribank-icon.png',
  squareLogoUrl: 'https://cdn.aegisquiz.com/agribank-square.png',
  slogan: 'Mang phồn thịnh đến khách hàng',
  brandDescription: 'Hệ thống khảo thí và chuẩn hóa năng lực chuyên môn nghiệp vụ toàn hệ thống',
  loginBackgroundUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1920&auto=format&fit=crop',
  loginOverlayOpacity: 65,
  enableWatermark: true,
  watermarkText: 'AGRIBANK — KHẢO THÍ NỘI BỘ',
  copyrightText: '© 2026 Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank). Bảo lưu mọi quyền.',
  supportHotline: '1900 558818',
  supportEmail: 'contact@agribank.com.vn'
};

const STORAGE_KEY = 'aegisquiz_tenant_theme_tokens';

export function useWhiteLabelTheme() {
  const [config, setConfig] = useState<WhiteLabelConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
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
