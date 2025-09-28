# Database Setup Instructions

## 🔍 Step 1: Check Your Current Database Structure

Run this command in your terminal from the `frontend` directory:

```bash
cd frontend
npm install
npm run check-db
```

This will:

- ✅ Check what tables exist in your Supabase database
- ✅ Show the structure of existing tables
- ✅ Test your API keys (Finnhub & Alpha Vantage)
- ✅ Identify what needs to be added

## 📋 Step 2: Based on the Results

### If you see "❌ Table 'trades' - MISSING":

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `lobigrwmngwirucuklmc`
3. Go to **SQL Editor**
4. Copy and paste the contents of `scripts/database-schema.sql`
5. Click **Run** to create all required tables

### If tables exist but have different columns:

I'll provide you with migration scripts based on what the checker finds.

### If everything looks good:

You're ready to use the real data integration!

## 🎯 Required Tables

The Riskr trading analytics platform needs these tables:

### **trades** (Essential)

- Stores all user trading data
- Columns: symbol, asset_type, side, quantity, entry_price, exit_price, dates, etc.

### **profiles** (Essential)

- User profile information
- Extends the built-in auth.users table

### **watchlist** (Optional)

- User's stock watchlist
- Columns: user_id, symbol, added_at

### **tags** (Optional)

- Custom tags for categorizing trades
- Columns: user_id, name, color

### **price_alerts** (Optional)

- Price alert notifications
- Columns: user_id, symbol, target_price, alert_type

## 🔑 API Keys Status

Your API keys are configured:

- ✅ **Finnhub**: `d28n3t9r01qmp5u9eilgd28n3t9r01qmp5u9eim0`
- ✅ **Alpha Vantage**: `Z1FW5Z59ZDFFKBVR`

## 🚀 Next Steps After Database Setup

1. **Test the integration**: Visit `/trending-tickers` to see real market data
2. **Add some trades**: Use the add trade form to create sample data
3. **Check portfolio**: View your real portfolio positions
4. **Explore analytics**: See real performance calculations

## 🆘 If You Need Help

Run the database checker first, then share the output with me. I'll provide specific instructions based on your current setup.

```bash
npm run check-db
```

Copy and paste the entire output, and I'll tell you exactly what to do next!
