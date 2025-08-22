export type AssetType = "stock" | "option" | "future" | "crypto";

export type BaseTrade = {
  id: string;
  userId: string;
  assetType: AssetType;
  symbol: string;
  side: "long" | "short" | "buy" | "sell";
  quantity: number;
  openPrice: number;
  closePrice?: number | null;
  fees?: number | null;
  openedAt: string;
  closedAt?: string | null;
  status: "open" | "closed" | "partial" | "canceled";
  notes?: string | null;
  realizedPnl?: number | null;
  realizedPnlPct?: number | null;
  tags?: string[] | null;
};

export type OptionTrade = BaseTrade & {
  assetType: "option";
  optionType: "call" | "put";
  strike: number;
  expiration: string;
  multiplier?: number;
};

export type FutureTrade = BaseTrade & {
  assetType: "future";
  contractCode: string;
  expiration: string;
  pointValue: number;
  tickSize?: number | null;
  tickValue?: number | null;
};

export type CryptoTrade = BaseTrade & {
  assetType: "crypto";
  quoteCurrency?: string;
};

export type Trade = BaseTrade | OptionTrade | FutureTrade | CryptoTrade;
