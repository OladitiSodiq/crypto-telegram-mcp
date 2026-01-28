
// src/utils/cache.ts
const cache = new Map<string, { value: any; expire: number }>();

export function setCache(key: string, value: any, ttlSeconds: number) {
  cache.set(key, { value, expire: Date.now() + ttlSeconds * 1000 });
}

export function getCache<T>(key: string): T | null {
  const data = cache.get(key);
  if (!data) return null;
  if (Date.now() > data.expire) { cache.delete(key); return null; }
  return data.value as T;
}