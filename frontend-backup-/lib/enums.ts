export const ASSET_TYPES = ['stock', 'option', 'futures', 'crypto'] as const;
export const BROKER_ENUM = [] as const;
export const SIDE_ENUM = ['buy', 'sell'] as const;
export const STATUS_ENUM = ['open', 'closed', 'partial'] as const;

export type AssetType = typeof ASSET_TYPES[number];
export type Broker = typeof BROKER_ENUM[number];
export type Side = typeof SIDE_ENUM[number];
export type Status = typeof STATUS_ENUM[number];