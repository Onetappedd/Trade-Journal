/**
 * Secure encryption utilities using AES-GCM
 * 
 * Uses Node.js crypto module for AES-GCM encryption with:
 * - 256-bit key
 * - 96-bit (12-byte) random IV
 * - Authentication tag for integrity
 */

import crypto from 'crypto';

// Validate encryption key is available
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required for secure operations');
}

if (ENCRYPTION_KEY.length < 32) {
  throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
}

/**
 * Generate a random IV (Initialization Vector) for AES-GCM
 * AES-GCM requires a 96-bit (12-byte) IV
 */
function generateIV(): Buffer {
  return crypto.randomBytes(12);
}

/**
 * Encrypt a JSON object using AES-GCM
 * 
 * @param obj - The object to encrypt
 * @returns Base64-encoded encrypted string with IV prepended
 */
export async function encryptJSON<T>(obj: T): Promise<string> {
  try {
    const iv = generateIV();
    
    // Convert object to JSON string
    const jsonString = JSON.stringify(obj);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY!), iv);
    cipher.setAAD(Buffer.from(''));
    
    // Encrypt the data
    let encrypted = cipher.update(jsonString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the auth tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV, encrypted data, and auth tag
    const combined = Buffer.concat([iv, Buffer.from(encrypted, 'hex'), authTag]);
    
    // Convert to base64
    return combined.toString('base64');
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt a JSON object using AES-GCM
 * 
 * @param encryptedString - Base64-encoded encrypted string with IV prepended
 * @returns The decrypted object
 */
export async function decryptJSON<T>(encryptedString: string): Promise<T> {
  try {
    // Convert from base64
    const combined = Buffer.from(encryptedString, 'base64');
    
    // Extract IV (first 12 bytes), encrypted data, and auth tag (last 16 bytes)
    const iv = combined.slice(0, 12);
    const authTag = combined.slice(-16);
    const encrypted = combined.slice(12, -16);
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY!), iv);
    decipher.setAAD(Buffer.from(''));
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Parse JSON
    return JSON.parse(decrypted) as T;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt sensitive data for storage
 * 
 * @param data - The data to encrypt
 * @returns Encrypted string safe for database storage
 */
export async function encryptForStorage<T>(data: T): Promise<string> {
  return encryptJSON(data);
}

/**
 * Decrypt data from storage
 * 
 * @param encryptedData - The encrypted data from storage
 * @returns The decrypted data
 */
export async function decryptFromStorage<T>(encryptedData: string): Promise<T> {
  return decryptJSON<T>(encryptedData);
}

/**
 * Encrypt a string value (simpler interface for single values)
 * 
 * @param value - The string to encrypt
 * @returns Encrypted string
 */
export async function encryptString(value: string): Promise<string> {
  return encryptJSON({ value });
}

/**
 * Decrypt a string value
 * 
 * @param encryptedValue - The encrypted string
 * @returns The decrypted string
 */
export async function decryptString(encryptedValue: string): Promise<string> {
  const result = await decryptJSON<{ value: string }>(encryptedValue);
  return result.value;
}

/**
 * Check if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  return !!ENCRYPTION_KEY && ENCRYPTION_KEY.length >= 32;
}

/**
 * Get encryption status for debugging
 */
export function getEncryptionStatus(): {
  configured: boolean;
  keyLength: number;
  hasKey: boolean;
} {
  return {
    configured: isEncryptionConfigured(),
    keyLength: ENCRYPTION_KEY?.length || 0,
    hasKey: !!ENCRYPTION_KEY,
  };
}
