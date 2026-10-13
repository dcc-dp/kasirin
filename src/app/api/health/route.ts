import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const startTime = Date.now();

/**
 * SRE Liveness Probe: Memeriksa apakah web server aktif dan responsif.
 * Digunakan oleh Docker HEALTHCHECK, Kubernetes livenessProbe, atau Load Balancer.
 */
export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  return NextResponse.json(
    {
      status: "UP",
      service: "kasirin-pos",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptime_seconds: uptimeSeconds,
      environment: process.env.NODE_ENV || "development",
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Type": "application/json",
      },
    }
  );
}
