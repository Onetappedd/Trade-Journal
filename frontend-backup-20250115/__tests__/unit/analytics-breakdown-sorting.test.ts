import { BreakdownResponse } from '@/lib/analytics-contracts';
describe('Breakdown Sorting', () => {
  it('sorts breakdown table by net descending', () => {
    const response: BreakdownResponse<{ key: string; value: number; label: string }> = {
      items: [
        { key: 'A', value: 100, label: 'A' },
        { key: 'B', value: 300, label: 'B' },
        { key: 'C', value: 200, label: 'C' },
      ],
    };
    const sorted = [...response.items].sort((a, b) => b.value - a.value);
    expect(sorted[0].value).toBe(300);
    expect(sorted[1].value).toBe(200);
    expect(sorted[2].value).toBe(100);
  });
});
