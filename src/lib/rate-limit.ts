import IoRedis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
let redis: any = null;

try {
  redis = new IoRedis(redisUrl, {
    maxRetriesPerRequest: 1,
    showFriendlyErrorStack: false,
    retryStrategy: () => null, // Do not retry continuously to prevent thread blocks if down
  });
  
  redis.on("error", (err: any) => {
    // Suppress noise logs, fallback handles it
  });
} catch (e) {
  console.warn("Rate-limiter: Failed to connect to Redis. Falling back to in-memory store.");
}

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const memoryStore = new Map<string, RateLimitRecord>();

export async function checkRateLimit(
  key: string,
  maxAttempts = 10,
  windowMs = 15 * 60 * 1000
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const redisKey = `ratelimit:${key}`;

  // Try Redis first
  if (redis && redis.status === "ready") {
    try {
      const current = await redis.get(redisKey);
      
      if (current === null) {
        await redis.multi()
          .set(redisKey, "1")
          .pexpire(redisKey, windowMs)
          .exec();
        return { allowed: true };
      }

      const count = parseInt(current, 10);
      if (count >= maxAttempts) {
        const ttl = await redis.pttl(redisKey);
        return { allowed: false, retryAfterMs: ttl > 0 ? ttl : windowMs };
      }

      await redis.incr(redisKey);
      return { allowed: true };
    } catch (err) {
      console.warn("Redis rate limiter failed, falling back to local memory store.");
    }
  }

  // Memory Fallback
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, retryAfterMs: record.resetAt - now };
  }

  record.count += 1;
  return { allowed: true };
}
