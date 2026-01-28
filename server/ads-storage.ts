import { db } from "./db";
import { eq, desc, and, sql, inArray, gte, lte, gt, lt, ne, or, isNull, asc, count } from "drizzle-orm";
import {
  advertisers, advertisingTerms, adPolicies, advertiserTermsAcceptance,
  adWalletAccounts, adWalletTransactions, adPromoCodes, adPromoCodeRedemptions,
  adCampaigns, adGroups, ads, adEvents, adStatsDaily, adCustomAudiences,
  adAudienceMembers, adReviewHistory, userAdPreferences, userAdInteractions,
  adFrequencyTracking, adDeliveryDiagnostics, advertiserAchievements,
  adAuditLogs, adSystemSettings, adConversionPixels, adWebhooks,
  type Advertiser, type InsertAdvertiser, type AdvertisingTerms, type InsertAdvertisingTerms,
  type AdPolicy, type InsertAdPolicy, type AdWalletAccount, type AdWalletTransaction,
  type InsertAdWalletTransaction, type AdPromoCode, type AdCampaign, type InsertAdCampaign,
  type AdGroup, type InsertAdGroup, type Ad, type InsertAd, type AdEvent, type InsertAdEvent,
  type AdStatsDaily, type AdCustomAudience, type AdAudienceMember, type AdReviewHistory,
  type UserAdPreferences, type AdFrequencyTracking, type AdDeliveryDiagnostic,
  type AdvertiserAchievement, type AdAuditLog, type InsertAdAuditLog, type AdSystemSetting,
  type AdConversionPixel, type AdWebhook
} from "@shared/schema";

// ===== ADVERTISER OPERATIONS =====

export async function createAdvertiser(data: Partial<InsertAdvertiser>): Promise<Advertiser> {
  const [advertiser] = await db.insert(advertisers).values({
    ...data,
    userId: data.userId!,
  }).returning();
  return advertiser;
}

export async function getAdvertiserById(id: string): Promise<Advertiser | undefined> {
  const [advertiser] = await db.select().from(advertisers).where(eq(advertisers.id, id));
  return advertiser;
}

export async function getAdvertiserByUserId(userId: string): Promise<Advertiser | undefined> {
  const [advertiser] = await db.select().from(advertisers).where(eq(advertisers.userId, userId));
  return advertiser;
}

export async function updateAdvertiser(id: string, data: Partial<Advertiser>): Promise<Advertiser | undefined> {
  const [updated] = await db.update(advertisers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(advertisers.id, id))
    .returning();
  return updated;
}

export async function getAllAdvertisers(options: {
  status?: string;
  verificationStatus?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ advertisers: Advertiser[]; total: number }> {
  const conditions = [];
  if (options.status) {
    conditions.push(eq(advertisers.status, options.status as any));
  }
  if (options.verificationStatus) {
    conditions.push(eq(advertisers.verificationStatus, options.verificationStatus as any));
  }

  const query = db.select().from(advertisers);
  const countQuery = db.select({ count: count() }).from(advertisers);

  if (conditions.length > 0) {
    const whereClause = and(...conditions);
    const results = await query.where(whereClause).limit(options.limit || 50).offset(options.offset || 0).orderBy(desc(advertisers.createdAt));
    const [{ count: total }] = await countQuery.where(whereClause);
    return { advertisers: results, total };
  }

  const results = await query.limit(options.limit || 50).offset(options.offset || 0).orderBy(desc(advertisers.createdAt));
  const [{ count: total }] = await countQuery;
  return { advertisers: results, total };
}

// ===== ADVERTISING TERMS =====

export async function createAdvertisingTerms(data: Partial<InsertAdvertisingTerms>): Promise<AdvertisingTerms> {
  const [terms] = await db.insert(advertisingTerms).values({
    ...data,
    version: data.version!,
    title: data.title!,
    content: data.content!,
    effectiveDate: data.effectiveDate!,
  }).returning();
  return terms;
}

export async function getActiveAdvertisingTerms(): Promise<AdvertisingTerms | undefined> {
  const [terms] = await db.select().from(advertisingTerms)
    .where(and(eq(advertisingTerms.isActive, true), lte(advertisingTerms.effectiveDate, new Date())))
    .orderBy(desc(advertisingTerms.effectiveDate))
    .limit(1);
  return terms;
}

export async function getAllAdvertisingTerms(): Promise<AdvertisingTerms[]> {
  return db.select().from(advertisingTerms).orderBy(desc(advertisingTerms.effectiveDate));
}

export async function setActiveTerms(id: string): Promise<void> {
  await db.update(advertisingTerms).set({ isActive: false }).where(eq(advertisingTerms.isActive, true));
  await db.update(advertisingTerms).set({ isActive: true, updatedAt: new Date() }).where(eq(advertisingTerms.id, id));
}

// ===== AD POLICIES =====

export async function createAdPolicy(data: Partial<InsertAdPolicy>): Promise<AdPolicy> {
  const [policy] = await db.insert(adPolicies).values({
    ...data,
    category: data.category!,
    name: data.name!,
    description: data.description!,
  }).returning();
  return policy;
}

export async function getAdPolicies(category?: string): Promise<AdPolicy[]> {
  const query = db.select().from(adPolicies);
  if (category) {
    return query.where(and(eq(adPolicies.category, category), eq(adPolicies.isActive, true))).orderBy(adPolicies.sortOrder);
  }
  return query.where(eq(adPolicies.isActive, true)).orderBy(adPolicies.sortOrder);
}

export async function updateAdPolicy(id: string, data: Partial<AdPolicy>): Promise<AdPolicy | undefined> {
  const [updated] = await db.update(adPolicies)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(adPolicies.id, id))
    .returning();
  return updated;
}

