import { Router, Request, Response } from "express";
import { db } from "./db";
import { 
  gossipLocations, 
  anonGossipPosts, 
  anonGossipReactions,
  anonGossipReplies,
  gossipReposts,
  gossipSaves,
  gossipPostFollows,
  gossipPolls,
  gossipPollVotes,
  gossipAccuracyVotes,
  teaSpillerStats,
  gossipHashtags,
  gossipPostHashtags,
  gossipPostViews,
  gossipTrendingHashtags,
  gossipDMConversations,
  gossipDMMessages,
  anonGossipReports,
  gossipPostLinks,
  hoodRivalries,
  gossipAwards,
  gossipLocalLegends,
  gossipSpillSessions,
} from "@shared/schema";
import { eq, and, sql, desc, asc, isNull, like, gte, count } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";

const router = Router();

const ADJECTIVES = [
  "Anonymous", "Mysterious", "Shadow", "Secret", "Hidden", "Unknown",
  "Silent", "Phantom", "Ghost", "Invisible", "Masked", "Veiled",
  "Midnight", "Twilight", "Whisper", "Stealth", "Covert", "Cryptic"
];

const NOUNS = [
  "Witness", "Insider", "Source", "Spiller", "Observer", "Tipster",
  "Informant", "Whisperer", "Reporter", "Messenger", "Bearer", "Sage",
  "Oracle", "Seer", "Watcher", "Scout", "Agent", "Hawk"
];

const EMOJIS = ["🕵️", "👤", "🎭", "👻", "🌙", "🦉", "🐱‍👤", "🔮", "💫", "✨"];

function generateAlias(): { name: string; emoji: string } {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 100);
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  return { name: `${adj}${noun}${num}`, emoji };
}

function hashDevice(identifier: string): string {
  return crypto.createHash("sha256").update(identifier + "rabitchat-gossip-salt").digest("hex");
}

// WebSocket connections for gossip real-time updates
// Track clients by location for broadcasting new posts
import WebSocket from "ws";

// Map of locationId -> Set of WebSocket clients subscribed to that location
const gossipLocationClients = new Map<string, Set<WebSocket>>();
// Map of deviceHash -> Set of WebSocket clients for DM notifications
const gossipDeviceClients = new Map<string, Set<WebSocket>>();

export function subscribeToGossipLocation(locationId: string, ws: WebSocket) {
  if (!gossipLocationClients.has(locationId)) {
    gossipLocationClients.set(locationId, new Set());
  }
  gossipLocationClients.get(locationId)!.add(ws);
}

export function unsubscribeFromGossipLocation(locationId: string, ws: WebSocket) {
  const clients = gossipLocationClients.get(locationId);
  if (clients) {
    clients.delete(ws);
    if (clients.size === 0) {
      gossipLocationClients.delete(locationId);
    }
  }
}

export function subscribeToGossipDevice(deviceHash: string, ws: WebSocket) {
  if (!gossipDeviceClients.has(deviceHash)) {
    gossipDeviceClients.set(deviceHash, new Set());
  }
  gossipDeviceClients.get(deviceHash)!.add(ws);
}

export function unsubscribeFromGossipDevice(deviceHash: string, ws: WebSocket) {
  const clients = gossipDeviceClients.get(deviceHash);
  if (clients) {
    clients.delete(ws);
    if (clients.size === 0) {
      gossipDeviceClients.delete(deviceHash);
    }
  }
}

export function broadcastNewGossipPost(locationId: string, post: any) {
  const clients = gossipLocationClients.get(locationId);
  if (clients && clients.size > 0) {
    const message = JSON.stringify({
      type: "GOSSIP_NEW_POST",
      data: { post, locationId }
    });
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

export function broadcastGossipReaction(locationId: string, postId: string, reactionType: string, count: number) {
  const clients = gossipLocationClients.get(locationId);
  if (clients && clients.size > 0) {
    const message = JSON.stringify({
      type: "GOSSIP_REACTION_UPDATE",
      data: { postId, reactionType, count, locationId }
    });
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

export function broadcastGossipDM(deviceHash: string, conversationId: string, messagePreview: string) {
  const clients = gossipDeviceClients.get(deviceHash);
  if (clients && clients.size > 0) {
    const message = JSON.stringify({
      type: "GOSSIP_NEW_DM",
      data: { conversationId, messagePreview }
    });
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

export function getGossipConnectionStats() {
  let totalLocationClients = 0;
  gossipLocationClients.forEach((clients) => {
    totalLocationClients += clients.size;
  });
  let totalDeviceClients = 0;
  gossipDeviceClients.forEach((clients) => {
    totalDeviceClients += clients.size;
  });
  return {
    locations: gossipLocationClients.size,
    locationConnections: totalLocationClients,
    devices: gossipDeviceClients.size,
    deviceConnections: totalDeviceClients
  };
}

router.get("/locations", async (_req: Request, res: Response) => {
  try {
    const country = await db
      .select()
      .from(gossipLocations)
      .where(eq(gossipLocations.type, "COUNTRY"))
      .limit(1);
    
    if (country.length === 0) {
      return res.status(404).json({ error: "No country found" });
    }

    return res.json({ country: country[0] });
  } catch (error) {
    console.error("Error fetching country:", error);
    return res.status(500).json({ error: "Failed to fetch country" });
  }
});

router.get("/locations/provinces", async (_req: Request, res: Response) => {
  try {
    const country = await db
      .select()
      .from(gossipLocations)
      .where(eq(gossipLocations.type, "COUNTRY"))
      .limit(1);
    
    if (country.length === 0) {
      return res.status(404).json({ error: "Country not found" });
    }

    const provinces = await db
      .select()
      .from(gossipLocations)
      .where(
        and(
          eq(gossipLocations.type, "PROVINCE"),
          eq(gossipLocations.parentId, country[0].id),
          eq(gossipLocations.isActive, true)
        )
      )
      .orderBy(asc(gossipLocations.sortOrder));

    return res.json({ 
      country: country[0],
      provinces 
    });
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return res.status(500).json({ error: "Failed to fetch provinces" });
  }
});

router.get("/locations/provinces/:provinceSlug/cities", async (req: Request, res: Response) => {
  try {
    const { provinceSlug } = req.params;

    const province = await db
      .select()
      .from(gossipLocations)
      .where(
        and(
          eq(gossipLocations.type, "PROVINCE"),
          eq(gossipLocations.slug, provinceSlug)
        )
      )
      .limit(1);

    if (province.length === 0) {
      return res.status(404).json({ error: "Province not found" });
    }

    const cities = await db
      .select()
      .from(gossipLocations)
      .where(
        and(
          eq(gossipLocations.type, "CITY"),
          eq(gossipLocations.parentId, province[0].id),
          eq(gossipLocations.isActive, true)
        )
      )
      .orderBy(asc(gossipLocations.sortOrder));

    const country = await db
      .select()
      .from(gossipLocations)
      .where(eq(gossipLocations.id, province[0].parentId!))
      .limit(1);

    return res.json({
      breadcrumb: [
        country[0],
        province[0]
      ],
      province: province[0],
      cities
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return res.status(500).json({ error: "Failed to fetch cities" });
  }
});

router.get("/locations/provinces/:provinceSlug/cities/:citySlug/hoods", async (req: Request, res: Response) => {
  try {
    const { provinceSlug, citySlug } = req.params;

    const province = await db
      .select()
      .from(gossipLocations)
      .where(
        and(
          eq(gossipLocations.type, "PROVINCE"),
          eq(gossipLocations.slug, provinceSlug)
        )
      )
      .limit(1);

    if (province.length === 0) {
      return res.status(404).json({ error: "Province not found" });
    }

    const city = await db
      .select()
      .from(gossipLocations)
      .where(
        and(
          eq(gossipLocations.type, "CITY"),
          eq(gossipLocations.slug, citySlug),
          eq(gossipLocations.parentId, province[0].id)
        )
      )
      .limit(1);

    if (city.length === 0) {
      return res.status(404).json({ error: "City not found" });
    }

    const hoods = await db
      .select()
      .from(gossipLocations)
      .where(
        and(
          eq(gossipLocations.type, "HOOD"),
          eq(gossipLocations.parentId, city[0].id),
          eq(gossipLocations.isActive, true)
        )
      )
      .orderBy(asc(gossipLocations.sortOrder));

    const country = await db
      .select()
      .from(gossipLocations)
      .where(eq(gossipLocations.id, province[0].parentId!))
      .limit(1);

    return res.json({
      breadcrumb: [
        country[0],
        province[0],
        city[0]
      ],
      city: city[0],
      hoods
    });
  } catch (error) {
    console.error("Error fetching hoods:", error);
    return res.status(500).json({ error: "Failed to fetch hoods" });
  }
});

router.get("/locations/:locationId/breadcrumb", async (req: Request, res: Response) => {
  try {
    const { locationId } = req.params;
    const breadcrumb: any[] = [];

    let current = await db
      .select()
      .from(gossipLocations)
      .where(eq(gossipLocations.id, locationId))
      .limit(1);

    while (current.length > 0) {
      breadcrumb.unshift(current[0]);
      if (current[0].parentId) {
        current = await db
          .select()
          .from(gossipLocations)
          .where(eq(gossipLocations.id, current[0].parentId))
          .limit(1);
      } else {
        break;
      }
    }

    return res.json({ breadcrumb });
  } catch (error) {
    console.error("Error fetching breadcrumb:", error);
    return res.status(500).json({ error: "Failed to fetch breadcrumb" });
  }
});

router.get("/locations/:locationId/children", async (req: Request, res: Response) => {
  try {
    const { locationId } = req.params;

    const children = await db
      .select()
      .from(gossipLocations)
      .where(
        and(
          eq(gossipLocations.parentId, locationId),
          eq(gossipLocations.isActive, true)
        )
      )
      .orderBy(asc(gossipLocations.sortOrder));

    return res.json({ children });
  } catch (error) {
    console.error("Error fetching children:", error);
    return res.status(500).json({ error: "Failed to fetch children" });
  }
});

router.get("/locations/search", async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      return res.json({ results: [] });
    }

    const results = await db
      .select()
      .from(gossipLocations)
      .where(
        and(
          like(gossipLocations.name, `%${query}%`),
          eq(gossipLocations.isActive, true)
        )
      )
      .orderBy(
        sql`CASE type WHEN 'PROVINCE' THEN 1 WHEN 'CITY' THEN 2 WHEN 'HOOD' THEN 3 ELSE 4 END`
      )
      .limit(20);

    const resultsWithBreadcrumbs = await Promise.all(
      results.map(async (location) => {
        const breadcrumb: any[] = [];
        let current: any[] = [location];

        while (current.length > 0 && current[0].parentId) {
          current = await db
            .select()
            .from(gossipLocations)
            .where(eq(gossipLocations.id, current[0].parentId))
            .limit(1);
          if (current.length > 0) {
            breadcrumb.unshift(current[0]);
          }
        }

        return {
          ...location,
          breadcrumbPath: breadcrumb.map(b => b.name).join(" › ")
        };
      })
    );

    return res.json({ results: resultsWithBreadcrumbs });
  } catch (error) {
    console.error("Error searching locations:", error);
    return res.status(500).json({ error: "Failed to search locations" });
  }
});

async function buildLocationDisplay(locationId: string): Promise<string> {
  const breadcrumb: string[] = [];
  let current = await db
    .select()
    .from(gossipLocations)
    .where(eq(gossipLocations.id, locationId))
    .limit(1);

  while (current.length > 0) {
    breadcrumb.unshift(current[0].name);
    if (current[0].parentId) {
      current = await db
        .select()
        .from(gossipLocations)
        .where(eq(gossipLocations.id, current[0].parentId))
        .limit(1);
    } else {
      break;
    }
  }

  return breadcrumb.join(" › ");
}

const createPostSchema = z.object({
  deviceHash: z.string().min(32).max(128),
  locationId: z.string().uuid(),
  content: z.string().min(10).max(5000),
  postType: z.enum(["REGULAR", "CONFESSION", "AMA", "I_SAW", "I_HEARD"]).default("REGULAR"),
  isInsider: z.boolean().default(false),
  pollQuestion: z.string().max(500).optional(),
  pollOptions: z.array(z.string().max(200)).min(2).max(4).optional(),
  isWhisperMode: z.boolean().default(false),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(["IMAGE", "VIDEO", "AUDIO"]).optional(),
});

router.post("/posts", async (req: Request, res: Response) => {
  try {
    const parsed = createPostSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
    }

    const { 
      deviceHash, locationId, content, postType, isInsider, 
      pollQuestion, pollOptions, isWhisperMode, mediaUrl 
    } = parsed.data;

    const hashedDevice = hashDevice(deviceHash);

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentPosts = await db
      .select({ count: count() })
      .from(anonGossipPosts)
      .where(
        and(
          eq(anonGossipPosts.deviceHash, hashedDevice),
          gte(anonGossipPosts.createdAt, fiveMinutesAgo)
        )
      );

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyPosts = await db
      .select({ count: count() })
      .from(anonGossipPosts)
      .where(
        and(
          eq(anonGossipPosts.deviceHash, hashedDevice),
          gte(anonGossipPosts.createdAt, hourAgo)
        )
      );

    if ((hourlyPosts[0]?.count || 0) >= 5) {
      return res.status(429).json({ 
        error: "Rate limited",
        message: "You can only post 5 times per hour. Please try again later.",
        retryAfter: 3600
      });
    }

    if ((recentPosts[0]?.count || 0) >= 1) {
      return res.status(429).json({
        error: "Too fast",
        message: "Please wait at least 5 minutes between posts.",
        retryAfter: 300
      });
    }

    const location = await db
      .select()
      .from(gossipLocations)
      .where(eq(gossipLocations.id, locationId))
      .limit(1);

    if (location.length === 0) {
      return res.status(400).json({ error: "Invalid location" });
    }

    const alias = generateAlias();
    const locationDisplay = await buildLocationDisplay(locationId);

    let teaMeter = 5;
    const teaStats = await db
      .select()
      .from(teaSpillerStats)
      .where(eq(teaSpillerStats.deviceHash, hashedDevice))
      .limit(1);

    if (teaStats.length > 0) {
      const stats = teaStats[0];
      const total = stats.accurateCount + stats.inaccurateCount;
      const accuracyRate = total > 0 ? (stats.accurateCount / total) * 100 : 50;
      const engagementBonus = Math.min(stats.totalReactions + stats.totalReposts * 2, 30) / 10;
      teaMeter = Math.min(Math.max(Math.round(accuracyRate / 10 + engagementBonus), 1), 10);
    }

    const extractedHashtags = content.match(/#[a-zA-Z0-9_]+/g) || [];

    const [post] = await db.insert(anonGossipPosts).values({
      deviceHash: hashedDevice,
      zaLocationId: locationId,
      locationDisplay,
      countryCode: "ZA",
      content,
      teaMeter,
      postType: postType,
      isInsider: isInsider,
      isWhisper: isWhisperMode,
      whisperExpiresAt: isWhisperMode ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
      mediaUrl: mediaUrl || null,
    }).returning();

    if (extractedHashtags.length > 0) {
      for (const tag of extractedHashtags) {
        const normalizedTag = tag.toLowerCase();
        
        let hashtag = await db
          .select()
          .from(gossipHashtags)
          .where(eq(gossipHashtags.tag, normalizedTag))
          .limit(1);

        if (hashtag.length === 0) {
          hashtag = await db.insert(gossipHashtags).values({
            tag: normalizedTag,
          }).returning();
        } else {
          await db
            .update(gossipHashtags)
            .set({ 
              useCount: sql`${gossipHashtags.useCount} + 1`,
              lastUsedAt: new Date()
            })
            .where(eq(gossipHashtags.id, hashtag[0].id));
        }

        await db.insert(gossipPostHashtags).values({
          postId: post.id,
          hashtagId: hashtag[0].id,
        });
      }
    }

    if (pollQuestion && pollOptions && pollOptions.length >= 2) {
      await db.insert(gossipPolls).values({
        postId: post.id,
        question: pollQuestion,
        option1: pollOptions[0],
        option2: pollOptions[1],
        option3: pollOptions[2] || null,
        option4: pollOptions[3] || null,
      });
    }

    await db
      .update(gossipLocations)
      .set({ postCount: sql`${gossipLocations.postCount} + 1` })
      .where(eq(gossipLocations.id, locationId));

    if (!teaStats.length) {
      await db.insert(teaSpillerStats).values({
        deviceHash: hashedDevice,
        totalPosts: 1,
      });
    } else {
      await db
        .update(teaSpillerStats)
        .set({ 
          totalPosts: sql`${teaSpillerStats.totalPosts} + 1`,
          lastActiveAt: new Date()
        })
        .where(eq(teaSpillerStats.deviceHash, hashedDevice));
    }

    const responsePost = {
      ...post,
      alias: alias.name,
      aliasEmoji: alias.emoji,
      reactions: { fire: 0, mindblown: 0, laugh: 0, skull: 0, eyes: 0 },
      replyCount: 0,
      repostCount: 0,
      saveCount: 0,
      viewCount: 0,
      isReacted: false,
      isReposted: false,
      isSaved: false,
      isFollowing: false,
      poll: pollQuestion ? {
        question: pollQuestion,
        options: pollOptions,
        votes: pollOptions?.map(() => 0),
        totalVotes: 0,
        hasVoted: false,
      } : null,
    };

    // Broadcast new post to all subscribers of this location
    broadcastNewGossipPost(locationId, responsePost);

    return res.status(201).json({ post: responsePost });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({ error: "Failed to create post" });
  }
});

router.get("/posts", async (req: Request, res: Response) => {
  try {
    const { locationId, tab, limit = "20", offset = "0", deviceHash } = req.query;
    const parsedLimit = Math.min(parseInt(limit as string) || 20, 50);
    const parsedOffset = parseInt(offset as string) || 0;

    let locationFilter: any = undefined;

    if (locationId && typeof locationId === "string") {
      const location = await db
        .select()
        .from(gossipLocations)
        .where(eq(gossipLocations.id, locationId))
        .limit(1);

      if (location.length > 0) {
        if (location[0].type === "HOOD") {
          locationFilter = eq(anonGossipPosts.zaLocationId, locationId);
        } else {
          const children = await db
            .select({ id: gossipLocations.id })
            .from(gossipLocations)
            .where(eq(gossipLocations.parentId, locationId));
          
          if (children.length > 0) {
            const childIds = children.map(c => c.id);
            
            if (location[0].type === "CITY") {
              locationFilter = sql`${anonGossipPosts.zaLocationId} IN (${sql.join(childIds.map(id => sql`${id}`), sql`, `)})`;
            } else {
              const grandchildren: string[] = [];
              for (const child of childIds) {
                const gc = await db
                  .select({ id: gossipLocations.id })
                  .from(gossipLocations)
                  .where(eq(gossipLocations.parentId, child));
                grandchildren.push(...gc.map(g => g.id));
                
                const ggc = await Promise.all(gc.map(g => 
                  db.select({ id: gossipLocations.id })
                    .from(gossipLocations)
                    .where(eq(gossipLocations.parentId, g.id))
                ));
                ggc.forEach(arr => grandchildren.push(...arr.map(g => g.id)));
              }
              if (grandchildren.length > 0) {
                locationFilter = sql`${anonGossipPosts.zaLocationId} IN (${sql.join(grandchildren.map(id => sql`${id}`), sql`, `)})`;
              }
            }
          }
        }
      }
    }

    let orderByClause = desc(anonGossipPosts.createdAt);
    if (tab === "trending") {
      orderByClause = desc(anonGossipPosts.trendingScore);
    }

    const baseConditions: any[] = [
      eq(anonGossipPosts.isHidden, false),
    ];

    if (locationFilter) {
      baseConditions.push(locationFilter);
    }

    const posts = await db
      .select()
      .from(anonGossipPosts)
      .where(and(...baseConditions))
      .orderBy(orderByClause)
      .limit(parsedLimit)
      .offset(parsedOffset);

    const hashedDevice = deviceHash ? hashDevice(deviceHash as string) : null;

    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const alias = generateAlias();

        let userReaction = null;
        let isReposted = false;
        let isSaved = false;
        let isFollowing = false;

        if (hashedDevice) {
          const userReactionResult = await db
            .select()
            .from(anonGossipReactions)
            .where(
              and(
                eq(anonGossipReactions.postId, post.id),
                eq(anonGossipReactions.deviceHash, hashedDevice)
              )
            )
            .limit(1);
          userReaction = userReactionResult[0]?.reactionType || null;

          const repostResult = await db
            .select()
            .from(gossipReposts)
            .where(
              and(
                eq(gossipReposts.originalPostId, post.id),
                eq(gossipReposts.deviceHash, hashedDevice)
              )
            )
            .limit(1);
          isReposted = repostResult.length > 0;

          const saveResult = await db
            .select()
            .from(gossipSaves)
            .where(
              and(
                eq(gossipSaves.postId, post.id),
                eq(gossipSaves.deviceHash, hashedDevice)
              )
            )
            .limit(1);
          isSaved = saveResult.length > 0;

          const followResult = await db
            .select()
            .from(gossipPostFollows)
            .where(
              and(
                eq(gossipPostFollows.postId, post.id),
                eq(gossipPostFollows.deviceHash, hashedDevice)
              )
            )
            .limit(1);
          isFollowing = followResult.length > 0;
        }

        let poll = null;
        const pollResult = await db
          .select()
          .from(gossipPolls)
          .where(eq(gossipPolls.postId, post.id))
          .limit(1);

        if (pollResult.length > 0) {
          const p = pollResult[0];
          const options = [p.option1, p.option2, p.option3, p.option4].filter(Boolean) as string[];
          const votes = [p.option1Votes, p.option2Votes, p.option3Votes, p.option4Votes].slice(0, options.length);
          
          poll = {
            id: p.id,
            question: p.question,
            options,
            votes,
            totalVotes: p.totalVotes,
            hasVoted: false,
            endsAt: p.endsAt,
          };

          if (hashedDevice) {
            const voteResult = await db
              .select()
              .from(gossipPollVotes)
              .where(
                and(
                  eq(gossipPollVotes.pollId, p.id),
                  eq(gossipPollVotes.deviceHash, hashedDevice)
                )
              )
              .limit(1);
            poll.hasVoted = voteResult.length > 0;
            if (voteResult.length > 0) {
              (poll as any).votedOption = voteResult[0].optionNumber;
            }
          }
        }

        return {
          ...post,
          alias: alias.name,
          aliasEmoji: alias.emoji,
          reactions: {
            fire: post.fireCount,
            mindblown: post.mindblownCount,
            laugh: post.laughCount,
            skull: post.skullCount,
            eyes: post.eyesCount,
          },
          userReaction,
          isReposted,
          isSaved,
          isFollowing,
          poll,
        };
      })
    );

    return res.json({
      posts: enrichedPosts,
      hasMore: posts.length === parsedLimit,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ error: "Failed to fetch posts" });
  }
});

router.post("/posts/:postId/react", async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { deviceHash, reactionType } = req.body;

    if (!deviceHash || !reactionType) {
      return res.status(400).json({ error: "Missing deviceHash or reactionType" });
    }

    const validReactions = ["FIRE", "MINDBLOWN", "LAUGH", "SKULL", "EYES"];
    if (!validReactions.includes(reactionType.toUpperCase())) {
      return res.status(400).json({ error: "Invalid reaction type" });
    }

    const hashedDevice = hashDevice(deviceHash);

    const existing = await db
      .select()
      .from(anonGossipReactions)
      .where(
        and(
          eq(anonGossipReactions.postId, postId),
          eq(anonGossipReactions.deviceHash, hashedDevice)
        )
      )
      .limit(1);

    const reactionField = `${reactionType.toLowerCase()}Count` as keyof typeof anonGossipPosts;

    if (existing.length > 0) {
      const oldReaction = existing[0].reactionType;
      const oldField = `${oldReaction?.toLowerCase()}Count` as keyof typeof anonGossipPosts;
      
      if (oldReaction === reactionType.toUpperCase()) {
        await db
          .delete(anonGossipReactions)
          .where(eq(anonGossipReactions.id, existing[0].id));
        
        await db
          .update(anonGossipPosts)
          .set({ [oldField]: sql`${anonGossipPosts[oldField]} - 1` })
          .where(eq(anonGossipPosts.id, postId));
          
        return res.json({ action: "removed", reactionType: null });
      } else {
        await db
          .update(anonGossipReactions)
          .set({ reactionType: reactionType.toUpperCase() })
          .where(eq(anonGossipReactions.id, existing[0].id));
        
        await db
          .update(anonGossipPosts)
          .set({ 
            [oldField]: sql`${anonGossipPosts[oldField]} - 1`,
            [reactionField]: sql`${anonGossipPosts[reactionField]} + 1`,
          })
          .where(eq(anonGossipPosts.id, postId));
          
        return res.json({ action: "changed", reactionType: reactionType.toUpperCase() });
      }
    } else {
      await db.insert(anonGossipReactions).values({
        postId,
        deviceHash: hashedDevice,
        reactionType: reactionType.toUpperCase(),
      });

      await db
        .update(anonGossipPosts)
        .set({ [reactionField]: sql`${anonGossipPosts[reactionField]} + 1` })
        .where(eq(anonGossipPosts.id, postId));

      return res.json({ action: "added", reactionType: reactionType.toUpperCase() });
    }
  } catch (error) {
    console.error("Error reacting to post:", error);
    return res.status(500).json({ error: "Failed to react to post" });
  }
});

