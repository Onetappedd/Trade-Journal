import { NextRequest, NextResponse } from 'next/server';
import { FEATURE_FLAGS, isFeatureEnabled, getAllFeatureFlags, validateFeatureFlags } from '../../../lib/config/flags';

export async function GET(request: NextRequest) {
  try {
    // Set a test encryption key for this test
    process.env.ENCRYPTION_KEY = 'this-is-a-32-character-encryption-key-123';
    
    // Import crypto functions dynamically to avoid build-time validation
    const { 
      encryptJSON, 
      decryptJSON, 
      encryptString, 
      decryptString,
      isEncryptionConfigured,
      getEncryptionStatus 
    } = await import('../../../lib/crypto/secure');
    
    const results: any = {
      featureFlags: {
        allFlags: getAllFeatureFlags(),
        brokerApisEnabled: isFeatureEnabled('BROKER_APIS_ENABLED'),
        inboundEmailEnabled: isFeatureEnabled('INBOUND_EMAIL_ENABLED'),
        cronEnabled: isFeatureEnabled('CRON_ENABLED'),
        validationPassed: false
      },
      crypto: {
        configured: isEncryptionConfigured(),
        status: getEncryptionStatus(),
        jsonTest: null,
        stringTest: null,
        uniquenessTest: null
      }
    };

    // Test feature flag validation
    try {
      validateFeatureFlags();
      results.featureFlags.validationPassed = true;
    } catch (error) {
      results.featureFlags.validationPassed = false;
      results.featureFlags.validationError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test crypto JSON encryption/decryption
    try {
      const testObject = {
        name: 'John Doe',
        age: 30,
        active: true,
        preferences: {
          theme: 'dark',
          notifications: true
        }
      };
      
      const encrypted = await encryptJSON(testObject);
      const decrypted = await decryptJSON(encrypted);
      
      results.crypto.jsonTest = {
        success: true,
        original: testObject,
        encrypted: encrypted.substring(0, 50) + '...',
        decrypted,
        match: JSON.stringify(testObject) === JSON.stringify(decrypted)
      };
    } catch (error) {
      results.crypto.jsonTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test crypto string encryption/decryption
    try {
      const testString = 'Hello, World! This is a test string with special chars: !@#$%^&*()';
      
      const encryptedString = await encryptString(testString);
      const decryptedString = await decryptString(encryptedString);
      
      results.crypto.stringTest = {
        success: true,
        original: testString,
        encrypted: encryptedString.substring(0, 50) + '...',
        decrypted: decryptedString,
        match: testString === decryptedString
      };
    } catch (error) {
      results.crypto.stringTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test crypto uniqueness
    try {
      const input = { message: 'Hello World' };
      const encrypted1 = await encryptJSON(input);
      const encrypted2 = await encryptJSON(input);
      
      const decrypted1 = await decryptJSON(encrypted1);
      const decrypted2 = await decryptJSON(encrypted2);
      
      results.crypto.uniquenessTest = {
        success: true,
        encrypted1: encrypted1.substring(0, 30) + '...',
        encrypted2: encrypted2.substring(0, 30) + '...',
        different: encrypted1 !== encrypted2,
        bothDecryptCorrectly: JSON.stringify(decrypted1) === JSON.stringify(decrypted2)
      };
    } catch (error) {
      results.crypto.uniquenessTest = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Feature flags and crypto helpers test completed',
      results
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
