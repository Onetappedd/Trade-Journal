/**
 * Stable selectors for e2e tests
 * Centralized location for all test selectors to ensure consistency
 */

// Authentication selectors
export const AUTH_SELECTORS = {
  signInButton: '[data-testid="sign-in-button"]',
  loginButton: '[data-testid="login-button"]',
  userAvatar: '[data-testid="user-avatar"]',
  userMenu: '[data-testid="user-menu"]',
  logoutButton: '[data-testid="logout-button"]',
  emailInput: 'input[type="email"], input[name="email"]',
  passwordInput: 'input[type="password"], input[name="password"]',
  submitButton: 'button[type="submit"]',
  errorMessage: '[data-testid="error-message"]'
} as const;

// Navigation selectors
export const NAV_SELECTORS = {
  dashboardLink: '[data-testid="nav-dashboard"]',
  tradesLink: '[data-testid="nav-trades"]',
  analyticsLink: '[data-testid="nav-analytics"]',
  settingsLink: '[data-testid="nav-settings"]',
  importLink: '[data-testid="nav-import"]',
  journalLink: '[data-testid="nav-journal"]',
  calendarLink: '[data-testid="nav-calendar"]',
  leaderboardLink: '[data-testid="nav-leaderboard"]',
  subscriptionsLink: '[data-testid="nav-subscriptions"]'
} as const;

// Settings page selectors
export const SETTINGS_SELECTORS = {
  // Profile section
  nameInput: '[data-testid="settings-name-input"]',
  usernameInput: '[data-testid="settings-username-input"]',
  emailInput: '[data-testid="settings-email-input"]',
  avatarInput: '[data-testid="settings-avatar-input"]',
  
  // Password section
  currentPasswordInput: '[data-testid="settings-current-password-input"]',
  newPasswordInput: '[data-testid="settings-new-password-input"]',
  confirmPasswordInput: '[data-testid="settings-confirm-password-input"]',
  
  // Save buttons
  profileSaveButton: '[data-testid="settings-profile-save-button"]',
  passwordSaveButton: '[data-testid="settings-password-save-button"]',
  
  // Success/error indicators
  successToast: '[data-testid="settings-success-toast"]',
  errorToast: '[data-testid="settings-error-toast"]',
  
  // Delete account section
  deleteAllTradesButton: '[data-testid="settings-delete-all-trades-button"]',
  deleteConfirmInput: '[data-testid="settings-delete-confirm-input"]',
  confirmDeleteButton: '[data-testid="settings-confirm-delete-button"]',
  deleteAccountButton: '[data-testid="settings-delete-account-button"]',
  
  // Notification preferences
  emailNotificationsToggle: '[data-testid="settings-email-notifications-toggle"]',
  pushNotificationsToggle: '[data-testid="settings-push-notifications-toggle"]',
  tradeAlertsToggle: '[data-testid="settings-trade-alerts-toggle"]',
  weeklyReportsToggle: '[data-testid="settings-weekly-reports-toggle"]'
} as const;

// Import page selectors
export const IMPORT_SELECTORS = {
  // File input
  fileInput: '[data-testid="import-file-input"]',
  
  // Mapping controls
  mappingSelects: '[data-testid="import-mapping-select"]',
  presetToggle: '[data-testid="import-preset-toggle"]',
  manualMappingToggle: '[data-testid="import-manual-mapping-toggle"]',
  
  // Import controls
  startImportButton: '[data-testid="import-start-button"]',
  cancelImportButton: '[data-testid="import-cancel-button"]',
  
  // Progress indicators
  progressBar: '[data-testid="import-progress-bar"]',
  progressText: '[data-testid="import-progress-text"]',
  
  // Summary counts
  insertedCount: '[data-testid="import-inserted-count"]',
  failedCount: '[data-testid="import-failed-count"]',
  duplicatesCount: '[data-testid="import-duplicates-count"]',
  
  // Actions
  rollbackButton: '[data-testid="import-rollback-button"]',
  downloadFailedRowsButton: '[data-testid="import-download-failed-button"]',
  importAnotherButton: '[data-testid="import-another-button"]',
  
  // Error handling
  errorMessage: '[data-testid="import-error-message"]',
  failedRowsTable: '[data-testid="import-failed-rows-table"]',
  
  // Feature flags
  featureFlagBanner: '[data-testid="feature-flag-banner"]'
} as const;

