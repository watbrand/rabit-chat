import {
  wallets, coinTransactions, giftTypes, giftTransactions,
  liveStreams, liveStreamViewers, liveStreamComments, liveStreamReactions, liveStreamGifts,
  groups, groupMembers, groupJoinRequests, groupPosts,
  events, eventRsvps,
  subscriptionTiers, subscriptions,
  broadcastChannels, broadcastChannelSubscribers, broadcastMessages,
  postReactions,
  userLocations, locationSharingSettings, venues, checkIns,
  groupConversations, groupConversationMembers, groupMessages,
  videoCalls,
  vanishModeSettings, hiddenWords, linkedAccounts,
  totpSecrets, backupCodes,
  arFilters, hashtags, postHashtags,
  postThreads, threadPosts, duetStitchPosts,
  webhooks, webhookDeliveries, featureFlags,
  commentReplies, pokes, bffStatus,
  scheduledMessages, pinnedMessages, chatFolders, chatFolderConversations,
  usageStats, focusModeSettings, notificationPreferences,
  securityCheckups, accountBackups,
  aiAvatars, aiTranslations,
  platformImports, exploreCategories,
  loginSessions, trustedDevices,
  users, posts, comments, conversations, messages,
  type Wallet, type CoinTransaction, type GiftType, type GiftTransaction,
  type LiveStream, type LiveStreamViewer, type LiveStreamComment, type LiveStreamReaction,
  type Group, type GroupMember, type GroupJoinRequest, type GroupPost,
  type Event, type EventRsvp,
  type SubscriptionTier, type Subscription,
  type BroadcastChannel, type BroadcastChannelSubscriber, type BroadcastMessage,
  type PostReaction,
  type UserLocation, type LocationSharingSetting, type Venue, type CheckIn,
  type GroupConversation, type GroupConversationMember, type GroupMessage,
  type VideoCall,
  type VanishModeSetting, type HiddenWord, type LinkedAccount,
  type TotpSecret, type BackupCode,
  type ArFilter, type Hashtag, type PostHashtag,
  type PostThread, type ThreadPost, type DuetStitchPost,
  type Webhook, type WebhookDelivery, type FeatureFlag,
  type CommentReply, type Poke, type BffStatus,
  type ScheduledMessage, type PinnedMessage, type ChatFolder, type ChatFolderConversation,
  type UsageStat, type FocusModeSetting, type NotificationPreference,
  type SecurityCheckup, type AccountBackup,
  type AiAvatar, type AiTranslation,
  type PlatformImport, type ExploreCategory,
  type LoginSession, type TrustedDevice,
  type User,
  type CoinTransactionType, type LiveStreamStatus, type GroupPrivacy, type GroupMemberRole,
  type EventStatus, type RsvpStatus, type SubscriptionStatus, type PostReactionType,
  type CallStatus, type CallType
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray, gt, lt, lte, ne, asc } from "drizzle-orm";

export class AdvancedStorage {
  // ============================================
  // VIRTUAL CURRENCY / WALLETS
  // ============================================

  async getOrCreateWallet(userId: string): Promise<Wallet> {
    const [existing] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    if (existing) return existing;
    
    const [wallet] = await db.insert(wallets).values({ userId }).returning();
    return wallet;
  }

  async getWallet(userId: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    return wallet;
  }

  async addCoins(userId: string, amount: number, type: CoinTransactionType, description?: string, referenceId?: string, referenceType?: string): Promise<CoinTransaction> {
    const wallet = await this.getOrCreateWallet(userId);
    const newBalance = wallet.coinBalance + amount;
    
    await db.update(wallets).set({
      coinBalance: newBalance,
      lifetimeEarned: wallet.lifetimeEarned + (amount > 0 ? amount : 0),
      updatedAt: new Date()
    }).where(eq(wallets.id, wallet.id));

    const [transaction] = await db.insert(coinTransactions).values({
      walletId: wallet.id,
      type,
      amount,
      balanceAfter: newBalance,
      description,
      referenceId,
      referenceType
    }).returning();

    return transaction;
  }

  async deductCoins(userId: string, amount: number, type: CoinTransactionType, description?: string, referenceId?: string, referenceType?: string): Promise<CoinTransaction | null> {
    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.coinBalance < amount) return null;
    
    const newBalance = wallet.coinBalance - amount;
    
    await db.update(wallets).set({
      coinBalance: newBalance,
      lifetimeSpent: wallet.lifetimeSpent + amount,
      updatedAt: new Date()
    }).where(eq(wallets.id, wallet.id));

    const [transaction] = await db.insert(coinTransactions).values({
      walletId: wallet.id,
      type,
      amount: -amount,
      balanceAfter: newBalance,
      description,
      referenceId,
      referenceType
    }).returning();

