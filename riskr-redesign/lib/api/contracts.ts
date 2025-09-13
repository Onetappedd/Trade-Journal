// API Contract Types for RiskR Trading Platform
// Generated from UI requirements - implement these interfaces in your backend

// ============================================================================
// DASHBOARD CONTRACTS
// ============================================================================

export interface DashboardOverview {
  portfolioValue: number
  dayPnL: number
  dayPnLPercentage: number
  equityCurve: EquityPoint[]
  recentTrades: RecentTrade[]
  riskMetrics: RiskMetrics
  assetAllocation: AssetAllocation[]
  marketAlerts: MarketAlert[]
}

export interface EquityPoint {
  date: string // ISO date string
  value: number
  benchmark?: number // Optional benchmark comparison
}

export interface RecentTrade {
  id: string
  symbol: string
  side: "BUY" | "SELL"
  quantity: number
  price: number
  pnl: number
  executed_at: string
  strategy?: string
}

export interface RiskMetrics {
  sharpeRatio: number
  maxDrawdown: number
  volatility: number
  var95: number // Value at Risk 95%
  beta: number
  alpha: number
}

export interface AssetAllocation {
  category: string
  value: number
  percentage: number
  color: string
}

export interface MarketAlert {
  id: string
  type: "price" | "risk" | "news"
  title: string
  message: string
  severity: "info" | "warning" | "critical"
  timestamp: string
}

// ============================================================================
// TRADES CONTRACTS
// ============================================================================

export interface TradesListRequest {
  cursor?: string
  limit?: number
  dateFrom?: string
  dateTo?: string
  symbols?: string[]
  instruments?: ("STOCK" | "OPTION" | "CRYPTO" | "FUTURE")[]
  strategies?: string[]
  pnlMin?: number
  pnlMax?: number
  tags?: string[]
  status?: ("OPEN" | "CLOSED" | "PARTIAL")[]
}

export interface TradesListResponse {
  trades: Trade[]
  nextCursor: string | null
  total: number
  hasMore: boolean
  summary: TradesSummary
}

export interface Trade {
  id: string
  symbol: string
  side: "BUY" | "SELL"
  quantity: number
  price: number
  executed_at: string
  fees: number
  pnl_realized?: number
  strategy?: string
  sector?: string
  notes?: string
  tags: string[]
  instrument: "STOCK" | "OPTION" | "CRYPTO" | "FUTURE"
  broker?: string
  status: "OPEN" | "CLOSED" | "PARTIAL"
  // Options-specific fields
  option_type?: "CALL" | "PUT"
  strike_price?: number
  expiration_date?: string
  // Futures-specific fields
  contract_size?: number
  underlying_symbol?: string
}

export interface TradesSummary {
  totalTrades: number
  totalPnL: number
  winRate: number
  avgTrade: number
  bestTrade: number
  worstTrade: number
}

export interface TradeExportRequest {
  format: "csv" | "xlsx"
  filters: TradesListRequest
  columns: string[]
}

// ============================================================================
// ANALYTICS CONTRACTS
// ============================================================================

export interface AnalyticsRequest {
  timeframe: "1W" | "1M" | "3M" | "YTD" | "1Y" | "ALL" | "CUSTOM"
  dateFrom?: string
  dateTo?: string
  strategies?: string[]
  sectors?: string[]
  benchmark?: "SPY" | "QQQ" | "CUSTOM"
}

export interface PerformanceAnalytics {
  summary: PerformanceSummary
  equityCurve: EquityPoint[]
  benchmarkCurve?: EquityPoint[]
  monthlyReturns: MonthlyReturn[]
  riskMetrics: ExtendedRiskMetrics
}

export interface PerformanceSummary {
  totalReturn: number
  totalReturnPercentage: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  sortinoRatio: number
  maxDrawdown: number
  calmarRatio: number
  winRate: number
  profitFactor: number
}

export interface MonthlyReturn {
  month: string
  return: number
  benchmark?: number
}

export interface ExtendedRiskMetrics extends RiskMetrics {
  sortinoRatio: number
  calmarRatio: number
  informationRatio: number
  treynorRatio: number
  var99: number
  expectedShortfall: number
  skewness: number
  kurtosis: number
}

export interface AttributionAnalysis {
  byStrategy: AttributionItem[]
  bySector: AttributionItem[]
  byPeriod: AttributionItem[]
  byInstrument: AttributionItem[]
}

