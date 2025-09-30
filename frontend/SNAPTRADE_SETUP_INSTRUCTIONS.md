# SnapTrade Setup Instructions

## ⚠️ **IMPORTANT: Environment Variables Required**

Your SnapTrade integration is failing because the environment variables are not set. Here's how to fix it:

### 1. Create `.env.local` file

In your `frontend` folder, create a file named `.env.local` with the following content:

```env
# Supabase (you already have these)
NEXT_PUBLIC_SUPABASE_URL=your_existing_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_existing_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_existing_supabase_service_role_key

# SnapTrade - ADD THESE
SNAPTRADE_CLIENT_ID=your_snaptrade_client_id_here
SNAPTRADE_CONSUMER_KEY=oM7AFznsT1V2ZOXi2G3rRCYGFWoVLkdsultf7sbf6akBtEbLcd
SNAPTRADE_WEBHOOK_SECRET=your_snaptrade_webhook_secret_here
```

### 2. Get Your SnapTrade Client ID

You need to get your `SNAPTRADE_CLIENT_ID` from the SnapTrade dashboard:
- Go to: https://app.snaptrade.com/dashboard
- Find your **Client ID** in the API credentials section
- Copy and paste it into `.env.local`

### 3. Get Your Webhook Secret (Optional but recommended)

For webhook verification:
- In SnapTrade dashboard, go to Webhooks settings
- Copy your **Webhook Secret**
- Add it to `.env.local`

### 4. Restart Your Development Server

After adding the environment variables:

```bash
cd frontend
npm run dev
```

### 5. Verify Setup

Navigate to `/connect` and click "Connect Broker". You should see the SnapTrade portal open without errors.

---

## 🔒 **Security Note**

- **NEVER** commit `.env.local` to git
- The `.gitignore` file already excludes it
- Only store sensitive keys in `.env.local`

---

## 📋 **Checklist**

- [ ] Created `.env.local` file in `frontend` folder
- [ ] Added `SNAPTRADE_CLIENT_ID`
- [ ] Added `SNAPTRADE_CONSUMER_KEY` (you already have this: oM7AFznsT1V2ZOXi2G3rRCYGFWoVLkdsultf7sbf6akBtEbLcd)
- [ ] Added `SNAPTRADE_WEBHOOK_SECRET` (optional)
- [ ] Restarted development server
- [ ] Tested connection at `/connect`

---

## 🚀 **Next Steps After Setup**

Once your environment variables are configured:

1. **Connect a broker** - Visit `/connect` and link your brokerage account
2. **View analytics** - Go to `/dashboard` or `/analytics` to see broker data
3. **Manual imports still work** - You can still manually import CSV files alongside broker connections
