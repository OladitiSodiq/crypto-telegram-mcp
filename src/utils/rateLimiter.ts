
// src/utils/rateLimiter.ts
const limits = new Map<string, { count: number; last: number }>();

export function rateLimit(key: string, max: number, intervalMs: number): boolean {
  const now = Date.now();
  const data = limits.get(key) || { count: 0, last: now };
  if (now - data.last > intervalMs) { data.count = 0; data.last = now; }
  data.count++;
  limits.set(key, data);
  return data.count <= max;
}