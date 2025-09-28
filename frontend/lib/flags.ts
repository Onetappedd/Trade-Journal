/**
 * Feature flags and configuration
 */

export interface FeatureFlags {
  enablePremiumFeatures: boolean;
  enableAdvancedAnalytics: boolean;
  enableRealTimeData: boolean;
  enableCustomReports: boolean;
  enableAPIAccess: boolean;
  enableWhiteLabel: boolean;
  enableCustomIntegrations: boolean;
  enableDedicatedSupport: boolean;
  enableSLAGuarantee: boolean;
}

export const DEFAULT_FLAGS: FeatureFlags = {
  enablePremiumFeatures: false,
  enableAdvancedAnalytics: false,
  enableRealTimeData: false,
  enableCustomReports: false,
  enableAPIAccess: false,
  enableWhiteLabel: false,
  enableCustomIntegrations: false,
  enableDedicatedSupport: false,
  enableSLAGuarantee: false,
};

export function getFeatureFlags(): FeatureFlags {
  // In production, this would fetch from a feature flag service
  // For now, return default flags
  return DEFAULT_FLAGS;
}

export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature];
}

// Legacy exports for backward compatibility
export const IMPORT_V2 = true;
export const IS_E2E = process.env.NEXT_PUBLIC_E2E_TEST === 'true';
