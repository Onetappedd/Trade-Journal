# Supabase Setup Instructions

## Database Configuration

Your Supabase project is configured with the following credentials:

- **Project URL**: `https://lobigrwmngwirucuklmc.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYmlncndtbmd3aXJ1Y3VrbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MjAzODgsImV4cCI6MjA2OTQ5NjM4OH0.FZvlw06ILW7TutkrakBLdEIEkuf5f69nGxXaycaMGQQ`

## Database Schema Setup

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/lobigrwmngwirucuklmc

2. **Navigate to SQL Editor**: Click on "SQL Editor" in the left sidebar

3. **Run the Database Schema**: Copy and paste the contents of `scripts/001_simplified_schema.sql` into the SQL editor and execute it.

This will create the following tables:
- `profiles` - User profile information
- `trades` - Trading records
- `tags` - Custom tags for organizing trades
- `trade_tags` - Junction table linking trades to tags

## Authentication Setup

The authentication is already configured to work with your Supabase project. Users can:
- Sign up with email/password
- Sign in with email/password
- Automatic profile creation on first login

## Environment Variables

The following environment variables are already configured in your `.env.local` file:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://lobigrwmngwirucuklmc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYmlncndtbmd3aXJ1Y3VrbG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MjAzODgsImV4cCI6MjA2OTQ5NjM4OH0.FZvlw06ILW7TutkrakBLdEIEkuf5f69nGxXaycaMGQQ
SUPABASE_JWT_SECRET=VVYQP8ca5BSNSbKi1LpVDsHlO1+0FwfwknwfHbjtSVG0W3RZPjJXYiJYfIaYrYAJ/EISp4HkEI/9NENa08qJuA==
\`\`\`

## API Routes

The following API routes are now connected to Supabase:

### Trades API
- `GET /api/trades` - Get user's trades with filtering and pagination
- `POST /api/trades` - Create a new trade
- `GET /api/trades/[id]` - Get specific trade
- `PUT /api/trades/[id]` - Update specific trade
- `DELETE /api/trades/[id]` - Delete specific trade

### Profiles API
- `GET /api/profiles` - Get user's profile
- `POST /api/profiles` - Create/update user profile

## Row Level Security (RLS)

All tables have Row Level Security enabled, ensuring users can only access their own data:
- Users can only view/modify their own trades
- Users can only view/modify their own profile
- Users can only view/modify their own tags

## Testing the Setup

1. **Start the development server**:
   \`\`\`bash
   cd frontend
   npm run dev
   \`\`\`

2. **Create a test account**:
   - Go to http://localhost:3000
   - Click "Sign Up" and create an account
   - You should be redirected to the dashboard

3. **Test trade creation**:
   - Navigate to "Add Trade" in the sidebar
   - Fill out the trade form and submit
   - Check that the trade appears in your trade history

## Deployment to Vercel

For deployment, make sure to set the environment variables in your Vercel project settings:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add the same environment variables from your `.env.local` file

The application is now ready for deployment with all Vercel compatibility issues resolved!
