import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { storage } from "./storage";
import { eq, and, desc, sql, inArray, isNull, or, ilike, count, ne } from "drizzle-orm";
import {
  users,
  interestCategories,
  userInterests,
  contentCategories,
  posts,
  follows,
} from "@shared/schema";
import { analyzeImage, moderateText } from "./services/ai-moderation";
import { z } from "zod";

const selectInterestsSchema = z.object({
  interests: z.array(z.string()).min(1).max(15),
});

const updateIndustrySchema = z.object({
  industry: z.enum([
    "TECH", "FINANCE", "REAL_ESTATE", "ENTERTAINMENT", "SPORTS",
    "HEALTHCARE", "LEGAL", "FASHION", "HOSPITALITY", "MEDIA",
    "AUTOMOTIVE", "AVIATION", "ART", "EDUCATION", "CONSULTING",
    "CRYPTO", "VENTURE_CAPITAL", "PRIVATE_EQUITY", "PHILANTHROPY", "OTHER"
  ]),
});

const updateNetWorthTierSchema = z.object({
  tier: z.enum(["BUILDING", "SILVER", "GOLD", "PLATINUM", "DIAMOND"]),
});

const updatePrivacySchema = z.object({
  netWorthVisibility: z.enum(["EVERYONE", "FOLLOWERS", "NOBODY"]).optional(),
  profileVisibility: z.enum(["EVERYONE", "FOLLOWERS", "NOBODY"]).optional(),
});

const updateOnboardingStepSchema = z.object({
  step: z.number().min(0).max(10),
});

// Seed interest categories with luxury-focused options
async function seedInterestCategories() {
  const categories = [
    { slug: "luxury-lifestyle", name: "Luxury Lifestyle", description: "High-end living, exclusive experiences", icon: "star", color: "#D4AF37", gradientColors: ["#D4AF37", "#FFF1B8"], order: 1 },
    { slug: "investments", name: "Investments & Finance", description: "Wealth management, stocks, portfolios", icon: "trending-up", color: "#10B981", gradientColors: ["#10B981", "#34D399"], order: 2 },
    { slug: "real-estate", name: "Real Estate", description: "Property, developments, architecture", icon: "home", color: "#8B5CF6", gradientColors: ["#8B5CF6", "#C4B5FD"], order: 3 },
    { slug: "yachts-aviation", name: "Yachts & Aviation", description: "Superyachts, private jets, travel", icon: "anchor", color: "#0EA5E9", gradientColors: ["#0EA5E9", "#7DD3FC"], order: 4 },
    { slug: "fine-dining", name: "Fine Dining & Wine", description: "Michelin stars, rare vintages, culinary art", icon: "coffee", color: "#EC4899", gradientColors: ["#EC4899", "#F9A8D4"], order: 5 },
    { slug: "fashion", name: "Fashion & Couture", description: "Haute couture, luxury brands, style", icon: "shopping-bag", color: "#F59E0B", gradientColors: ["#F59E0B", "#FCD34D"], order: 6 },
    { slug: "art-collectibles", name: "Art & Collectibles", description: "Fine art, antiques, rare collections", icon: "image", color: "#EF4444", gradientColors: ["#EF4444", "#FCA5A5"], order: 7 },
    { slug: "automotive", name: "Exotic Cars", description: "Supercars, classic cars, motorsport", icon: "zap", color: "#DC2626", gradientColors: ["#DC2626", "#F87171"], order: 8 },
    { slug: "watches-jewelry", name: "Watches & Jewelry", description: "Timepieces, diamonds, precious gems", icon: "watch", color: "#14B8A6", gradientColors: ["#14B8A6", "#5EEAD4"], order: 9 },
    { slug: "tech-innovation", name: "Tech & Innovation", description: "Startups, AI, cutting-edge technology", icon: "cpu", color: "#6366F1", gradientColors: ["#6366F1", "#A5B4FC"], order: 10 },
    { slug: "wellness-health", name: "Wellness & Health", description: "Biohacking, longevity, elite fitness", icon: "heart", color: "#F43F5E", gradientColors: ["#F43F5E", "#FDA4AF"], order: 11 },
    { slug: "entertainment", name: "Entertainment & Media", description: "Film, music, celebrities, events", icon: "film", color: "#A855F7", gradientColors: ["#A855F7", "#D8B4FE"], order: 12 },
    { slug: "sports", name: "Sports & Athletics", description: "Golf, polo, tennis, elite sports", icon: "award", color: "#22C55E", gradientColors: ["#22C55E", "#86EFAC"], order: 13 },
    { slug: "philanthropy", name: "Philanthropy & Impact", description: "Charitable giving, social impact", icon: "users", color: "#3B82F6", gradientColors: ["#3B82F6", "#93C5FD"], order: 14 },
    { slug: "crypto-web3", name: "Crypto & Web3", description: "Digital assets, blockchain, NFTs", icon: "database", color: "#8B5CF6", gradientColors: ["#F97316", "#FDBA74"], order: 15 },
  ];

  try {
    const existing = await db.select().from(interestCategories);
    if (existing.length === 0) {
      await db.insert(interestCategories).values(categories);
      console.log("Seeded interest categories successfully");
    }
  } catch (error) {
    console.error("Error seeding interest categories:", error);
  }
}

