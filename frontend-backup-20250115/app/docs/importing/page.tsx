import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Importing Trades - Riskr Documentation',
  description: 'Complete guide to importing trading data into Riskr',
};

export default function ImportingDocsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Importing Trades</h1>
          <p className="text-muted-foreground mt-2">
            Complete guide to importing your trading data into Riskr
          </p>
        </div>
        <Link href="/dashboard/import">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Import
          </Button>
        </Link>
      </div>

      {/* Overview Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Overview: 4 Ways to Import</h2>
        <p className="text-muted-foreground">
          Riskr supports multiple import methods to accommodate different workflows and data sources:
        </p>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-xl font-medium">1. API Integration (Coming Soon)</h3>
            <ul className="space-y-2 text-sm">
              <li>• Direct connection to your broker's API</li>
              <li>• Real-time data synchronization</li>
              <li>• Automated trade capture</li>
              <li className="text-muted-foreground italic">Currently disabled - contact support for early access</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">2. CSV Import (Recommended)</h3>
            <ul className="space-y-2 text-sm">
              <li>• Upload CSV files from your broker</li>
              <li>• Support for Excel (.xlsx, .xls) and IBKR Flex XML files</li>
              <li>• Interactive mapping wizard</li>
              <li>• Batch processing with error handling</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">3. Email Forwarding (Coming Soon)</h3>
            <ul className="space-y-2 text-sm">
              <li>• Forward trade confirmations to a unique email address</li>
              <li>• Automatic parsing and import</li>
              <li>• Works with most broker email formats</li>
              <li className="text-muted-foreground italic">Currently disabled - contact support for early access</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-medium">4. Manual Entry</h3>
            <ul className="space-y-2 text-sm">
              <li>• Add individual executions by hand</li>
              <li>• Perfect for quick fixes or odd cases</li>
              <li>• Immediate trade matching and P&L calculation</li>
              <li className="text-green-600 font-medium">Available now</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Broker Export Guides */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">How to Export from Common Brokers</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Robinhood</h3>
            <ol className="space-y-1 text-sm">
              <li>1. Log into your Robinhood account</li>
              <li>2. Go to <strong>Account</strong> → <strong>History</strong></li>
              <li>3. Click <strong>Export</strong> → <strong>Download CSV</strong></li>
              <li>4. Select date range and download</li>
              <li>5. Upload to Riskr using CSV Import</li>
            </ol>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Interactive Brokers (IBKR)</h3>
            <ol className="space-y-1 text-sm">
              <li>1. Log into Client Portal</li>
              <li>2. Go to <strong>Reports</strong> → <strong>Activity</strong> → <strong>Trades</strong></li>
              <li>3. Set date range and click <strong>Generate Report</strong></li>
              <li>4. Download as CSV or Flex XML</li>
              <li>5. Upload to Riskr using CSV Import</li>
            </ol>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Fidelity</h3>
            <ol className="space-y-1 text-sm">
              <li>1. Log into Fidelity.com</li>
              <li>2. Go to <strong>Accounts & Trade</strong> → <strong>Account Positions</strong></li>
              <li>3. Click <strong>History</strong> → <strong>Download</strong></li>
              <li>4. Select CSV format and date range</li>
              <li>5. Upload to Riskr using CSV Import</li>
            </ol>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Charles Schwab</h3>
            <ol className="space-y-1 text-sm">
              <li>1. Log into Schwab.com</li>
              <li>2. Go to <strong>Accounts</strong> → <strong>Trade</strong> → <strong>Order Status</strong></li>
              <li>3. Click <strong>Export</strong> → <strong>CSV</strong></li>
              <li>4. Select date range and download</li>
              <li>5. Upload to Riskr using CSV Import</li>
            </ol>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">E*TRADE</h3>
            <ol className="space-y-1 text-sm">
              <li>1. Log into E*TRADE.com</li>
              <li>2. Go to <strong>Accounts</strong> → <strong>History</strong></li>
              <li>3. Click <strong>Export</strong> → <strong>CSV</strong></li>
              <li>4. Select date range and download</li>
              <li>5. Upload to Riskr using CSV Import</li>
            </ol>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Tastyworks</h3>
            <ol className="space-y-1 text-sm">
              <li>1. Log into Tastyworks platform</li>
              <li>2. Go to <strong>Account</strong> → <strong>History</strong></li>
              <li>3. Click <strong>Export</strong> → <strong>CSV</strong></li>
              <li>4. Select date range and download</li>
              <li>5. Upload to Riskr using CSV Import</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Mapping Wizard Tips */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Mapping Wizard Tips</h2>
        <p className="text-muted-foreground">
          The Mapping Wizard helps you connect your broker's column names to Riskr's standardized fields.
        </p>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Required Fields</h3>
            <ul className="space-y-2 text-sm">
              <li>• <strong>Timestamp</strong>: When the trade occurred</li>
              <li>• <strong>Symbol</strong>: Stock/option/futures symbol</li>
              <li>• <strong>Side</strong>: Buy, Sell, Short, or Cover</li>
              <li>• <strong>Quantity</strong>: Number of shares/contracts</li>
              <li>• <strong>Price</strong>: Execution price per share/contract</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Date Formats</h3>
            <p className="text-sm mb-2">Riskr accepts most common date formats:</p>
            <ul className="space-y-1 text-sm">
              <li>• <code>MM/DD/YYYY</code> (e.g., 12/25/2024)</li>
              <li>• <code>YYYY-MM-DD</code> (e.g., 2024-12-25)</li>
              <li>• <code>MM-DD-YYYY</code> (e.g., 12-25-2024)</li>
              <li>• <code>DD/MM/YYYY</code> (e.g., 25/12/2024)</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Time Formats</h3>
            <ul className="space-y-1 text-sm">
              <li>• <code>HH:MM:SS</code> (e.g., 14:30:00)</li>
              <li>• <code>HH:MM</code> (e.g., 14:30)</li>
              <li>• <code>HH:MM:SS AM/PM</code> (e.g., 2:30:00 PM)</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Decimal Separators</h3>
            <ul className="space-y-1 text-sm">
              <li>• Use periods for decimals: <code>150.25</code></li>
              <li>• Commas are automatically removed: <code>1,500.25</code> → <code>1500.25</code></li>
              <li>• Negative values in parentheses: <code>(150.25)</code> → <code>-150.25</code></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Common Column Mappings</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Riskr Field</th>
                    <th className="text-left p-2 font-medium">Common Broker Names</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Timestamp</td>
                    <td className="p-2">Time, Date, DateTime, Execution Time</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Symbol</td>
                    <td className="p-2">Symbol, Ticker, Security, Instrument</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Side</td>
                    <td className="p-2">Side, Action, Buy/Sell, Transaction Type</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Quantity</td>
                    <td className="p-2">Quantity, Shares, Contracts, Size</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Price</td>
                    <td className="p-2">Price, Execution Price, Fill Price</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Fees</td>
                    <td className="p-2">Commission, Fees, Total Fees</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Currency</td>
                    <td className="p-2">Currency, CCY</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Venue</td>
                    <td className="p-2">Exchange, Market, Venue</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">Order ID</td>
                    <td className="p-2">Order ID, Order Number, Reference</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">Execution ID</td>
                    <td className="p-2">Execution ID, Fill ID, Trade ID</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Flags */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Why Email/API are Disabled</h2>
        <p className="text-muted-foreground">
          Some import methods are currently disabled due to feature flags and domain requirements:
        </p>
        
        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-2">API Integration</h3>
            <ul className="space-y-1 text-sm">
              <li>• <strong>Status</strong>: Disabled by <code>BROKER_APIS_ENABLED</code> flag</li>
              <li>• <strong>Reason</strong>: Requires broker API credentials and OAuth setup</li>
              <li>• <strong>Timeline</strong>: Available for enterprise customers</li>
              <li>• <strong>Contact</strong>: Support for early access</li>
            </ul>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-2">Email Forwarding</h3>
            <ul className="space-y-1 text-sm">
              <li>• <strong>Status</strong>: Disabled by <code>INBOUND_EMAIL_ENABLED</code> flag</li>
              <li>• <strong>Reason</strong>: Requires dedicated email domain and MX records</li>
              <li>• <strong>Timeline</strong>: Available for enterprise customers</li>
              <li>• <strong>Contact</strong>: Support for early access</li>
            </ul>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="text-lg font-medium mb-2">Cron Jobs</h3>
            <ul className="space-y-1 text-sm">
              <li>• <strong>Status</strong>: Disabled by <code>CRON_ENABLED</code> flag</li>
              <li>• <strong>Reason</strong>: Requires server-side scheduling infrastructure</li>
              <li>• <strong>Timeline</strong>: Available for enterprise customers</li>
              <li>• <strong>Contact</strong>: Support for early access</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Privacy & Deletion */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Privacy & Deletion</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Data Storage</h3>
            <ul className="space-y-2 text-sm">
              <li>• All imported data is stored securely in your private database</li>
              <li>• Data is encrypted in transit and at rest</li>
              <li>• We never share your trading data with third parties</li>
              <li>• Your data is isolated by user account</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Deleting Import Runs</h3>
            <p className="text-sm mb-2">To delete an import run and all associated data:</p>
            <ol className="space-y-1 text-sm">
              <li>1. Go to <strong>Dashboard</strong> → <strong>Import</strong> → <strong>History</strong></li>
              <li>2. Find the import run you want to delete</li>
              <li>3. Click <strong>View Details</strong></li>
              <li>4. Click <strong>Delete Import Run</strong> (if available)</li>
              <li>5. Confirm deletion</li>
            </ol>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">What Gets Deleted</h3>
            <p className="text-sm mb-2">When you delete an import run:</p>
            <ul className="space-y-1 text-sm">
              <li>✅ Raw import items</li>
              <li>✅ Associated executions</li>
              <li>✅ Generated trades (if no other executions exist)</li>
              <li>✅ Import run record</li>
              <li>❌ Other trades that share executions with this run</li>
              <li>❌ Instrument records (may be used by other trades)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Troubleshooting</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Common Import Errors</h3>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">"Invalid date format"</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Check your date column mapping</li>
                  <li>• Ensure dates are in a recognized format</li>
                  <li>• Try reformatting dates in your spreadsheet</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">"Missing required field"</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Review the required fields list above</li>
                  <li>• Check your column mappings in the wizard</li>
                  <li>• Ensure all required columns are mapped</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">"Duplicate execution detected"</h4>
                <ul className="space-y-1 text-sm">
                  <li>• This execution was already imported</li>
                  <li>• Check your import history for previous runs</li>
                  <li>• The system prevents duplicate data</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">"Invalid price/quantity"</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Check for non-numeric characters</li>
                  <li>• Remove currency symbols and commas</li>
                  <li>• Ensure positive values (negative in parentheses)</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Getting Help</h3>
            <p className="text-sm mb-2">If you're still having trouble:</p>
            <ol className="space-y-1 text-sm">
              <li>1. <strong>Check the logs</strong>: Import runs show detailed error messages</li>
              <li>2. <strong>Try manual entry</strong>: For a few trades, use the manual entry form</li>
              <li>3. <strong>Contact support</strong>: Include your import run ID and error details</li>
              <li>4. <strong>Join our community</strong>: Get help from other users</li>
            </ol>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Support Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm"><strong>Email</strong>: support@tradejournal.com</p>
                <p className="text-sm"><strong>Documentation</strong>: 
                  <a href="https://docs.tradejournal.com" className="text-blue-600 hover:underline ml-1">
                    docs.tradejournal.com <ExternalLink className="h-3 w-3 inline" />
                  </a>
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm"><strong>Community</strong>: 
                  <a href="https://community.tradejournal.com" className="text-blue-600 hover:underline ml-1">
                    community.tradejournal.com <ExternalLink className="h-3 w-3 inline" />
                  </a>
                </p>
                <p className="text-sm"><strong>Status</strong>: 
                  <a href="https://status.tradejournal.com" className="text-blue-600 hover:underline ml-1">
                    status.tradejournal.com <ExternalLink className="h-3 w-3 inline" />
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="border-t pt-6 text-center text-sm text-muted-foreground">
        <p>Last updated: January 2025</p>
      </div>
    </div>
  );
}