router.post("/posts/:postId/repost", async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { deviceHash, quoteText, locationId } = req.body;

    if (!deviceHash) {
      return res.status(400).json({ error: "Missing deviceHash" });
    }

    const hashedDevice = hashDevice(deviceHash);

    const existing = await db
      .select()
      .from(gossipReposts)
      .where(
        and(
          eq(gossipReposts.originalPostId, postId),
          eq(gossipReposts.deviceHash, hashedDevice)
        )
      )
      .limit(1);

    if (existing.length > 0 && !quoteText) {
      await db
        .delete(gossipReposts)
        .where(eq(gossipReposts.id, existing[0].id));

      await db
        .update(anonGossipPosts)
        .set({ repostCount: sql`${anonGossipPosts.repostCount} - 1` })
        .where(eq(anonGossipPosts.id, postId));

      return res.json({ action: "unreposted" });
    }

    await db.insert(gossipReposts).values({
      originalPostId: postId,
      deviceHash: hashedDevice,
      quoteText: quoteText || null,
      isQuoteRepost: !!quoteText,
      zaLocationId: locationId || null,
    });

    await db
      .update(anonGossipPosts)
      .set({ repostCount: sql`${anonGossipPosts.repostCount} + 1` })
      .where(eq(anonGossipPosts.id, postId));

    return res.json({ action: "reposted", isQuote: !!quoteText });
  } catch (error) {
    console.error("Error reposting:", error);
    return res.status(500).json({ error: "Failed to repost" });
  }
});

router.post("/posts/:postId/save", async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { deviceHash } = req.body;

    if (!deviceHash) {
      return res.status(400).json({ error: "Missing deviceHash" });
    }

    const hashedDevice = hashDevice(deviceHash);

    const existing = await db
      .select()
      .from(gossipSaves)
      .where(
        and(
          eq(gossipSaves.postId, postId),
          eq(gossipSaves.deviceHash, hashedDevice)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .delete(gossipSaves)
        .where(eq(gossipSaves.id, existing[0].id));

      await db
        .update(anonGossipPosts)
        .set({ saveCount: sql`${anonGossipPosts.saveCount} - 1` })
        .where(eq(anonGossipPosts.id, postId));

      return res.json({ action: "unsaved" });
    }

    await db.insert(gossipSaves).values({
      postId,
      deviceHash: hashedDevice,
    });

    await db
      .update(anonGossipPosts)
      .set({ saveCount: sql`${anonGossipPosts.saveCount} + 1` })
      .where(eq(anonGossipPosts.id, postId));

    return res.json({ action: "saved" });
  } catch (error) {
    console.error("Error saving post:", error);
    return res.status(500).json({ error: "Failed to save post" });
  }
});

router.post("/posts/:postId/follow", async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { deviceHash } = req.body;

    if (!deviceHash) {
      return res.status(400).json({ error: "Missing deviceHash" });
    }

    const hashedDevice = hashDevice(deviceHash);

    const existing = await db
      .select()
      .from(gossipPostFollows)
      .where(
        and(
          eq(gossipPostFollows.postId, postId),
          eq(gossipPostFollows.deviceHash, hashedDevice)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .delete(gossipPostFollows)
        .where(eq(gossipPostFollows.id, existing[0].id));

      await db
        .update(anonGossipPosts)
        .set({ followCount: sql`${anonGossipPosts.followCount} - 1` })
        .where(eq(anonGossipPosts.id, postId));

      return res.json({ action: "unfollowed" });
    }

    await db.insert(gossipPostFollows).values({
      postId,
      deviceHash: hashedDevice,
    });

    await db
      .update(anonGossipPosts)
      .set({ followCount: sql`${anonGossipPosts.followCount} + 1` })
      .where(eq(anonGossipPosts.id, postId));

    return res.json({ action: "following" });
  } catch (error) {
    console.error("Error following post:", error);
    return res.status(500).json({ error: "Failed to follow post" });
  }
});

router.post("/posts/:postId/view", async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { deviceHash } = req.body;

    if (!deviceHash) {
      return res.status(400).json({ error: "Missing deviceHash" });
    }

    const hashedDevice = hashDevice(deviceHash);

    const existing = await db
      .select()
      .from(gossipPostViews)
      .where(
        and(
          eq(gossipPostViews.postId, postId),
          eq(gossipPostViews.deviceHash, hashedDevice)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.json({ action: "already_viewed" });
    }

    await db.insert(gossipPostViews).values({
      postId,
      deviceHash: hashedDevice,
    });

    await db
      .update(anonGossipPosts)
      .set({ viewCount: sql`${anonGossipPosts.viewCount} + 1` })
      .where(eq(anonGossipPosts.id, postId));

    return res.json({ action: "viewed" });
  } catch (error) {
    console.error("Error recording view:", error);
    return res.status(500).json({ error: "Failed to record view" });
  }
});

router.get("/posts/:postId/comments", async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { limit = "20", offset = "0" } = req.query;
    const parsedLimit = Math.min(parseInt(limit as string) || 20, 50);
    const parsedOffset = parseInt(offset as string) || 0;

    const comments = await db
      .select()
      .from(anonGossipReplies)
      .where(
        and(
          eq(anonGossipReplies.postId, postId),
          isNull(anonGossipReplies.parentReplyId),
          eq(anonGossipReplies.isHidden, false)
        )
      )
      .orderBy(desc(anonGossipReplies.createdAt))
      .limit(parsedLimit)
      .offset(parsedOffset);

    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const alias = generateAlias();
        
        const nestedReplies = await db
          .select()
          .from(anonGossipReplies)
          .where(
            and(
              eq(anonGossipReplies.parentReplyId, comment.id),
              eq(anonGossipReplies.isHidden, false)
            )
          )
          .orderBy(asc(anonGossipReplies.createdAt))
          .limit(5);

        return {
          ...comment,
          alias: alias.name,
          aliasEmoji: alias.emoji,
          replies: nestedReplies.map(r => ({
            ...r,
            alias: generateAlias().name,
            aliasEmoji: generateAlias().emoji,
          })),
          replyCount: nestedReplies.length,
        };
      })
    );

    return res.json({
      comments: enrichedComments,
      hasMore: comments.length === parsedLimit,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({ error: "Failed to fetch comments" });
  }
});

router.post("/posts/:postId/comments", async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { deviceHash, content, parentReplyId } = req.body;

    if (!deviceHash || !content) {
      return res.status(400).json({ error: "Missing deviceHash or content" });
    }

    if (content.length < 1 || content.length > 2000) {
      return res.status(400).json({ error: "Content must be 1-2000 characters" });
    }

    const hashedDevice = hashDevice(deviceHash);
    const alias = generateAlias();

    const [reply] = await db.insert(anonGossipReplies).values({
      postId,
      deviceHash: hashedDevice,
      content,
      parentReplyId: parentReplyId || null,
    }).returning();

    await db
      .update(anonGossipPosts)
      .set({ replyCount: sql`${anonGossipPosts.replyCount} + 1` })
      .where(eq(anonGossipPosts.id, postId));

    return res.status(201).json({ 
      comment: {
        ...reply,
        alias: alias.name,
        aliasEmoji: alias.emoji,
      }
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return res.status(500).json({ error: "Failed to create comment" });
  }
});