// ===== AD WALLET ACCOUNTS =====

export async function createWalletAccount(advertiserId: string): Promise<AdWalletAccount> {
  const [wallet] = await db.insert(adWalletAccounts).values({ advertiserId }).returning();
  return wallet;
}

export async function getWalletByAdvertiserId(advertiserId: string): Promise<AdWalletAccount | undefined> {
  const [wallet] = await db.select().from(adWalletAccounts).where(eq(adWalletAccounts.advertiserId, advertiserId));
  return wallet;
}

export async function getWalletById(walletId: string): Promise<AdWalletAccount | undefined> {
  const [wallet] = await db.select().from(adWalletAccounts).where(eq(adWalletAccounts.id, walletId));
  return wallet;
}

export async function updateWalletBalance(walletId: string, amount: number, type: 'credit' | 'debit'): Promise<AdWalletAccount | undefined> {
  const [wallet] = await db.select().from(adWalletAccounts).where(eq(adWalletAccounts.id, walletId));
  if (!wallet) return undefined;

  if (wallet.isFrozen) {
    throw new Error('Wallet is frozen and cannot be modified');
  }

  if (type === 'debit') {
    const currentBalance = wallet.balance || 0;
    if (currentBalance < amount) {
      throw new Error(`Insufficient balance. Have ${currentBalance}, need ${amount}`);
    }
  }

  const [updated] = await db.update(adWalletAccounts)
    .set({ 
      balance: type === 'credit' 
        ? sql`COALESCE(${adWalletAccounts.balance}, 0) + ${amount}`
        : sql`COALESCE(${adWalletAccounts.balance}, 0) - ${amount}`,
      lifetimeDeposits: type === 'credit' 
        ? sql`COALESCE(${adWalletAccounts.lifetimeDeposits}, 0) + ${amount}`
        : sql`${adWalletAccounts.lifetimeDeposits}`,
      lifetimeSpend: type === 'debit' 
        ? sql`COALESCE(${adWalletAccounts.lifetimeSpend}, 0) + ${amount}`
        : sql`${adWalletAccounts.lifetimeSpend}`,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(adWalletAccounts.id, walletId),
        eq(adWalletAccounts.isFrozen, false),
        type === 'debit' 
          ? gte(adWalletAccounts.balance, amount)
          : sql`TRUE`
      )
    )
    .returning();
  
  if (!updated) {
    throw new Error('Failed to update wallet balance - wallet may be frozen or have insufficient funds');
  }
  
  return updated;
}

export async function freezeWallet(walletId: string, reason: string, frozenById: string): Promise<AdWalletAccount | undefined> {
  const [updated] = await db.update(adWalletAccounts)
    .set({ isFrozen: true, frozenReason: reason, frozenAt: new Date(), frozenById, updatedAt: new Date() })
    .where(eq(adWalletAccounts.id, walletId))
    .returning();
  return updated;
}

export async function unfreezeWallet(walletId: string): Promise<AdWalletAccount | undefined> {
  const [updated] = await db.update(adWalletAccounts)
    .set({ isFrozen: false, frozenReason: null, frozenAt: null, frozenById: null, updatedAt: new Date() })
    .where(eq(adWalletAccounts.id, walletId))
    .returning();
  return updated;
}

// ===== WALLET TRANSACTIONS =====

export async function createWalletTransaction(data: InsertAdWalletTransaction): Promise<AdWalletTransaction> {
  const [tx] = await db.insert(adWalletTransactions).values(data).returning();
  return tx;
}

