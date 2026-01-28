import { Router } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";

const router = Router();

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: "ok" | "error";
      latency?: number;
      error?: string;
    };
    memory: {
      status: "ok" | "warning";
      heapUsed: number;
      heapTotal: number;
      percentUsed: number;
    };
  };
}

const startTime = Date.now();

router.get("/api/health", async (_req, res) => {
  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.5",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {
      database: { status: "ok" },
      memory: { status: "ok", heapUsed: 0, heapTotal: 0, percentUsed: 0 },
    },
  };

  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    health.checks.database.latency = Date.now() - dbStart;
  } catch (error) {
    health.checks.database = {
      status: "error",
      error: error instanceof Error ? error.message : "Database connection failed",
    };
    health.status = "unhealthy";
  }

  const memUsage = process.memoryUsage();
  const percentUsed = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
  health.checks.memory = {
    status: percentUsed > 95 ? "warning" : "ok",
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    percentUsed,
  };

  if (percentUsed > 95) {
    health.status = health.status === "unhealthy" ? "unhealthy" : "degraded";
  }

  const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get("/api/health/live", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

router.get("/api/health/ready", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.status(200).json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "not ready" });
  }
});

export default router;
