#!/usr/bin/env node

// Check exact table structure for existing tables
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTableStructure() {
  console.log('🔍 Checking Table Structure in Detail...\n')

  // Check trades table structure
  console.log('📊 TRADES TABLE STRUCTURE:')
  console.log('==========================')
  
  try {
    // Try to insert a test record to see what columns are expected
    const testTrade = {
      symbol: 'TEST',
      asset_type: 'stock',
      side: 'buy',
      quantity: 1,
      entry_price: 100,
      entry_date: '2024-01-01',
      status: 'open'
    }

    const { data, error } = await supabase
      .from('trades')
      .insert(testTrade)
      .select()

    if (error) {
      console.log('❌ Error inserting test trade:', error.message)
      console.log('📋 This tells us about the table structure requirements')
      
      // Try to get column info from the error or by querying system tables
      if (error.message.includes('column') || error.message.includes('null')) {
        console.log('🔍 The error suggests missing required columns or constraints')
      }
    } else {
      console.log('✅ Test trade inserted successfully!')
      console.log('📋 Columns found:', Object.keys(data[0]))
      
      // Clean up test data
      await supabase.from('trades').delete().eq('symbol', 'TEST')
      console.log('🧹 Test data cleaned up')
    }
  } catch (err) {
    console.log('❌ Unexpected error:', err.message)
  }

  console.log('\n📊 PROFILES TABLE STRUCTURE:')
  console.log('=============================')
  
  try {
    // Check if we can query the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (error) {
      console.log('❌ Error querying profiles:', error.message)
    } else {
      console.log('✅ Profiles table accessible')
      if (data && data.length > 0) {
        console.log('📋 Columns found:', Object.keys(data[0]))
      } else {
        console.log('📝 Table is empty - will try to determine structure')
      }
    }
  } catch (err) {
    console.log('❌ Unexpected error:', err.message)
  }

  // Check what happens when we try to access user info
  console.log('\n👤 USER AUTHENTICATION CHECK:')
  console.log('==============================')
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('❌ Auth error:', error.message)
      console.log('ℹ️  This is expected - we\'re not logged in from this script')
    } else if (user) {
      console.log('✅ User found:', user.email)
    } else {
      console.log('ℹ️  No user session (expected for this script)')
    }
  } catch (err) {
    console.log('ℹ️  Auth check not available from script context')
  }

  console.log('\n🎯 RECOMMENDED NEXT STEPS:')
  console.log('===========================')
  console.log('1. Create the missing watchlist table')
  console.log('2. Verify trades table has all required columns')
  console.log('3. Add some sample data to test the integration')
  console.log('4. Test the real data features')
}

checkTableStructure().catch(console.error)