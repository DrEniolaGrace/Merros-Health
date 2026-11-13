import "dotenv/config";
import { assertSafeDatabase } from "../../lib/db/guard";

/** Unit tests must never be pointed at the production database (CLAUDE.md). */
export default function globalSetup() {
  if (process.env.DATABASE_URL) assertSafeDatabase("the unit tests");
}