router.post("/polls/:pollId/vote", async (req: Request, res: Response) => {
  try {
    const { pollId } = req.params;
    const { deviceHash, optionIndex } = req.body;

    if (!deviceHash || optionIndex === undefined) {
      return res.status(400).json({ error: "Missing deviceHash or optionIndex" });
    }

    if (optionIndex < 0 || optionIndex > 3) {
      return res.status(400).json({ error: "Invalid option index (0-3)" });
    }

    const hashedDevice = hashDevice(deviceHash);

    const poll = await db
      .select()
      .from(gossipPolls)
      .where(eq(gossipPolls.id, pollId))
      .limit(1);

    if (poll.length === 0) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (poll[0].endsAt && new Date(poll[0].endsAt) < new Date()) {
      return res.status(400).json({ error: "Poll has ended" });
    }

    const existing = await db
      .select()
      .from(gossipPollVotes)
      .where(
        and(
          eq(gossipPollVotes.pollId, pollId),
          eq(gossipPollVotes.deviceHash, hashedDevice)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ error: "Already voted", votedOption: existing[0].optionNumber });
    }

    await db.insert(gossipPollVotes).values({
      pollId,
      deviceHash: hashedDevice,
      optionNumber: optionIndex,
    });

    const voteFields = ["option1Votes", "option2Votes", "option3Votes", "option4Votes"] as const;
    const voteField = voteFields[optionIndex];

    await db
      .update(gossipPolls)
      .set({ 
        [voteField]: sql`${gossipPolls[voteField]} + 1`,
        totalVotes: sql`${gossipPolls.totalVotes} + 1`
      })
      .where(eq(gossipPolls.id, pollId));

    const updatedPoll = await db
      .select()
      .from(gossipPolls)
      .where(eq(gossipPolls.id, pollId))
      .limit(1);

    const p = updatedPoll[0];
    const options = [p.option1, p.option2, p.option3, p.option4].filter(Boolean) as string[];
    
    return res.json({ 
      success: true,
      votedOption: optionIndex,
      poll: {
        options,
        votes: [p.option1Votes, p.option2Votes, p.option3Votes, p.option4Votes].slice(0, options.length),
        totalVotes: p.totalVotes,
      }
    });
  } catch (error) {
    console.error("Error voting:", error);
    return res.status(500).json({ error: "Failed to vote" });
  }
});

router.post("/posts/:postId/accuracy", async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { deviceHash, vote } = req.body;

    if (!deviceHash || !vote) {
      return res.status(400).json({ error: "Missing deviceHash or vote" });
    }

    const validVotes = ["TRUE", "FALSE", "UNSURE"];
    if (!validVotes.includes(vote.toUpperCase())) {
      return res.status(400).json({ error: "Invalid vote type" });
    }

    const hashedDevice = hashDevice(deviceHash);

    const existing = await db
      .select()
      .from(gossipAccuracyVotes)
      .where(
        and(
          eq(gossipAccuracyVotes.postId, postId),
          eq(gossipAccuracyVotes.deviceHash, hashedDevice)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(gossipAccuracyVotes)
        .set({ vote: vote.toUpperCase() })
        .where(eq(gossipAccuracyVotes.id, existing[0].id));
    } else {
      await db.insert(gossipAccuracyVotes).values({
        postId,
        deviceHash: hashedDevice,
        vote: vote.toUpperCase(),
      });
    }

    const [trueVotes] = await db
      .select({ count: count() })
      .from(gossipAccuracyVotes)
      .where(
        and(
          eq(gossipAccuracyVotes.postId, postId),
          eq(gossipAccuracyVotes.vote, "TRUE")
        )
      );

    const [falseVotes] = await db
      .select({ count: count() })
      .from(gossipAccuracyVotes)
      .where(
        and(
          eq(gossipAccuracyVotes.postId, postId),
          eq(gossipAccuracyVotes.vote, "FALSE")
        )
      );

    const [unsureVotes] = await db
      .select({ count: count() })
      .from(gossipAccuracyVotes)
      .where(
        and(
          eq(gossipAccuracyVotes.postId, postId),
          eq(gossipAccuracyVotes.vote, "UNSURE")
        )
      );

    await db
      .update(anonGossipPosts)
      .set({
        accuracyTrueVotes: Number(trueVotes.count),
        accuracyFalseVotes: Number(falseVotes.count),
        accuracyUnsureVotes: Number(unsureVotes.count),
      })
      .where(eq(anonGossipPosts.id, postId));

    const totalVotes = Number(trueVotes.count) + Number(falseVotes.count) + Number(unsureVotes.count);
    if (totalVotes >= 10 && Number(trueVotes.count) / totalVotes >= 0.7) {
      await db
        .update(anonGossipPosts)
        .set({ isVerifiedTea: true })
        .where(eq(anonGossipPosts.id, postId));
    }

    return res.json({
      success: true,
      accuracyVotes: {
        true: Number(trueVotes.count),
        false: Number(falseVotes.count),
        unsure: Number(unsureVotes.count),
        total: totalVotes,
      },
      userVote: vote.toUpperCase(),
    });
  } catch (error) {
    console.error("Error voting accuracy:", error);
    return res.status(500).json({ error: "Failed to vote on accuracy" });
  }
});

router.get("/hashtags/trending", async (req: Request, res: Response) => {
  try {
    const { locationId, limit = "20" } = req.query;
    const parsedLimit = Math.min(parseInt(limit as string) || 20, 50);

    let conditions: any[] = [];
    if (locationId && typeof locationId === "string") {
      conditions.push(eq(gossipTrendingHashtags.zaLocationId, locationId));
    }

    const trending = await db
      .select({
        hashtag: gossipHashtags,
        trendingData: gossipTrendingHashtags,
      })
      .from(gossipTrendingHashtags)
      .leftJoin(gossipHashtags, eq(gossipTrendingHashtags.hashtagId, gossipHashtags.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(gossipTrendingHashtags.trendingScore))
      .limit(parsedLimit);

    return res.json({
      trending: trending.map((t, index) => ({
        id: t.hashtag?.id,
        tag: t.hashtag?.tag,
        useCount: t.hashtag?.useCount,
        trendingScore: t.trendingData.trendingScore,
        useLast24h: t.trendingData.useLast24h,
        rank: index + 1,
      })),
    });
  } catch (error) {
    console.error("Error fetching trending hashtags:", error);
    return res.status(500).json({ error: "Failed to fetch trending hashtags" });
  }
});

router.get("/stats/tea-spiller", async (req: Request, res: Response) => {
  try {
    const { deviceHash } = req.query;

    if (!deviceHash) {
      return res.status(400).json({ error: "Missing deviceHash" });
    }

    const hashedDevice = hashDevice(deviceHash as string);

    let stats = await db
      .select()
      .from(teaSpillerStats)
      .where(eq(teaSpillerStats.deviceHash, hashedDevice))
      .limit(1);

    if (stats.length === 0) {
      stats = await db.insert(teaSpillerStats).values({
        deviceHash: hashedDevice,
      }).returning();
    }

    const alias = generateAlias();

    return res.json({
      stats: stats[0],
      alias,
      level: stats[0].level,
    });
  } catch (error) {
    console.error("Error fetching tea spiller stats:", error);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
});

function calculateTrendingScore(
  reactions: number,
  comments: number,
  reposts: number,
  views: number,
  createdAt: Date,
  avgEngagementRate: number = 0.05
): { score: number; isBreaking: boolean; isHot: boolean } {
  const now = new Date();
  const ageHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  const ageDays = ageHours / 24;
  const timeDecay = Math.pow(0.95, ageDays);
  const recentBonus = ageHours < 1 ? 2.0 : ageHours < 6 ? 1.5 : ageHours < 24 ? 1.2 : 1.0;
  const reactionWeight = 1;
  const commentWeight = 2;
  const repostWeight = 3;
  const viewWeight = 0.1;
  
  const baseScore = 
    (reactions * reactionWeight) + 
    (comments * commentWeight) + 
    (reposts * repostWeight) + 
    (views * viewWeight);
  const currentEngagementRate = views > 0 ? (reactions + comments + reposts) / views : 0;
  const velocityBonus = currentEngagementRate > avgEngagementRate * 2 ? 1.5 : 
                        currentEngagementRate > avgEngagementRate ? 1.2 : 1.0;
  const engagementsPerHour = ageHours > 0 ? (reactions + comments + reposts) / ageHours : reactions + comments + reposts;
  const isBreaking = engagementsPerHour > 10 && ageHours < 2;
  const isHot = engagementsPerHour > 5 && ageHours < 6;
  const score = baseScore * timeDecay * recentBonus * velocityBonus;
  
  return { score: Math.round(score * 100) / 100, isBreaking, isHot };
}

router.post("/trending/recalculate", async (_req: Request, res: Response) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const posts = await db
      .select({
        id: anonGossipPosts.id,
        fireCount: anonGossipPosts.fireCount,
        mindblownCount: anonGossipPosts.mindblownCount,
        laughCount: anonGossipPosts.laughCount,
        skullCount: anonGossipPosts.skullCount,
        eyesCount: anonGossipPosts.eyesCount,
        replyCount: anonGossipPosts.replyCount,
        repostCount: anonGossipPosts.repostCount,
        viewCount: anonGossipPosts.viewCount,
        createdAt: anonGossipPosts.createdAt,
      })
      .from(anonGossipPosts)
      .where(
        and(
          eq(anonGossipPosts.isHidden, false),
          gte(anonGossipPosts.createdAt, twentyFourHoursAgo)
        )
      );

    let updatedCount = 0;
    
    for (const post of posts) {
      const totalReactions = (post.fireCount || 0) + (post.mindblownCount || 0) + 
        (post.laughCount || 0) + (post.skullCount || 0) + (post.eyesCount || 0);
      const { score, isBreaking, isHot } = calculateTrendingScore(
        totalReactions,
        post.replyCount || 0,
        post.repostCount || 0,
        post.viewCount || 0,
        new Date(post.createdAt)
      );
      
      await db
        .update(anonGossipPosts)
        .set({
          trendingScore: score,
          isBreaking,
          isHot,
          updatedAt: new Date(),
        })
        .where(eq(anonGossipPosts.id, post.id));
      
      updatedCount++;
    }
    const oldPosts = await db
      .update(anonGossipPosts)
      .set({
        isBreaking: false,
        isHot: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          gte(anonGossipPosts.trendingScore, 0),
          sql`${anonGossipPosts.createdAt} < ${twentyFourHoursAgo}`
        )
      );

    return res.json({ 
      success: true, 
      message: `Recalculated trending scores for ${updatedCount} posts` 
    });
  } catch (error) {
    console.error("Error recalculating trending:", error);
    return res.status(500).json({ error: "Failed to recalculate trending" });
  }
});

router.get("/trending/breaking", async (req: Request, res: Response) => {
  try {
    const { locationId, limit = "10" } = req.query;
    const conditions = [
      eq(anonGossipPosts.isHidden, false),
      eq(anonGossipPosts.isBreaking, true),
    ];
    
    if (locationId) {
      conditions.push(eq(anonGossipPosts.zaLocationId, locationId as string));
    }
    
    const breakingPosts = await db
      .select()
      .from(anonGossipPosts)
      .where(and(...conditions))
      .orderBy(desc(anonGossipPosts.trendingScore))
      .limit(parseInt(limit as string) || 10);

    return res.json({ 
      posts: breakingPosts,
      count: breakingPosts.length 
    });
  } catch (error) {
    console.error("Error fetching breaking posts:", error);
    return res.status(500).json({ error: "Failed to fetch breaking posts" });
  }
});

router.get("/trending/hot", async (req: Request, res: Response) => {
  try {
    const { locationId, limit = "20" } = req.query;
    const conditions = [
      eq(anonGossipPosts.isHidden, false),
      eq(anonGossipPosts.isHot, true),
    ];
    
    if (locationId) {
      conditions.push(eq(anonGossipPosts.zaLocationId, locationId as string));
    }
    
    const hotPosts = await db
      .select()
      .from(anonGossipPosts)
      .where(and(...conditions))
      .orderBy(desc(anonGossipPosts.trendingScore))
      .limit(parseInt(limit as string) || 20);

    return res.json({ 
      posts: hotPosts,
      count: hotPosts.length 
    });
  } catch (error) {
    console.error("Error fetching hot posts:", error);
    return res.status(500).json({ error: "Failed to fetch hot posts" });
  }
});

router.get("/trending/national", async (req: Request, res: Response) => {
  try {
    const { limit = "50", cursor } = req.query;
    const conditions = [eq(anonGossipPosts.isHidden, false)];
    
    if (cursor) {
      conditions.push(sql`${anonGossipPosts.trendingScore} < ${parseFloat(cursor as string)}`);
    }
    
    const posts = await db
      .select()
      .from(anonGossipPosts)
      .where(and(...conditions))
      .orderBy(desc(anonGossipPosts.trendingScore), desc(anonGossipPosts.createdAt))
      .limit(parseInt(limit as string) || 50);

    const nextCursor = posts.length > 0 ? posts[posts.length - 1].trendingScore : null;

    return res.json({ 
      posts,
      nextCursor,
      hasMore: posts.length === parseInt(limit as string)
    });
  } catch (error) {
    console.error("Error fetching national trending:", error);
    return res.status(500).json({ error: "Failed to fetch national trending" });
  }
});

router.get("/trending/provincial/:provinceSlug", async (req: Request, res: Response) => {
  try {
    const { provinceSlug } = req.params;
    const { limit = "50", cursor } = req.query;
    const province = await db
      .select()
      .from(gossipLocations)
      .where(
        and(
          eq(gossipLocations.slug, provinceSlug),
          eq(gossipLocations.type, "PROVINCE")
        )
      )
      .limit(1);

    if (province.length === 0) {
      return res.status(404).json({ error: "Province not found" });
    }
    const cities = await db
      .select({ id: gossipLocations.id })
      .from(gossipLocations)
      .where(eq(gossipLocations.parentId, province[0].id));
    
    const cityIds = cities.map(c => c.id);
    const hoods = await db
      .select({ id: gossipLocations.id })
      .from(gossipLocations)
      .where(sql`${gossipLocations.parentId} IN (${sql.join(cityIds, sql`, `)})`);
    
    const allLocationIds = [province[0].id, ...cityIds, ...hoods.map(h => h.id)];
    const conditions = [
      eq(anonGossipPosts.isHidden, false),
      sql`${anonGossipPosts.zaLocationId} IN (${sql.join(allLocationIds, sql`, `)})`
    ];
    
    if (cursor) {
      conditions.push(sql`${anonGossipPosts.trendingScore} < ${parseFloat(cursor as string)}`);
    }
    
    const posts = await db
      .select()
      .from(anonGossipPosts)
      .where(and(...conditions))
      .orderBy(desc(anonGossipPosts.trendingScore), desc(anonGossipPosts.createdAt))
      .limit(parseInt(limit as string) || 50);

    const nextCursor = posts.length > 0 ? posts[posts.length - 1].trendingScore : null;

    return res.json({ 
      province: province[0],
      posts,
      nextCursor,
      hasMore: posts.length === parseInt(limit as string)
    });
  } catch (error) {
    console.error("Error fetching provincial trending:", error);
    return res.status(500).json({ error: "Failed to fetch provincial trending" });
  }
});

router.get("/trending/stats", async (req: Request, res: Response) => {
  try {
    const { locationId } = req.query;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const conditions = [
      eq(anonGossipPosts.isHidden, false),
      gte(anonGossipPosts.createdAt, twentyFourHoursAgo),
    ];
    
    if (locationId) {
      conditions.push(eq(anonGossipPosts.zaLocationId, locationId as string));
    }
    
    const stats = await db
      .select({
        totalPosts: count(),
        totalReactions: sql<number>`COALESCE(SUM("fire_count" + "mindblown_count" + "laugh_count" + "skull_count" + "eyes_count"), 0)`,
        totalComments: sql<number>`COALESCE(SUM("reply_count"), 0)`,
        totalReposts: sql<number>`COALESCE(SUM("repost_count"), 0)`,
        totalViews: sql<number>`COALESCE(SUM("view_count"), 0)`,
        avgTrendingScore: sql<number>`COALESCE(AVG("trending_score"), 0)`,
        breakingCount: sql<number>`COALESCE(SUM(CASE WHEN "is_breaking" = true THEN 1 ELSE 0 END), 0)`,
        hotCount: sql<number>`COALESCE(SUM(CASE WHEN "is_hot" = true THEN 1 ELSE 0 END), 0)`,
      })
      .from(anonGossipPosts)
      .where(and(...conditions));

    return res.json({ 
      period: "24h",
      stats: stats[0] || {
        totalPosts: 0,
        totalReactions: 0,
        totalComments: 0,
        totalReposts: 0,
        totalViews: 0,
        avgTrendingScore: 0,
        breakingCount: 0,
        hotCount: 0,
      }
    });
  } catch (error) {
    console.error("Error fetching trending stats:", error);
    return res.status(500).json({ error: "Failed to fetch trending stats" });
  }
});

