import { db } from "./db";
import { eq, desc, asc, and, or, sql, gte, lte, gt, like, inArray, isNull, isNotNull } from "drizzle-orm";
import {
  countries,
  zaLocations,
  anonGossipPosts,
  anonGossipReactions,
  anonGossipReplies,
  anonGossipReplyReactions,
  anonGossipReports,
  gossipSettings,
  gossipBlockedWords,
  gossipLocationStats,
  gossipEngagementVelocity,
  type Country,
  type ZaLocation,
  type AnonGossipPost,
  type AnonGossipReaction,
  type AnonGossipReply,
  type AnonGossipReport,
  type GossipSetting,
  type GossipBlockedWord,
  type GossipLocationStat,
  type AnonReactionType,
} from "@shared/schema";

export interface CreateAnonPostInput {
  deviceHash: string;
  countryCode?: string;
  zaLocationId?: string;
  locationDisplay?: string;
  type: "TEXT" | "VOICE";
  content?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  durationMs?: number;
  isWhisper?: boolean;
}

export interface AnonPostWithMeta extends AnonGossipPost {
  reactions?: AnonGossipReaction[];
  myReactions?: AnonReactionType[];
}

export interface GossipFeedFilters {
  countryCode?: string;
  zaLocationId?: string;
  province?: string;
  city?: string;
  kasi?: string;
  isWhisper?: boolean;
  sortBy?: "latest" | "trending" | "hottest";
  limit?: number;
  offset?: number;
  deviceHash?: string;
}

export class GossipStorage {
  async getCountries(activeOnly = true): Promise<Country[]> {
    if (activeOnly) {
      return db.select().from(countries).where(eq(countries.isActive, true)).orderBy(asc(countries.sortOrder));
    }
    return db.select().from(countries).orderBy(asc(countries.sortOrder));
  }

  async getCountryByCode(code: string): Promise<Country | undefined> {
    const [country] = await db.select().from(countries).where(eq(countries.code, code));
    return country;
  }

  async getZaLocations(filters: { province?: string; city?: string; level?: number } = {}): Promise<ZaLocation[]> {
    const conditions = [eq(zaLocations.isActive, true)];
    
    if (filters.province) {
      conditions.push(eq(zaLocations.province, filters.province));
    }
    if (filters.city) {
      conditions.push(eq(zaLocations.city, filters.city));
    }
    if (filters.level !== undefined) {
      conditions.push(eq(zaLocations.level, filters.level));
    }

    return db.select().from(zaLocations).where(and(...conditions)).orderBy(asc(zaLocations.fullPath));
  }

  async getZaLocationById(id: string): Promise<ZaLocation | undefined> {
    const [location] = await db.select().from(zaLocations).where(eq(zaLocations.id, id));
    return location;
  }

  async searchZaLocations(query: string, limit = 20): Promise<ZaLocation[]> {
    return db.select()
      .from(zaLocations)
      .where(and(
        eq(zaLocations.isActive, true),
        like(zaLocations.fullPath, `%${query}%`)
      ))
      .orderBy(asc(zaLocations.level), asc(zaLocations.fullPath))
      .limit(limit);
  }

  async detectLocationFromCoords(latitude: number, longitude: number): Promise<{
    countryCode: string;
    countryName: string;
    province?: string;
    city?: string;
    kasi?: string;
    zaLocationId?: string;
    locationDisplay: string;
  } | null> {
    const southernAfricaBounds: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
      ZA: { minLat: -35.0, maxLat: -22.0, minLng: 16.0, maxLng: 33.0 },
      BW: { minLat: -27.0, maxLat: -18.0, minLng: 20.0, maxLng: 29.5 },
      LS: { minLat: -30.7, maxLat: -28.5, minLng: 27.0, maxLng: 29.5 },
      SZ: { minLat: -27.3, maxLat: -25.7, minLng: 30.8, maxLng: 32.2 },
      NA: { minLat: -29.0, maxLat: -17.0, minLng: 11.5, maxLng: 25.5 },
      ZW: { minLat: -22.5, maxLat: -15.5, minLng: 25.0, maxLng: 33.0 },
      MZ: { minLat: -27.0, maxLat: -10.5, minLng: 30.0, maxLng: 41.0 },
      MW: { minLat: -17.2, maxLat: -9.3, minLng: 32.5, maxLng: 36.0 },
      ZM: { minLat: -18.1, maxLat: -8.2, minLng: 22.0, maxLng: 33.7 },
      AO: { minLat: -18.1, maxLat: -4.4, minLng: 11.7, maxLng: 24.1 },
    };

