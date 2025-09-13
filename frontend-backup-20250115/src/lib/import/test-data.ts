/**
 * Test data for Webull CSV import debugging
 * Based on the sample data from your logs
 */

export const webullTestData = {
  headers: [
    'Name', 'Symbol', 'Side', 'Status', 'Filled', 'Total Qty', 
    'Price', 'Avg Price', 'Time-in-Force', 'Placed Time', 'Filled Time'
  ],
  
  sampleRows: [
    {
      'Name': 'TSLA250822C00325000',
      'Symbol': 'TSLA250822C00325000', 
      'Side': 'Sell',
      'Status': 'Filled',
      'Filled': '6',
      'Total Qty': '6',
      'Price': '@3.51',
      'Avg Price': '3.51',
      'Time-in-Force': 'DAY',
      'Placed Time': '08/22/2025 09:51:39 EDT',
      'Filled Time': '08/22/2025 09:51:39 EDT'
    },
    {
      'Name': 'TSLA250822C00325000',
      'Symbol': 'TSLA250822C00325000',
      'Side': 'Buy', 
      'Status': 'Filled',
      'Filled': '6',
      'Total Qty': '6',
      'Price': '@2.64',
      'Avg Price': '2.64',
      'Time-in-Force': 'DAY',
      'Placed Time': '08/22/2025 09:41:10 EDT',
      'Filled Time': '08/22/2025 09:41:10 EDT'
    },
    {
      'Name': 'AMD250822P00160000',
      'Symbol': 'AMD250822P00160000',
      'Side': 'Buy',
      'Status': 'Filled', 
      'Filled': '10',
      'Total Qty': '10',
      'Price': '@0.542',
      'Avg Price': '0.542',
      'Time-in-Force': 'DAY',
      'Placed Time': '08/22/2025 09:37:28 EDT',
      'Filled Time': '08/22/2025 09:37:28 EDT'
    }
  ]
};

/**
 * Create a test CSV file for debugging
 */
export function createTestCSV(): string {
  const { headers, sampleRows } = webullTestData;
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => 
      headers.map(header => `"${row[header as keyof typeof row]}"`).join(',')
    )
  ].join('\n');
  
  return csvContent;
}