const searchSchema = z.object({
  q: z.string().optional(),
  hashtag: z.string().optional(),
  locationId: z.string().optional(),
  timeFilter: z.enum(["24h", "7d", "30d", "all"]).optional().default("all"),
  postType: z.enum(["REGULAR", "CONFESSION", "AMA", "I_SAW", "I_HEARD"]).optional(),
  sortBy: z.enum(["recent", "trending", "engagement"]).optional().default("recent"),
  limit: z.string().optional().default("20"),
  cursor: z.string().optional(),
});

router.get("/search", async (req: Request, res: Response) => {
  try {
    const params = searchSchema.parse(req.query);
    const { q, hashtag, locationId, timeFilter, postType, sortBy, cursor } = params;
    const limit = parseInt(params.limit) || 20;
    
    const conditions: any[] = [eq(anonGossipPosts.isHidden, false)];
    if (q) {
      conditions.push(sql`${anonGossipPosts.content} ILIKE ${'%' + q + '%'}`);
    }
    if (locationId) {
      conditions.push(eq(anonGossipPosts.zaLocationId, locationId));
    }
    if (postType) {
      conditions.push(eq(anonGossipPosts.postType, postType));
    }
    if (timeFilter && timeFilter !== "all") {
      const now = new Date();
      let cutoff: Date;
      switch (timeFilter) {
        case "24h":
          cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "7d":
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoff = new Date(0);
      }
      conditions.push(gte(anonGossipPosts.createdAt, cutoff));
    }
    
    if (cursor) {
      conditions.push(sql`${anonGossipPosts.createdAt} < ${cursor}`);
    }
    let posts;
    if (hashtag) {
      const cleanHashtag = hashtag.replace(/^#/, "").toLowerCase();
      posts = await db
        .select({
          post: anonGossipPosts,
        })
        .from(anonGossipPosts)
        .innerJoin(gossipPostHashtags, eq(gossipPostHashtags.postId, anonGossipPosts.id))
        .innerJoin(gossipHashtags, eq(gossipHashtags.id, gossipPostHashtags.hashtagId))
        .where(
          and(
            eq(gossipHashtags.tag, cleanHashtag),
            ...conditions
          )
        )
        .orderBy(
          sortBy === "trending" ? desc(anonGossipPosts.trendingScore) :
          sortBy === "engagement" ? desc(sql`${anonGossipPosts.fireCount} + ${anonGossipPosts.replyCount} + ${anonGossipPosts.repostCount}`) :
          desc(anonGossipPosts.createdAt)
        )
        .limit(limit + 1);
      
      posts = posts.map(p => p.post);
    } else {
      posts = await db
        .select()
        .from(anonGossipPosts)
        .where(and(...conditions))
        .orderBy(
          sortBy === "trending" ? desc(anonGossipPosts.trendingScore) :
          sortBy === "engagement" ? desc(sql`${anonGossipPosts.fireCount} + ${anonGossipPosts.replyCount} + ${anonGossipPosts.repostCount}`) :
          desc(anonGossipPosts.createdAt)
        )
        .limit(limit + 1);
    }

    const hasMore = posts.length > limit;
    if (hasMore) {
      posts = posts.slice(0, limit);
    }
    
    const nextCursor = hasMore && posts.length > 0 
      ? posts[posts.length - 1].createdAt.toISOString() 
      : null;
    const highlightedPosts = q 
      ? posts.map(post => ({
          ...post,
          highlightedContent: post.content?.replace(
            new RegExp(`(${q})`, 'gi'),
            '<mark>$1</mark>'
          )
        }))
      : posts;

    return res.json({
      posts: highlightedPosts,
      query: q || null,
      hashtag: hashtag || null,
      filters: { locationId, timeFilter, postType, sortBy },
      hasMore,
      nextCursor,
      count: posts.length,
    });
  } catch (error) {
    console.error("Error searching posts:", error);
    return res.status(500).json({ error: "Failed to search posts" });
  }
});

router.get("/search/suggestions", async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json({ suggestions: [] });
    }
    const hashtagSuggestions = await db
      .select({
        tag: gossipHashtags.tag,
        useCount: gossipHashtags.useCount,
      })
      .from(gossipHashtags)
      .where(like(gossipHashtags.tag, `${q.toLowerCase()}%`))
      .orderBy(desc(gossipHashtags.useCount))
      .limit(5);
    const locationSuggestions = await db
      .select({
        id: gossipLocations.id,
        name: gossipLocations.name,
        type: gossipLocations.type,
        emoji: gossipLocations.emoji,
      })
      .from(gossipLocations)
      .where(
        and(
          sql`LOWER(${gossipLocations.name}) LIKE ${q.toLowerCase() + '%'}`,
          eq(gossipLocations.isActive, true)
        )
      )
      .limit(5);

    return res.json({
      suggestions: {
        hashtags: hashtagSuggestions.map(h => ({
          type: 'hashtag',
          value: `#${h.tag}`,
          count: h.useCount,
        })),
        locations: locationSuggestions.map(l => ({
          type: 'location',
          id: l.id,
          value: l.name,
          locationType: l.type,
          emoji: l.emoji,
        })),
      }
    });
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    return res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

router.get("/search/history", async (req: Request, res: Response) => {
  try {
    const { deviceHash } = req.query;
    
    if (!deviceHash) {
      return res.json({ searches: [] });
    }

    return res.json({ 
      searches: [],
      message: "Search history not yet implemented"
    });
  } catch (error) {
    console.error("Error fetching search history:", error);
    return res.status(500).json({ error: "Failed to fetch search history" });
  }
});

const startDMSchema = z.object({
  deviceHash: z.string(),
  postId: z.string(),
  message: z.string().min(1).max(1000),
});

router.post("/dm/start", async (req: Request, res: Response) => {
  try {
    const { deviceHash, postId, message } = startDMSchema.parse(req.body);
    const hashedDevice = hashDevice(deviceHash);
    const post = await db
      .select()
      .from(anonGossipPosts)
      .where(eq(anonGossipPosts.id, postId))
      .limit(1);

    if (post.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    const posterHash = post[0].deviceHash;
    if (posterHash === hashedDevice) {
      return res.status(400).json({ error: "Cannot DM yourself" });
    }
    const existingConv = await db
      .select()
      .from(gossipDMConversations)
      .where(
        and(
          eq(gossipDMConversations.postId, postId),
          sql`(
            (${gossipDMConversations.participant1Hash} = ${hashedDevice} AND ${gossipDMConversations.participant2Hash} = ${posterHash})
            OR
            (${gossipDMConversations.participant1Hash} = ${posterHash} AND ${gossipDMConversations.participant2Hash} = ${hashedDevice})
          )`
        )
      )
      .limit(1);

    let conversationId: string;
    let isNew = false;

    if (existingConv.length > 0) {
      conversationId = existingConv[0].id;
    } else {
      const initiatorAlias = generateAlias();
      const responderAlias = generateAlias();
      
      const newConv = await db.insert(gossipDMConversations).values({
        postId,
        participant1Hash: hashedDevice,
        participant2Hash: posterHash,
        participant1Alias: `${initiatorAlias.emoji} ${initiatorAlias.name}`,
        participant2Alias: `${responderAlias.emoji} ${responderAlias.name}`,
        lastMessageAt: new Date(),
      }).returning();
      
      conversationId = newConv[0].id;
      isNew = true;
    }
    const newMessage = await db.insert(gossipDMMessages).values({
      conversationId,
      senderHash: hashedDevice,
      content: message,
    }).returning();
    await db
      .update(gossipDMConversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(gossipDMConversations.id, conversationId));

    return res.status(201).json({
      success: true,
      isNewConversation: isNew,
      conversationId,
      message: newMessage[0],
    });
  } catch (error) {
    console.error("Error starting DM:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: error.errors });
    }
    return res.status(500).json({ error: "Failed to start DM" });
  }
});

router.get("/dm/conversations", async (req: Request, res: Response) => {
  try {
    const { deviceHash } = req.query;
    
    if (!deviceHash || typeof deviceHash !== 'string') {
      return res.status(400).json({ error: "Missing deviceHash" });
    }

    const hashedDevice = hashDevice(deviceHash);
    const conversations = await db
      .select()
      .from(gossipDMConversations)
      .where(
        sql`${gossipDMConversations.participant1Hash} = ${hashedDevice} OR ${gossipDMConversations.participant2Hash} = ${hashedDevice}`
      )
      .orderBy(desc(gossipDMConversations.lastMessageAt));
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const isParticipant1 = conv.participant1Hash === hashedDevice;
        const lastMessage = await db
          .select()
          .from(gossipDMMessages)
          .where(eq(gossipDMMessages.conversationId, conv.id))
          .orderBy(desc(gossipDMMessages.createdAt))
          .limit(1);
        const unreadCount = await db
          .select({ count: count() })
          .from(gossipDMMessages)
          .where(
            and(
              eq(gossipDMMessages.conversationId, conv.id),
              eq(gossipDMMessages.isRead, false),
              sql`${gossipDMMessages.senderHash} != ${hashedDevice}`
            )
          );
        
        return {
          id: conv.id,
          postId: conv.postId,
          myAlias: isParticipant1 ? conv.participant1Alias : conv.participant2Alias,
          theirAlias: isParticipant1 ? conv.participant2Alias : conv.participant1Alias,
          lastMessage: lastMessage[0] || null,
          unreadCount: unreadCount[0]?.count || 0,
          isBlocked: conv.isBlocked,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
        };
      })
    );

    return res.json({ conversations: conversationsWithDetails });
  } catch (error) {
    console.error("Error fetching DM conversations:", error);
    return res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.get("/dm/conversations/:conversationId/messages", async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { deviceHash, cursor, limit = "50" } = req.query;
    
    if (!deviceHash || typeof deviceHash !== 'string') {
      return res.status(400).json({ error: "Missing deviceHash" });
    }

    const hashedDevice = hashDevice(deviceHash);
    const conv = await db
      .select()
      .from(gossipDMConversations)
      .where(eq(gossipDMConversations.id, conversationId))
      .limit(1);

    if (conv.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    const isParticipant = conv[0].participant1Hash === hashedDevice || conv[0].participant2Hash === hashedDevice;
    if (!isParticipant) {
      return res.status(403).json({ error: "Not a participant in this conversation" });
    }

    const conditions = [eq(gossipDMMessages.conversationId, conversationId)];
    
    if (cursor) {
      conditions.push(sql`${gossipDMMessages.createdAt} < ${cursor}`);
    }

    const messages = await db
      .select()
      .from(gossipDMMessages)
      .where(and(...conditions))
      .orderBy(desc(gossipDMMessages.createdAt))
      .limit(parseInt(limit as string) + 1);

    const hasMore = messages.length > parseInt(limit as string);
    const messageList = hasMore ? messages.slice(0, parseInt(limit as string)) : messages;
    const nextCursor = hasMore && messageList.length > 0 
      ? messageList[messageList.length - 1].createdAt.toISOString() 
      : null;
    const isParticipant1 = conv[0].participant1Hash === hashedDevice;
    
    const messagesWithSenderInfo = messageList.map(msg => ({
      ...msg,
      isMe: msg.senderHash === hashedDevice,
      senderAlias: msg.senderHash === conv[0].participant1Hash 
        ? conv[0].participant1Alias 
        : conv[0].participant2Alias,
    }));

    return res.json({
      messages: messagesWithSenderInfo.reverse(),
      myAlias: isParticipant1 ? conv[0].participant1Alias : conv[0].participant2Alias,
      theirAlias: isParticipant1 ? conv[0].participant2Alias : conv[0].participant1Alias,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching DM messages:", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
});

const sendDMSchema = z.object({
  deviceHash: z.string(),
  content: z.string().min(1).max(1000),
});

router.post("/dm/conversations/:conversationId/messages", async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { deviceHash, content } = sendDMSchema.parse(req.body);
    const hashedDevice = hashDevice(deviceHash);
    const conv = await db
      .select()
      .from(gossipDMConversations)
      .where(eq(gossipDMConversations.id, conversationId))
      .limit(1);

    if (conv.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    const isParticipant = conv[0].participant1Hash === hashedDevice || conv[0].participant2Hash === hashedDevice;
    if (!isParticipant) {
      return res.status(403).json({ error: "Not a participant in this conversation" });
    }

    if (conv[0].isBlocked) {
      return res.status(403).json({ error: "This conversation is blocked" });
    }
    const newMessage = await db.insert(gossipDMMessages).values({
      conversationId,
      senderHash: hashedDevice,
      content,
    }).returning();
    await db
      .update(gossipDMConversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(gossipDMConversations.id, conversationId));

    // Notify the other participant about the new DM
    const otherParticipantHash = conv[0].participant1Hash === hashedDevice 
      ? conv[0].participant2Hash 
      : conv[0].participant1Hash;
    const messagePreview = content.substring(0, 50) + (content.length > 50 ? "..." : "");
    broadcastGossipDM(otherParticipantHash, conversationId, messagePreview);

    return res.status(201).json({
      success: true,
      message: {
        ...newMessage[0],
        isMe: true,
        senderAlias: conv[0].participant1Hash === hashedDevice 
          ? conv[0].participant1Alias 
          : conv[0].participant2Alias,
      },
    });
  } catch (error) {
    console.error("Error sending DM:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: error.errors });
    }
    return res.status(500).json({ error: "Failed to send message" });
  }
});

router.post("/dm/conversations/:conversationId/read", async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { deviceHash } = req.body;
    
    if (!deviceHash) {
      return res.status(400).json({ error: "Missing deviceHash" });
    }

    const hashedDevice = hashDevice(deviceHash);
    const conv = await db
      .select()
      .from(gossipDMConversations)
      .where(eq(gossipDMConversations.id, conversationId))
      .limit(1);

    if (conv.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    const isParticipant = conv[0].participant1Hash === hashedDevice || conv[0].participant2Hash === hashedDevice;
    if (!isParticipant) {
      return res.status(403).json({ error: "Not a participant in this conversation" });
    }
    await db
      .update(gossipDMMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(gossipDMMessages.conversationId, conversationId),
          sql`${gossipDMMessages.senderHash} != ${hashedDevice}`
        )
      );

    return res.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return res.status(500).json({ error: "Failed to mark as read" });
  }
});

router.post("/dm/conversations/:conversationId/block", async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { deviceHash, block } = req.body;
    
    if (!deviceHash) {
      return res.status(400).json({ error: "Missing deviceHash" });
    }

    const hashedDevice = hashDevice(deviceHash);
    const conv = await db
      .select()
      .from(gossipDMConversations)
      .where(eq(gossipDMConversations.id, conversationId))
      .limit(1);

    if (conv.length === 0) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    const isParticipant = conv[0].participant1Hash === hashedDevice || conv[0].participant2Hash === hashedDevice;
    if (!isParticipant) {
      return res.status(403).json({ error: "Not a participant in this conversation" });
    }
    await db
      .update(gossipDMConversations)
      .set({ isBlocked: block !== false })
      .where(eq(gossipDMConversations.id, conversationId));

    return res.json({ 
      success: true,
      isBlocked: block !== false,
    });
  } catch (error) {
    console.error("Error blocking/unblocking conversation:", error);
    return res.status(500).json({ error: "Failed to update block status" });
  }
});

const PROFANITY_WORDS = [
  "fuck", "shit", "ass", "bitch", "dick", "cock", "pussy", "cunt", "nigga", "nigger",
  "slut", "whore", "fag", "faggot", "retard", "bastard", "motherfucker", "asshole",
  "poes", "nai", "msunu", "isifebe", "voetsek", "kaffir", "bobbejaan", "hoer"
];

function containsProfanity(text: string): { hasProfanity: boolean; words: string[] } {
  const lowerText = text.toLowerCase();
  const foundWords = PROFANITY_WORDS.filter(word => {
    const pattern = new RegExp(`\\b${word}\\b|${word.split('').join('[\\s\\*\\-_]*')}`, 'i');
    return pattern.test(lowerText);
  });
  return { hasProfanity: foundWords.length > 0, words: foundWords };
}

