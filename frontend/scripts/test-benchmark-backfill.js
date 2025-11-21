#!/usr/bin/env node

/**
 * Test script to trigger benchmark backfill and verify it works
 */

const https = require('https');

const CRON_SECRET = '1c71a9060d45526f015ad1ec19adb2489313d66f30901b28c12399239fc020e8';
const URL = 'https://www.riskr.net/api/cron/benchmarks?backfill=true';

console.log('🔄 Triggering benchmark backfill...');
console.log(`URL: ${URL}`);

const options = {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${CRON_SECRET}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(URL, options, (res) => {
  console.log(`\n📊 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('\n✅ Response:');
      console.log(JSON.stringify(json, null, 2));
      
      if (json.success) {
        console.log('\n🎉 Backfill successful!');
        console.log(`   Mode: ${json.mode}`);
        console.log(`   Total rows: ${json.totalRows}`);
        if (json.results) {
          json.results.forEach(r => {
            console.log(`   ${r.symbol}: ${r.count} rows`);
          });
        }
      } else {
        console.log('\n❌ Backfill failed:', json.error || json);
      }
    } catch (e) {
      console.log('\n📄 Raw response:');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request error:', error);
});

req.end();

