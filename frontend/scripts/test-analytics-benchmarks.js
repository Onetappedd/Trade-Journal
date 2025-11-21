#!/usr/bin/env node

/**
 * Test script to verify benchmarks are included in analytics API
 */

const https = require('https');

// You'll need to get a valid session token from the browser
// For now, this is a placeholder - you'll need to authenticate first
const SESSION_TOKEN = process.env.SESSION_TOKEN || 'YOUR_SESSION_TOKEN_HERE';

if (SESSION_TOKEN === 'YOUR_SESSION_TOKEN_HERE') {
  console.log('⚠️  Please set SESSION_TOKEN environment variable');
  console.log('   Get it from browser DevTools > Application > Cookies > sb-<project>-auth-token');
  process.exit(1);
}

const URL = 'https://www.riskr.net/api/analytics/combined';

console.log('🔄 Testing analytics API with benchmarks...');
console.log(`URL: ${URL}`);

const options = {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${SESSION_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(URL, options, (res) => {
  console.log(`\n📊 Status Code: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      
      if (json.success && json.data) {
        console.log('\n✅ Analytics API Response:');
        console.log(`   Has benchmarks: ${!!json.data.benchmarks}`);
        
        if (json.data.benchmarks) {
          const benchmarks = json.data.benchmarks;
          console.log(`   SPY data points: ${benchmarks.equityCurveSPY?.length || 0}`);
          console.log(`   QQQ data points: ${benchmarks.equityCurveQQQ?.length || 0}`);
          
          if (benchmarks.equityCurveSPY && benchmarks.equityCurveSPY.length > 0) {
            console.log(`   SPY first point:`, benchmarks.equityCurveSPY[0]);
            console.log(`   SPY last point:`, benchmarks.equityCurveSPY[benchmarks.equityCurveSPY.length - 1]);
          }
          
          if (benchmarks.equityCurveQQQ && benchmarks.equityCurveQQQ.length > 0) {
            console.log(`   QQQ first point:`, benchmarks.equityCurveQQQ[0]);
            console.log(`   QQQ last point:`, benchmarks.equityCurveQQQ[benchmarks.equityCurveQQQ.length - 1]);
          }
        } else {
          console.log('   ⚠️  No benchmarks found in response');
        }
      } else {
        console.log('\n❌ Analytics API Error:', json.error || json);
        console.log('\n📄 Full response:');
        console.log(JSON.stringify(json, null, 2));
      }
    } catch (e) {
      console.log('\n📄 Raw response:');
      console.log(data.substring(0, 1000));
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request error:', error);
});

req.end();

