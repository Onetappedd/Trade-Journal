/**
 * Central flags helper for both server and client components
 * Manages feature flags and test environment detection
 */

import { isTestEnv, isImportV2Enabled } from './env';

export const IS_E2E = isTestEnv();
export const IMPORT_V2 = isImportV2Enabled();

// Additional flags can be added here as needed
export const DEBUG_MODE = process.env.NODE_ENV === 'development' || IS_E2E;