function censorText(text: string): string {
  let censored = text;
  PROFANITY_WORDS.forEach(word => {
    const pattern = new RegExp(`\\b${word}\\b`, 'gi');
    censored = censored.replace(pattern, match => {
      if (match.length <= 2) return '*'.repeat(match.length);
      return match[0] + '*'.repeat(match.length - 2) + match[match.length - 1];
    });
  });
  return censored;
}

const reportSchema = z.object({
  deviceHash: z.string(),
  postId: z.string().optional(),
  replyId: z.string().optional(),
  reason: z.enum([
    "SPAM", "HARASSMENT", "HATE_SPEECH", "MISINFORMATION", 
    "DOXXING", "ILLEGAL", "INAPPROPRIATE", "OTHER"
  ]),
  details: z.string().max(500).optional(),
}).refine(data => data.postId || data.replyId, {
  message: "Must provide either postId or replyId",
});

router.post("/moderation/report", async (req: Request, res: Response) => {
  try {
    const { deviceHash, postId, replyId, reason, details } = reportSchema.parse(req.body);
    const hashedDevice = hashDevice(deviceHash);
    if (postId) {
      const existingReport = await db
        .select()
        .from(anonGossipReports)
        .where(
          and(
            eq(anonGossipReports.postId, postId),
            eq(anonGossipReports.deviceHash, hashedDevice)
          )
        )
        .limit(1);

      if (existingReport.length > 0) {
        return res.status(400).json({ error: "You have already reported this post" });
      }
    }

    if (replyId) {
      const existingReport = await db
        .select()
        .from(anonGossipReports)
        .where(
          and(
            eq(anonGossipReports.replyId, replyId),
            eq(anonGossipReports.deviceHash, hashedDevice)
          )
        )
        .limit(1);

      if (existingReport.length > 0) {
        return res.status(400).json({ error: "You have already reported this reply" });
      }
    }
    const report = await db.insert(anonGossipReports).values({
      postId: postId || null,
      replyId: replyId || null,
      deviceHash: hashedDevice,
      reason: `${reason}${details ? ': ' + details : ''}`,
    }).returning();
    if (postId) {
      await db
        .update(anonGossipPosts)
        .set({ reportCount: sql`${anonGossipPosts.reportCount} + 1` })
        .where(eq(anonGossipPosts.id, postId));
      const post = await db
        .select({ reportCount: anonGossipPosts.reportCount })
        .from(anonGossipPosts)
        .where(eq(anonGossipPosts.id, postId))
        .limit(1);
      
      if (post.length > 0 && post[0].reportCount >= 10) {
        await db
          .update(anonGossipPosts)
          .set({ isHidden: true })
          .where(eq(anonGossipPosts.id, postId));
      }
    }

    if (replyId) {
      const replyReportCount = await db
        .select({ count: count() })
        .from(anonGossipReports)
        .where(eq(anonGossipReports.replyId, replyId));
      
      if (replyReportCount[0]?.count >= 10) {
        await db
          .update(anonGossipReplies)
          .set({ isHidden: true })
          .where(eq(anonGossipReplies.id, replyId));
      }
    }

    return res.status(201).json({
      success: true,
      message: "Report submitted. We'll review this content shortly.",
      reportId: report[0].id,
    });
  } catch (error) {
    console.error("Error submitting report:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: error.errors });
    }
    return res.status(500).json({ error: "Failed to submit report" });
  }
});

router.get("/moderation/check-profanity", async (req: Request, res: Response) => {
  try {
    const { text } = req.query;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: "Missing text parameter" });
    }

    const result = containsProfanity(text);
    
    return res.json({
      hasProfanity: result.hasProfanity,
      flaggedWords: result.words,
      censoredText: result.hasProfanity ? censorText(text) : text,
    });
  } catch (error) {
    console.error("Error checking profanity:", error);
    return res.status(500).json({ error: "Failed to check profanity" });
  }
});

router.get("/moderation/user-status", async (req: Request, res: Response) => {
  try {
    const { deviceHash } = req.query;
    
    if (!deviceHash || typeof deviceHash !== 'string') {
      return res.status(400).json({ error: "Missing deviceHash" });
    }

    const hashedDevice = hashDevice(deviceHash);
    const stats = await db
      .select()
      .from(teaSpillerStats)
      .where(eq(teaSpillerStats.deviceHash, hashedDevice))
      .limit(1);

    if (stats.length === 0) {
      return res.json({
        isShadowBanned: false,
        isOnCooldown: false,
        cooldownUntil: null,
        canPost: true,
      });
    }

    const now = new Date();
    const isOnCooldown = stats[0].cooldownUntil && stats[0].cooldownUntil > now;
    
    return res.json({
      isShadowBanned: stats[0].isShadowBanned,
      isOnCooldown: isOnCooldown,
      cooldownUntil: stats[0].cooldownUntil,
      cooldownMinutesRemaining: isOnCooldown 
        ? Math.ceil((stats[0].cooldownUntil!.getTime() - now.getTime()) / 60000) 
        : 0,
      canPost: !stats[0].isShadowBanned && !isOnCooldown,
    });
  } catch (error) {
    console.error("Error checking user status:", error);
    return res.status(500).json({ error: "Failed to check user status" });
  }
});

router.post("/moderation/apply-cooldown", async (req: Request, res: Response) => {
  try {
    const { deviceHash, minutes, reason } = req.body;
    
    if (!deviceHash || !minutes) {
      return res.status(400).json({ error: "Missing deviceHash or minutes" });
    }

    const hashedDevice = hashDevice(deviceHash);
    const cooldownUntil = new Date(Date.now() + minutes * 60 * 1000);
    await db
      .insert(teaSpillerStats)
      .values({
        deviceHash: hashedDevice,
        cooldownUntil,
      })
      .onConflictDoUpdate({
        target: teaSpillerStats.deviceHash,
        set: { cooldownUntil, updatedAt: new Date() },
      });

    return res.json({
      success: true,
      cooldownUntil,
      message: `Cooldown applied for ${minutes} minutes`,
    });
  } catch (error) {
    console.error("Error applying cooldown:", error);
    return res.status(500).json({ error: "Failed to apply cooldown" });
  }
});

router.post("/moderation/shadow-ban", async (req: Request, res: Response) => {
  try {
    const { deviceHash, ban } = req.body;
    
    if (!deviceHash) {
      return res.status(400).json({ error: "Missing deviceHash" });
    }

    const hashedDevice = hashDevice(deviceHash);
    const isShadowBanned = ban !== false;
    await db
      .insert(teaSpillerStats)
      .values({
        deviceHash: hashedDevice,
        isShadowBanned,
      })
      .onConflictDoUpdate({
        target: teaSpillerStats.deviceHash,
        set: { isShadowBanned, updatedAt: new Date() },
      });

    return res.json({
      success: true,
      isShadowBanned,
      message: isShadowBanned ? "User shadow banned" : "Shadow ban removed",
    });
  } catch (error) {
    console.error("Error updating shadow ban:", error);
    return res.status(500).json({ error: "Failed to update shadow ban" });
  }
});