export function registerOnboardingRoutes(app: Express) {
  // Seed categories on startup
  seedInterestCategories();
  
  // Get all interest categories
  app.get("/api/interests/categories", async (req: Request, res: Response) => {
    try {
      const categories = await db
        .select()
        .from(interestCategories)
        .where(eq(interestCategories.isActive, true))
        .orderBy(interestCategories.order);
      
      res.json(categories);
    } catch (error) {
      console.error("Error fetching interest categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Get user's selected interests
  app.get("/api/interests/me", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const interests = await db
        .select({
          id: userInterests.id,
          interest: userInterests.interest,
          categoryId: userInterests.categoryId,
          affinityScore: userInterests.affinityScore,
          order: userInterests.order,
          category: interestCategories,
        })
        .from(userInterests)
        .leftJoin(interestCategories, eq(userInterests.categoryId, interestCategories.id))
        .where(eq(userInterests.userId, userId))
        .orderBy(userInterests.order);

      res.json(interests);
    } catch (error) {
      console.error("Error fetching user interests:", error);
      res.status(500).json({ error: "Failed to fetch interests" });
    }
  });

  // Select interests during onboarding
  app.post("/api/interests/select", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { interests } = selectInterestsSchema.parse(req.body);

      // Get category info for selected slugs
      const categoryList = await db
        .select()
        .from(interestCategories)
        .where(inArray(interestCategories.slug, interests));

      const categoryMap = new Map(categoryList.map(c => [c.slug, c]));

      // Delete existing interests
      await db.delete(userInterests).where(eq(userInterests.userId, userId));

      // Insert new interests
      const insertItems = interests.map((slug, idx) => {
        const category = categoryMap.get(slug);
        return {
          userId,
          interest: slug,
          categoryId: category?.id || null,
          affinityScore: 1.0,
          order: idx,
        };
      });

      const result = await db.insert(userInterests).values(insertItems).returning();

      // Update onboarding step
      await db.update(users)
        .set({ onboardingStep: 2 })
        .where(eq(users.id, userId));

      res.json({ success: true, interests: result });
    } catch (error) {
      console.error("Error selecting interests:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request", details: error.errors });
      }
      res.status(500).json({ error: "Failed to save interests" });
    }
  });

  // Update single interest affinity (for algorithm learning)
  app.patch("/api/interests/:interestSlug/affinity", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { interestSlug } = req.params;
    const { delta } = req.body as { delta: number };

    try {
      const [interest] = await db
        .select()
        .from(userInterests)
        .where(and(eq(userInterests.userId, userId), eq(userInterests.interest, interestSlug)));

      if (!interest) {
        return res.status(404).json({ error: "Interest not found" });
      }

      const newScore = Math.max(0.1, Math.min(10, (interest.affinityScore || 1) + delta));

      await db.update(userInterests)
        .set({ affinityScore: newScore, updatedAt: new Date() })
        .where(eq(userInterests.id, interest.id));

      res.json({ success: true, newScore });
    } catch (error) {
      console.error("Error updating affinity:", error);
      res.status(500).json({ error: "Failed to update affinity" });
    }
  });

  // Remove a single interest
  app.delete("/api/interests/:interestSlug", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { interestSlug } = req.params;

    try {
      await db.delete(userInterests)
        .where(and(eq(userInterests.userId, userId), eq(userInterests.interest, interestSlug)));

      res.json({ success: true });
    } catch (error) {
      console.error("Error removing interest:", error);
      res.status(500).json({ error: "Failed to remove interest" });
    }
  });

  // Update user industry
  app.post("/api/onboarding/industry", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { industry } = updateIndustrySchema.parse(req.body);

      await db.update(users)
        .set({ industry, onboardingStep: 3 })
        .where(eq(users.id, userId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating industry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid industry" });
      }
      res.status(500).json({ error: "Failed to update industry" });
    }
  });

  // Update net worth tier
  app.post("/api/onboarding/net-worth-tier", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { tier } = updateNetWorthTierSchema.parse(req.body);

      await db.update(users)
        .set({ netWorthTier: tier, onboardingStep: 4 })
        .where(eq(users.id, userId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating net worth tier:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid tier" });
      }
      res.status(500).json({ error: "Failed to update tier" });
    }
  });

  // Update privacy settings
  app.post("/api/onboarding/privacy", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const data = updatePrivacySchema.parse(req.body);

      await db.update(users)
        .set({ ...data, onboardingStep: 5 })
        .where(eq(users.id, userId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating privacy:", error);
      res.status(500).json({ error: "Failed to update privacy" });
    }
  });

  // Update onboarding step
  app.post("/api/onboarding/step", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { step } = updateOnboardingStepSchema.parse(req.body);

      await db.update(users)
        .set({ onboardingStep: step })
        .where(eq(users.id, userId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating step:", error);
      res.status(500).json({ error: "Failed to update step" });
    }
  });

  // Complete onboarding
  app.post("/api/onboarding/complete", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      await db.update(users)
        .set({ onboardingCompleted: true, onboardingStep: 7 })
        .where(eq(users.id, userId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  // Get onboarding status
  app.get("/api/onboarding/status", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const [user] = await db
        .select({
          onboardingCompleted: users.onboardingCompleted,
          onboardingStep: users.onboardingStep,
          industry: users.industry,
          netWorthTier: users.netWorthTier,
          netWorthVisibility: users.netWorthVisibility,
          profileVisibility: users.profileVisibility,
          firstSessionCompleted: users.firstSessionCompleted,
          avatarUrl: users.avatarUrl,
          phoneVerified: users.phoneVerified,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const interests = await db
        .select({ interest: userInterests.interest })
        .from(userInterests)
        .where(eq(userInterests.userId, userId));

      res.json({
        ...user,
        interests: interests.map(i => i.interest),
        hasInterests: interests.length > 0,
        hasAvatar: !!user.avatarUrl,
        hasIndustry: !!user.industry,
      });
    } catch (error) {
      console.error("Error fetching onboarding status:", error);
      res.status(500).json({ error: "Failed to fetch status" });
    }
  });

  // Get suggested users based on interests and industry
  app.get("/api/users/suggestions", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const limit = parseInt(req.query.limit as string) || 20;

      // Get current user
      const [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's interests
      const myInterests = await db
        .select({ interest: userInterests.interest })
        .from(userInterests)
        .where(eq(userInterests.userId, userId));

      const interestSlugs = myInterests.map(i => i.interest);

      // Get users already followed
      const following = await db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, userId));

      const followingIds = following.map(f => f.followingId);
      const excludeIds = [userId, ...followingIds];

      // Find users with matching interests or same industry
      let suggestions;
      
      if (interestSlugs.length > 0 || currentUser.industry) {
        // Get users with matching interests
        const matchingInterestUsers = interestSlugs.length > 0 ? await db
          .select({
            userId: userInterests.userId,
            matchCount: count(),
          })
          .from(userInterests)
          .where(inArray(userInterests.interest, interestSlugs))
          .groupBy(userInterests.userId)
          .orderBy(desc(count())) : [];

        const matchingUserIds = matchingInterestUsers.map(u => u.userId);

        // Get full user info for suggestions
        suggestions = await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
            bio: users.bio,
            isVerified: users.isVerified,
            netWorth: users.netWorth,
            influenceScore: users.influenceScore,
            industry: users.industry,
          })
          .from(users)
          .where(
            and(
              sql`${users.id} NOT IN (${sql.join(excludeIds.map(id => sql`${id}`), sql`, `)})`,
              isNull(users.suspendedAt),
              isNull(users.deactivatedAt),
              or(
                currentUser.industry ? eq(users.industry, currentUser.industry as any) : sql`1=0`,
                matchingUserIds.length > 0 ? inArray(users.id, matchingUserIds) : sql`1=0`,
                users.isVerified
              )
            )
          )
          .orderBy(desc(users.influenceScore), desc(users.netWorth))
          .limit(limit);
      } else {
        // Fallback: suggest verified and high-net-worth users
        suggestions = await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
            bio: users.bio,
            isVerified: users.isVerified,
            netWorth: users.netWorth,
            influenceScore: users.influenceScore,
            industry: users.industry,
          })
          .from(users)
          .where(
            and(
              sql`${users.id} NOT IN (${sql.join(excludeIds.map(id => sql`${id}`), sql`, `)})`,
              isNull(users.suspendedAt),
              isNull(users.deactivatedAt)
            )
          )
          .orderBy(desc(users.isVerified), desc(users.influenceScore), desc(users.netWorth))
          .limit(limit);
      }

      // Add match reason for each suggestion
      const enrichedSuggestions = suggestions.map(user => {
        const reasons: string[] = [];
        if (user.isVerified) reasons.push("verified");
        if (user.industry === currentUser.industry) reasons.push("same_industry");
        if ((user.netWorth || 0) > 1000000) reasons.push("high_net_worth");
        return { ...user, matchReasons: reasons };
      });

      res.json(enrichedSuggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  // Get preview posts (for pre-auth content preview)
  app.get("/api/posts/preview", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;

      // Get trending/featured posts for preview
      const previewPosts = await db
        .select({
          id: posts.id,
          type: posts.type,
          content: posts.content,
          caption: posts.caption,
          mediaUrl: posts.mediaUrl,
          thumbnailUrl: posts.thumbnailUrl,
          likesCount: posts.likesCount,
          commentsCount: posts.commentsCount,
          viewsCount: posts.viewsCount,
          createdAt: posts.createdAt,
          author: {
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
            isVerified: users.isVerified,
            netWorth: users.netWorth,
          },
        })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(
          and(
            eq(posts.visibility, "PUBLIC"),
            isNull(posts.deletedAt),
            eq(posts.isHidden, false),
            or(eq(posts.type, "VIDEO"), eq(posts.type, "PHOTO"))
          )
        )
        .orderBy(desc(posts.likesCount), desc(posts.viewsCount))
        .limit(limit);

      res.json(previewPosts);
    } catch (error) {
      console.error("Error fetching preview posts:", error);
      res.status(500).json({ error: "Failed to fetch preview" });
    }
  });

  // Analyze content and assign categories (AI-powered)
  app.post("/api/content/analyze", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ error: "Post ID required" });
    }

    try {
      // Get post
      const [post] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, postId));

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      // Get all categories
      const categories = await db
        .select()
        .from(interestCategories)
        .where(eq(interestCategories.isActive, true));

      const categoryNames = categories.map(c => c.name).join(", ");

      // Analyze content with AI
      let detectedCategories: { slug: string; confidence: number }[] = [];

      // Analyze text content
      if (post.content || post.caption) {
        const textContent = `${post.content || ""} ${post.caption || ""}`.trim();
        
        // Use AI to detect categories from text
        const textAnalysis = await moderateText(textContent);
        
        // Simple keyword matching as fallback
        const lowerText = textContent.toLowerCase();
        for (const cat of categories) {
          const keywords = cat.name.toLowerCase().split(/[&\s]+/);
          const matchScore = keywords.filter(k => lowerText.includes(k)).length / keywords.length;
          if (matchScore > 0.3) {
            detectedCategories.push({ slug: cat.slug, confidence: matchScore });
          }
        }
      }

      // Analyze image if present
      if (post.mediaUrl && (post.type === "PHOTO" || post.type === "VIDEO")) {
        try {
          const imageAnalysis = await analyzeImage(post.mediaUrl);
          const allLabels = [...(imageAnalysis.tags || []), ...(imageAnalysis.detectedObjects || [])];
          if (allLabels.length > 0) {
            const labels = allLabels.map((l: string) => l.toLowerCase());
            for (const cat of categories) {
              const catWords = cat.name.toLowerCase().split(/[&\s]+/);
              const matchScore = catWords.filter(w => 
                labels.some((l: string) => l.includes(w) || w.includes(l))
              ).length / catWords.length;
              if (matchScore > 0.2) {
                const existing = detectedCategories.find(d => d.slug === cat.slug);
                if (existing) {
                  existing.confidence = Math.min(1, existing.confidence + matchScore);
                } else {
                  detectedCategories.push({ slug: cat.slug, confidence: matchScore });
                }
              }
            }
          }
        } catch (imgError) {
          console.error("Image analysis error:", imgError);
        }
      }

      // Sort by confidence and take top 3
      detectedCategories.sort((a, b) => b.confidence - a.confidence);
      detectedCategories = detectedCategories.slice(0, 3);

      // Save to database
      if (detectedCategories.length > 0) {
        const categoryMap = new Map(categories.map(c => [c.slug, c.id]));
        
        // Delete existing categories for this post
        await db.delete(contentCategories).where(eq(contentCategories.postId, postId));

        // Insert new categories
        const inserts = detectedCategories.map(dc => ({
          postId,
          categoryId: categoryMap.get(dc.slug) || null,
          categorySlug: dc.slug,
          confidence: dc.confidence,
          analyzedBy: "gemini",
        }));

        await db.insert(contentCategories).values(inserts);
      }

      res.json({ 
        success: true, 
        categories: detectedCategories,
        analyzed: true 
      });
    } catch (error) {
      console.error("Error analyzing content:", error);
      res.status(500).json({ error: "Failed to analyze content" });
    }
  });

  // Mark first session complete
  app.post("/api/onboarding/first-session-complete", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      await db.update(users)
        .set({ firstSessionCompleted: true })
        .where(eq(users.id, userId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking first session complete:", error);
      res.status(500).json({ error: "Failed to update" });
    }
  });

  // Get algorithm transparency data
  app.get("/api/algorithm/preferences", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // Get user interests with affinity scores
      const interests = await db
        .select({
          interest: userInterests.interest,
          affinityScore: userInterests.affinityScore,
          category: interestCategories,
        })
        .from(userInterests)
        .leftJoin(interestCategories, eq(userInterests.categoryId, interestCategories.id))
        .where(eq(userInterests.userId, userId))
        .orderBy(desc(userInterests.affinityScore));

      // Get recent content interactions to show detected patterns
      const recentCategories = await db
        .select({
          slug: contentCategories.categorySlug,
          category: interestCategories,
        })
        .from(contentCategories)
        .innerJoin(posts, eq(contentCategories.postId, posts.id))
        .leftJoin(interestCategories, eq(contentCategories.categoryId, interestCategories.id))
        .where(eq(posts.authorId, userId))
        .limit(10);

      res.json({
        interests: interests.map(i => ({
          slug: i.interest,
          name: i.category?.name || i.interest,
          icon: i.category?.icon,
          color: i.category?.color,
          affinity: i.affinityScore,
        })),
        detectedPatterns: recentCategories.map(c => ({
          slug: c.slug,
          name: c.category?.name || c.slug,
        })),
      });
    } catch (error) {
      console.error("Error fetching algorithm preferences:", error);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  // Elite Circle - Top 5 wealthiest users from the Mall (real-time)
  app.get("/api/onboarding/elite-circle", async (req, res) => {
    try {
      // Get top 5 users by net worth, excluding users with hidden profiles or zero net worth
      const eliteUsers = await db
        .select({
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
          netWorth: users.netWorth,
          netWorthTier: users.netWorthTier,
          influenceScore: users.influenceScore,
          isVerified: users.isVerified,
          bio: users.bio,
          industry: users.industry,
        })
        .from(users)
        .where(
          and(
            sql`${users.netWorth} > 0`,
            sql`${users.profileVisibility} != 'NOBODY'`,
            sql`${users.netWorthVisibility} != 'NOBODY'`
          )
        )
        .orderBy(desc(users.netWorth))
        .limit(5);

      // Format the net worth for display
      const formattedUsers = eliteUsers.map((user, index) => ({
        ...user,
        rank: index + 1,
        formattedNetWorth: formatNetWorth(user.netWorth || 0),
        tierBadge: getTierBadge(user.netWorthTier || "BUILDING"),
      }));

      res.json({
        eliteCircle: formattedUsers,
        lastUpdated: new Date().toISOString(),
        totalEliteMembers: formattedUsers.length,
      });
    } catch (error) {
      console.error("Error fetching elite circle:", error);
      res.status(500).json({ error: "Failed to fetch elite circle" });
    }
  });

  console.log("Onboarding routes registered successfully");
}

// Helper function to format net worth for display
function formatNetWorth(netWorth: number): string {
  if (netWorth >= 1000000000) {
    return `$${(netWorth / 1000000000).toFixed(1)}B`;
  } else if (netWorth >= 1000000) {
    return `$${(netWorth / 1000000).toFixed(1)}M`;
  } else if (netWorth >= 1000) {
    return `$${(netWorth / 1000).toFixed(0)}K`;
  }
  return `$${netWorth.toLocaleString()}`;
}

// Helper function to get tier badge info
function getTierBadge(tier: string): { name: string; color: string; icon: string } {
  const tiers: Record<string, { name: string; color: string; icon: string }> = {
    BUILDING: { name: "Building", color: "#6B7280", icon: "trending-up" },
    SILVER: { name: "Silver", color: "#9CA3AF", icon: "award" },
    GOLD: { name: "Gold", color: "#F59E0B", icon: "star" },
    PLATINUM: { name: "Platinum", color: "#8B5CF6", icon: "zap" },
    DIAMOND: { name: "Diamond", color: "#06B6D4", icon: "diamond" },
  };
  return tiers[tier] || tiers.BUILDING;
}