export async function getWalletTransactions(walletId: string, options: { limit?: number; offset?: number } = {}): Promise<AdWalletTransaction[]> {
  return db.select().from(adWalletTransactions)
    .where(eq(adWalletTransactions.walletId, walletId))
    .orderBy(desc(adWalletTransactions.createdAt))
    .limit(options.limit || 50)
    .offset(options.offset || 0);
}

export async function updateTransactionStatus(id: string, status: string, completedAt?: Date): Promise<AdWalletTransaction | undefined> {
  const [updated] = await db.update(adWalletTransactions)
    .set({ status: status as any, completedAt: completedAt || new Date() })
    .where(eq(adWalletTransactions.id, id))
    .returning();
  return updated;
}

export async function getTransactionById(id: string): Promise<AdWalletTransaction | undefined> {
  const [tx] = await db.select().from(adWalletTransactions).where(eq(adWalletTransactions.id, id));
  return tx;
}

export async function updateTransaction(id: string, data: Partial<InsertAdWalletTransaction>): Promise<AdWalletTransaction | undefined> {
  const [updated] = await db.update(adWalletTransactions)
    .set({ ...data })
    .where(eq(adWalletTransactions.id, id))
    .returning();
  return updated;
}

// ===== CAMPAIGNS =====

export async function createCampaign(data: InsertAdCampaign): Promise<AdCampaign> {
  const [campaign] = await db.insert(adCampaigns).values(data).returning();
  return campaign;
}

export async function getCampaignById(id: string): Promise<AdCampaign | undefined> {
  const [campaign] = await db.select().from(adCampaigns).where(eq(adCampaigns.id, id));
  return campaign;
}

export async function getCampaignsByAdvertiser(advertiserId: string, options: { status?: string; limit?: number; offset?: number } = {}): Promise<(AdCampaign & { adStatus?: string })[]> {
  const conditions = [eq(adCampaigns.advertiserId, advertiserId)];
  if (options.status) {
    conditions.push(eq(adCampaigns.status, options.status as any));
  }
  
  const campaigns = await db.select().from(adCampaigns)
    .where(and(...conditions))
    .orderBy(desc(adCampaigns.createdAt))
    .limit(options.limit || 50)
    .offset(options.offset || 0);
  
  // Fetch the associated ad status for each campaign
  const campaignsWithAdStatus = await Promise.all(
    campaigns.map(async (campaign) => {
      const [ad] = await db.select({ status: ads.status }).from(ads)
        .where(eq(ads.campaignId, campaign.id))
        .limit(1);
      return {
        ...campaign,
        adStatus: ad?.status || undefined,
      };
    })
  );
  
  return campaignsWithAdStatus;
}

export async function getAllCampaigns(options: { status?: string; limit?: number; offset?: number } = {}): Promise<{ campaigns: AdCampaign[]; total: number }> {
  const conditions = [];
  if (options.status) {
    conditions.push(eq(adCampaigns.status, options.status as any));
  }

  const query = db.select().from(adCampaigns);
  const countQuery = db.select({ count: count() }).from(adCampaigns);

  if (conditions.length > 0) {
    const whereClause = and(...conditions);
    const results = await query.where(whereClause).limit(options.limit || 50).offset(options.offset || 0).orderBy(desc(adCampaigns.createdAt));
    const [{ count: total }] = await countQuery.where(whereClause);
    return { campaigns: results, total };
  }

  const results = await query.limit(options.limit || 50).offset(options.offset || 0).orderBy(desc(adCampaigns.createdAt));
  const [{ count: total }] = await countQuery;
  return { campaigns: results, total };
}

export async function updateCampaign(id: string, data: Partial<AdCampaign>): Promise<AdCampaign | undefined> {
  const [updated] = await db.update(adCampaigns)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(adCampaigns.id, id))
    .returning();
  return updated;
}

export async function updateCampaignStatus(id: string, status: string, reviewerId?: string, reason?: string): Promise<AdCampaign | undefined> {
  const updates: Partial<AdCampaign> = { status: status as any, updatedAt: new Date() };
  
  if (status === 'APPROVED' || status === 'REJECTED') {
    updates.reviewedAt = new Date();
    updates.reviewedById = reviewerId;
  }
  if (status === 'REJECTED' && reason) {
    updates.rejectionReason = reason;
  }
  if (status === 'PAUSED') {
    updates.pausedAt = new Date();
    updates.pausedById = reviewerId;
  }
  
  const [updated] = await db.update(adCampaigns)
    .set(updates)
    .where(eq(adCampaigns.id, id))
    .returning();
  return updated;
}

// ===== AD GROUPS =====

export async function createAdGroup(data: InsertAdGroup): Promise<AdGroup> {
  const [adGroup] = await db.insert(adGroups).values(data).returning();
  return adGroup;
}

