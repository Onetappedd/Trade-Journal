import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  encryptJSON,
  decryptJSON,
  encryptString,
  decryptString,
  encryptForStorage,
  decryptFromStorage,
  isEncryptionConfigured,
  getEncryptionStatus,
} from '../../../lib/crypto/secure';

// Mock environment variables
const mockEncryptionKey = 'this-is-a-32-character-encryption-key-123';

describe('Crypto Secure Utils', () => {
  beforeEach(() => {
    // Reset environment variables before each test
    vi.resetModules();
    
    // Mock the environment variable
    process.env.ENCRYPTION_KEY = mockEncryptionKey;
  });

  describe('Configuration', () => {
    it('should detect when encryption is properly configured', () => {
      expect(isEncryptionConfigured()).toBe(true);
    });

    it('should return correct encryption status', () => {
      const status = getEncryptionStatus();
      expect(status.configured).toBe(true);
      expect(status.keyLength).toBe(mockEncryptionKey.length);
      expect(status.hasKey).toBe(true);
    });

    it('should throw error when ENCRYPTION_KEY is missing', async () => {
      delete process.env.ENCRYPTION_KEY;
      
      // Re-import the module to trigger the validation
      await expect(async () => {
        await import('../../../lib/crypto/secure');
      }).rejects.toThrow('ENCRYPTION_KEY environment variable is required');
    });

    it('should throw error when ENCRYPTION_KEY is too short', async () => {
      process.env.ENCRYPTION_KEY = 'short';
      
      await expect(async () => {
        await import('../../../lib/crypto/secure');
      }).rejects.toThrow('ENCRYPTION_KEY must be at least 32 characters long');
    });
  });

  describe('JSON Encryption/Decryption', () => {
    it('should encrypt and decrypt a simple object', async () => {
      const original = { name: 'John Doe', age: 30, active: true };
      
      const encrypted = await encryptJSON(original);
      const decrypted = await decryptJSON<typeof original>(encrypted);
      
      expect(decrypted).toEqual(original);
    });

    it('should encrypt and decrypt complex nested objects', async () => {
      const original = {
        user: {
          id: '123',
          profile: {
            name: 'Jane Smith',
            preferences: {
              theme: 'dark',
              notifications: true,
              settings: {
                language: 'en',
                timezone: 'UTC'
              }
            }
          }
        },
        metadata: {
          createdAt: '2024-01-01T00:00:00Z',
          version: 1.0
        }
      };
      
      const encrypted = await encryptJSON(original);
      const decrypted = await decryptJSON<typeof original>(encrypted);
      
      expect(decrypted).toEqual(original);
    });

    it('should encrypt and decrypt arrays', async () => {
      const original = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ];
      
      const encrypted = await encryptJSON(original);
      const decrypted = await decryptJSON<typeof original>(encrypted);
      
      expect(decrypted).toEqual(original);
    });

    it('should encrypt and decrypt primitive values', async () => {
      const testCases = [
        'simple string',
        42,
        3.14159,
        true,
        false,
        null
      ];
      
      for (const value of testCases) {
        const encrypted = await encryptJSON(value);
        const decrypted = await decryptJSON<typeof value>(encrypted);
        expect(decrypted).toEqual(value);
      }
    });

    it('should produce different encrypted strings for the same input', async () => {
      const original = { message: 'Hello World' };
      
      const encrypted1 = await encryptJSON(original);
      const encrypted2 = await encryptJSON(original);
      
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to the same value
      const decrypted1 = await decryptJSON<typeof original>(encrypted1);
      const decrypted2 = await decryptJSON<typeof original>(encrypted2);
      
      expect(decrypted1).toEqual(original);
      expect(decrypted2).toEqual(original);
    });

    it('should handle empty objects and arrays', async () => {
      const emptyObject = {};
      const emptyArray: any[] = [];
      
      const encryptedObject = await encryptJSON(emptyObject);
      const encryptedArray = await encryptJSON(emptyArray);
      
      const decryptedObject = await decryptJSON<typeof emptyObject>(encryptedObject);
      const decryptedArray = await decryptJSON<typeof emptyArray>(encryptedArray);
      
      expect(decryptedObject).toEqual(emptyObject);
      expect(decryptedArray).toEqual(emptyArray);
    });
  });

  describe('String Encryption/Decryption', () => {
    it('should encrypt and decrypt simple strings', async () => {
      const original = 'Hello, World!';
      
      const encrypted = await encryptString(original);
      const decrypted = await decryptString(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('should encrypt and decrypt empty strings', async () => {
      const original = '';
      
      const encrypted = await encryptString(original);
      const decrypted = await decryptString(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('should encrypt and decrypt long strings', async () => {
      const original = 'A'.repeat(1000);
      
      const encrypted = await encryptString(original);
      const decrypted = await decryptString(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('should encrypt and decrypt strings with special characters', async () => {
      const original = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\';
      
      const encrypted = await encryptString(original);
      const decrypted = await decryptString(encrypted);
      
      expect(decrypted).toBe(original);
    });

    it('should encrypt and decrypt unicode strings', async () => {
      const original = 'Unicode: 🚀🌟🎉 中文 Español Français';
      
      const encrypted = await encryptString(original);
      const decrypted = await decryptString(encrypted);
      
      expect(decrypted).toBe(original);
    });
  });

  describe('Storage Encryption/Decryption', () => {
    it('should encrypt and decrypt data for storage', async () => {
      const original = {
        accessToken: 'secret-token-123',
        refreshToken: 'refresh-token-456',
        expiresAt: '2024-12-31T23:59:59Z'
      };
      
      const encrypted = await encryptForStorage(original);
      const decrypted = await decryptFromStorage<typeof original>(encrypted);
      
      expect(decrypted).toEqual(original);
    });

    it('should handle sensitive broker data', async () => {
      const original = {
        broker: 'td_ameritrade',
        accountId: '123456789',
        credentials: {
          accessToken: 'access-token-here',
          refreshToken: 'refresh-token-here',
          expiresAt: '2024-12-31T23:59:59Z'
        }
      };
      
      const encrypted = await encryptForStorage(original);
      const decrypted = await decryptFromStorage<typeof original>(encrypted);
      
      expect(decrypted).toEqual(original);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when decrypting invalid data', async () => {
      await expect(decryptJSON('invalid-base64')).rejects.toThrow('Decryption failed');
    });

    it('should throw error when decrypting tampered data', async () => {
      const original = { message: 'Hello' };
      const encrypted = await encryptJSON(original);
      
      // Tamper with the encrypted data
      const tampered = encrypted.slice(1);
      
      await expect(decryptJSON(tampered)).rejects.toThrow('Decryption failed');
    });

    it('should throw error when decrypting empty string', async () => {
      await expect(decryptJSON('')).rejects.toThrow('Decryption failed');
    });

    it('should throw error when decrypting string with wrong format', async () => {
      await expect(decryptJSON('not-base64-format')).rejects.toThrow('Decryption failed');
    });
  });

  describe('Performance', () => {
    it('should handle multiple encryption/decryption operations', async () => {
      const data = { id: 1, message: 'Test message' };
      const operations = Array.from({ length: 100 }, () => data);
      
      const start = Date.now();
      
      for (const item of operations) {
        const encrypted = await encryptJSON(item);
        const decrypted = await decryptJSON<typeof item>(encrypted);
        expect(decrypted).toEqual(item);
      }
      
      const end = Date.now();
      const duration = end - start;
      
      // Should complete 100 operations in reasonable time (less than 5 seconds)
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Type Safety', () => {
    it('should preserve TypeScript types through encryption/decryption', async () => {
      interface User {
        id: string;
        name: string;
        age: number;
        isActive: boolean;
      }
      
      const user: User = {
        id: '123',
        name: 'John Doe',
        age: 30,
        isActive: true
      };
      
      const encrypted = await encryptJSON(user);
      const decrypted = await decryptJSON<User>(encrypted);
      
      // TypeScript should infer the correct type
      expect(decrypted.id).toBe('123');
      expect(decrypted.name).toBe('John Doe');
      expect(decrypted.age).toBe(30);
      expect(decrypted.isActive).toBe(true);
    });
  });
});