// Dashboard selectors
export const DASHBOARD_SELECTORS = {
  totalTrades: '[data-testid="dashboard-total-trades"]',
  totalPnL: '[data-testid="dashboard-total-pnl"]',
  winRate: '[data-testid="dashboard-win-rate"]',
  portfolioValue: '[data-testid="dashboard-portfolio-value"]',
  performanceChart: '[data-testid="dashboard-performance-chart"]',
  recentTrades: '[data-testid="dashboard-recent-trades"]'
} as const;

// Trades page selectors
export const TRADES_SELECTORS = {
  searchInput: '[data-testid="trades-search-input"]',
  filterSelect: '[data-testid="trades-filter-select"]',
  sortSelect: '[data-testid="trades-sort-select"]',
  tradesTable: '[data-testid="trades-table"]',
  tradeRow: '[data-testid="trade-row"]',
  addTradeButton: '[data-testid="trades-add-button"]',
  exportButton: '[data-testid="trades-export-button"]'
} as const;

// Analytics page selectors
export const ANALYTICS_SELECTORS = {
  dateRangePicker: '[data-testid="analytics-date-range-picker"]',
  performanceChart: '[data-testid="analytics-performance-chart"]',
  pnlChart: '[data-testid="analytics-pnl-chart"]',
  winRateChart: '[data-testid="analytics-win-rate-chart"]',
  statisticsCards: '[data-testid="analytics-statistics-card"]',
  exportReportButton: '[data-testid="analytics-export-button"]'
} as const;

// Common UI selectors
export const UI_SELECTORS = {
  loadingSpinner: '[data-testid="loading-spinner"]',
  emptyState: '[data-testid="empty-state"]',
  errorState: '[data-testid="error-state"]',
  successToast: '[data-testid="success-toast"]',
  errorToast: '[data-testid="error-toast"]',
  confirmDialog: '[data-testid="confirm-dialog"]',
  modal: '[data-testid="modal"]',
  closeButton: '[data-testid="close-button"]',
  cancelButton: '[data-testid="cancel-button"]',
  saveButton: '[data-testid="save-button"]',
  deleteButton: '[data-testid="delete-button"]'
} as const;

// Theme and UI controls
export const THEME_SELECTORS = {
  themeToggle: '[data-testid="theme-toggle"]',
  lightModeButton: '[data-testid="theme-light"]',
  darkModeButton: '[data-testid="theme-dark"]',
  systemModeButton: '[data-testid="theme-system"]'
} as const;

// Notifications
export const NOTIFICATION_SELECTORS = {
  notificationBell: '[data-testid="notification-bell"]',
  notificationDropdown: '[data-testid="notification-dropdown"]',
  notificationItem: '[data-testid="notification-item"]',
  markAllReadButton: '[data-testid="notification-mark-all-read"]',
  unreadBadge: '[data-testid="notification-unread-badge"]'
} as const;

// Helper functions that return page.getByTestId() locators
export const importSelectors = {
  fileInput: (page: any) => page.getByTestId('import-file-input'),
  usePresetToggle: (page: any) => page.getByTestId('import-use-preset-toggle'),
  mappingSelect: (page: any, field: string) => page.getByTestId(`import-mapping-select-${field}`),
  startButton: (page: any) => page.getByTestId('import-start-button'),
  progress: (page: any) => page.getByTestId('import-progress'),
  summaryInserted: (page: any) => page.getByTestId('import-summary-inserted'),
  summaryDuplicates: (page: any) => page.getByTestId('import-summary-duplicates'),
  summaryFailed: (page: any) => page.getByTestId('import-summary-failed'),
  rollbackButton: (page: any) => page.getByTestId('import-rollback-button')
};

export const settingsSelectors = {
  nameInput: (page: any) => page.getByTestId('settings-name-input'),
  usernameInput: (page: any) => page.getByTestId('settings-username-input'),
  emailInput: (page: any) => page.getByTestId('settings-email-input'),
  passwordInput: (page: any) => page.getByTestId('settings-current-password-input'),
  saveProfile: (page: any) => page.getByTestId('settings-profile-save-button'),
  saveSecurity: (page: any) => page.getByTestId('settings-password-save-button'),
  toastSuccess: (page: any) => page.getByTestId('toast-success')
};
