import { db } from "./db";
import { eq, and, gte, lte, sql, desc, inArray, or, isNull } from "drizzle-orm";
import * as adsStorageFunctions from "./ads-storage";
import {
  adCampaigns,
  adGroups,
  ads,
  adEvents,
  adStatsDaily,
  adWalletAccounts,
  adWalletTransactions,
} from "@shared/ads-schema";
import { users, userInterests } from "@shared/schema";

async function isFeatureEnabled(key: string, defaultValue: boolean = true): Promise<boolean> {
  try {
    const setting = await adsStorageFunctions.getSystemSetting(key);
    if (!setting) return defaultValue;
    return setting.value === true || setting.value === 'true';
  } catch {
    return defaultValue;
  }
}

const AD_CAMPAIGN_STATUS = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  DRAFT: "DRAFT",
  PENDING_REVIEW: "PENDING_REVIEW",
  REJECTED: "REJECTED",
  ARCHIVED: "ARCHIVED",
} as const;

const AD_GROUP_STATUS = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  LEARNING: "LEARNING",
} as const;

const AD_STATUS = {
  APPROVED: "APPROVED",
} as const;

export interface AdTargetingContext {
  userId: string;
  netWorthTier?: string;
  influenceScore?: number;
  interests?: string[];
  industry?: string;
  country?: string;
  city?: string;
  deviceType?: string;
  platform?: string;
  sessionContext?: string;
}

export interface AuctionResult {
  adId: string;
  adGroupId: string;
  campaignId: string;
  advertiserId: string;
  effectiveBid: number;
  qualityScore: number;
  adRank: number;
  winningBid: number;
  format: string;
  creative: {
    headline?: string | null;
    description?: string | null;
    mediaUrl?: string | null;
    thumbnailUrl?: string | null;
    callToAction?: string | null;
    destinationUrl?: string | null;
  };
}

function calculateQualityScore(ad: any, ctr: number, engagementRate: number): number {
  let score = 0.5;
  if (ctr > 0.05) score += 0.2;
  else if (ctr > 0.02) score += 0.1;
  if (engagementRate > 0.1) score += 0.15;
  else if (engagementRate > 0.05) score += 0.08;
  if (ad.headline && ad.description) score += 0.1;
  if (ad.primaryMediaUrl) score += 0.05;
  return Math.min(1, Math.max(0.1, score));
}

function matchesTargeting(targeting: any, context: AdTargetingContext): { matches: boolean; score: number } {
  let score = 1.0;
  let matches = true;
  if (!targeting) return { matches: true, score: 1.0 };

  if (targeting.netWorthTiers && Array.isArray(targeting.netWorthTiers) && targeting.netWorthTiers.length > 0) {
    if (!context.netWorthTier || !targeting.netWorthTiers.includes(context.netWorthTier)) {
      matches = false;
    } else {
      score += 0.2;
    }
  }

  if (targeting.minInfluenceScore && context.influenceScore !== undefined) {
    if (context.influenceScore < targeting.minInfluenceScore) {
      matches = false;
    } else {
      score += 0.1;
    }
  }

  if (targeting.interests && Array.isArray(targeting.interests) && targeting.interests.length > 0 && context.interests) {
    const matchingInterests = targeting.interests.filter(
      (i: string) => context.interests!.includes(i)
    );
    if (matchingInterests.length === 0) {
      score *= 0.5;
    } else {
      score += 0.1 * Math.min(matchingInterests.length, 3);
    }
  }

  if (targeting.industries && Array.isArray(targeting.industries) && targeting.industries.length > 0) {
    if (context.industry && targeting.industries.includes(context.industry)) {
      score += 0.15;
    } else {
      score *= 0.7;
    }
  }

  if (targeting.countries && Array.isArray(targeting.countries) && targeting.countries.length > 0) {
    if (!context.country || !targeting.countries.includes(context.country)) {
      matches = false;
    }
  }

  if (targeting.cities && Array.isArray(targeting.cities) && targeting.cities.length > 0) {
    if (context.city && targeting.cities.includes(context.city)) {
      score += 0.1;
    }
  }

  if (targeting.platforms && Array.isArray(targeting.platforms) && targeting.platforms.length > 0) {
    if (!context.platform || !targeting.platforms.includes(context.platform)) {
      matches = false;
    }
  }

  if (targeting.deviceTypes && Array.isArray(targeting.deviceTypes) && targeting.deviceTypes.length > 0) {
    if (!context.deviceType || !targeting.deviceTypes.includes(context.deviceType)) {
      matches = false;
    }
  }

  return { matches, score };
}

