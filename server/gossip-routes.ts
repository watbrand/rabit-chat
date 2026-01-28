import { Express, Request, Response } from "express";
import { gossipStorage } from "./gossip-storage";
import { z } from "zod";
import crypto from "crypto";

function generateDeviceHash(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0] : req.socket.remoteAddress || "";
  const userAgent = req.headers["user-agent"] || "";
  const acceptLanguage = req.headers["accept-language"] || "";
  
  const fingerprint = `${ip}:${userAgent}:${acceptLanguage}`;
  return crypto.createHash("sha256").update(fingerprint).digest("hex");
}

const createPostSchema = z.object({
  countryCode: z.string().length(2).optional(),
  zaLocationId: z.string().optional(),
  locationDisplay: z.string().max(300).optional(),
  type: z.enum(["TEXT", "VOICE"]).default("TEXT"),
  content: z.string().max(1000).optional(),
  mediaUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  durationMs: z.number().positive().optional(),
  isWhisper: z.boolean().default(false),
});

const reactionSchema = z.object({
  reactionType: z.enum(["FIRE", "MINDBLOWN", "LAUGH", "SKULL", "EYES"]),
});

const replySchema = z.object({
  content: z.string().min(1).max(500),
  parentReplyId: z.string().optional(),
});

const reportSchema = z.object({
  reason: z.string().min(5).max(500),
});

const reviewReportSchema = z.object({
  status: z.enum(["REVIEWED", "DISMISSED", "REMOVED"]),
  notes: z.string().optional(),
});

