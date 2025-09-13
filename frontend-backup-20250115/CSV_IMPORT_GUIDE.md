# CSV Import System Guide

## How CSV Format Detection Works

The CSV import system uses a multi-layered approach to automatically detect and parse different broker formats:

### 1. File Upload & Initial Processing

When you upload a CSV file:

1. **File Validation**: Checks file type (.csv, .xlsx, .xml, etc.)
2. **Header Detection**: Reads the first row to identify column names
3. **Sample Data**: Extracts first 10-20 rows for preview and analysis
4. **Format Guessing**: Attempts to match headers to known broker formats

### 2. Broker Format Detection

The system recognizes these broker formats automatically:

#### **Webull Options** (Your Format)
- **Headers**: `Name`, `Symbol`, `Side`, `Status`, `Filled`, `Total Qty`, `Price`, `Avg Price`, `Time-in-Force`, `Placed Time`, `Filled Time`
- **Key Features**:
  - Options contracts in `Name` column (e.g., `QQQ250822P00563000`)
  - `Filled Time` for execution timestamp
  - `Avg Price` for clean price data
  - `Filled` quantity for actual executed amount

#### **Interactive Brokers (IBKR)**
- **Headers**: `dateTime`, `symbol`, `side`, `quantity`, `price`, `fees`, `currency`, `exchange`
- **Features**: Comprehensive options data, multiple currencies

#### **Robinhood**
- **Headers**: `Time`, `Symbol`, `Side`, `Quantity`, `Price`, `Fees`
- **Features**: Simple equity trades, basic options

#### **Fidelity/Schwab/TOS**
- **Headers**: `Date/Time`, `Symbol`, `Action`, `Quantity`, `Price`, `Commission`
- **Features**: Traditional broker format

### 3. Smart Column Mapping

The system automatically maps columns using these strategies:

#### **Timestamp Detection**
- Looks for columns with date/time patterns
- Handles various formats: `MM/DD/YYYY HH:MM:SS`, `YYYY-MM-DD`, etc.
- Prioritizes execution time over order placement time

#### **Symbol Parsing**
- **Equity**: Direct symbol mapping (AAPL, TSLA)
- **Options**: Parses contract details from symbol strings
  - Example: `QQQ250822P00563000` → 
    - Underlying: QQQ
    - Expiry: 2025-08-22
    - Type: Put
    - Strike: $563.00

#### **Side Mapping**
- Maps: `Buy` → `buy`, `Sell` → `sell`
- Handles variations: `B`, `S`, `Buy`, `Sell`, `Long`, `Short`

#### **Price & Quantity**
- Extracts numeric values from formatted strings
- Handles: `44 @0.080` → quantity: 44, price: 0.08
- Uses `Avg Price` when available for cleaner data

### 4. Webull Options Specific Handling

For your Webull options CSV:

#### **Automatic Detection**
The system will recognize this as Webull format based on:
- `Name` column with options contract strings
- `Filled Time` column for timestamps
- `Side` column with Buy/Sell values
- `Filled` column for quantities

#### **Options Parsing**
The `Name` column is automatically parsed:
- `QQQ250822P00563000` → 
  - Symbol: QQQ
  - Expiry: 2025-08-22
  - Type: Put
  - Strike: $563.00

#### **Data Cleaning**
- Uses `Filled` quantity (not `Total Qty`)
- Uses `Avg Price` (not `Price` with quantity)
- Filters out `Cancelled` orders automatically
- Only imports `Filled` orders

### 5. Import Process

#### **Phase 1: Validation**
- Checks required fields are mapped
- Validates data types and formats
- Shows preview of first 10 rows

#### **Phase 2: Processing**
- Processes data in chunks (2000 rows per chunk)
- Shows real-time progress bar
- Handles duplicates and errors gracefully

#### **Phase 3: Completion**
- Shows summary of imported trades
- Displays any errors or duplicates
- Updates import history

### 6. Error Handling

The system handles common issues:

#### **Duplicate Detection**
- Uses unique hash based on: symbol, side, quantity, price, timestamp, venue
- Automatically skips duplicates
- Reports duplicate count

#### **Data Validation**
- Checks for required fields
- Validates numeric values
- Handles missing or malformed data

#### **Format Recovery**
- Attempts to parse various date formats
- Handles different number formats
- Recovers from minor formatting issues

### 7. Customization Options

#### **Manual Mapping**
- Override automatic column detection
- Map custom fields
- Add new broker presets

#### **Import Options**
- Set default currency
- Choose duplicate handling strategy
- Configure error tolerance

### 8. Best Practices

#### **For Webull Options**
1. Use the `Filled Time` column for accurate execution times
2. The `Name` column provides complete options contract details
3. `Filled` quantity shows actual executed amounts
4. `Avg Price` gives clean price data

#### **General Tips**
1. Ensure CSV headers are in the first row
2. Use consistent date/time formats
3. Include all required fields (timestamp, symbol, side, quantity, price)
4. Test with small files first

### 9. Troubleshooting

#### **Common Issues**
- **"No valid rows found"**: Check CSV format and headers
- **"Missing required fields"**: Verify column mapping
- **"Import stuck"**: Check progress bar and wait for completion
- **"Parse errors"**: Verify data format in problematic columns

#### **Getting Help**
- Use the Help button on the import page
- Check the import history for detailed error messages
- Review the preview data before committing

## Summary

The CSV import system automatically detects Webull options format and other broker formats, intelligently maps columns, and provides real-time progress tracking. For your Webull options data, it will automatically:

1. ✅ Recognize the format
2. ✅ Parse options contract details
3. ✅ Map all relevant columns
4. ✅ Show import progress
5. ✅ Handle duplicates and errors
6. ✅ Provide detailed completion summary

The system is designed to work "out of the box" with minimal configuration needed!
