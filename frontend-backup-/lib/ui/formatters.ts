import { format } from 'date-fns';

export function fmtCurrency(value: number | string | null | undefined, currency = "USD") {
  if (value == null || value === "") return "—";
  return Number(value).toLocaleString(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

export function fmtNumber(value: number | string | null | undefined, options: { digits?: number } = {}) {
  if (value == null || value === "") return "—";
  return Number(value).toLocaleString(undefined, {
    maximumFractionDigits: options.digits ?? 2,
  });
}

export function pnlChipColor(pnl: number | null | undefined): string {
  if (pnl == null) return "bg-muted text-foreground";
  return pnl >= 0 ? "bg-green-500 text-white" : "bg-red-500 text-white";
}

export function compactDate(dt: string | Date | null | undefined): string {
  if (!dt) return "—";
  const date = typeof dt === "string" ? new Date(dt) : dt;
  return format(date, "MMM d, yyyy");
}
