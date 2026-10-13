import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * SRE Readiness Probe: Memeriksa apakah database MySQL aktif dan siap menerima query.
 * Mengembalikan HTTP 200 jika siap, atau HTTP 503 jika koneksi database terputus.
 */
export async function GET() {
  const start = performance.now();

  try {
    const db = getDb();
    // Eksekusi ping ringan ke MySQL
    await db.execute(sql`SELECT 1`);
    const duration = Math.round(performance.now() - start);

    return NextResponse.json(
      {
        status: "READY",
        service: "kasirin-pos",
        database: {
          status: "connected",
          engine: "MySQL",
          latency_ms: duration,
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    console.error("[Readiness Check Failed]:", error);

    return NextResponse.json(
      {
        status: "UNAVAILABLE",
        service: "kasirin-pos",
        database: {
          status: "disconnected",
          error: error.message || "Database connection error",
          latency_ms: duration,
        },
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Content-Type": "application/json",
        },
      }
    );
  }
}
