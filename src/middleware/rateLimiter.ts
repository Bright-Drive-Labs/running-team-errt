/**
 * Simple in-memory rate limiter for security
 * Prevents brute force attacks on sensitive endpoints
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds (e.g., 15 * 60 * 1000 for 15 minutes)
  maxRequests: number; // Max requests allowed in the time window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5 // 5 attempts per 15 minutes
};

/**
 * Check if IP/identifier is rate limited
 * Returns true if request should be blocked
 */
export function isRateLimited(identifier: string, config: RateLimitConfig = DEFAULT_CONFIG): boolean {
  const now = Date.now();
  const key = identifier;

  // Clean up expired entries
  if (store[key] && store[key].resetTime < now) {
    delete store[key];
  }

  // First request
  if (!store[key]) {
    store[key] = {
      count: 1,
      resetTime: now + config.windowMs
    };
    return false;
  }

  // Within window
  if (store[key].count >= config.maxRequests) {
    return true; // Rate limited
  }

  store[key].count++;
  return false;
}

/**
 * Get remaining attempts for rate-limited endpoint
 */
export function getRemaining(identifier: string, config: RateLimitConfig = DEFAULT_CONFIG): number {
  const key = identifier;
  const now = Date.now();

  if (store[key]?.resetTime < now) {
    delete store[key];
  }

  if (!store[key]) {
    return config.maxRequests;
  }

  return Math.max(0, config.maxRequests - store[key].count);
}

/**
 * Get reset time for identifier
 */
export function getResetTime(identifier: string): number {
  const key = identifier;
  if (!store[key]) {
    return Date.now();
  }
  return store[key].resetTime;
}

/**
 * Clear rate limit for identifier (admin function)
 */
export function clearRateLimit(identifier: string): void {
  delete store[identifier];
}

/**
 * Clear all rate limits (admin function)
 */
export function clearAllRateLimits(): void {
  for (const key in store) {
    delete store[key];
  }
}
