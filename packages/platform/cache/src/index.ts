export type CachePort = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
};

export type RateLimiter = {
  allow(key: string, limit: number, windowSeconds: number): Promise<boolean>;
};