export interface AttributionItem {
  name: string
  totalReturn: number
  percentage: number
  trades: number
  winRate: number
  avgReturn: number
}

export interface DrawdownAnalysis {
  currentDrawdown: number
  maxDrawdown: number
  drawdownPeriods: DrawdownPeriod[]
  recoveryTimes: number[]
  underwaterCurve: EquityPoint[]
}

export interface DrawdownPeriod {
  start: string
  end: string
  peak: number
  trough: number
  drawdown: number
  recoveryDays: number
}

export interface CorrelationMatrix {
  symbols: string[]
  matrix: number[][]
  heatmapData: CorrelationCell[]
}

export interface CorrelationCell {
  x: string
  y: string
  correlation: number
}

// ============================================================================
// IMPORT CONTRACTS
// ============================================================================

export interface ImportAnalysisRequest {
  file: File // multipart/form-data
  portfolioId: string
}

export interface ImportAnalysisResponse {
  jobId: string
  fileSummary: FileSummary
  brokerDetection: BrokerDetection
  previewData: PreviewRow[]
}

export interface FileSummary {
  name: string
  size: number
  rows: number
  headers: string[]
  encoding: string
  delimiter: string
}

export interface BrokerDetection {
  broker: string | null
  confidence: number // 0-100
  patternsMatched: string[]
  suggestedMapping?: ColumnMapping
}

export interface PreviewRow {
  rowNumber: number
  data: Record<string, string>
}

export interface ColumnMappingRequest {
  jobId: string
  mappingMode: "preset" | "manual"
  columnMappings: ColumnMapping
}

export interface ColumnMapping {
  [csvColumn: string]: string // Maps CSV column to canonical field
}

export interface ValidationRequest {
  jobId: string
}

export interface ValidationResponse {
  jobId: string
  validationSummary: ValidationSummary
  issues: ValidationIssue[]
  sampleValidData: PreviewRow[]
}

export interface ValidationSummary {
  totalRows: number
  validRows: number
  errorRows: number
  warningRows: number
  duplicateRows: number
}

export interface ValidationIssue {
  row: number
  column: string
  value: string
  issue: string
  severity: "ERROR" | "WARNING" | "INFO"
  suggestion?: string
  fixable: boolean
}

export interface ImportExecutionRequest {
  jobId: string
  skipErrors: boolean
  ignoreWarnings: boolean
  applyFixes: boolean
}

export interface ImportExecutionResponse {
  jobId: string
  status: "importing" | "completed" | "failed"
  summary: ImportSummary
}

export interface ImportSummary {
  totalRows: number
  importedTrades: number
  skippedRows: number
  errorRows: number
  duplicatesFound: number
  processingTimeMs: number
}

export interface ImportStatusResponse {
  jobId: string
  status: "analyzing" | "mapped" | "validated" | "importing" | "completed" | "failed"
  progress: number // 0-100
  currentStep: string
  error?: string
  result?: ImportSummary
}

export interface BrokerTemplate {
  broker: string
  displayName: string
  description: string
  sampleUrl: string
  mapping: ColumnMapping
  requiredColumns: string[]
}

// ============================================================================
// SETTINGS CONTRACTS
// ============================================================================

export interface UserProfile {
  id: string
  username: string
  email: string
  fullName?: string
  avatarUrl?: string
  timezone: string
  currency: string
  createdAt: string
  lastLogin?: string
}

export interface UserSettings {
  theme: "dark" | "light" | "system"
  timezone: string
  currency: string
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  twoFactorEnabled: boolean
  language: string
  dateFormat: string
  numberFormat: string
}