export async function getAdGroupById(id: string): Promise<AdGroup | undefined> {
  const [adGroup] = await db.select().from(adGroups).where(eq(adGroups.id, id));
  return adGroup;
}

export async function getAdGroupsByCampaign(campaignId: string): Promise<AdGroup[]> {
  return db.select().from(adGroups)
    .where(eq(adGroups.campaignId, campaignId))
    .orderBy(desc(adGroups.createdAt));
}

export async function updateAdGroup(id: string, data: Partial<AdGroup>): Promise<AdGroup | undefined> {
  const [updated] = await db.update(adGroups)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(adGroups.id, id))
    .returning();
  return updated;
}

// ===== ADS =====

// Generate a unique ad number like AD-001234
// Uses MAX to avoid race conditions (count can cause duplicates)
async function generateAdNumber(): Promise<string> {
  // Get the maximum ad number to generate next sequential number
  const result = await db.select({ adNumber: ads.adNumber })
    .from(ads)
    .where(sql`ad_number IS NOT NULL`)
    .orderBy(desc(ads.adNumber))
    .limit(1);
  
  let nextNumber = 1;
  if (result.length > 0 && result[0].adNumber) {
    // Extract number from AD-XXXXXX format
    const match = result[0].adNumber.match(/AD-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }
  
  return `AD-${String(nextNumber).padStart(6, '0')}`;
}

export async function createAd(data: InsertAd): Promise<Ad> {
  // Generate ad number for tracking
  const adNumber = await generateAdNumber();
  const [ad] = await db.insert(ads).values({ ...data, adNumber }).returning();
  console.log(`[Ad Created] Ad ${adNumber} (${ad.id}) created for campaign ${ad.campaignId}`);
  return ad;
}

export async function getAdById(id: string): Promise<Ad | undefined> {
  const [ad] = await db.select().from(ads).where(eq(ads.id, id));
  return ad;
}

export async function getAdsByAdGroup(adGroupId: string): Promise<Ad[]> {
  return db.select().from(ads)
    .where(eq(ads.adGroupId, adGroupId))
    .orderBy(desc(ads.createdAt));
}

export async function getAdsByCampaign(campaignId: string): Promise<Ad[]> {
  return db.select().from(ads)
    .where(eq(ads.campaignId, campaignId))
    .orderBy(desc(ads.createdAt));
}

export async function getAllAds(options: { status?: string; format?: string; limit?: number; offset?: number } = {}): Promise<{ ads: Ad[]; total: number }> {
  const conditions = [];
  if (options.status) {
    conditions.push(eq(ads.status, options.status as any));
  }
  if (options.format) {
    conditions.push(eq(ads.format, options.format as any));
  }

  const query = db.select().from(ads);
  const countQuery = db.select({ count: count() }).from(ads);

  if (conditions.length > 0) {
    const whereClause = and(...conditions);
    const results = await query.where(whereClause).limit(options.limit || 50).offset(options.offset || 0).orderBy(desc(ads.createdAt));
    const [{ count: total }] = await countQuery.where(whereClause);
    return { ads: results, total };
  }

  const results = await query.limit(options.limit || 50).offset(options.offset || 0).orderBy(desc(ads.createdAt));
  const [{ count: total }] = await countQuery;
  return { ads: results, total };
}

export async function updateAd(id: string, data: Partial<Ad>): Promise<Ad | undefined> {
  const [updated] = await db.update(ads)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(ads.id, id))
    .returning();
  return updated;
}

export async function updateAdStatus(id: string, status: string, reviewerId?: string, reason?: string): Promise<Ad | undefined> {
  const updates: Partial<Ad> = { status: status as any, updatedAt: new Date() };
  
  if (status === 'APPROVED' || status === 'REJECTED') {
    updates.reviewedAt = new Date();
    updates.reviewedById = reviewerId;
  }
  if (status === 'REJECTED' && reason) {
    updates.rejectionReason = reason;
  }
  if (status === 'PAUSED') {
    updates.pausedAt = new Date();
    updates.pausedById = reviewerId;
  }
  
  const [updated] = await db.update(ads)
    .set(updates)
    .where(eq(ads.id, id))
    .returning();
  return updated;
}

// ===== AD EVENTS =====

export async function createAdEvent(data: InsertAdEvent): Promise<AdEvent> {
  const [event] = await db.insert(adEvents).values(data).returning();
  return event;
}

export async function getAdEvents(adId: string, options: { eventType?: string; limit?: number } = {}): Promise<AdEvent[]> {
  const conditions = [eq(adEvents.adId, adId)];
  if (options.eventType) {
    conditions.push(eq(adEvents.eventType, options.eventType as any));
  }
  return db.select().from(adEvents)
    .where(and(...conditions))
    .orderBy(desc(adEvents.createdAt))
    .limit(options.limit || 100);
}

