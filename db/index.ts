import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  __arcadeDb?: NeonHttpDatabase<typeof schema>;
};

export function getDb(): NeonHttpDatabase<typeof schema> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL 未配置");
  }
  if (!globalForDb.__arcadeDb) {
    globalForDb.__arcadeDb = drizzle(neon(url), { schema });
  }
  return globalForDb.__arcadeDb;
}