export interface UpdateProfileRequest {
  username?: string
  fullName?: string
  timezone?: string
  currency?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UserSession {
  id: string
  deviceInfo: string
  location?: string
  ipAddress: string
  lastActivity: string
  isCurrentSession: boolean
}

export interface TwoFactorSetup {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export interface DataExportRequest {
  format: "json" | "csv"
  includePersonalData: boolean
  includeTrades: boolean
  includeAnalytics: boolean
  dateFrom?: string
  dateTo?: string
}

// ============================================================================
// LEADERBOARD CONTRACTS
// ============================================================================

export interface LeaderboardRequest {
  period: "weekly" | "monthly" | "annual"
  sortBy: "pnl" | "percentage"
  limit?: number
  offset?: number
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  userRank?: UserRank
  totalParticipants: number
  lastUpdated: string
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  avatarUrl?: string
  totalPnL: number
  percentageGain: number
  winRate: number
  totalTrades: number
  badge?: "gold" | "silver" | "bronze"
  isCurrentUser?: boolean
}

export interface UserRank {
  currentRank: number
  previousRank?: number
  percentile: number
  totalPnL: number
  percentageGain: number
}

// ============================================================================
// JOURNAL CONTRACTS
// ============================================================================

export interface JournalEntry {
  id: string
  date: string
  title?: string
  content: string
  tags: string[]
  screenshots: string[]
  tradeId?: string
  symbol?: string
  pnl?: number
  createdAt: string
  updatedAt: string
}

export interface CreateJournalEntryRequest {
  date: string
  title?: string
  content: string
  tags?: string[]
  screenshots?: File[]
  tradeId?: string
}

export interface JournalEntriesResponse {
  entries: JournalEntry[]
  nextCursor?: string
  hasMore: boolean
}

// ============================================================================
// CALENDAR CONTRACTS
// ============================================================================

export interface CalendarRequest {
  year: number
  month: number
  view: "monthly" | "weekly"
}

export interface CalendarResponse {
  days: CalendarDay[]
  summary: CalendarSummary
}

export interface CalendarDay {
  date: string
  totalPnL: number
  tradeCount: number
  winRate: number
  trades: CalendarTrade[]
  intensity: number // 0-1 for color intensity
}

export interface CalendarTrade {
  id: string
  symbol: string
  side: "BUY" | "SELL"
  pnl: number
  time: string
}

export interface CalendarSummary {
  totalPnL: number
  totalTrades: number
  winningDays: number
  losingDays: number
  bestDay: { date: string; pnl: number }
  worstDay: { date: string; pnl: number }
}

// ============================================================================
// SUBSCRIPTION CONTRACTS
// ============================================================================

export interface SubscriptionInfo {
  plan: "starter" | "professional" | "enterprise"
  status: "active" | "canceled" | "past_due" | "trialing"
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  trialEnd?: string
}

export interface BillingInfo {
  customerId: string
  paymentMethod?: PaymentMethod
  billingAddress?: BillingAddress
  invoices: Invoice[]
}

export interface PaymentMethod {
  id: string
  type: "card"
  card: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
}

export interface BillingAddress {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface Invoice {
  id: string
  amount: number
  currency: string
  status: "paid" | "open" | "void"
  created: string
  dueDate: string
  pdfUrl: string
}

export interface PricingPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: "month" | "year"
  features: string[]
  limits: PlanLimits
  popular?: boolean
}

export interface PlanLimits {
  maxTrades: number | null // null = unlimited
  maxPortfolios: number
  analyticsHistory: number // months
  csvImports: number // per month
  apiCalls: number // per month
}

// ============================================================================
// AUTHENTICATION CONTRACTS
// ============================================================================

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignupRequest {
  username: string
  email: string
  password: string
  acceptTerms: boolean
  referralCode?: string
}

export interface AuthResponse {
  user: AuthUser
  session: AuthSession
  requiresEmailVerification?: boolean
  requires2FA?: boolean
}

export interface AuthUser {
  id: string
  email: string
  username: string
  emailVerified: boolean
  createdAt: string
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetConfirmRequest {
  token: string
  newPassword: string
}

// ============================================================================
// SHARED/COMMON CONTRACTS
// ============================================================================

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  errors?: ApiError[]
}

export interface ApiError {
  code: string
  message: string
  field?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface CursorPaginatedResponse<T> {
  data: T[]
  nextCursor: string | null
  hasMore: boolean
}

// ============================================================================
// NOTIFICATION CONTRACTS
// ============================================================================

export interface NotificationPreferences {
  email: {
    tradeAlerts: boolean
    weeklyReports: boolean
    marketNews: boolean
    systemUpdates: boolean
  }
  push: {
    tradeAlerts: boolean
    priceAlerts: boolean
    riskAlerts: boolean
  }
  sms: {
    criticalAlerts: boolean
    securityAlerts: boolean
  }
}

export interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  actionUrl?: string
  isRead: boolean
  createdAt: string
  expiresAt?: string
}