// ===== AD STATS =====

export async function getCampaignStats(campaignId: string, startDate: Date, endDate: Date): Promise<AdStatsDaily[]> {
  return db.select().from(adStatsDaily)
    .where(and(
      eq(adStatsDaily.campaignId, campaignId),
      gte(adStatsDaily.date, startDate),
      lte(adStatsDaily.date, endDate)
    ))
    .orderBy(asc(adStatsDaily.date));
}

export async function getAdvertiserStats(advertiserId: string, startDate: Date, endDate: Date): Promise<AdStatsDaily[]> {
  return db.select().from(adStatsDaily)
    .where(and(
      eq(adStatsDaily.advertiserId, advertiserId),
      gte(adStatsDaily.date, startDate),
      lte(adStatsDaily.date, endDate)
    ))
    .orderBy(asc(adStatsDaily.date));
}

// ===== CUSTOM AUDIENCES =====

export async function createCustomAudience(data: Partial<AdCustomAudience>): Promise<AdCustomAudience> {
  const [audience] = await db.insert(adCustomAudiences).values({
    ...data,
    advertiserId: data.advertiserId!,
    name: data.name!,
  }).returning();
  return audience;
}

export async function getCustomAudiencesByAdvertiser(advertiserId: string): Promise<AdCustomAudience[]> {
  return db.select().from(adCustomAudiences)
    .where(eq(adCustomAudiences.advertiserId, advertiserId))
    .orderBy(desc(adCustomAudiences.createdAt));
}

export async function addAudienceMember(audienceId: string, userId: string, expiresAt?: Date): Promise<AdAudienceMember> {
  const [member] = await db.insert(adAudienceMembers)
    .values({ audienceId, userId, expiresAt })
    .returning();
  return member;
}

// ===== AD REVIEW HISTORY =====

export async function createReviewHistory(data: Partial<AdReviewHistory>): Promise<AdReviewHistory> {
  const [history] = await db.insert(adReviewHistory).values({
    ...data,
    adId: data.adId!,
    campaignId: data.campaignId!,
    action: data.action!,
  }).returning();
  return history;
}

export async function getReviewHistoryByAd(adId: string): Promise<AdReviewHistory[]> {
  return db.select().from(adReviewHistory)
    .where(eq(adReviewHistory.adId, adId))
    .orderBy(desc(adReviewHistory.createdAt));
}

// ===== USER AD PREFERENCES =====

export async function getUserAdPreferences(userId: string): Promise<UserAdPreferences | undefined> {
  const [prefs] = await db.select().from(userAdPreferences).where(eq(userAdPreferences.userId, userId));
  return prefs;
}

export async function updateUserAdPreferences(userId: string, data: Partial<UserAdPreferences>): Promise<UserAdPreferences> {
  const existing = await getUserAdPreferences(userId);
  if (existing) {
    const [updated] = await db.update(userAdPreferences)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userAdPreferences.userId, userId))
      .returning();
    return updated;
  }
  const [created] = await db.insert(userAdPreferences)
    .values({ userId, ...data })
    .returning();
  return created;
}

// ===== AD FREQUENCY TRACKING =====

export async function getFrequencyTracking(userId: string, adId: string): Promise<AdFrequencyTracking | undefined> {
  const [tracking] = await db.select().from(adFrequencyTracking)
    .where(and(eq(adFrequencyTracking.userId, userId), eq(adFrequencyTracking.adId, adId)));
  return tracking;
}

export async function updateFrequencyTracking(userId: string, adId: string, adGroupId: string, campaignId: string, isClick: boolean = false): Promise<AdFrequencyTracking> {
  const existing = await getFrequencyTracking(userId, adId);
  
  if (existing) {
    const [updated] = await db.update(adFrequencyTracking)
      .set({
        impressionCount: existing.impressionCount + (isClick ? 0 : 1),
        clickCount: existing.clickCount + (isClick ? 1 : 0),
        lastImpressionAt: isClick ? existing.lastImpressionAt : new Date(),
        lastClickAt: isClick ? new Date() : existing.lastClickAt,
      })
      .where(eq(adFrequencyTracking.id, existing.id))
      .returning();
    return updated;
  }
  
  const [created] = await db.insert(adFrequencyTracking)
    .values({
      userId,
      adId,
      adGroupId,
      campaignId,
      impressionCount: isClick ? 0 : 1,
      clickCount: isClick ? 1 : 0,
      lastImpressionAt: isClick ? null : new Date(),
      lastClickAt: isClick ? new Date() : null,
    })
    .returning();
  return created;
}

