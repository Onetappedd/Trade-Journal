#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying all fixes are in place...\n');

// Check 1: Analytics page import
const analyticsPagePath = path.join(__dirname, 'app/analytics/page.tsx');
const analyticsContent = fs.readFileSync(analyticsPagePath, 'utf8');
if (analyticsContent.includes('import { AnalyticsPage }')) {
  console.log('✅ Analytics page import is correct (named import)');
} else {
  console.log('❌ Analytics page import is incorrect');
}

// Check 2: ProfileSettings AlertDialog import
const profileSettingsPath = path.join(__dirname, 'components/settings/ProfileSettings.tsx');
const profileContent = fs.readFileSync(profileSettingsPath, 'utf8');
if (profileContent.includes('from "@/components/ui/alert-dialog"')) {
  console.log('✅ ProfileSettings AlertDialog import is correct');
} else {
  console.log('❌ ProfileSettings AlertDialog import is incorrect');
}

// Check 3: Analytics component export
const analyticsComponentPath = path.join(__dirname, 'components/analytics-page.tsx');
const analyticsComponentContent = fs.readFileSync(analyticsComponentPath, 'utf8');
if (analyticsComponentContent.includes('export function AnalyticsPage')) {
  console.log('✅ AnalyticsPage component export is correct');
} else {
  console.log('❌ AnalyticsPage component export is incorrect');
}

// Check 4: PieChart percent handling
if (analyticsComponentContent.includes('percent ? (percent * 100).toFixed(0) : 0')) {
  console.log('✅ PieChart percent handling is safe');
} else {
  console.log('❌ PieChart percent handling needs fixing');
}

console.log('\n🎉 Verification complete!');