    let detectedCountryCode: string | null = null;
    
    for (const [code, bounds] of Object.entries(southernAfricaBounds)) {
      if (latitude >= bounds.minLat && latitude <= bounds.maxLat &&
          longitude >= bounds.minLng && longitude <= bounds.maxLng) {
        detectedCountryCode = code;
        break;
      }
    }

    if (!detectedCountryCode) {
      return null;
    }

    const country = await this.getCountryByCode(detectedCountryCode);
    if (!country || !country.isActive) {
      return null;
    }

    if (detectedCountryCode === 'ZA') {
      const allLocations = await db.select()
        .from(zaLocations)
        .where(and(
          eq(zaLocations.isActive, true),
          eq(zaLocations.level, 3),
          isNotNull(zaLocations.latitude),
          isNotNull(zaLocations.longitude)
        ));

      let nearestLocation: typeof allLocations[0] | null = null;
      let minDistance = Infinity;

      for (const loc of allLocations) {
        if (loc.latitude !== null && loc.longitude !== null) {
          const distance = Math.sqrt(
            Math.pow(latitude - loc.latitude, 2) + 
            Math.pow(longitude - loc.longitude, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestLocation = loc;
          }
        }
      }

      // Increased threshold to 1.5 degrees (~165km) for better matching
      if (nearestLocation && minDistance < 1.5) {
        return {
          countryCode: 'ZA',
          countryName: country.name,
          province: nearestLocation.province,
          city: nearestLocation.city || undefined,
          kasi: nearestLocation.kasi || undefined,
          zaLocationId: nearestLocation.id,
          locationDisplay: nearestLocation.fullPath,
        };
      }

      // Expanded province bounds to eliminate gaps and cover all of SA
      const provinceBounds: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
        'Gauteng': { minLat: -27.0, maxLat: -25.0, minLng: 27.0, maxLng: 29.5 },
        'Western Cape': { minLat: -35.0, maxLat: -31.0, minLng: 17.0, maxLng: 24.0 },
        'KwaZulu-Natal': { minLat: -31.5, maxLat: -26.5, minLng: 28.5, maxLng: 33.0 },
        'Eastern Cape': { minLat: -34.5, maxLat: -30.0, minLng: 23.5, maxLng: 30.5 },
        'Mpumalanga': { minLat: -27.5, maxLat: -24.0, minLng: 28.5, maxLng: 32.5 },
        'Limpopo': { minLat: -25.5, maxLat: -22.0, minLng: 26.0, maxLng: 32.0 },
        'Free State': { minLat: -31.0, maxLat: -26.0, minLng: 24.0, maxLng: 30.0 },
        'North West': { minLat: -28.5, maxLat: -24.0, minLng: 22.0, maxLng: 28.5 },
        'Northern Cape': { minLat: -33.0, maxLat: -26.0, minLng: 16.0, maxLng: 25.0 },
      };

      for (const [province, bounds] of Object.entries(provinceBounds)) {
        if (latitude >= bounds.minLat && latitude <= bounds.maxLat &&
            longitude >= bounds.minLng && longitude <= bounds.maxLng) {
          const cities = await db.select()
            .from(zaLocations)
            .where(and(
              eq(zaLocations.isActive, true),
              eq(zaLocations.province, province),
              eq(zaLocations.level, 2)
            ))
            .limit(1);

          if (cities.length > 0 && cities[0].city) {
            const kasis = await db.select()
              .from(zaLocations)
              .where(and(
                eq(zaLocations.isActive, true),
                eq(zaLocations.province, province),
                eq(zaLocations.city, cities[0].city),
                eq(zaLocations.level, 3)
              ))
              .limit(1);

            if (kasis.length > 0) {
              return {
                countryCode: 'ZA',
                countryName: country.name,
                province: kasis[0].province,
                city: kasis[0].city || undefined,
                kasi: kasis[0].kasi || undefined,
                zaLocationId: kasis[0].id,
                locationDisplay: kasis[0].fullPath,
              };
            }
          }

          return {
            countryCode: 'ZA',
            countryName: country.name,
            province: province,
            locationDisplay: `South Africa > ${province}`,
          };
        }
      }

      // Final fallback: return SA at country level if no province matched
      // This ensures users in SA always get detected even if in an unmapped area
      return {
        countryCode: 'ZA',
        countryName: country.name,
        locationDisplay: 'South Africa',
      };
    }