// ===== DELIVERY DIAGNOSTICS =====

export async function createDeliveryDiagnostic(data: Partial<AdDeliveryDiagnostic>): Promise<AdDeliveryDiagnostic> {
  const [diagnostic] = await db.insert(adDeliveryDiagnostics).values({
    ...data,
    campaignId: data.campaignId!,
    issue: data.issue!,
    message: data.message!,
  }).returning();
  return diagnostic;
}

export async function getCampaignDiagnostics(campaignId: string): Promise<AdDeliveryDiagnostic[]> {
  return db.select().from(adDeliveryDiagnostics)
    .where(and(eq(adDeliveryDiagnostics.campaignId, campaignId), eq(adDeliveryDiagnostics.isResolved, false)))
    .orderBy(desc(adDeliveryDiagnostics.createdAt));
}

export async function resolveDiagnostic(id: string): Promise<AdDeliveryDiagnostic | undefined> {
  const [updated] = await db.update(adDeliveryDiagnostics)
    .set({ isResolved: true, resolvedAt: new Date() })
    .where(eq(adDeliveryDiagnostics.id, id))
    .returning();
  return updated;
}

// ===== ACHIEVEMENTS =====

export async function createAchievement(data: Partial<AdvertiserAchievement>): Promise<AdvertiserAchievement> {
  const [achievement] = await db.insert(advertiserAchievements).values({
    ...data,
    advertiserId: data.advertiserId!,
    type: data.type!,
    name: data.name!,
  }).returning();
  return achievement;
}

export async function getAdvertiserAchievements(advertiserId: string): Promise<AdvertiserAchievement[]> {
  return db.select().from(advertiserAchievements)
    .where(eq(advertiserAchievements.advertiserId, advertiserId))
    .orderBy(desc(advertiserAchievements.earnedAt));
}

// ===== AUDIT LOGS =====

export async function createAdAuditLog(data: InsertAdAuditLog): Promise<AdAuditLog> {
  const [log] = await db.insert(adAuditLogs).values(data).returning();
  return log;
}

export async function getAdAuditLogs(options: { advertiserId?: string; action?: string; limit?: number; offset?: number } = {}): Promise<{ logs: AdAuditLog[]; total: number }> {
  const conditions = [];
  if (options.advertiserId) {
    conditions.push(eq(adAuditLogs.advertiserId, options.advertiserId));
  }
  if (options.action) {
    conditions.push(eq(adAuditLogs.action, options.action as any));
  }

  const query = db.select().from(adAuditLogs);
  const countQuery = db.select({ count: count() }).from(adAuditLogs);

  if (conditions.length > 0) {
    const whereClause = and(...conditions);
    const results = await query.where(whereClause).limit(options.limit || 50).offset(options.offset || 0).orderBy(desc(adAuditLogs.createdAt));
    const [{ count: total }] = await countQuery.where(whereClause);
    return { logs: results, total };
  }

  const results = await query.limit(options.limit || 50).offset(options.offset || 0).orderBy(desc(adAuditLogs.createdAt));
  const [{ count: total }] = await countQuery;
  return { logs: results, total };
}

// ===== SYSTEM SETTINGS =====

export async function getSystemSetting(key: string): Promise<AdSystemSetting | undefined> {
  const [setting] = await db.select().from(adSystemSettings).where(eq(adSystemSettings.key, key));
  return setting;
}

export async function updateSystemSetting(key: string, value: any, updatedById: string, description?: string): Promise<AdSystemSetting> {
  const existing = await getSystemSetting(key);
  if (existing) {
    const [updated] = await db.update(adSystemSettings)
      .set({ value, updatedById, updatedAt: new Date() })
      .where(eq(adSystemSettings.key, key))
      .returning();
    return updated;
  }
  const [created] = await db.insert(adSystemSettings)
    .values({ key, value, description, updatedById })
    .returning();
  return created;
}

export async function getAllSystemSettings(category?: string): Promise<AdSystemSetting[]> {
  if (category) {
    return db.select().from(adSystemSettings).where(eq(adSystemSettings.category, category));
  }
  return db.select().from(adSystemSettings);
}

// ===== CONVERSION PIXELS =====

