#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔍 Checking TypeScript types...');

try {
  // Run TypeScript compiler check
  execSync('npx tsc --noEmit', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ TypeScript check passed!');
} catch (error) {
  console.error('❌ TypeScript check failed');
  process.exit(1);
}

try {
  // Run Next.js lint
  execSync('npx next lint', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ ESLint check passed!');
} catch (error) {
  console.error('❌ ESLint check failed');
  process.exit(1);
}

console.log('🎉 All checks passed! Ready for build.');