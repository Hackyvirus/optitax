// OTP Store — uses Redis if REDIS_URL is set, falls back to in-memory
// Install: npm install ioredis

type OTPEntry = { otp: string; exp: number; attempts: number };

// ── In-memory fallback ─────────────────────────────────────────────────────
const g = globalThis as typeof globalThis & { __otpStore?: Map<string, OTPEntry> };
if (!g.__otpStore) g.__otpStore = new Map();
const memStore = g.__otpStore!;

// ── Redis client (lazy) ────────────────────────────────────────────────────
let redisClient: import("ioredis").Redis | null = null;

async function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (redisClient) return redisClient;
  try {
    const { default: Redis } = await import("ioredis");
    redisClient = new Redis(process.env.REDIS_URL, { lazyConnect: true, enableOfflineQueue: false });
    await redisClient.ping();
    return redisClient;
  } catch {
    console.warn("[OTP] Redis unavailable, using in-memory store");
    redisClient = null;
    return null;
  }
}

const OTP_TTL = 10 * 60; // 10 minutes
const MAX_ATTEMPTS = 5;

export async function setOTP(email: string, otp: string) {
  const key   = `otp:${email.toLowerCase()}`;
  const entry: OTPEntry = { otp, exp: Date.now() + OTP_TTL * 1000, attempts: 0 };
  const redis = await getRedis();
  if (redis) {
    await redis.setex(key, OTP_TTL, JSON.stringify(entry));
  } else {
    memStore.set(key, entry);
    setTimeout(() => memStore.delete(key), OTP_TTL * 1000);
  }
}

export async function verifyOTP(email: string, otp: string): Promise<boolean> {
  const key   = `otp:${email.toLowerCase()}`;
  const redis = await getRedis();

  let entry: OTPEntry | null = null;

  if (redis) {
    const raw = await redis.get(key);
    if (!raw) return false;
    entry = JSON.parse(raw);
  } else {
    entry = memStore.get(key) || null;
  }

  if (!entry)                      return false;
  if (Date.now() > entry.exp)      { await deleteOTP(email); return false; }
  if (entry.attempts >= MAX_ATTEMPTS) { await deleteOTP(email); return false; }

  if (entry.otp !== String(otp).trim()) {
    entry.attempts++;
    if (redis) await redis.setex(key, OTP_TTL, JSON.stringify(entry));
    else memStore.set(key, entry);
    return false;
  }

  await deleteOTP(email); // one-time use
  return true;
}

async function deleteOTP(email: string) {
  const key   = `otp:${email.toLowerCase()}`;
  const redis = await getRedis();
  if (redis) await redis.del(key);
  else memStore.delete(key);
}