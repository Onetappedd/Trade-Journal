import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FEATURE_FLAGS,
  isFeatureEnabled,
  getAllFeatureFlags,
  getClientFeatureFlags,
  validateFeatureFlags,
} from '../../../lib/config/flags';

describe('Feature Flags Configuration', () => {
  beforeEach(() => {
    // Reset environment variables before each test
    vi.resetModules();
    
    // Clear all feature flag environment variables
    delete process.env.BROKER_APIS_ENABLED;
    delete process.env.INBOUND_EMAIL_ENABLED;
    delete process.env.CRON_ENABLED;
    delete process.env.BROKER_API_KEYS;
    delete process.env.EMAIL_SERVICE_CONFIG;
    delete process.env.CRON_SECRET;
  });

  describe('Default Values', () => {
    it('should default all flags to false when environment variables are not set', () => {
      expect(FEATURE_FLAGS.BROKER_APIS_ENABLED).toBe(false);
      expect(FEATURE_FLAGS.INBOUND_EMAIL_ENABLED).toBe(false);
      expect(FEATURE_FLAGS.CRON_ENABLED).toBe(false);
    });

    it('should return false for invalid environment variable values', () => {
      process.env.BROKER_APIS_ENABLED = 'invalid';
      process.env.INBOUND_EMAIL_ENABLED = 'false';
      process.env.CRON_ENABLED = '0';
      
      expect(FEATURE_FLAGS.BROKER_APIS_ENABLED).toBe(false);
      expect(FEATURE_FLAGS.INBOUND_EMAIL_ENABLED).toBe(false);
      expect(FEATURE_FLAGS.CRON_ENABLED).toBe(false);
    });
  });

  describe('Environment Variable Parsing', () => {
    it('should enable flags when environment variables are set to "true"', () => {
      process.env.BROKER_APIS_ENABLED = 'true';
      process.env.INBOUND_EMAIL_ENABLED = 'true';
      process.env.CRON_ENABLED = 'true';
      
      expect(FEATURE_FLAGS.BROKER_APIS_ENABLED).toBe(true);
      expect(FEATURE_FLAGS.INBOUND_EMAIL_ENABLED).toBe(true);
      expect(FEATURE_FLAGS.CRON_ENABLED).toBe(true);
    });

    it('should handle case sensitivity correctly', () => {
      process.env.BROKER_APIS_ENABLED = 'TRUE';
      process.env.INBOUND_EMAIL_ENABLED = 'True';
      process.env.CRON_ENABLED = 'true';
      
      expect(FEATURE_FLAGS.BROKER_APIS_ENABLED).toBe(false);
      expect(FEATURE_FLAGS.INBOUND_EMAIL_ENABLED).toBe(false);
      expect(FEATURE_FLAGS.CRON_ENABLED).toBe(true);
    });

    it('should handle whitespace in environment variables', () => {
      process.env.BROKER_APIS_ENABLED = ' true ';
      process.env.INBOUND_EMAIL_ENABLED = 'true ';
      process.env.CRON_ENABLED = ' true';
      
      expect(FEATURE_FLAGS.BROKER_APIS_ENABLED).toBe(false);
      expect(FEATURE_FLAGS.INBOUND_EMAIL_ENABLED).toBe(false);
      expect(FEATURE_FLAGS.CRON_ENABLED).toBe(false);
    });
  });

  describe('isFeatureEnabled Function', () => {
    it('should return correct boolean values for each flag', () => {
      expect(isFeatureEnabled('BROKER_APIS_ENABLED')).toBe(false);
      expect(isFeatureEnabled('INBOUND_EMAIL_ENABLED')).toBe(false);
      expect(isFeatureEnabled('CRON_ENABLED')).toBe(false);
      
      process.env.BROKER_APIS_ENABLED = 'true';
      expect(isFeatureEnabled('BROKER_APIS_ENABLED')).toBe(true);
    });

    it('should work with all feature flag names', () => {
      const flags = ['BROKER_APIS_ENABLED', 'INBOUND_EMAIL_ENABLED', 'CRON_ENABLED'] as const;
      
      for (const flag of flags) {
        expect(typeof isFeatureEnabled(flag)).toBe('boolean');
      }
    });
  });

  describe('getAllFeatureFlags Function', () => {
    it('should return all feature flags as a record', () => {
      const flags = getAllFeatureFlags();
      
      expect(flags).toHaveProperty('BROKER_APIS_ENABLED');
      expect(flags).toHaveProperty('INBOUND_EMAIL_ENABLED');
      expect(flags).toHaveProperty('CRON_ENABLED');
      
      expect(typeof flags.BROKER_APIS_ENABLED).toBe('boolean');
      expect(typeof flags.INBOUND_EMAIL_ENABLED).toBe('boolean');
      expect(typeof flags.CRON_ENABLED).toBe('boolean');
    });

    it('should return a copy of the flags object', () => {
      const flags1 = getAllFeatureFlags();
      const flags2 = getAllFeatureFlags();
      
      expect(flags1).toEqual(flags2);
      expect(flags1).not.toBe(flags2); // Should be different objects
    });

    it('should reflect current environment variable state', () => {
      const flags1 = getAllFeatureFlags();
      expect(flags1.BROKER_APIS_ENABLED).toBe(false);
      
      process.env.BROKER_APIS_ENABLED = 'true';
      const flags2 = getAllFeatureFlags();
      expect(flags2.BROKER_APIS_ENABLED).toBe(true);
    });
  });

  describe('getClientFeatureFlags Function', () => {
    it('should return an object with client-safe flags', () => {
      const clientFlags = getClientFeatureFlags();
      
      expect(typeof clientFlags).toBe('object');
      expect(Array.isArray(clientFlags)).toBe(false);
    });

    it('should not expose server-side flags to client', () => {
      const clientFlags = getClientFeatureFlags();
      
      // Server-side flags should not be exposed
      expect(clientFlags).not.toHaveProperty('BROKER_APIS_ENABLED');
      expect(clientFlags).not.toHaveProperty('INBOUND_EMAIL_ENABLED');
      expect(clientFlags).not.toHaveProperty('CRON_ENABLED');
    });
  });

  describe('validateFeatureFlags Function', () => {
    it('should not throw when all flags are disabled', () => {
      expect(() => validateFeatureFlags()).not.toThrow();
    });

    it('should not throw when flags are enabled but required env vars are set', () => {
      process.env.BROKER_APIS_ENABLED = 'true';
      process.env.BROKER_API_KEYS = 'some-api-keys';
      
      process.env.INBOUND_EMAIL_ENABLED = 'true';
      process.env.EMAIL_SERVICE_CONFIG = 'email-config';
      
      process.env.CRON_ENABLED = 'true';
      process.env.CRON_SECRET = 'cron-secret';
      
      expect(() => validateFeatureFlags()).not.toThrow();
    });

    it('should throw error when BROKER_APIS_ENABLED is true but BROKER_API_KEYS is missing', () => {
      process.env.BROKER_APIS_ENABLED = 'true';
      
      expect(() => validateFeatureFlags()).toThrow('BROKER_API_KEYS environment variable is required');
    });

    it('should throw error when INBOUND_EMAIL_ENABLED is true but EMAIL_SERVICE_CONFIG is missing', () => {
      process.env.INBOUND_EMAIL_ENABLED = 'true';
      
      expect(() => validateFeatureFlags()).toThrow('EMAIL_SERVICE_CONFIG environment variable is required');
    });

    it('should throw error when CRON_ENABLED is true but CRON_SECRET is missing', () => {
      process.env.CRON_ENABLED = 'true';
      
      expect(() => validateFeatureFlags()).toThrow('CRON_SECRET environment variable is required');
    });

    it('should throw multiple errors when multiple flags are enabled without required env vars', () => {
      process.env.BROKER_APIS_ENABLED = 'true';
      process.env.INBOUND_EMAIL_ENABLED = 'true';
      process.env.CRON_ENABLED = 'true';
      
      expect(() => validateFeatureFlags()).toThrow(/BROKER_API_KEYS environment variable is required/);
      expect(() => validateFeatureFlags()).toThrow(/EMAIL_SERVICE_CONFIG environment variable is required/);
      expect(() => validateFeatureFlags()).toThrow(/CRON_SECRET environment variable is required/);
    });

    it('should include all missing environment variables in error message', () => {
      process.env.BROKER_APIS_ENABLED = 'true';
      process.env.INBOUND_EMAIL_ENABLED = 'true';
      process.env.CRON_ENABLED = 'true';
      
      try {
        validateFeatureFlags();
        fail('Should have thrown an error');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        expect(message).toContain('BROKER_API_KEYS');
        expect(message).toContain('EMAIL_SERVICE_CONFIG');
        expect(message).toContain('CRON_SECRET');
        expect(message).toContain('Feature flag validation failed');
      }
    });
  });

  describe('Type Safety', () => {
    it('should have correct TypeScript types', () => {
      // These should compile without errors
      const flag: keyof typeof FEATURE_FLAGS = 'BROKER_APIS_ENABLED';
      const value: boolean = isFeatureEnabled(flag);
      
      expect(typeof value).toBe('boolean');
    });

    it('should allow iteration over feature flags', () => {
      const flags = Object.keys(FEATURE_FLAGS);
      
      expect(flags).toContain('BROKER_APIS_ENABLED');
      expect(flags).toContain('INBOUND_EMAIL_ENABLED');
      expect(flags).toContain('CRON_ENABLED');
      expect(flags.length).toBe(3);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle typical production deployment scenario', () => {
      // Production: all flags disabled by default
      expect(FEATURE_FLAGS.BROKER_APIS_ENABLED).toBe(false);
      expect(FEATURE_FLAGS.INBOUND_EMAIL_ENABLED).toBe(false);
      expect(FEATURE_FLAGS.CRON_ENABLED).toBe(false);
      
      expect(() => validateFeatureFlags()).not.toThrow();
    });

    it('should handle development environment with some features enabled', () => {
      process.env.BROKER_APIS_ENABLED = 'true';
      process.env.BROKER_API_KEYS = 'dev-api-keys';
      
      expect(FEATURE_FLAGS.BROKER_APIS_ENABLED).toBe(true);
      expect(FEATURE_FLAGS.INBOUND_EMAIL_ENABLED).toBe(false);
      expect(FEATURE_FLAGS.CRON_ENABLED).toBe(false);
      
      expect(() => validateFeatureFlags()).not.toThrow();
    });

    it('should handle staging environment with all features enabled', () => {
      process.env.BROKER_APIS_ENABLED = 'true';
      process.env.BROKER_API_KEYS = 'staging-api-keys';
      
      process.env.INBOUND_EMAIL_ENABLED = 'true';
      process.env.EMAIL_SERVICE_CONFIG = 'staging-email-config';
      
      process.env.CRON_ENABLED = 'true';
      process.env.CRON_SECRET = 'staging-cron-secret';
      
      expect(FEATURE_FLAGS.BROKER_APIS_ENABLED).toBe(true);
      expect(FEATURE_FLAGS.INBOUND_EMAIL_ENABLED).toBe(true);
      expect(FEATURE_FLAGS.CRON_ENABLED).toBe(true);
      
      expect(() => validateFeatureFlags()).not.toThrow();
    });
  });
});