async function checkFrequencyCap(
  adGroupId: string,
  userId: string,
  cap: number,
  windowHours: number
): Promise<boolean> {
  if (!cap || cap <= 0) return true;
  const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  const impressionCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(adEvents)
    .where(
      and(
        eq(adEvents.adGroupId, adGroupId),
        eq(adEvents.userId, userId),
        eq(adEvents.eventType, "IMPRESSION"),
        gte(adEvents.createdAt, windowStart)
      )
    );
  return (impressionCount[0]?.count || 0) < cap;
}

// ===== FRAUD PROTECTION: Event Deduplication =====
async function isDuplicateEvent(
  adId: string,
  userId: string,
  eventType: "IMPRESSION" | "CLICK",
  windowHours: number = 1
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  const existingEvent = await db
    .select({ count: sql<number>`count(*)` })
    .from(adEvents)
    .where(
      and(
        eq(adEvents.adId, adId),
        eq(adEvents.userId, userId),
        eq(adEvents.eventType, eventType),
        gte(adEvents.createdAt, windowStart)
      )
    );
  return (existingEvent[0]?.count || 0) > 0;
}

// ===== AUTO-EXPIRATION: Expire campaigns past endDate =====
export async function expireEndedCampaigns(): Promise<{ expired: number; details: { id: string; name: string }[] }> {
  const now = new Date();
  const expiredCampaigns = await db
    .select({ id: adCampaigns.id, name: adCampaigns.name })
    .from(adCampaigns)
    .where(
      and(
        eq(adCampaigns.status, AD_CAMPAIGN_STATUS.ACTIVE),
        lte(adCampaigns.endDate, now)
      )
    );

  for (const campaign of expiredCampaigns) {
    await db.update(adCampaigns)
      .set({ 
        status: AD_CAMPAIGN_STATUS.COMPLETED,
        updatedAt: now
      })
      .where(eq(adCampaigns.id, campaign.id));
    console.log(`[Auto-Expire] Campaign ${campaign.id} (${campaign.name}) has ended`);
  }

  return { expired: expiredCampaigns.length, details: expiredCampaigns };
}

// ===== DELIVERY HEALTH: Flag zero-delivery campaigns =====
export async function getZeroDeliveryCampaigns(hoursThreshold: number = 24): Promise<any[]> {
  const thresholdTime = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);
  
  const activeCampaigns = await db
    .select()
    .from(adCampaigns)
    .where(
      and(
        eq(adCampaigns.status, AD_CAMPAIGN_STATUS.ACTIVE),
        lte(adCampaigns.createdAt, thresholdTime)
      )
    );

  const zeroDelivery = activeCampaigns.filter(c => 
    (c.impressions || 0) === 0 && (c.clicks || 0) === 0
  );

  return zeroDelivery;
}

// ===== PLATFORM REVENUE TRACKING =====
export async function getPlatformRevenue(startDate?: Date, endDate?: Date): Promise<{
  totalAdSpend: number;
  transactionCount: number;
  uniqueAdvertisers: number;
}> {
  const conditions = [eq(adWalletTransactions.type, "AD_SPEND")];
  if (startDate) conditions.push(gte(adWalletTransactions.createdAt, startDate));
  if (endDate) conditions.push(lte(adWalletTransactions.createdAt, endDate));

  const result = await db
    .select({
      totalSpend: sql<number>`COALESCE(SUM(ABS(${adWalletTransactions.amount})), 0)`,
      transactionCount: sql<number>`COUNT(*)`,
      uniqueAdvertisers: sql<number>`COUNT(DISTINCT ${adWalletTransactions.walletId})`,
    })
    .from(adWalletTransactions)
    .where(and(...conditions));

  return {
    totalAdSpend: Number(result[0]?.totalSpend) || 0,
    transactionCount: Number(result[0]?.transactionCount) || 0,
    uniqueAdvertisers: Number(result[0]?.uniqueAdvertisers) || 0,
  };
}

