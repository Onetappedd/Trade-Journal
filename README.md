# Riskr

This is a trade journaling application built with Next.js and Supabase.

## Running the application

1.  Install dependencies:

    ```bash
    pnpm install
    ```

2.  Run the development server:

    ```bash
    pnpm dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Running the smoke tests

To run the smoke tests, you will need to have the VSCode REST Client extension installed.

1.  Log in to the application in your browser.
2.  Open the `scripts/smoke-trades.http` file in VSCode.
3.  Click the "Send Request" button above each request to send it.

Each request should return a JSON response with `items` and `total` (or an array for P&L).

## CSV Import v2

### Broker presets
- **Robinhood (history export)**: detects by `Activity Date`, `Trans Code`, `Amount`. Imports only trades (`BTO/BTC/STO/STC` and `Buy/Sell`). Skips interest, fees, ACH, and expirations by default.
- **Webull (orders/fills export)**: detects typical headers (`SYMBOLS`, `SIDE`, `STATUS`, `QTY`, `PRICE`, `FEE`, `TRADE TIME`). Imports only filled rows; cancels skipped. OCC symbols are parsed into option details.

Use the toggle on the import page to switch between preset-transform and manual mapping.