export function registerGossipRoutes(app: Express, requireAdmin: any) {
  app.get("/api/gossip/countries", async (req, res) => {
    try {
      const countries = await gossipStorage.getCountries();
      res.json(countries);
    } catch (error) {
      console.error("Failed to get countries:", error);
      res.status(500).json({ message: "Failed to get countries" });
    }
  });

  app.get("/api/gossip/za-locations", async (req, res) => {
    try {
      const { province, city, level } = req.query;
      console.log("[Gossip API] /za-locations request:", { province, city, level });
      const locations = await gossipStorage.getZaLocations({
        province: province as string,
        city: city as string,
        level: level ? parseInt(level as string, 10) : undefined,
      });
      console.log("[Gossip API] /za-locations response count:", locations.length);
      res.json(locations);
    } catch (error) {
      console.error("Failed to get locations:", error);
      res.status(500).json({ message: "Failed to get locations" });
    }
  });

  app.get("/api/gossip/za-locations/search", async (req, res) => {
    try {
      const { q, limit } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query required" });
      }
      const locations = await gossipStorage.searchZaLocations(q, limit ? parseInt(limit as string, 10) : 20);
      res.json(locations);
    } catch (error) {
      console.error("Failed to search locations:", error);
      res.status(500).json({ message: "Failed to search locations" });
    }
  });

  app.get("/api/gossip/za-locations/:id", async (req, res) => {
    try {
      const location = await gossipStorage.getZaLocationById(req.params.id);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      console.error("Failed to get location:", error);
      res.status(500).json({ message: "Failed to get location" });
    }
  });

  app.post("/api/gossip/posts", async (req, res) => {
    try {
      const deviceHash = generateDeviceHash(req);

      const rateCheck = await gossipStorage.checkRateLimit(deviceHash);
      if (!rateCheck.allowed) {
        return res.status(429).json({
          message: "Rate limit exceeded. Please wait before posting again.",
          remaining: rateCheck.remaining,
          resetAt: rateCheck.resetAt,
        });
      }

      const parsed = createPostSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request", errors: parsed.error.errors });
      }

      const { content, type, ...rest } = parsed.data;

      if (!content && type === "TEXT") {
        return res.status(400).json({ message: "Content is required for text posts" });
      }
      if (!rest.mediaUrl && type === "VOICE") {
        return res.status(400).json({ message: "Media URL is required for voice posts" });
      }

      if (content) {
        const modCheck = await gossipStorage.checkContentAgainstBlockedWords(content);
        if (modCheck.isBlocked) {
          return res.status(400).json({
            message: "Your post contains prohibited content",
            blocked: true,
          });
        }
      }

      const post = await gossipStorage.createAnonPost({
        deviceHash,
        content,
        type,
        ...rest,
      });

      res.status(201).json(post);
    } catch (error) {
      console.error("Failed to create post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get("/api/gossip/posts", async (req, res) => {
    try {
      const deviceHash = generateDeviceHash(req);
      const { countryCode, zaLocationId, province, city, kasi, isWhisper, sortBy, limit, offset } = req.query;

      const posts = await gossipStorage.getAnonFeed({
        countryCode: countryCode as string,
        zaLocationId: zaLocationId as string,
        province: province as string,
        city: city as string,
        kasi: kasi as string,
        isWhisper: isWhisper === "true" ? true : isWhisper === "false" ? false : undefined,
        sortBy: (sortBy as "latest" | "trending" | "hottest") || "latest",
        limit: limit ? parseInt(limit as string, 10) : 20,
        offset: offset ? parseInt(offset as string, 10) : 0,
        deviceHash,
      });

      res.json(posts);
    } catch (error) {
      console.error("Failed to get posts:", error);
      res.status(500).json({ message: "Failed to get posts" });
    }
  });

  app.get("/api/gossip/posts/:id", async (req, res) => {
    try {
      const deviceHash = generateDeviceHash(req);
      const post = await gossipStorage.getAnonPost(req.params.id, deviceHash);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Failed to get post:", error);
      res.status(500).json({ message: "Failed to get post" });
    }
  });

  app.post("/api/gossip/posts/:id/reactions", async (req, res) => {
    try {
      const deviceHash = generateDeviceHash(req);
      const parsed = reactionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid reaction type" });
      }

      const result = await gossipStorage.toggleReaction(req.params.id, deviceHash, parsed.data.reactionType);
      res.json({ added: result.added, post: result.post });
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
      res.status(500).json({ message: "Failed to toggle reaction" });
    }
  });

  app.get("/api/gossip/posts/:id/replies", async (req, res) => {
    try {
      const deviceHash = generateDeviceHash(req);
      const replies = await gossipStorage.getReplies(req.params.id, deviceHash);
      res.json(replies);
    } catch (error) {
      console.error("Failed to get replies:", error);
      res.status(500).json({ message: "Failed to get replies" });
    }
  });

  app.post("/api/gossip/posts/:id/replies", async (req, res) => {
    try {
      const deviceHash = generateDeviceHash(req);
      const parsed = replySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid reply", errors: parsed.error.errors });
      }

      const modCheck = await gossipStorage.checkContentAgainstBlockedWords(parsed.data.content);
      if (modCheck.isBlocked) {
        return res.status(400).json({
          message: "Your reply contains prohibited content",
          blocked: true,
        });
      }

      const reply = await gossipStorage.createReply(
        req.params.id,
        deviceHash,
        parsed.data.content,
        parsed.data.parentReplyId
      );

      if (!reply) {
        return res.status(400).json({ message: "Failed to create reply. Max depth may be exceeded." });
      }

      res.status(201).json(reply);
    } catch (error) {
      console.error("Failed to create reply:", error);
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  app.post("/api/gossip/replies/:id/reactions", async (req, res) => {
    try {
      const deviceHash = generateDeviceHash(req);
      const parsed = reactionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid reaction type" });
      }

      const result = await gossipStorage.toggleReplyReaction(req.params.id, deviceHash, parsed.data.reactionType);
      res.json(result);
    } catch (error) {
      console.error("Failed to toggle reply reaction:", error);
      res.status(500).json({ message: "Failed to toggle reply reaction" });
    }
  });

  app.post("/api/gossip/posts/:id/report", async (req, res) => {
    try {
      const deviceHash = generateDeviceHash(req);
      const parsed = reportSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid report", errors: parsed.error.errors });
      }

      const report = await gossipStorage.reportPost(req.params.id, deviceHash, parsed.data.reason);
      res.status(201).json({ message: "Report submitted", report });
    } catch (error) {
      console.error("Failed to report post:", error);
      res.status(500).json({ message: "Failed to report post" });
    }
  });

  app.post("/api/gossip/replies/:id/report", async (req, res) => {
    try {
      const deviceHash = generateDeviceHash(req);
      const parsed = reportSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid report", errors: parsed.error.errors });
      }

      const report = await gossipStorage.reportReply(req.params.id, deviceHash, parsed.data.reason);
      res.status(201).json({ message: "Report submitted", report });
    } catch (error) {
      console.error("Failed to report reply:", error);
      res.status(500).json({ message: "Failed to report reply" });
    }
  });

  app.get("/api/gossip/trending", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const trending = await gossipStorage.getTrendingLocations(limit);
      res.json(trending);
    } catch (error) {
      console.error("Failed to get trending:", error);
      res.status(500).json({ message: "Failed to get trending locations" });
    }
  });

  app.get("/api/gossip/leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const leaderboard = await gossipStorage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Failed to get leaderboard:", error);
      res.status(500).json({ message: "Failed to get leaderboard" });
    }
  });

  app.get("/api/gossip/streaks", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const streaks = await gossipStorage.getStreakLeaders(limit);
      res.json(streaks);
    } catch (error) {
      console.error("Failed to get streaks:", error);
      res.status(500).json({ message: "Failed to get streak leaders" });
    }
  });

  app.get("/api/admin/gossip/reports", requireAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const reports = await gossipStorage.getPendingReports(limit, offset);
      res.json(reports);
    } catch (error) {
      console.error("Failed to get reports:", error);
      res.status(500).json({ message: "Failed to get reports" });
    }
  });

  app.post("/api/admin/gossip/reports/:id/review", requireAdmin, async (req, res) => {
    try {
      const parsed = reviewReportSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid review", errors: parsed.error.errors });
      }

      const report = await gossipStorage.reviewReport(
        req.params.id,
        parsed.data.status,
        (req.session as any).userId,
        parsed.data.notes
      );

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json(report);
    } catch (error) {
      console.error("Failed to review report:", error);
      res.status(500).json({ message: "Failed to review report" });
    }
  });

  app.delete("/api/admin/gossip/posts/:id", requireAdmin, async (req, res) => {
    try {
      const { reason } = req.body;
      const post = await gossipStorage.removePost(
        req.params.id,
        reason || "Removed by admin",
        (req.session as any).userId
      );

      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json({ message: "Post removed", post });
    } catch (error) {
      console.error("Failed to remove post:", error);
      res.status(500).json({ message: "Failed to remove post" });
    }
  });

  app.get("/api/admin/gossip/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await gossipStorage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error("Failed to get settings:", error);
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  app.patch("/api/admin/gossip/settings/:key", requireAdmin, async (req, res) => {
    try {
      const { value } = req.body;
      if (value === undefined) {
        return res.status(400).json({ message: "Value is required" });
      }

      const setting = await gossipStorage.updateSetting(
        req.params.key,
        String(value),
        (req.session as any).userId
      );

      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }

      res.json(setting);
    } catch (error) {
      console.error("Failed to update setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  app.get("/api/admin/gossip/blocked-words", requireAdmin, async (req, res) => {
    try {
      const words = await gossipStorage.getBlockedWords();
      res.json(words);
    } catch (error) {
      console.error("Failed to get blocked words:", error);
      res.status(500).json({ message: "Failed to get blocked words" });
    }
  });

  app.post("/api/admin/gossip/blocked-words", requireAdmin, async (req, res) => {
    try {
      const { word, isRegex, severity } = req.body;
      if (!word) {
        return res.status(400).json({ message: "Word is required" });
      }

      const blocked = await gossipStorage.addBlockedWord(
        word,
        isRegex || false,
        severity || 1,
        (req.session as any).userId
      );

      res.status(201).json(blocked);
    } catch (error) {
      console.error("Failed to add blocked word:", error);
      res.status(500).json({ message: "Failed to add blocked word" });
    }
  });

  app.delete("/api/admin/gossip/blocked-words/:id", requireAdmin, async (req, res) => {
    try {
      await gossipStorage.removeBlockedWord(req.params.id);
      res.json({ message: "Blocked word removed" });
    } catch (error) {
      console.error("Failed to remove blocked word:", error);
      res.status(500).json({ message: "Failed to remove blocked word" });
    }
  });

  app.get("/api/admin/gossip/analytics", requireAdmin, async (req, res) => {
    try {
      const analytics = await gossipStorage.getGossipAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Failed to get analytics:", error);
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  // Admin Stats for Gossip Panel
  app.get("/api/gossip/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await gossipStorage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to get admin stats:", error);
      res.status(500).json({ message: "Failed to get admin stats" });
    }
  });

  // Admin Posts List with Filters
  app.get("/api/gossip/admin/posts", requireAdmin, async (req, res) => {
    try {
      const filter = req.query.filter as string || "all";
      const posts = await gossipStorage.getAdminPosts(filter);
      res.json(posts);
    } catch (error) {
      console.error("Failed to get admin posts:", error);
      res.status(500).json({ message: "Failed to get admin posts" });
    }
  });

  // Hide Post
  app.post("/api/gossip/admin/posts/:id/hide", requireAdmin, async (req, res) => {
    try {
      await gossipStorage.hidePost(req.params.id);
      res.json({ message: "Post hidden" });
    } catch (error) {
      console.error("Failed to hide post:", error);
      res.status(500).json({ message: "Failed to hide post" });
    }
  });

  // Unhide Post
  app.post("/api/gossip/admin/posts/:id/unhide", requireAdmin, async (req, res) => {
    try {
      await gossipStorage.unhidePost(req.params.id);
      res.json({ message: "Post unhidden" });
    } catch (error) {
      console.error("Failed to unhide post:", error);
      res.status(500).json({ message: "Failed to unhide post" });
    }
  });

  // Remove Post
  app.post("/api/gossip/admin/posts/:id/remove", requireAdmin, async (req, res) => {
    try {
      const { reason } = req.body;
      await gossipStorage.removePost(req.params.id, (req.session as any).userId, reason);
      res.json({ message: "Post removed" });
    } catch (error) {
      console.error("Failed to remove post:", error);
      res.status(500).json({ message: "Failed to remove post" });
    }
  });

  // Blocked Words (alternate path)
  app.get("/api/gossip/admin/blocked-words", requireAdmin, async (req, res) => {
    try {
      const words = await gossipStorage.getBlockedWords();
      res.json(words);
    } catch (error) {
      console.error("Failed to get blocked words:", error);
      res.status(500).json({ message: "Failed to get blocked words" });
    }
  });

  app.post("/api/gossip/admin/blocked-words", requireAdmin, async (req, res) => {
    try {
      const { word, isRegex, severity } = req.body;
      if (!word) {
        return res.status(400).json({ message: "Word is required" });
      }
      const blocked = await gossipStorage.addBlockedWord(
        word,
        isRegex || false,
        severity || 1,
        (req.session as any).userId
      );
      res.status(201).json(blocked);
    } catch (error) {
      console.error("Failed to add blocked word:", error);
      res.status(500).json({ message: "Failed to add blocked word" });
    }
  });

  app.delete("/api/gossip/admin/blocked-words/:id", requireAdmin, async (req, res) => {
    try {
      await gossipStorage.removeBlockedWord(req.params.id);
      res.json({ message: "Blocked word removed" });
    } catch (error) {
      console.error("Failed to remove blocked word:", error);
      res.status(500).json({ message: "Failed to remove blocked word" });
    }
  });

  // Location Stats
  app.get("/api/gossip/admin/location-stats", requireAdmin, async (req, res) => {
    try {
      const stats = await gossipStorage.getLocationStatsForAdmin();
      res.json(stats);
    } catch (error) {
      console.error("Failed to get location stats:", error);
      res.status(500).json({ message: "Failed to get location stats" });
    }
  });

  const detectLocationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  });

  app.post("/api/gossip/detect-location", async (req, res) => {
    try {
      const { latitude, longitude } = detectLocationSchema.parse(req.body);
      
      const location = await gossipStorage.detectLocationFromCoords(latitude, longitude);
      
      if (location) {
        res.json({ success: true, location });
      } else {
        res.json({ 
          success: false, 
          message: "Could not detect a supported location. Make sure you are in Southern Africa." 
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid coordinates", errors: error.errors });
      }
      console.error("Failed to detect location:", error);
      res.status(500).json({ message: "Failed to detect location" });
    }
  });

  console.log("Gossip routes registered");
}
