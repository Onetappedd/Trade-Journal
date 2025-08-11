import { EquityCurveResponse } from '@/lib/analytics-contracts'
describe('Drawdown', () => {
  it('min drawdown in chart matches server', () => {
    const response: EquityCurveResponse = {
      points: [
        { t: '2024-01-01', equity: 10000 },
        { t: '2024-01-02', equity: 10200 },
        { t: '2024-01-03', equity: 9900 },
        { t: '2024-01-04', equity: 10500 },
      ],
      initialBalance: 10000,
      finalBalance: 10500,
      absoluteReturn: 500,
      pctReturn: 0.05,
      maxDrawdown: -300,
    }
    // Simulate drawdown calculation
    let runningMax = response.points[0].equity
    let minDrawdown = 0
    for (const p of response.points) {
      runningMax = Math.max(runningMax, p.equity)
      const dd = p.equity - runningMax
      minDrawdown = Math.min(minDrawdown, dd)
    }
    expect(minDrawdown).toBe(response.maxDrawdown)
  })
})
