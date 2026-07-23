/**
 * Lightweight in-memory sliding-window rate limiter for burst protection.
 *
 * Daily plan limits are enforced durably in the database (see usage.ts);
 * this limiter only protects API routes from rapid-fire abuse within a
 * single serverless instance. For multi-region, high-scale deployments
 * swap this for Upstash Ratelimit or similar — the interface is identical.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit = 20,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) buckets.clear();

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    return {
      success: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000),
    };
  }

  bucket.timestamps.push(now);
  return {
    success: true,
    remaining: limit - bucket.timestamps.length,
    retryAfterSeconds: 0,
  };
}