async function checkBudgetAvailable(advertiserId: string, bidAmount: number): Promise<boolean> {
  const [wallet] = await db.select().from(adWalletAccounts).where(eq(adWalletAccounts.advertiserId, advertiserId));
  if (!wallet) return false;
  if (wallet.isFrozen) return false;
  return (wallet.balance || 0) >= bidAmount;
}

async function deductFromWallet(advertiserId: string, amount: number, details: { type: string; description: string; campaignId?: string }): Promise<boolean> {
  const [wallet] = await db.select().from(adWalletAccounts).where(eq(adWalletAccounts.advertiserId, advertiserId));
  if (!wallet) {
    console.error("[deductFromWallet] Wallet not found for advertiser:", advertiserId);
    return false;
  }
  if (wallet.isFrozen) {
    console.error("[deductFromWallet] Wallet is frozen:", wallet.id);
    return false;
  }

  const currentBalance = wallet.balance || 0;
  if (currentBalance < amount) {
    console.error("[deductFromWallet] Insufficient balance:", currentBalance, "< ", amount);
    return false;
  }

  const result = await db.update(adWalletAccounts)
    .set({ 
      balance: sql`COALESCE(${adWalletAccounts.balance}, 0) - ${amount}`,
      lifetimeSpend: sql`COALESCE(${adWalletAccounts.lifetimeSpend}, 0) + ${amount}`,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(adWalletAccounts.id, wallet.id),
        eq(adWalletAccounts.isFrozen, false),
        gte(adWalletAccounts.balance, amount)
      )
    )
    .returning();

  if (!result.length) {
    console.error("[deductFromWallet] Atomic update failed - balance may have changed or wallet frozen");
    return false;
  }

  const updatedWallet = result[0];
  await db.insert(adWalletTransactions).values({
    walletId: wallet.id,
    type: "AD_SPEND",
    amount: -amount,
    balanceBefore: currentBalance,
    balanceAfter: updatedWallet.balance || 0,
    status: "COMPLETED",
    description: details.description,
    campaignId: details.campaignId,
  });
  
  return true;
}

async function getAdStats(adId: string): Promise<{ ctr: number; engagementRate: number }> {
  const stats = await db
    .select()
    .from(adStatsDaily)
    .where(eq(adStatsDaily.adId, adId))
    .orderBy(desc(adStatsDaily.date))
    .limit(7);

  let totalImpressions = 0;
  let totalClicks = 0;
  let totalEngagements = 0;

  for (const s of stats) {
    totalImpressions += s.impressions || 0;
    totalClicks += s.clicks || 0;
    totalEngagements += (s.saves || 0);
  }

  const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0.02;
  const engagementRate = totalImpressions > 0 ? totalEngagements / totalImpressions : 0.05;
  return { ctr, engagementRate };
}

