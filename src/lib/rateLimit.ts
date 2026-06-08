const g = globalThis as typeof globalThis & {
  __rl?: Map<string, { count: number; resetAt: number }>;
};
if (!g.__rl) g.__rl = new Map();

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = g.__rl!.get(key);
  if (!entry || now > entry.resetAt) {
    g.__rl!.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}