    return transaction;
  }

  async getCoinTransactions(userId: string, limit: number = 50): Promise<CoinTransaction[]> {
    const wallet = await this.getWallet(userId);
    if (!wallet) return [];
    
    return db.select().from(coinTransactions)
      .where(eq(coinTransactions.walletId, wallet.id))
      .orderBy(desc(coinTransactions.createdAt))
      .limit(limit);
  }

  // ============================================
  // GIFT TYPES & TRANSACTIONS
  // ============================================

  async getGiftTypes(category?: string): Promise<GiftType[]> {
    if (category) {
      return db.select().from(giftTypes)
        .where(and(eq(giftTypes.isActive, true), eq(giftTypes.category, category)))
        .orderBy(giftTypes.sortOrder);
    }
    return db.select().from(giftTypes)
      .where(eq(giftTypes.isActive, true))
      .orderBy(giftTypes.sortOrder);
  }

  async getGiftType(id: string): Promise<GiftType | undefined> {
    const [gift] = await db.select().from(giftTypes).where(eq(giftTypes.id, id)).limit(1);
    return gift;
  }

  async sendGift(senderId: string, recipientId: string, giftTypeId: string, quantity: number = 1, contextType?: string, contextId?: string, message?: string): Promise<GiftTransaction | null> {
    const giftType = await this.getGiftType(giftTypeId);
    if (!giftType) return null;

    const totalCoins = giftType.coinCost * quantity;
    const deduction = await this.deductCoins(senderId, totalCoins, 'GIFT_SENT', `Sent ${quantity}x ${giftType.name}`, giftTypeId, 'gift');
    if (!deduction) return null;

    await this.addCoins(recipientId, totalCoins, 'GIFT_RECEIVED', `Received ${quantity}x ${giftType.name} from user`, giftTypeId, 'gift');

    const [transaction] = await db.insert(giftTransactions).values({
      senderId,
      recipientId,
      giftTypeId,
      quantity,
      totalCoins,
      contextType,
      contextId,
      message
    }).returning();

    return transaction;
  }

  async getReceivedGifts(userId: string, limit: number = 50): Promise<(GiftTransaction & { sender: User; giftType: GiftType })[]> {
    const transactions = await db.select().from(giftTransactions)
      .where(eq(giftTransactions.recipientId, userId))
      .orderBy(desc(giftTransactions.createdAt))
      .limit(limit);

    const result: (GiftTransaction & { sender: User; giftType: GiftType })[] = [];
    for (const t of transactions) {
      const [sender] = await db.select().from(users).where(eq(users.id, t.senderId)).limit(1);
      const [giftType] = await db.select().from(giftTypes).where(eq(giftTypes.id, t.giftTypeId)).limit(1);
      if (sender && giftType) {
        result.push({ ...t, sender, giftType });
      }
    }
    return result;
  }

  // ============================================
  // LIVE STREAMING
  // ============================================

  async createLiveStream(hostId: string, title?: string, description?: string): Promise<LiveStream> {
    const streamKey = `stream_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const [stream] = await db.insert(liveStreams).values({
      hostId,
      title,
      description,
      streamKey,
      status: 'PREPARING'
    }).returning();
    return stream;
  }

  async getLiveStream(id: string): Promise<LiveStream | undefined> {
    const [stream] = await db.select().from(liveStreams).where(eq(liveStreams.id, id)).limit(1);
    return stream;
  }

  async getActiveLiveStreams(limit: number = 20): Promise<(LiveStream & { host: Omit<User, 'password'> })[]> {
    const streams = await db.select().from(liveStreams)
      .where(eq(liveStreams.status, 'LIVE'))
      .orderBy(desc(liveStreams.viewerCount))
      .limit(limit);

    const result: (LiveStream & { host: Omit<User, 'password'> })[] = [];
    for (const s of streams) {
      const [host] = await db.select().from(users).where(eq(users.id, s.hostId)).limit(1);
      if (host) {
        const { password, ...safeHost } = host;
        result.push({ ...s, host: safeHost as Omit<User, 'password'> });
      }
    }
    return result;
  }

  async getUserLiveStreams(userId: string): Promise<LiveStream[]> {
    return db.select().from(liveStreams)
      .where(eq(liveStreams.hostId, userId))
      .orderBy(desc(liveStreams.createdAt));
  }

  async startLiveStream(streamId: string): Promise<LiveStream | undefined> {
    const [stream] = await db.update(liveStreams)
      .set({ status: 'LIVE', startedAt: new Date() })
      .where(eq(liveStreams.id, streamId))
      .returning();
    return stream;
  }

  async endLiveStream(streamId: string, saveToProfile: boolean = false): Promise<LiveStream | undefined> {
    const stream = await this.getLiveStream(streamId);
    if (!stream) return undefined;

    const durationSeconds = stream.startedAt ? Math.floor((Date.now() - stream.startedAt.getTime()) / 1000) : 0;

    const [updated] = await db.update(liveStreams)
      .set({ 
        status: 'ENDED', 
        endedAt: new Date(),
        durationSeconds,
        savedToProfile: saveToProfile
      })
      .where(eq(liveStreams.id, streamId))
      .returning();
    return updated;
  }

  async joinLiveStream(streamId: string, userId: string): Promise<LiveStreamViewer> {
    const [existing] = await db.select().from(liveStreamViewers)
      .where(and(eq(liveStreamViewers.streamId, streamId), eq(liveStreamViewers.userId, userId)))
      .limit(1);

    if (existing) {
      const [updated] = await db.update(liveStreamViewers)
        .set({ joinedAt: new Date(), leftAt: null })
        .where(eq(liveStreamViewers.id, existing.id))
        .returning();
      return updated;
    }

    const [viewer] = await db.insert(liveStreamViewers).values({ streamId, userId }).returning();
    
    await db.update(liveStreams)
      .set({ viewerCount: sql`viewer_count + 1`, totalViews: sql`total_views + 1` })
      .where(eq(liveStreams.id, streamId));

    const stream = await this.getLiveStream(streamId);
    if (stream && stream.viewerCount > stream.peakViewerCount) {
      await db.update(liveStreams)
        .set({ peakViewerCount: stream.viewerCount })
        .where(eq(liveStreams.id, streamId));
    }

    return viewer;
  }

  async leaveLiveStream(streamId: string, userId: string): Promise<void> {
    const [viewer] = await db.select().from(liveStreamViewers)
      .where(and(eq(liveStreamViewers.streamId, streamId), eq(liveStreamViewers.userId, userId)))
      .limit(1);

    if (viewer && !viewer.leftAt) {
      const watchTime = Math.floor((Date.now() - viewer.joinedAt.getTime()) / 1000);
      await db.update(liveStreamViewers)
        .set({ leftAt: new Date(), watchTimeSeconds: watchTime })
        .where(eq(liveStreamViewers.id, viewer.id));

      await db.update(liveStreams)
        .set({ viewerCount: sql`GREATEST(viewer_count - 1, 0)` })
        .where(eq(liveStreams.id, streamId));
    }
  }

  async addLiveStreamComment(streamId: string, userId: string, content: string): Promise<LiveStreamComment> {
    const [comment] = await db.insert(liveStreamComments).values({ streamId, userId, content }).returning();
    await db.update(liveStreams).set({ commentsCount: sql`comments_count + 1` }).where(eq(liveStreams.id, streamId));
    return comment;
  }

  async getLiveStreamComments(streamId: string, limit: number = 100): Promise<(LiveStreamComment & { user: User })[]> {
    const comments = await db.select().from(liveStreamComments)
      .where(and(eq(liveStreamComments.streamId, streamId), eq(liveStreamComments.isHidden, false)))
      .orderBy(desc(liveStreamComments.createdAt))
      .limit(limit);

    const result: (LiveStreamComment & { user: User })[] = [];
    for (const c of comments) {
      const [user] = await db.select().from(users).where(eq(users.id, c.userId)).limit(1);
      if (user) {
        result.push({ ...c, user });
      }
    }
    return result;
  }

  async addLiveStreamReaction(streamId: string, userId: string, reactionType: string): Promise<LiveStreamReaction> {
    const [reaction] = await db.insert(liveStreamReactions).values({ streamId, userId, reactionType }).returning();
    await db.update(liveStreams).set({ likesCount: sql`likes_count + 1` }).where(eq(liveStreams.id, streamId));
    return reaction;
  }

  // ============================================
  // GROUPS / ELITE CIRCLES
  // ============================================

  async createGroup(ownerId: string, name: string, description?: string, privacy: GroupPrivacy = 'PUBLIC', netWorthRequirement?: number): Promise<Group> {
    const [group] = await db.insert(groups).values({
      ownerId,
      name,
      description,
      privacy,
      netWorthRequirement
    }).returning();

    await db.insert(groupMembers).values({
      groupId: group.id,
      userId: ownerId,
      role: 'OWNER'
    });

    return group;
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
    return group;
  }

  async getPublicGroups(limit: number = 20): Promise<(Group & { owner: User })[]> {
    const groupList = await db.select().from(groups)
      .where(and(eq(groups.privacy, 'PUBLIC'), eq(groups.isArchived, false)))
      .orderBy(desc(groups.memberCount))
      .limit(limit);

    const result: (Group & { owner: User })[] = [];
    for (const g of groupList) {
      const [owner] = await db.select().from(users).where(eq(users.id, g.ownerId)).limit(1);
      if (owner) {
        result.push({ ...g, owner });
      }
    }
    return result;
  }

  async getUserGroups(userId: string): Promise<(Group & { role: GroupMemberRole })[]> {
    const memberships = await db.select().from(groupMembers)
      .where(eq(groupMembers.userId, userId));

    const result: (Group & { role: GroupMemberRole })[] = [];
    for (const m of memberships) {
      const group = await this.getGroup(m.groupId);
      if (group && !group.isArchived) {
        result.push({ ...group, role: m.role });
      }
    }
    return result;
  }

  async joinGroup(groupId: string, userId: string): Promise<GroupMember | GroupJoinRequest | null> {
    const group = await this.getGroup(groupId);
    if (!group) return null;

    if (group.requireApproval || group.privacy === 'PRIVATE') {
      const [existing] = await db.select().from(groupJoinRequests)
        .where(and(eq(groupJoinRequests.groupId, groupId), eq(groupJoinRequests.userId, userId)))
        .limit(1);
      if (existing) return existing;

      const [request] = await db.insert(groupJoinRequests).values({ groupId, userId }).returning();
      return request;
    }

    const [member] = await db.insert(groupMembers).values({ groupId, userId }).returning();
    await db.update(groups).set({ memberCount: sql`member_count + 1` }).where(eq(groups.id, groupId));
    return member;
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const [member] = await db.select().from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);

    if (member && member.role !== 'OWNER') {
      await db.delete(groupMembers).where(eq(groupMembers.id, member.id));
      await db.update(groups).set({ memberCount: sql`GREATEST(member_count - 1, 0)` }).where(eq(groups.id, groupId));
    }
  }

  async getGroupMembers(groupId: string): Promise<(GroupMember & { user: User })[]> {
    const members = await db.select().from(groupMembers)
      .where(eq(groupMembers.groupId, groupId))
      .orderBy(groupMembers.role, groupMembers.joinedAt);

    const result: (GroupMember & { user: User })[] = [];
    for (const m of members) {
      const [user] = await db.select().from(users).where(eq(users.id, m.userId)).limit(1);
      if (user) {
        result.push({ ...m, user });
      }
    }
    return result;
  }

  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    const [member] = await db.select().from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);
    return !!member;
  }

  async getGroupMemberRole(groupId: string, userId: string): Promise<GroupMemberRole | null> {
    const [member] = await db.select().from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);
    return member?.role || null;
  }

  // ============================================
  // EVENTS
  // ============================================

  async createEvent(hostId: string, data: Partial<Event>): Promise<Event> {
    const [event] = await db.insert(events).values({
      hostId,
      title: data.title || 'Untitled Event',
      description: data.description,
      eventType: data.eventType || 'IN_PERSON',
      startsAt: data.startsAt || new Date(),
      endsAt: data.endsAt,
      locationName: data.locationName,
      locationAddress: data.locationAddress,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
      virtualLink: data.virtualLink,
      maxAttendees: data.maxAttendees,
      isPrivate: data.isPrivate || false,
      ticketPrice: data.ticketPrice,
      status: 'DRAFT'
    }).returning();
    return event;
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
    return event;
  }

  async getUpcomingEvents(limit: number = 20): Promise<(Event & { host: User })[]> {
    const eventList = await db.select().from(events)
      .where(and(
        eq(events.status, 'PUBLISHED'),
        eq(events.isPrivate, false),
        gt(events.startsAt, new Date())
      ))
      .orderBy(events.startsAt)
      .limit(limit);

    const result: (Event & { host: User })[] = [];
    for (const e of eventList) {
      const [host] = await db.select().from(users).where(eq(users.id, e.hostId)).limit(1);
      if (host) {
        result.push({ ...e, host });
      }
    }
    return result;
  }

  async rsvpEvent(eventId: string, userId: string, status: RsvpStatus): Promise<EventRsvp> {
    const [existing] = await db.select().from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)))
      .limit(1);

    if (existing) {
      const oldStatus = existing.status;
      const [updated] = await db.update(eventRsvps)
        .set({ status, updatedAt: new Date() })
        .where(eq(eventRsvps.id, existing.id))
        .returning();

      if (oldStatus !== status) {
        if (oldStatus === 'GOING') {
          await db.update(events).set({ goingCount: sql`GREATEST(going_count - 1, 0)` }).where(eq(events.id, eventId));
        } else if (oldStatus === 'INTERESTED') {
          await db.update(events).set({ interestedCount: sql`GREATEST(interested_count - 1, 0)` }).where(eq(events.id, eventId));
        }

        if (status === 'GOING') {
          await db.update(events).set({ goingCount: sql`going_count + 1` }).where(eq(events.id, eventId));
        } else if (status === 'INTERESTED') {
          await db.update(events).set({ interestedCount: sql`interested_count + 1` }).where(eq(events.id, eventId));
        }
      }

      return updated;
    }

    const [rsvp] = await db.insert(eventRsvps).values({ eventId, userId, status }).returning();

    if (status === 'GOING') {
      await db.update(events).set({ goingCount: sql`going_count + 1` }).where(eq(events.id, eventId));
    } else if (status === 'INTERESTED') {
      await db.update(events).set({ interestedCount: sql`interested_count + 1` }).where(eq(events.id, eventId));
    }

    return rsvp;
  }

  // ============================================
  // SUBSCRIPTIONS / SUPER FOLLOWS
  // ============================================

  async createSubscriptionTier(creatorId: string, name: string, monthlyPriceCoins: number, description?: string, benefits?: string[]): Promise<SubscriptionTier> {
    const [tier] = await db.insert(subscriptionTiers).values({
      creatorId,
      name,
      monthlyPriceCoins,
      description,
      benefits: benefits || []
    }).returning();
    return tier;
  }

  async getCreatorSubscriptionTiers(creatorId: string): Promise<SubscriptionTier[]> {
    return db.select().from(subscriptionTiers)
      .where(and(eq(subscriptionTiers.creatorId, creatorId), eq(subscriptionTiers.isActive, true)))
      .orderBy(subscriptionTiers.sortOrder);
  }

  async subscribe(subscriberId: string, creatorId: string, tierId: string): Promise<Subscription | null> {
    const tier = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.id, tierId)).limit(1);
    if (!tier[0]) return null;

    const deduction = await this.deductCoins(subscriberId, tier[0].monthlyPriceCoins, 'SUBSCRIPTION_PAYMENT', `Subscription to creator`, tierId, 'subscription');
    if (!deduction) return null;

    await this.addCoins(creatorId, tier[0].monthlyPriceCoins, 'GIFT_RECEIVED', 'Subscription payment', tierId, 'subscription');

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const [subscription] = await db.insert(subscriptions).values({
      subscriberId,
      creatorId,
      tierId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd
    }).returning();

    await db.update(subscriptionTiers).set({ subscriberCount: sql`subscriber_count + 1` }).where(eq(subscriptionTiers.id, tierId));

    return subscription;
  }

  async isSubscribed(subscriberId: string, creatorId: string): Promise<boolean> {
    const [sub] = await db.select().from(subscriptions)
      .where(and(
        eq(subscriptions.subscriberId, subscriberId),
        eq(subscriptions.creatorId, creatorId),
        eq(subscriptions.status, 'ACTIVE')
      ))
      .limit(1);
    return !!sub;
  }

  // ============================================
  // BROADCAST CHANNELS
  // ============================================

  async createBroadcastChannel(ownerId: string, name: string, description?: string): Promise<BroadcastChannel> {
    const [channel] = await db.insert(broadcastChannels).values({
      ownerId,
      name,
      description
    }).returning();
    return channel;
  }

  async getBroadcastChannel(id: string): Promise<BroadcastChannel | undefined> {
    const [channel] = await db.select().from(broadcastChannels).where(eq(broadcastChannels.id, id)).limit(1);
    return channel;
  }

  async subscribeToBroadcastChannel(channelId: string, userId: string): Promise<BroadcastChannelSubscriber> {
    const [sub] = await db.insert(broadcastChannelSubscribers).values({ channelId, userId }).returning();
    await db.update(broadcastChannels).set({ subscriberCount: sql`subscriber_count + 1` }).where(eq(broadcastChannels.id, channelId));
    return sub;
  }

  async sendBroadcastMessage(channelId: string, content: string, mediaUrl?: string, mediaType?: string): Promise<BroadcastMessage> {
    const [message] = await db.insert(broadcastMessages).values({
      channelId,
      content,
      mediaUrl,
      mediaType
    }).returning();
    await db.update(broadcastChannels).set({ messageCount: sql`message_count + 1` }).where(eq(broadcastChannels.id, channelId));
    return message;
  }

  async getBroadcastMessages(channelId: string, limit: number = 50): Promise<BroadcastMessage[]> {
    return db.select().from(broadcastMessages)
      .where(eq(broadcastMessages.channelId, channelId))
      .orderBy(desc(broadcastMessages.createdAt))
      .limit(limit);
  }

  // ============================================
  // POST REACTIONS
  // ============================================

  async addPostReaction(postId: string, userId: string, reactionType: PostReactionType): Promise<PostReaction> {
    await db.delete(postReactions)
      .where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)));

    const [reaction] = await db.insert(postReactions).values({
      postId,
      userId,
      reactionType
    }).returning();
    return reaction;
  }

  async removePostReaction(postId: string, userId: string): Promise<void> {
    await db.delete(postReactions)
      .where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)));
  }

  async getPostReactions(postId: string): Promise<{ type: PostReactionType; count: number; users: User[] }[]> {
    const reactions = await db.select().from(postReactions).where(eq(postReactions.postId, postId));
    
    const grouped: Record<string, string[]> = {};
    for (const r of reactions) {
      if (!grouped[r.reactionType]) grouped[r.reactionType] = [];
      grouped[r.reactionType].push(r.userId);
    }

    const result: { type: PostReactionType; count: number; users: User[] }[] = [];
    for (const [type, userIds] of Object.entries(grouped)) {
      const userList = await db.select().from(users).where(inArray(users.id, userIds.slice(0, 10)));
      result.push({
        type: type as PostReactionType,
        count: userIds.length,
        users: userList
      });
    }
    return result;
  }

  // ============================================
  // LOCATION SHARING
  // ============================================

  async updateUserLocation(userId: string, latitude: number, longitude: number, locationName?: string): Promise<UserLocation> {
    const [existing] = await db.select().from(userLocations).where(eq(userLocations.userId, userId)).limit(1);

    if (existing) {
      const [updated] = await db.update(userLocations)
        .set({ latitude, longitude, locationName, updatedAt: new Date() })
        .where(eq(userLocations.id, existing.id))
        .returning();
      return updated;
    }

    const [location] = await db.insert(userLocations).values({
      userId,
      latitude,
      longitude,
      locationName,
      isSharing: false
    }).returning();
    return location;
  }

  async setLocationSharing(userId: string, isSharing: boolean, sharingMode?: string, expiresAt?: Date): Promise<UserLocation | undefined> {
    const [updated] = await db.update(userLocations)
      .set({ isSharing, sharingMode: sharingMode || 'FRIENDS', expiresAt, updatedAt: new Date() })
      .where(eq(userLocations.userId, userId))
      .returning();
    return updated;
  }

  async getNearbyUsers(userId: string, radiusKm: number = 10): Promise<(UserLocation & { user: User })[]> {
    const [myLocation] = await db.select().from(userLocations).where(eq(userLocations.userId, userId)).limit(1);
    if (!myLocation) return [];

    const locations = await db.select().from(userLocations)
      .where(and(
        eq(userLocations.isSharing, true),
        ne(userLocations.userId, userId)
      ));

    const result: (UserLocation & { user: User })[] = [];
    for (const loc of locations) {
      const distance = this.calculateDistance(myLocation.latitude, myLocation.longitude, loc.latitude, loc.longitude);
      if (distance <= radiusKm) {
        const [user] = await db.select().from(users).where(eq(users.id, loc.userId)).limit(1);
        if (user) {
          result.push({ ...loc, user });
        }
      }
    }
    return result;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // ============================================
  // CHECK-INS & VENUES
  // ============================================

  async createVenue(name: string, category?: string, address?: string, city?: string, country?: string, latitude?: number, longitude?: number): Promise<Venue> {
    const [venue] = await db.insert(venues).values({
      name,
      category,
      address,
      city,
      country,
      latitude,
      longitude
    }).returning();
    return venue;
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id)).limit(1);
    return venue;
  }

  async searchVenues(query: string, limit: number = 20): Promise<Venue[]> {
    return db.select().from(venues)
      .where(sql`name ILIKE ${'%' + query + '%'}`)
      .orderBy(desc(venues.checkInCount))
      .limit(limit);
  }

  async checkIn(userId: string, venueId?: string, customLocationName?: string, latitude?: number, longitude?: number, postId?: string, caption?: string): Promise<CheckIn> {
    const [checkIn] = await db.insert(checkIns).values({
      userId,
      venueId,
      customLocationName,
      latitude,
      longitude,
      postId,
      caption
    }).returning();

    if (venueId) {
      await db.update(venues).set({ checkInCount: sql`check_in_count + 1` }).where(eq(venues.id, venueId));
    }

    return checkIn;
  }

  async getUserCheckIns(userId: string, limit: number = 20): Promise<(CheckIn & { venue?: Venue })[]> {
    const checkInList = await db.select().from(checkIns)
      .where(eq(checkIns.userId, userId))
      .orderBy(desc(checkIns.createdAt))
      .limit(limit);

    const result: (CheckIn & { venue?: Venue })[] = [];
    for (const c of checkInList) {
      let venue: Venue | undefined;
      if (c.venueId) {
        venue = await this.getVenue(c.venueId);
      }
      result.push({ ...c, venue });
    }
    return result;
  }

  // ============================================
  // GROUP CONVERSATIONS
  // ============================================

  async createGroupConversation(creatorId: string, name?: string, memberIds: string[] = []): Promise<GroupConversation> {
    const [conversation] = await db.insert(groupConversations).values({
      creatorId,
      name,
      memberCount: memberIds.length + 1
    }).returning();

    await db.insert(groupConversationMembers).values({
      conversationId: conversation.id,
      userId: creatorId,
      role: 'ADMIN'
    });

    for (const memberId of memberIds) {
      await db.insert(groupConversationMembers).values({
        conversationId: conversation.id,
        userId: memberId,
        role: 'MEMBER'
      });
    }

    return conversation;
  }

  async getGroupConversation(id: string): Promise<GroupConversation | undefined> {
    const [conversation] = await db.select().from(groupConversations).where(eq(groupConversations.id, id)).limit(1);
    return conversation;
  }

  async getUserGroupConversations(userId: string): Promise<(GroupConversation & { members: User[] })[]> {
    const memberships = await db.select().from(groupConversationMembers)
      .where(eq(groupConversationMembers.userId, userId));

    const result: (GroupConversation & { members: User[] })[] = [];
    for (const m of memberships) {
      const conversation = await this.getGroupConversation(m.conversationId);
      if (conversation && conversation.isActive) {
        const memberList = await db.select().from(groupConversationMembers)
          .where(eq(groupConversationMembers.conversationId, conversation.id));
        const memberUsers: User[] = [];
        for (const mem of memberList) {
          const [user] = await db.select().from(users).where(eq(users.id, mem.userId)).limit(1);
          if (user) memberUsers.push(user);
        }
        result.push({ ...conversation, members: memberUsers });
      }
    }
    return result;
  }

  async sendGroupMessage(conversationId: string, senderId: string, content: string, messageType: string = 'TEXT', mediaUrl?: string): Promise<GroupMessage> {
    const [message] = await db.insert(groupMessages).values({
      conversationId,
      senderId,
      content,
      messageType: messageType as any,
      mediaUrl
    }).returning();

    await db.update(groupConversations)
      .set({ messageCount: sql`message_count + 1`, lastMessageAt: new Date() })
      .where(eq(groupConversations.id, conversationId));

    return message;
  }

  async getGroupMessages(conversationId: string, limit: number = 50): Promise<(GroupMessage & { sender: User })[]> {
    const messageList = await db.select().from(groupMessages)
      .where(and(eq(groupMessages.conversationId, conversationId), eq(groupMessages.isDeleted, false)))
      .orderBy(desc(groupMessages.createdAt))
      .limit(limit);

    const result: (GroupMessage & { sender: User })[] = [];
    for (const m of messageList) {
      const [sender] = await db.select().from(users).where(eq(users.id, m.senderId)).limit(1);
      if (sender) {
        result.push({ ...m, sender });
      }
    }
    return result.reverse();
  }

  // ============================================
  // VIDEO CALLS
  // ============================================

  async initiateCall(callerId: string, calleeId: string, callType: CallType = 'VIDEO'): Promise<VideoCall> {
    const roomId = `call_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const [call] = await db.insert(videoCalls).values({
      callerId,
      calleeId,
      callType,
      roomId,
      status: 'RINGING'
    }).returning();
    return call;
  }

  async getCall(id: string): Promise<VideoCall | undefined> {
    const [call] = await db.select().from(videoCalls).where(eq(videoCalls.id, id)).limit(1);
    return call;
  }

  async answerCall(callId: string): Promise<VideoCall | undefined> {
    const [call] = await db.update(videoCalls)
      .set({ status: 'ONGOING', startedAt: new Date() })
      .where(eq(videoCalls.id, callId))
      .returning();
    return call;
  }

  async endCall(callId: string, status: CallStatus = 'ENDED'): Promise<VideoCall | undefined> {
    const call = await this.getCall(callId);
    if (!call) return undefined;

    const durationSeconds = call.startedAt ? Math.floor((Date.now() - call.startedAt.getTime()) / 1000) : 0;

    const [updated] = await db.update(videoCalls)
      .set({ status, endedAt: new Date(), durationSeconds })
      .where(eq(videoCalls.id, callId))
      .returning();
    return updated;
  }

  async getUserCallHistory(userId: string, limit: number = 50): Promise<(VideoCall & { caller: User; callee: User })[]> {
    const calls = await db.select().from(videoCalls)
      .where(sql`caller_id = ${userId} OR callee_id = ${userId}`)
      .orderBy(desc(videoCalls.createdAt))
      .limit(limit);

    const result: (VideoCall & { caller: User; callee: User })[] = [];
    for (const c of calls) {
      const [caller] = await db.select().from(users).where(eq(users.id, c.callerId)).limit(1);
      const [callee] = await db.select().from(users).where(eq(users.id, c.calleeId)).limit(1);
      if (caller && callee) {
        result.push({ ...c, caller, callee });
      }
    }
    return result;
  }

  // ============================================
  // FEATURE FLAGS
  // ============================================

  async getFeatureFlag(key: string): Promise<FeatureFlag | undefined> {
    const [flag] = await db.select().from(featureFlags).where(eq(featureFlags.key, key)).limit(1);
    return flag;
  }

  async isFeatureEnabled(key: string, userId?: string): Promise<boolean> {
    const flag = await this.getFeatureFlag(key);
    if (!flag || !flag.isEnabled) return false;

    if (userId) {
      const blockedIds = (flag.blockedUserIds as string[]) || [];
      if (blockedIds.includes(userId)) return false;

      const allowedIds = (flag.allowedUserIds as string[]) || [];
      if (allowedIds.length > 0 && !allowedIds.includes(userId)) {
        return Math.random() * 100 < (flag.rolloutPercentage || 100);
      }
    }

    return Math.random() * 100 < (flag.rolloutPercentage || 100);
  }

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    return db.select().from(featureFlags).orderBy(featureFlags.key);
  }

  async updateFeatureFlag(key: string, data: Partial<FeatureFlag>): Promise<FeatureFlag | undefined> {
    const [updated] = await db.update(featureFlags)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(featureFlags.key, key))
      .returning();
    return updated;
  }

  async createFeatureFlag(key: string, name: string, description?: string): Promise<FeatureFlag> {
    const [flag] = await db.insert(featureFlags).values({
      key,
      name,
      description,
      isEnabled: false
    }).returning();
    return flag;
  }

  // ============================================
  // HASHTAGS
  // ============================================

  async getOrCreateHashtag(tag: string): Promise<Hashtag> {
    const normalizedTag = tag.toLowerCase().replace(/^#/, '');
    const [existing] = await db.select().from(hashtags).where(eq(hashtags.tag, normalizedTag)).limit(1);
    if (existing) return existing;

    const [hashtag] = await db.insert(hashtags).values({ tag: normalizedTag }).returning();
    return hashtag;
  }

  async addPostHashtags(postId: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const hashtag = await this.getOrCreateHashtag(tag);
      await db.insert(postHashtags).values({ postId, hashtagId: hashtag.id }).onConflictDoNothing();
      await db.update(hashtags).set({ 
        postCount: sql`post_count + 1`,
        weeklyPostCount: sql`weekly_post_count + 1`,
        updatedAt: new Date()
      }).where(eq(hashtags.id, hashtag.id));
    }
  }

  async getTrendingHashtags(limit: number = 20): Promise<Hashtag[]> {
    return db.select().from(hashtags)
      .where(eq(hashtags.isBlocked, false))
      .orderBy(desc(hashtags.weeklyPostCount))
      .limit(limit);
  }

  async searchHashtags(query: string, limit: number = 20): Promise<Hashtag[]> {
    return db.select().from(hashtags)
      .where(sql`tag ILIKE ${'%' + query.toLowerCase() + '%'} AND is_blocked = false`)
      .orderBy(desc(hashtags.postCount))
      .limit(limit);
  }

  // ============================================
  // USAGE STATS & FOCUS MODE
  // ============================================

  async recordUsageStat(userId: string, stat: Partial<UsageStat>): Promise<UsageStat> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [existing] = await db.select().from(usageStats)
      .where(and(eq(usageStats.userId, userId), eq(usageStats.date, today)))
      .limit(1);

    if (existing) {
      const [updated] = await db.update(usageStats)
        .set({
          screenTimeMinutes: sql`screen_time_minutes + ${stat.screenTimeMinutes || 0}`,
          sessionsCount: sql`sessions_count + ${stat.sessionsCount || 0}`,
          postsViewed: sql`posts_viewed + ${stat.postsViewed || 0}`,
          storiesViewed: sql`stories_viewed + ${stat.storiesViewed || 0}`,
          messagesSent: sql`messages_sent + ${stat.messagesSent || 0}`,
          notificationsReceived: sql`notifications_received + ${stat.notificationsReceived || 0}`
        })
        .where(eq(usageStats.id, existing.id))
        .returning();
      return updated;
    }

    const [newStat] = await db.insert(usageStats).values({
      userId,
      date: today,
      ...stat
    }).returning();
    return newStat;
  }

  async getUserUsageStats(userId: string, days: number = 7): Promise<UsageStat[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return db.select().from(usageStats)
      .where(and(eq(usageStats.userId, userId), gt(usageStats.date, startDate)))
      .orderBy(desc(usageStats.date));
  }

  async getFocusModeSettings(userId: string): Promise<FocusModeSetting | undefined> {
    const [settings] = await db.select().from(focusModeSettings).where(eq(focusModeSettings.userId, userId)).limit(1);
    return settings;
  }

  async updateFocusModeSettings(userId: string, data: Partial<FocusModeSetting>): Promise<FocusModeSetting> {
    const [existing] = await db.select().from(focusModeSettings).where(eq(focusModeSettings.userId, userId)).limit(1);

    if (existing) {
      const [updated] = await db.update(focusModeSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(focusModeSettings.id, existing.id))
        .returning();
      return updated;
    }

    const [newSettings] = await db.insert(focusModeSettings).values({
      userId,
      ...data
    }).returning();
    return newSettings;
  }

  // ============================================
  // POKES / WAVES
  // ============================================

  async sendPoke(senderId: string, recipientId: string, pokeType: string = 'WAVE'): Promise<Poke> {
    const [poke] = await db.insert(pokes).values({
      senderId,
      recipientId,
      pokeType
    }).returning();
    return poke;
  }

  async getReceivedPokes(userId: string, limit: number = 20): Promise<(Poke & { sender: User })[]> {
    const pokeList = await db.select().from(pokes)
      .where(eq(pokes.recipientId, userId))
      .orderBy(desc(pokes.createdAt))
      .limit(limit);

    const result: (Poke & { sender: User })[] = [];
    for (const p of pokeList) {
      const [sender] = await db.select().from(users).where(eq(users.id, p.senderId)).limit(1);
      if (sender) {
        result.push({ ...p, sender });
      }
    }
    return result;
  }

  async markPokeAsSeen(pokeId: string): Promise<void> {
    await db.update(pokes).set({ seenAt: new Date() }).where(eq(pokes.id, pokeId));
  }

  // ============================================
  // EXPLORE CATEGORIES
  // ============================================

  async getExploreCategories(): Promise<ExploreCategory[]> {
    return db.select().from(exploreCategories)
      .where(eq(exploreCategories.isActive, true))
      .orderBy(exploreCategories.sortOrder);
  }

  async createExploreCategory(name: string, slug: string, description?: string, iconName?: string): Promise<ExploreCategory> {
    const [category] = await db.insert(exploreCategories).values({
      name,
      slug,
      description,
      iconName
    }).returning();
    return category;
  }
  // ============================================
  // VANISH MODE SETTINGS
  // ============================================

  async getVanishModeSettings(userId: string, conversationId: string): Promise<VanishModeSetting | undefined> {
    const [settings] = await db.select().from(vanishModeSettings)
      .where(eq(vanishModeSettings.conversationId, conversationId))
      .limit(1);
    return settings;
  }

  async setVanishMode(userId: string, conversationId: string, enabled: boolean): Promise<VanishModeSetting> {
    const [existing] = await db.select().from(vanishModeSettings)
      .where(eq(vanishModeSettings.conversationId, conversationId))
      .limit(1);

    if (existing) {
      const [updated] = await db.update(vanishModeSettings)
        .set({ 
          isEnabled: enabled, 
          enabledById: enabled ? userId : existing.enabledById,
          enabledAt: enabled ? new Date() : existing.enabledAt,
          disabledAt: enabled ? null : new Date()
        })
        .where(eq(vanishModeSettings.id, existing.id))
        .returning();
      return updated;
    }

    const [newSettings] = await db.insert(vanishModeSettings).values({
      conversationId,
      isEnabled: enabled,
      enabledById: enabled ? userId : null,
      enabledAt: enabled ? new Date() : null
    }).returning();
    return newSettings;
  }

  // ============================================
  // SCHEDULED MESSAGES
  // ============================================

  async createScheduledMessage(senderId: string, conversationId: string, content: string, scheduledFor: Date): Promise<ScheduledMessage> {
    const [msg] = await db.insert(scheduledMessages).values({
      senderId,
      conversationId,
      content,
      scheduledFor
    }).returning();
    return msg;
  }

  async getScheduledMessages(userId: string): Promise<ScheduledMessage[]> {
    return db.select().from(scheduledMessages)
      .where(and(eq(scheduledMessages.senderId, userId), eq(scheduledMessages.isCancelled, false)))
      .orderBy(scheduledMessages.scheduledFor);
  }

  async cancelScheduledMessage(messageId: string): Promise<void> {
    await db.update(scheduledMessages)
      .set({ isCancelled: true })
      .where(eq(scheduledMessages.id, messageId));
  }

  async getPendingScheduledMessages(before: Date): Promise<ScheduledMessage[]> {
    return db.select().from(scheduledMessages)
      .where(and(eq(scheduledMessages.isCancelled, false), lte(scheduledMessages.scheduledFor, before)))
      .orderBy(scheduledMessages.scheduledFor);
  }

  // ============================================
  // PINNED MESSAGES
  // ============================================

  async pinMessage(conversationId: string, messageId: string, pinnedBy: string): Promise<PinnedMessage> {
    const [pinned] = await db.insert(pinnedMessages).values({
      conversationId,
      messageId,
      pinnedById: pinnedBy
    }).returning();
    return pinned;
  }

  async unpinMessage(conversationId: string, messageId: string): Promise<void> {
    await db.delete(pinnedMessages)
      .where(and(eq(pinnedMessages.conversationId, conversationId), eq(pinnedMessages.messageId, messageId)));
  }

  async getPinnedMessages(conversationId: string): Promise<PinnedMessage[]> {
    return db.select().from(pinnedMessages)
      .where(eq(pinnedMessages.conversationId, conversationId))
      .orderBy(desc(pinnedMessages.pinnedAt));
  }

  // ============================================
  // CHAT FOLDERS
  // ============================================

  async createChatFolder(userId: string, name: string, iconName?: string): Promise<ChatFolder> {
    const [folder] = await db.insert(chatFolders).values({
      userId,
      name,
      iconName
    }).returning();
    return folder;
  }

  async getUserChatFolders(userId: string): Promise<ChatFolder[]> {
    return db.select().from(chatFolders)
      .where(eq(chatFolders.userId, userId))
      .orderBy(chatFolders.sortOrder);
  }

  async addConversationToFolder(folderId: string, conversationId: string): Promise<void> {
    await db.insert(chatFolderConversations).values({
      folderId,
      conversationId
    }).onConflictDoNothing();
  }

  async removeConversationFromFolder(folderId: string, conversationId: string): Promise<void> {
    await db.delete(chatFolderConversations)
      .where(and(eq(chatFolderConversations.folderId, folderId), eq(chatFolderConversations.conversationId, conversationId)));
  }

  async getConversationsInFolder(folderId: string): Promise<string[]> {
    const rows = await db.select({ conversationId: chatFolderConversations.conversationId })
      .from(chatFolderConversations)
      .where(eq(chatFolderConversations.folderId, folderId));
    return rows.map(r => r.conversationId);
  }

  async deleteChatFolder(folderId: string): Promise<void> {
    await db.delete(chatFolderConversations).where(eq(chatFolderConversations.folderId, folderId));
    await db.delete(chatFolders).where(eq(chatFolders.id, folderId));
  }

  // ============================================
  // TWO-FACTOR AUTHENTICATION (2FA)
  // ============================================

  async createTotpSecret(userId: string, secret: string): Promise<TotpSecret> {
    const [totp] = await db.insert(totpSecrets).values({
      userId,
      secret,
      isEnabled: false
    }).returning();
    return totp;
  }

  async getTotpSecret(userId: string): Promise<TotpSecret | undefined> {
    const [totp] = await db.select().from(totpSecrets)
      .where(eq(totpSecrets.userId, userId))
      .limit(1);
    return totp;
  }

  async verifyTotp(userId: string): Promise<void> {
    await db.update(totpSecrets)
      .set({ isEnabled: true, verifiedAt: new Date() })
      .where(eq(totpSecrets.userId, userId));
  }

  async deleteTotp(userId: string): Promise<void> {
    await db.delete(totpSecrets).where(eq(totpSecrets.userId, userId));
  }

  async createBackupCodes(userId: string, codes: string[]): Promise<BackupCode[]> {
    const inserted = await db.insert(backupCodes).values(
      codes.map(code => ({ userId, code }))
    ).returning();
    return inserted;
  }

  async getBackupCodes(userId: string): Promise<BackupCode[]> {
    return db.select().from(backupCodes)
      .where(and(eq(backupCodes.userId, userId), sql`${backupCodes.usedAt} IS NULL`));
  }

  async useBackupCode(userId: string, code: string): Promise<boolean> {
    const [existing] = await db.select().from(backupCodes)
      .where(and(eq(backupCodes.userId, userId), eq(backupCodes.code, code), sql`${backupCodes.usedAt} IS NULL`))
      .limit(1);

    if (!existing) return false;

    await db.update(backupCodes)
      .set({ usedAt: new Date() })
      .where(eq(backupCodes.id, existing.id));
    return true;
  }

  // ============================================
  // LINKED ACCOUNTS (Links multiple user accounts together)
  // ============================================

  async linkAccounts(primaryUserId: string, linkedUserId: string): Promise<LinkedAccount> {
    const [account] = await db.insert(linkedAccounts).values({
      primaryUserId,
      linkedUserId
    }).returning();
    return account;
  }

  async getLinkedAccounts(userId: string): Promise<LinkedAccount[]> {
    return db.select().from(linkedAccounts)
      .where(eq(linkedAccounts.primaryUserId, userId));
  }

  async unlinkAccount(primaryUserId: string, linkedUserId: string): Promise<void> {
    await db.delete(linkedAccounts)
      .where(and(eq(linkedAccounts.primaryUserId, primaryUserId), eq(linkedAccounts.linkedUserId, linkedUserId)));
  }

  async getLinkedAccountByUsers(primaryUserId: string, linkedUserId: string): Promise<LinkedAccount | undefined> {
    const [account] = await db.select().from(linkedAccounts)
      .where(and(eq(linkedAccounts.primaryUserId, primaryUserId), eq(linkedAccounts.linkedUserId, linkedUserId)))
      .limit(1);
    return account;
  }

  // ============================================
  // HIDDEN WORDS
  // ============================================

  async addHiddenWord(userId: string, word: string): Promise<HiddenWord> {
    const [hidden] = await db.insert(hiddenWords).values({
      userId,
      word: word.toLowerCase()
    }).returning();
    return hidden;
  }

  async getHiddenWords(userId: string): Promise<HiddenWord[]> {
    return db.select().from(hiddenWords)
      .where(eq(hiddenWords.userId, userId));
  }

  async removeHiddenWord(wordId: string): Promise<void> {
    await db.delete(hiddenWords).where(eq(hiddenWords.id, wordId));
  }

  // ============================================
  // POST THREADS
  // ============================================

  async createThread(userId: string, title?: string): Promise<PostThread> {
    const [thread] = await db.insert(postThreads).values({
      authorId: userId,
      title
    }).returning();
    return thread;
  }

  async addPostToThread(threadId: string, postId: string, position: number): Promise<ThreadPost> {
    const [threadPost] = await db.insert(threadPosts).values({
      threadId,
      postId,
      position
    }).returning();
    return threadPost;
  }

  async getThread(threadId: string): Promise<(PostThread & { posts: ThreadPost[] }) | undefined> {
    const [thread] = await db.select().from(postThreads)
      .where(eq(postThreads.id, threadId))
      .limit(1);
    if (!thread) return undefined;

    const posts = await db.select().from(threadPosts)
      .where(eq(threadPosts.threadId, threadId))
      .orderBy(threadPosts.position);

    return { ...thread, posts };
  }

  async getUserThreads(userId: string): Promise<PostThread[]> {
    return db.select().from(postThreads)
      .where(eq(postThreads.authorId, userId))
      .orderBy(desc(postThreads.createdAt));
  }

  // ============================================
  // DUETS AND STITCHES
  // ============================================

  async createDuetStitch(type: 'DUET' | 'STITCH', originalPostId: string, newPostId: string): Promise<DuetStitchPost> {
    const [duetStitch] = await db.insert(duetStitchPosts).values({
      type,
      originalPostId,
      postId: newPostId
    }).returning();
    return duetStitch;
  }

  async getDuetsForPost(postId: string): Promise<DuetStitchPost[]> {
    return db.select().from(duetStitchPosts)
      .where(and(eq(duetStitchPosts.originalPostId, postId), eq(duetStitchPosts.type, 'DUET')));
  }

  async getStitchesForPost(postId: string): Promise<DuetStitchPost[]> {
    return db.select().from(duetStitchPosts)
      .where(and(eq(duetStitchPosts.originalPostId, postId), eq(duetStitchPosts.type, 'STITCH')));
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  async createWebhook(userId: string, url: string, events: string[], secret: string): Promise<Webhook> {
    const [webhook] = await db.insert(webhooks).values({
      userId,
      url,
      events,
      secret
    }).returning();
    return webhook;
  }

  async getUserWebhooks(userId: string): Promise<Webhook[]> {
    return db.select().from(webhooks)
      .where(eq(webhooks.userId, userId));
  }

  async getWebhook(webhookId: string): Promise<Webhook | undefined> {
    const [webhook] = await db.select().from(webhooks)
      .where(eq(webhooks.id, webhookId))
      .limit(1);
    return webhook;
  }

  async updateWebhook(webhookId: string, data: Partial<Webhook>): Promise<Webhook | undefined> {
    const [updated] = await db.update(webhooks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(webhooks.id, webhookId))
      .returning();
    return updated;
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await db.delete(webhookDeliveries).where(eq(webhookDeliveries.webhookId, webhookId));
    await db.delete(webhooks).where(eq(webhooks.id, webhookId));
  }

  async recordWebhookDelivery(webhookId: string, event: string, payload: any, responseStatus?: number, responseBody?: string): Promise<WebhookDelivery> {
    const [delivery] = await db.insert(webhookDeliveries).values({
      webhookId,
      event,
      payload,
      responseStatus,
      responseBody,
      deliveredAt: new Date()
    }).returning();
    return delivery;
  }

  async getWebhookDeliveries(webhookId: string, limit: number = 50): Promise<WebhookDelivery[]> {
    return db.select().from(webhookDeliveries)
      .where(eq(webhookDeliveries.webhookId, webhookId))
      .orderBy(desc(webhookDeliveries.deliveredAt))
      .limit(limit);
  }

  // ============================================
  // AR FILTERS
  // ============================================

  async getArFilters(): Promise<ArFilter[]> {
    return db.select().from(arFilters)
      .where(eq(arFilters.isActive, true))
      .orderBy(desc(arFilters.createdAt));
  }

  async createArFilter(name: string, category: string, thumbnailUrl: string, filterUrl: string, creatorId?: string): Promise<ArFilter> {
    const [filter] = await db.insert(arFilters).values({
      name,
      category,
      thumbnailUrl,
      filterUrl,
      creatorId
    }).returning();
    return filter;
  }

  // ============================================
  // SECURITY CHECKUPS & ACCOUNT BACKUPS
  // ============================================

  async createSecurityCheckup(userId: string): Promise<SecurityCheckup> {
    const [checkup] = await db.insert(securityCheckups).values({
      userId,
      passwordStrength: 'UNKNOWN',
      twoFactorEnabled: false,
      recoveryEmailSet: false,
      loginAlertsEnabled: false,
      suspiciousActivityFound: false,
      recommendations: []
    }).returning();
    return checkup;
  }

  async getSecurityCheckup(userId: string): Promise<SecurityCheckup | undefined> {
    const [checkup] = await db.select().from(securityCheckups)
      .where(eq(securityCheckups.userId, userId))
      .orderBy(desc(securityCheckups.checkupDate))
      .limit(1);
    return checkup;
  }

  async updateSecurityCheckup(checkupId: string, data: Partial<SecurityCheckup>): Promise<SecurityCheckup | undefined> {
    const [updated] = await db.update(securityCheckups)
      .set(data)
      .where(eq(securityCheckups.id, checkupId))
      .returning();
    return updated;
  }

  async requestAccountBackup(userId: string, backupType: string = 'FULL'): Promise<AccountBackup> {
    const [backup] = await db.insert(accountBackups).values({
      userId,
      backupType,
      status: 'PENDING'
    }).returning();
    return backup;
  }

  async getAccountBackup(userId: string): Promise<AccountBackup | undefined> {
    const [backup] = await db.select().from(accountBackups)
      .where(eq(accountBackups.userId, userId))
      .orderBy(desc(accountBackups.createdAt))
      .limit(1);
    return backup;
  }

  async updateAccountBackup(backupId: string, status: string, downloadUrl?: string): Promise<AccountBackup | undefined> {
    const [updated] = await db.update(accountBackups)
      .set({
        status,
        downloadUrl,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
        expiresAt: status === 'COMPLETED' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined
      })
      .where(eq(accountBackups.id, backupId))
      .returning();
    return updated;
  }

  // ============================================
  // LOGIN SESSIONS
  // ============================================

  async getLoginSessions(userId: string): Promise<LoginSession[]> {
    return db.select().from(loginSessions)
      .where(eq(loginSessions.userId, userId))
      .orderBy(desc(loginSessions.lastActiveAt));
  }

  async createLoginSession(userId: string, sessionToken: string, deviceName?: string, ipAddress?: string, location?: string): Promise<LoginSession> {
    const [session] = await db.insert(loginSessions).values({
      userId,
      sessionToken,
      deviceName,
      ipAddress,
      location,
      isActive: true,
      lastActiveAt: new Date()
    }).returning();
    return session;
  }

  async updateLoginSession(sessionId: string): Promise<LoginSession | undefined> {
    const [updated] = await db.update(loginSessions)
      .set({ lastActiveAt: new Date() })
      .where(eq(loginSessions.id, sessionId))
      .returning();
    return updated;
  }

  async deactivateLoginSession(userId: string, sessionId: string): Promise<boolean> {
    const result = await db.update(loginSessions)
      .set({ isActive: false })
      .where(and(eq(loginSessions.id, sessionId), eq(loginSessions.userId, userId)));
    return true;
  }

  async deactivateAllLoginSessions(userId: string, exceptSessionId?: string): Promise<boolean> {
    if (exceptSessionId) {
      await db.update(loginSessions)
        .set({ isActive: false })
        .where(and(eq(loginSessions.userId, userId), ne(loginSessions.id, exceptSessionId)));
    } else {
      await db.update(loginSessions)
        .set({ isActive: false })
        .where(eq(loginSessions.userId, userId));
    }
    return true;
  }

  // ============================================
  // TRUSTED DEVICES
  // ============================================

  async getTrustedDevices(userId: string): Promise<TrustedDevice[]> {
    return db.select().from(trustedDevices)
      .where(eq(trustedDevices.userId, userId))
      .orderBy(desc(trustedDevices.lastUsedAt));
  }

  async addTrustedDevice(userId: string, deviceId: string, deviceName: string, deviceType?: string): Promise<TrustedDevice> {
    const [device] = await db.insert(trustedDevices).values({
      userId,
      deviceId,
      deviceName,
      deviceType,
      lastUsedAt: new Date()
    }).returning();
    return device;
  }

  async removeTrustedDevice(userId: string, deviceRecordId: string): Promise<boolean> {
    await db.delete(trustedDevices)
      .where(and(eq(trustedDevices.id, deviceRecordId), eq(trustedDevices.userId, userId)));
    return true;
  }

  async isTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
    const [device] = await db.select().from(trustedDevices)
      .where(and(eq(trustedDevices.userId, userId), eq(trustedDevices.deviceId, deviceId)))
      .limit(1);
    return !!device;
  }

  async updateTrustedDeviceLastUsed(userId: string, deviceId: string): Promise<void> {
    await db.update(trustedDevices)
      .set({ lastUsedAt: new Date() })
      .where(and(eq(trustedDevices.userId, userId), eq(trustedDevices.deviceId, deviceId)));
  }
}

export const advancedStorage = new AdvancedStorage();
