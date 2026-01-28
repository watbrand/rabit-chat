import type { Express, Request, Response } from "express";
import { db } from "./db";
import { apiUsageDaily, apiUsageAlerts, apiUsageAlertHistory, users } from "@shared/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { z } from "zod";
import { apiError, ErrorCodes } from "./validation";

type ApiService = "CLOUDINARY" | "RESEND" | "OPENAI" | "GEMINI" | "TWILIO" | "PAYFAST" | "EXPO_PUSH";

const requireAdmin = async (req: Request, res: Response, next: () => void) => {
  if (!req.session?.userId) {
    return res.status(401).json(apiError(ErrorCodes.UNAUTHORIZED, "Authentication required"));
  }
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, req.session.userId),
  });
  
  if (!user || !user.isAdmin) {
    return res.status(403).json(apiError(ErrorCodes.FORBIDDEN, "Admin access required"));
  }
  
  next();
};

export async function trackApiUsage(
  service: ApiService,
  options: {
    requestCount?: number;
    bytesTransferred?: number;
    estimatedCostCents?: number;
    error?: boolean;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const existing = await db.query.apiUsageDaily.findFirst({
      where: and(
        eq(apiUsageDaily.service, service),
        eq(apiUsageDaily.date, today)
      ),
    });
    
    if (existing) {
      await db.update(apiUsageDaily)
        .set({
          requestCount: sql`${apiUsageDaily.requestCount} + ${options.requestCount || 1}`,
          bytesTransferred: sql`${apiUsageDaily.bytesTransferred} + ${options.bytesTransferred || 0}`,
          estimatedCostCents: sql`${apiUsageDaily.estimatedCostCents} + ${options.estimatedCostCents || 0}`,
          errors: options.error ? sql`${apiUsageDaily.errors} + 1` : apiUsageDaily.errors,
          updatedAt: new Date(),
        })
        .where(eq(apiUsageDaily.id, existing.id));
    } else {
      await db.insert(apiUsageDaily).values({
        service,
        date: today,
        requestCount: options.requestCount || 1,
        bytesTransferred: options.bytesTransferred || 0,
        estimatedCostCents: options.estimatedCostCents || 0,
        errors: options.error ? 1 : 0,
        metadata: options.metadata,
      });
    }
    
    await checkAlerts(service);
  } catch (error) {
    console.error("[API Usage] Failed to track usage:", error);
  }
}

async function checkAlerts(service: ApiService): Promise<void> {
  const alerts = await db.query.apiUsageAlerts.findMany({
    where: and(
      eq(apiUsageAlerts.service, service),
      eq(apiUsageAlerts.isEnabled, true)
    ),
  });
  
  const today = new Date().toISOString().split('T')[0];
  const todayUsage = await db.query.apiUsageDaily.findFirst({
    where: and(
      eq(apiUsageDaily.service, service),
      eq(apiUsageDaily.date, today)
    ),
  });
  
  if (!todayUsage) return;
  
  for (const alert of alerts) {
    let currentValue = 0;
    
    if (alert.alertType === "DAILY_LIMIT") {
      currentValue = todayUsage.requestCount || 0;
    } else if (alert.alertType === "DAILY_COST") {
      currentValue = todayUsage.estimatedCostCents || 0;
    } else if (alert.alertType === "ERROR_RATE") {
      const total = todayUsage.requestCount || 1;
      const errors = todayUsage.errors || 0;
      currentValue = Math.round((errors / total) * 100);
    }
    
    if (currentValue >= alert.thresholdValue) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (!alert.lastTriggeredAt || alert.lastTriggeredAt < oneHourAgo) {
        await db.insert(apiUsageAlertHistory).values({
          alertId: alert.id,
          service,
          alertType: alert.alertType,
          currentValue,
          thresholdValue: alert.thresholdValue,
          message: `${service} ${alert.alertType} alert: ${currentValue} >= ${alert.thresholdValue}`,
        });
        
        await db.update(apiUsageAlerts)
          .set({ lastTriggeredAt: new Date() })
          .where(eq(apiUsageAlerts.id, alert.id));
        
        console.warn(`[API ALERT] ${service} ${alert.alertType}: ${currentValue} >= ${alert.thresholdValue}`);
      }
    }
  }
}