router.get("/moderation/reports", async (req: Request, res: Response) => {
  try {
    const { status = "PENDING", limit = "50", cursor } = req.query;
    
    const conditions = [eq(anonGossipReports.status, status as string)];
    
    if (cursor) {
      conditions.push(sql`${anonGossipReports.createdAt} < ${cursor}`);
    }

    const reports = await db
      .select()
      .from(anonGossipReports)
      .where(and(...conditions))
      .orderBy(desc(anonGossipReports.createdAt))
      .limit(parseInt(limit as string) + 1);

    const hasMore = reports.length > parseInt(limit as string);
    const reportList = hasMore ? reports.slice(0, parseInt(limit as string)) : reports;
    const nextCursor = hasMore && reportList.length > 0 
      ? reportList[reportList.length - 1].createdAt.toISOString() 
      : null;

    return res.json({
      reports: reportList,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.post("/moderation/reports/:reportId/review", async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { action, reviewNotes, reviewedBy } = req.body;
    
    if (!action || !["APPROVED", "REJECTED", "ACTIONED"].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Must be APPROVED, REJECTED, or ACTIONED" });
    }
    await db
      .update(anonGossipReports)
      .set({
        status: action,
        reviewNotes,
        reviewedBy,
        reviewedAt: new Date(),
      })
      .where(eq(anonGossipReports.id, reportId));

    return res.json({
      success: true,
      message: `Report ${action.toLowerCase()}`,
    });
  } catch (error) {
    console.error("Error reviewing report:", error);
    return res.status(500).json({ error: "Failed to review report" });
  }
});

const TEA_LEVELS = {
  BRONZE: { minScore: 0, emoji: "🥉", perks: ["Basic posting", "React to posts"] },
  SILVER: { minScore: 100, emoji: "🥈", perks: ["All Bronze perks", "Create polls", "Start DMs"] },
  GOLD: { minScore: 500, emoji: "🥇", perks: ["All Silver perks", "Priority trending", "Custom alias"] },
  PLATINUM: { minScore: 2000, emoji: "💎", perks: ["All Gold perks", "Verified badge eligible", "Weekly spill host"] },
  DIAMOND: { minScore: 10000, emoji: "👑", perks: ["All Platinum perks", "Hood Legend status", "Featured posts"] },
};

function calculateTeaLevel(stats: { 
  totalPosts: number; 
  totalReactions: number; 
  totalReposts: number;
  totalReplies: number;
  accurateCount: number;
}): { level: string; score: number; nextLevel: string | null; progress: number } {
  const score = (stats.totalPosts * 10) + 
                (stats.totalReactions * 1) + 
                (stats.totalReposts * 5) + 
                (stats.totalReplies * 2) +
                (stats.accurateCount * 15);

  let currentLevel = "BRONZE";
  let nextLevel: string | null = "SILVER";
  
  if (score >= TEA_LEVELS.DIAMOND.minScore) {
    currentLevel = "DIAMOND";
    nextLevel = null;
  } else if (score >= TEA_LEVELS.PLATINUM.minScore) {
    currentLevel = "PLATINUM";
    nextLevel = "DIAMOND";
  } else if (score >= TEA_LEVELS.GOLD.minScore) {
    currentLevel = "GOLD";
    nextLevel = "PLATINUM";
  } else if (score >= TEA_LEVELS.SILVER.minScore) {
    currentLevel = "SILVER";
    nextLevel = "GOLD";
  }
  let progress = 100;
  if (nextLevel) {
    const currentMin = TEA_LEVELS[currentLevel as keyof typeof TEA_LEVELS].minScore;
    const nextMin = TEA_LEVELS[nextLevel as keyof typeof TEA_LEVELS].minScore;
    progress = Math.min(100, Math.round(((score - currentMin) / (nextMin - currentMin)) * 100));
  }

  return { level: currentLevel, score, nextLevel, progress };
}

router.get("/tea-spiller/stats", async (req: Request, res: Response) => {
  try {
    const { deviceHash } = req.query;
    
    if (!deviceHash || typeof deviceHash !== 'string') {
      return res.status(400).json({ error: "Missing deviceHash" });
    }

    const hashedDevice = hashDevice(deviceHash);
    let stats = await db
      .select()
      .from(teaSpillerStats)
      .where(eq(teaSpillerStats.deviceHash, hashedDevice))
      .limit(1);
    if (stats.length === 0) {
      const postCount = await db
        .select({ count: count() })
        .from(anonGossipPosts)
        .where(eq(anonGossipPosts.deviceHash, hashedDevice));
      
      const replyCount = await db
        .select({ count: count() })
        .from(anonGossipReplies)
        .where(eq(anonGossipReplies.deviceHash, hashedDevice));
      const newStats = await db.insert(teaSpillerStats).values({
        deviceHash: hashedDevice,
        totalPosts: postCount[0]?.count || 0,
        totalReplies: replyCount[0]?.count || 0,
      }).returning();
      
      stats = newStats;
    }
    const levelInfo = calculateTeaLevel({
      totalPosts: stats[0].totalPosts,
      totalReactions: stats[0].totalReactions,
      totalReposts: stats[0].totalReposts,
      totalReplies: stats[0].totalReplies,
      accurateCount: stats[0].accurateCount,
    });
    const levelDetails = TEA_LEVELS[levelInfo.level as keyof typeof TEA_LEVELS];
    const nextLevelDetails = levelInfo.nextLevel 
      ? TEA_LEVELS[levelInfo.nextLevel as keyof typeof TEA_LEVELS] 
      : null;

    return res.json({
      level: levelInfo.level,
      emoji: levelDetails.emoji,
      score: levelInfo.score,
      progress: levelInfo.progress,
      nextLevel: levelInfo.nextLevel,
      pointsToNextLevel: nextLevelDetails 
        ? nextLevelDetails.minScore - levelInfo.score 
        : 0,
      perks: levelDetails.perks,
      stats: {
        totalPosts: stats[0].totalPosts,
        totalReactions: stats[0].totalReactions,
        totalReposts: stats[0].totalReposts,
        totalReplies: stats[0].totalReplies,
        accurateCount: stats[0].accurateCount,
        inaccurateCount: stats[0].inaccurateCount,
        accuracyRate: stats[0].accuracyRate,
      },
      isShadowBanned: stats[0].isShadowBanned,
      cooldownUntil: stats[0].cooldownUntil,
    });
  } catch (error) {
    console.error("Error fetching tea spiller stats:", error);
    return res.status(500).json({ error: "Failed to fetch tea spiller stats" });
  }
});

router.post("/tea-spiller/recalculate", async (req: Request, res: Response) => {
  try {
    const { deviceHash } = req.body;
    
    if (!deviceHash) {
      return res.status(400).json({ error: "Missing deviceHash" });
    }

    const hashedDevice = hashDevice(deviceHash);
    const postCount = await db
      .select({ count: count() })
      .from(anonGossipPosts)
      .where(eq(anonGossipPosts.deviceHash, hashedDevice));
    
    const replyCount = await db
      .select({ count: count() })
      .from(anonGossipReplies)
      .where(eq(anonGossipReplies.deviceHash, hashedDevice));
    const reactionsReceived = await db
      .select({ count: count() })
      .from(anonGossipReactions)
      .innerJoin(anonGossipPosts, eq(anonGossipReactions.postId, anonGossipPosts.id))
      .where(eq(anonGossipPosts.deviceHash, hashedDevice));

    const repostsReceived = await db
      .select({ count: count() })
      .from(gossipReposts)
      .innerJoin(anonGossipPosts, eq(gossipReposts.postId, anonGossipPosts.id))
      .where(eq(anonGossipPosts.deviceHash, hashedDevice));
    const accuracyVotes = await db
      .select({
        accurate: sql<number>`SUM(CASE WHEN vote = 'TRUE' THEN 1 ELSE 0 END)::int`,
        inaccurate: sql<number>`SUM(CASE WHEN vote = 'FALSE' THEN 1 ELSE 0 END)::int`,
      })
      .from(gossipAccuracyVotes)
      .innerJoin(anonGossipPosts, eq(gossipAccuracyVotes.postId, anonGossipPosts.id))
      .where(eq(anonGossipPosts.deviceHash, hashedDevice));

    const accurateCount = accuracyVotes[0]?.accurate || 0;
    const inaccurateCount = accuracyVotes[0]?.inaccurate || 0;
    const totalVotes = accurateCount + inaccurateCount;
    const accuracyRate = totalVotes > 0 ? accurateCount / totalVotes : 0;

    const updatedStats = {
      totalPosts: postCount[0]?.count || 0,
      totalReplies: replyCount[0]?.count || 0,
      totalReactions: reactionsReceived[0]?.count || 0,
      totalReposts: repostsReceived[0]?.count || 0,
      accurateCount,
      inaccurateCount,
      accuracyRate,
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    };
    const levelInfo = calculateTeaLevel({
      totalPosts: updatedStats.totalPosts,
      totalReactions: updatedStats.totalReactions,
      totalReposts: updatedStats.totalReposts,
      totalReplies: updatedStats.totalReplies,
      accurateCount: updatedStats.accurateCount,
    });
    await db
      .insert(teaSpillerStats)
      .values({
        deviceHash: hashedDevice,
        ...updatedStats,
        level: levelInfo.level as any,
      })
      .onConflictDoUpdate({
        target: teaSpillerStats.deviceHash,
        set: {
          ...updatedStats,
          level: levelInfo.level as any,
        },
      });

    return res.json({
      success: true,
      level: levelInfo.level,
      score: levelInfo.score,
      stats: updatedStats,
    });
  } catch (error) {
    console.error("Error recalculating tea spiller stats:", error);
    return res.status(500).json({ error: "Failed to recalculate stats" });
  }
});

router.get("/tea-spiller/levels", async (req: Request, res: Response) => {
  try {
    const levels = Object.entries(TEA_LEVELS).map(([name, details]) => ({
      name,
      ...details,
    }));

    return res.json({ levels });
  } catch (error) {
    console.error("Error fetching tea spiller levels:", error);
    return res.status(500).json({ error: "Failed to fetch levels" });
  }
});

router.get("/tea-spiller/leaderboard", async (req: Request, res: Response) => {
  try {
    const { locationId, limit = "20" } = req.query;
    let leaderboard;

    if (locationId) {
      leaderboard = await db
        .select({
          deviceHash: teaSpillerStats.deviceHash,
          level: teaSpillerStats.level,
          totalPosts: teaSpillerStats.totalPosts,
          totalReactions: teaSpillerStats.totalReactions,
          accuracyRate: teaSpillerStats.accuracyRate,
        })
        .from(teaSpillerStats)
        .innerJoin(anonGossipPosts, eq(teaSpillerStats.deviceHash, anonGossipPosts.deviceHash))
        .where(eq(anonGossipPosts.zaLocationId, locationId as string))
        .orderBy(
          desc(sql`CASE 
            WHEN ${teaSpillerStats.level} = 'DIAMOND' THEN 5
            WHEN ${teaSpillerStats.level} = 'PLATINUM' THEN 4
            WHEN ${teaSpillerStats.level} = 'GOLD' THEN 3
            WHEN ${teaSpillerStats.level} = 'SILVER' THEN 2
            ELSE 1
          END`),
          desc(teaSpillerStats.totalPosts)
        )
        .limit(parseInt(limit as string));
    } else {
      leaderboard = await db
        .select({
          deviceHash: teaSpillerStats.deviceHash,
          level: teaSpillerStats.level,
          totalPosts: teaSpillerStats.totalPosts,
          totalReactions: teaSpillerStats.totalReactions,
          accuracyRate: teaSpillerStats.accuracyRate,
        })
        .from(teaSpillerStats)
        .where(eq(teaSpillerStats.isShadowBanned, false))
        .orderBy(
          desc(sql`CASE 
            WHEN ${teaSpillerStats.level} = 'DIAMOND' THEN 5
            WHEN ${teaSpillerStats.level} = 'PLATINUM' THEN 4
            WHEN ${teaSpillerStats.level} = 'GOLD' THEN 3
            WHEN ${teaSpillerStats.level} = 'SILVER' THEN 2
            ELSE 1
          END`),
          desc(teaSpillerStats.totalPosts)
        )
        .limit(parseInt(limit as string));
    }
    const leaderboardWithAliases = leaderboard.map((entry, index) => ({
      rank: index + 1,
      level: entry.level,
      emoji: TEA_LEVELS[entry.level as keyof typeof TEA_LEVELS]?.emoji || "🥉",
      alias: generateAliasFromHash(entry.deviceHash),
      stats: {
        posts: entry.totalPosts,
        reactions: entry.totalReactions,
        accuracyRate: Math.round((entry.accuracyRate || 0) * 100),
      },
    }));

    return res.json({ leaderboard: leaderboardWithAliases });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

function generateAliasFromHash(hash: string): string {
  const adjectives = ["Secret", "Shadow", "Hidden", "Masked", "Silent", "Whispered", "Anonymous"];
  const nouns = ["Spiller", "Insider", "Witness", "Reporter", "Messenger", "Informant"];
  const hashNum = parseInt(hash.substring(0, 8), 16) || 0;
  const adj = adjectives[Math.abs(hashNum) % adjectives.length];
  const noun = nouns[Math.abs(hashNum >> 4) % nouns.length];
  const num = (Math.abs(hashNum) % 100).toString().padStart(2, '0');
  return `${adj} ${noun}${num}`;
}

const linkPostSchema = z.object({
  deviceHash: z.string(),
  originalPostId: z.string(),
  linkedPostId: z.string(),
  linkType: z.enum(["PART_2", "UPDATE", "CORRECTION", "RELATED"]).default("PART_2"),
});

router.post("/posts/link", async (req: Request, res: Response) => {
  try {
    const { deviceHash, originalPostId, linkedPostId, linkType } = linkPostSchema.parse(req.body);
    const hashedDevice = hashDevice(deviceHash);
    const originalPost = await db
      .select()
      .from(anonGossipPosts)
      .where(eq(anonGossipPosts.id, originalPostId))
      .limit(1);

    if (originalPost.length === 0) {
      return res.status(404).json({ error: "Original post not found" });
    }
    const linkedPost = await db
      .select()
      .from(anonGossipPosts)
      .where(eq(anonGossipPosts.id, linkedPostId))
      .limit(1);

    if (linkedPost.length === 0) {
      return res.status(404).json({ error: "Linked post not found" });
    }
    if (linkedPost[0].deviceHash !== hashedDevice) {
      return res.status(403).json({ error: "You can only link your own posts" });
    }
    const existingLink = await db
      .select()
      .from(gossipPostLinks)
      .where(
        and(
          eq(gossipPostLinks.originalPostId, originalPostId),
          eq(gossipPostLinks.linkedPostId, linkedPostId)
        )
      )
      .limit(1);

    if (existingLink.length > 0) {
      return res.status(400).json({ error: "Posts are already linked" });
    }
    const link = await db.insert(gossipPostLinks).values({
      originalPostId,
      linkedPostId,
      linkType,
    }).returning();

    return res.status(201).json({
      success: true,
      link: link[0],
      message: `Post linked as ${linkType.replace("_", " ")}`,
    });
  } catch (error) {
    console.error("Error linking posts:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request", details: error.errors });
    }
    return res.status(500).json({ error: "Failed to link posts" });
  }
});

router.get("/posts/:postId/links", async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const linksFrom = await db
      .select({
        id: gossipPostLinks.id,
        linkedPostId: gossipPostLinks.linkedPostId,
        linkType: gossipPostLinks.linkType,
        createdAt: gossipPostLinks.createdAt,
      })
      .from(gossipPostLinks)
      .where(eq(gossipPostLinks.originalPostId, postId))
      .orderBy(asc(gossipPostLinks.createdAt));
    const linksTo = await db
      .select({
        id: gossipPostLinks.id,
        originalPostId: gossipPostLinks.originalPostId,
        linkType: gossipPostLinks.linkType,
        createdAt: gossipPostLinks.createdAt,
      })
      .from(gossipPostLinks)
      .where(eq(gossipPostLinks.linkedPostId, postId))
      .orderBy(asc(gossipPostLinks.createdAt));
    const linkedPostIds = [
      ...linksFrom.map(l => l.linkedPostId),
      ...linksTo.map(l => l.originalPostId),
    ];

    let linkedPosts: any[] = [];
    if (linkedPostIds.length > 0) {
      linkedPosts = await db
        .select({
          id: anonGossipPosts.id,
          content: anonGossipPosts.content,
          createdAt: anonGossipPosts.createdAt,
          fireCount: anonGossipPosts.fireCount,
          replyCount: anonGossipPosts.replyCount,
        })
        .from(anonGossipPosts)
        .where(sql`${anonGossipPosts.id} IN (${sql.join(linkedPostIds.map(id => sql`${id}`), sql`, `)})`);
    }

    return res.json({
      parts: linksFrom.map(l => ({
        ...l,
        direction: "next",
        post: linkedPosts.find(p => p.id === l.linkedPostId),
      })),
      previousParts: linksTo.map(l => ({
        ...l,
        direction: "previous",
        post: linkedPosts.find(p => p.id === l.originalPostId),
      })),
      totalParts: linksFrom.length + linksTo.length + 1,
    });
  } catch (error) {
    console.error("Error fetching post links:", error);
    return res.status(500).json({ error: "Failed to fetch post links" });
  }
});

router.get("/posts/:postId/thread", async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const allPostIds = new Set<string>([postId]);
    let currentIds = [postId];
    while (currentIds.length > 0) {
      const links = await db
        .select()
        .from(gossipPostLinks)
        .where(
          sql`${gossipPostLinks.originalPostId} IN (${sql.join(currentIds.map(id => sql`${id}`), sql`, `)}) OR ${gossipPostLinks.linkedPostId} IN (${sql.join(currentIds.map(id => sql`${id}`), sql`, `)})`
        );

      const newIds: string[] = [];
      for (const link of links) {
        if (!allPostIds.has(link.originalPostId)) {
          allPostIds.add(link.originalPostId);
          newIds.push(link.originalPostId);
        }
        if (!allPostIds.has(link.linkedPostId)) {
          allPostIds.add(link.linkedPostId);
          newIds.push(link.linkedPostId);
        }
      }
      currentIds = newIds;
      if (allPostIds.size > 50) break;
    }
    if (allPostIds.size === 0) {
      return res.json({ thread: [], totalParts: 0 });
    }

    const threadPosts = await db
      .select({
        id: anonGossipPosts.id,
        content: anonGossipPosts.content,
        postType: anonGossipPosts.postType,
        createdAt: anonGossipPosts.createdAt,
        fireCount: anonGossipPosts.fireCount,
        replyCount: anonGossipPosts.replyCount,
        viewCount: anonGossipPosts.viewCount,
      })
      .from(anonGossipPosts)
      .where(sql`${anonGossipPosts.id} IN (${sql.join(Array.from(allPostIds).map(id => sql`${id}`), sql`, `)})`)
      .orderBy(asc(anonGossipPosts.createdAt));

    return res.json({
      thread: threadPosts.map((post, index) => ({
        ...post,
        partNumber: index + 1,
        isCurrentPost: post.id === postId,
      })),
      totalParts: threadPosts.length,
    });
  } catch (error) {
    console.error("Error fetching post thread:", error);
    return res.status(500).json({ error: "Failed to fetch post thread" });
  }
});

router.delete("/posts/link/:linkId", async (req: Request, res: Response) => {
  try {
    const { linkId } = req.params;
    const { deviceHash } = req.body;
    
    if (!deviceHash) {
      return res.status(400).json({ error: "Missing deviceHash" });
    }

    const hashedDevice = hashDevice(deviceHash);
    const link = await db
      .select()
      .from(gossipPostLinks)
      .where(eq(gossipPostLinks.id, linkId))
      .limit(1);

    if (link.length === 0) {
      return res.status(404).json({ error: "Link not found" });
    }
    const linkedPost = await db
      .select()
      .from(anonGossipPosts)
      .where(eq(anonGossipPosts.id, link[0].linkedPostId))
      .limit(1);

    if (linkedPost.length === 0 || linkedPost[0].deviceHash !== hashedDevice) {
      return res.status(403).json({ error: "You can only unlink your own posts" });
    }
    await db
      .delete(gossipPostLinks)
      .where(eq(gossipPostLinks.id, linkId));

    return res.json({ success: true, message: "Posts unlinked" });
  } catch (error) {
    console.error("Error unlinking posts:", error);
    return res.status(500).json({ error: "Failed to unlink posts" });
  }
});

router.get("/rivalries/active", async (req: Request, res: Response) => {
  try {
    const activeRivalries = await db
      .select()
      .from(hoodRivalries)
      .where(eq(hoodRivalries.isActive, true))
      .orderBy(desc(hoodRivalries.createdAt));

    return res.json({ rivalries: activeRivalries });
  } catch (error) {
    console.error("Error fetching active rivalries:", error);
    return res.status(500).json({ error: "Failed to fetch rivalries" });
  }
});

router.get("/rivalries/hood/:hoodId", async (req: Request, res: Response) => {
  try {
    const { hoodId } = req.params;
    const rivalries = await db
      .select()
      .from(hoodRivalries)
      .where(
        sql`${hoodRivalries.hood1Id} = ${hoodId} OR ${hoodRivalries.hood2Id} = ${hoodId}`
      )
      .orderBy(desc(hoodRivalries.createdAt))
      .limit(10);

    const rivalriesWithPerspective = rivalries.map(r => ({
      ...r,
      isHood1: r.hood1Id === hoodId,
      myHoodName: r.hood1Id === hoodId ? r.hood1Name : r.hood2Name,
      opponentName: r.hood1Id === hoodId ? r.hood2Name : r.hood1Name,
      myScore: r.hood1Id === hoodId ? r.hood1Score : r.hood2Score,
      opponentScore: r.hood1Id === hoodId ? r.hood2Score : r.hood1Score,
      won: r.winnerId === hoodId,
      lost: r.winnerId !== null && r.winnerId !== hoodId,
    }));

    return res.json({ rivalries: rivalriesWithPerspective });
  } catch (error) {
    console.error("Error fetching hood rivalries:", error);
    return res.status(500).json({ error: "Failed to fetch rivalries" });
  }
});

router.post("/rivalries/create", async (req: Request, res: Response) => {
  try {
    const { hood1Id, hood2Id } = req.body;
    
    if (!hood1Id || !hood2Id) {
      return res.status(400).json({ error: "Missing hood IDs" });
    }

    if (hood1Id === hood2Id) {
      return res.status(400).json({ error: "Cannot create rivalry between same hood" });
    }
    const hood1 = await db
      .select()
      .from(gossipLocations)
      .where(eq(gossipLocations.id, hood1Id))
      .limit(1);

    const hood2 = await db
      .select()
      .from(gossipLocations)
      .where(eq(gossipLocations.id, hood2Id))
      .limit(1);

    if (hood1.length === 0 || hood2.length === 0) {
      return res.status(404).json({ error: "One or both hoods not found" });
    }
    const existingRivalry = await db
      .select()
      .from(hoodRivalries)
      .where(
        and(
          eq(hoodRivalries.isActive, true),
          sql`(${hoodRivalries.hood1Id} = ${hood1Id} AND ${hoodRivalries.hood2Id} = ${hood2Id}) OR (${hoodRivalries.hood1Id} = ${hood2Id} AND ${hoodRivalries.hood2Id} = ${hood1Id})`
        )
      )
      .limit(1);

    if (existingRivalry.length > 0) {
      return res.status(400).json({ error: "Active rivalry already exists between these hoods" });
    }
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - now.getDay());
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    const rivalry = await db.insert(hoodRivalries).values({
      hood1Id,
      hood2Id,
      hood1Name: hood1[0].name,
      hood2Name: hood2[0].name,
      hood1Score: 0,
      hood2Score: 0,
      weekStart,
      weekEnd,
      isActive: true,
    }).returning();

    return res.status(201).json({
      success: true,
      rivalry: rivalry[0],
    });
  } catch (error) {
    console.error("Error creating rivalry:", error);
    return res.status(500).json({ error: "Failed to create rivalry" });
  }
});

