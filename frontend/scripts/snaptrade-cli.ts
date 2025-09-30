/**
 * SnapTrade CLI - Quick Testing Tool
 * 
 * Usage:
 *   npm run snaptrade:register <userId>
 *   npm run snaptrade:portal <userId>
 *   npm run snaptrade:sync <userId>
 *   npm run snaptrade:connections <userId>
 *   npm run snaptrade:accounts <userId>
 *   npm run snaptrade:positions <userId> <accountId>
 *   npm run snaptrade:snapshot <userId>
 */

import { snaptrade } from '../lib/snaptrade';
import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

// Environment check
if (!process.env.SNAPTRADE_CLIENT_ID || !process.env.SNAPTRADE_CONSUMER_KEY) {
  console.error('❌ Missing SnapTrade credentials. Set SNAPTRADE_CLIENT_ID and SNAPTRADE_CONSUMER_KEY');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse CLI arguments
const command = process.argv[2];
const userId = process.argv[3];
const arg2 = process.argv[4];

// Helper: Get or create SnapTrade user
async function getOrCreateSnapTradeUser(riskrUserId: string) {
  // Check if user already registered
  const { data: existing } = await supabase
    .from('snaptrade_users')
    .select('st_user_id, st_user_secret')
    .eq('user_id', riskrUserId)
    .single();

  if (existing) {
    return {
      userId: existing.st_user_id,
      userSecret: existing.st_user_secret,
      created: false
    };
  }

  // Register new SnapTrade user
  console.log('🔄 Registering new SnapTrade user...');
  const stUserId = `riskr_${riskrUserId}`;
  
  const response = await snaptrade.authentication.registerSnapTradeUser({
    userId: stUserId
  });

  // Store in database
  await supabase.from('snaptrade_users').insert({
    user_id: riskrUserId,
    st_user_id: response.data.userId,
    st_user_secret: response.data.userSecret
  });

  return {
    userId: response.data.userId,
    userSecret: response.data.userSecret,
    created: true
  };
}

// Command: Register user
async function registerUser(riskrUserId: string) {
  console.log(`📝 Registering user: ${riskrUserId}`);
  
  try {
    const result = await getOrCreateSnapTradeUser(riskrUserId);
    
    if (result.created) {
      console.log('✅ User registered successfully!');
    } else {
      console.log('✅ User already registered');
    }
    
    console.log(`\nSnapTrade User ID: ${result.userId}`);
    console.log(`User Secret: ${result.userSecret.substring(0, 20)}...`);
  } catch (error: any) {
    console.error('❌ Registration failed:', error.message);
    process.exit(1);
  }
}

// Command: Generate portal URL
async function generatePortalUrl(riskrUserId: string) {
  console.log(`🔗 Generating connection portal URL for: ${riskrUserId}`);
  
  try {
    const user = await getOrCreateSnapTradeUser(riskrUserId);
    
    const response = await snaptrade.authentication.loginSnapTradeUser({
      userId: user.userId,
      userSecret: user.userSecret,
      // Optional: pre-select broker
      // broker: 'ROBINHOOD',
      connectionType: 'read'
    });

    const url = response.data.redirectURI;
    
    console.log('\n✅ Portal URL generated (expires in 5 minutes):\n');
    console.log(`   ${url}\n`);
    console.log('📋 Opening in browser...');
    
    // Open in browser
    const open = await import('open');
    await open.default(url);
    
    console.log('\n💡 After connecting, run: npm run snaptrade:sync', riskrUserId);
  } catch (error: any) {
    console.error('❌ Failed to generate portal URL:', error.message);
    process.exit(1);
  }
}

// Command: Sync connections & accounts
async function syncUser(riskrUserId: string) {
  console.log(`🔄 Syncing connections for: ${riskrUserId}`);
  
  try {
    const { data: user } = await supabase
      .from('snaptrade_users')
      .select('st_user_id, st_user_secret')
      .eq('user_id', riskrUserId)
      .single();

    if (!user) {
      console.error('❌ User not registered. Run: npm run snaptrade:register', riskrUserId);
      process.exit(1);
    }

    // Fetch connections
    const connectionsResponse = await snaptrade.connections.listBrokerageAuthorizations({
      userId: user.st_user_id,
      userSecret: user.st_user_secret
    });
    const connections = connectionsResponse.data;

    console.log(`\n✅ Found ${connections.length} connection(s):\n`);

    for (const conn of connections) {
      console.log(`   • ${conn.brokerage?.name || 'Unknown'}`);
      console.log(`     ID: ${conn.id}`);
      console.log(`     Status: ${conn.disabled ? '❌ Disabled' : '✅ Active'}`);
      
      // Store in database
      await supabase.from('snaptrade_connections').upsert({
        user_id: riskrUserId,
        authorization_id: conn.id,
        broker_slug: conn.brokerage?.slug || '',
        disabled: !!conn.disabled
      }, { onConflict: 'user_id,authorization_id' });
    }

    // Fetch accounts
    const accountsResponse = await snaptrade.accountInformation.listUserAccounts({
      userId: user.st_user_id,
      userSecret: user.st_user_secret
    });
    const accounts = accountsResponse.data;

    console.log(`\n✅ Found ${accounts.length} account(s):\n`);

    for (const acc of accounts) {
      console.log(`   • ${acc.name || 'Unknown'} (${acc.number || 'N/A'})`);
      console.log(`     ID: ${acc.id}`);
      console.log(`     Balance: $${acc.balance?.total?.amount?.toLocaleString() || '0'}`);
      console.log(`     Last Sync: ${acc.sync_status?.holdings?.last_successful_sync || 'Never'}`);
      
      // Store in database
      await supabase.from('snaptrade_accounts').upsert({
        account_id: acc.id,
        user_id: riskrUserId,
        authorization_id: acc.brokerage_authorization,
        name: acc.name,
        number: acc.number,
        institution_name: acc.institution_name,
        total_value: acc.balance?.total?.amount || null,
        currency: acc.balance?.total?.currency || null,
        last_successful_holdings_sync: acc.sync_status?.holdings?.last_successful_sync || null
      }, { onConflict: 'account_id' });

      // Update connection sync time
      if (acc.sync_status?.holdings?.last_successful_sync) {
        await supabase.rpc('set_connection_last_sync', {
          p_user_id: riskrUserId,
          p_auth_id: acc.brokerage_authorization,
          p_sync_time: acc.sync_status.holdings.last_successful_sync
        });
      }
    }

    console.log('\n✅ Sync complete!');
    console.log('\n💡 Next: npm run snaptrade:accounts', riskrUserId);
  } catch (error: any) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Command: List connections
async function listConnections(riskrUserId: string) {
  console.log(`📋 Listing connections for: ${riskrUserId}`);
  
  try {
    const { data: connections } = await supabase
      .from('snaptrade_connections')
      .select('*')
      .eq('user_id', riskrUserId);

    if (!connections || connections.length === 0) {
      console.log('❌ No connections found. Run: npm run snaptrade:portal', riskrUserId);
      process.exit(0);
    }

    console.log(`\n✅ Found ${connections.length} connection(s):\n`);

    for (const conn of connections) {
      console.log(`   • ${conn.broker_slug}`);
      console.log(`     Authorization ID: ${conn.authorization_id}`);
      console.log(`     Status: ${conn.disabled ? '❌ Disabled' : '✅ Active'}`);
      console.log(`     Last Sync: ${conn.last_holdings_sync_at || 'Never'}`);
      console.log('');
    }
  } catch (error: any) {
    console.error('❌ Failed to list connections:', error.message);
    process.exit(1);
  }
}

// Command: List accounts
async function listAccounts(riskrUserId: string) {
  console.log(`📋 Listing accounts for: ${riskrUserId}`);
  
  try {
    const { data: accounts } = await supabase
      .from('snaptrade_accounts')
      .select('*')
      .eq('user_id', riskrUserId);

    if (!accounts || accounts.length === 0) {
      console.log('❌ No accounts found. Run: npm run snaptrade:sync', riskrUserId);
      process.exit(0);
    }

    console.log(`\n✅ Found ${accounts.length} account(s):\n`);

    let totalValue = 0;

    for (const acc of accounts) {
      console.log(`   • ${acc.name} (${acc.institution_name || 'Unknown'})`);
      console.log(`     Account ID: ${acc.account_id}`);
      console.log(`     Number: ${acc.number || 'N/A'}`);
      console.log(`     Balance: $${(acc.total_value || 0).toLocaleString()}`);
      console.log(`     Currency: ${acc.currency || 'USD'}`);
      console.log(`     Last Sync: ${acc.last_successful_holdings_sync || 'Never'}`);
      console.log('');
      
      totalValue += acc.total_value || 0;
    }

    console.log(`💰 Total Portfolio Value: $${totalValue.toLocaleString()}\n`);
    console.log('💡 View positions: npm run snaptrade:positions', riskrUserId, '<accountId>');
  } catch (error: any) {
    console.error('❌ Failed to list accounts:', error.message);
    process.exit(1);
  }
}

// Command: List positions
async function listPositions(riskrUserId: string, accountId: string) {
  console.log(`📊 Fetching positions for account: ${accountId}`);
  
  try {
    const { data: user } = await supabase
      .from('snaptrade_users')
      .select('st_user_id, st_user_secret')
      .eq('user_id', riskrUserId)
      .single();

    if (!user) {
      console.error('❌ User not registered');
      process.exit(1);
    }

    const response = await snaptrade.accountInformation.getUserAccountPositions({
      userId: user.st_user_id,
      userSecret: user.st_user_secret,
      accountId
    });

    const positions = response.data;

    if (!positions || positions.length === 0) {
      console.log('❌ No positions found');
      process.exit(0);
    }

    console.log(`\n✅ Found ${positions.length} position(s):\n`);

    for (const pos of positions) {
      const pnl = (pos.market_value || 0) - ((pos.average_price || 0) * (pos.quantity || 0));
      const pnlPercent = pos.average_price ? ((pnl / ((pos.average_price || 0) * (pos.quantity || 0))) * 100) : 0;

      console.log(`   ${pos.symbol?.symbol || 'Unknown'}`);
      console.log(`     Name: ${pos.symbol?.name || 'N/A'}`);
      console.log(`     Type: ${pos.symbol?.asset_type || 'Unknown'}`);
      console.log(`     Quantity: ${pos.quantity || 0}`);
      console.log(`     Avg Price: $${pos.average_price?.toFixed(2) || '0.00'}`);
      console.log(`     Market Value: $${(pos.market_value || 0).toLocaleString()}`);
      console.log(`     P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);
      console.log('');
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch positions:', error.message);
    process.exit(1);
  }
}

// Command: Take snapshot
async function takeSnapshot(riskrUserId: string) {
  console.log(`📸 Taking account snapshot for: ${riskrUserId}`);
  
  try {
    await supabase.rpc('take_account_snapshot', {
      p_user_id: riskrUserId
    });

    // Get the snapshot
    const { data: snapshot } = await supabase
      .from('account_value_snapshots')
      .select('*')
      .eq('user_id', riskrUserId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    if (snapshot) {
      console.log('\n✅ Snapshot taken successfully!');
      console.log(`   Date: ${snapshot.snapshot_date}`);
      console.log(`   Total Value: $${snapshot.total_value.toLocaleString()}`);
      console.log(`   Accounts: ${snapshot.account_count}`);
    }
  } catch (error: any) {
    console.error('❌ Failed to take snapshot:', error.message);
    process.exit(1);
  }
}

// Main CLI router
async function main() {
  console.log('🚀 SnapTrade CLI\n');

  if (!command) {
    printUsage();
    process.exit(0);
  }

  switch (command) {
    case 'register':
      if (!userId) {
        console.error('❌ Missing userId argument');
        printUsage();
        process.exit(1);
      }
      await registerUser(userId);
      break;

    case 'portal':
      if (!userId) {
        console.error('❌ Missing userId argument');
        printUsage();
        process.exit(1);
      }
      await generatePortalUrl(userId);
      break;

    case 'sync':
      if (!userId) {
        console.error('❌ Missing userId argument');
        printUsage();
        process.exit(1);
      }
      await syncUser(userId);
      break;

    case 'connections':
      if (!userId) {
        console.error('❌ Missing userId argument');
        printUsage();
        process.exit(1);
      }
      await listConnections(userId);
      break;

    case 'accounts':
      if (!userId) {
        console.error('❌ Missing userId argument');
        printUsage();
        process.exit(1);
      }
      await listAccounts(userId);
      break;

    case 'positions':
      if (!userId || !arg2) {
        console.error('❌ Missing userId or accountId argument');
        printUsage();
        process.exit(1);
      }
      await listPositions(userId, arg2);
      break;

    case 'snapshot':
      if (!userId) {
        console.error('❌ Missing userId argument');
        printUsage();
        process.exit(1);
      }
      await takeSnapshot(userId);
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

function printUsage() {
  console.log(`
Usage:
  npm run snaptrade:register <userId>            Register SnapTrade user
  npm run snaptrade:portal <userId>              Open connection portal
  npm run snaptrade:sync <userId>                Sync connections & accounts
  npm run snaptrade:connections <userId>         List connections
  npm run snaptrade:accounts <userId>            List accounts
  npm run snaptrade:positions <userId> <accId>   List positions
  npm run snaptrade:snapshot <userId>            Take account snapshot

Examples:
  npm run snaptrade:register abc-123-def
  npm run snaptrade:portal abc-123-def
  npm run snaptrade:sync abc-123-def
  npm run snaptrade:accounts abc-123-def
  `);
}

// Run CLI
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