export function registerApiUsageRoutes(app: Express): void {
  app.get("/api/admin/api-usage/summary", requireAdmin, async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const usage = await db.select({
        service: apiUsageDaily.service,
        totalRequests: sql<number>`sum(${apiUsageDaily.requestCount})::int`,
        totalBytes: sql<number>`sum(${apiUsageDaily.bytesTransferred})::bigint`,
        totalCostCents: sql<number>`sum(${apiUsageDaily.estimatedCostCents})::int`,
        totalErrors: sql<number>`sum(${apiUsageDaily.errors})::int`,
      })
        .from(apiUsageDaily)
        .where(gte(apiUsageDaily.date, startDateStr))
        .groupBy(apiUsageDaily.service);
      
      const services: ApiService[] = ["CLOUDINARY", "RESEND", "OPENAI", "GEMINI", "TWILIO", "PAYFAST", "EXPO_PUSH"];
      const summary = services.map(service => {
        const data = usage.find(u => u.service === service);
        return {
          service,
          totalRequests: data?.totalRequests || 0,
          totalBytes: data?.totalBytes || 0,
          totalCostCents: data?.totalCostCents || 0,
          totalErrors: data?.totalErrors || 0,
          errorRate: data?.totalRequests ? ((data.totalErrors || 0) / data.totalRequests * 100).toFixed(2) : "0",
        };
      });
      
      res.json({ summary, days });
    } catch (error) {
      console.error("[API Usage] Failed to get summary:", error);
      res.status(500).json(apiError(ErrorCodes.INTERNAL_ERROR, "Failed to get usage summary"));
    }
  });
  
  app.get("/api/admin/api-usage/daily/:service", requireAdmin, async (req: Request, res: Response) => {
    try {
      const service = req.params.service as ApiService;
      const days = parseInt(req.query.days as string) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const dailyData = await db.query.apiUsageDaily.findMany({
        where: and(
          eq(apiUsageDaily.service, service),
          gte(apiUsageDaily.date, startDateStr)
        ),
        orderBy: [desc(apiUsageDaily.date)],
      });
      
      res.json({ service, data: dailyData });
    } catch (error) {
      console.error("[API Usage] Failed to get daily data:", error);
      res.status(500).json(apiError(ErrorCodes.INTERNAL_ERROR, "Failed to get daily data"));
    }
  });
  
  app.get("/api/admin/api-usage/alerts", requireAdmin, async (req: Request, res: Response) => {
    try {
      const alerts = await db.query.apiUsageAlerts.findMany({
        orderBy: [desc(apiUsageAlerts.createdAt)],
      });
      
      res.json({ alerts });
    } catch (error) {
      console.error("[API Usage] Failed to get alerts:", error);
      res.status(500).json(apiError(ErrorCodes.INTERNAL_ERROR, "Failed to get alerts"));
    }
  });
  
  app.post("/api/admin/api-usage/alerts", requireAdmin, async (req: Request, res: Response) => {
    const schema = z.object({
      service: z.enum(["CLOUDINARY", "RESEND", "OPENAI", "GEMINI", "TWILIO", "PAYFAST", "EXPO_PUSH"]),
      alertType: z.enum(["DAILY_LIMIT", "DAILY_COST", "ERROR_RATE", "MONTHLY_LIMIT"]),
      thresholdValue: z.number().int().positive(),
      notifyEmail: z.string().email().optional(),
    });
    
    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(apiError(ErrorCodes.VALIDATION_ERROR, validation.error.message));
    }
    
    try {
      const [alert] = await db.insert(apiUsageAlerts).values({
        service: validation.data.service,
        alertType: validation.data.alertType,
        thresholdValue: validation.data.thresholdValue,
        notifyEmail: validation.data.notifyEmail,
      }).returning();
      
      res.json({ success: true, alert });
    } catch (error) {
      console.error("[API Usage] Failed to create alert:", error);
      res.status(500).json(apiError(ErrorCodes.INTERNAL_ERROR, "Failed to create alert"));
    }
  });
  
  app.patch("/api/admin/api-usage/alerts/:id", requireAdmin, async (req: Request, res: Response) => {
    const alertId = parseInt(req.params.id);
    
    const schema = z.object({
      isEnabled: z.boolean().optional(),
      thresholdValue: z.number().int().positive().optional(),
      notifyEmail: z.string().email().optional().nullable(),
    });
    
    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(apiError(ErrorCodes.VALIDATION_ERROR, validation.error.message));
    }
    
    try {
      const [updated] = await db.update(apiUsageAlerts)
        .set({
          ...validation.data,
          updatedAt: new Date(),
        })
        .where(eq(apiUsageAlerts.id, alertId))
        .returning();
      
      res.json({ success: true, alert: updated });
    } catch (error) {
      console.error("[API Usage] Failed to update alert:", error);
      res.status(500).json(apiError(ErrorCodes.INTERNAL_ERROR, "Failed to update alert"));
    }
  });
  
  app.delete("/api/admin/api-usage/alerts/:id", requireAdmin, async (req: Request, res: Response) => {
    const alertId = parseInt(req.params.id);
    
    try {
      await db.delete(apiUsageAlerts).where(eq(apiUsageAlerts.id, alertId));
      res.json({ success: true });
    } catch (error) {
      console.error("[API Usage] Failed to delete alert:", error);
      res.status(500).json(apiError(ErrorCodes.INTERNAL_ERROR, "Failed to delete alert"));
    }
  });
  
  app.get("/api/admin/api-usage/alert-history", requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      
      const history = await db.query.apiUsageAlertHistory.findMany({
        orderBy: [desc(apiUsageAlertHistory.createdAt)],
        limit,
      });
      
      res.json({ history });
    } catch (error) {
      console.error("[API Usage] Failed to get alert history:", error);
      res.status(500).json(apiError(ErrorCodes.INTERNAL_ERROR, "Failed to get alert history"));
    }
  });
  
  console.log("API usage monitoring routes registered");
}