async function runAuction(
  eligibleAds: any[],
  context: AdTargetingContext,
  placement: string
): Promise<AuctionResult | null> {
  if (eligibleAds.length === 0) return null;

  const auctionCandidates: {
    ad: any;
    adGroup: any;
    campaign: any;
    effectiveBid: number;
    qualityScore: number;
    adRank: number;
    targetingScore: number;
  }[] = [];

  for (const item of eligibleAds) {
    const { ad, adGroup, campaign } = item;

    const { ctr, engagementRate } = await getAdStats(ad.id);
    const qualityScore = calculateQualityScore(ad, ctr, engagementRate);

    const targeting = adGroup.targeting || {};
    const { matches, score: targetingScore } = matchesTargeting(targeting, context);
    if (!matches) continue;

    const passFrequency = await checkFrequencyCap(
      adGroup.id,
      context.userId,
      adGroup.frequencyCapImpressions || 0,
      adGroup.frequencyCapPeriodHours || 24
    );
    if (!passFrequency) continue;

    let baseBid = adGroup.bidAmount || campaign.budgetAmount / 1000 || 100;
    let effectiveBid = baseBid;

    const billingModel = adGroup.billingModel || "CPM";
    if (billingModel === "CPM") {
      effectiveBid = baseBid;
    } else if (billingModel === "CPC") {
      effectiveBid = baseBid * 10;
    } else if (billingModel === "CPE") {
      effectiveBid = baseBid * 5;
    }

    effectiveBid *= targetingScore;

    const adRank = effectiveBid * qualityScore * (1 + Math.random() * 0.1);

    auctionCandidates.push({
      ad,
      adGroup,
      campaign,
      effectiveBid,
      qualityScore,
      adRank,
      targetingScore,
    });
  }

  if (auctionCandidates.length === 0) return null;

  auctionCandidates.sort((a, b) => b.adRank - a.adRank);
  const winner = auctionCandidates[0];

  const secondPrice = auctionCandidates.length > 1 
    ? auctionCandidates[1].adRank / winner.qualityScore + 1
    : winner.effectiveBid * 0.8;

  const winningBid = Math.min(secondPrice, winner.effectiveBid);

  return {
    adId: winner.ad.id,
    adGroupId: winner.adGroup.id,
    campaignId: winner.campaign.id,
    advertiserId: winner.campaign.advertiserId,
    effectiveBid: winner.effectiveBid,
    qualityScore: winner.qualityScore,
    adRank: winner.adRank,
    winningBid: Math.round(winningBid),
    format: winner.ad.format,
    creative: {
      headline: winner.ad.headline,
      description: winner.ad.description,
      mediaUrl: winner.ad.primaryMediaUrl,
      thumbnailUrl: winner.ad.primaryMediaThumbnail,
      callToAction: winner.ad.callToAction,
      destinationUrl: winner.ad.destinationUrl,
    },
  };
}

export async function getEligibleAds(placement: string): Promise<any[]> {
  const now = new Date();

  const eligibleCampaigns = await db
    .select()
    .from(adCampaigns)
    .where(
      and(
        eq(adCampaigns.status, AD_CAMPAIGN_STATUS.ACTIVE),
        or(isNull(adCampaigns.startDate), lte(adCampaigns.startDate, now)),
        or(isNull(adCampaigns.endDate), gte(adCampaigns.endDate, now))
      )
    );

  if (eligibleCampaigns.length === 0) return [];

  const campaignIds = eligibleCampaigns.map((c) => c.id);

  const eligibleAdGroups = await db
    .select()
    .from(adGroups)
    .where(
      and(
        inArray(adGroups.campaignId, campaignIds),
        eq(adGroups.status, "ACTIVE")
      )
    );

  if (eligibleAdGroups.length === 0) return [];

  const adGroupIds = eligibleAdGroups.map((g) => g.id);

  const eligibleAds = await db
    .select()
    .from(ads)
    .where(
      and(
        inArray(ads.adGroupId, adGroupIds),
        eq(ads.status, AD_STATUS.APPROVED)
      )
    );

  const result: any[] = [];

  for (const ad of eligibleAds) {
    const adGroup = eligibleAdGroups.find((g) => g.id === ad.adGroupId);
    const campaign = eligibleCampaigns.find((c) => c.id === adGroup?.campaignId);

    if (adGroup && campaign) {
      // Check if campaign budget is exhausted
      const budgetSpent = campaign.budgetSpent || 0;
      const budgetAmount = campaign.budgetAmount || 0;
      if (budgetAmount > 0 && budgetSpent >= budgetAmount) {
        console.log(`[getEligibleAds] Campaign ${campaign.id} budget exhausted (${budgetSpent}/${budgetAmount})`);
        continue; // Skip this campaign
      }
      
      // Check if advertiser has wallet balance for at least one impression
      const hasBalance = await checkBudgetAvailable(campaign.advertiserId, 100);
      if (hasBalance) {
        result.push({ ad, adGroup, campaign });
      } else {
        console.log(`[getEligibleAds] Advertiser ${campaign.advertiserId} has insufficient wallet balance`);
      }
    }
  }

  return result;
}