    return {
      countryCode: detectedCountryCode,
      countryName: country.name,
      locationDisplay: country.name,
    };
  }

  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(gossipSettings).where(eq(gossipSettings.key, key));
    return setting?.value ?? null;
  }

  async updateSetting(key: string, value: string, updatedBy?: string): Promise<GossipSetting | undefined> {
    const [setting] = await db.update(gossipSettings)
      .set({ value, updatedBy, updatedAt: new Date() })
      .where(eq(gossipSettings.key, key))
      .returning();
    return setting;
  }

  async getAllSettings(): Promise<GossipSetting[]> {
    return db.select().from(gossipSettings);
  }

  async getBlockedWords(): Promise<GossipBlockedWord[]> {
    return db.select().from(gossipBlockedWords).orderBy(asc(gossipBlockedWords.word));
  }

  async addBlockedWord(word: string, isRegex = false, severity = 1, addedBy?: string): Promise<GossipBlockedWord | undefined> {
    const [blocked] = await db.insert(gossipBlockedWords)
      .values({ word: word.toLowerCase(), isRegex, severity, addedBy })
      .onConflictDoNothing()
      .returning();
    return blocked;
  }

  async removeBlockedWord(id: string): Promise<boolean> {
    const result = await db.delete(gossipBlockedWords).where(eq(gossipBlockedWords.id, id));
    return true;
  }

  async checkContentAgainstBlockedWords(content: string): Promise<{ isBlocked: boolean; matchedWords: string[]; severity: number }> {
    const words = await this.getBlockedWords();
    const lowerContent = content.toLowerCase();
    const matchedWords: string[] = [];
    let maxSeverity = 0;

    for (const blocked of words) {
      let matched = false;
      if (blocked.isRegex) {
        try {
          const regex = new RegExp(blocked.word, 'i');
          matched = regex.test(content);
        } catch {
          matched = lowerContent.includes(blocked.word);
        }
      } else {
        matched = lowerContent.includes(blocked.word);
      }

      if (matched) {
        matchedWords.push(blocked.word);
        maxSeverity = Math.max(maxSeverity, blocked.severity);
      }
    }

    return {
      isBlocked: matchedWords.length > 0,
      matchedWords,
      severity: maxSeverity
    };
  }

  async checkRateLimit(deviceHash: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const maxPostsStr = await this.getSetting("max_posts_per_hour") || "10";
    const maxPosts = parseInt(maxPostsStr, 10);
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const [result] = await db.select({ count: sql<number>`count(*)::int` })
      .from(anonGossipPosts)
      .where(and(
        eq(anonGossipPosts.deviceHash, deviceHash),
        gte(anonGossipPosts.createdAt, oneHourAgo)
      ));

    const count = result?.count || 0;
    const remaining = Math.max(0, maxPosts - count);
    const resetAt = new Date(Date.now() + 60 * 60 * 1000);

    return {
      allowed: count < maxPosts,
      remaining,
      resetAt
    };
  }

  async createAnonPost(input: CreateAnonPostInput): Promise<AnonGossipPost | undefined> {
    let whisperExpiresAt: Date | null = null;
    
    if (input.isWhisper) {
      const durationStr = await this.getSetting("whisper_duration_hours") || "24";
      const hours = parseInt(durationStr, 10);
      whisperExpiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    const [post] = await db.insert(anonGossipPosts).values({
      deviceHash: input.deviceHash,
      countryCode: input.countryCode,
      zaLocationId: input.zaLocationId,
      locationDisplay: input.locationDisplay,
      type: input.type,
      content: input.content,
      mediaUrl: input.mediaUrl,
      thumbnailUrl: input.thumbnailUrl,
      durationMs: input.durationMs,
      isWhisper: input.isWhisper || false,
      whisperExpiresAt,
    }).returning();

    if (post && input.zaLocationId) {
      await this.incrementLocationStats(input.zaLocationId, input.locationDisplay || "");
    } else if (post && input.countryCode) {
      await this.incrementLocationStats(`country_${input.countryCode}`, input.countryCode);
    }

    return post;
  }

  async getAnonPost(id: string, deviceHash?: string): Promise<AnonPostWithMeta | undefined> {
    const [post] = await db.select()
      .from(anonGossipPosts)
      .where(and(
        eq(anonGossipPosts.id, id),
        eq(anonGossipPosts.isHidden, false),
        eq(anonGossipPosts.isRemovedByAdmin, false)
      ));

    if (!post) return undefined;

    const myReactions: AnonReactionType[] = [];
    if (deviceHash) {
      const reactions = await db.select({ reactionType: anonGossipReactions.reactionType })
        .from(anonGossipReactions)
        .where(and(
          eq(anonGossipReactions.postId, id),
          eq(anonGossipReactions.deviceHash, deviceHash)
        ));
      
      myReactions.push(...reactions.map(r => r.reactionType));
    }

    return { ...post, myReactions };
  }

  async getAnonFeed(filters: GossipFeedFilters): Promise<AnonPostWithMeta[]> {
    const conditions = [
      eq(anonGossipPosts.isHidden, false),
      eq(anonGossipPosts.isRemovedByAdmin, false)
    ];

    if (filters.countryCode) {
      conditions.push(eq(anonGossipPosts.countryCode, filters.countryCode));
    }
    if (filters.zaLocationId) {
      conditions.push(eq(anonGossipPosts.zaLocationId, filters.zaLocationId));
    }
    if (filters.isWhisper !== undefined) {
      conditions.push(eq(anonGossipPosts.isWhisper, filters.isWhisper));
    }

    conditions.push(
      or(
        eq(anonGossipPosts.isWhisper, false),
        and(
          eq(anonGossipPosts.isWhisper, true),
          gte(anonGossipPosts.whisperExpiresAt, new Date())
        )
      )!
    );

    let orderBy;
    switch (filters.sortBy) {
      case "trending":
        orderBy = desc(anonGossipPosts.teaMeter);
        break;
      case "hottest":
        orderBy = desc(sql`${anonGossipPosts.fireCount} + ${anonGossipPosts.mindblownCount}`);
        break;
      case "latest":
      default:
        orderBy = desc(anonGossipPosts.createdAt);
    }

    const posts = await db.select()
      .from(anonGossipPosts)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(filters.limit || 20)
      .offset(filters.offset || 0);

    const postsWithMeta: AnonPostWithMeta[] = [];

    for (const post of posts) {
      const myReactions: AnonReactionType[] = [];
      
      if (filters.deviceHash) {
        const reactions = await db.select({ reactionType: anonGossipReactions.reactionType })
          .from(anonGossipReactions)
          .where(and(
            eq(anonGossipReactions.postId, post.id),
            eq(anonGossipReactions.deviceHash, filters.deviceHash)
          ));
        
        myReactions.push(...reactions.map(r => r.reactionType));
      }

      postsWithMeta.push({ ...post, myReactions });
    }

    return postsWithMeta;
  }

  async toggleReaction(postId: string, deviceHash: string, reactionType: AnonReactionType): Promise<{ added: boolean; post: AnonGossipPost | undefined }> {
    const [existing] = await db.select()
      .from(anonGossipReactions)
      .where(and(
        eq(anonGossipReactions.postId, postId),
        eq(anonGossipReactions.deviceHash, deviceHash),
        eq(anonGossipReactions.reactionType, reactionType)
      ));

    const columnMap: Record<AnonReactionType, string> = {
      FIRE: "fire_count",
      MINDBLOWN: "mindblown_count",
      LAUGH: "laugh_count",
      SKULL: "skull_count",
      EYES: "eyes_count"
    };
    const colName = columnMap[reactionType];

    if (existing) {
      await db.delete(anonGossipReactions).where(eq(anonGossipReactions.id, existing.id));
      
      await db.execute(sql.raw(`UPDATE anon_gossip_posts SET ${colName} = GREATEST(0, ${colName} - 1) WHERE id = '${postId}'`));
      const [post] = await db.select().from(anonGossipPosts).where(eq(anonGossipPosts.id, postId));
      
      await this.recalculateTeaMeter(postId);
      return { added: false, post };
    } else {
      await db.insert(anonGossipReactions).values({ postId, deviceHash, reactionType });
      
      await db.execute(sql.raw(`UPDATE anon_gossip_posts SET ${colName} = ${colName} + 1 WHERE id = '${postId}'`));
      const [post] = await db.select().from(anonGossipPosts).where(eq(anonGossipPosts.id, postId));
      
      await this.recalculateTeaMeter(postId);
      await this.recordVelocity(postId);
      return { added: true, post };
    }
  }

  async recalculateTeaMeter(postId: string): Promise<void> {
    const [post] = await db.select().from(anonGossipPosts).where(eq(anonGossipPosts.id, postId));
    if (!post) return;

    const hoursOld = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);

    const teaMeter = Math.max(0, Math.floor(
      (post.fireCount * 3) +
      (post.mindblownCount * 3) +
      (post.laughCount * 2) +
      (post.skullCount * 2) +
      (post.eyesCount * 1) +
      (post.replyCount * 2) -
      (hoursOld * 1)
    ));

    await db.update(anonGossipPosts)
      .set({ teaMeter, updatedAt: new Date() })
      .where(eq(anonGossipPosts.id, postId));
  }

  async recordVelocity(postId: string): Promise<void> {
    const [post] = await db.select().from(anonGossipPosts).where(eq(anonGossipPosts.id, postId));
    if (!post) return;

    const hourNumber = Math.floor((Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
    if (hourNumber > 24) return;

    const velocityScore = hourNumber === 0 ? 3.0 : hourNumber <= 1 ? 2.0 : 1.0;

    await db.insert(gossipEngagementVelocity)
      .values({
        postId,
        hourNumber,
        reactions: 1,
        replies: 0,
        views: 0,
        velocityScore
      })
      .onConflictDoUpdate({
        target: [gossipEngagementVelocity.postId, gossipEngagementVelocity.hourNumber],
        set: {
          reactions: sql`${gossipEngagementVelocity.reactions} + 1`,
          recordedAt: new Date()
        }
      });
  }

  async createReply(postId: string, deviceHash: string, content: string, parentReplyId?: string): Promise<AnonGossipReply | undefined> {
    const maxDepthStr = await this.getSetting("max_reply_depth") || "2";
    const maxDepth = parseInt(maxDepthStr, 10);

    let depth = 1;
    if (parentReplyId) {
      const [parentReply] = await db.select().from(anonGossipReplies).where(eq(anonGossipReplies.id, parentReplyId));
      if (!parentReply) return undefined;
      if (parentReply.depth >= maxDepth) return undefined;
      depth = parentReply.depth + 1;
    }

    const [reply] = await db.insert(anonGossipReplies).values({
      postId,
      parentReplyId,
      deviceHash,
      content,
      depth
    }).returning();

    if (reply) {
      await db.execute(sql.raw(`UPDATE anon_gossip_posts SET reply_count = reply_count + 1 WHERE id = '${postId}'`));
      await this.recalculateTeaMeter(postId);
    }

    return reply;
  }

  async getReplies(postId: string, deviceHash?: string): Promise<AnonGossipReply[]> {
    const replies = await db.select()
      .from(anonGossipReplies)
      .where(and(
        eq(anonGossipReplies.postId, postId),
        eq(anonGossipReplies.isHidden, false),
        eq(anonGossipReplies.isRemovedByAdmin, false)
      ))
      .orderBy(asc(anonGossipReplies.createdAt));

    return replies;
  }

  async toggleReplyReaction(replyId: string, deviceHash: string, reactionType: AnonReactionType): Promise<{ added: boolean }> {
    const [existing] = await db.select()
      .from(anonGossipReplyReactions)
      .where(and(
        eq(anonGossipReplyReactions.replyId, replyId),
        eq(anonGossipReplyReactions.deviceHash, deviceHash),
        eq(anonGossipReplyReactions.reactionType, reactionType)
      ));

    const columnMap: Record<AnonReactionType, string> = {
      FIRE: "fire_count",
      MINDBLOWN: "mindblown_count",
      LAUGH: "laugh_count",
      SKULL: "skull_count",
      EYES: "eyes_count"
    };
    const colName = columnMap[reactionType];

    if (existing) {
      await db.delete(anonGossipReplyReactions).where(eq(anonGossipReplyReactions.id, existing.id));
      await db.execute(sql.raw(`UPDATE anon_gossip_replies SET ${colName} = GREATEST(0, ${colName} - 1) WHERE id = '${replyId}'`));
      return { added: false };
    } else {
      await db.insert(anonGossipReplyReactions).values({ replyId, deviceHash, reactionType });
      await db.execute(sql.raw(`UPDATE anon_gossip_replies SET ${colName} = ${colName} + 1 WHERE id = '${replyId}'`));
      return { added: true };
    }
  }

  async reportPost(postId: string, deviceHash: string, reason: string): Promise<AnonGossipReport | undefined> {
    const [report] = await db.insert(anonGossipReports).values({
      postId,
      deviceHash,
      reason
    }).returning();

    if (report) {
      await db.update(anonGossipPosts)
        .set({ reportCount: sql`${anonGossipPosts.reportCount} + 1` })
        .where(eq(anonGossipPosts.id, postId));

      const reportsToHideStr = await this.getSetting("reports_to_auto_hide") || "5";
      const reportsToHide = parseInt(reportsToHideStr, 10);

      const [post] = await db.select({ reportCount: anonGossipPosts.reportCount })
        .from(anonGossipPosts)
        .where(eq(anonGossipPosts.id, postId));

      if (post && post.reportCount >= reportsToHide) {
        await db.update(anonGossipPosts)
          .set({ isHidden: true })
          .where(eq(anonGossipPosts.id, postId));
      }
    }

    return report;
  }

  async reportReply(replyId: string, deviceHash: string, reason: string): Promise<AnonGossipReport | undefined> {
    const [report] = await db.insert(anonGossipReports).values({
      replyId,
      deviceHash,
      reason
    }).returning();

    return report;
  }

  async getPendingReports(limit = 50, offset = 0): Promise<AnonGossipReport[]> {
    return db.select()
      .from(anonGossipReports)
      .where(eq(anonGossipReports.status, "PENDING"))
      .orderBy(desc(anonGossipReports.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async reviewReport(reportId: string, status: "REVIEWED" | "DISMISSED" | "REMOVED", reviewedBy: string, notes?: string): Promise<AnonGossipReport | undefined> {
    const [report] = await db.update(anonGossipReports)
      .set({
        status,
        reviewedBy,
        reviewedAt: new Date(),
        reviewNotes: notes
      })
      .where(eq(anonGossipReports.id, reportId))
      .returning();

    if (report && status === "REMOVED") {
      if (report.postId) {
        await db.update(anonGossipPosts)
          .set({
            isRemovedByAdmin: true,
            removedReason: notes,
            removedAt: new Date(),
            removedBy: reviewedBy
          })
          .where(eq(anonGossipPosts.id, report.postId));
      }
      if (report.replyId) {
        await db.update(anonGossipReplies)
          .set({
            isRemovedByAdmin: true,
            removedReason: notes,
            removedAt: new Date(),
            removedBy: reviewedBy
          })
          .where(eq(anonGossipReplies.id, report.replyId));
      }
    }

    return report;
  }

  async removePost(postId: string, reason: string, removedBy: string): Promise<AnonGossipPost | undefined> {
    const [post] = await db.update(anonGossipPosts)
      .set({
        isRemovedByAdmin: true,
        removedReason: reason,
        removedAt: new Date(),
        removedBy
      })
      .where(eq(anonGossipPosts.id, postId))
      .returning();

    return post;
  }

  async incrementLocationStats(locationId: string, locationDisplay: string): Promise<void> {
    const locationType = locationId.startsWith("country_") ? "country" : 
                         locationId.startsWith("prov_") ? "province" :
                         locationId.startsWith("city_") ? "city" : "kasi";

    await db.insert(gossipLocationStats)
      .values({
        locationType,
        locationId,
        locationDisplay,
        totalPosts: 1,
        postsToday: 1,
        postsThisWeek: 1,
        lastPostAt: new Date()
      })
      .onConflictDoUpdate({
        target: [gossipLocationStats.locationType, gossipLocationStats.locationId],
        set: {
          totalPosts: sql`${gossipLocationStats.totalPosts} + 1`,
          postsToday: sql`${gossipLocationStats.postsToday} + 1`,
          postsThisWeek: sql`${gossipLocationStats.postsThisWeek} + 1`,
          lastPostAt: new Date(),
          updatedAt: new Date()
        }
      });

    await this.checkMilestones(locationId);
  }

  async checkMilestones(locationId: string): Promise<number | null> {
    const milestonesStr = await this.getSetting("milestones") || "100,500,1000,5000,10000";
    const milestones = milestonesStr.split(",").map(m => parseInt(m.trim(), 10)).sort((a, b) => b - a);

    const [stats] = await db.select()
      .from(gossipLocationStats)
      .where(eq(gossipLocationStats.locationId, locationId));

    if (!stats) return null;

    for (const milestone of milestones) {
      if (stats.totalPosts >= milestone && stats.milestoneReached < milestone) {
        await db.update(gossipLocationStats)
          .set({ milestoneReached: milestone })
          .where(eq(gossipLocationStats.id, stats.id));
        return milestone;
      }
    }

    return null;
  }

  async getTrendingLocations(limit = 10): Promise<GossipLocationStat[]> {
    return db.select()
      .from(gossipLocationStats)
      .orderBy(desc(gossipLocationStats.trendingScore))
      .limit(limit);
  }

  async getLeaderboard(limit = 10): Promise<GossipLocationStat[]> {
    return db.select()
      .from(gossipLocationStats)
      .orderBy(desc(gossipLocationStats.totalPosts))
      .limit(limit);
  }

  async getStreakLeaders(limit = 10): Promise<GossipLocationStat[]> {
    return db.select()
      .from(gossipLocationStats)
      .where(gte(gossipLocationStats.streakDays, 1))
      .orderBy(desc(gossipLocationStats.streakDays))
      .limit(limit);
  }

  async cleanupExpiredWhispers(): Promise<number> {
    const result = await db.delete(anonGossipPosts)
      .where(and(
        eq(anonGossipPosts.isWhisper, true),
        lte(anonGossipPosts.whisperExpiresAt, new Date())
      ));

    return 0;
  }

  async recalculateTrendingScores(): Promise<void> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats = await db.select().from(gossipLocationStats);

    for (const stat of stats) {
      const [postsCount] = await db.select({ count: sql<number>`count(*)::int` })
        .from(anonGossipPosts)
        .where(and(
          eq(anonGossipPosts.zaLocationId, stat.locationId),
          gte(anonGossipPosts.createdAt, oneDayAgo)
        ));

      const recentPosts = postsCount?.count || 0;
      const trendingScore = (recentPosts * 2) + (stat.streakDays * 0.5);

      await db.update(gossipLocationStats)
        .set({
          postsToday: recentPosts,
          trendingScore,
          lastCalculatedAt: now
        })
        .where(eq(gossipLocationStats.id, stat.id));
    }
  }

  async updateDailyStreaks(): Promise<void> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const stats = await db.select().from(gossipLocationStats);

    for (const stat of stats) {
      if (stat.lastPostAt && stat.lastPostAt >= yesterday) {
        await db.update(gossipLocationStats)
          .set({
            streakDays: stat.streakDays + 1,
            postsThisWeek: stat.postsThisWeek,
            updatedAt: now
          })
          .where(eq(gossipLocationStats.id, stat.id));
      } else if (stat.lastPostAt && stat.lastPostAt < yesterday) {
        await db.update(gossipLocationStats)
          .set({
            streakDays: 0,
            updatedAt: now
          })
          .where(eq(gossipLocationStats.id, stat.id));
      }
    }
  }

  async resetWeeklyStats(): Promise<void> {
    await db.update(gossipLocationStats).set({ postsThisWeek: 0 });
  }

  async getGossipAnalytics(): Promise<{
    totalPosts: number;
    postsToday: number;
    totalReactions: number;
    pendingReports: number;
    activeLocations: number;
    whisperPosts: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalPostsResult] = await db.select({ count: sql<number>`count(*)::int` }).from(anonGossipPosts);
    const [postsTodayResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(anonGossipPosts)
      .where(gte(anonGossipPosts.createdAt, today));
    const [reactionsResult] = await db.select({ count: sql<number>`count(*)::int` }).from(anonGossipReactions);
    const [pendingResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(anonGossipReports)
      .where(eq(anonGossipReports.status, "PENDING"));
    const [locationsResult] = await db.select({ count: sql<number>`count(*)::int` }).from(gossipLocationStats);
    const [whisperResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(anonGossipPosts)
      .where(eq(anonGossipPosts.isWhisper, true));

    return {
      totalPosts: totalPostsResult?.count || 0,
      postsToday: postsTodayResult?.count || 0,
      totalReactions: reactionsResult?.count || 0,
      pendingReports: pendingResult?.count || 0,
      activeLocations: locationsResult?.count || 0,
      whisperPosts: whisperResult?.count || 0
    };
  }

  // Admin Panel Methods
  async getAdminStats(): Promise<{
    totalPosts: number;
    postsToday: number;
    reportedPosts: number;
    hiddenPosts: number;
    activeWhispers: number;
    totalReactions: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(anonGossipPosts);
    const [todayCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(anonGossipPosts)
      .where(gte(anonGossipPosts.createdAt, today));
    const [reported] = await db.select({ count: sql<number>`count(*)::int` })
      .from(anonGossipPosts)
      .where(gt(anonGossipPosts.reportCount, 0));
    const [hidden] = await db.select({ count: sql<number>`count(*)::int` })
      .from(anonGossipPosts)
      .where(eq(anonGossipPosts.isHidden, true));
    const [whispers] = await db.select({ count: sql<number>`count(*)::int` })
      .from(anonGossipPosts)
      .where(and(
        eq(anonGossipPosts.isWhisper, true),
        isNotNull(anonGossipPosts.whisperExpiresAt)
      ));
    const [reactions] = await db.select({ count: sql<number>`count(*)::int` }).from(anonGossipReactions);

    return {
      totalPosts: total?.count || 0,
      postsToday: todayCount?.count || 0,
      reportedPosts: reported?.count || 0,
      hiddenPosts: hidden?.count || 0,
      activeWhispers: whispers?.count || 0,
      totalReactions: reactions?.count || 0
    };
  }

  async getAdminPosts(filter: string): Promise<AnonGossipPost[]> {
    let query = db.select().from(anonGossipPosts);
    
    switch (filter) {
      case "reported":
        query = query.where(gt(anonGossipPosts.reportCount, 0)) as any;
        break;
      case "hidden":
        query = query.where(eq(anonGossipPosts.isHidden, true)) as any;
        break;
      case "removed":
        query = query.where(eq(anonGossipPosts.isRemovedByAdmin, true)) as any;
        break;
      case "all":
      default:
        break;
    }
    
    return query.orderBy(desc(anonGossipPosts.createdAt)).limit(100);
  }

  async hidePost(postId: string): Promise<void> {
    await db.update(anonGossipPosts)
      .set({ isHidden: true, updatedAt: new Date() })
      .where(eq(anonGossipPosts.id, postId));
  }

  async unhidePost(postId: string): Promise<void> {
    await db.update(anonGossipPosts)
      .set({ isHidden: false, updatedAt: new Date() })
      .where(eq(anonGossipPosts.id, postId));
  }

  async getLocationStatsForAdmin(): Promise<GossipLocationStat[]> {
    return db.select()
      .from(gossipLocationStats)
      .orderBy(desc(gossipLocationStats.totalPosts))
      .limit(50);
  }
}

export const gossipStorage = new GossipStorage();
