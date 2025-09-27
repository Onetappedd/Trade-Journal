#!/usr/bin/env ts-node

import { seedE2EUser, teardownE2EUser } from './e2e.seed';

/**
 * E2E Test Helper
 * Provides utilities for managing test users in e2e tests
 */

export interface E2ETestUser {
  email: string;
  password: string;
  userId: string;
}

export class E2EUserManager {
  private static instance: E2EUserManager;
  private currentUser: E2ETestUser | null = null;

  static getInstance(): E2EUserManager {
    if (!E2EUserManager.instance) {
      E2EUserManager.instance = new E2EUserManager();
    }
    return E2EUserManager.instance;
  }

  /**
   * Create a new test user for e2e testing
   */
  async createTestUser(): Promise<E2ETestUser> {
    console.log('🌱 Creating new E2E test user...');
    
    const result = await seedE2EUser();
    this.currentUser = result;
    
    console.log('✅ E2E test user created:', result.email);
    return result;
  }

  /**
   * Get the current test user (creates one if none exists)
   */
  async getCurrentUser(): Promise<E2ETestUser> {
    if (!this.currentUser) {
      return await this.createTestUser();
    }
    return this.currentUser;
  }

  /**
   * Clean up the current test user
   */
  async cleanupCurrentUser(): Promise<void> {
    if (this.currentUser) {
      console.log('🧹 Cleaning up current E2E test user...');
      await teardownE2EUser({ userId: this.currentUser.userId });
      this.currentUser = null;
      console.log('✅ E2E test user cleaned up');
    }
  }

  /**
   * Clean up all e2e test users
   */
  async cleanupAllUsers(): Promise<void> {
    console.log('🧹 Cleaning up all E2E test users...');
    await teardownE2EUser({ deleteAll: true });
    this.currentUser = null;
    console.log('✅ All E2E test users cleaned up');
  }

  /**
   * Get user credentials for Playwright tests
   */
  getCredentials(): { email: string; password: string } | null {
    if (!this.currentUser) {
      return null;
    }
    return {
      email: this.currentUser.email,
      password: this.currentUser.password
    };
  }
}

// Export singleton instance
export const e2eUserManager = E2EUserManager.getInstance();

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const manager = E2EUserManager.getInstance();

  switch (command) {
    case 'create':
      manager.createTestUser()
        .then(user => {
          console.log('\n📤 Test user created:');
          console.log(JSON.stringify(user, null, 2));
          process.exit(0);
        })
        .catch(error => {
          console.error('❌ Failed to create test user:', error.message);
          process.exit(1);
        });
      break;

    case 'cleanup':
      manager.cleanupCurrentUser()
        .then(() => {
          console.log('✅ Cleanup completed');
          process.exit(0);
        })
        .catch(error => {
          console.error('❌ Cleanup failed:', error.message);
          process.exit(1);
        });
      break;

    case 'cleanup-all':
      manager.cleanupAllUsers()
        .then(() => {
          console.log('✅ All users cleaned up');
          process.exit(0);
        })
        .catch(error => {
          console.error('❌ Cleanup failed:', error.message);
          process.exit(1);
        });
      break;

    default:
      console.log('Usage:');
      console.log('  npm run e2e:helper -- create        # Create test user');
      console.log('  npm run e2e:helper -- cleanup       # Cleanup current user');
      console.log('  npm run e2e:helper -- cleanup-all   # Cleanup all users');
      process.exit(1);
  }
}
