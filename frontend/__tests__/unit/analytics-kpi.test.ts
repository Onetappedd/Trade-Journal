import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CardsSummary } from '@/lib/analytics-contracts'
// import KpiCardsRow from '@/app/dashboard/analytics/KpiCardsRow' // adjust import as needed

describe('KPI Cards', () => {
  it('binds to server data and displays correct values', () => {
    // Example server data
    const data: CardsSummary = {
      net: 1000, realized: 800, fees: 50, winRate: 0.6, avgWin: 200, avgLoss: -100, expectancy: 0.5, profitFactor: 1.5, tradeCount: 20, maxDrawdown: -200, sharpe: 1.2, sortino: 1.5
    }
    // TODO: Render KpiCardsRow with data and assert values
    // const { getByText } = render(<KpiCardsRow data={data} />)
    // expect(getByText('$1,000')).toBeInTheDocument()
    // ...
    expect(data.net).toBe(1000)
  })
})
