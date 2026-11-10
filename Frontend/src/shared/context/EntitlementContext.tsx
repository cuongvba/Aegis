import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  FEATURE_METADATA_CATALOG,
  type EntitlementsResponse,
  type FeatureKeyType,
  type TenantPlan,
  type TenantScaleType,
  type TenantQuotaLimits,
} from '@/types/entitlement';
import { entitlementService } from '@/services/entitlementService';
import { useAuthContext } from '@/app/providers/AuthProvider';

interface EntitlementContextType {
  entitlements: EntitlementsResponse | null;
  isLoading: boolean;
  error: string | null;
  plan: TenantPlan;
  scaleType: TenantScaleType;
  quotas: TenantQuotaLimits | null;
  
  // Ma trận 4 tầng
  hasFeature: (feature: FeatureKeyType) => boolean;
  canUser: (capability: string) => boolean;
  isDomainActive: (domainCode: string) => boolean;
  
  // Paywall & Monetization Trigger
  activePaywallFeature: FeatureKeyType | null;
  openPaywall: (feature: FeatureKeyType) => void;
  closePaywall: () => void;
  
  refresh: () => Promise<void>;
}

const DEFAULT_QUOTAS: TenantQuotaLimits = {
  maxUsers: 10,
  maxQuestionsPerMonth: 200,
  maxConcurrentArenaSeats: 0,
  aiTokensMonthly: 0,
  storageLimitMb: 500,
};

const EntitlementContext = createContext<EntitlementContextType | null>(null);

export const EntitlementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuthContext();
  const [entitlements, setEntitlements] = useState<EntitlementsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePaywallFeature, setActivePaywallFeature] = useState<FeatureKeyType | null>(null);

  const isEnterpriseSovereign = useMemo(() => {
    const effectiveRole = user?.role || entitlements?.user?.role || '';
    const effectiveTier = (
      user?.subscriptionTier ||
      entitlements?.user?.subscriptionTier ||
      ''
    ).toUpperCase();
    const tenantPlan = entitlements?.tenant?.plan;

    return (
      effectiveRole === 'SystemAdmin' ||
      effectiveTier === 'ENTERPRISE' ||
      effectiveTier === 'GLOBAL' ||
      tenantPlan === 'Enterprise' ||
      tenantPlan === 'Global'
    );
  }, [user, entitlements]);

  const isProVip = useMemo(() => {
    if (isEnterpriseSovereign) return true;
    const effectiveTier = (
      user?.subscriptionTier ||
      entitlements?.user?.subscriptionTier ||
      ''
    ).toUpperCase();
    const tenantPlan = entitlements?.tenant?.plan;

    return (
      Boolean(user?.isPremium) ||
      Boolean(entitlements?.user?.isPremium) ||
      effectiveTier === 'VIP' ||
      effectiveTier === 'PRO' ||
      tenantPlan === 'Professional'
    );
  }, [isEnterpriseSovereign, user, entitlements]);

  const fetchEntitlements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await entitlementService.getCurrentEntitlements();
      setEntitlements(data);
    } catch (err: any) {
      console.warn('[EntitlementProvider] Không thể lấy entitlements, dùng fallback theo phiên người dùng:', err);
      setError(err?.message || 'Failed to fetch entitlements');
      setEntitlements({
        tenant: {
          id: user?.tenantId || '00000000-0000-0000-0000-000000000001',
          code: user?.tenantCode || 'community',
          name: user?.tenantName || 'Aegis Community Platform',
          plan:
            user?.role === 'SystemAdmin' || (user?.subscriptionTier || '').toUpperCase() === 'ENTERPRISE'
              ? 'Enterprise'
              : user?.isPremium
              ? 'Professional'
              : 'Starter',
          scaleType: 'Individual',
          isCommunity: true,
        },
        features: ['transpiler:moodle', 'math:vector_wmf'],
        quotas: DEFAULT_QUOTAS,
        domains: ['general', 'education'],
        user: {
          id: user?.id,
          role: user?.role || 'Learner',
          subscriptionTier: user?.subscriptionTier,
          isPremium: user?.isPremium,
          capabilities: ['questions:read', 'practice:access'],
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role, user?.subscriptionTier, user?.isPremium, user?.tenantId, user?.tenantCode, user?.tenantName]);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements, token]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchEntitlements();
    };
    window.addEventListener('aegis:entitlements:refresh', handleRefresh);
    return () => window.removeEventListener('aegis:entitlements:refresh', handleRefresh);
  }, [fetchEntitlements]);

  const hasFeature = useCallback(
    (feature: FeatureKeyType): boolean => {
      if (isEnterpriseSovereign) return true;
      if (entitlements?.features.includes(feature)) return true;
      if (isProVip) {
        const meta = FEATURE_METADATA_CATALOG[feature];
        if (meta && (meta.requiredPlan === 'Starter' || meta.requiredPlan === 'Professional')) {
          return true;
        }
      }
      return false;
    },
    [entitlements, isEnterpriseSovereign, isProVip]
  );

  const canUser = useCallback(
    (capability: string): boolean => {
      if (user?.role === 'SystemAdmin' || entitlements?.user?.role === 'SystemAdmin') return true;
      if (!entitlements) return false;
      return entitlements.user.capabilities.includes(capability);
    },
    [entitlements, user?.role]
  );

  const isDomainActive = useCallback(
    (domainCode: string): boolean => {
      if (isEnterpriseSovereign) return true;
      if (!entitlements) return true;
      return entitlements.domains.includes(domainCode);
    },
    [entitlements, isEnterpriseSovereign]
  );

  const openPaywall = useCallback((feature: FeatureKeyType) => {
    setActivePaywallFeature(feature);
  }, []);

  const closePaywall = useCallback(() => {
    setActivePaywallFeature(null);
  }, []);

  const plan: TenantPlan = useMemo(() => {
    if (entitlements?.tenant.plan === 'Global') return 'Global';
    if (isEnterpriseSovereign) return 'Enterprise';
    if (isProVip) return 'Professional';
    return entitlements?.tenant.plan || 'Starter';
  }, [entitlements?.tenant.plan, isEnterpriseSovereign, isProVip]);

  const scaleType = entitlements?.tenant.scaleType || 'Individual';
  const quotas = entitlements?.quotas || DEFAULT_QUOTAS;

  const value = useMemo(() => ({
    entitlements,
    isLoading,
    error,
    plan,
    scaleType,
    quotas,
    hasFeature,
    canUser,
    isDomainActive,
    activePaywallFeature,
    openPaywall,
    closePaywall,
    refresh: fetchEntitlements,
  }), [
    entitlements,
    isLoading,
    error,
    plan,
    scaleType,
    quotas,
    hasFeature,
    canUser,
    isDomainActive,
    activePaywallFeature,
    openPaywall,
    closePaywall,
    fetchEntitlements,
  ]);

  return (
    <EntitlementContext.Provider value={value}>
      {children}
    </EntitlementContext.Provider>
  );
};

export function useEntitlementContext(): EntitlementContextType {
  const ctx = useContext(EntitlementContext);
  if (!ctx) {
    throw new Error('useEntitlementContext must be used within an EntitlementProvider');
  }
  return ctx;
}
