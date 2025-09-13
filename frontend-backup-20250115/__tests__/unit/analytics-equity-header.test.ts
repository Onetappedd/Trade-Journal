import { EquityCurveResponse } from '@/lib/analytics-contracts';
describe('Equity Header', () => {
  it('equals last equity point minus first', () => {
    const response: EquityCurveResponse = {
      points: [
        { t: '2024-01-01', equity: 10000 },
        { t: '2024-01-02', equity: 10200 },
        { t: '2024-01-03', equity: 10500 },
      ],
      initialBalance: 10000,
      finalBalance: 10500,
      absoluteReturn: 500,
      pctReturn: 0.05,
      maxDrawdown: -100,
    };
    const headerValue =
      response.points[response.points.length - 1].equity - response.points[0].equity;
    expect(headerValue).toBe(500);
  });
});
