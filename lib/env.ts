import "server-only";
import { z } from "zod";

/** Validated server environment. Fails fast with a readable message. */
const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is missing (see .env.example)"),
  ENCRYPTION_MASTER_KEY: z
    .string()
    .refine((v) => Buffer.from(v, "base64").length === 32, "ENCRYPTION_MASTER_KEY must be 32 bytes base64 (run pnpm setup:env)"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters (run pnpm setup:env)"),
  LAB_SIGNING_PUBLIC_KEY: z.string().regex(/^[0-9a-f]{64}$/i, "LAB_SIGNING_PUBLIC_KEY must be 32 bytes hex"),
  LAB_SIGNING_PRIVATE_KEY: z.string().regex(/^[0-9a-f]{64}$/i).optional(),
  DEMO_MODE: z.enum(["true", "false"]).default("true"),
});

let cached: z.infer<typeof schema> | null = null;

export function env() {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment:\n${msg}`);
  }
  cached = parsed.data;
  return cached;
}
