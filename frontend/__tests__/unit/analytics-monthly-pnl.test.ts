import { MonthlyPnlResponse } from '@/lib/analytics-contracts'
describe('Monthly PnL', () => {
  it('sum of monthly bars matches totals', () => {
    const response: MonthlyPnlResponse = {
      months: [
        { month: '2024-01', realizedPnl: 100, fees: 10, netPnl: 90, tradeCount: 5, isProfitable: true },
        { month: '2024-02', realizedPnl: 200, fees: 20, netPnl: 180, tradeCount: 8, isProfitable: true },
      ],
      totals: { realizedPnl: 300, fees: 30, netPnl: 270, tradeCount: 13 },
    }
    const sum = response.months.reduce((acc, m) => acc + m.netPnl, 0)
    expect(sum).toBe(response.totals.netPnl)
  })
})
