export function formatCurrency(n: number, currency = "USD"): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
}

export function formatPercent(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n / 100);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(n);
}