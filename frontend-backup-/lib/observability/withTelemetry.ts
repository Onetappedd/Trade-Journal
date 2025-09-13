import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

// Simple telemetry wrapper for API routes
// In production, replace with Sentry or your preferred logging service

interface TelemetryConfig {
  route: string;
  redactFields?: string[];
  maxPayloadSize?: number;
}

interface TelemetryContext {
  route: string;
  method: string;
  userId?: string;
  timestamp: string;
  duration: number;
  statusCode: number;
  error?: string;
  payloadHash?: string;
  redactedPayload?: any;
}

// Simple in-memory error store (replace with proper logging service)
const errorStore: TelemetryContext[] = [];

// Redact sensitive fields from payloads
function redactPayload(payload: any, redactFields: string[] = []): any {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const redacted = { ...payload };
  
  // Always redact common sensitive fields
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization',
    'email_body', 'raw_payload', 'csv_content', 'file_content',
    ...redactFields
  ];

  function redactObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const result: any = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        if (typeof value === 'string' && value.length > 50) {
          result[key] = `[REDACTED - ${value.length} chars]`;
        } else if (typeof value === 'object' && value !== null) {
          result[key] = '[REDACTED - object]';
        } else {
          result[key] = '[REDACTED]';
        }
      } else if (typeof value === 'object' && value !== null) {
        result[key] = redactObject(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  return redactObject(redacted);
}

// Generate hash for payload identification
function generatePayloadHash(payload: any): string {
  const payloadStr = JSON.stringify(payload);
  return createHash('sha256').update(payloadStr).digest('hex').substring(0, 8);
}

// Check payload size
function checkPayloadSize(payload: any, maxSize: number = 1024 * 1024): boolean {
  const payloadStr = JSON.stringify(payload);
  return payloadStr.length <= maxSize;
}

// Extract user ID from request (customize based on your auth setup)
function extractUserId(request: NextRequest): string | undefined {
  // Try to get user ID from various sources
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    // Extract from JWT or other auth token
    return 'user-from-token';
  }
  
  // Check for user ID in headers
  const userIdHeader = request.headers.get('x-user-id');
  if (userIdHeader) {
    return userIdHeader;
  }
  
  return undefined;
}

// Main telemetry wrapper
export function withTelemetry(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  config: TelemetryConfig
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const userId = extractUserId(request);
    
    let payload: any = null;
    let payloadHash: string | undefined;
    let redactedPayload: any = null;
    
    try {
      // Extract and process payload for logging
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        try {
          // Check if this is a multipart form (file upload)
          const contentType = request.headers.get('content-type') || '';
          if (contentType.includes('multipart/form-data')) {
            // For file uploads, don't try to parse as JSON
            payload = { type: 'multipart/form-data', hasFiles: true };
            payloadHash = 'file-upload';
            redactedPayload = { type: 'multipart/form-data', hasFiles: true };
          } else {
            // Try to parse as JSON for regular requests
            const body = await request.clone().text();
            if (body) {
              payload = JSON.parse(body);
              
              // Check payload size
              if (config.maxPayloadSize && !checkPayloadSize(payload, config.maxPayloadSize)) {
                return NextResponse.json(
                  { error: 'Payload too large' },
                  { status: 413 }
                );
              }
              
              // Generate hash and redact sensitive data
              payloadHash = generatePayloadHash(payload);
              redactedPayload = redactPayload(payload, config.redactFields);
            }
          }
        } catch (parseError) {
          // Non-JSON payload, skip payload processing
        }
      }
      
      // Execute the handler
      const response = await handler(request, context);
      
      // Record successful execution
      const telemetryContext: TelemetryContext = {
        route: config.route,
        method,
        userId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        statusCode: response.status,
        payloadHash,
        redactedPayload
      };
      
      // Log success (replace with your logging service)
      console.log('API Success:', {
        route: telemetryContext.route,
        method: telemetryContext.method,
        userId: telemetryContext.userId,
        duration: telemetryContext.duration,
        statusCode: telemetryContext.statusCode,
        payloadHash: telemetryContext.payloadHash
      });
      
      return response;
      
    } catch (error) {
      // Record error
      const telemetryContext: TelemetryContext = {
        route: config.route,
        method,
        userId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        statusCode: 500,
        error: error instanceof Error ? error.message : 'Unknown error',
        payloadHash,
        redactedPayload
      };
      
      // Store error for reporting (replace with Sentry or your logging service)
      errorStore.push(telemetryContext);
      
      // Log error with redacted information
      console.error('API Error:', {
        route: telemetryContext.route,
        method: telemetryContext.method,
        userId: telemetryContext.userId,
        duration: telemetryContext.duration,
        error: telemetryContext.error,
        payloadHash: telemetryContext.payloadHash,
        redactedPayload: telemetryContext.redactedPayload
      });
      
      // Return error response
      return NextResponse.json(
        { 
          error: 'Internal server error',
          timestamp: telemetryContext.timestamp,
          requestId: payloadHash
        },
        { status: 500 }
      );
    }
  };
}

// Utility function to get recent errors (for debugging)
export function getRecentErrors(limit: number = 10): TelemetryContext[] {
  return errorStore.slice(-limit);
}

// Utility function to clear error store (for testing)
export function clearErrorStore(): void {
  errorStore.length = 0;
}

// Rate limiting utilities
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
}

// Simple in-memory rate limiter (replace with Redis/Upstash in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowKey = `${config.keyPrefix}:${key}`;
  
  const current = rateLimitStore.get(windowKey);
  
  if (!current || now > current.resetTime) {
    // Reset window
    rateLimitStore.set(windowKey, {
      count: 1,
      resetTime: now + config.windowMs
    });
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }
  
  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    };
  }
  
  // Increment counter
  current.count++;
  rateLimitStore.set(windowKey, current);
  
  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime
  };
}

// Clean up expired rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute
