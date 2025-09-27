import { spawnSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface SeedResult {
  email: string;
  password: string;
  userId: string;
}

/**
 * Seeds a test user and returns the result
 * Uses spawnSync to run the seed script and parse the output
 */
export function seedE2EUser(): SeedResult {
  const seedScript = join(__dirname, '../../../scripts/e2e.seed.ts');
  
  console.log('🌱 Seeding E2E test user...');
  
  const result = spawnSync('node', ['--loader', 'ts-node/esm', seedScript], {
    cwd: join(__dirname, '../../..'),
    encoding: 'utf8',
    stdio: 'pipe',
    env: { ...process.env, NODE_OPTIONS: '--loader ts-node/esm' }
  });

  if (result.error) {
    throw new Error(`Failed to run seed script: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`Seed script failed with status ${result.status}: ${result.stderr}`);
  }

  // Parse the output to extract the JSON result
  const output = result.stdout;
  const startMarker = 'SEED_RESULT_START';
  const endMarker = 'SEED_RESULT_END';
  
  const startIndex = output.indexOf(startMarker);
  const endIndex = output.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Could not find seed result markers in output');
  }
  
  const jsonOutput = output.substring(startIndex + startMarker.length, endIndex).trim();
  
  try {
    const seedResult = JSON.parse(jsonOutput) as SeedResult;
    console.log('✅ E2E test user seeded successfully');
    return seedResult;
  } catch (error) {
    throw new Error(`Failed to parse seed result: ${error}`);
  }
}

/**
 * Alternative method using temp file
 * Writes seed result to a temp file for tests to read
 */
export function seedE2EUserWithTempFile(): SeedResult {
  const tempFile = join(__dirname, '../../.tmp/e2e-user.json');
  
  console.log('🌱 Seeding E2E test user (temp file method)...');
  
  const result = spawnSync('node', ['--loader', 'ts-node/esm', 'scripts/e2e.seed.ts'], {
    cwd: join(__dirname, '../../..'),
    encoding: 'utf8',
    stdio: 'pipe',
    env: { ...process.env, NODE_OPTIONS: '--loader ts-node/esm' }
  });

  if (result.error) {
    throw new Error(`Failed to run seed script: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`Seed script failed with status ${result.status}: ${result.stderr}`);
  }

  // Parse the output to extract the JSON result
  const output = result.stdout;
  const startMarker = 'SEED_RESULT_START';
  const endMarker = 'SEED_RESULT_END';
  
  const startIndex = output.indexOf(startMarker);
  const endIndex = output.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Could not find seed result markers in output');
  }
  
  const jsonOutput = output.substring(startIndex + startMarker.length, endIndex).trim();
  
  try {
    const seedResult = JSON.parse(jsonOutput) as SeedResult;
    
    // Write to temp file for other processes to read
    writeFileSync(tempFile, JSON.stringify(seedResult, null, 2));
    console.log(`✅ E2E test user seeded and written to ${tempFile}`);
    
    return seedResult;
  } catch (error) {
    throw new Error(`Failed to parse seed result: ${error}`);
  }
}

/**
 * Reads seed result from temp file
 */
export function readSeedResultFromTempFile(): SeedResult {
  const tempFile = join(__dirname, '../../.tmp/e2e-user.json');
  
  if (!existsSync(tempFile)) {
    throw new Error(`Temp file not found: ${tempFile}`);
  }
  
  try {
    const content = readFileSync(tempFile, 'utf8');
    return JSON.parse(content) as SeedResult;
  } catch (error) {
    throw new Error(`Failed to read seed result from temp file: ${error}`);
  }
}

/**
 * Teardown E2E test user
 * Re-exports the teardown function from the original script
 */
export async function teardownE2EUser(options: { userId?: string; email?: string; deleteAll?: boolean }): Promise<void> {
  const { spawnSync } = require('child_process');
  const teardownScript = join(__dirname, '../../../scripts/e2e.teardown.ts');
  
  console.log('🧹 Cleaning up E2E test user...');
  
  let args = ['ts-node', '--transpile-only', teardownScript];
  
  if (options.deleteAll) {
    args.push('--all');
  } else if (options.userId) {
    args.push(options.userId);
  } else if (options.email) {
    args.push(options.email);
  } else {
    throw new Error('Must provide userId, email, or deleteAll option');
  }
  
  const result = spawnSync('node', ['--loader', 'ts-node/esm', ...args.slice(1)], {
    cwd: join(__dirname, '../../..'),
    encoding: 'utf8',
    stdio: 'pipe',
    env: { ...process.env, NODE_OPTIONS: '--loader ts-node/esm' }
  });

  if (result.error) {
    throw new Error(`Failed to run teardown script: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`Teardown script failed with status ${result.status}: ${result.stderr}`);
  }

  console.log('✅ E2E test user cleaned up successfully');
}
