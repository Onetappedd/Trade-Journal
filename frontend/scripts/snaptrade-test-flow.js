/**
 * SnapTrade Complete Test Flow
 * 
 * Runs through the entire SnapTrade integration flow:
 * 1. Register user
 * 2. Open connection portal
 * 3. Wait for user to connect broker
 * 4. Sync connections & accounts
 * 5. Display results
 * 
 * Usage: npm run snaptrade:test-flow
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log('🚀 SnapTrade Integration Test Flow\n');
  console.log('This script will walk you through testing the complete SnapTrade integration.\n');

  // Get user ID
  const userId = await ask('Enter a test user ID (UUID format, or press Enter for demo): ');
  const testUserId = userId.trim() || 'test-user-' + Date.now();

  console.log(`\n✅ Using user ID: ${testUserId}\n`);

  console.log('📝 Step 1: Register SnapTrade user');
  console.log(`   Run: npm run snaptrade:register ${testUserId}\n`);

  await ask('Press Enter when ready to continue...');

  console.log('\n🔗 Step 2: Open connection portal');
  console.log(`   Run: npm run snaptrade:portal ${testUserId}`);
  console.log('   This will open your browser to connect a broker.');
  console.log('   Use SnapTrade sandbox credentials if testing.\n');

  await ask('Press Enter when ready to open portal...');

  console.log('\n⏳ Waiting for broker connection...');
  console.log('   Complete the broker authentication in your browser.');
  console.log('   This may take 1-2 minutes.\n');

  await ask('Press Enter after you\'ve connected your broker...');

  console.log('\n🔄 Step 3: Sync connections & accounts');
  console.log(`   Run: npm run snaptrade:sync ${testUserId}\n`);

  await ask('Press Enter when ready to sync...');

  console.log('\n📋 Step 4: View connections');
  console.log(`   Run: npm run snaptrade:connections ${testUserId}\n`);

  await ask('Press Enter to view connections...');

  console.log('\n💰 Step 5: View accounts');
  console.log(`   Run: npm run snaptrade:accounts ${testUserId}\n`);

  await ask('Press Enter to view accounts...');

  console.log('\n📊 Step 6: View positions');
  console.log('   First, get an account ID from the previous step.');
  const accountId = await ask('   Enter account ID (or skip): ');

  if (accountId.trim()) {
    console.log(`\n   Run: npm run snaptrade:positions ${testUserId} ${accountId.trim()}\n`);
    await ask('Press Enter to view positions...');
  }

  console.log('\n📸 Step 7: Take account snapshot');
  console.log(`   Run: npm run snaptrade:snapshot ${testUserId}\n`);

  await ask('Press Enter to take snapshot...');

  console.log('\n✅ Test flow complete!\n');
  console.log('Next steps:');
  console.log('  1. Test the Broker-Verified badge in UI');
  console.log('  2. View analytics dashboard');
  console.log('  3. Test manual refresh button');
  console.log('  4. Verify webhook processing\n');

  console.log('Useful commands:');
  console.log(`  npm run snaptrade:connections ${testUserId}`);
  console.log(`  npm run snaptrade:accounts ${testUserId}`);
  console.log(`  npm run snaptrade:sync ${testUserId}`);
  console.log(`  npm run snaptrade:snapshot ${testUserId}\n`);

  rl.close();
}

main().catch(console.error);