router.get("/rivalries/:rivalryId/leaderboard", async (req: Request, res: Response) => {
  try {
    const { rivalryId } = req.params;
    const rivalry = await db
      .select()
      .from(hoodRivalries)
      .where(eq(hoodRivalries.id, rivalryId))
      .limit(1);

    if (rivalry.length === 0) {
      return res.status(404).json({ error: "Rivalry not found" });
    }

    const r = rivalry[0];
    const hood1Stats = await db
      .select({
        totalPosts: count(),
        totalReactions: sql<number>`COALESCE(SUM(${anonGossipPosts.fireCount}), 0)::int`,
      })
      .from(anonGossipPosts)
      .where(
        and(
          eq(anonGossipPosts.zaLocationId, r.hood1Id),
          gte(anonGossipPosts.createdAt, r.weekStart),
          sql`${anonGossipPosts.createdAt} <= ${r.weekEnd}`
        )
      );

    const hood2Stats = await db
      .select({
        totalPosts: count(),
        totalReactions: sql<number>`COALESCE(SUM(${anonGossipPosts.fireCount}), 0)::int`,
      })
      .from(anonGossipPosts)
      .where(
        and(
          eq(anonGossipPosts.zaLocationId, r.hood2Id),
          gte(anonGossipPosts.createdAt, r.weekStart),
          sql`${anonGossipPosts.createdAt} <= ${r.weekEnd}`
        )
      );
    const hood1Score = (hood1Stats[0]?.totalPosts || 0) * 10 + (hood1Stats[0]?.totalReactions || 0);
    const hood2Score = (hood2Stats[0]?.totalPosts || 0) * 10 + (hood2Stats[0]?.totalReactions || 0);
    await db
      .update(hoodRivalries)
      .set({ hood1Score, hood2Score })
      .where(eq(hoodRivalries.id, rivalryId));

    return res.json({
      rivalry: {
        ...r,
        hood1Score,
        hood2Score,
      },
      hood1: {
        id: r.hood1Id,
        name: r.hood1Name,
        score: hood1Score,
        posts: hood1Stats[0]?.totalPosts || 0,
        reactions: hood1Stats[0]?.totalReactions || 0,
        isWinning: hood1Score > hood2Score,
      },
      hood2: {
        id: r.hood2Id,
        name: r.hood2Name,
        score: hood2Score,
        posts: hood2Stats[0]?.totalPosts || 0,
        reactions: hood2Stats[0]?.totalReactions || 0,
        isWinning: hood2Score > hood1Score,
      },
      scoreDifference: Math.abs(hood1Score - hood2Score),
      isTied: hood1Score === hood2Score,
    });
  } catch (error) {
    console.error("Error fetching rivalry leaderboard:", error);
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

router.get("/hoods/leaderboard", async (req: Request, res: Response) => {
  try {
    const { parentId, limit = "20" } = req.query;
    const hoods = await db
      .select()
      .from(gossipLocations)
      .where(
        parentId
          ? and(eq(gossipLocations.type, "HOOD"), eq(gossipLocations.parentId, parentId as string))
          : eq(gossipLocations.type, "HOOD")
      )
      .limit(50);

    const hoodScores = await Promise.all(
      hoods.map(async (hood) => {
        const postStats = await db
          .select({ cnt: count() })
          .from(anonGossipPosts)
          .where(eq(anonGossipPosts.zaLocationId, hood.id));
        
        const postCount = postStats[0]?.cnt || 0;
        const engagementScore = postCount * 10;

        return {
          id: hood.id,
          name: hood.name,
          postCount,
          totalEngagement: engagementScore,
          score: engagementScore,
        };
      })
    );

    const sortedHoods = hoodScores
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit as string))
      .map((hood, index) => ({
        rank: index + 1,
        ...hood,
      }));

    return res.json({ 
      leaderboard: sortedHoods,
      period: "last 7 days",
    });
  } catch (error) {
    console.error("Error fetching hoods leaderboard:", error);
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

router.post("/rivalries/:rivalryId/end", async (req: Request, res: Response) => {
  try {
    const { rivalryId } = req.params;
    const rivalry = await db
      .select()
      .from(hoodRivalries)
      .where(eq(hoodRivalries.id, rivalryId))
      .limit(1);

    if (rivalry.length === 0) {
      return res.status(404).json({ error: "Rivalry not found" });
    }

    const r = rivalry[0];
    let winnerId: string | null = null;
    
    if (r.hood1Score > r.hood2Score) {
      winnerId = r.hood1Id;
    } else if (r.hood2Score > r.hood1Score) {
      winnerId = r.hood2Id;
    }
    await db
      .update(hoodRivalries)
      .set({ 
        isActive: false,
        winnerId,
      })
      .where(eq(hoodRivalries.id, rivalryId));

    return res.json({
      success: true,
      winnerId,
      winnerName: winnerId === r.hood1Id ? r.hood1Name : (winnerId === r.hood2Id ? r.hood2Name : null),
      isTied: winnerId === null,
      finalScore: {
        [r.hood1Name]: r.hood1Score,
        [r.hood2Name]: r.hood2Score,
      },
    });
  } catch (error) {
    console.error("Error ending rivalry:", error);
    return res.status(500).json({ error: "Failed to end rivalry" });
  }
});

// ============================================================
// LOCAL LEGENDS BOARD
// ============================================================

// Get local legends for a location
router.get("/legends/:locationId", async (req: Request, res: Response) => {
  try {
    const { locationId } = req.params;
    const { limit = "10" } = req.query;

    // First get legends
    const legends = await db
      .select()
      .from(gossipLocalLegends)
      .where(eq(gossipLocalLegends.zaLocationId, locationId))
      .orderBy(desc(gossipLocalLegends.totalEngagement))
      .limit(parseInt(limit as string));

    // Enrich with tea spiller stats
    const enrichedLegends = await Promise.all(
      legends.map(async (legend, idx) => {
        const [stats] = await db
          .select()
          .from(teaSpillerStats)
          .where(eq(teaSpillerStats.deviceHash, legend.deviceHash))
          .limit(1);

        return {
          id: legend.id,
          deviceHash: legend.deviceHash,
          totalEngagement: legend.totalEngagement,
          totalVerifiedPosts: legend.totalVerifiedPosts,
          rank: idx + 1,
          level: stats?.level || "BRONZE",
          score: stats?.score || 0,
          displayName: `${EMOJIS[idx % EMOJIS.length]} Legend #${idx + 1}`,
        };
      })
    );

    return res.json({
      legends: enrichedLegends,
      locationId,
    });
  } catch (error) {
    console.error("Error fetching local legends:", error);
    return res.status(500).json({ error: "Failed to fetch local legends" });
  }
});

// Update/recalculate local legends for a location
router.post("/legends/:locationId/recalculate", async (req: Request, res: Response) => {
  try {
    const { locationId } = req.params;

    // Get all posts for this location and calculate engagement per device
    const deviceEngagement = await db
      .select({
        deviceHash: anonGossipPosts.deviceHash,
        totalPosts: count(),
        totalEngagement: sql<number>`SUM(${anonGossipPosts.fireCount} + ${anonGossipPosts.mindblownCount} + ${anonGossipPosts.laughCount} + ${anonGossipPosts.skullCount} + ${anonGossipPosts.eyesCount} + ${anonGossipPosts.replyCount})`,
        totalVerified: sql<number>`SUM(CASE WHEN ${anonGossipPosts.isVerifiedTea} THEN 1 ELSE 0 END)`,
      })
      .from(anonGossipPosts)
      .where(eq(anonGossipPosts.zaLocationId, locationId))
      .groupBy(anonGossipPosts.deviceHash)
      .orderBy(desc(sql`SUM(${anonGossipPosts.fireCount} + ${anonGossipPosts.mindblownCount} + ${anonGossipPosts.laughCount} + ${anonGossipPosts.skullCount} + ${anonGossipPosts.eyesCount} + ${anonGossipPosts.replyCount})`))
      .limit(100);

    // Update or insert legends
    for (let i = 0; i < deviceEngagement.length; i++) {
      const device = deviceEngagement[i];
      const existing = await db
        .select()
        .from(gossipLocalLegends)
        .where(and(
          eq(gossipLocalLegends.zaLocationId, locationId),
          eq(gossipLocalLegends.deviceHash, device.deviceHash)
        ))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(gossipLocalLegends)
          .set({
            totalEngagement: device.totalEngagement || 0,
            totalVerifiedPosts: device.totalVerified || 0,
            rank: i + 1,
            lastUpdated: new Date(),
          })
          .where(eq(gossipLocalLegends.id, existing[0].id));
      } else {
        await db.insert(gossipLocalLegends).values({
          zaLocationId: locationId,
          deviceHash: device.deviceHash,
          totalEngagement: device.totalEngagement || 0,
          totalVerifiedPosts: device.totalVerified || 0,
          rank: i + 1,
        });
      }
    }

    return res.json({
      success: true,
      legendsUpdated: deviceEngagement.length,
      locationId,
    });
  } catch (error) {
    console.error("Error recalculating local legends:", error);
    return res.status(500).json({ error: "Failed to recalculate legends" });
  }
});

// ============================================================
// AWARDS SYSTEM
// ============================================================

// Get awards for a time period
router.get("/awards", async (req: Request, res: Response) => {
  try {
    const { period = "WEEKLY_TOP", locationId, limit = "10" } = req.query;

    let whereConditions = [eq(gossipAwards.awardType, period as string)];
    if (locationId) {
      whereConditions.push(eq(gossipAwards.zaLocationId, locationId as string));
    }

    const awards = await db
      .select({
        id: gossipAwards.id,
        postId: gossipAwards.postId,
        awardType: gossipAwards.awardType,
        rank: gossipAwards.rank,
        periodStart: gossipAwards.periodStart,
        periodEnd: gossipAwards.periodEnd,
        post: {
          content: anonGossipPosts.content,
          type: anonGossipPosts.type,
          teaMeter: anonGossipPosts.teaMeter,
          fireCount: anonGossipPosts.fireCount,
          isVerifiedTea: anonGossipPosts.isVerifiedTea,
          createdAt: anonGossipPosts.createdAt,
        },
      })
      .from(gossipAwards)
      .innerJoin(anonGossipPosts, eq(gossipAwards.postId, anonGossipPosts.id))
      .where(and(...whereConditions))
      .orderBy(desc(gossipAwards.periodStart), asc(gossipAwards.rank))
      .limit(parseInt(limit as string));

    return res.json({ awards, period });
  } catch (error) {
    console.error("Error fetching awards:", error);
    return res.status(500).json({ error: "Failed to fetch awards" });
  }
});

// Calculate and assign weekly awards
router.post("/awards/calculate-weekly", async (req: Request, res: Response) => {
  try {
    const { locationId } = req.body;
    
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    let whereConditions = [gte(anonGossipPosts.createdAt, weekStart)];
    if (locationId) {
      whereConditions.push(eq(anonGossipPosts.zaLocationId, locationId));
    }

    // Get top posts by total engagement
    const topPosts = await db
      .select({
        id: anonGossipPosts.id,
        deviceHash: anonGossipPosts.deviceHash,
        totalEngagement: sql<number>`${anonGossipPosts.fireCount} + ${anonGossipPosts.mindblownCount} + ${anonGossipPosts.laughCount} + ${anonGossipPosts.skullCount} + ${anonGossipPosts.eyesCount}`,
      })
      .from(anonGossipPosts)
      .where(and(...whereConditions))
      .orderBy(desc(sql`${anonGossipPosts.fireCount} + ${anonGossipPosts.mindblownCount} + ${anonGossipPosts.laughCount} + ${anonGossipPosts.skullCount} + ${anonGossipPosts.eyesCount}`))
      .limit(5);

    // Get most accurate posts
    const mostAccurate = await db
      .select({
        id: anonGossipPosts.id,
        deviceHash: anonGossipPosts.deviceHash,
        accuracyScore: sql<number>`${anonGossipPosts.accuracyTrueVotes} - ${anonGossipPosts.accuracyFalseVotes}`,
      })
      .from(anonGossipPosts)
      .where(and(
        ...whereConditions,
        sql`(${anonGossipPosts.accuracyTrueVotes} + ${anonGossipPosts.accuracyFalseVotes}) >= 10`
      ))
      .orderBy(desc(sql`${anonGossipPosts.accuracyTrueVotes} - ${anonGossipPosts.accuracyFalseVotes}`))
      .limit(3);

    // Get funniest (most laugh reactions)
    const funniest = await db
      .select({
        id: anonGossipPosts.id,
        deviceHash: anonGossipPosts.deviceHash,
      })
      .from(anonGossipPosts)
      .where(and(...whereConditions))
      .orderBy(desc(anonGossipPosts.laughCount))
      .limit(3);

    // Get most shocking (most mindblown + skull)
    const shocking = await db
      .select({
        id: anonGossipPosts.id,
        deviceHash: anonGossipPosts.deviceHash,
      })
      .from(anonGossipPosts)
      .where(and(...whereConditions))
      .orderBy(desc(sql`${anonGossipPosts.mindblownCount} + ${anonGossipPosts.skullCount}`))
      .limit(3);

    const awardsToInsert: any[] = [];
    const periodStart = weekStart;
    const periodEnd = now;

    // Add weekly top awards
    topPosts.forEach((post, idx) => {
      awardsToInsert.push({
        postId: post.id,
        deviceHash: post.deviceHash,
        awardType: "WEEKLY_TOP",
        zaLocationId: locationId || null,
        periodStart,
        periodEnd,
        rank: idx + 1,
      });
    });

    // Add most accurate awards
    mostAccurate.forEach((post, idx) => {
      awardsToInsert.push({
        postId: post.id,
        deviceHash: post.deviceHash,
        awardType: "MOST_ACCURATE",
        zaLocationId: locationId || null,
        periodStart,
        periodEnd,
        rank: idx + 1,
      });
    });

    // Add funniest awards
    funniest.forEach((post, idx) => {
      awardsToInsert.push({
        postId: post.id,
        deviceHash: post.deviceHash,
        awardType: "FUNNIEST",
        zaLocationId: locationId || null,
        periodStart,
        periodEnd,
        rank: idx + 1,
      });
    });

    // Add shocking awards
    shocking.forEach((post, idx) => {
      awardsToInsert.push({
        postId: post.id,
        deviceHash: post.deviceHash,
        awardType: "MOST_SHOCKING",
        zaLocationId: locationId || null,
        periodStart,
        periodEnd,
        rank: idx + 1,
      });
    });

    if (awardsToInsert.length > 0) {
      await db.insert(gossipAwards).values(awardsToInsert);
    }

    return res.json({
      success: true,
      awardsCreated: awardsToInsert.length,
      breakdown: {
        weeklyTop: topPosts.length,
        mostAccurate: mostAccurate.length,
        funniest: funniest.length,
        mostShocking: shocking.length,
      },
      period: { start: periodStart, end: periodEnd },
    });
  } catch (error) {
    console.error("Error calculating weekly awards:", error);
    return res.status(500).json({ error: "Failed to calculate awards" });
  }
});

// Get award winners for a device
router.get("/awards/my-awards", async (req: Request, res: Response) => {
  try {
    const deviceId = req.headers["x-device-id"] as string;
    if (!deviceId) {
      return res.status(400).json({ error: "Device ID required" });
    }

    const deviceHash = hashDevice(deviceId);

    const myAwards = await db
      .select({
        id: gossipAwards.id,
        postId: gossipAwards.postId,
        awardType: gossipAwards.awardType,
        rank: gossipAwards.rank,
        periodStart: gossipAwards.periodStart,
        periodEnd: gossipAwards.periodEnd,
        createdAt: gossipAwards.createdAt,
      })
      .from(gossipAwards)
      .where(eq(gossipAwards.deviceHash, deviceHash))
      .orderBy(desc(gossipAwards.createdAt))
      .limit(50);

    const awardCounts = myAwards.reduce((acc: Record<string, number>, award) => {
      acc[award.awardType] = (acc[award.awardType] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      awards: myAwards,
      totalAwards: myAwards.length,
      breakdown: awardCounts,
    });
  } catch (error) {
    console.error("Error fetching my awards:", error);
    return res.status(500).json({ error: "Failed to fetch awards" });
  }
});

// ============================================================
// WEEKLY SPILL SESSIONS
// ============================================================

// Get upcoming/active spill sessions
router.get("/spill-sessions", async (req: Request, res: Response) => {
  try {
    const { locationId, status } = req.query;
    const now = new Date();

    let whereConditions: any[] = [];
    
    if (status) {
      whereConditions.push(eq(gossipSpillSessions.status, status as string));
    } else {
      // Default: show scheduled and active sessions
      whereConditions.push(sql`${gossipSpillSessions.status} IN ('SCHEDULED', 'ACTIVE')`);
    }

    if (locationId) {
      whereConditions.push(eq(gossipSpillSessions.zaLocationId, locationId as string));
    }

    const sessions = await db
      .select()
      .from(gossipSpillSessions)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(asc(gossipSpillSessions.scheduledStart))
      .limit(20);

    // Add countdown/time info
    const sessionsWithTime = sessions.map(session => {
      const startTime = new Date(session.scheduledStart);
      const endTime = new Date(session.scheduledEnd);
      const isActive = now >= startTime && now <= endTime;
      const isUpcoming = now < startTime;
      const msUntilStart = startTime.getTime() - now.getTime();
      const msUntilEnd = endTime.getTime() - now.getTime();

      return {
        ...session,
        isActive,
        isUpcoming,
        isEnded: now > endTime,
        countdown: isUpcoming ? {
          hours: Math.floor(msUntilStart / (1000 * 60 * 60)),
          minutes: Math.floor((msUntilStart % (1000 * 60 * 60)) / (1000 * 60)),
        } : null,
        timeRemaining: isActive ? {
          hours: Math.floor(msUntilEnd / (1000 * 60 * 60)),
          minutes: Math.floor((msUntilEnd % (1000 * 60 * 60)) / (1000 * 60)),
        } : null,
      };
    });

    return res.json({ sessions: sessionsWithTime });
  } catch (error) {
    console.error("Error fetching spill sessions:", error);
    return res.status(500).json({ error: "Failed to fetch spill sessions" });
  }
});

// Create a new spill session (admin)
router.post("/spill-sessions", async (req: Request, res: Response) => {
  try {
    const { title, description, locationId, scheduledStart, scheduledEnd, engagementBoost } = req.body;

    if (!title || !scheduledStart || !scheduledEnd) {
      return res.status(400).json({ error: "Title, scheduledStart, and scheduledEnd required" });
    }

    const [session] = await db.insert(gossipSpillSessions).values({
      title,
      description,
      zaLocationId: locationId || null,
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: new Date(scheduledEnd),
      engagementBoost: engagementBoost || 1.5,
    }).returning();

    return res.json({ session });
  } catch (error) {
    console.error("Error creating spill session:", error);
    return res.status(500).json({ error: "Failed to create spill session" });
  }
});

// Update spill session status
router.patch("/spill-sessions/:sessionId", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { status, totalPosts, totalReactions } = req.body;

    const updates: any = {};
    if (status) updates.status = status;
    if (totalPosts !== undefined) updates.totalPosts = totalPosts;
    if (totalReactions !== undefined) updates.totalReactions = totalReactions;

    const [updated] = await db
      .update(gossipSpillSessions)
      .set(updates)
      .where(eq(gossipSpillSessions.id, sessionId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Session not found" });
    }

    return res.json({ session: updated });
  } catch (error) {
    console.error("Error updating spill session:", error);
    return res.status(500).json({ error: "Failed to update spill session" });
  }
});

// Get active spill session for boosted visibility
router.get("/spill-sessions/active", async (req: Request, res: Response) => {
  try {
    const { locationId } = req.query;
    const now = new Date();

    let whereConditions = [
      eq(gossipSpillSessions.status, "ACTIVE"),
      sql`${gossipSpillSessions.scheduledStart} <= ${now}`,
      sql`${gossipSpillSessions.scheduledEnd} >= ${now}`,
    ];

    if (locationId) {
      whereConditions.push(eq(gossipSpillSessions.zaLocationId, locationId as string));
    }

    const [activeSession] = await db
      .select()
      .from(gossipSpillSessions)
      .where(and(...whereConditions))
      .limit(1);

    return res.json({
      active: !!activeSession,
      session: activeSession || null,
      engagementBoost: activeSession?.engagementBoost || 1,
    });
  } catch (error) {
    console.error("Error fetching active spill session:", error);
    return res.status(500).json({ error: "Failed to fetch active session" });
  }
});

// ============================================================
// ANALYTICS DASHBOARD
// ============================================================

// Get tea stats dashboard for a device
router.get("/analytics/my-stats", async (req: Request, res: Response) => {
  try {
    const deviceId = req.headers["x-device-id"] as string;
    if (!deviceId) {
      return res.status(400).json({ error: "Device ID required" });
    }

    const deviceHash = hashDevice(deviceId);

    // Get tea spiller stats
    const [stats] = await db
      .select()
      .from(teaSpillerStats)
      .where(eq(teaSpillerStats.deviceHash, deviceHash))
      .limit(1);

    // Get post statistics
    const postStats = await db
      .select({
        totalPosts: count(),
        totalReactions: sql<number>`SUM(${anonGossipPosts.fireCount} + ${anonGossipPosts.mindblownCount} + ${anonGossipPosts.laughCount} + ${anonGossipPosts.skullCount} + ${anonGossipPosts.eyesCount})`,
        totalReplies: sql<number>`SUM(${anonGossipPosts.replyCount})`,
        totalViews: sql<number>`SUM(${anonGossipPosts.viewCount})`,
        totalReposts: sql<number>`SUM(${anonGossipPosts.repostCount})`,
        totalSaves: sql<number>`SUM(${anonGossipPosts.saveCount})`,
        verifiedCount: sql<number>`SUM(CASE WHEN ${anonGossipPosts.isVerifiedTea} THEN 1 ELSE 0 END)`,
        breakingCount: sql<number>`SUM(CASE WHEN ${anonGossipPosts.isBreaking} THEN 1 ELSE 0 END)`,
      })
      .from(anonGossipPosts)
      .where(eq(anonGossipPosts.deviceHash, deviceHash));

    // Get accuracy rate
    const accuracyStats = await db
      .select({
        totalTrue: sql<number>`SUM(${anonGossipPosts.accuracyTrueVotes})`,
        totalFalse: sql<number>`SUM(${anonGossipPosts.accuracyFalseVotes})`,
        totalUnsure: sql<number>`SUM(${anonGossipPosts.accuracyUnsureVotes})`,
      })
      .from(anonGossipPosts)
      .where(eq(anonGossipPosts.deviceHash, deviceHash));

    const totalVotes = (accuracyStats[0]?.totalTrue || 0) + (accuracyStats[0]?.totalFalse || 0);
    const accuracyRate = totalVotes > 0 
      ? ((accuracyStats[0]?.totalTrue || 0) / totalVotes * 100).toFixed(1)
      : "N/A";

    // Get awards count
    const awards = await db
      .select({ cnt: count() })
      .from(gossipAwards)
      .where(eq(gossipAwards.deviceHash, deviceHash));

    return res.json({
      teaSpiller: stats || { level: "BRONZE", score: 0 },
      posts: {
        total: postStats[0]?.totalPosts || 0,
        totalReactions: postStats[0]?.totalReactions || 0,
        totalReplies: postStats[0]?.totalReplies || 0,
        totalViews: postStats[0]?.totalViews || 0,
        totalReposts: postStats[0]?.totalReposts || 0,
        totalSaves: postStats[0]?.totalSaves || 0,
        verified: postStats[0]?.verifiedCount || 0,
        breaking: postStats[0]?.breakingCount || 0,
      },
      accuracy: {
        rate: accuracyRate,
        trueVotes: accuracyStats[0]?.totalTrue || 0,
        falseVotes: accuracyStats[0]?.totalFalse || 0,
        unsureVotes: accuracyStats[0]?.totalUnsure || 0,
      },
      awardsEarned: awards[0]?.cnt || 0,
    });
  } catch (error) {
    console.error("Error fetching my stats:", error);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Get hood pulse - activity metrics for a location
router.get("/analytics/hood-pulse/:locationId", async (req: Request, res: Response) => {
  try {
    const { locationId } = req.params;

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    // Today's stats
    const todayStats = await db
      .select({
        posts: count(),
        reactions: sql<number>`SUM(${anonGossipPosts.fireCount} + ${anonGossipPosts.mindblownCount} + ${anonGossipPosts.laughCount} + ${anonGossipPosts.skullCount} + ${anonGossipPosts.eyesCount})`,
        replies: sql<number>`SUM(${anonGossipPosts.replyCount})`,
      })
      .from(anonGossipPosts)
      .where(and(
        eq(anonGossipPosts.zaLocationId, locationId),
        gte(anonGossipPosts.createdAt, today)
      ));

    // This week's stats
    const weekStats = await db
      .select({
        posts: count(),
        reactions: sql<number>`SUM(${anonGossipPosts.fireCount} + ${anonGossipPosts.mindblownCount} + ${anonGossipPosts.laughCount} + ${anonGossipPosts.skullCount} + ${anonGossipPosts.eyesCount})`,
        replies: sql<number>`SUM(${anonGossipPosts.replyCount})`,
        uniquePosters: sql<number>`COUNT(DISTINCT ${anonGossipPosts.deviceHash})`,
      })
      .from(anonGossipPosts)
      .where(and(
        eq(anonGossipPosts.zaLocationId, locationId),
        gte(anonGossipPosts.createdAt, weekAgo)
      ));

    // All-time stats
    const allTimeStats = await db
      .select({
        totalPosts: count(),
        totalReactions: sql<number>`SUM(${anonGossipPosts.fireCount} + ${anonGossipPosts.mindblownCount} + ${anonGossipPosts.laughCount} + ${anonGossipPosts.skullCount} + ${anonGossipPosts.eyesCount})`,
        verifiedPosts: sql<number>`SUM(CASE WHEN ${anonGossipPosts.isVerifiedTea} THEN 1 ELSE 0 END)`,
        breakingPosts: sql<number>`SUM(CASE WHEN ${anonGossipPosts.isBreaking} THEN 1 ELSE 0 END)`,
      })
      .from(anonGossipPosts)
      .where(eq(anonGossipPosts.zaLocationId, locationId));

    // Get location name
    const [location] = await db
      .select()
      .from(gossipLocations)
      .where(eq(gossipLocations.id, locationId))
      .limit(1);

    return res.json({
      location: location ? { id: location.id, name: location.name, type: location.type } : null,
      today: {
        posts: todayStats[0]?.posts || 0,
        reactions: todayStats[0]?.reactions || 0,
        replies: todayStats[0]?.replies || 0,
      },
      thisWeek: {
        posts: weekStats[0]?.posts || 0,
        reactions: weekStats[0]?.reactions || 0,
        replies: weekStats[0]?.replies || 0,
        uniquePosters: weekStats[0]?.uniquePosters || 0,
        avgPostsPerDay: ((weekStats[0]?.posts || 0) / 7).toFixed(1),
      },
      allTime: {
        totalPosts: allTimeStats[0]?.totalPosts || 0,
        totalReactions: allTimeStats[0]?.totalReactions || 0,
        verifiedPosts: allTimeStats[0]?.verifiedPosts || 0,
        breakingPosts: allTimeStats[0]?.breakingPosts || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching hood pulse:", error);
    return res.status(500).json({ error: "Failed to fetch hood pulse" });
  }
});

// Get peak hours for a location
router.get("/analytics/peak-hours/:locationId", async (req: Request, res: Response) => {
  try {
    const { locationId } = req.params;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get hourly distribution
    const hourlyData = await db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${anonGossipPosts.createdAt})`,
        postCount: count(),
      })
      .from(anonGossipPosts)
      .where(and(
        eq(anonGossipPosts.zaLocationId, locationId),
        gte(anonGossipPosts.createdAt, weekAgo)
      ))
      .groupBy(sql`EXTRACT(HOUR FROM ${anonGossipPosts.createdAt})`)
      .orderBy(sql`EXTRACT(HOUR FROM ${anonGossipPosts.createdAt})`);

    // Fill in missing hours with 0
    const hourlyMap: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyMap[i] = 0;
    }
    hourlyData.forEach(h => {
      hourlyMap[h.hour] = h.postCount;
    });

    // Find peak hour
    let peakHour = 0;
    let peakCount = 0;
    for (const [hour, count] of Object.entries(hourlyMap)) {
      if (count > peakCount) {
        peakHour = parseInt(hour);
        peakCount = count;
      }
    }

    // Get daily distribution
    const dailyData = await db
      .select({
        dayOfWeek: sql<number>`EXTRACT(DOW FROM ${anonGossipPosts.createdAt})`,
        postCount: count(),
      })
      .from(anonGossipPosts)
      .where(and(
        eq(anonGossipPosts.zaLocationId, locationId),
        gte(anonGossipPosts.createdAt, weekAgo)
      ))
      .groupBy(sql`EXTRACT(DOW FROM ${anonGossipPosts.createdAt})`)
      .orderBy(sql`EXTRACT(DOW FROM ${anonGossipPosts.createdAt})`);

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dailyDistribution = dayNames.map((name, idx) => ({
      day: name,
      posts: dailyData.find(d => d.dayOfWeek === idx)?.postCount || 0,
    }));

    return res.json({
      hourlyDistribution: Object.entries(hourlyMap).map(([hour, count]) => ({
        hour: parseInt(hour),
        label: `${parseInt(hour).toString().padStart(2, "0")}:00`,
        posts: count,
      })),
      peakHour: {
        hour: peakHour,
        label: `${peakHour.toString().padStart(2, "0")}:00 - ${((peakHour + 1) % 24).toString().padStart(2, "0")}:00`,
        posts: peakCount,
      },
      dailyDistribution,
      busiestDay: dailyDistribution.reduce((max, day) => day.posts > max.posts ? day : max, dailyDistribution[0]),
    });
  } catch (error) {
    console.error("Error fetching peak hours:", error);
    return res.status(500).json({ error: "Failed to fetch peak hours" });
  }
});

// Get accuracy history for a device
router.get("/analytics/accuracy-history", async (req: Request, res: Response) => {
  try {
    const deviceId = req.headers["x-device-id"] as string;
    if (!deviceId) {
      return res.status(400).json({ error: "Device ID required" });
    }

    const deviceHash = hashDevice(deviceId);
    const { limit = "20" } = req.query;

    // Get posts with accuracy data
    const postsWithAccuracy = await db
      .select({
        id: anonGossipPosts.id,
        content: sql<string>`LEFT(${anonGossipPosts.content}, 100)`,
        trueVotes: anonGossipPosts.accuracyTrueVotes,
        falseVotes: anonGossipPosts.accuracyFalseVotes,
        unsureVotes: anonGossipPosts.accuracyUnsureVotes,
        isVerified: anonGossipPosts.isVerifiedTea,
        createdAt: anonGossipPosts.createdAt,
      })
      .from(anonGossipPosts)
      .where(and(
        eq(anonGossipPosts.deviceHash, deviceHash),
        sql`(${anonGossipPosts.accuracyTrueVotes} + ${anonGossipPosts.accuracyFalseVotes} + ${anonGossipPosts.accuracyUnsureVotes}) > 0`
      ))
      .orderBy(desc(anonGossipPosts.createdAt))
      .limit(parseInt(limit as string));

    const history = postsWithAccuracy.map(post => {
      const total = post.trueVotes + post.falseVotes;
      const rate = total > 0 ? (post.trueVotes / total * 100) : 0;
      return {
        postId: post.id,
        contentPreview: post.content + (post.content && post.content.length >= 100 ? "..." : ""),
        votes: {
          true: post.trueVotes,
          false: post.falseVotes,
          unsure: post.unsureVotes,
          total: post.trueVotes + post.falseVotes + post.unsureVotes,
        },
        accuracyRate: rate.toFixed(1) + "%",
        isVerified: post.isVerified,
        status: rate >= 70 ? "TRUSTED" : rate >= 50 ? "MIXED" : total >= 5 ? "DISPUTED" : "PENDING",
        createdAt: post.createdAt,
      };
    });

    // Calculate overall trends
    const totalTrue = history.reduce((sum, h) => sum + h.votes.true, 0);
    const totalFalse = history.reduce((sum, h) => sum + h.votes.false, 0);
    const overallRate = (totalTrue + totalFalse) > 0 
      ? (totalTrue / (totalTrue + totalFalse) * 100).toFixed(1)
      : "N/A";

    return res.json({
      history,
      summary: {
        totalPostsVoted: history.length,
        verifiedCount: history.filter(h => h.isVerified).length,
        overallAccuracy: overallRate + (overallRate !== "N/A" ? "%" : ""),
        trustedCount: history.filter(h => h.status === "TRUSTED").length,
        disputedCount: history.filter(h => h.status === "DISPUTED").length,
      },
    });
  } catch (error) {
    console.error("Error fetching accuracy history:", error);
    return res.status(500).json({ error: "Failed to fetch accuracy history" });
  }
});

// Get global gossip stats (public)
router.get("/analytics/global", async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Total counts
    const totals = await db
      .select({
        posts: count(),
        totalReactions: sql<number>`SUM(${anonGossipPosts.fireCount} + ${anonGossipPosts.mindblownCount} + ${anonGossipPosts.laughCount} + ${anonGossipPosts.skullCount} + ${anonGossipPosts.eyesCount})`,
        verified: sql<number>`SUM(CASE WHEN ${anonGossipPosts.isVerifiedTea} THEN 1 ELSE 0 END)`,
      })
      .from(anonGossipPosts);

    // Today's activity
    const todayActivity = await db
      .select({
        posts: count(),
        uniquePosters: sql<number>`COUNT(DISTINCT ${anonGossipPosts.deviceHash})`,
      })
      .from(anonGossipPosts)
      .where(gte(anonGossipPosts.createdAt, today));

    // Active locations
    const activeLocations = await db
      .select({
        cnt: sql<number>`COUNT(DISTINCT ${anonGossipPosts.zaLocationId})`,
      })
      .from(anonGossipPosts)
      .where(gte(anonGossipPosts.createdAt, today));

    // Tea spillers count
    const spillers = await db
      .select({ cnt: count() })
      .from(teaSpillerStats);

    return res.json({
      totals: {
        posts: totals[0]?.posts || 0,
        reactions: totals[0]?.totalReactions || 0,
        verified: totals[0]?.verified || 0,
        teaSpillers: spillers[0]?.cnt || 0,
      },
      today: {
        posts: todayActivity[0]?.posts || 0,
        uniquePosters: todayActivity[0]?.uniquePosters || 0,
        activeLocations: activeLocations[0]?.cnt || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return res.status(500).json({ error: "Failed to fetch global stats" });
  }
});

export default router;
