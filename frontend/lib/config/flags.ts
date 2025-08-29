/**
 * Feature flags configuration
 * 
 * All flags default to false for safe deployment.
 * Enable features by setting environment variables to 'true'.
 */

export const FEATURE_FLAGS = {
  /**
   * Enable live broker API integrations (TD Ameritrade, E*TRADE, etc.)
   * Default: false (safe for production)
   */
  BROKER_APIS_ENABLED: process.env.BROKER_APIS_ENABLED === 'true',

  /**
   * Enable inbound email processing for trade imports
   * Default: false (safe for production)
   */
  INBOUND_EMAIL_ENABLED: process.env.INBOUND_EMAIL_ENABLED === 'true',

  /**
   * Enable scheduled cron jobs (data updates, cleanup, etc.)
   * Default: false (safe for production)
   */
  CRON_ENABLED: process.env.CRON_ENABLED === 'true',
} as const;

// Type-safe access to feature flags
export type FeatureFlag = keyof typeof FEATURE_FLAGS;
export type FeatureFlagValue = typeof FEATURE_FLAGS[FeatureFlag];

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Get all feature flags as a record
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  return { ...FEATURE_FLAGS };
}

/**
 * Get feature flags for client-side use (only safe flags)
 * Note: Only include flags that are safe to expose to the client
 */
export function getClientFeatureFlags(): Record<string, boolean> {
  return {
    // Add client-safe flags here when needed
    // Example: UI_ENHANCEMENTS: FEATURE_FLAGS.UI_ENHANCEMENTS
  };
}

/**
 * Validate that required environment variables are set when features are enabled
 */
export function validateFeatureFlags(): void {
  const errors: string[] = [];

  if (FEATURE_FLAGS.BROKER_APIS_ENABLED) {
    if (!process.env.BROKER_API_KEYS) {
      errors.push('BROKER_API_KEYS environment variable is required when BROKER_APIS_ENABLED is true');
    }
  }

  if (FEATURE_FLAGS.INBOUND_EMAIL_ENABLED) {
    if (!process.env.EMAIL_SERVICE_CONFIG) {
      errors.push('EMAIL_SERVICE_CONFIG environment variable is required when INBOUND_EMAIL_ENABLED is true');
    }
  }

  if (FEATURE_FLAGS.CRON_ENABLED) {
    if (!process.env.CRON_SECRET) {
      errors.push('CRON_SECRET environment variable is required when CRON_ENABLED is true');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Feature flag validation failed:\n${errors.join('\n')}`);
  }
}
