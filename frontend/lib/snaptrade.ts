/**
 * SnapTrade Server-Side Client
 * Official SDK integration for broker connections
 * 
 * @see https://www.npmjs.com/package/snaptrade-typescript-sdk
 */

import { Snaptrade } from "snaptrade-typescript-sdk";

// Initialize SnapTrade client with environment credentials
export const snaptrade = new Snaptrade({
  clientId: process.env.SNAPTRADE_CLIENT_ID!,
  consumerKey: process.env.SNAPTRADE_CONSUMER_KEY!,
});

/**
 * Type definitions from SnapTrade SDK
 */

export interface SnapTradeUser {
  userId: string;
  userSecret: string;
}

export interface BrokerageAuthorization {
  id: string;
  brokerage: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };
  disabled: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface Account {
  id: string;
  number: string;
  name?: string;
  type?: string;
  brokerageAuthorization?: string;
  syncDate?: string;
  [key: string]: any;
}

export interface Balance {
  total?: number;
  cash?: number;
  currency?: string;
  [key: string]: any;
}

export interface Position {
  symbol: string;
  quantity?: number;
  averagePrice?: number;
  marketValue?: number;
  currency?: string;
  [key: string]: any;
}

/**
 * Helper functions for common SnapTrade operations
 */

/**
 * Register a new user with SnapTrade
 * @param userId - Unique user ID (e.g., riskr_<uuid>)
 * @returns User data with userSecret
 */
export async function registerSnapTradeUser(userId: string): Promise<SnapTradeUser> {
  const response = await snaptrade.authentication.registerSnapTradeUser({
    userId
  });

  return {
    userId: response.data.userId || userId,
    userSecret: response.data.userSecret || ''
  };
}

/**
 * Generate login/connection portal URL
 * @param userId - SnapTrade user ID
 * @param userSecret - SnapTrade user secret
 * @returns Login redirect URL
 */
export async function getConnectionPortalUrl(
  userId: string,
  userSecret: string
): Promise<string> {
  const response = await snaptrade.authentication.loginSnapTradeUser({
    userId,
    userSecret
  });

  return (response.data as any).redirectURI || '';
}

/**
 * List all brokerage authorizations for a user
 * @param userId - SnapTrade user ID
 * @param userSecret - SnapTrade user secret
 * @returns Array of brokerage authorizations
 */
export async function listBrokerageAuthorizations(
  userId: string,
  userSecret: string
): Promise<BrokerageAuthorization[]> {
  const response = await snaptrade.connections.listBrokerageAuthorizations({
    userId,
    userSecret
  });

  return response.data as unknown as BrokerageAuthorization[];
}

/**
 * Get all accounts for a user
 * @param userId - SnapTrade user ID
 * @param userSecret - SnapTrade user secret
 * @returns Array of accounts
 */
export async function getUserAccounts(
  userId: string,
  userSecret: string
): Promise<Account[]> {
  const response = await snaptrade.accountInformation.listUserAccounts({
    userId,
    userSecret
  });

  return response.data as unknown as Account[];
}

/**
 * Get account balance
 * @param userId - SnapTrade user ID
 * @param userSecret - SnapTrade user secret
 * @param accountId - Account UUID
 * @returns Account balance data
 */
export async function getAccountBalance(
  userId: string,
  userSecret: string,
  accountId: string
): Promise<{ account: Account; balance: Balance }> {
  const response = await snaptrade.accountInformation.getUserAccountBalance({
    userId,
    userSecret,
    accountId
  });

  return {
    account: (response.data as any).account as Account,
    balance: (response.data as any).balance as Balance
  };
}

/**
 * Get account positions (holdings)
 * @param userId - SnapTrade user ID
 * @param userSecret - SnapTrade user secret
 * @param accountId - Account UUID
 * @returns Array of positions
 */
export async function getAccountPositions(
  userId: string,
  userSecret: string,
  accountId: string
): Promise<Position[]> {
  const response = await snaptrade.accountInformation.getUserAccountPositions({
    userId,
    userSecret,
    accountId
  });

  return response.data as unknown as Position[];
}

/**
 * List all available brokerages
 * @returns Array of supported brokerages
 */
export async function listAllBrokerages() {
  const response = await snaptrade.referenceData.listAllBrokerages();
  return response.data;
}

/**
 * Delete a brokerage authorization (disconnect broker)
 * @param userId - SnapTrade user ID
 * @param userSecret - SnapTrade user secret
 * @param authorizationId - Authorization UUID
 */
export async function removeBrokerageAuthorization(
  userId: string,
  userSecret: string,
  authorizationId: string
): Promise<void> {
  await snaptrade.connections.removeBrokerageAuthorization({
    userId,
    userSecret,
    authorizationId
  });
}

/**
 * Verify webhook signature
 * @param payload - Webhook payload
 * @param signature - Signature from x-snaptrade-signature header
 * @returns True if signature is valid
 */
export function verifyWebhookSignature(payload: any, signature: string): boolean {
  if (!process.env.SNAPTRADE_WEBHOOK_SECRET || !signature) {
    console.warn('Webhook secret or signature missing');
    return false;
  }

  try {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.SNAPTRADE_WEBHOOK_SECRET);
    const payloadString = JSON.stringify(payload);
    const expectedSignature = hmac.update(payloadString).digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Export the main client for direct SDK access
 */
export default snaptrade;