export async function selectAdForUser(
  userId: string,
  placement: string = "feed"
): Promise<AuctionResult | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return null;

  const userInterestRows = await db
    .select()
    .from(userInterests)
    .where(eq(userInterests.userId, userId));

  const interests = userInterestRows.map((ui) => ui.interest);

  const context: AdTargetingContext = {
    userId,
    netWorthTier: user.netWorthTier || "BUILDING",
    influenceScore: user.influenceScore || 0,
    interests,
    industry: user.industry || undefined,
    country: user.country || undefined,
    deviceType: "mobile",
    platform: "ios",
  };

  const eligibleAds = await getEligibleAds(placement);
  if (eligibleAds.length === 0) return null;

  const userAdvertiser = await adsStorageFunctions.getAdvertiserByUserId(userId);
  const filteredAds = userAdvertiser 
    ? eligibleAds.filter(item => item.campaign.advertiserId !== userAdvertiser.id)
    : eligibleAds;
  
  if (filteredAds.length === 0) return null;

  const result = await runAuction(filteredAds, context, placement);
  return result;
}

export async function recordImpression(
  result: AuctionResult,
  userId: string,
  placement: string
): Promise<void> {
  const selfEngagementPrevention = await isFeatureEnabled('ads_self_engagement_prevention', true);
  if (selfEngagementPrevention) {
    const userAdvertiser = await adsStorageFunctions.getAdvertiserByUserId(userId);
    if (userAdvertiser && userAdvertiser.id === result.advertiserId) {
      console.log("[recordImpression] Ignoring self-impression from advertiser:", userId);
      return;
    }
  }

  const hasBalance = await checkBudgetAvailable(result.advertiserId, result.winningBid);
  if (!hasBalance) {
    await pauseCampaignForLowBalance(result.campaignId);
    return;
  }

  const deductionSuccess = await deductFromWallet(result.advertiserId, result.winningBid, {
    type: "AD_SPEND",
    description: `Impression on ${placement} for ad #${result.adId}`,
    campaignId: result.campaignId,
  });

  if (!deductionSuccess) {
    console.log("[recordImpression] Wallet deduction failed, not recording impression");
    await pauseCampaignForLowBalance(result.campaignId);
    return;
  }

  await db.insert(adEvents).values({
    adId: result.adId,
    adGroupId: result.adGroupId,
    campaignId: result.campaignId,
    advertiserId: result.advertiserId,
    userId,
    eventType: "IMPRESSION",
    placement: placement === "feed" ? "FEED" : placement === "stories" ? "STORIES" : placement === "reels" ? "REELS" : placement === "discover" ? "DISCOVER" : "FEED",
    costAmount: result.winningBid,
    metadata: {
      qualityScore: result.qualityScore,
      adRank: result.adRank,
      effectiveBid: result.effectiveBid,
    },
  });

  // Update campaign budget spent
  await db.update(adCampaigns)
    .set({ 
      budgetSpent: sql`COALESCE(${adCampaigns.budgetSpent}, 0) + ${result.winningBid}`,
      impressions: sql`COALESCE(${adCampaigns.impressions}, 0) + 1`,
      updatedAt: new Date()
    })
    .where(eq(adCampaigns.id, result.campaignId));

  await updateAdStats(result.adId, result.adGroupId, result.campaignId, result.advertiserId, "impression", result.winningBid);
}

