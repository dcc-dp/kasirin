import "dotenv/config";

import { drizzle } from "drizzle-orm/mysql2";

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL environment variable is not set. Please configure it in Railway."
      );
    }

    db = drizzle(databaseUrl);
  }

  return db;
}

export default getDb;