export type BrokerGuide = {
  title: string;
  steps: Array<{ title: string; detail: string }>;
  notes?: string[];
};

export const BROKER_EXPORT_GUIDES: Record<string, BrokerGuide> = {
  ibkr: {
    title: 'Interactive Brokers (IBKR) — Export Trades',
    steps: [
      { title: 'Open Client Portal', detail: 'Log in to the IBKR Client Portal.' },
      { title: 'Reports → Statements', detail: 'Navigate to Reports, then Statements.' },
      { title: 'Activity', detail: 'Choose the Activity statement type.' },
      {
        title: 'Period/Date Range',
        detail: 'Select your desired statement period or a custom date range.',
      },
      {
        title: 'Generate → Download CSV (Trades)',
        detail: 'Generate the report and download the CSV for the Trades section.',
      },
    ],
    notes: [
      'For options and futures, ensure the Trades section is enabled in the statement.',
      'Set export timezone to your local time for best results.',
    ],
  },
  schwab: {
    title: 'Charles Schwab — Export Transactions',
    steps: [
      { title: 'Accounts → History', detail: 'Open your account and click History.' },
      {
        title: 'Transactions',
        detail: 'Filter by Transactions and set your desired date range/type.',
      },
      { title: 'Export → CSV', detail: 'Export the filtered data as a CSV file.' },
    ],
  },
  webull: {
    title: 'Webull — Export Trade History',
    steps: [
      { title: 'App → Menu', detail: 'Open the Webull app and go to the main menu.' },
      {
        title: 'Statements → Trade Confirmations / Account',
        detail: 'Locate statements and trade confirmations.',
      },
      { title: 'Export history → CSV', detail: 'Export your trade history as a CSV file.' },
    ],
  },
  robinhood: {
    title: 'Robinhood — Export History',
    steps: [
      {
        title: 'Account → Statements & History',
        detail: 'Open your account and go to Statements & History.',
      },
      { title: 'Export (CSV)', detail: 'Use the export option to download a CSV file.' },
    ],
  },
  fidelity: {
    title: 'Fidelity — Export Activity',
    steps: [
      {
        title: 'Accounts → Activity & Orders',
        detail: 'Open your account and navigate to Activity & Orders.',
      },
      { title: 'Download → Choose date range', detail: 'Pick the desired period to export.' },
      { title: 'CSV', detail: 'Export the results in CSV format.' },
    ],
  },
  etrade: {
    title: 'E*TRADE — Export Transactions',
    steps: [
      { title: 'Accounts → Transactions', detail: 'Open accounts and view transactions.' },
      { title: 'Filter', detail: 'Set your desired filters and date range.' },
      { title: 'Export → CSV', detail: 'Export the filtered transactions as CSV.' },
    ],
  },
  tastytrade: {
    title: 'Tastytrade — Export History',
    steps: [
      { title: 'Account → History', detail: 'Open your account and go to History.' },
      { title: 'Export → CSV', detail: 'Use the export option to download a CSV file.' },
    ],
  },
  tradestation: {
    title: 'TradeStation — Export Executions',
    steps: [
      { title: 'Trade Manager / Web', detail: 'Open Trade Manager or the web interface.' },
      { title: 'Order Execution Reports', detail: 'Open the Order Execution Reports section.' },
      { title: 'Export → CSV', detail: 'Export the execution report as CSV.' },
    ],
  },
  coinbase: {
    title: 'Coinbase — Export Transaction History',
    steps: [
      { title: 'Profile / Reports', detail: 'Go to your profile or reports section.' },
      {
        title: 'Transaction History / Fills',
        detail: 'Select the transaction history or fills view.',
      },
      { title: 'Select range → Export CSV', detail: 'Choose a date range and export CSV.' },
    ],
  },
  kraken: {
    title: 'Kraken — Export Transaction History',
    steps: [
      { title: 'Profile / Reports', detail: 'Open your profile/reports area.' },
      {
        title: 'Transaction History / Fills',
        detail: 'Select the fills or transaction history view.',
      },
      { title: 'Select range → Export CSV', detail: 'Pick a range and export to CSV.' },
    ],
  },
  binanceus: {
    title: 'BinanceUS — Export Trade History',
    steps: [
      { title: 'Profile / Reports', detail: 'Open profile or reports.' },
      { title: 'Transaction History / Fills', detail: 'Select trade/fills history.' },
      { title: 'Select range → Export CSV', detail: 'Choose the range and export CSV.' },
    ],
  },
  generic: {
    title: 'Export Guide (Generic)',
    steps: [
      { title: 'Open your broker platform', detail: 'Log in to the web portal or app.' },
      {
        title: 'Find Statements / History',
        detail: 'Open the statements, history, or activity section.',
      },
      { title: 'Filter by date and type', detail: 'Choose the date range and transaction types.' },
      { title: 'Export → CSV', detail: 'Export or download the data as a CSV file.' },
    ],
    notes: [
      'If your broker isn't listed, contact support to add a tailored guide.',
      'Prefer CSV exports; if using XLSX, ensure the correct sheet and headers.',
    ],
  },
};