export async function recordClick(
  adId: string,
  userId: string,
  placement: string
): Promise<void> {
  const [ad] = await db.select().from(ads).where(eq(ads.id, adId));
  if (!ad) return;

  const [adGroup] = await db.select().from(adGroups).where(eq(adGroups.id, ad.adGroupId));
  if (!adGroup) return;

  const [campaign] = await db.select().from(adCampaigns).where(eq(adCampaigns.id, adGroup.campaignId));
  if (!campaign) return;

  const selfEngagementPrevention = await isFeatureEnabled('ads_self_engagement_prevention', true);
  if (selfEngagementPrevention) {
    const userAdvertiser = await adsStorageFunctions.getAdvertiserByUserId(userId);
    if (userAdvertiser && userAdvertiser.id === campaign.advertiserId) {
      console.log("[recordClick] Ignoring self-click from advertiser:", userId);
      return;
    }
  }

  // Fraud protection: deduplicate clicks from same user within 1 hour
  const isDuplicate = await isDuplicateEvent(adId, userId, "CLICK", 1);
  if (isDuplicate) {
    console.log("[recordClick] Duplicate click detected, ignoring:", { adId, userId });
    return;
  }

  let clickCost = 0;
  if (adGroup.billingModel === "CPC") {
    clickCost = adGroup.bidAmount || 50;
    const hasBalance = await checkBudgetAvailable(campaign.advertiserId, clickCost);
    if (!hasBalance) {
      await pauseCampaignForLowBalance(campaign.id);
      return;
    }
    const deductionSuccess = await deductFromWallet(campaign.advertiserId, clickCost, {
      type: "AD_SPEND",
      description: `Click on ad #${adId}`,
      campaignId: campaign.id,
    });
    if (!deductionSuccess) {
      console.log("[recordClick] Wallet deduction failed, not recording click");
      await pauseCampaignForLowBalance(campaign.id);
      return;
    }
  }

  await db.insert(adEvents).values({
    adId,
    adGroupId: adGroup.id,
    campaignId: campaign.id,
    advertiserId: campaign.advertiserId,
    userId,
    eventType: "CLICK",
    placement: placement === "feed" ? "FEED" : placement === "stories" ? "STORIES" : placement === "reels" ? "REELS" : placement === "discover" ? "DISCOVER" : "FEED",
    costAmount: clickCost,
    metadata: {},
  });

  await updateAdStats(adId, adGroup.id, campaign.id, campaign.advertiserId, "click", clickCost);
}

export async function recordConversion(
  adId: string,
  userId: string,
  conversionType: string,
  value?: number
): Promise<void> {
  const [ad] = await db.select().from(ads).where(eq(ads.id, adId));
  if (!ad) return;

  const [adGroup] = await db.select().from(adGroups).where(eq(adGroups.id, ad.adGroupId));
  if (!adGroup) return;

  const [campaign] = await db.select().from(adCampaigns).where(eq(adCampaigns.id, adGroup.campaignId));
  if (!campaign) return;

  const selfEngagementPrevention = await isFeatureEnabled('ads_self_engagement_prevention', true);
  if (selfEngagementPrevention) {
    const userAdvertiser = await adsStorageFunctions.getAdvertiserByUserId(userId);
    if (userAdvertiser && userAdvertiser.id === campaign.advertiserId) {
      console.log("[recordConversion] Ignoring self-conversion from advertiser:", userId);
      return;
    }
  }

  await db.insert(adEvents).values({
    adId,
    adGroupId: adGroup.id,
    campaignId: campaign.id,
    advertiserId: campaign.advertiserId,
    userId,
    eventType: "CONVERSION",
    placement: "FEED",
    conversionType: conversionType as any,
    conversionValue: value,
    metadata: {},
  });

  await updateAdStats(adId, adGroup.id, campaign.id, campaign.advertiserId, "conversion", 0);
}

export async function recordEngagement(
  adId: string,
  userId: string,
  engagementType: "like" | "comment" | "share" | "save"
): Promise<void> {
  const [ad] = await db.select().from(ads).where(eq(ads.id, adId));
  if (!ad) return;

  const [adGroup] = await db.select().from(adGroups).where(eq(adGroups.id, ad.adGroupId));
  if (!adGroup) return;

  const [campaign] = await db.select().from(adCampaigns).where(eq(adCampaigns.id, adGroup.campaignId));
  if (!campaign) return;

  const selfEngagementPrevention = await isFeatureEnabled('ads_self_engagement_prevention', true);
  if (selfEngagementPrevention) {
    const userAdvertiser = await adsStorageFunctions.getAdvertiserByUserId(userId);
    if (userAdvertiser && userAdvertiser.id === campaign.advertiserId) {
      console.log("[recordEngagement] Ignoring self-engagement from advertiser:", userId);
      return;
    }
  }

  let engagementCost = 0;
  if (adGroup.billingModel === "CPA") {
    engagementCost = Math.round((adGroup.bidAmount || 20) * 0.3);
    const hasBalance = await checkBudgetAvailable(campaign.advertiserId, engagementCost);
    if (hasBalance) {
      const deductionSuccess = await deductFromWallet(campaign.advertiserId, engagementCost, {
        type: "AD_SPEND",
        description: `${engagementType} on ad #${adId}`,
        campaignId: campaign.id,
      });
      if (!deductionSuccess) {
        engagementCost = 0;
      }
    } else {
      engagementCost = 0;
    }
  }

  await db.insert(adEvents).values({
    adId,
    adGroupId: adGroup.id,
    campaignId: campaign.id,
    advertiserId: campaign.advertiserId,
    userId,
    eventType: "SAVE",
    placement: "FEED",
    metadata: { engagementType },
  });

  await updateAdStats(adId, adGroup.id, campaign.id, campaign.advertiserId, engagementType, engagementCost);
}

