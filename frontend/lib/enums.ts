export const ASSET_TYPES = ['stock', 'option', 'futures', 'crypto'] as const;
export const BROKER_ENUM = ['robinhood', 'fidelity', 'schwab', 'ib', 'td', 'etrade', 'webull', 'other'] as const;
export const SIDE_ENUM = ['buy', 'sell'] as const;
export const STATUS_ENUM = ['open', 'closed', 'cancelled'] as const;

export type AssetType = typeof ASSET_TYPES[number];
export type Broker = typeof BROKER_ENUM[number];
export type Side = typeof SIDE_ENUM[number];
export type Status = typeof STATUS_ENUM[number];