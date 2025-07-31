import { Trade } from "../data/mock-trades";

export function calculateTotalPnL(trades: Trade[]): number {
  // Only use trades that have both entryPrice and exitPrice and positionSize defined
  const validTrades = trades.filter(
    t =>
      typeof t.exitPrice === "number" &&
      typeof t.entryPrice === "number" &&
      typeof t.positionSize === "number"
  );
  return validTrades.reduce(
    (sum, t) => sum + (t.exitPrice! - t.entryPrice!) * t.positionSize!,
    0
  );
}

export function calculateWinRate(trades: Trade[]): number {
  // Only use trades that have both entryPrice and exitPrice defined
  const validTrades = trades.filter(
    t =>
      typeof t.exitPrice === "number" &&
      typeof t.entryPrice === "number" &&
      typeof t.type === "string"
  );
  if (validTrades.length === 0) return 0;
  const wins = validTrades.filter(
    t => (t.exitPrice! - t.entryPrice!) * (t.type === "long" ? 1 : -1) > 0
  ).length;
  return (wins / validTrades.length) * 100;
}

export function calculateRR(trade: Trade): number | null {
  if (
    typeof trade.stopLoss !== "number" ||
    typeof trade.entryPrice !== "number" ||
    typeof trade.exitPrice !== "number" ||
    trade.stopLoss === trade.entryPrice
  )
    return null;
  const risk = Math.abs(trade.entryPrice! - trade.stopLoss!);
  const reward = Math.abs(trade.exitPrice! - trade.entryPrice!);
  if (risk === 0) return null;
  return reward / risk;
}

export function calculateAverageRR(trades: Trade[]): number {
  const valid = trades
    .map(calculateRR)
    .filter((rr): rr is number => typeof rr === "number" && isFinite(rr));
  if (valid.length === 0) return 0;
  return valid.reduce((sum, rr) => sum + rr, 0) / valid.length;
}

export function calculateTradePnL(trade: Trade): number {
  if (
    typeof trade.exitPrice !== "number" ||
    typeof trade.entryPrice !== "number" ||
    typeof trade.positionSize !== "number"
  ) {
    return 0;
  }
  return (trade.exitPrice! - trade.entryPrice!) * trade.positionSize!;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatRR(value: number): string {
  return `${value.toFixed(1)}x`;
}