async function updateAdStats(
  adId: string,
  adGroupId: string,
  campaignId: string,
  advertiserId: string,
  eventType: string,
  cost: number
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [existing] = await db
    .select()
    .from(adStatsDaily)
    .where(and(eq(adStatsDaily.adId, adId), eq(adStatsDaily.date, today)));

  if (existing) {
    const updates: Record<string, any> = { spend: sql`${adStatsDaily.spend} + ${cost}` };
    if (eventType === "impression") updates.impressions = sql`${adStatsDaily.impressions} + 1`;
    if (eventType === "click") updates.clicks = sql`${adStatsDaily.clicks} + 1`;
    if (eventType === "conversion") updates.conversions = sql`${adStatsDaily.conversions} + 1`;
    if (eventType === "save") updates.saves = sql`${adStatsDaily.saves} + 1`;

    await db.update(adStatsDaily).set(updates).where(eq(adStatsDaily.id, existing.id));
  } else {
    await db.insert(adStatsDaily).values({
      adId,
      adGroupId,
      campaignId,
      advertiserId,
      date: today,
      impressions: eventType === "impression" ? 1 : 0,
      clicks: eventType === "click" ? 1 : 0,
      conversions: eventType === "conversion" ? 1 : 0,
      saves: eventType === "save" ? 1 : 0,
      spend: cost,
      reach: eventType === "impression" ? 1 : 0,
    });
  }
}

async function pauseCampaignForLowBalance(campaignId: string): Promise<void> {
  await db
    .update(adCampaigns)
    .set({ 
      status: AD_CAMPAIGN_STATUS.PAUSED,
      updatedAt: new Date()
    })
    .where(eq(adCampaigns.id, campaignId));
}

export async function getAdsForFeed(
  userId: string,
  feedLength: number = 20,
  adFrequency: number = 5
): Promise<(AuctionResult & { position: number })[]> {
  const numAdsToServe = Math.floor(feedLength / adFrequency);
  const results: (AuctionResult & { position: number })[] = [];

  for (let i = 0; i < numAdsToServe; i++) {
    const position = (i + 1) * adFrequency;
    const adResult = await selectAdForUser(userId, "feed");
    if (adResult) {
      results.push({ ...adResult, position });
    }
  }

  return results;
}

export async function getStoryAd(userId: string): Promise<AuctionResult | null> {
  return selectAdForUser(userId, "stories");
}

export async function getReelAd(userId: string): Promise<AuctionResult | null> {
  return selectAdForUser(userId, "reels");
}

export async function getDiscoverAd(userId: string): Promise<AuctionResult | null> {
  return selectAdForUser(userId, "discover");
}

export async function getMessagesAd(userId: string): Promise<AuctionResult | null> {
  return selectAdForUser(userId, "messages");
}

export const adsEngine = {
  selectAdForUser,
  recordImpression,
  recordClick,
  recordConversion,
  recordEngagement,
  getAdsForFeed,
  getStoryAd,
  getReelAd,
  getDiscoverAd,
  getMessagesAd,
  getEligibleAds,
  expireEndedCampaigns,
  getZeroDeliveryCampaigns,
  getPlatformRevenue,
};
