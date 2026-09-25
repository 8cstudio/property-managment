import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_DATABASE_URL: z.string().min(1),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  EMAIL_DRIVER: z.enum(["console", "smtp", "resend"]).default("console"),
  CACHE_DRIVER: z.enum(["memory", "redis"]).default("memory"),
  RATE_LIMIT_DRIVER: z.enum(["memory", "redis"]).default("memory"),
  STORAGE_LOCAL_DIR: z.string().default(".data/storage"),
});

export type Env = z.infer<typeof schema>;

/** Pass `process.env` from the app entry. Packages must not read `process.env` themselves. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  return schema.parse(source);
}