export async function createConversionPixel(data: Partial<AdConversionPixel>): Promise<AdConversionPixel> {
  const pixelCode = `RC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const [pixel] = await db.insert(adConversionPixels).values({
    ...data,
    advertiserId: data.advertiserId!,
    name: data.name!,
    pixelCode,
  }).returning();
  return pixel;
}

export async function getConversionPixelsByAdvertiser(advertiserId: string): Promise<AdConversionPixel[]> {
  return db.select().from(adConversionPixels)
    .where(eq(adConversionPixels.advertiserId, advertiserId))
    .orderBy(desc(adConversionPixels.createdAt));
}

export async function getConversionPixelByCode(code: string): Promise<AdConversionPixel | undefined> {
  const [pixel] = await db.select().from(adConversionPixels).where(eq(adConversionPixels.pixelCode, code));
  return pixel;
}

export async function incrementPixelFires(pixelId: string): Promise<void> {
  await db.update(adConversionPixels)
    .set({ totalFires: sql`${adConversionPixels.totalFires} + 1`, lastFiredAt: new Date() })
    .where(eq(adConversionPixels.id, pixelId));
}

// ===== WEBHOOKS =====

export async function createWebhook(data: Partial<AdWebhook>): Promise<AdWebhook> {
  const [webhook] = await db.insert(adWebhooks).values({
    ...data,
    advertiserId: data.advertiserId!,
    url: data.url!,
  }).returning();
  return webhook;
}

export async function getWebhooksByAdvertiser(advertiserId: string): Promise<AdWebhook[]> {
  return db.select().from(adWebhooks)
    .where(eq(adWebhooks.advertiserId, advertiserId));
}

// ===== PROMO CODES =====

export async function createPromoCode(data: Partial<AdPromoCode>): Promise<AdPromoCode> {
  const [promo] = await db.insert(adPromoCodes).values({
    ...data,
    code: data.code!,
    amount: data.amount!,
  }).returning();
  return promo;
}

export async function getPromoCodeByCode(code: string): Promise<AdPromoCode | undefined> {
  const [promo] = await db.select().from(adPromoCodes)
    .where(and(eq(adPromoCodes.code, code.toUpperCase()), eq(adPromoCodes.isActive, true)));
  return promo;
}

export async function getAllPromoCodes(): Promise<AdPromoCode[]> {
  return db.select().from(adPromoCodes).orderBy(desc(adPromoCodes.createdAt));
}

export async function incrementPromoUsage(id: string): Promise<void> {
  await db.update(adPromoCodes)
    .set({ usageCount: sql`${adPromoCodes.usageCount} + 1` })
    .where(eq(adPromoCodes.id, id));
}

export async function atomicRedeemPromoCode(
  promoCodeId: string, 
  advertiserId: string, 
  walletId: string,
  promoAmount: number,
  usageLimit: number | null
): Promise<{ success: boolean; error?: string }> {
  const [existingRedemption] = await db.select()
    .from(adPromoCodeRedemptions)
    .where(and(
      eq(adPromoCodeRedemptions.promoCodeId, promoCodeId),
      eq(adPromoCodeRedemptions.advertiserId, advertiserId)
    ));
  
  if (existingRedemption) {
    return { success: false, error: "You have already redeemed this promo code" };
  }

  const updateResult = await db.update(adPromoCodes)
    .set({ usageCount: sql`COALESCE(${adPromoCodes.usageCount}, 0) + 1` })
    .where(
      and(
        eq(adPromoCodes.id, promoCodeId),
        usageLimit 
          ? sql`COALESCE(${adPromoCodes.usageCount}, 0) < ${usageLimit}`
          : sql`TRUE`
      )
    )
    .returning();

  if (!updateResult.length) {
    return { success: false, error: "Promo code usage limit reached" };
  }

  try {
    await db.insert(adPromoCodeRedemptions).values({
      promoCodeId,
      advertiserId,
      amountCredited: promoAmount,
    });
  } catch (error: any) {
    if (error.code === '23505') {
      await db.update(adPromoCodes)
        .set({ usageCount: sql`GREATEST(COALESCE(${adPromoCodes.usageCount}, 0) - 1, 0)` })
        .where(eq(adPromoCodes.id, promoCodeId));
      return { success: false, error: "You have already redeemed this promo code" };
    }
    throw error;
  }

  return { success: true };
}

// ===== AD DELIVERY ENGINE HELPERS =====

export async function getEligibleAdsForUser(
  userId: string,
  placement: string,
  userProfile: {
    netWorthTier?: string;
    influenceScore?: number;
    interests?: string[];
    age?: number;
    gender?: string;
    country?: string;
    province?: string;
    city?: string;
  }
): Promise<Ad[]> {
  const now = new Date();
  
  const eligibleAds = await db.select()
    .from(ads)
    .innerJoin(adCampaigns, eq(ads.campaignId, adCampaigns.id))
    .innerJoin(adGroups, eq(ads.adGroupId, adGroups.id))
    .innerJoin(advertisers, eq(ads.advertiserId, advertisers.id))
    .innerJoin(adWalletAccounts, eq(advertisers.id, adWalletAccounts.advertiserId))
    .where(and(
      eq(ads.status, 'ACTIVE'),
      eq(adCampaigns.status, 'ACTIVE'),
      eq(adGroups.status, 'ACTIVE'),
      eq(advertisers.status, 'ACTIVE'),
      gt(adWalletAccounts.balance, 0),
      eq(adWalletAccounts.isFrozen, false),
      or(isNull(adCampaigns.startDate), lte(adCampaigns.startDate, now)),
      or(isNull(adCampaigns.endDate), gte(adCampaigns.endDate, now))
    ))
    .limit(100);

  return eligibleAds.map(row => row.ads);
}

export async function getPendingReviewAds(): Promise<Ad[]> {
  return db.select().from(ads)
    .where(eq(ads.status, 'PENDING_REVIEW'))
    .orderBy(asc(ads.submittedAt));
}

export async function getPendingReviewCampaigns(): Promise<AdCampaign[]> {
  return db.select().from(adCampaigns)
    .where(eq(adCampaigns.status, 'PENDING_REVIEW'))
    .orderBy(asc(adCampaigns.submittedAt));
}

// ===== ANALYTICS AGGREGATION =====

export async function getAdsOverview(): Promise<{
  totalAdvertisers: number;
  activeAdvertisers: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalAds: number;
  activeAds: number;
  pendingReview: number;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
}> {
  const [advertiserStats] = await db.select({
    total: count(),
    active: sql<number>`COUNT(*) FILTER (WHERE status = 'ACTIVE')`,
  }).from(advertisers);

  const [campaignStats] = await db.select({
    total: count(),
    active: sql<number>`COUNT(*) FILTER (WHERE status = 'ACTIVE')`,
  }).from(adCampaigns);

  const [adStats] = await db.select({
    total: count(),
    active: sql<number>`COUNT(*) FILTER (WHERE status = 'ACTIVE')`,
    pending: sql<number>`COUNT(*) FILTER (WHERE status = 'PENDING_REVIEW')`,
    totalSpend: sql<number>`COALESCE(SUM(spend), 0)`,
    totalImpressions: sql<number>`COALESCE(SUM(impressions), 0)`,
    totalClicks: sql<number>`COALESCE(SUM(clicks), 0)`,
  }).from(ads);

  return {
    totalAdvertisers: advertiserStats.total,
    activeAdvertisers: advertiserStats.active,
    totalCampaigns: campaignStats.total,
    activeCampaigns: campaignStats.active,
    totalAds: adStats.total,
    activeAds: adStats.active,
    pendingReview: adStats.pending,
    totalSpend: adStats.totalSpend,
    totalImpressions: adStats.totalImpressions,
    totalClicks: adStats.totalClicks,
  };
}

// CTA Performance Statistics
export async function getCtaPerformanceStats(): Promise<Array<{
  callToAction: string;
  impressions: number;
  clicks: number;
  conversions: number;
}>> {
  const result = await db.select({
    callToAction: ads.callToAction,
    impressions: sql<number>`COALESCE(SUM(${ads.impressions}), 0)`,
    clicks: sql<number>`COALESCE(SUM(${ads.clicks}), 0)`,
    conversions: sql<number>`COALESCE(SUM(${ads.conversions}), 0)`,
  })
  .from(ads)
  .where(sql`${ads.callToAction} IS NOT NULL`)
  .groupBy(ads.callToAction)
  .orderBy(sql`SUM(${ads.clicks}) DESC`);

  return result.map(r => ({
    callToAction: r.callToAction || 'UNKNOWN',
    impressions: Number(r.impressions) || 0,
    clicks: Number(r.clicks) || 0,
    conversions: Number(r.conversions) || 0,
  }));
}

// Destination URL Performance Statistics
export async function getDestinationPerformanceStats(): Promise<Array<{
  url: string;
  clicks: number;
  conversions: number;
  adCount: number;
}>> {
  const result = await db.select({
    url: ads.destinationUrl,
    clicks: sql<number>`COALESCE(SUM(${ads.clicks}), 0)`,
    conversions: sql<number>`COALESCE(SUM(${ads.conversions}), 0)`,
    adCount: sql<number>`COUNT(*)`,
  })
  .from(ads)
  .where(sql`${ads.destinationUrl} IS NOT NULL AND ${ads.destinationUrl} LIKE 'http%'`)
  .groupBy(ads.destinationUrl)
  .orderBy(sql`SUM(${ads.clicks}) DESC`)
  .limit(50);

  return result.map(r => ({
    url: r.url || '',
    clicks: Number(r.clicks) || 0,
    conversions: Number(r.conversions) || 0,
    adCount: Number(r.adCount) || 1,
  }));
}
