import { 
  users, posts, comments, likes, follows, conversations, messages, notifications, blocks, reports,
  roles, appSettings, auditLogs, userRoles, permissions, rolePermissions, userSettings,
  bookmarks, shares, postViews, pins, playlists, playlistItems, featuredIntros, verificationRequests,
  profileViews, watchEvents, dailyUserAnalytics, dailyPostAnalytics,
  stories, storyViews,
  storyHighlights, storyHighlightItems, userNotes, userLinks, userInterests,
  loginSessions, trustedDevices, restrictedAccounts, mutedAccounts, keywordFilters,
  drafts, scheduledPosts, postCollaborators, adminUserNotes, closeFriends,
  storyViewerRestrictions, dataExportRequests, pendingTagApprovals,
  gossipPosts, gossipLikes, gossipComments, gossipRetweets,
  mallCategories, mallItems, mallPurchases, netWorthLedger, trendsDaily, contentVelocity,
  savedPosts, hiddenPosts, notInterestedPosts,
  storyStickers, storyStickerResponses, storyReactions, storyReplies, storyDrafts,
  storyInsights, storyStreaks, storyTemplates, storyMusicLibrary, storyTips, storyCountdownSubscriptions,
  messageReactions, userOnlineStatus, typingIndicators,
  passwordResetTokens, emailVerificationTokens,
  payfastOrders, totpSecrets, backupCodes,
  groupConversations, groupConversationMembers, groupMessages,
  videoCalls, type VideoCall,
  postThreads, threadPosts, duetStitchPosts, usageStats,
  venues, checkIns, userLocations, arFilters,
  aiAvatars, aiTranslations, exploreCategories,
  webhooks, webhookDeliveries, apiAccessTokens,
  accountBackups, platformImports,
  wordFilters, adminKeywordFilters, notificationDefaults,
  wallets, coinTransactions, giftTypes, giftTransactions,
  coinBundles, coinPurchases, dailyRewards, dailyRewardConfig,
  mallWishlists, mallReviews, userBankAccounts, userKyc, withdrawalRequests,
  platformRevenue, platformStats, achievements, userAchievements,
  supportTickets, supportTicketMessages, platformConfig,
  wealthClubs, userWealthClub, giftStakes, stakingTiers,
  platformBattles, battleParticipants, creatorEarnings, earningsHistory, economyConfig,
  type PostThread, type ThreadPost, type DuetStitchPost, type ArFilter,
  type AiAvatar, type AiTranslation, type ExploreCategory,
  type Webhook, type WebhookDelivery, type ApiAccessToken,
  type User, type InsertUser, type Post, type Comment, type Like,
  type Follow, type Conversation, type Message, type PostWithAuthor,
  type CommentWithAuthor, type ConversationWithParticipants, type MessageWithSender,
  type Notification, type NotificationWithActor, type NotificationType,
  type Block, type Report, type ReportStatus, type Role, type AppSetting, type AuditLog, type AuditAction,
  type Permission, type RoleWithPermissions, type UserSettings,
  type Bookmark, type Share, type PostView, type PostType, type Visibility,
  type Pin, type Playlist, type PlaylistItem, type FeaturedIntro, type PlaylistType,
  type VerificationRequest, type VerificationStatus, type VerificationCategory, type VerificationRequestWithUser,
  type ProfileView, type WatchEvent, type DailyUserAnalytics, type DailyPostAnalytics, type TrafficSource,
  type Story, type StoryView, type StoryWithUser, type StoryType, type StoryFont, type StoryTextAlign, 
  type StoryTextAnimation, type StoryReplySetting, type StoryStickerType, type StoryReactionType,
  type StorySticker, type StoryStickerResponse, type StoryReaction, type StoryReply, type StoryDraft,
  type StoryInsight, type StoryStreak, type StoryTemplate, type StoryMusic, type StoryTip, type StoryCountdownSubscription,
  type StoryHighlight, type StoryHighlightItem, type UserNote, type UserLink, type UserInterest,
  type RelationshipStatus, type ThemeStyle, type LinkIconType,
  type LoginSession, type TrustedDevice, type RestrictedAccount, type MutedAccount, type KeywordFilter,
  type Draft, type ScheduledPost, type PostCollaborator, type AdminUserNote, type CloseFriend,
  type StoryViewerRestriction, type DataExportRequest, type PendingTagApproval,
  type FontSize, type ExportStatus, type ScheduledStatus,
  type GossipPost, type GossipLike, type GossipComment, type GossipRetweet,
  type MallCategory, type MallItem, type MallPurchase, type NetWorthLedgerEntry, type TrendDaily,
  type GossipType, type ConversationStatus, type InboxFolder, type NetWorthReason,
  type PayfastOrder, type InsertPayfastOrder,
  type TotpSecret, type BackupCode,
  type GroupConversation, type GroupConversationMember, type GroupMessage,
  type Venue, type CheckIn, type UserLocation,
  linkedAccounts, type LinkedAccount,
  type AccountBackup, type PlatformImport,
  type WordFilter, type AdminKeywordFilter, type NotificationDefault,
  type Wallet, type CoinTransaction, type GiftType, type GiftTransaction,
  type CoinBundle, type CoinPurchase, type DailyReward, type DailyRewardConfig,
  type MallWishlist, type MallReview, type UserBankAccount, type UserKyc, type WithdrawalRequest,
  type PlatformRevenue, type PlatformStat, type Achievement, type UserAchievement,
  type SupportTicket, type SupportTicketMessage, type PlatformConfig,
  type WealthClub, type UserWealthClub, type GiftStake, type StakingTier,
  type PlatformBattle, type BattleParticipant, type CreatorEarnings, type EarningsHistory, type EconomyConfig
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, or, and, ilike, sql, inArray, isNull, isNotNull, gt, lt, gte, lte, ne, not, type SQL } from "drizzle-orm";
import { interleaveByCreator, diversifyFeed } from "./algorithm/diversity";

export interface CreatePostInput {
  authorId: string;
  type?: PostType;
  content?: string | null;
  caption?: string | null;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  durationMs?: number | null;
  aspectRatio?: number | null;
  visibility?: Visibility;
  commentsEnabled?: boolean;
}

export interface CreateVerificationInput {
  userId: string;
  fullName: string;
  category: VerificationCategory;
  documentUrls: string[];
  links: string[];
  reason: string;
}

export interface CreateStoryInput {
  type: StoryType;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  durationMs?: number | null;
  caption?: string | null;
  textContent?: string | null;
  backgroundColor?: string | null;
  isGradient?: boolean;
  gradientColors?: string[] | null;
  fontFamily?: StoryFont;
  textAlignment?: StoryTextAlign;
  textAnimation?: StoryTextAnimation;
  textBackgroundPill?: boolean;
  fontSize?: number;
  audioUrl?: string | null;
  audioDuration?: number | null;
  audioTranscript?: string | null;
  musicUrl?: string | null;
  musicTitle?: string | null;
  musicArtist?: string | null;
  musicStartTime?: number | null;
  musicDuration?: number | null;
  filterName?: string | null;
  textOverlays?: any[] | null;
  drawings?: any[] | null;
  isCloseFriends?: boolean;
  replySetting?: StoryReplySetting;
  scheduledAt?: Date | null;
  locationName?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
}

export interface CreateStoryStickerInput {
  storyId: string;
  type: StoryStickerType;
  positionX?: number;
  positionY?: number;
  scale?: number;
  rotation?: number;
  data: any;
}

export interface CreateStoryDraftInput {
  type: StoryType;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
  textContent?: string | null;
  backgroundColor?: string | null;
  isGradient?: boolean;
  gradientColors?: string[] | null;
  fontFamily?: StoryFont;
  textAlignment?: StoryTextAlign;
  textAnimation?: StoryTextAnimation;
  fontSize?: number;
  audioUrl?: string | null;
  audioDuration?: number | null;
  musicUrl?: string | null;
  musicTitle?: string | null;
  musicArtist?: string | null;
  filterName?: string | null;
  textOverlays?: any[] | null;
  drawings?: any[] | null;
  stickers?: any[] | null;
  isCloseFriends?: boolean;
  replySetting?: StoryReplySetting;
}

export interface VerificationFilters {
  status?: VerificationStatus;
  category?: VerificationCategory;
  limit?: number;
  offset?: number;
}

// Studio Analytics types
export interface StudioOverview {
  profileViews: number;
  postViews: number;
  likesReceived: number;
  commentsReceived: number;
  sharesReceived: number;
  savesReceived: number;
  newFollowers: number;
  totalWatchTimeMs: number;
  avgWatchTimeMs: number;
  completionRate: number;
  trafficSources: {
    feed: number;
    profile: number;
    search: number;
    share: number;
  };
  trend: {
    profileViews: number;
    postViews: number;
    followers: number;
  };
}

export interface StudioContentItem {
  post: PostWithAuthor;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  totalWatchTimeMs: number;
  avgWatchTimeMs: number;
  completionRate: number;
}

export interface StudioPostDetail {
  post: PostWithAuthor;
  totalViews: number;
  uniqueViews: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  totalWatchTimeMs: number;
  avgWatchTimeMs: number;
  completionRate: number;
  dailyMetrics: DailyPostAnalytics[];
  trafficSources: {
    feed: number;
    profile: number;
    search: number;
    share: number;
  };
}

export interface StudioAudience {
  totalFollowers: number;
  newFollowers: number;
  unfollows: number;
  netGrowth: number;
  dailyFollowerGrowth: { date: string; followers: number; unfollows: number }[];
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  searchUsers(query: string): Promise<User[]>;
  
  createPost(data: CreatePostInput): Promise<Post>;
  getPost(id: string): Promise<PostWithAuthor | undefined>;
  getPosts(limit?: number, offset?: number): Promise<PostWithAuthor[]>;
  getFeedPosts(userId: string, limit?: number, cursor?: string): Promise<{ posts: PostWithAuthor[], nextCursor: string | null }>;
  getTrendingPreviewPosts(limit?: number): Promise<PostWithAuthor[]>;
  getUserPosts(userId: string): Promise<PostWithAuthor[]>;
  deletePost(id: string): Promise<void>;
  searchPosts(query: string): Promise<PostWithAuthor[]>;
  
  // Bookmarks
  savePost(userId: string, postId: string): Promise<Bookmark>;
  unsavePost(userId: string, postId: string): Promise<void>;
  hasUserSavedPost(postId: string, userId: string): Promise<boolean>;
  getUserBookmarks(userId: string): Promise<PostWithAuthor[]>;
  
  // Shares
  sharePost(userId: string, postId: string, platform?: string): Promise<Share>;
  
  // Views
  viewPost(userId: string, postId: string): Promise<{ isNew: boolean }>;
  hasUserViewedPost(postId: string, userId: string): Promise<boolean>;
  
  createComment(postId: string, authorId: string, content: string): Promise<Comment>;
  getPostComments(postId: string): Promise<CommentWithAuthor[]>;
  deleteComment(id: string): Promise<void>;
  
  likePost(postId: string, userId: string): Promise<Like>;
  unlikePost(postId: string, userId: string): Promise<void>;
  hasUserLikedPost(postId: string, userId: string): Promise<boolean>;
  
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  getFollowersCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
  
  getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation>;
  getConversation(conversationId: string): Promise<Conversation | undefined>;
  isConversationParticipant(conversationId: string, userId: string): Promise<boolean>;
  getUserConversations(userId: string): Promise<ConversationWithParticipants[]>;
  
  createMessage(conversationId: string, senderId: string, receiverId: string, content: string): Promise<Message>;
  createMessageWithMedia(conversationId: string, senderId: string, receiverId: string, content: string, messageType: string, mediaUrl: string | null, replyToId: string | null): Promise<Message>;
  getMessage(messageId: string): Promise<Message | undefined>;
  deleteMessage(messageId: string): Promise<void>;
  getConversationMessages(conversationId: string, limit?: number): Promise<MessageWithSender[]>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  addMessageReaction(messageId: string, userId: string, emoji: string): Promise<any>;
  removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void>;
  updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void>;
  getUserOnlineStatus(userId: string): Promise<any>;
  
  createNotification(userId: string, actorId: string, type: NotificationType, entityId?: string): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<NotificationWithActor[]>;
  markNotificationRead(notificationId: string, userId: string): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  
  // Blocking
  blockUser(blockerId: string, blockedId: string): Promise<Block>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
  isBlockedEither(userId1: string, userId2: string): Promise<boolean>;
  getBlockedUsers(userId: string): Promise<User[]>;
  getHiddenUserIds(userId: string): Promise<string[]>;
  
  // Reporting
  createReport(reporterId: string, reason: string, reportedUserId?: string, reportedPostId?: string): Promise<Report>;
  getReports(status?: ReportStatus): Promise<Report[]>;
  getReportById(id: string): Promise<Report | undefined>;
  updateReportStatus(id: string, status: ReportStatus, adminId: string, notes?: string): Promise<Report | undefined>;

  // Verification Requests
  createVerificationRequest(data: CreateVerificationInput): Promise<VerificationRequest>;
  getVerificationRequest(id: string): Promise<VerificationRequestWithUser | undefined>;
  getUserVerificationRequests(userId: string): Promise<VerificationRequest[]>;
  getLatestUserVerificationRequest(userId: string): Promise<VerificationRequest | undefined>;
  getVerificationRequests(filters?: VerificationFilters): Promise<VerificationRequestWithUser[]>;
  updateVerificationRequest(id: string, data: Partial<VerificationRequest>): Promise<VerificationRequest | undefined>;
  approveVerification(requestId: string, adminId: string, notes?: string): Promise<VerificationRequest | undefined>;
  denyVerification(requestId: string, adminId: string, reason: string, notes?: string): Promise<VerificationRequest | undefined>;
  requestMoreInfo(requestId: string, adminId: string, notes: string): Promise<VerificationRequest | undefined>;
  
  // Studio Analytics
  recordProfileView(profileUserId: string, viewerId?: string, source?: TrafficSource): Promise<ProfileView>;
  recordWatchEvent(postId: string, userId: string | null, watchTimeMs: number, completed: boolean, source?: TrafficSource): Promise<WatchEvent>;
  getStudioOverview(userId: string, startDate: Date, endDate: Date): Promise<StudioOverview>;
  getStudioContent(userId: string, startDate: Date, endDate: Date, type?: PostType, sortBy?: string): Promise<StudioContentItem[]>;
  getStudioPostDetail(postId: string, startDate: Date, endDate: Date): Promise<StudioPostDetail | undefined>;
  getStudioAudience(userId: string, startDate: Date, endDate: Date): Promise<StudioAudience>;

  // Stories
  createStory(userId: string, data: CreateStoryInput): Promise<Story>;
  getStory(id: string): Promise<StoryWithUser | undefined>;
  getUserStories(userId: string): Promise<StoryWithUser[]>;
  getActiveUserStories(userId: string): Promise<StoryWithUser[]>;
  getFeedStories(userId: string): Promise<{ user: User; stories: Story[] }[]>;
  getAllStories(limit: number, offset: number, userId?: string): Promise<StoryWithUser[]>;
  deleteStory(id: string): Promise<void>;
  viewStory(storyId: string, viewerId: string): Promise<StoryView>;
  getStoryViewers(storyId: string): Promise<Array<User & { viewedAt: Date }>>;
  hasUserViewedStory(storyId: string, viewerId: string): Promise<boolean>;
  deleteExpiredStories(): Promise<number>;

  // Story Stickers
  createStorySticker(data: CreateStoryStickerInput): Promise<StorySticker>;
  getSticker(stickerId: string): Promise<StorySticker | undefined>;
  getStoryStickers(storyId: string): Promise<StorySticker[]>;
  updateStorySticker(stickerId: string, data: Partial<StorySticker>): Promise<StorySticker | undefined>;
  deleteStorySticker(stickerId: string): Promise<void>;
  respondToSticker(stickerId: string, userId: string, responseType: string, responseData: any): Promise<StoryStickerResponse>;
  getStickerResponses(stickerId: string): Promise<StoryStickerResponse[]>;
  getUserStickerResponse(stickerId: string, userId: string): Promise<StoryStickerResponse | undefined>;
  
  // Story Reactions
  addStoryReaction(storyId: string, userId: string, reactionType: StoryReactionType): Promise<StoryReaction>;
  removeStoryReaction(storyId: string, userId: string): Promise<void>;
  getStoryReactions(storyId: string): Promise<StoryReaction[]>;
  hasUserReactedToStory(storyId: string, userId: string): Promise<StoryReaction | undefined>;
  
  // Story Replies
  createStoryReply(storyId: string, userId: string, content?: string, mediaUrl?: string, mediaType?: string): Promise<StoryReply>;
  getStoryReplies(storyId: string): Promise<(StoryReply & { user: User })[]>;
  markStoryRepliesRead(storyId: string): Promise<void>;
  deleteStoryReply(replyId: string): Promise<void>;
  
  // Story Drafts
  createStoryDraft(userId: string, data: CreateStoryDraftInput): Promise<StoryDraft>;
  getStoryDraft(draftId: string): Promise<StoryDraft | undefined>;
  getUserStoryDrafts(userId: string): Promise<StoryDraft[]>;
  updateStoryDraft(draftId: string, data: Partial<StoryDraft>): Promise<StoryDraft | undefined>;
  deleteStoryDraft(draftId: string): Promise<void>;
  
  // Story Insights
  recordStoryInsight(storyId: string, viewerId: string, data: Partial<StoryInsight>): Promise<StoryInsight>;
  getStoryInsights(storyId: string): Promise<StoryInsight[]>;
  getStoryAnalytics(storyId: string): Promise<{ views: number; avgDuration: number; exits: number; shares: number; profileVisits: number }>;
  
  // Story Streaks
  getOrCreateStreak(userId: string): Promise<StoryStreak>;
  updateStreak(userId: string): Promise<StoryStreak>;
  claimStreakMilestone(userId: string, milestone: number): Promise<StoryStreak | undefined>;
  
  // Story Templates
  getStoryTemplates(category?: string): Promise<StoryTemplate[]>;
  getStoryTemplate(templateId: string): Promise<StoryTemplate | undefined>;
  createStoryTemplate(data: Partial<StoryTemplate>): Promise<StoryTemplate>;
  updateStoryTemplate(templateId: string, data: Partial<StoryTemplate>): Promise<StoryTemplate | undefined>;
  deleteStoryTemplate(templateId: string): Promise<void>;
  incrementTemplateUsage(templateId: string): Promise<void>;
  
  // Story Music Library
  getStoryMusic(genre?: string, limit?: number): Promise<StoryMusic[]>;
  getStoryMusicById(musicId: string): Promise<StoryMusic | undefined>;
  getFeaturedStoryMusic(): Promise<StoryMusic[]>;
  searchStoryMusic(query: string): Promise<StoryMusic[]>;
  createStoryMusic(data: Partial<StoryMusic>): Promise<StoryMusic>;
  addStoryMusic(data: Partial<StoryMusic>): Promise<StoryMusic>;
  updateStoryMusic(musicId: string, data: Partial<StoryMusic>): Promise<StoryMusic | undefined>;
  deleteStoryMusic(musicId: string): Promise<void>;
  incrementMusicUsage(musicId: string): Promise<void>;
  
  // Story Reports (admin)
  getStoryReports(status?: string): Promise<Report[]>;
  
  // Story Analytics (admin)
  getPlatformStoryStats(days: number): Promise<{
    totalStories: number;
    totalViews: number;
    avgViewDuration: number;
    topCreators: { userId: string; storyCount: number; totalViews: number }[];
    byType: { type: string; count: number }[];
    engagementRate: number;
  }>;
  
  // Story Tips
  createStoryTip(storyId: string, senderId: string, recipientId: string, amount: number, message?: string): Promise<StoryTip>;
  getStoryTips(storyId: string): Promise<(StoryTip & { sender: User })[]>;
  getUserReceivedTips(userId: string): Promise<(StoryTip & { sender: User; story: Story })[]>;
  getUserSentTips(userId: string): Promise<(StoryTip & { recipient: User; story: Story })[]>;
  
  // Story Countdown Subscriptions
  subscribeToCountdown(stickerId: string, userId: string): Promise<StoryCountdownSubscription>;
  unsubscribeFromCountdown(stickerId: string, userId: string): Promise<void>;
  getCountdownSubscribers(stickerId: string): Promise<User[]>;
  getPendingCountdownNotifications(): Promise<{ subscription: StoryCountdownSubscription; sticker: StorySticker }[]>;
  markCountdownNotified(subscriptionId: string): Promise<void>;

  // Mutual followers
  getMutualFollowers(userId: string, viewerId: string, limit?: number): Promise<User[]>;

  // Activity status
  updateLastActive(userId: string): Promise<void>;

  // ===== LOGIN SESSIONS =====
  createLoginSession(userId: string, data: { sessionToken: string; deviceName?: string; deviceType?: string; browser?: string; os?: string; ipAddress?: string; location?: string }): Promise<LoginSession>;
  getLoginSessions(userId: string): Promise<LoginSession[]>;
  getActiveLoginSessions(userId: string): Promise<LoginSession[]>;
  getLoginSessionByToken(token: string): Promise<LoginSession | undefined>;
  getLoginSession(sessionId: string): Promise<LoginSession | undefined>;
  updateLoginSession(sessionId: string, data: Partial<LoginSession>): Promise<LoginSession | undefined>;
  invalidateLoginSession(sessionId: string): Promise<void>;
  invalidateAllLoginSessions(userId: string, exceptSessionId?: string): Promise<void>;

  // ===== TRUSTED DEVICES =====
  addTrustedDevice(userId: string, data: { deviceId: string; deviceName: string; deviceType?: string; browser?: string; os?: string }): Promise<TrustedDevice>;
  getTrustedDevices(userId: string): Promise<TrustedDevice[]>;
  getTrustedDevice(deviceId: string): Promise<TrustedDevice | undefined>;
  removeTrustedDevice(deviceId: string): Promise<void>;
  isTrustedDevice(userId: string, deviceId: string): Promise<boolean>;

  // ===== RESTRICTED ACCOUNTS =====
  restrictAccount(userId: string, restrictedUserId: string, reason?: string): Promise<RestrictedAccount>;
  unrestrictAccount(userId: string, restrictedUserId: string): Promise<void>;
  isRestricted(userId: string, restrictedUserId: string): Promise<boolean>;
  getRestrictedAccounts(userId: string): Promise<User[]>;

  // ===== MUTED ACCOUNTS =====
  muteAccount(userId: string, mutedUserId: string, options?: { mutePosts?: boolean; muteStories?: boolean; muteMessages?: boolean }): Promise<MutedAccount>;
  unmuteAccount(userId: string, mutedUserId: string): Promise<void>;
  isMuted(userId: string, mutedUserId: string): Promise<boolean>;
  getMutedAccounts(userId: string): Promise<MutedAccount[]>;

  // ===== KEYWORD FILTERS =====
  addKeywordFilter(userId: string, keyword: string, options?: { filterComments?: boolean; filterMessages?: boolean; filterPosts?: boolean }): Promise<KeywordFilter>;
  getKeywordFilters(userId: string): Promise<KeywordFilter[]>;
  getKeywordFilter(filterId: string): Promise<KeywordFilter | undefined>;
  updateKeywordFilter(filterId: string, data: Partial<KeywordFilter>): Promise<KeywordFilter | undefined>;
  removeKeywordFilter(filterId: string): Promise<void>;

  // ===== DRAFTS =====
  createDraft(userId: string, data: Partial<Draft>): Promise<Draft>;
  getDraft(draftId: string): Promise<Draft | undefined>;
  getUserDrafts(userId: string): Promise<Draft[]>;
  updateDraft(draftId: string, data: Partial<Draft>): Promise<Draft | undefined>;
  deleteDraft(draftId: string): Promise<void>;

  // ===== SCHEDULED POSTS =====
  createScheduledPost(userId: string, data: Omit<ScheduledPost, 'id' | 'userId' | 'createdAt' | 'status' | 'publishedPostId' | 'errorMessage'>): Promise<ScheduledPost>;
  getScheduledPost(postId: string): Promise<ScheduledPost | undefined>;
  getUserScheduledPosts(userId: string): Promise<ScheduledPost[]>;
  updateScheduledPost(postId: string, data: Partial<ScheduledPost>): Promise<ScheduledPost | undefined>;
  deleteScheduledPost(postId: string): Promise<void>;
  getPendingScheduledPosts(before: Date): Promise<ScheduledPost[]>;

  // ===== CLOSE FRIENDS =====
  addCloseFriend(userId: string, friendId: string): Promise<CloseFriend>;
  removeCloseFriend(userId: string, friendId: string): Promise<void>;
  isCloseFriend(userId: string, friendId: string): Promise<boolean>;
  getCloseFriends(userId: string): Promise<User[]>;

  // ===== STORY VIEWER RESTRICTIONS =====
  addStoryViewerRestriction(userId: string, restrictedViewerId: string): Promise<StoryViewerRestriction>;
  removeStoryViewerRestriction(userId: string, restrictedViewerId: string): Promise<void>;
  isStoryViewerRestricted(userId: string, viewerId: string): Promise<boolean>;
  getStoryViewerRestrictions(userId: string): Promise<User[]>;

  // ===== ADMIN USER NOTES =====
  addAdminUserNote(userId: string, adminId: string, content: string): Promise<AdminUserNote>;
  getAdminUserNotes(userId: string): Promise<AdminUserNote[]>;
  updateAdminUserNote(noteId: string, data: Partial<AdminUserNote>): Promise<AdminUserNote | undefined>;
  deleteAdminUserNote(noteId: string): Promise<void>;

  // ===== DATA EXPORT REQUESTS =====
  createDataExportRequest(userId: string, options: { includeProfile?: boolean; includePosts?: boolean; includeMessages?: boolean; includeMedia?: boolean }): Promise<DataExportRequest>;
  getDataExportRequest(requestId: string): Promise<DataExportRequest | undefined>;
  getUserDataExportRequests(userId: string): Promise<DataExportRequest[]>;
  updateDataExportRequest(requestId: string, data: Partial<DataExportRequest>): Promise<DataExportRequest | undefined>;
  getPendingDataExportRequests(): Promise<DataExportRequest[]>;

  // ===== GOSSIP (Anonymous Posts) =====
  createGossipPost(authorId: string, type: GossipType, data: { text?: string; mediaUrl?: string; thumbnailUrl?: string; durationMs?: number }): Promise<GossipPost>;
  getGossipPosts(limit?: number, offset?: number): Promise<GossipPost[]>;
  getGossipPost(id: string): Promise<GossipPost | undefined>;
  deleteGossipPost(id: string): Promise<void>;
  likeGossipPost(userId: string, postId: string): Promise<GossipLike>;
  unlikeGossipPost(userId: string, postId: string): Promise<void>;
  hasUserLikedGossipPost(userId: string, postId: string): Promise<boolean>;
  createGossipComment(userId: string, postId: string, body: string): Promise<GossipComment>;
  getGossipComments(postId: string): Promise<Omit<GossipComment, 'userId'>[]>;
  retweetGossipPost(userId: string, postId: string): Promise<GossipRetweet>;
  unretweetGossipPost(userId: string, postId: string): Promise<void>;
  hasUserRetweetedGossipPost(userId: string, postId: string): Promise<boolean>;

  // ===== MALL =====
  getMallCategories(): Promise<MallCategory[]>;
  getMallCategory(id: string): Promise<MallCategory | undefined>;
  getMallItems(categoryId?: string): Promise<MallItem[]>;
  getAllMallItemsIncludingInactive(): Promise<MallItem[]>;
  getMallItem(id: string): Promise<MallItem | undefined>;
  purchaseMallItem(userId: string, itemId: string, quantity?: number): Promise<MallPurchase>;
  getUserPurchases(userId: string): Promise<(MallPurchase & { item: MallItem })[]>;
  getTop50WealthyUsers(): Promise<Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'netWorth' | 'isVerified'>[]>;
  getUserWealthRank(userId: string): Promise<number | null>;
  addNetWorthEntry(userId: string, delta: number, reason: NetWorthReason, refType?: string, refId?: string): Promise<NetWorthLedgerEntry>;
  getNetWorthHistory(userId: string, limit?: number): Promise<NetWorthLedgerEntry[]>;
  createMallCategory(data: { name: string; description?: string | null }): Promise<MallCategory>;
  updateMallCategory(id: string, data: { name?: string; description?: string | null; isActive?: boolean }): Promise<MallCategory | undefined>;
  deleteMallCategory(id: string): Promise<void>;
  createMallItem(data: { name: string; description: string; value: number; imageUrl?: string | null; categoryId: string }): Promise<MallItem>;
  updateMallItem(id: string, data: { name?: string; description?: string; value?: number; coinPrice?: number; imageUrl?: string | null; categoryId?: string; isActive?: boolean }): Promise<MallItem | undefined>;
  deleteMallItem(id: string): Promise<void>;
  fixAllMallItemPrices(): Promise<{ fixed: number; total: number }>;
  getAllMallPurchases(): Promise<(MallPurchase & { item: MallItem; buyer: User })[]>;

  // ===== MESSAGES INBOX =====
  getUserConversationsByFolder(userId: string, folder: InboxFolder): Promise<ConversationWithParticipants[]>;
  getMessageRequests(userId: string): Promise<ConversationWithParticipants[]>;
  acceptMessageRequest(conversationId: string, userId: string): Promise<Conversation>;
  declineMessageRequest(conversationId: string): Promise<void>;
  updateConversationFolder(conversationId: string, folder: InboxFolder): Promise<Conversation>;

  // ===== DISCOVER =====
  getNewPeopleToFollow(userId: string, limit?: number): Promise<User[]>;
  getReelsPosts(limit?: number, offset?: number): Promise<any[]>;
  getAlgorithmReelsPosts(userId: string, limit?: number, offset?: number): Promise<any[]>;
  getExplorePosts(userId: string, limit?: number, offset?: number): Promise<any[]>;
  getVoicePosts(userId: string, limit?: number, offset?: number): Promise<any[]>;
  getTrendingTopics(limit?: number): Promise<TrendDaily[]>;
  getTrendingPosts(limit?: number): Promise<any[]>;
  triggerDataExport(userId: string, adminId: string): Promise<DataExportRequest | undefined>;
  getSuggestedPeople(userId: string, limit?: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(ilike(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(ilike(users.email, email));
    return user || undefined;
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async searchUsers(query: string): Promise<User[]> {
    return db.select().from(users).where(
      or(
        ilike(users.username, `%${query}%`),
        ilike(users.displayName, `%${query}%`)
      )
    ).limit(20);
  }

  async deleteUser(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(messages).where(
        or(eq(messages.senderId, id), eq(messages.receiverId, id))
      );
      await tx.delete(conversations).where(
        or(eq(conversations.participant1Id, id), eq(conversations.participant2Id, id))
      );
      
      const userPosts = await tx.select({ id: posts.id }).from(posts).where(eq(posts.authorId, id));
      const userPostIds = userPosts.map(p => p.id);
      
      if (userPostIds.length > 0) {
        await tx.delete(likes).where(inArray(likes.postId, userPostIds));
        await tx.delete(comments).where(inArray(comments.postId, userPostIds));
      }
      
      await tx.delete(likes).where(eq(likes.userId, id));
      await tx.delete(comments).where(eq(comments.authorId, id));
      await tx.delete(follows).where(
        or(eq(follows.followerId, id), eq(follows.followingId, id))
      );
      await tx.delete(posts).where(eq(posts.authorId, id));
      await tx.delete(users).where(eq(users.id, id));
    });
  }

  async createPost(data: CreatePostInput): Promise<Post> {
    const [post] = await db.insert(posts).values({
      authorId: data.authorId,
      type: data.type || "TEXT",
      content: data.content,
      caption: data.caption,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl,
      durationMs: data.durationMs,
      aspectRatio: data.aspectRatio,
      visibility: data.visibility || "PUBLIC",
      commentsEnabled: data.commentsEnabled ?? true,
    }).returning();
    await db.update(users).set({ 
      influenceScore: sql`${users.influenceScore} + 10` 
    }).where(eq(users.id, data.authorId));
    return post;
  }

  async getPost(id: string): Promise<PostWithAuthor | undefined> {
    const result = await db.select().from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, id));
    if (result.length === 0) return undefined;
    return { ...result[0].posts, author: result[0].users };
  }

  async getPosts(limit = 50, offset = 0): Promise<PostWithAuthor[]> {
    const result = await db.select().from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
    return result.map(r => ({ ...r.posts, author: r.users }));
  }

  async getFeedPosts(userId: string, limit = 20, cursor?: string): Promise<{ posts: PostWithAuthor[], nextCursor: string | null }> {
    const followingIds = await db.select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    const ids = [userId, ...followingIds.map(f => f.id)];
    
    let query = db.select().from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(inArray(posts.authorId, ids))
      .orderBy(desc(posts.createdAt))
      .limit(limit + 1);
    
    if (cursor) {
      const cursorPost = await db.select().from(posts).where(eq(posts.id, cursor)).limit(1);
      if (cursorPost.length > 0) {
        query = db.select().from(posts)
          .innerJoin(users, eq(posts.authorId, users.id))
          .where(and(
            inArray(posts.authorId, ids),
            lt(posts.createdAt, cursorPost[0].createdAt)
          ))
          .orderBy(desc(posts.createdAt))
          .limit(limit + 1);
      }
    }
    
    const result = await query;
    const postsResult = result.map(r => ({ ...r.posts, author: r.users }));
    
    const hasMore = postsResult.length > limit;
    const paginatedPosts = hasMore ? postsResult.slice(0, limit) : postsResult;
    const nextCursor = hasMore ? paginatedPosts[paginatedPosts.length - 1].id : null;
    
    return { posts: paginatedPosts, nextCursor };
  }

  async getTrendingPreviewPosts(limit = 5): Promise<PostWithAuthor[]> {
    const result = await db.select().from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(
        eq(posts.isHidden, false),
        isNull(posts.deletedAt),
        or(
          eq(posts.visibility, "PUBLIC"),
          isNull(posts.visibility)
        )
      ))
      .orderBy(
        desc(posts.likesCount),
        desc(posts.commentsCount),
        desc(posts.createdAt)
      )
      .limit(limit);
    return result.map(r => ({ ...r.posts, author: r.users }));
  }

  async getUserPosts(userId: string): Promise<PostWithAuthor[]> {
    const result = await db.select().from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.authorId, userId))
      .orderBy(desc(posts.createdAt));
    return result.map(r => ({ ...r.posts, author: r.users }));
  }

  async deletePost(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(likes).where(eq(likes.postId, id));
      await tx.delete(comments).where(eq(comments.postId, id));
      await tx.delete(bookmarks).where(eq(bookmarks.postId, id));
      await tx.delete(shares).where(eq(shares.postId, id));
      await tx.delete(postViews).where(eq(postViews.postId, id));
      await tx.delete(playlistItems).where(eq(playlistItems.postId, id));
      await tx.delete(pins).where(eq(pins.postId, id));
      await tx.delete(postCollaborators).where(eq(postCollaborators.postId, id));
      await tx.delete(pendingTagApprovals).where(eq(pendingTagApprovals.postId, id));
      await tx.delete(savedPosts).where(eq(savedPosts.postId, id));
      await tx.delete(hiddenPosts).where(eq(hiddenPosts.postId, id));
      await tx.delete(notInterestedPosts).where(eq(notInterestedPosts.postId, id));
      await tx.delete(posts).where(eq(posts.id, id));
    });
  }

  async searchPosts(query: string): Promise<PostWithAuthor[]> {
    const result = await db.select().from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(ilike(posts.content, `%${query}%`))
      .orderBy(desc(posts.createdAt))
      .limit(20);
    return result.map(r => ({ ...r.posts, author: r.users }));
  }

  async createComment(postId: string, authorId: string, content: string): Promise<Comment> {
    return await db.transaction(async (tx) => {
      const [comment] = await tx.insert(comments).values({ postId, authorId, content }).returning();
      await tx.update(posts).set({ 
        commentsCount: sql`${posts.commentsCount} + 1` 
      }).where(eq(posts.id, postId));
      return comment;
    });
  }

  async getPostComments(postId: string): Promise<CommentWithAuthor[]> {
    const result = await db.select().from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));
    return result.map(r => ({ ...r.comments, author: r.users }));
  }

  async deleteComment(id: string): Promise<void> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    if (comment) {
      await db.transaction(async (tx) => {
        await tx.delete(comments).where(eq(comments.id, id));
        await tx.update(posts).set({ 
          commentsCount: sql`${posts.commentsCount} - 1` 
        }).where(eq(posts.id, comment.postId));
      });
    }
  }

  async likePost(postId: string, userId: string): Promise<Like> {
    const existing = await db.select().from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
    if (existing.length > 0) return existing[0];
    
    return await db.transaction(async (tx) => {
      const [like] = await tx.insert(likes).values({ postId, userId }).returning();
      await tx.update(posts).set({ 
        likesCount: sql`${posts.likesCount} + 1` 
      }).where(eq(posts.id, postId));
      
      const [post] = await tx.select().from(posts).where(eq(posts.id, postId));
      if (post) {
        await tx.update(users).set({ 
          influenceScore: sql`${users.influenceScore} + 1` 
        }).where(eq(users.id, post.authorId));
      }
      
      return like;
    });
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    const [existing] = await db.select().from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
    if (!existing) return;
    
    await db.transaction(async (tx) => {
      await tx.delete(likes).where(eq(likes.id, existing.id));
      await tx.update(posts).set({ 
        likesCount: sql`${posts.likesCount} - 1` 
      }).where(eq(posts.id, postId));
    });
  }

  async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    const result = await db.select().from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
    return result.length > 0;
  }

  // Bookmark methods
  async savePost(userId: string, postId: string): Promise<Bookmark> {
    const existing = await db.select().from(bookmarks)
      .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)));
    if (existing.length > 0) return existing[0];
    
    return await db.transaction(async (tx) => {
      const [bookmark] = await tx.insert(bookmarks).values({ postId, userId }).returning();
      await tx.update(posts).set({ 
        savesCount: sql`${posts.savesCount} + 1` 
      }).where(eq(posts.id, postId));
      return bookmark;
    });
  }

  async unsavePost(userId: string, postId: string): Promise<void> {
    const [existing] = await db.select().from(bookmarks)
      .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)));
    if (!existing) return;
    
    await db.transaction(async (tx) => {
      await tx.delete(bookmarks).where(eq(bookmarks.id, existing.id));
      await tx.update(posts).set({ 
        savesCount: sql`${posts.savesCount} - 1` 
      }).where(eq(posts.id, postId));
    });
  }

  async hasUserSavedPost(postId: string, userId: string): Promise<boolean> {
    const result = await db.select().from(bookmarks)
      .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, userId)));
    return result.length > 0;
  }

  async getUserBookmarks(userId: string): Promise<PostWithAuthor[]> {
    const result = await db.select().from(bookmarks)
      .innerJoin(posts, eq(bookmarks.postId, posts.id))
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));
    return result.map(r => ({ ...r.posts, author: r.users }));
  }

  // Share methods
  async sharePost(userId: string, postId: string, platform?: string): Promise<Share> {
    return await db.transaction(async (tx) => {
      const [share] = await tx.insert(shares).values({ postId, userId, platform }).returning();
      await tx.update(posts).set({ 
        sharesCount: sql`${posts.sharesCount} + 1` 
      }).where(eq(posts.id, postId));
      return share;
    });
  }

  // View methods
  async viewPost(userId: string, postId: string): Promise<{ isNew: boolean }> {
    const existing = await db.select().from(postViews)
      .where(and(eq(postViews.postId, postId), eq(postViews.userId, userId)));
    
    if (existing.length > 0) {
      return { isNew: false };
    }
    
    await db.transaction(async (tx) => {
      await tx.insert(postViews).values({ postId, userId }).onConflictDoNothing();
      await tx.update(posts).set({ 
        viewsCount: sql`${posts.viewsCount} + 1` 
      }).where(eq(posts.id, postId));
    });
    
    return { isNew: true };
  }

  async hasUserViewedPost(postId: string, userId: string): Promise<boolean> {
    const result = await db.select().from(postViews)
      .where(and(eq(postViews.postId, postId), eq(postViews.userId, userId)));
    return result.length > 0;
  }

  async followUser(followerId: string, followingId: string): Promise<Follow> {
    const existing = await db.select().from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    if (existing.length > 0) return existing[0];
    
    const [follow] = await db.insert(follows).values({ followerId, followingId }).returning();
    await db.update(users).set({ 
      influenceScore: sql`${users.influenceScore} + 5` 
    }).where(eq(users.id, followingId));
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db.delete(follows).where(
      and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
    );
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const result = await db.select().from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return result.length > 0;
  }

  async getFollowers(userId: string): Promise<User[]> {
    const result = await db.select().from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));
    return result.map(r => r.users);
  }

  async getFollowing(userId: string): Promise<User[]> {
    const result = await db.select().from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
    return result.map(r => r.users);
  }

  async getFollowersCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followingId, userId));
    return Number(result[0]?.count || 0);
  }

  async getFollowingCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followerId, userId));
    return Number(result[0]?.count || 0);
  }

  async getOrCreateConversation(userId1: string, userId2: string, senderId?: string): Promise<Conversation> {
    const [p1, p2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
    
    const existing = await db.select().from(conversations).where(
      and(eq(conversations.participant1Id, p1), eq(conversations.participant2Id, p2))
    );
    if (existing.length > 0) return existing[0];
    
    const recipientId = senderId === userId1 ? userId2 : userId1;
    const recipientFollowsSender = senderId ? await this.isFollowing(recipientId, senderId) : true;
    
    const conversationStatus = recipientFollowsSender ? "ACCEPTED" : "REQUEST";
    const requestedByUserId = recipientFollowsSender ? null : senderId;
    
    const [conversation] = await db.insert(conversations)
      .values({ 
        participant1Id: p1, 
        participant2Id: p2,
        status: conversationStatus,
        requestedByUserId,
        inboxFolder: "PRIMARY",
      })
      .returning();
    return conversation;
  }

  async getConversation(conversationId: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, conversationId));
    return conversation || undefined;
  }

  async isConversationParticipant(conversationId: string, userId: string): Promise<boolean> {
    const [conversation] = await db.select().from(conversations).where(
      and(
        eq(conversations.id, conversationId),
        or(
          eq(conversations.participant1Id, userId),
          eq(conversations.participant2Id, userId)
        )
      )
    );
    return !!conversation;
  }

  async getUserConversations(userId: string): Promise<ConversationWithParticipants[]> {
    const result = await db.select().from(conversations)
      .where(or(
        eq(conversations.participant1Id, userId),
        eq(conversations.participant2Id, userId)
      ))
      .orderBy(desc(conversations.lastMessageAt));
    
    const conversationsWithParticipants: ConversationWithParticipants[] = [];
    
    for (const conv of result) {
      const [p1] = await db.select().from(users).where(eq(users.id, conv.participant1Id));
      const [p2] = await db.select().from(users).where(eq(users.id, conv.participant2Id));
      const [lastMessage] = await db.select().from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      
      conversationsWithParticipants.push({
        ...conv,
        participant1: p1,
        participant2: p2,
        lastMessage
      });
    }
    
    return conversationsWithParticipants;
  }

  async createMessage(conversationId: string, senderId: string, receiverId: string, content: string): Promise<Message> {
    const [message] = await db.insert(messages)
      .values({ conversationId, senderId, receiverId, content })
      .returning();
    
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));
    
    return message;
  }

  async createMessageWithMedia(
    conversationId: string, 
    senderId: string, 
    receiverId: string, 
    content: string,
    messageType: string,
    mediaUrl: string | null,
    replyToId: string | null
  ): Promise<Message> {
    const [message] = await db.insert(messages)
      .values({ 
        conversationId, 
        senderId, 
        receiverId, 
        content,
        messageType: messageType as any,
        mediaUrl,
        replyToId 
      })
      .returning();
    
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, conversationId));
    
    return message;
  }

  async getMessage(messageId: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, messageId));
    return message || undefined;
  }

  async deleteMessage(messageId: string): Promise<void> {
    await db.update(messages)
      .set({ deletedAt: new Date() })
      .where(eq(messages.id, messageId));
  }

  async addMessageReaction(messageId: string, userId: string, emoji: string): Promise<any> {
    // Check if reaction already exists
    const existing = await db.select().from(messageReactions)
      .where(and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.reaction, emoji)
      ));
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    const [reactionRow] = await db.insert(messageReactions)
      .values({ messageId, userId, reaction: emoji })
      .returning();
    
    return reactionRow;
  }

  async removeMessageReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await db.delete(messageReactions)
      .where(and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.reaction, emoji)
      ));
  }

  async updateUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const existing = await db.select().from(userOnlineStatus).where(eq(userOnlineStatus.userId, userId));
    
    if (existing.length > 0) {
      await db.update(userOnlineStatus)
        .set({ 
          isOnline, 
          lastSeenAt: new Date()
        })
        .where(eq(userOnlineStatus.userId, userId));
    } else {
      await db.insert(userOnlineStatus)
        .values({ userId, isOnline, lastSeenAt: new Date() });
    }
  }

  async getUserOnlineStatus(userId: string): Promise<any> {
    const [status] = await db.select().from(userOnlineStatus).where(eq(userOnlineStatus.userId, userId));
    return status || { userId, isOnline: false, lastSeenAt: null };
  }

  async getConversationMessages(conversationId: string, limit = 100): Promise<MessageWithSender[]> {
    const result = await db.select().from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    return result.map(r => ({ ...r.messages, sender: r.users }));
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db.update(messages)
      .set({ read: true })
      .where(and(
        eq(messages.conversationId, conversationId),
        eq(messages.receiverId, userId),
        eq(messages.read, false)
      ));
  }

  async createNotification(userId: string, actorId: string, type: NotificationType, entityId?: string): Promise<Notification> {
    // Don't notify yourself
    if (userId === actorId) {
      return { id: '', userId, actorId, type, entityId: entityId || null, readAt: null, createdAt: new Date() };
    }
    const [notification] = await db.insert(notifications)
      .values({ userId, actorId, type, entityId })
      .returning();
    return notification;
  }

  async getUserNotifications(userId: string, limit = 50): Promise<NotificationWithActor[]> {
    const result = await db.select().from(notifications)
      .innerJoin(users, eq(notifications.actorId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    return result.map(r => ({ ...r.notifications, actor: r.users }));
  }

  async markNotificationRead(notificationId: string, userId: string): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();
    return notification || undefined;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(
        eq(notifications.userId, userId),
        isNull(notifications.readAt)
      ));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        isNull(notifications.readAt)
      ));
    return result[0]?.count || 0;
  }

  // Blocking methods
  async blockUser(blockerId: string, blockedId: string): Promise<Block> {
    const [block] = await db.insert(blocks)
      .values({ blockerId, blockedId })
      .onConflictDoNothing()
      .returning();
    if (!block) {
      const [existing] = await db.select().from(blocks)
        .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)));
      return existing;
    }
    // Also unfollow both directions when blocking
    await db.delete(follows).where(
      or(
        and(eq(follows.followerId, blockerId), eq(follows.followingId, blockedId)),
        and(eq(follows.followerId, blockedId), eq(follows.followingId, blockerId))
      )
    );
    return block;
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await db.delete(blocks).where(
      and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId))
    );
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const [block] = await db.select().from(blocks)
      .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)));
    return !!block;
  }

  async isBlockedEither(userId1: string, userId2: string): Promise<boolean> {
    const [block] = await db.select().from(blocks)
      .where(or(
        and(eq(blocks.blockerId, userId1), eq(blocks.blockedId, userId2)),
        and(eq(blocks.blockerId, userId2), eq(blocks.blockedId, userId1))
      ));
    return !!block;
  }

  async getBlockedUsers(userId: string): Promise<User[]> {
    const result = await db.select().from(blocks)
      .innerJoin(users, eq(blocks.blockedId, users.id))
      .where(eq(blocks.blockerId, userId));
    return result.map(r => r.users);
  }

  // Get all user IDs that should be hidden from a user (both blocking and blocked by)
  async getHiddenUserIds(userId: string): Promise<string[]> {
    const blocked = await db.select({ id: blocks.blockedId }).from(blocks)
      .where(eq(blocks.blockerId, userId));
    const blockedBy = await db.select({ id: blocks.blockerId }).from(blocks)
      .where(eq(blocks.blockedId, userId));
    const blockedIds = blocked.map(b => b.id);
    const blockedByIds = blockedBy.map(b => b.id);
    return [...new Set([...blockedIds, ...blockedByIds])];
  }

  // Reporting methods
  async createReport(reporterId: string, reason: string, reportedUserId?: string, reportedPostId?: string): Promise<Report> {
    const [report] = await db.insert(reports)
      .values({ reporterId, reason, reportedUserId, reportedPostId })
      .returning();
    return report;
  }

  async getReports(status?: ReportStatus): Promise<Report[]> {
    if (status) {
      return db.select().from(reports)
        .where(eq(reports.status, status))
        .orderBy(desc(reports.createdAt));
    }
    return db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async getReportsWithFilters(filters: {
    status?: ReportStatus;
    type?: "user" | "post";
    reporterId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<(Report & { reporter: User; reportedUser?: User; reportedPost?: Post })[]> {
    const conditions: SQL[] = [];

    if (filters.status) {
      conditions.push(eq(reports.status, filters.status));
    }
    if (filters.type === "user") {
      conditions.push(isNotNull(reports.reportedUserId));
    } else if (filters.type === "post") {
      conditions.push(isNotNull(reports.reportedPostId));
    }
    if (filters.reporterId) {
      conditions.push(eq(reports.reporterId, filters.reporterId));
    }
    if (filters.dateFrom) {
      conditions.push(gte(reports.createdAt, filters.dateFrom));
    }
    if (filters.dateTo) {
      conditions.push(lte(reports.createdAt, filters.dateTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db.select()
      .from(reports)
      .innerJoin(users, eq(reports.reporterId, users.id))
      .leftJoin(posts, eq(reports.reportedPostId, posts.id))
      .where(whereClause)
      .orderBy(desc(reports.createdAt))
      .limit(100);

    const reportsWithDetails = await Promise.all(
      result.map(async (r) => {
        let reportedUser;
        if (r.reports.reportedUserId) {
          reportedUser = await this.getUser(r.reports.reportedUserId);
        }
        return {
          ...r.reports,
          reporter: r.users,
          reportedUser,
          reportedPost: r.posts || undefined,
        };
      })
    );

    return reportsWithDetails;
  }

  async getReportById(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async getReportWithDetails(id: string): Promise<(Report & { reporter: User; reportedUser?: User; reportedPost?: PostWithAuthor }) | undefined> {
    const [result] = await db.select()
      .from(reports)
      .innerJoin(users, eq(reports.reporterId, users.id))
      .where(eq(reports.id, id));

    if (!result) return undefined;

    let reportedUser;
    let reportedPost;

    if (result.reports.reportedUserId) {
      reportedUser = await this.getUser(result.reports.reportedUserId);
    }
    if (result.reports.reportedPostId) {
      const postResult = await db.select()
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(eq(posts.id, result.reports.reportedPostId));
      if (postResult.length > 0) {
        reportedPost = { ...postResult[0].posts, author: postResult[0].users };
      }
    }

    return {
      ...result.reports,
      reporter: result.users,
      reportedUser,
      reportedPost,
    };
  }

  async updateReportStatus(id: string, status: ReportStatus, adminId: string, notes?: string): Promise<Report | undefined> {
    const [report] = await db.update(reports)
      .set({ 
        status, 
        resolvedById: adminId, 
        resolvedAt: new Date(),
        adminNotes: notes 
      })
      .where(eq(reports.id, id))
      .returning();
    return report || undefined;
  }

  // Admin methods
  async getAdminStats(): Promise<{ users: number; posts: number; comments: number; reports: number }> {
    const [usersCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    const [postsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(posts);
    const [commentsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(comments);
    const [reportsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(reports).where(eq(reports.status, "PENDING"));
    
    return {
      users: usersCount?.count || 0,
      posts: postsCount?.count || 0,
      comments: commentsCount?.count || 0,
      reports: reportsCount?.count || 0,
    };
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllPostsWithAuthors(): Promise<PostWithAuthor[]> {
    const result = await db.select().from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(100);
    
    return result.map(r => ({ ...r.posts, author: r.users }));
  }

  async getAllCommentsWithAuthors(): Promise<CommentWithAuthor[]> {
    const result = await db.select().from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .orderBy(desc(comments.createdAt))
      .limit(100);
    
    return result.map(r => ({ ...r.comments, author: r.users }));
  }

  async getAllRoles(): Promise<Role[]> {
    return db.select().from(roles).orderBy(desc(roles.level));
  }

  async getRoleById(id: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role || undefined;
  }

  async createRole(data: { name: string; displayName: string; description?: string; level?: number }): Promise<Role> {
    const [role] = await db.insert(roles)
      .values({
        name: data.name.toUpperCase().replace(/\s+/g, "_"),
        displayName: data.displayName,
        description: data.description,
        level: data.level || 0,
        isSystem: false,
      })
      .returning();
    return role;
  }

  async updateRole(id: string, data: { displayName?: string; description?: string; level?: number }): Promise<Role | undefined> {
    const [role] = await db.update(roles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, id))
      .returning();
    return role || undefined;
  }

  async deleteRole(id: string): Promise<void> {
    await db.delete(roles).where(eq(roles.id, id));
  }

  async getSuperAdminCount(): Promise<number> {
    const superAdminRole = await this.getRoleByName("SUPER_ADMIN");
    if (!superAdminRole) return 0;
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(userRoles)
      .where(eq(userRoles.roleId, superAdminRole.id));
    return result[0]?.count || 0;
  }

  async getAllPermissions(): Promise<Permission[]> {
    return db.select().from(permissions).orderBy(permissions.group, permissions.key);
  }

  async getPermissionsByGroup(): Promise<Record<string, Permission[]>> {
    const allPermissions = await this.getAllPermissions();
    const grouped: Record<string, Permission[]> = {};
    for (const perm of allPermissions) {
      if (!grouped[perm.group]) {
        grouped[perm.group] = [];
      }
      grouped[perm.group].push(perm);
    }
    return grouped;
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const result = await db.select()
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
    return result.map(r => r.permissions);
  }

  async getRoleWithPermissions(roleId: string): Promise<RoleWithPermissions | undefined> {
    const role = await this.getRoleById(roleId);
    if (!role) return undefined;
    const perms = await this.getRolePermissions(roleId);
    return { ...role, permissions: perms };
  }

  async getAllRolesWithPermissions(): Promise<RoleWithPermissions[]> {
    const allRoles = await this.getAllRoles();
    const result = await Promise.all(
      allRoles.map(async (role) => {
        const perms = await this.getRolePermissions(role.id);
        return { ...role, permissions: perms };
      })
    );
    return result;
  }

  async setRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    if (permissionIds.length > 0) {
      await db.insert(rolePermissions)
        .values(permissionIds.map(permissionId => ({ roleId, permissionId })))
        .onConflictDoNothing();
    }
  }

  async addRolePermission(roleId: string, permissionId: string): Promise<void> {
    await db.insert(rolePermissions)
      .values({ roleId, permissionId })
      .onConflictDoNothing();
  }

  async removeRolePermission(roleId: string, permissionId: string): Promise<void> {
    await db.delete(rolePermissions)
      .where(and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId)
      ));
  }

  async getAppSettings(): Promise<AppSetting[]> {
    return db.select().from(appSettings).orderBy(appSettings.key);
  }

  async getAppSetting(key: string): Promise<AppSetting | undefined> {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return setting || undefined;
  }

  async getAppSettingValue<T = string>(key: string, defaultValue: T): Promise<T> {
    const setting = await this.getAppSetting(key);
    if (!setting || setting.value === null) return defaultValue;
    
    try {
      if (setting.type === "boolean") {
        return (setting.value === "true") as T;
      } else if (setting.type === "number") {
        return Number(setting.value) as T;
      } else if (setting.type === "json") {
        return JSON.parse(setting.value) as T;
      }
      return setting.value as T;
    } catch {
      return defaultValue;
    }
  }

  async setAppSetting(key: string, value: string | number | boolean | object, type: string, description?: string, updatedBy?: string): Promise<AppSetting> {
    const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
    
    const existing = await this.getAppSetting(key);
    if (existing) {
      const [updated] = await db.update(appSettings)
        .set({
          value: stringValue,
          type,
          description: description || existing.description,
          updatedBy,
          updatedAt: new Date(),
        })
        .where(eq(appSettings.key, key))
        .returning();
      return updated;
    }
    
    const [created] = await db.insert(appSettings)
      .values({
        key,
        value: stringValue,
        type,
        description,
        updatedBy,
      })
      .returning();
    return created;
  }

  async updateAppSettings(settings: Array<{ key: string; value: string | number | boolean | object; type: string }>, updatedBy: string): Promise<AppSetting[]> {
    const results: AppSetting[] = [];
    for (const setting of settings) {
      const result = await this.setAppSetting(setting.key, setting.value, setting.type, undefined, updatedBy);
      results.push(result);
    }
    return results;
  }

  async getAuditLogs(filters?: {
    actorId?: string;
    action?: string;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: (AuditLog & { actor?: User })[], total: number }> {
    const conditions: SQL[] = [];
    
    if (filters?.actorId) {
      conditions.push(eq(auditLogs.userId, filters.actorId));
    }
    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action as any));
    }
    if (filters?.targetType) {
      conditions.push(eq(auditLogs.targetType, filters.targetType));
    }
    if (filters?.startDate) {
      conditions.push(gte(auditLogs.createdAt, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(auditLogs.createdAt, filters.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(whereClause);
    
    const logs = await db.select()
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      logs: logs.map(l => ({
        ...l.audit_logs,
        actor: l.users ? { ...l.users, password: "" } as User : undefined,
      })),
      total: countResult?.count || 0,
    };
  }

  async getAnalyticsOverview(): Promise<{
    totalUsers: number;
    newUsers7d: number;
    posts7d: number;
    openReports: number;
    messages7d: number;
    totalPosts: number;
    totalMessages: number;
  }> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalUsersResult] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    const [newUsers7dResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(gte(users.createdAt, sevenDaysAgo));
    const [posts7dResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(gte(posts.createdAt, sevenDaysAgo));
    const [openReportsResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(reports)
      .where(eq(reports.status, "PENDING"));
    const [messages7dResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(gte(messages.createdAt, sevenDaysAgo));
    const [totalPostsResult] = await db.select({ count: sql<number>`count(*)::int` }).from(posts);
    const [totalMessagesResult] = await db.select({ count: sql<number>`count(*)::int` }).from(messages);

    return {
      totalUsers: totalUsersResult?.count || 0,
      newUsers7d: newUsers7dResult?.count || 0,
      posts7d: posts7dResult?.count || 0,
      openReports: openReportsResult?.count || 0,
      messages7d: messages7dResult?.count || 0,
      totalPosts: totalPostsResult?.count || 0,
      totalMessages: totalMessagesResult?.count || 0,
    };
  }

  // Admin user management
  async getAdminUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async adminUpdateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async suspendUser(
    userId: string, 
    adminId: string, 
    reason: string, 
    durationDays?: number
  ): Promise<User | undefined> {
    const now = new Date();
    const until = durationDays ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000) : null;
    
    const [user] = await db.update(users)
      .set({
        suspendedAt: now,
        suspendedUntil: until,
        suspendedReason: reason,
        suspendedById: adminId,
      })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async unsuspendUser(userId: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({
        suspendedAt: null,
        suspendedUntil: null,
        suspendedReason: null,
        suspendedById: null,
      })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const result = await db.select()
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
    return result.map(r => r.roles);
  }

  async assignRole(userId: string, roleId: string, assignedBy: string): Promise<void> {
    await db.insert(userRoles)
      .values({ userId, roleId, assignedBy })
      .onConflictDoNothing();
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await db.delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
  }

  // Audit logging
  async createAuditLog(
    userIdOrOptions: string | null | {
      actorId: string | null;
      action: string;
      targetType?: string;
      targetId?: string;
      details?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
    },
    action?: AuditAction,
    targetType?: string,
    targetId?: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    let userId: string | null;
    let actionValue: AuditAction;
    let targetTypeValue: string | undefined;
    let targetIdValue: string | undefined;
    let detailsValue: Record<string, unknown> | undefined;
    let ipAddressValue: string | undefined;
    let userAgentValue: string | undefined;

    if (typeof userIdOrOptions === "object" && userIdOrOptions !== null && "actorId" in userIdOrOptions) {
      userId = userIdOrOptions.actorId;
      actionValue = userIdOrOptions.action as AuditAction;
      targetTypeValue = userIdOrOptions.targetType;
      targetIdValue = userIdOrOptions.targetId;
      detailsValue = userIdOrOptions.details;
      ipAddressValue = userIdOrOptions.ipAddress;
      userAgentValue = userIdOrOptions.userAgent;
    } else {
      userId = userIdOrOptions as string | null;
      actionValue = action!;
      targetTypeValue = targetType;
      targetIdValue = targetId;
      detailsValue = details;
      ipAddressValue = ipAddress;
      userAgentValue = userAgent;
    }

    const [log] = await db.insert(auditLogs)
      .values({
        userId,
        action: actionValue,
        targetType: targetTypeValue,
        targetId: targetIdValue,
        details: detailsValue ? JSON.stringify(detailsValue) : null,
        ipAddress: ipAddressValue,
        userAgent: userAgentValue,
      })
      .returning();
    return log;
  }

  // Admin content management - Posts
  async getAdminPost(id: string): Promise<PostWithAuthor | undefined> {
    const result = await db.select().from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, id));
    if (result.length === 0) return undefined;
    return { ...result[0].posts, author: result[0].users };
  }

  async hidePost(postId: string, adminId: string, reason: string): Promise<Post | undefined> {
    const [post] = await db.update(posts)
      .set({
        isHidden: true,
        hiddenReason: reason,
        hiddenAt: new Date(),
        hiddenById: adminId,
      })
      .where(eq(posts.id, postId))
      .returning();
    return post || undefined;
  }

  async unhidePost(postId: string): Promise<Post | undefined> {
    const [post] = await db.update(posts)
      .set({
        isHidden: false,
        hiddenReason: null,
        hiddenAt: null,
        hiddenById: null,
      })
      .where(eq(posts.id, postId))
      .returning();
    return post || undefined;
  }

  async featurePost(postId: string, featured: boolean): Promise<Post | undefined> {
    const [post] = await db.update(posts)
      .set({ isFeatured: featured })
      .where(eq(posts.id, postId))
      .returning();
    return post || undefined;
  }

  async hardDeletePost(postId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(likes).where(eq(likes.postId, postId));
      await tx.delete(comments).where(eq(comments.postId, postId));
      await tx.delete(bookmarks).where(eq(bookmarks.postId, postId));
      await tx.delete(shares).where(eq(shares.postId, postId));
      await tx.delete(postViews).where(eq(postViews.postId, postId));
      await tx.delete(playlistItems).where(eq(playlistItems.postId, postId));
      await tx.delete(pins).where(eq(pins.postId, postId));
      await tx.delete(postCollaborators).where(eq(postCollaborators.postId, postId));
      await tx.delete(pendingTagApprovals).where(eq(pendingTagApprovals.postId, postId));
      await tx.delete(savedPosts).where(eq(savedPosts.postId, postId));
      await tx.delete(hiddenPosts).where(eq(hiddenPosts.postId, postId));
      await tx.delete(notInterestedPosts).where(eq(notInterestedPosts.postId, postId));
      await tx.delete(posts).where(eq(posts.id, postId));
    });
  }

  async softDeletePost(postId: string, adminId: string, reason?: string): Promise<Post | undefined> {
    const [post] = await db.update(posts)
      .set({
        deletedAt: new Date(),
        deletedById: adminId,
        deleteReason: reason || null,
      })
      .where(eq(posts.id, postId))
      .returning();
    return post || undefined;
  }

  async getAdminPosts(
    filters: {
      type?: string;
      visibility?: string;
      isHidden?: boolean;
      isDeleted?: boolean;
    },
    limit = 100,
    offset = 0
  ): Promise<PostWithAuthor[]> {
    const conditions: ReturnType<typeof eq>[] = [];
    
    if (filters.type) {
      conditions.push(eq(posts.type, filters.type as any));
    }
    if (filters.visibility) {
      conditions.push(eq(posts.visibility, filters.visibility as any));
    }
    if (filters.isHidden !== undefined) {
      conditions.push(eq(posts.isHidden, filters.isHidden));
    }
    if (filters.isDeleted === true) {
      conditions.push(isNotNull(posts.deletedAt));
    } else if (filters.isDeleted === false) {
      conditions.push(isNull(posts.deletedAt));
    }

    const result = await db.select().from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
    
    return result.map(r => ({ ...r.posts, author: r.users }));
  }

  // Admin content management - Comments
  async getAdminComment(id: string): Promise<CommentWithAuthor | undefined> {
    const result = await db.select().from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.id, id));
    if (result.length === 0) return undefined;
    return { ...result[0].comments, author: result[0].users };
  }

  async hideComment(commentId: string, adminId: string, reason: string): Promise<Comment | undefined> {
    const [comment] = await db.update(comments)
      .set({
        isHidden: true,
        hiddenReason: reason,
        hiddenAt: new Date(),
        hiddenById: adminId,
      })
      .where(eq(comments.id, commentId))
      .returning();
    return comment || undefined;
  }

  async unhideComment(commentId: string): Promise<Comment | undefined> {
    const [comment] = await db.update(comments)
      .set({
        isHidden: false,
        hiddenReason: null,
        hiddenAt: null,
        hiddenById: null,
      })
      .where(eq(comments.id, commentId))
      .returning();
    return comment || undefined;
  }

  async hardDeleteComment(commentId: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, commentId));
  }

  // User Settings methods for policy engine
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async getOrCreateUserSettings(userId: string): Promise<UserSettings> {
    let settings = await this.getUserSettings(userId);
    if (!settings) {
      const [created] = await db.insert(userSettings)
        .values({ userId })
        .returning();
      settings = created;
    }
    return settings;
  }

  async updateUserSettings(userId: string, data: Partial<UserSettings>): Promise<UserSettings | undefined> {
    const existing = await this.getUserSettings(userId);
    if (!existing) {
      const [created] = await db.insert(userSettings)
        .values({ userId, ...data, updatedAt: new Date() })
        .returning();
      return created;
    }
    const [updated] = await db.update(userSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId))
      .returning();
    return updated || undefined;
  }

  // ===== PINS (max 3 per user) =====

  async getUserPins(userId: string): Promise<(Pin & { post: PostWithAuthor })[]> {
    const result = await db.select()
      .from(pins)
      .innerJoin(posts, eq(pins.postId, posts.id))
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(pins.userId, userId))
      .orderBy(pins.order);
    return result.map(r => ({
      ...r.pins,
      post: { ...r.posts, author: r.users }
    }));
  }

  async setUserPins(userId: string, postIds: string[]): Promise<Pin[]> {
    const limitedPostIds = postIds.slice(0, 3);
    
    return db.transaction(async (tx) => {
      await tx.delete(pins).where(eq(pins.userId, userId));
      
      if (limitedPostIds.length === 0) return [];
      
      const pinValues = limitedPostIds.map((postId, index) => ({
        userId,
        postId,
        order: index,
      }));
      
      const created = await tx.insert(pins).values(pinValues).returning();
      return created;
    });
  }

  // ===== PLAYLISTS =====

  async getUserPlaylists(userId: string): Promise<Playlist[]> {
    return db.select()
      .from(playlists)
      .where(eq(playlists.userId, userId))
      .orderBy(desc(playlists.updatedAt));
  }

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist || undefined;
  }

  async getPlaylistWithItems(id: string): Promise<(Playlist & { items: (PlaylistItem & { post: PostWithAuthor })[] }) | undefined> {
    const playlist = await this.getPlaylist(id);
    if (!playlist) return undefined;

    const itemsResult = await db.select()
      .from(playlistItems)
      .innerJoin(posts, eq(playlistItems.postId, posts.id))
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(playlistItems.playlistId, id))
      .orderBy(playlistItems.order);

    const items = itemsResult.map(r => ({
      ...r.playlist_items,
      post: { ...r.posts, author: r.users }
    }));

    return { ...playlist, items };
  }

  async getPlaylistItemCount(playlistId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, playlistId));
    return result[0]?.count || 0;
  }

  async createPlaylist(userId: string, title: string, type: PlaylistType, description?: string): Promise<Playlist> {
    const [playlist] = await db.insert(playlists)
      .values({ userId, title, type, description, isPublic: true })
      .returning();
    return playlist;
  }

  async updatePlaylist(id: string, data: { title?: string; description?: string; isPublic?: boolean }): Promise<Playlist | undefined> {
    const [updated] = await db.update(playlists)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(playlists.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePlaylist(id: string): Promise<void> {
    await db.delete(playlists).where(eq(playlists.id, id));
  }

  async getPlaylistById(id: string): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist || undefined;
  }

  async getAdminPlaylists(
    type?: string,
    userId?: string,
    limit = 100,
    offset = 0
  ): Promise<(Playlist & { user: User })[]> {
    const conditions: ReturnType<typeof eq>[] = [];
    if (type) {
      conditions.push(eq(playlists.type, type as any));
    }
    if (userId) {
      conditions.push(eq(playlists.userId, userId));
    }

    const result = await db.select().from(playlists)
      .innerJoin(users, eq(playlists.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(playlists.createdAt))
      .limit(limit)
      .offset(offset);
    
    return result.map(r => ({ ...r.playlists, user: r.users }));
  }

  async addPlaylistItem(playlistId: string, postId: string): Promise<PlaylistItem> {
    const maxOrderResult = await db.select({ maxOrder: sql<number>`COALESCE(MAX(${playlistItems.order}), -1)::int` })
      .from(playlistItems)
      .where(eq(playlistItems.playlistId, playlistId));
    const nextOrder = (maxOrderResult[0]?.maxOrder ?? -1) + 1;
    
    const [item] = await db.insert(playlistItems)
      .values({ playlistId, postId, order: nextOrder })
      .onConflictDoNothing()
      .returning();
    return item;
  }

  async removePlaylistItem(playlistId: string, postId: string): Promise<void> {
    await db.delete(playlistItems)
      .where(and(eq(playlistItems.playlistId, playlistId), eq(playlistItems.postId, postId)));
  }

  async reorderPlaylistItems(playlistId: string, postIds: string[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (let i = 0; i < postIds.length; i++) {
        await tx.update(playlistItems)
          .set({ order: i })
          .where(and(eq(playlistItems.playlistId, playlistId), eq(playlistItems.postId, postIds[i])));
      }
    });
  }

  // ===== FEATURED INTRO =====

  async getUserFeaturedIntro(userId: string): Promise<FeaturedIntro | undefined> {
    const [intro] = await db.select().from(featuredIntros).where(eq(featuredIntros.userId, userId));
    return intro || undefined;
  }

  async updateFeaturedIntro(
    userId: string, 
    data: { title: string; body: string; ctaText?: string; ctaUrl?: string }
  ): Promise<FeaturedIntro> {
    const existing = await this.getUserFeaturedIntro(userId);
    
    if (existing) {
      const [updated] = await db.update(featuredIntros)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(featuredIntros.userId, userId))
        .returning();
      return updated;
    }
    
    const [created] = await db.insert(featuredIntros)
      .values({ userId, ...data })
      .returning();
    return created;
  }

  async deleteFeaturedIntro(id: string): Promise<void> {
    await db.delete(featuredIntros).where(eq(featuredIntros.id, id));
  }

  async getFeaturedIntro(id: string): Promise<FeaturedIntro | undefined> {
    const [intro] = await db.select().from(featuredIntros).where(eq(featuredIntros.id, id));
    return intro || undefined;
  }

  async getAllFeaturedIntros(): Promise<(FeaturedIntro & { user: User })[]> {
    const result = await db.select().from(featuredIntros)
      .innerJoin(users, eq(featuredIntros.userId, users.id))
      .orderBy(desc(featuredIntros.updatedAt));
    
    return result.map(r => ({ ...r.featured_intros, user: r.users }));
  }

  // ===== PROFILE DATA =====

  async getUserPostsCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(posts)
      .where(and(eq(posts.authorId, userId), eq(posts.isHidden, false)));
    return result[0]?.count || 0;
  }

  async getUserTotalLikes(userId: string): Promise<number> {
    const result = await db.select({ total: sql<number>`COALESCE(SUM(${posts.likesCount}), 0)::int` })
      .from(posts)
      .where(and(eq(posts.authorId, userId), eq(posts.isHidden, false)));
    return result[0]?.total || 0;
  }

  async getUserTotalViews(userId: string): Promise<number> {
    const result = await db.select({ total: sql<number>`COALESCE(SUM(${posts.viewsCount}), 0)::int` })
      .from(posts)
      .where(and(eq(posts.authorId, userId), eq(posts.isHidden, false)));
    return result[0]?.total || 0;
  }

  async getUserPostsByType(
    userId: string, 
    type?: PostType | null,
    limit = 24,
    cursor?: string
  ): Promise<{ posts: PostWithAuthor[]; nextCursor: string | null }> {
    let conditions: SQL[] = [eq(posts.authorId, userId), eq(posts.isHidden, false)];
    
    if (type) {
      conditions.push(eq(posts.type, type));
    }
    
    if (cursor) {
      conditions.push(lt(posts.createdAt, new Date(cursor)));
    }
    
    const result = await db.select()
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt))
      .limit(limit + 1);
    
    const hasMore = result.length > limit;
    const items = result.slice(0, limit).map(r => ({ ...r.posts, author: r.users }));
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;
    
    return { posts: items, nextCursor };
  }

  async getUserPinnedPosts(userId: string): Promise<PostWithAuthor[]> {
    const result = await db.select()
      .from(pins)
      .innerJoin(posts, eq(pins.postId, posts.id))
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(eq(pins.userId, userId), eq(posts.isHidden, false)))
      .orderBy(pins.order);
    return result.map(r => ({ ...r.posts, author: r.users }));
  }

  async getUserPlaylistsSummary(userId: string): Promise<{ id: string; title: string; type: PlaylistType; itemCount: number; isPublic: boolean }[]> {
    const userPlaylists = await this.getUserPlaylists(userId);
    const summaries = await Promise.all(
      userPlaylists.map(async (p) => ({
        id: p.id,
        title: p.title,
        type: p.type as PlaylistType,
        itemCount: await this.getPlaylistItemCount(p.id),
        isPublic: p.isPublic,
      }))
    );
    return summaries;
  }

  // ===== VERIFICATION REQUESTS =====

  async createVerificationRequest(data: CreateVerificationInput): Promise<VerificationRequest> {
    const [request] = await db.insert(verificationRequests).values({
      userId: data.userId,
      fullName: data.fullName,
      category: data.category,
      documentUrls: data.documentUrls,
      links: data.links,
      reason: data.reason,
      status: "SUBMITTED",
    }).returning();
    return request;
  }

  async getVerificationRequest(id: string): Promise<VerificationRequestWithUser | undefined> {
    const result = await db.select()
      .from(verificationRequests)
      .innerJoin(users, eq(verificationRequests.userId, users.id))
      .where(eq(verificationRequests.id, id));
    
    if (result.length === 0) return undefined;
    
    const { verification_requests: request, users: user } = result[0];
    let reviewedBy: User | undefined;
    
    if (request.reviewedById) {
      reviewedBy = await this.getUser(request.reviewedById);
    }
    
    return { ...request, user, reviewedBy };
  }

  async getUserVerificationRequests(userId: string): Promise<VerificationRequest[]> {
    return db.select()
      .from(verificationRequests)
      .where(eq(verificationRequests.userId, userId))
      .orderBy(desc(verificationRequests.submittedAt));
  }

  async getLatestUserVerificationRequest(userId: string): Promise<VerificationRequest | undefined> {
    const [request] = await db.select()
      .from(verificationRequests)
      .where(eq(verificationRequests.userId, userId))
      .orderBy(desc(verificationRequests.submittedAt))
      .limit(1);
    return request || undefined;
  }

  async getVerificationRequests(filters?: VerificationFilters): Promise<VerificationRequestWithUser[]> {
    const conditions: SQL[] = [];
    
    if (filters?.status) {
      conditions.push(eq(verificationRequests.status, filters.status));
    }
    if (filters?.category) {
      conditions.push(eq(verificationRequests.category, filters.category));
    }
    
    let query = db.select()
      .from(verificationRequests)
      .innerJoin(users, eq(verificationRequests.userId, users.id))
      .orderBy(desc(verificationRequests.submittedAt));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }
    
    const results = await query;
    
    return Promise.all(results.map(async (r) => {
      let reviewedBy: User | undefined;
      if (r.verification_requests.reviewedById) {
        reviewedBy = await this.getUser(r.verification_requests.reviewedById);
      }
      return { ...r.verification_requests, user: r.users, reviewedBy };
    }));
  }

  async updateVerificationRequest(id: string, data: Partial<VerificationRequest>): Promise<VerificationRequest | undefined> {
    const [request] = await db.update(verificationRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(verificationRequests.id, id))
      .returning();
    return request || undefined;
  }

  async approveVerification(requestId: string, adminId: string, notes?: string): Promise<VerificationRequest | undefined> {
    const request = await this.updateVerificationRequest(requestId, {
      status: "APPROVED",
      reviewedById: adminId,
      reviewedAt: new Date(),
      adminNotes: notes,
    });
    
    if (request) {
      await this.updateUser(request.userId, {
        isVerified: true,
        verifiedAt: new Date(),
      });
    }
    
    return request;
  }

  async denyVerification(requestId: string, adminId: string, reason: string, notes?: string): Promise<VerificationRequest | undefined> {
    return this.updateVerificationRequest(requestId, {
      status: "DENIED",
      denialReason: reason,
      reviewedById: adminId,
      reviewedAt: new Date(),
      adminNotes: notes,
    });
  }

  async requestMoreInfo(requestId: string, adminId: string, notes: string): Promise<VerificationRequest | undefined> {
    return this.updateVerificationRequest(requestId, {
      status: "MORE_INFO_NEEDED",
      reviewedById: adminId,
      reviewedAt: new Date(),
      adminNotes: notes,
    });
  }

  // ===== Studio Analytics =====

  async recordProfileView(profileUserId: string, viewerId?: string, source: TrafficSource = "DIRECT"): Promise<ProfileView> {
    const [view] = await db.insert(profileViews).values({
      profileUserId,
      viewerId: viewerId || null,
      source,
    }).returning();
    return view;
  }

  async recordWatchEvent(postId: string, userId: string | null, watchTimeMs: number, completed: boolean, source: TrafficSource = "FEED"): Promise<WatchEvent> {
    const [event] = await db.insert(watchEvents).values({
      postId,
      userId,
      watchTimeMs,
      completed,
      source,
    }).returning();
    return event;
  }

  async getStudioOverview(userId: string, startDate: Date, endDate: Date): Promise<StudioOverview> {
    // Get profile views in range
    const profileViewsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profileViews)
      .where(and(
        eq(profileViews.profileUserId, userId),
        gte(profileViews.viewedAt, startDate),
        lte(profileViews.viewedAt, endDate)
      ));

    // Get user's posts
    const userPosts = await db.select({ id: posts.id }).from(posts).where(eq(posts.authorId, userId));
    const postIds = userPosts.map(p => p.id);

    let postViewsCount = 0;
    let likesCount = 0;
    let commentsCount = 0;
    let sharesCount = 0;
    let savesCount = 0;
    let totalWatchTimeMs = 0;
    let watchEventCount = 0;
    let completionsCount = 0;
    let trafficFromFeed = 0;
    let trafficFromProfile = 0;
    let trafficFromSearch = 0;
    let trafficFromShare = 0;

    if (postIds.length > 0) {
      // Get post views
      const postViewsResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(postViews)
        .where(and(
          inArray(postViews.postId, postIds),
          gte(postViews.viewedAt, startDate),
          lte(postViews.viewedAt, endDate)
        ));
      postViewsCount = postViewsResult[0]?.count || 0;

      // Get likes in range
      const likesResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(likes)
        .where(and(
          inArray(likes.postId, postIds),
          gte(likes.createdAt, startDate),
          lte(likes.createdAt, endDate)
        ));
      likesCount = likesResult[0]?.count || 0;

      // Get comments in range
      const commentsResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(comments)
        .where(and(
          inArray(comments.postId, postIds),
          gte(comments.createdAt, startDate),
          lte(comments.createdAt, endDate)
        ));
      commentsCount = commentsResult[0]?.count || 0;

      // Get shares in range
      const sharesResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(shares)
        .where(and(
          inArray(shares.postId, postIds),
          gte(shares.createdAt, startDate),
          lte(shares.createdAt, endDate)
        ));
      sharesCount = sharesResult[0]?.count || 0;

      // Get saves in range
      const savesResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookmarks)
        .where(and(
          inArray(bookmarks.postId, postIds),
          gte(bookmarks.createdAt, startDate),
          lte(bookmarks.createdAt, endDate)
        ));
      savesCount = savesResult[0]?.count || 0;

      // Get watch events in range
      const watchResult = await db
        .select({
          totalTime: sql<number>`coalesce(sum(watch_time_ms), 0)::int`,
          count: sql<number>`count(*)::int`,
          completions: sql<number>`count(*) filter (where completed = true)::int`,
        })
        .from(watchEvents)
        .where(and(
          inArray(watchEvents.postId, postIds),
          gte(watchEvents.createdAt, startDate),
          lte(watchEvents.createdAt, endDate)
        ));
      totalWatchTimeMs = watchResult[0]?.totalTime || 0;
      watchEventCount = watchResult[0]?.count || 0;
      completionsCount = watchResult[0]?.completions || 0;

      // Get traffic sources
      const trafficResult = await db
        .select({
          source: watchEvents.source,
          count: sql<number>`count(*)::int`,
        })
        .from(watchEvents)
        .where(and(
          inArray(watchEvents.postId, postIds),
          gte(watchEvents.createdAt, startDate),
          lte(watchEvents.createdAt, endDate)
        ))
        .groupBy(watchEvents.source);

      for (const t of trafficResult) {
        switch (t.source) {
          case "FEED": trafficFromFeed = t.count; break;
          case "PROFILE": trafficFromProfile = t.count; break;
          case "SEARCH": trafficFromSearch = t.count; break;
          case "SHARE": trafficFromShare = t.count; break;
        }
      }
    }

    // Get new followers in range
    const followersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(and(
        eq(follows.followingId, userId),
        gte(follows.createdAt, startDate),
        lte(follows.createdAt, endDate)
      ));
    const newFollowers = followersResult[0]?.count || 0;

    // Calculate trends (compare to previous period)
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodLength);
    const prevEndDate = new Date(startDate.getTime() - 1);

    const prevProfileViews = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profileViews)
      .where(and(
        eq(profileViews.profileUserId, userId),
        gte(profileViews.viewedAt, prevStartDate),
        lte(profileViews.viewedAt, prevEndDate)
      ));

    const prevFollowers = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(and(
        eq(follows.followingId, userId),
        gte(follows.createdAt, prevStartDate),
        lte(follows.createdAt, prevEndDate)
      ));

    const currentProfileViews = profileViewsResult[0]?.count || 0;
    const prevProfileViewsCount = prevProfileViews[0]?.count || 0;
    const prevFollowersCount = prevFollowers[0]?.count || 0;

    return {
      profileViews: currentProfileViews,
      postViews: postViewsCount,
      likesReceived: likesCount,
      commentsReceived: commentsCount,
      sharesReceived: sharesCount,
      savesReceived: savesCount,
      newFollowers,
      totalWatchTimeMs,
      avgWatchTimeMs: watchEventCount > 0 ? Math.round(totalWatchTimeMs / watchEventCount) : 0,
      completionRate: watchEventCount > 0 ? Math.round((completionsCount / watchEventCount) * 100) : 0,
      trafficSources: {
        feed: trafficFromFeed,
        profile: trafficFromProfile,
        search: trafficFromSearch,
        share: trafficFromShare,
      },
      trend: {
        profileViews: prevProfileViewsCount > 0 
          ? Math.round(((currentProfileViews - prevProfileViewsCount) / prevProfileViewsCount) * 100) 
          : currentProfileViews > 0 ? 100 : 0,
        postViews: 0,
        followers: prevFollowersCount > 0 
          ? Math.round(((newFollowers - prevFollowersCount) / prevFollowersCount) * 100) 
          : newFollowers > 0 ? 100 : 0,
      },
    };
  }

  async getStudioContent(userId: string, startDate: Date, endDate: Date, type?: PostType, sortBy = "views"): Promise<StudioContentItem[]> {
    // Get user's posts
    const conditions = [eq(posts.authorId, userId)];
    if (type) {
      conditions.push(eq(posts.type, type));
    }

    const userPosts = await db.select().from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt));

    const result: StudioContentItem[] = [];

    for (const { posts: post, users: author } of userPosts) {
      // Get views in range
      const viewsResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(postViews)
        .where(and(
          eq(postViews.postId, post.id),
          gte(postViews.viewedAt, startDate),
          lte(postViews.viewedAt, endDate)
        ));

      // Get likes in range
      const likesResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(likes)
        .where(and(
          eq(likes.postId, post.id),
          gte(likes.createdAt, startDate),
          lte(likes.createdAt, endDate)
        ));

      // Get comments in range
      const commentsResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(comments)
        .where(and(
          eq(comments.postId, post.id),
          gte(comments.createdAt, startDate),
          lte(comments.createdAt, endDate)
        ));

      // Get shares in range
      const sharesResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(shares)
        .where(and(
          eq(shares.postId, post.id),
          gte(shares.createdAt, startDate),
          lte(shares.createdAt, endDate)
        ));

      // Get saves in range
      const savesResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookmarks)
        .where(and(
          eq(bookmarks.postId, post.id),
          gte(bookmarks.createdAt, startDate),
          lte(bookmarks.createdAt, endDate)
        ));

      // Get watch stats for video/voice
      let totalWatchTimeMs = 0;
      let avgWatchTimeMs = 0;
      let completionRate = 0;

      if (post.type === "VIDEO" || post.type === "VOICE") {
        const watchResult = await db
          .select({
            totalTime: sql<number>`coalesce(sum(watch_time_ms), 0)::int`,
            count: sql<number>`count(*)::int`,
            completions: sql<number>`count(*) filter (where completed = true)::int`,
          })
          .from(watchEvents)
          .where(and(
            eq(watchEvents.postId, post.id),
            gte(watchEvents.createdAt, startDate),
            lte(watchEvents.createdAt, endDate)
          ));

        totalWatchTimeMs = watchResult[0]?.totalTime || 0;
        const watchCount = watchResult[0]?.count || 0;
        const completions = watchResult[0]?.completions || 0;
        avgWatchTimeMs = watchCount > 0 ? Math.round(totalWatchTimeMs / watchCount) : 0;
        completionRate = watchCount > 0 ? Math.round((completions / watchCount) * 100) : 0;
      }

      result.push({
        post: { ...post, author },
        views: viewsResult[0]?.count || 0,
        likes: likesResult[0]?.count || 0,
        comments: commentsResult[0]?.count || 0,
        shares: sharesResult[0]?.count || 0,
        saves: savesResult[0]?.count || 0,
        totalWatchTimeMs,
        avgWatchTimeMs,
        completionRate,
      });
    }

    // Sort by specified field
    result.sort((a, b) => {
      switch (sortBy) {
        case "views": return b.views - a.views;
        case "likes": return b.likes - a.likes;
        case "comments": return b.comments - a.comments;
        case "shares": return b.shares - a.shares;
        case "watchTime": return b.totalWatchTimeMs - a.totalWatchTimeMs;
        default: return b.views - a.views;
      }
    });

    return result;
  }

  async getStudioPostDetail(postId: string, startDate: Date, endDate: Date): Promise<StudioPostDetail | undefined> {
    const post = await this.getPost(postId);
    if (!post) return undefined;

    // Get total views
    const totalViewsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(postViews)
      .where(eq(postViews.postId, postId));

    // Get unique views in range
    const uniqueViewsResult = await db
      .select({ count: sql<number>`count(distinct user_id)::int` })
      .from(postViews)
      .where(and(
        eq(postViews.postId, postId),
        gte(postViews.viewedAt, startDate),
        lte(postViews.viewedAt, endDate)
      ));

    // Get likes in range
    const likesResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(likes)
      .where(and(
        eq(likes.postId, postId),
        gte(likes.createdAt, startDate),
        lte(likes.createdAt, endDate)
      ));

    // Get comments in range
    const commentsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(comments)
      .where(and(
        eq(comments.postId, postId),
        gte(comments.createdAt, startDate),
        lte(comments.createdAt, endDate)
      ));

    // Get shares in range
    const sharesResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(shares)
      .where(and(
        eq(shares.postId, postId),
        gte(shares.createdAt, startDate),
        lte(shares.createdAt, endDate)
      ));

    // Get saves in range
    const savesResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookmarks)
      .where(and(
        eq(bookmarks.postId, postId),
        gte(bookmarks.createdAt, startDate),
        lte(bookmarks.createdAt, endDate)
      ));

    // Get watch stats
    const watchResult = await db
      .select({
        totalTime: sql<number>`coalesce(sum(watch_time_ms), 0)::int`,
        count: sql<number>`count(*)::int`,
        completions: sql<number>`count(*) filter (where completed = true)::int`,
      })
      .from(watchEvents)
      .where(and(
        eq(watchEvents.postId, postId),
        gte(watchEvents.createdAt, startDate),
        lte(watchEvents.createdAt, endDate)
      ));

    // Get traffic sources
    const trafficResult = await db
      .select({
        source: watchEvents.source,
        count: sql<number>`count(*)::int`,
      })
      .from(watchEvents)
      .where(and(
        eq(watchEvents.postId, postId),
        gte(watchEvents.createdAt, startDate),
        lte(watchEvents.createdAt, endDate)
      ))
      .groupBy(watchEvents.source);

    let trafficFromFeed = 0;
    let trafficFromProfile = 0;
    let trafficFromSearch = 0;
    let trafficFromShare = 0;

    for (const t of trafficResult) {
      switch (t.source) {
        case "FEED": trafficFromFeed = t.count; break;
        case "PROFILE": trafficFromProfile = t.count; break;
        case "SEARCH": trafficFromSearch = t.count; break;
        case "SHARE": trafficFromShare = t.count; break;
      }
    }

    // Get daily metrics
    const dailyMetrics = await db
      .select()
      .from(dailyPostAnalytics)
      .where(and(
        eq(dailyPostAnalytics.postId, postId),
        gte(dailyPostAnalytics.date, startDate),
        lte(dailyPostAnalytics.date, endDate)
      ))
      .orderBy(dailyPostAnalytics.date);

    const totalWatchTimeMs = watchResult[0]?.totalTime || 0;
    const watchCount = watchResult[0]?.count || 0;
    const completions = watchResult[0]?.completions || 0;

    return {
      post,
      totalViews: totalViewsResult[0]?.count || 0,
      uniqueViews: uniqueViewsResult[0]?.count || 0,
      likes: likesResult[0]?.count || 0,
      comments: commentsResult[0]?.count || 0,
      shares: sharesResult[0]?.count || 0,
      saves: savesResult[0]?.count || 0,
      totalWatchTimeMs,
      avgWatchTimeMs: watchCount > 0 ? Math.round(totalWatchTimeMs / watchCount) : 0,
      completionRate: watchCount > 0 ? Math.round((completions / watchCount) * 100) : 0,
      dailyMetrics,
      trafficSources: {
        feed: trafficFromFeed,
        profile: trafficFromProfile,
        search: trafficFromSearch,
        share: trafficFromShare,
      },
    };
  }

  async getStudioAudience(userId: string, startDate: Date, endDate: Date): Promise<StudioAudience> {
    // Get total followers
    const totalFollowersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(eq(follows.followingId, userId));

    // Get new followers in range
    const newFollowersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(follows)
      .where(and(
        eq(follows.followingId, userId),
        gte(follows.createdAt, startDate),
        lte(follows.createdAt, endDate)
      ));

    // Get unfollows from daily analytics
    const unfollowsResult = await db
      .select({ unfollows: sql<number>`coalesce(sum(unfollows), 0)::int` })
      .from(dailyUserAnalytics)
      .where(and(
        eq(dailyUserAnalytics.userId, userId),
        gte(dailyUserAnalytics.date, startDate),
        lte(dailyUserAnalytics.date, endDate)
      ));

    const totalFollowers = totalFollowersResult[0]?.count || 0;
    const newFollowers = newFollowersResult[0]?.count || 0;
    const unfollows = unfollowsResult[0]?.unfollows || 0;

    // Get daily follower growth
    const dailyGrowth = await db
      .select({
        date: dailyUserAnalytics.date,
        followers: dailyUserAnalytics.newFollowers,
        unfollows: dailyUserAnalytics.unfollows,
      })
      .from(dailyUserAnalytics)
      .where(and(
        eq(dailyUserAnalytics.userId, userId),
        gte(dailyUserAnalytics.date, startDate),
        lte(dailyUserAnalytics.date, endDate)
      ))
      .orderBy(dailyUserAnalytics.date);

    return {
      totalFollowers,
      newFollowers,
      unfollows,
      netGrowth: newFollowers - unfollows,
      dailyFollowerGrowth: dailyGrowth.map(d => ({
        date: d.date.toISOString().split('T')[0],
        followers: d.followers,
        unfollows: d.unfollows,
      })),
    };
  }

  // ===== STORIES =====

  async createStory(userId: string, data: CreateStoryInput): Promise<Story> {
    const expiresAt = data.scheduledAt 
      ? new Date(data.scheduledAt.getTime() + 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    const [story] = await db.insert(stories).values({
      userId,
      type: data.type,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl,
      durationMs: data.durationMs,
      caption: data.caption,
      textContent: data.textContent,
      backgroundColor: data.backgroundColor,
      isGradient: data.isGradient,
      gradientColors: data.gradientColors,
      fontFamily: data.fontFamily,
      textAlignment: data.textAlignment,
      textAnimation: data.textAnimation,
      textBackgroundPill: data.textBackgroundPill,
      fontSize: data.fontSize,
      audioUrl: data.audioUrl,
      audioDuration: data.audioDuration,
      audioTranscript: data.audioTranscript,
      musicUrl: data.musicUrl,
      musicTitle: data.musicTitle,
      musicArtist: data.musicArtist,
      musicStartTime: data.musicStartTime,
      musicDuration: data.musicDuration,
      filterName: data.filterName,
      textOverlays: data.textOverlays,
      drawings: data.drawings,
      isCloseFriends: data.isCloseFriends,
      replySetting: data.replySetting,
      scheduledAt: data.scheduledAt,
      locationName: data.locationName,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
      expiresAt,
    }).returning();
    
    // Update user's streak if story created successfully
    await this.updateStreak(userId).catch(() => {});
    
    return story;
  }

  async getStory(id: string): Promise<StoryWithUser | undefined> {
    const result = await db.select().from(stories)
      .innerJoin(users, eq(stories.userId, users.id))
      .where(eq(stories.id, id));
    if (result.length === 0) return undefined;
    return { ...result[0].stories, user: result[0].users };
  }

  async getUserStories(userId: string): Promise<StoryWithUser[]> {
    const result = await db.select().from(stories)
      .innerJoin(users, eq(stories.userId, users.id))
      .where(eq(stories.userId, userId))
      .orderBy(desc(stories.createdAt));
    return result.map(r => ({ ...r.stories, user: r.users }));
  }

  async getActiveUserStories(userId: string): Promise<StoryWithUser[]> {
    const now = new Date();
    const result = await db.select().from(stories)
      .innerJoin(users, eq(stories.userId, users.id))
      .where(and(
        eq(stories.userId, userId),
        gt(stories.expiresAt, now)
      ))
      .orderBy(desc(stories.createdAt));
    return result.map(r => ({ ...r.stories, user: r.users }));
  }

  async getFeedStories(userId: string): Promise<{ user: User; stories: Story[] }[]> {
    const now = new Date();
    
    // Get users the current user follows
    const followingIds = await db.select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    const ids = followingIds.map(f => f.id);
    if (ids.length === 0) return [];

    // Get story viewer restrictions - users who have blocked this viewer from seeing their stories
    const storyRestrictions = await db.select({ userId: storyViewerRestrictions.userId })
      .from(storyViewerRestrictions)
      .where(eq(storyViewerRestrictions.restrictedViewerId, userId));
    const restrictedUserIds = new Set(storyRestrictions.map(r => r.userId));
    
    // Get muted accounts - users whose stories this viewer has muted
    const mutedList = await db.select().from(mutedAccounts)
      .where(and(eq(mutedAccounts.userId, userId), eq(mutedAccounts.muteStories, true)));
    const mutedUserIds = new Set(mutedList.map(m => m.mutedUserId));
    
    // Filter out restricted and muted users
    const filteredIds = ids.filter(id => !restrictedUserIds.has(id) && !mutedUserIds.has(id));
    if (filteredIds.length === 0) return [];

    // Get active stories from followed users
    const result = await db.select().from(stories)
      .innerJoin(users, eq(stories.userId, users.id))
      .where(and(
        inArray(stories.userId, filteredIds),
        gt(stories.expiresAt, now)
      ))
      .orderBy(desc(stories.createdAt));

    // Group by user
    const grouped = new Map<string, { user: User; stories: Story[] }>();
    for (const r of result) {
      const existing = grouped.get(r.users.id);
      if (existing) {
        existing.stories.push(r.stories);
      } else {
        grouped.set(r.users.id, { user: r.users, stories: [r.stories] });
      }
    }

    // Sort by most recent story
    return Array.from(grouped.values()).sort((a, b) => {
      const aLatest = a.stories[0]?.createdAt?.getTime() || 0;
      const bLatest = b.stories[0]?.createdAt?.getTime() || 0;
      return bLatest - aLatest;
    });
  }

  async getAllStories(limit: number, offset: number, userId?: string): Promise<StoryWithUser[]> {
    const conditions = [];
    if (userId) {
      conditions.push(eq(stories.userId, userId));
    }
    
    const result = await db.select().from(stories)
      .innerJoin(users, eq(stories.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(stories.createdAt))
      .limit(limit)
      .offset(offset);
    
    return result.map(r => ({ ...r.stories, user: r.users }));
  }

  async deleteStory(id: string): Promise<void> {
    await db.delete(stories).where(eq(stories.id, id));
  }

  async viewStory(storyId: string, viewerId: string): Promise<StoryView> {
    // Check if already viewed
    const existing = await db.select().from(storyViews)
      .where(and(eq(storyViews.storyId, storyId), eq(storyViews.viewerId, viewerId)));
    if (existing.length > 0) return existing[0];

    // Create view and increment count atomically
    return await db.transaction(async (tx) => {
      const [view] = await tx.insert(storyViews)
        .values({ storyId, viewerId })
        .returning();
      await tx.update(stories)
        .set({ viewsCount: sql`${stories.viewsCount} + 1` })
        .where(eq(stories.id, storyId));
      return view;
    });
  }

  async getStoryViewers(storyId: string): Promise<Array<User & { viewedAt: Date }>> {
    const result = await db.select().from(storyViews)
      .innerJoin(users, eq(storyViews.viewerId, users.id))
      .where(eq(storyViews.storyId, storyId))
      .orderBy(desc(storyViews.viewedAt));
    return result.map(r => ({ ...r.users, viewedAt: r.story_views.viewedAt }));
  }

  async hasUserViewedStory(storyId: string, viewerId: string): Promise<boolean> {
    const result = await db.select().from(storyViews)
      .where(and(eq(storyViews.storyId, storyId), eq(storyViews.viewerId, viewerId)));
    return result.length > 0;
  }

  async deleteExpiredStories(): Promise<number> {
    const now = new Date();
    const result = await db.delete(stories)
      .where(lt(stories.expiresAt, now))
      .returning();
    return result.length;
  }

  // ===== STORY STICKERS =====

  async createStorySticker(data: CreateStoryStickerInput): Promise<StorySticker> {
    const [sticker] = await db.insert(storyStickers).values({
      storyId: data.storyId,
      type: data.type,
      positionX: data.positionX ?? 0.5,
      positionY: data.positionY ?? 0.5,
      scale: data.scale ?? 1,
      rotation: data.rotation ?? 0,
      data: data.data,
    }).returning();
    return sticker;
  }

  async getSticker(stickerId: string): Promise<StorySticker | undefined> {
    const [sticker] = await db.select().from(storyStickers)
      .where(eq(storyStickers.id, stickerId))
      .limit(1);
    return sticker;
  }

  async getStoryStickers(storyId: string): Promise<StorySticker[]> {
    return db.select().from(storyStickers)
      .where(eq(storyStickers.storyId, storyId))
      .orderBy(storyStickers.createdAt);
  }

  async updateStorySticker(stickerId: string, data: Partial<StorySticker>): Promise<StorySticker | undefined> {
    const [sticker] = await db.update(storyStickers)
      .set(data)
      .where(eq(storyStickers.id, stickerId))
      .returning();
    return sticker;
  }

  async deleteStorySticker(stickerId: string): Promise<void> {
    await db.delete(storyStickers).where(eq(storyStickers.id, stickerId));
  }

  async respondToSticker(stickerId: string, userId: string, responseType: string, responseData: any): Promise<StoryStickerResponse> {
    const [response] = await db.insert(storyStickerResponses)
      .values({ stickerId, userId, responseType, responseData })
      .onConflictDoUpdate({
        target: [storyStickerResponses.stickerId, storyStickerResponses.userId],
        set: { responseType, responseData }
      })
      .returning();
    return response;
  }

  async getStickerResponses(stickerId: string): Promise<StoryStickerResponse[]> {
    return db.select().from(storyStickerResponses)
      .where(eq(storyStickerResponses.stickerId, stickerId))
      .orderBy(desc(storyStickerResponses.createdAt));
  }

  async getUserStickerResponse(stickerId: string, userId: string): Promise<StoryStickerResponse | undefined> {
    const [response] = await db.select().from(storyStickerResponses)
      .where(and(
        eq(storyStickerResponses.stickerId, stickerId),
        eq(storyStickerResponses.userId, userId)
      ));
    return response;
  }

  // ===== STORY REACTIONS =====

  async addStoryReaction(storyId: string, userId: string, reactionType: StoryReactionType): Promise<StoryReaction> {
    const [reaction] = await db.insert(storyReactions)
      .values({ storyId, userId, reactionType })
      .onConflictDoUpdate({
        target: [storyReactions.storyId, storyReactions.userId],
        set: { reactionType }
      })
      .returning();
    
    await db.update(stories)
      .set({ reactionsCount: sql`${stories.reactionsCount} + 1` })
      .where(eq(stories.id, storyId));
    
    return reaction;
  }

  async removeStoryReaction(storyId: string, userId: string): Promise<void> {
    const deleted = await db.delete(storyReactions)
      .where(and(eq(storyReactions.storyId, storyId), eq(storyReactions.userId, userId)))
      .returning();
    
    if (deleted.length > 0) {
      await db.update(stories)
        .set({ reactionsCount: sql`GREATEST(${stories.reactionsCount} - 1, 0)` })
        .where(eq(stories.id, storyId));
    }
  }

  async getStoryReactions(storyId: string): Promise<StoryReaction[]> {
    return db.select().from(storyReactions)
      .where(eq(storyReactions.storyId, storyId))
      .orderBy(desc(storyReactions.createdAt));
  }

  async hasUserReactedToStory(storyId: string, userId: string): Promise<StoryReaction | undefined> {
    const [reaction] = await db.select().from(storyReactions)
      .where(and(eq(storyReactions.storyId, storyId), eq(storyReactions.userId, userId)));
    return reaction;
  }

  // ===== STORY REPLIES =====

  async createStoryReply(storyId: string, userId: string, content?: string, mediaUrl?: string, mediaType?: string): Promise<StoryReply> {
    const [reply] = await db.insert(storyReplies)
      .values({ storyId, userId, content, mediaUrl, mediaType })
      .returning();
    
    await db.update(stories)
      .set({ repliesCount: sql`${stories.repliesCount} + 1` })
      .where(eq(stories.id, storyId));
    
    return reply;
  }

  async getStoryReplies(storyId: string): Promise<(StoryReply & { user: User })[]> {
    const result = await db.select().from(storyReplies)
      .innerJoin(users, eq(storyReplies.userId, users.id))
      .where(eq(storyReplies.storyId, storyId))
      .orderBy(desc(storyReplies.createdAt));
    return result.map(r => ({ ...r.story_replies, user: r.users }));
  }

  async markStoryRepliesRead(storyId: string): Promise<void> {
    await db.update(storyReplies)
      .set({ isRead: true })
      .where(eq(storyReplies.storyId, storyId));
  }

  async deleteStoryReply(replyId: string): Promise<void> {
    const [deleted] = await db.delete(storyReplies)
      .where(eq(storyReplies.id, replyId))
      .returning();
    
    if (deleted) {
      await db.update(stories)
        .set({ repliesCount: sql`GREATEST(${stories.repliesCount} - 1, 0)` })
        .where(eq(stories.id, deleted.storyId));
    }
  }

  // ===== STORY DRAFTS =====

  async createStoryDraft(userId: string, data: CreateStoryDraftInput): Promise<StoryDraft> {
    const [draft] = await db.insert(storyDrafts).values({
      userId,
      type: data.type,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl,
      textContent: data.textContent,
      backgroundColor: data.backgroundColor,
      isGradient: data.isGradient,
      gradientColors: data.gradientColors,
      fontFamily: data.fontFamily,
      textAlignment: data.textAlignment,
      textAnimation: data.textAnimation,
      fontSize: data.fontSize,
      audioUrl: data.audioUrl,
      audioDuration: data.audioDuration,
      musicUrl: data.musicUrl,
      musicTitle: data.musicTitle,
      musicArtist: data.musicArtist,
      filterName: data.filterName,
      textOverlays: data.textOverlays,
      drawings: data.drawings,
      stickers: data.stickers,
      isCloseFriends: data.isCloseFriends,
      replySetting: data.replySetting,
    }).returning();
    return draft;
  }

  async getStoryDraft(draftId: string): Promise<StoryDraft | undefined> {
    const [draft] = await db.select().from(storyDrafts)
      .where(eq(storyDrafts.id, draftId));
    return draft;
  }

  async getUserStoryDrafts(userId: string): Promise<StoryDraft[]> {
    return db.select().from(storyDrafts)
      .where(eq(storyDrafts.userId, userId))
      .orderBy(desc(storyDrafts.updatedAt));
  }

  async updateStoryDraft(draftId: string, data: Partial<StoryDraft>): Promise<StoryDraft | undefined> {
    const [draft] = await db.update(storyDrafts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(storyDrafts.id, draftId))
      .returning();
    return draft;
  }

  async deleteStoryDraft(draftId: string): Promise<void> {
    await db.delete(storyDrafts).where(eq(storyDrafts.id, draftId));
  }

  // ===== STORY INSIGHTS =====

  async recordStoryInsight(storyId: string, viewerId: string, data: Partial<StoryInsight>): Promise<StoryInsight> {
    const [insight] = await db.insert(storyInsights)
      .values({ storyId, viewerId, ...data })
      .onConflictDoUpdate({
        target: [storyInsights.storyId, storyInsights.viewerId],
        set: data
      })
      .returning();
    
    // Update story counters based on insight data
    if (data.tappedForward) {
      await db.update(stories).set({ tapsForwardCount: sql`${stories.tapsForwardCount} + 1` }).where(eq(stories.id, storyId));
    }
    if (data.tappedBack) {
      await db.update(stories).set({ tapsBackCount: sql`${stories.tapsBackCount} + 1` }).where(eq(stories.id, storyId));
    }
    if (data.exited) {
      await db.update(stories).set({ exitsCount: sql`${stories.exitsCount} + 1` }).where(eq(stories.id, storyId));
    }
    if (data.shared) {
      await db.update(stories).set({ sharesCount: sql`${stories.sharesCount} + 1` }).where(eq(stories.id, storyId));
    }
    
    return insight;
  }

  async getStoryInsights(storyId: string): Promise<StoryInsight[]> {
    return db.select().from(storyInsights)
      .where(eq(storyInsights.storyId, storyId))
      .orderBy(desc(storyInsights.createdAt));
  }

  async getStoryAnalytics(storyId: string): Promise<{ views: number; avgDuration: number; exits: number; shares: number; profileVisits: number }> {
    const insights = await this.getStoryInsights(storyId);
    const views = insights.length;
    const totalDuration = insights.reduce((sum, i) => sum + (i.viewDuration || 0), 0);
    const avgDuration = views > 0 ? Math.round(totalDuration / views) : 0;
    const exits = insights.filter(i => i.exited).length;
    const shares = insights.filter(i => i.shared).length;
    const profileVisits = insights.filter(i => i.profileVisited).length;
    return { views, avgDuration, exits, shares, profileVisits };
  }

  // ===== STORY STREAKS =====

  async getOrCreateStreak(userId: string): Promise<StoryStreak> {
    const [existing] = await db.select().from(storyStreaks)
      .where(eq(storyStreaks.userId, userId));
    if (existing) return existing;
    
    const [streak] = await db.insert(storyStreaks)
      .values({ userId })
      .returning();
    return streak;
  }

  async updateStreak(userId: string): Promise<StoryStreak> {
    const streak = await this.getOrCreateStreak(userId);
    const now = new Date();
    const lastStoryTime = streak.lastStoryAt?.getTime() || 0;
    const hoursSinceLastStory = (now.getTime() - lastStoryTime) / (1000 * 60 * 60);
    
    let newStreak = streak.currentStreak;
    let streakStartedAt = streak.streakStartedAt;
    
    if (hoursSinceLastStory > 48) {
      // Streak broken - reset
      newStreak = 1;
      streakStartedAt = now;
    } else if (hoursSinceLastStory > 24) {
      // Continuing streak
      newStreak = streak.currentStreak + 1;
    }
    // If less than 24 hours, keep current streak (multiple stories same day)
    
    const longestStreak = Math.max(streak.longestStreak, newStreak);
    
    const [updated] = await db.update(storyStreaks)
      .set({
        currentStreak: newStreak,
        longestStreak,
        lastStoryAt: now,
        streakStartedAt,
        updatedAt: now,
      })
      .where(eq(storyStreaks.userId, userId))
      .returning();
    
    return updated;
  }

  async claimStreakMilestone(userId: string, milestone: number): Promise<StoryStreak | undefined> {
    const fieldMap: Record<number, keyof StoryStreak> = {
      7: 'milestone7Claimed',
      30: 'milestone30Claimed',
      100: 'milestone100Claimed',
      365: 'milestone365Claimed',
    };
    
    const field = fieldMap[milestone];
    if (!field) return undefined;
    
    const [updated] = await db.update(storyStreaks)
      .set({ [field]: true, updatedAt: new Date() })
      .where(eq(storyStreaks.userId, userId))
      .returning();
    
    return updated;
  }

  // ===== STORY TEMPLATES =====

  async getStoryTemplates(category?: string): Promise<StoryTemplate[]> {
    const conditions = [eq(storyTemplates.isActive, true)];
    if (category) conditions.push(eq(storyTemplates.category, category));
    
    return db.select().from(storyTemplates)
      .where(and(...conditions))
      .orderBy(storyTemplates.order, desc(storyTemplates.usageCount));
  }

  async getStoryTemplate(templateId: string): Promise<StoryTemplate | undefined> {
    const [template] = await db.select().from(storyTemplates)
      .where(eq(storyTemplates.id, templateId));
    return template;
  }

  async createStoryTemplate(data: Partial<StoryTemplate>): Promise<StoryTemplate> {
    const [template] = await db.insert(storyTemplates)
      .values(data as any)
      .returning();
    return template;
  }

  async updateStoryTemplate(templateId: string, data: Partial<StoryTemplate>): Promise<StoryTemplate | undefined> {
    const [template] = await db.update(storyTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(storyTemplates.id, templateId))
      .returning();
    return template;
  }

  async deleteStoryTemplate(templateId: string): Promise<void> {
    await db.delete(storyTemplates).where(eq(storyTemplates.id, templateId));
  }

  async incrementTemplateUsage(templateId: string): Promise<void> {
    await db.update(storyTemplates)
      .set({ usageCount: sql`${storyTemplates.usageCount} + 1` })
      .where(eq(storyTemplates.id, templateId));
  }

  // ===== STORY MUSIC LIBRARY =====

  async getStoryMusic(genre?: string, limit = 50): Promise<StoryMusic[]> {
    const conditions = [eq(storyMusicLibrary.isActive, true)];
    if (genre) conditions.push(eq(storyMusicLibrary.genre, genre));
    
    return db.select().from(storyMusicLibrary)
      .where(and(...conditions))
      .orderBy(desc(storyMusicLibrary.usageCount))
      .limit(limit);
  }

  async getFeaturedStoryMusic(): Promise<StoryMusic[]> {
    return db.select().from(storyMusicLibrary)
      .where(and(eq(storyMusicLibrary.isActive, true), eq(storyMusicLibrary.isFeatured, true)))
      .orderBy(desc(storyMusicLibrary.usageCount))
      .limit(20);
  }

  async searchStoryMusic(query: string): Promise<StoryMusic[]> {
    return db.select().from(storyMusicLibrary)
      .where(and(
        eq(storyMusicLibrary.isActive, true),
        or(
          ilike(storyMusicLibrary.title, `%${query}%`),
          ilike(storyMusicLibrary.artist, `%${query}%`)
        )
      ))
      .orderBy(desc(storyMusicLibrary.usageCount))
      .limit(50);
  }

  async addStoryMusic(data: Partial<StoryMusic>): Promise<StoryMusic> {
    const [music] = await db.insert(storyMusicLibrary)
      .values(data as any)
      .returning();
    return music;
  }

  async updateStoryMusic(musicId: string, data: Partial<StoryMusic>): Promise<StoryMusic | undefined> {
    const [music] = await db.update(storyMusicLibrary)
      .set(data)
      .where(eq(storyMusicLibrary.id, musicId))
      .returning();
    return music;
  }

  async deleteStoryMusic(musicId: string): Promise<void> {
    await db.delete(storyMusicLibrary).where(eq(storyMusicLibrary.id, musicId));
  }

  async incrementMusicUsage(musicId: string): Promise<void> {
    await db.update(storyMusicLibrary)
      .set({ usageCount: sql`${storyMusicLibrary.usageCount} + 1` })
      .where(eq(storyMusicLibrary.id, musicId));
  }

  async getStoryMusicById(musicId: string): Promise<StoryMusic | undefined> {
    const [music] = await db.select().from(storyMusicLibrary)
      .where(eq(storyMusicLibrary.id, musicId));
    return music;
  }

  async createStoryMusic(data: Partial<StoryMusic>): Promise<StoryMusic> {
    const [music] = await db.insert(storyMusicLibrary)
      .values(data as any)
      .returning();
    return music;
  }

  // ===== STORY REPORTS (ADMIN) =====

  async getStoryReports(status?: string): Promise<Report[]> {
    const conditions: any[] = [];
    if (status) {
      conditions.push(eq(reports.status, status as any));
    }
    // Filter reports that have a story-related post (reports table doesn't have contentType column)
    return db.select().from(reports)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reports.createdAt));
  }

  // ===== PLATFORM STORY ANALYTICS (ADMIN) =====

  async getPlatformStoryStats(days: number): Promise<{
    totalStories: number;
    totalViews: number;
    avgViewDuration: number;
    topCreators: { userId: string; storyCount: number; totalViews: number }[];
    byType: { type: string; count: number }[];
    engagementRate: number;
  }> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // Total stories
    const [storyCount] = await db.select({ count: sql<number>`count(*)` })
      .from(stories)
      .where(gte(stories.createdAt, cutoff));
    
    // Total views
    const [viewCount] = await db.select({ sum: sql<number>`coalesce(sum(${stories.viewsCount}), 0)` })
      .from(stories)
      .where(gte(stories.createdAt, cutoff));
    
    // Avg view duration from insights
    const [avgDuration] = await db.select({ avg: sql<number>`coalesce(avg(${storyInsights.viewDuration}), 0)` })
      .from(storyInsights)
      .innerJoin(stories, eq(storyInsights.storyId, stories.id))
      .where(gte(stories.createdAt, cutoff));
    
    // Top creators
    const topCreators = await db.select({
      userId: stories.userId,
      storyCount: sql<number>`count(*)::int`,
      totalViews: sql<number>`coalesce(sum(${stories.viewsCount}), 0)::int`,
    })
      .from(stories)
      .where(gte(stories.createdAt, cutoff))
      .groupBy(stories.userId)
      .orderBy(desc(sql`sum(${stories.viewsCount})`))
      .limit(10);
    
    // By type
    const byType = await db.select({
      type: stories.type,
      count: sql<number>`count(*)::int`,
    })
      .from(stories)
      .where(gte(stories.createdAt, cutoff))
      .groupBy(stories.type);
    
    // Engagement rate (reactions + replies / views)
    const [engagement] = await db.select({
      reactions: sql<number>`coalesce(sum(${stories.reactionsCount}), 0)::int`,
      replies: sql<number>`coalesce(sum(${stories.repliesCount}), 0)::int`,
      views: sql<number>`coalesce(sum(${stories.viewsCount}), 0)::int`,
    })
      .from(stories)
      .where(gte(stories.createdAt, cutoff));
    
    const totalEngagement = (engagement.reactions || 0) + (engagement.replies || 0);
    const totalViews = engagement.views || 1;
    const engagementRate = totalEngagement / totalViews;
    
    return {
      totalStories: Number(storyCount?.count || 0),
      totalViews: Number(viewCount?.sum || 0),
      avgViewDuration: Number(avgDuration?.avg || 0),
      topCreators: topCreators.map(c => ({
        userId: c.userId,
        storyCount: c.storyCount,
        totalViews: c.totalViews,
      })),
      byType: byType.map(b => ({ type: b.type, count: b.count })),
      engagementRate,
    };
  }

  // ===== STORY TIPS =====

  async createStoryTip(storyId: string, senderId: string, recipientId: string, amount: number, message?: string): Promise<StoryTip> {
    const [tip] = await db.insert(storyTips)
      .values({ storyId, senderId, recipientId, amount, message })
      .returning();
    
    // Update user's net worth (recipient gets tip amount)
    await this.addNetWorthEntry(recipientId, amount, 'GIFT', 'story_tip', tip.id);
    
    return tip;
  }

  async getStoryTips(storyId: string): Promise<(StoryTip & { sender: User })[]> {
    const result = await db.select().from(storyTips)
      .innerJoin(users, eq(storyTips.senderId, users.id))
      .where(eq(storyTips.storyId, storyId))
      .orderBy(desc(storyTips.createdAt));
    return result.map(r => ({ ...r.story_tips, sender: r.users }));
  }

  async getUserReceivedTips(userId: string): Promise<(StoryTip & { sender: User; story: Story })[]> {
    const result = await db.select().from(storyTips)
      .innerJoin(users, eq(storyTips.senderId, users.id))
      .innerJoin(stories, eq(storyTips.storyId, stories.id))
      .where(eq(storyTips.recipientId, userId))
      .orderBy(desc(storyTips.createdAt));
    return result.map(r => ({ ...r.story_tips, sender: r.users, story: r.stories }));
  }

  async getUserSentTips(userId: string): Promise<(StoryTip & { recipient: User; story: Story })[]> {
    const result = await db.select().from(storyTips)
      .innerJoin(users, eq(storyTips.recipientId, users.id))
      .innerJoin(stories, eq(storyTips.storyId, stories.id))
      .where(eq(storyTips.senderId, userId))
      .orderBy(desc(storyTips.createdAt));
    return result.map(r => ({ ...r.story_tips, recipient: r.users, story: r.stories }));
  }

  // ===== STORY COUNTDOWN SUBSCRIPTIONS =====

  async subscribeToCountdown(stickerId: string, userId: string): Promise<StoryCountdownSubscription> {
    const [sub] = await db.insert(storyCountdownSubscriptions)
      .values({ stickerId, userId })
      .onConflictDoNothing()
      .returning();
    
    if (!sub) {
      const [existing] = await db.select().from(storyCountdownSubscriptions)
        .where(and(
          eq(storyCountdownSubscriptions.stickerId, stickerId),
          eq(storyCountdownSubscriptions.userId, userId)
        ));
      return existing;
    }
    return sub;
  }

  async unsubscribeFromCountdown(stickerId: string, userId: string): Promise<void> {
    await db.delete(storyCountdownSubscriptions)
      .where(and(
        eq(storyCountdownSubscriptions.stickerId, stickerId),
        eq(storyCountdownSubscriptions.userId, userId)
      ));
  }

  async getCountdownSubscribers(stickerId: string): Promise<User[]> {
    const result = await db.select().from(storyCountdownSubscriptions)
      .innerJoin(users, eq(storyCountdownSubscriptions.userId, users.id))
      .where(eq(storyCountdownSubscriptions.stickerId, stickerId));
    return result.map(r => r.users);
  }

  async getPendingCountdownNotifications(): Promise<{ subscription: StoryCountdownSubscription; sticker: StorySticker }[]> {
    const now = new Date();
    const result = await db.select().from(storyCountdownSubscriptions)
      .innerJoin(storyStickers, eq(storyCountdownSubscriptions.stickerId, storyStickers.id))
      .where(eq(storyCountdownSubscriptions.notified, false));
    
    return result
      .filter(r => {
        const countdownEnd = (r.story_stickers.data as any)?.endTime;
        return countdownEnd && new Date(countdownEnd) <= now;
      })
      .map(r => ({ subscription: r.story_countdown_subscriptions, sticker: r.story_stickers }));
  }

  async markCountdownNotified(subscriptionId: string): Promise<void> {
    await db.update(storyCountdownSubscriptions)
      .set({ notified: true })
      .where(eq(storyCountdownSubscriptions.id, subscriptionId));
  }

  // ===== MUTUAL FOLLOWERS =====

  async getMutualFollowers(userId: string, viewerId: string, limit = 5): Promise<User[]> {
    // Get users that both userId and viewerId follow
    const userFollowing = await db.select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));
    
    const viewerFollowing = await db.select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, viewerId));
    
    const userFollowingIds = new Set(userFollowing.map(f => f.id));
    const mutualIds = viewerFollowing
      .filter(f => userFollowingIds.has(f.id))
      .map(f => f.id)
      .slice(0, limit);
    
    if (mutualIds.length === 0) return [];
    
    const result = await db.select().from(users)
      .where(inArray(users.id, mutualIds));
    return result;
  }

  // ===== ACTIVITY STATUS =====

  async updateLastActive(userId: string): Promise<void> {
    await db.update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, userId));
  }

  // ===== STORY HIGHLIGHTS =====

  async createStoryHighlight(userId: string, name: string, coverUrl?: string): Promise<StoryHighlight> {
    const maxOrder = await db.select({ max: sql<number>`COALESCE(MAX("order"), -1)` })
      .from(storyHighlights)
      .where(eq(storyHighlights.userId, userId));
    const [highlight] = await db.insert(storyHighlights)
      .values({ userId, name, coverUrl, order: (maxOrder[0]?.max ?? -1) + 1 })
      .returning();
    return highlight;
  }

  async getStoryHighlights(userId: string): Promise<StoryHighlight[]> {
    return db.select().from(storyHighlights)
      .where(eq(storyHighlights.userId, userId))
      .orderBy(storyHighlights.order);
  }

  async getStoryHighlight(highlightId: string): Promise<StoryHighlight | undefined> {
    const [highlight] = await db.select().from(storyHighlights)
      .where(eq(storyHighlights.id, highlightId));
    return highlight;
  }

  async updateStoryHighlight(highlightId: string, data: { name?: string; coverUrl?: string; order?: number }): Promise<StoryHighlight | undefined> {
    const [updated] = await db.update(storyHighlights)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(storyHighlights.id, highlightId))
      .returning();
    return updated;
  }

  async deleteStoryHighlight(highlightId: string): Promise<boolean> {
    const result = await db.delete(storyHighlights)
      .where(eq(storyHighlights.id, highlightId))
      .returning();
    return result.length > 0;
  }

  async addStoryToHighlight(highlightId: string, storyId: string): Promise<StoryHighlightItem | undefined> {
    const maxOrder = await db.select({ max: sql<number>`COALESCE(MAX("order"), -1)` })
      .from(storyHighlightItems)
      .where(eq(storyHighlightItems.highlightId, highlightId));
    try {
      const [item] = await db.insert(storyHighlightItems)
        .values({ highlightId, storyId, order: (maxOrder[0]?.max ?? -1) + 1 })
        .returning();
      return item;
    } catch {
      return undefined; // Duplicate
    }
  }

  async removeStoryFromHighlight(highlightId: string, storyId: string): Promise<boolean> {
    const result = await db.delete(storyHighlightItems)
      .where(and(eq(storyHighlightItems.highlightId, highlightId), eq(storyHighlightItems.storyId, storyId)))
      .returning();
    return result.length > 0;
  }

  async getHighlightItems(highlightId: string): Promise<(StoryHighlightItem & { story: Story })[]> {
    const result = await db.select().from(storyHighlightItems)
      .innerJoin(stories, eq(storyHighlightItems.storyId, stories.id))
      .where(eq(storyHighlightItems.highlightId, highlightId))
      .orderBy(storyHighlightItems.order);
    return result.map(r => ({ ...r.story_highlight_items, story: r.stories }));
  }

  // ===== USER NOTES (24h STATUS) =====

  async createUserNote(userId: string, content: string): Promise<UserNote> {
    await db.delete(userNotes).where(eq(userNotes.userId, userId)); // Only one note at a time
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const [note] = await db.insert(userNotes)
      .values({ userId, content, expiresAt })
      .returning();
    return note;
  }

  async getUserNote(userId: string): Promise<UserNote | undefined> {
    const [note] = await db.select().from(userNotes)
      .where(and(eq(userNotes.userId, userId), gt(userNotes.expiresAt, new Date())));
    return note;
  }

  async deleteUserNote(userId: string): Promise<boolean> {
    const result = await db.delete(userNotes)
      .where(eq(userNotes.userId, userId))
      .returning();
    return result.length > 0;
  }

  async deleteExpiredNotes(): Promise<number> {
    const result = await db.delete(userNotes)
      .where(lt(userNotes.expiresAt, new Date()))
      .returning();
    return result.length;
  }

  // ===== USER LINKS =====

  async createUserLink(userId: string, data: { title: string; url: string; iconType?: LinkIconType }): Promise<UserLink> {
    const maxOrder = await db.select({ max: sql<number>`COALESCE(MAX("order"), -1)` })
      .from(userLinks)
      .where(eq(userLinks.userId, userId));
    const [link] = await db.insert(userLinks)
      .values({ userId, ...data, order: (maxOrder[0]?.max ?? -1) + 1 })
      .returning();
    return link;
  }

  async getUserLinks(userId: string): Promise<UserLink[]> {
    return db.select().from(userLinks)
      .where(eq(userLinks.userId, userId))
      .orderBy(userLinks.order);
  }

  async updateUserLink(linkId: string, data: { title?: string; url?: string; iconType?: LinkIconType; order?: number; isActive?: boolean }): Promise<UserLink | undefined> {
    const [updated] = await db.update(userLinks)
      .set(data)
      .where(eq(userLinks.id, linkId))
      .returning();
    return updated;
  }

  async deleteUserLink(linkId: string): Promise<boolean> {
    const result = await db.delete(userLinks)
      .where(eq(userLinks.id, linkId))
      .returning();
    return result.length > 0;
  }

  async getUserLink(linkId: string): Promise<UserLink | undefined> {
    const [link] = await db.select().from(userLinks)
      .where(eq(userLinks.id, linkId));
    return link;
  }

  async incrementLinkClicks(linkId: string): Promise<void> {
    await db.update(userLinks)
      .set({ clicks: sql`${userLinks.clicks} + 1` })
      .where(eq(userLinks.id, linkId));
  }

  // ===== USER INTERESTS =====

  async addUserInterest(userId: string, interest: string): Promise<UserInterest | undefined> {
    const maxOrder = await db.select({ max: sql<number>`COALESCE(MAX("order"), -1)` })
      .from(userInterests)
      .where(eq(userInterests.userId, userId));
    try {
      const [item] = await db.insert(userInterests)
        .values({ userId, interest: interest.toLowerCase().trim(), order: (maxOrder[0]?.max ?? -1) + 1 })
        .returning();
      return item;
    } catch {
      return undefined; // Duplicate
    }
  }

  async getUserInterests(userId: string): Promise<UserInterest[]> {
    return db.select().from(userInterests)
      .where(eq(userInterests.userId, userId))
      .orderBy(userInterests.order);
  }

  async removeUserInterest(userId: string, interest: string): Promise<boolean> {
    const result = await db.delete(userInterests)
      .where(and(eq(userInterests.userId, userId), eq(userInterests.interest, interest.toLowerCase().trim())))
      .returning();
    return result.length > 0;
  }

  async setUserInterests(userId: string, interests: string[]): Promise<UserInterest[]> {
    await db.delete(userInterests).where(eq(userInterests.userId, userId));
    if (interests.length === 0) return [];
    const items = interests.map((interest, idx) => ({ 
      userId, 
      interest: interest.toLowerCase().trim(), 
      order: idx 
    }));
    return db.insert(userInterests).values(items).returning();
  }

  // ===== PROFILE ENHANCEMENTS =====

  async updateProfileEnhancements(userId: string, data: {
    birthday?: Date | null;
    profileSongUrl?: string | null;
    profileSongTitle?: string | null;
    profileSongArtist?: string | null;
    avatarVideoUrl?: string | null;
    voiceBioUrl?: string | null;
    voiceBioDurationMs?: number | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    contactAddress?: string | null;
    relationshipStatus?: RelationshipStatus | null;
    relationshipPartnerId?: string | null;
    themeColor?: string | null;
    themeStyle?: ThemeStyle | null;
  }): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getRelationshipPartner(userId: string): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user?.relationshipPartnerId) return undefined;
    return this.getUser(user.relationshipPartnerId);
  }

  // ===== LOGIN SESSIONS =====

  async createLoginSession(userId: string, data: { sessionToken: string; deviceName?: string; deviceType?: string; browser?: string; os?: string; ipAddress?: string; location?: string }): Promise<LoginSession> {
    const [session] = await db.insert(loginSessions).values({
      userId,
      sessionToken: data.sessionToken,
      deviceName: data.deviceName,
      deviceType: data.deviceType,
      browser: data.browser,
      os: data.os,
      ipAddress: data.ipAddress,
      location: data.location,
    }).returning();
    return session;
  }

  async getLoginSessions(userId: string): Promise<LoginSession[]> {
    return db.select().from(loginSessions)
      .where(eq(loginSessions.userId, userId))
      .orderBy(desc(loginSessions.lastActiveAt));
  }

  async getActiveLoginSessions(userId: string): Promise<LoginSession[]> {
    return db.select().from(loginSessions)
      .where(and(eq(loginSessions.userId, userId), eq(loginSessions.isActive, true)))
      .orderBy(desc(loginSessions.lastActiveAt));
  }

  async getLoginSessionByToken(token: string): Promise<LoginSession | undefined> {
    const [session] = await db.select().from(loginSessions)
      .where(eq(loginSessions.sessionToken, token));
    return session;
  }

  async getLoginSession(sessionId: string): Promise<LoginSession | undefined> {
    const [session] = await db.select().from(loginSessions)
      .where(eq(loginSessions.id, sessionId));
    return session;
  }

  async updateLoginSession(sessionId: string, data: Partial<LoginSession>): Promise<LoginSession | undefined> {
    const [updated] = await db.update(loginSessions)
      .set(data)
      .where(eq(loginSessions.id, sessionId))
      .returning();
    return updated;
  }

  async invalidateLoginSession(sessionId: string): Promise<void> {
    await db.update(loginSessions)
      .set({ isActive: false })
      .where(eq(loginSessions.id, sessionId));
  }

  async invalidateAllLoginSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const conditions = [eq(loginSessions.userId, userId)];
    if (exceptSessionId) {
      await db.update(loginSessions)
        .set({ isActive: false })
        .where(and(eq(loginSessions.userId, userId), sql`${loginSessions.id} != ${exceptSessionId}`));
    } else {
      await db.update(loginSessions)
        .set({ isActive: false })
        .where(eq(loginSessions.userId, userId));
    }
  }

  // ===== TRUSTED DEVICES =====

  async addTrustedDevice(userId: string, data: { deviceId: string; deviceName: string; deviceType?: string; browser?: string; os?: string }): Promise<TrustedDevice> {
    const [device] = await db.insert(trustedDevices).values({
      userId,
      ...data,
    }).returning();
    return device;
  }

  async getTrustedDevices(userId: string): Promise<TrustedDevice[]> {
    return db.select().from(trustedDevices)
      .where(eq(trustedDevices.userId, userId))
      .orderBy(desc(trustedDevices.lastUsedAt));
  }

  async getTrustedDevice(deviceId: string): Promise<TrustedDevice | undefined> {
    const [device] = await db.select().from(trustedDevices)
      .where(eq(trustedDevices.id, deviceId));
    return device;
  }

  async removeTrustedDevice(deviceId: string): Promise<void> {
    await db.delete(trustedDevices).where(eq(trustedDevices.id, deviceId));
  }

  async isTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
    const [device] = await db.select().from(trustedDevices)
      .where(and(eq(trustedDevices.userId, userId), eq(trustedDevices.deviceId, deviceId)));
    return !!device;
  }

  // ===== RESTRICTED ACCOUNTS =====

  async restrictAccount(userId: string, restrictedUserId: string, reason?: string): Promise<RestrictedAccount> {
    const [restricted] = await db.insert(restrictedAccounts).values({
      userId,
      restrictedUserId,
      reason,
    }).returning();
    return restricted;
  }

  async unrestrictAccount(userId: string, restrictedUserId: string): Promise<void> {
    await db.delete(restrictedAccounts)
      .where(and(eq(restrictedAccounts.userId, userId), eq(restrictedAccounts.restrictedUserId, restrictedUserId)));
  }

  async isRestricted(userId: string, restrictedUserId: string): Promise<boolean> {
    const [record] = await db.select().from(restrictedAccounts)
      .where(and(eq(restrictedAccounts.userId, userId), eq(restrictedAccounts.restrictedUserId, restrictedUserId)));
    return !!record;
  }

  async getRestrictedAccounts(userId: string): Promise<User[]> {
    const result = await db.select({ users }).from(restrictedAccounts)
      .innerJoin(users, eq(restrictedAccounts.restrictedUserId, users.id))
      .where(eq(restrictedAccounts.userId, userId));
    return result.map(r => r.users);
  }

  // ===== MUTED ACCOUNTS =====

  async muteAccount(userId: string, mutedUserId: string, options?: { mutePosts?: boolean; muteStories?: boolean; muteMessages?: boolean }): Promise<MutedAccount> {
    const [muted] = await db.insert(mutedAccounts).values({
      userId,
      mutedUserId,
      mutePosts: options?.mutePosts ?? true,
      muteStories: options?.muteStories ?? true,
      muteMessages: options?.muteMessages ?? false,
    }).returning();
    return muted;
  }

  async unmuteAccount(userId: string, mutedUserId: string): Promise<void> {
    await db.delete(mutedAccounts)
      .where(and(eq(mutedAccounts.userId, userId), eq(mutedAccounts.mutedUserId, mutedUserId)));
  }

  async isMuted(userId: string, mutedUserId: string): Promise<boolean> {
    const [record] = await db.select().from(mutedAccounts)
      .where(and(eq(mutedAccounts.userId, userId), eq(mutedAccounts.mutedUserId, mutedUserId)));
    return !!record;
  }

  async getMutedAccounts(userId: string): Promise<MutedAccount[]> {
    return db.select().from(mutedAccounts)
      .where(eq(mutedAccounts.userId, userId))
      .orderBy(desc(mutedAccounts.createdAt));
  }

  // ===== KEYWORD FILTERS =====

  async addKeywordFilter(userId: string, keyword: string, options?: { filterComments?: boolean; filterMessages?: boolean; filterPosts?: boolean }): Promise<KeywordFilter> {
    const [filter] = await db.insert(keywordFilters).values({
      userId,
      keyword: keyword.toLowerCase().trim(),
      filterComments: options?.filterComments ?? true,
      filterMessages: options?.filterMessages ?? true,
      filterPosts: options?.filterPosts ?? false,
    }).returning();
    return filter;
  }

  async getKeywordFilters(userId: string): Promise<KeywordFilter[]> {
    return db.select().from(keywordFilters)
      .where(eq(keywordFilters.userId, userId))
      .orderBy(desc(keywordFilters.createdAt));
  }

  async getKeywordFilter(filterId: string): Promise<KeywordFilter | undefined> {
    const [filter] = await db.select().from(keywordFilters)
      .where(eq(keywordFilters.id, filterId));
    return filter;
  }

  async updateKeywordFilter(filterId: string, data: Partial<KeywordFilter>): Promise<KeywordFilter | undefined> {
    const [updated] = await db.update(keywordFilters)
      .set(data)
      .where(eq(keywordFilters.id, filterId))
      .returning();
    return updated;
  }

  async removeKeywordFilter(filterId: string): Promise<void> {
    await db.delete(keywordFilters).where(eq(keywordFilters.id, filterId));
  }

  // ===== DRAFTS =====

  async createDraft(userId: string, data: Partial<Draft>): Promise<Draft> {
    const [draft] = await db.insert(drafts).values({
      userId,
      type: data.type || "TEXT",
      content: data.content,
      caption: data.caption,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl,
      durationMs: data.durationMs,
      aspectRatio: data.aspectRatio,
      visibility: data.visibility || "PUBLIC",
      commentsEnabled: data.commentsEnabled ?? true,
    }).returning();
    return draft;
  }

  async getDraft(draftId: string): Promise<Draft | undefined> {
    const [draft] = await db.select().from(drafts)
      .where(eq(drafts.id, draftId));
    return draft;
  }

  async getUserDrafts(userId: string): Promise<Draft[]> {
    return db.select().from(drafts)
      .where(eq(drafts.userId, userId))
      .orderBy(desc(drafts.updatedAt));
  }

  async updateDraft(draftId: string, data: Partial<Draft>): Promise<Draft | undefined> {
    const [updated] = await db.update(drafts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(drafts.id, draftId))
      .returning();
    return updated;
  }

  async deleteDraft(draftId: string): Promise<void> {
    await db.delete(drafts).where(eq(drafts.id, draftId));
  }

  // ===== SCHEDULED POSTS =====

  async createScheduledPost(userId: string, data: Omit<ScheduledPost, 'id' | 'userId' | 'createdAt' | 'status' | 'publishedPostId' | 'errorMessage'>): Promise<ScheduledPost> {
    const [scheduled] = await db.insert(scheduledPosts).values({
      userId,
      type: data.type || "TEXT",
      content: data.content,
      caption: data.caption,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl,
      durationMs: data.durationMs,
      aspectRatio: data.aspectRatio,
      visibility: data.visibility || "PUBLIC",
      commentsEnabled: data.commentsEnabled ?? true,
      scheduledFor: data.scheduledFor,
    }).returning();
    return scheduled;
  }

  async getScheduledPost(postId: string): Promise<ScheduledPost | undefined> {
    const [scheduled] = await db.select().from(scheduledPosts)
      .where(eq(scheduledPosts.id, postId));
    return scheduled;
  }

  async getUserScheduledPosts(userId: string): Promise<ScheduledPost[]> {
    return db.select().from(scheduledPosts)
      .where(eq(scheduledPosts.userId, userId))
      .orderBy(scheduledPosts.scheduledFor);
  }

  async updateScheduledPost(postId: string, data: Partial<ScheduledPost>): Promise<ScheduledPost | undefined> {
    const [updated] = await db.update(scheduledPosts)
      .set(data)
      .where(eq(scheduledPosts.id, postId))
      .returning();
    return updated;
  }

  async deleteScheduledPost(postId: string): Promise<void> {
    await db.delete(scheduledPosts).where(eq(scheduledPosts.id, postId));
  }

  async getPendingScheduledPosts(before: Date): Promise<ScheduledPost[]> {
    return db.select().from(scheduledPosts)
      .where(and(
        eq(scheduledPosts.status, "PENDING"),
        lte(scheduledPosts.scheduledFor, before)
      ))
      .orderBy(scheduledPosts.scheduledFor);
  }

  // ===== CLOSE FRIENDS =====

  async addCloseFriend(userId: string, friendId: string): Promise<CloseFriend> {
    const [friend] = await db.insert(closeFriends).values({
      userId,
      friendId,
    }).returning();
    return friend;
  }

  async removeCloseFriend(userId: string, friendId: string): Promise<void> {
    await db.delete(closeFriends)
      .where(and(eq(closeFriends.userId, userId), eq(closeFriends.friendId, friendId)));
  }

  async isCloseFriend(userId: string, friendId: string): Promise<boolean> {
    const [record] = await db.select().from(closeFriends)
      .where(and(eq(closeFriends.userId, userId), eq(closeFriends.friendId, friendId)));
    return !!record;
  }

  async getCloseFriends(userId: string): Promise<User[]> {
    const result = await db.select({ users }).from(closeFriends)
      .innerJoin(users, eq(closeFriends.friendId, users.id))
      .where(eq(closeFriends.userId, userId));
    return result.map(r => r.users);
  }

  // ===== STORY VIEWER RESTRICTIONS =====

  async addStoryViewerRestriction(userId: string, restrictedViewerId: string): Promise<StoryViewerRestriction> {
    const [restriction] = await db.insert(storyViewerRestrictions).values({
      userId,
      restrictedViewerId,
    }).returning();
    return restriction;
  }

  async removeStoryViewerRestriction(userId: string, restrictedViewerId: string): Promise<void> {
    await db.delete(storyViewerRestrictions)
      .where(and(eq(storyViewerRestrictions.userId, userId), eq(storyViewerRestrictions.restrictedViewerId, restrictedViewerId)));
  }

  async isStoryViewerRestricted(userId: string, viewerId: string): Promise<boolean> {
    const [record] = await db.select().from(storyViewerRestrictions)
      .where(and(eq(storyViewerRestrictions.userId, userId), eq(storyViewerRestrictions.restrictedViewerId, viewerId)));
    return !!record;
  }

  async getStoryViewerRestrictions(userId: string): Promise<User[]> {
    const result = await db.select({ users }).from(storyViewerRestrictions)
      .innerJoin(users, eq(storyViewerRestrictions.restrictedViewerId, users.id))
      .where(eq(storyViewerRestrictions.userId, userId));
    return result.map(r => r.users);
  }

  // ===== ADMIN USER NOTES =====

  async addAdminUserNote(userId: string, adminId: string, content: string): Promise<AdminUserNote> {
    const [note] = await db.insert(adminUserNotes).values({
      userId,
      adminId,
      content,
    }).returning();
    return note;
  }

  async getAdminUserNotes(userId: string): Promise<AdminUserNote[]> {
    return db.select().from(adminUserNotes)
      .where(eq(adminUserNotes.userId, userId))
      .orderBy(desc(adminUserNotes.createdAt));
  }

  async updateAdminUserNote(noteId: string, data: Partial<AdminUserNote>): Promise<AdminUserNote | undefined> {
    const [updated] = await db.update(adminUserNotes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(adminUserNotes.id, noteId))
      .returning();
    return updated;
  }

  async deleteAdminUserNote(noteId: string): Promise<void> {
    await db.delete(adminUserNotes).where(eq(adminUserNotes.id, noteId));
  }

  // ===== DATA EXPORT REQUESTS =====

  async createDataExportRequest(userId: string, options: { includeProfile?: boolean; includePosts?: boolean; includeMessages?: boolean; includeMedia?: boolean }): Promise<DataExportRequest> {
    const [request] = await db.insert(dataExportRequests).values({
      userId,
      includeProfile: options.includeProfile ?? true,
      includePosts: options.includePosts ?? true,
      includeMessages: options.includeMessages ?? true,
      includeMedia: options.includeMedia ?? false,
    }).returning();
    return request;
  }

  async getDataExportRequest(requestId: string): Promise<DataExportRequest | undefined> {
    const [request] = await db.select().from(dataExportRequests)
      .where(eq(dataExportRequests.id, requestId));
    return request;
  }

  async getUserDataExportRequests(userId: string): Promise<DataExportRequest[]> {
    return db.select().from(dataExportRequests)
      .where(eq(dataExportRequests.userId, userId))
      .orderBy(desc(dataExportRequests.createdAt));
  }

  async updateDataExportRequest(requestId: string, data: Partial<DataExportRequest>): Promise<DataExportRequest | undefined> {
    const [updated] = await db.update(dataExportRequests)
      .set(data)
      .where(eq(dataExportRequests.id, requestId))
      .returning();
    return updated;
  }

  async getPendingDataExportRequests(): Promise<DataExportRequest[]> {
    return db.select().from(dataExportRequests)
      .where(eq(dataExportRequests.status, "PENDING"))
      .orderBy(dataExportRequests.createdAt);
  }

  async triggerDataExport(userId: string, triggeredBy: string): Promise<DataExportRequest> {
    const [request] = await db.insert(dataExportRequests).values({
      userId,
      includeProfile: true,
      includePosts: true,
      includeMessages: true,
      includeMedia: true,
    }).returning();
    return request;
  }

  // ===== GOSSIP (Anonymous Posts) =====

  async createGossipPost(authorId: string, type: GossipType, data: { text?: string; mediaUrl?: string; thumbnailUrl?: string; durationMs?: number }): Promise<GossipPost> {
    const [post] = await db.insert(gossipPosts).values({
      authorUserId: authorId,
      type,
      text: data.text,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl,
      durationMs: data.durationMs,
    }).returning();
    return post;
  }

  async getGossipPosts(limit = 50, offset = 0): Promise<GossipPost[]> {
    return db.select().from(gossipPosts)
      .where(eq(gossipPosts.isDeleted, false))
      .orderBy(desc(gossipPosts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getGossipPost(id: string): Promise<GossipPost | undefined> {
    const [post] = await db.select().from(gossipPosts)
      .where(and(eq(gossipPosts.id, id), eq(gossipPosts.isDeleted, false)));
    return post;
  }

  async deleteGossipPost(id: string): Promise<void> {
    await db.update(gossipPosts)
      .set({ isDeleted: true })
      .where(eq(gossipPosts.id, id));
  }

  async likeGossipPost(userId: string, postId: string): Promise<GossipLike> {
    const [like] = await db.insert(gossipLikes).values({
      userId,
      gossipPostId: postId,
    }).returning();
    await db.update(gossipPosts)
      .set({ likeCount: sql`${gossipPosts.likeCount} + 1` })
      .where(eq(gossipPosts.id, postId));
    return like;
  }

  async unlikeGossipPost(userId: string, postId: string): Promise<void> {
    await db.delete(gossipLikes)
      .where(and(eq(gossipLikes.userId, userId), eq(gossipLikes.gossipPostId, postId)));
    await db.update(gossipPosts)
      .set({ likeCount: sql`GREATEST(${gossipPosts.likeCount} - 1, 0)` })
      .where(eq(gossipPosts.id, postId));
  }

  async hasUserLikedGossipPost(userId: string, postId: string): Promise<boolean> {
    const [like] = await db.select().from(gossipLikes)
      .where(and(eq(gossipLikes.userId, userId), eq(gossipLikes.gossipPostId, postId)));
    return !!like;
  }

  async createGossipComment(userId: string, postId: string, body: string): Promise<GossipComment> {
    const [comment] = await db.insert(gossipComments).values({
      userId,
      gossipPostId: postId,
      body,
    }).returning();
    await db.update(gossipPosts)
      .set({ commentCount: sql`${gossipPosts.commentCount} + 1` })
      .where(eq(gossipPosts.id, postId));
    return comment;
  }

  async getGossipComments(postId: string): Promise<Omit<GossipComment, 'userId'>[]> {
    const result = await db.select()
      .from(gossipComments)
      .where(eq(gossipComments.gossipPostId, postId))
      .orderBy(desc(gossipComments.createdAt));
    return result.map(({ userId, ...safeComment }) => safeComment);
  }

  async retweetGossipPost(userId: string, postId: string): Promise<GossipRetweet> {
    const [retweet] = await db.insert(gossipRetweets).values({
      userId,
      originalGossipPostId: postId,
    }).returning();
    await db.update(gossipPosts)
      .set({ retweetCount: sql`${gossipPosts.retweetCount} + 1` })
      .where(eq(gossipPosts.id, postId));
    return retweet;
  }

  async unretweetGossipPost(userId: string, postId: string): Promise<void> {
    await db.delete(gossipRetweets)
      .where(and(eq(gossipRetweets.userId, userId), eq(gossipRetweets.originalGossipPostId, postId)));
    await db.update(gossipPosts)
      .set({ retweetCount: sql`GREATEST(${gossipPosts.retweetCount} - 1, 0)` })
      .where(eq(gossipPosts.id, postId));
  }

  async hasUserRetweetedGossipPost(userId: string, postId: string): Promise<boolean> {
    const [retweet] = await db.select().from(gossipRetweets)
      .where(and(eq(gossipRetweets.userId, userId), eq(gossipRetweets.originalGossipPostId, postId)));
    return !!retweet;
  }

  // ===== MALL =====

  async getMallCategories(): Promise<MallCategory[]> {
    return db.select().from(mallCategories)
      .where(eq(mallCategories.isActive, true))
      .orderBy(mallCategories.name);
  }

  async getMallCategory(id: string): Promise<MallCategory | undefined> {
    const [category] = await db.select().from(mallCategories)
      .where(eq(mallCategories.id, id));
    return category;
  }

  async getMallItems(categoryId?: string): Promise<MallItem[]> {
    if (categoryId) {
      return db.select().from(mallItems)
        .where(and(eq(mallItems.categoryId, categoryId), eq(mallItems.isActive, true)))
        .orderBy(mallItems.value);
    }
    return db.select().from(mallItems)
      .where(eq(mallItems.isActive, true))
      .orderBy(mallItems.value);
  }

  // Get ALL mall items including inactive ones (for admin/refresh operations)
  async getAllMallItemsIncludingInactive(): Promise<MallItem[]> {
    return db.select().from(mallItems).orderBy(mallItems.value);
  }

  async getMallItem(id: string): Promise<MallItem | undefined> {
    const [item] = await db.select().from(mallItems)
      .where(eq(mallItems.id, id));
    return item;
  }

  async purchaseMallItem(userId: string, itemId: string, quantity = 1): Promise<MallPurchase> {
    const item = await this.getMallItem(itemId);
    if (!item) throw new Error("Item not found");
    
    // Use coinPrice if set, otherwise fall back to item value (1 coin = R1)
    const pricePerItem = item.coinPrice > 0 ? item.coinPrice : item.value;
    const totalCoinCost = pricePerItem * quantity;
    const netWorthGained = item.value * 10 * quantity;
    
    if (totalCoinCost <= 0) {
      throw new Error("Item has no valid price");
    }
    
    // Deduct coins from wallet
    await this.deductCoins(userId, totalCoinCost, "PURCHASE", `Mall purchase: ${item.name} x${quantity}`, "mall_item", itemId);
    
    const [purchase] = await db.insert(mallPurchases).values({
      userId,
      itemId,
      quantity,
      netWorthGained,
    }).returning();
    
    await db.update(users)
      .set({ netWorth: sql`COALESCE(${users.netWorth}, 0) + ${netWorthGained}` })
      .where(eq(users.id, userId));
    
    await this.addNetWorthEntry(userId, netWorthGained, "MALL_PURCHASE", "mall_item", itemId);
    
    return purchase;
  }

  // Admin function to add mall product to user
  async adminAddMallProduct(userId: string, itemId: string, quantity = 1, adminId: string): Promise<MallPurchase> {
    const item = await this.getMallItem(itemId);
    if (!item) throw new Error("Item not found");
    
    const netWorthGained = item.value * 10 * quantity;
    
    const [purchase] = await db.insert(mallPurchases).values({
      userId,
      itemId,
      quantity,
      netWorthGained,
    }).returning();
    
    await db.update(users)
      .set({ netWorth: sql`COALESCE(${users.netWorth}, 0) + ${netWorthGained}` })
      .where(eq(users.id, userId));
    
    await this.addNetWorthEntry(userId, netWorthGained, "MALL_PURCHASE", "mall_item", itemId);
    
    return purchase;
  }

  // Admin function to remove mall product from user
  async adminRemoveMallProduct(userId: string, purchaseId: string, adminId: string): Promise<{ removed: boolean; netWorthReduced: number }> {
    // Find the purchase
    const [purchase] = await db.select().from(mallPurchases)
      .where(and(eq(mallPurchases.id, purchaseId), eq(mallPurchases.userId, userId)));
    
    if (!purchase) {
      throw new Error("Purchase not found");
    }
    
    const netWorthToRemove = purchase.netWorthGained || 0;
    
    // Delete the purchase record
    await db.delete(mallPurchases).where(eq(mallPurchases.id, purchaseId));
    
    // Reduce user's net worth
    await db.update(users)
      .set({ netWorth: sql`GREATEST(0, COALESCE(${users.netWorth}, 0) - ${netWorthToRemove})` })
      .where(eq(users.id, userId));
    
    // Add negative net worth entry
    await this.addNetWorthEntry(userId, -netWorthToRemove, "ADMIN_ADJUST", "admin", adminId);
    
    return { removed: true, netWorthReduced: netWorthToRemove };
  }

  // Admin function to remove all mall products from user
  async adminRemoveAllMallProducts(userId: string, adminId: string): Promise<{ removed: number; netWorthReduced: number }> {
    // Get all purchases for user
    const purchases = await db.select().from(mallPurchases).where(eq(mallPurchases.userId, userId));
    
    if (purchases.length === 0) {
      return { removed: 0, netWorthReduced: 0 };
    }
    
    const totalNetWorth = purchases.reduce((sum, p) => sum + (p.netWorthGained || 0), 0);
    
    // Delete all purchase records
    await db.delete(mallPurchases).where(eq(mallPurchases.userId, userId));
    
    // Reduce user's net worth
    await db.update(users)
      .set({ netWorth: sql`GREATEST(0, COALESCE(${users.netWorth}, 0) - ${totalNetWorth})` })
      .where(eq(users.id, userId));
    
    // Add negative net worth entry
    await this.addNetWorthEntry(userId, -totalNetWorth, "ADMIN_ADJUST", "admin", adminId);
    
    return { removed: purchases.length, netWorthReduced: totalNetWorth };
  }

  async getUserPurchases(userId: string): Promise<(MallPurchase & { item: MallItem })[]> {
    const result = await db.select({
      purchase: mallPurchases,
      item: mallItems,
    }).from(mallPurchases)
      .innerJoin(mallItems, eq(mallPurchases.itemId, mallItems.id))
      .where(eq(mallPurchases.userId, userId))
      .orderBy(desc(mallPurchases.createdAt));
    return result.map(r => ({ ...r.purchase, item: r.item }));
  }

  async getTop50WealthyUsers(): Promise<Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'netWorth' | 'isVerified'>[]> {
    return db.select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      netWorth: users.netWorth,
      isVerified: users.isVerified,
    }).from(users)
      .leftJoin(userSettings, eq(users.id, userSettings.userId))
      .where(and(
        isNull(users.deactivatedAt), 
        isNotNull(users.netWorth),
        or(isNull(userSettings.privateAccount), eq(userSettings.privateAccount, false))
      ))
      .orderBy(desc(users.netWorth))
      .limit(50);
  }

  async getUserWealthRank(userId: string): Promise<number | null> {
    // Get the user's net worth
    const user = await this.getUser(userId);
    if (!user || user.netWorth === null) {
      return null;
    }
    
    // Count users with higher net worth (excluding deactivated users and private accounts)
    // This matches the filtering logic in getTop50WealthyUsers for consistency
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(users)
      .leftJoin(userSettings, eq(users.id, userSettings.userId))
      .where(and(
        isNull(users.deactivatedAt),
        isNotNull(users.netWorth),
        gt(users.netWorth, user.netWorth),
        or(isNull(userSettings.privateAccount), eq(userSettings.privateAccount, false))
      ));
    
    // Rank is count of users with higher net worth + 1
    // Convert to number to ensure proper arithmetic (PostgreSQL returns bigint as string)
    const countAbove = Number(result[0]?.count || 0);
    return countAbove + 1;
  }

  async addNetWorthEntry(userId: string, delta: number, reason: NetWorthReason, refType?: string, refId?: string): Promise<NetWorthLedgerEntry> {
    const [entry] = await db.insert(netWorthLedger).values({
      userId,
      delta,
      reason,
      refType,
      refId,
    }).returning();
    return entry;
  }

  async getNetWorthHistory(userId: string, limit = 50): Promise<NetWorthLedgerEntry[]> {
    return db.select().from(netWorthLedger)
      .where(eq(netWorthLedger.userId, userId))
      .orderBy(desc(netWorthLedger.createdAt))
      .limit(limit);
  }

  async createMallCategory(data: { name: string; description?: string | null }): Promise<MallCategory> {
    const [category] = await db.insert(mallCategories).values({
      name: data.name,
      description: data.description,
    }).returning();
    return category;
  }

  async updateMallCategory(id: string, data: { name?: string; description?: string | null; isActive?: boolean }): Promise<MallCategory | undefined> {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (Object.keys(updateData).length === 0) return this.getMallCategory(id);
    const [category] = await db.update(mallCategories)
      .set(updateData)
      .where(eq(mallCategories.id, id))
      .returning();
    return category;
  }

  async deleteMallCategory(id: string): Promise<void> {
    await db.delete(mallCategories).where(eq(mallCategories.id, id));
  }

  async createMallItem(data: { name: string; description: string; value: number; imageUrl?: string | null; categoryId: string }): Promise<MallItem> {
    const [item] = await db.insert(mallItems).values({
      name: data.name,
      description: data.description,
      value: data.value,
      imageUrl: data.imageUrl,
      categoryId: data.categoryId,
    }).returning();
    return item;
  }

  async updateMallItem(id: string, data: { name?: string; description?: string; value?: number; coinPrice?: number; imageUrl?: string | null; categoryId?: string; isActive?: boolean }): Promise<MallItem | undefined> {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.coinPrice !== undefined) updateData.coinPrice = data.coinPrice;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    updateData.updatedAt = new Date();
    if (Object.keys(updateData).length === 1) return this.getMallItem(id);
    const [item] = await db.update(mallItems)
      .set(updateData)
      .where(eq(mallItems.id, id))
      .returning();
    return item;
  }

  // Fix all mall items with coinPrice = 0 to use their value as coinPrice (1 coin = R1)
  async fixAllMallItemPrices(): Promise<{ fixed: number; total: number }> {
    const allItems = await this.getAllMallItemsIncludingInactive();
    let fixed = 0;
    
    for (const item of allItems) {
      if (!item.coinPrice || item.coinPrice === 0) {
        await db.update(mallItems)
          .set({ coinPrice: item.value, updatedAt: new Date() })
          .where(eq(mallItems.id, item.id));
        fixed++;
      }
    }
    
    return { fixed, total: allItems.length };
  }

  async deleteMallItem(id: string): Promise<void> {
    await db.delete(mallItems).where(eq(mallItems.id, id));
  }

  async getAllMallPurchases(): Promise<(MallPurchase & { item: MallItem; buyer: User })[]> {
    const result = await db.select({
      purchase: mallPurchases,
      item: mallItems,
      buyer: users,
    }).from(mallPurchases)
      .innerJoin(mallItems, eq(mallPurchases.itemId, mallItems.id))
      .innerJoin(users, eq(mallPurchases.userId, users.id))
      .orderBy(desc(mallPurchases.createdAt));
    return result.map(r => ({ ...r.purchase, item: r.item, buyer: r.buyer }));
  }

  // ===== MESSAGES INBOX =====

  async getUserConversationsByFolder(userId: string, folder: InboxFolder): Promise<ConversationWithParticipants[]> {
    const result = await db.select().from(conversations)
      .where(and(
        or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId)),
        eq(conversations.status, "ACCEPTED"),
        eq(conversations.inboxFolder, folder)
      ))
      .orderBy(desc(conversations.lastMessageAt));
    
    const enriched: ConversationWithParticipants[] = [];
    for (const conv of result) {
      const [participant1] = await db.select().from(users).where(eq(users.id, conv.participant1Id));
      const [participant2] = await db.select().from(users).where(eq(users.id, conv.participant2Id));
      if (participant1 && participant2) {
        enriched.push({ ...conv, participant1, participant2 });
      }
    }
    return enriched;
  }

  async getMessageRequests(userId: string): Promise<ConversationWithParticipants[]> {
    const result = await db.select().from(conversations)
      .where(and(
        or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId)),
        eq(conversations.status, "REQUEST")
      ))
      .orderBy(desc(conversations.lastMessageAt));
    
    const enriched: ConversationWithParticipants[] = [];
    for (const conv of result) {
      const [participant1] = await db.select().from(users).where(eq(users.id, conv.participant1Id));
      const [participant2] = await db.select().from(users).where(eq(users.id, conv.participant2Id));
      if (participant1 && participant2) {
        enriched.push({ ...conv, participant1, participant2 });
      }
    }
    return enriched;
  }

  async acceptMessageRequest(conversationId: string, userId: string): Promise<Conversation> {
    const [updated] = await db.update(conversations)
      .set({ 
        status: "ACCEPTED",
        acceptedAt: new Date(),
        inboxFolder: "PRIMARY",
      })
      .where(eq(conversations.id, conversationId))
      .returning();
    return updated;
  }

  async declineMessageRequest(conversationId: string): Promise<void> {
    await db.delete(conversations).where(eq(conversations.id, conversationId));
  }

  async updateConversationFolder(conversationId: string, folder: InboxFolder): Promise<Conversation> {
    const [updated] = await db.update(conversations)
      .set({ inboxFolder: folder })
      .where(eq(conversations.id, conversationId))
      .returning();
    return updated;
  }

  // ===== DISCOVER =====

  async getNewPeopleToFollow(userId: string, limit = 20): Promise<User[]> {
    const following = await this.getFollowing(userId);
    const followingIds = following.map(u => u.id);
    followingIds.push(userId);
    
    const hiddenIds = await this.getHiddenUserIds(userId);
    const excludeIds = [...new Set([...followingIds, ...hiddenIds])];
    
    // Fetch more candidates than needed for diversity shuffling
    const fetchLimit = limit * 3;
    
    let candidates: User[];
    if (excludeIds.length === 0) {
      candidates = await db.select().from(users)
        .where(isNull(users.deactivatedAt))
        .orderBy(
          desc(users.isVerified),
          desc(users.netWorth),
          desc(users.influenceScore),
          desc(users.createdAt)
        )
        .limit(fetchLimit);
    } else {
      candidates = await db.select().from(users)
        .where(and(
          isNull(users.deactivatedAt),
          sql`${users.id} NOT IN (${sql.raw(excludeIds.map(id => `'${id}'`).join(','))})`
        ))
        .orderBy(
          desc(users.isVerified),
          desc(users.netWorth),
          desc(users.influenceScore),
          desc(users.createdAt)
        )
        .limit(fetchLimit);
    }
    
    // Calculate a score for each user based on verified/netWorth/influence
    const scoredCandidates = candidates.map(user => ({
      ...user,
      id: user.id,
      authorId: user.id, // For diversity engine compatibility
      score: (user.isVerified ? 100 : 0) + 
             Math.min((user.netWorth || 0) / 100000, 50) + 
             Math.min((user.influenceScore || 0) / 1000, 30)
    }));
    
    // Apply diversity to prevent same-looking profiles clustering
    // For users, we can use shuffleWithinTiers for variety
    const shuffled = diversifyFeed(scoredCandidates, {
      minSpacing: 2,
      maxPerCreator: 1, // Each user appears only once anyway
      useScoreWeighting: true,
      shuffleTiers: true,
    });
    
    return shuffled.slice(0, limit);
  }

  async getReelsPosts(limit = 20, offset = 0): Promise<any[]> {
    const result = await db.select().from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(
        eq(posts.type, "VIDEO"),
        eq(posts.visibility, "PUBLIC"),
        isNull(posts.deletedAt)
      ))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
    return result.map(r => ({ 
      ...r.posts, 
      user: {
        id: r.users.id,
        username: r.users.username,
        displayName: r.users.displayName,
        avatarUrl: r.users.avatarUrl,
        isVerified: r.users.isVerified,
      }
    }));
  }

  async getAlgorithmReelsPosts(userId: string, limit = 50, offset = 0): Promise<any[]> {
    // Fetch more candidates for diversity processing
    const fetchLimit = Math.max(limit * 4, 100);
    
    const result = await db.select().from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(
        eq(posts.type, "VIDEO"),
        eq(posts.visibility, "PUBLIC"),
        isNull(posts.deletedAt)
      ))
      .orderBy(
        desc(users.isVerified),
        desc(users.netWorth),
        desc(users.influenceScore),
        desc(sql`${posts.likesCount} + ${posts.commentsCount} * 2 + ${posts.sharesCount} * 3`),
        desc(posts.createdAt)
      )
      .limit(fetchLimit);
    
    // Map to diversifiable format with scores
    const candidates = result.map(r => {
      const engagement = (r.posts.likesCount || 0) + (r.posts.commentsCount || 0) * 2 + (r.posts.sharesCount || 0) * 3;
      return {
        id: r.posts.id,
        authorId: r.posts.authorId,
        score: (r.users.isVerified ? 100 : 0) + 
               Math.min((r.users.netWorth || 0) / 100000, 50) + 
               Math.min((r.users.influenceScore || 0) / 1000, 30) +
               Math.min(engagement / 10, 20),
        post: r.posts,
        user: {
          id: r.users.id,
          username: r.users.username,
          displayName: r.users.displayName,
          avatarUrl: r.users.avatarUrl,
          isVerified: r.users.isVerified,
          netWorth: r.users.netWorth,
          influenceScore: r.users.influenceScore,
        }
      };
    });
    
    // Apply diversity - space out same-creator reels
    const diversified = diversifyFeed(candidates, {
      minSpacing: 5,      // At least 5 reels between same creator
      maxPerCreator: 3,   // Max 3 reels per creator
      useScoreWeighting: true,
      shuffleTiers: true,
    });
    
    // Apply offset and limit after diversity
    const paginated = diversified.slice(offset, offset + limit);
    
    return paginated.map(item => ({
      ...item.post,
      user: item.user,
    }));
  }

  async getExplorePosts(userId: string, limit = 200, offset = 0): Promise<any[]> {
    const result = await db.select().from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(
        eq(posts.visibility, "PUBLIC"),
        isNull(posts.deletedAt),
        ne(posts.authorId, userId),
        or(eq(posts.type, "PHOTO"), eq(posts.type, "VIDEO"))
      ))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
    return result.map(r => ({ 
      ...r.posts, 
      user: {
        id: r.users.id,
        username: r.users.username,
        displayName: r.users.displayName,
        avatarUrl: r.users.avatarUrl,
        isVerified: r.users.isVerified,
      }
    }));
  }

  async getVoicePosts(userId: string, limit = 30, offset = 0): Promise<any[]> {
    // Fetch more candidates for diversity processing
    const fetchLimit = Math.max(limit * 4, 80);
    
    const result = await db.select().from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(and(
        eq(posts.type, "VOICE"),
        eq(posts.visibility, "PUBLIC"),
        isNull(posts.deletedAt)
      ))
      .orderBy(
        desc(users.isVerified),
        desc(users.netWorth),
        desc(users.influenceScore),
        desc(sql`${posts.likesCount} + ${posts.commentsCount} * 2 + ${posts.sharesCount} * 3`),
        desc(posts.createdAt)
      )
      .limit(fetchLimit);
    
    // Map to diversifiable format with scores
    const candidates = result.map(r => {
      const engagement = (r.posts.likesCount || 0) + (r.posts.commentsCount || 0) * 2 + (r.posts.sharesCount || 0) * 3;
      return {
        id: r.posts.id,
        authorId: r.posts.authorId,
        score: (r.users.isVerified ? 100 : 0) + 
               Math.min((r.users.netWorth || 0) / 100000, 50) + 
               Math.min((r.users.influenceScore || 0) / 1000, 30) +
               Math.min(engagement / 10, 20),
        post: r.posts,
        user: {
          id: r.users.id,
          username: r.users.username,
          displayName: r.users.displayName,
          avatarUrl: r.users.avatarUrl,
          isVerified: r.users.isVerified,
          netWorth: r.users.netWorth,
          influenceScore: r.users.influenceScore,
        }
      };
    });
    
    // Apply diversity - space out same-creator voice notes
    const diversified = diversifyFeed(candidates, {
      minSpacing: 4,      // At least 4 voice notes between same creator
      maxPerCreator: 3,   // Max 3 voice notes per creator
      useScoreWeighting: true,
      shuffleTiers: true,
    });
    
    // Apply offset and limit after diversity
    const paginated = diversified.slice(offset, offset + limit);
    
    return paginated.map(item => ({
      ...item.post,
      user: item.user,
    }));
  }

  async getTrendingTopics(limit = 10): Promise<TrendDaily[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return db.select().from(trendsDaily)
      .where(gte(trendsDaily.windowStart, oneDayAgo))
      .orderBy(desc(trendsDaily.score))
      .limit(limit);
  }

  async getTrendingPosts(limit = 20): Promise<any[]> {
    const result = await db.select().from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(
        and(
          eq(posts.visibility, "PUBLIC"),
          isNull(posts.deletedAt)
        )
      )
      .orderBy(
        desc(sql`(${posts.likesCount} * 3 + ${posts.commentsCount} * 2 + ${posts.sharesCount} * 4 + ${posts.viewsCount})`)
      )
      .limit(limit);

    return result.map(r => ({
      ...r.posts,
      author: {
        id: r.users.id,
        username: r.users.username,
        displayName: r.users.displayName,
        avatarUrl: r.users.avatarUrl,
        isVerified: r.users.isVerified,
        netWorth: r.users.netWorth,
        influenceScore: r.users.influenceScore,
      },
      engagement: r.posts.likesCount * 3 + r.posts.commentsCount * 2 + r.posts.sharesCount * 4 + r.posts.viewsCount,
    }));
  }

  // ===== HIDDEN POSTS (Hide from feed) =====
  async hidePostFromFeed(userId: string, postId: string, reason?: string): Promise<void> {
    await db.insert(hiddenPosts)
      .values({ userId, postId, reason })
      .onConflictDoNothing();
  }

  async unhidePostFromFeed(userId: string, postId: string): Promise<void> {
    await db.delete(hiddenPosts)
      .where(and(eq(hiddenPosts.userId, userId), eq(hiddenPosts.postId, postId)));
  }

  async getHiddenPostIds(userId: string): Promise<string[]> {
    const result = await db.select({ postId: hiddenPosts.postId })
      .from(hiddenPosts)
      .where(eq(hiddenPosts.userId, userId));
    return result.map(r => r.postId);
  }

  async isPostHiddenByUser(userId: string, postId: string): Promise<boolean> {
    const [result] = await db.select()
      .from(hiddenPosts)
      .where(and(eq(hiddenPosts.userId, userId), eq(hiddenPosts.postId, postId)));
    return !!result;
  }

  // ===== NOT INTERESTED POSTS =====
  async markNotInterested(userId: string, postId: string, reason?: string): Promise<void> {
    await db.insert(notInterestedPosts)
      .values({ userId, postId, reason })
      .onConflictDoNothing();
  }

  async unmarkNotInterested(userId: string, postId: string): Promise<void> {
    await db.delete(notInterestedPosts)
      .where(and(eq(notInterestedPosts.userId, userId), eq(notInterestedPosts.postId, postId)));
  }

  async getNotInterestedPostIds(userId: string): Promise<string[]> {
    const result = await db.select({ postId: notInterestedPosts.postId })
      .from(notInterestedPosts)
      .where(eq(notInterestedPosts.userId, userId));
    return result.map(r => r.postId);
  }

  async isNotInterested(userId: string, postId: string): Promise<boolean> {
    const [result] = await db.select()
      .from(notInterestedPosts)
      .where(and(eq(notInterestedPosts.userId, userId), eq(notInterestedPosts.postId, postId)));
    return !!result;
  }

  // ===== DISCOVERY NOT INTERESTED (Content + Creators) =====
  async markDiscoveryNotInterested(
    userId: string, 
    targetId: string, 
    targetType: 'CONTENT' | 'CREATOR',
    reason?: string
  ): Promise<void> {
    await db.execute(sql`
      INSERT INTO not_interested (id, user_id, target_type, target_id, reason)
      VALUES (${crypto.randomUUID()}, ${userId}, ${targetType}, ${targetId}, ${reason || null})
      ON CONFLICT ON CONSTRAINT not_interested_user_target DO NOTHING
    `);
  }

  async unmarkDiscoveryNotInterested(userId: string, targetId: string, targetType: 'CONTENT' | 'CREATOR'): Promise<void> {
    await db.execute(sql`
      DELETE FROM not_interested 
      WHERE user_id = ${userId} AND target_type = ${targetType} AND target_id = ${targetId}
    `);
  }

  async getNotInterestedCreatorIds(userId: string): Promise<string[]> {
    const result = await db.execute(sql`
      SELECT target_id FROM not_interested 
      WHERE user_id = ${userId} AND target_type = 'CREATOR'
    `);
    return result.rows.map((r: any) => r.target_id);
  }

  async getNotInterestedContentIds(userId: string): Promise<string[]> {
    const result = await db.execute(sql`
      SELECT target_id FROM not_interested 
      WHERE user_id = ${userId} AND target_type = 'CONTENT'
    `);
    return result.rows.map((r: any) => r.target_id);
  }

  async getNotInterestedItems(userId: string): Promise<{content: string[], creators: string[]}> {
    const result = await db.execute(sql`
      SELECT target_id, target_type FROM not_interested 
      WHERE user_id = ${userId}
    `);
    
    const content: string[] = [];
    const creators: string[] = [];
    
    result.rows.forEach((row: any) => {
      if (row.target_type === 'CONTENT') {
        content.push(row.target_id);
      } else if (row.target_type === 'CREATOR') {
        creators.push(row.target_id);
      }
    });
    
    return { content, creators };
  }

  // ===== POST OWNER ACTIONS =====
  async archivePost(postId: string, authorId: string): Promise<Post | undefined> {
    const [post] = await db.update(posts)
      .set({ isArchived: true, archivedAt: new Date() })
      .where(and(eq(posts.id, postId), eq(posts.authorId, authorId)))
      .returning();
    return post;
  }

  async unarchivePost(postId: string, authorId: string): Promise<Post | undefined> {
    const [post] = await db.update(posts)
      .set({ isArchived: false, archivedAt: null })
      .where(and(eq(posts.id, postId), eq(posts.authorId, authorId)))
      .returning();
    return post;
  }

  async pinPost(postId: string, authorId: string): Promise<Post | undefined> {
    return await db.transaction(async (tx) => {
      await tx.update(posts)
        .set({ isPinned: false, pinnedAt: null })
        .where(and(eq(posts.authorId, authorId), eq(posts.isPinned, true)));
      
      const [post] = await tx.update(posts)
        .set({ isPinned: true, pinnedAt: new Date() })
        .where(and(eq(posts.id, postId), eq(posts.authorId, authorId)))
        .returning();
      return post;
    });
  }

  async unpinPost(postId: string, authorId: string): Promise<Post | undefined> {
    const [post] = await db.update(posts)
      .set({ isPinned: false, pinnedAt: null })
      .where(and(eq(posts.id, postId), eq(posts.authorId, authorId)))
      .returning();
    return post;
  }

  async deletePostPermanently(postId: string, authorId: string): Promise<boolean> {
    const [post] = await db.select().from(posts)
      .where(and(eq(posts.id, postId), eq(posts.authorId, authorId)));
    if (!post) return false;
    
    await db.transaction(async (tx) => {
      await tx.delete(likes).where(eq(likes.postId, postId));
      await tx.delete(comments).where(eq(comments.postId, postId));
      await tx.delete(bookmarks).where(eq(bookmarks.postId, postId));
      await tx.delete(shares).where(eq(shares.postId, postId));
      await tx.delete(postViews).where(eq(postViews.postId, postId));
      await tx.delete(playlistItems).where(eq(playlistItems.postId, postId));
      await tx.delete(pins).where(eq(pins.postId, postId));
      await tx.delete(postCollaborators).where(eq(postCollaborators.postId, postId));
      await tx.delete(pendingTagApprovals).where(eq(pendingTagApprovals.postId, postId));
      await tx.delete(savedPosts).where(eq(savedPosts.postId, postId));
      await tx.delete(hiddenPosts).where(eq(hiddenPosts.postId, postId));
      await tx.delete(notInterestedPosts).where(eq(notInterestedPosts.postId, postId));
      await tx.delete(posts).where(eq(posts.id, postId));
    });
    return true;
  }

  async editPost(postId: string, authorId: string, updates: { content?: string; caption?: string }): Promise<Post | undefined> {
    const [post] = await db.update(posts)
      .set({ 
        ...updates, 
        editedAt: new Date() 
      })
      .where(and(eq(posts.id, postId), eq(posts.authorId, authorId)))
      .returning();
    return post;
  }

  async toggleComments(postId: string, authorId: string, enabled: boolean): Promise<Post | undefined> {
    const [post] = await db.update(posts)
      .set({ commentsEnabled: enabled })
      .where(and(eq(posts.id, postId), eq(posts.authorId, authorId)))
      .returning();
    return post;
  }

  // ===== SAVED POSTS (using savedPosts table) =====
  async isPostSaved(userId: string, postId: string): Promise<boolean> {
    const result = await db.select().from(savedPosts)
      .where(and(eq(savedPosts.postId, postId), eq(savedPosts.userId, userId)));
    return result.length > 0;
  }

  async getSavedPosts(userId: string): Promise<PostWithAuthor[]> {
    const result = await db.select().from(savedPosts)
      .innerJoin(posts, eq(savedPosts.postId, posts.id))
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(savedPosts.userId, userId))
      .orderBy(desc(savedPosts.createdAt));
    return result.map(r => ({ ...r.posts, author: r.users }));
  }

  /**
   * Facebook/Instagram/TikTok-Style People Discovery Algorithm
   * 
   * Based on Meta's transparency docs and industry research, this algorithm scores users on:
   * 
   * TIER 1 - SOCIAL GRAPH (Highest Weight - 40%)
   * - Mutual connections (friends-of-friends) - strongest signal
   * - 2nd degree network (followers of your followers)
   * - People who follow you but you don't follow back
   * 
   * TIER 2 - ENGAGEMENT OVERLAP (25%)
   * - Users who like/comment on same posts as you
   * - Users who interact with same creators
   * - Content affinity (similar post types)
   * 
   * TIER 3 - PROFILE SIMILARITY (20%)
   * - Bio keyword matching
   * - Location proximity
   * - Interests overlap
   * - Similar net worth tier (RabitChat elite focus)
   * 
   * TIER 4 - USER QUALITY SIGNALS (15%)
   * - Verified status
   * - Profile completeness
   * - Activity recency
   * - Follower-to-following ratio
   * - Engagement rate
   */
  async getSuggestedPeople(userId: string, limit = 30): Promise<any[]> {
    try {
      // ========== PHASE 1: Gather User's Social Graph ==========
      const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
      if (!currentUser) throw new Error("User not found");
      
      const following = await this.getFollowing(userId);
      const followingIds = new Set(following.map(u => u.id));
      const followers = await this.getFollowers(userId);
      const followerIds = new Set(followers.map(u => u.id));
      
      // Get people user has blocked or been blocked by
      const hiddenIds = await this.getHiddenUserIds(userId);
      const excludeIds = new Set([...followingIds, userId, ...hiddenIds]);
      
      // ========== PHASE 2: Build Candidate Pool ==========
      // Strategy: Prioritize friends-of-friends, then expand to popular users
      
      // 2a. Get 2nd-degree connections (people your friends follow)
      const secondDegreeIds = new Set<string>();
      const secondDegreeCounts = new Map<string, number>(); // Track how many mutual paths
      
      for (const followedUser of following.slice(0, 50)) { // Limit for performance
        const theirFollowing = await this.getFollowing(followedUser.id);
        for (const user of theirFollowing) {
          if (!excludeIds.has(user.id)) {
            secondDegreeIds.add(user.id);
            secondDegreeCounts.set(user.id, (secondDegreeCounts.get(user.id) || 0) + 1);
          }
        }
      }
      
      // 2b. Get people who follow you but you don't follow back (high engagement probability)
      const pendingFollowBacks = followers.filter(f => !followingIds.has(f.id));
      
      // 2c. Get users who engage with same content (liked same posts in last 30 days)
      const userRecentLikes = await db.select({ postId: likes.postId })
        .from(likes)
        .where(and(
          eq(likes.userId, userId),
          gt(likes.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        ))
        .limit(100);
      
      const likedPostIds = userRecentLikes.map(l => l.postId);
      const engagementOverlapUsers = new Map<string, number>();
      
      if (likedPostIds.length > 0) {
        const otherLikers = await db.select({ userId: likes.userId })
          .from(likes)
          .where(and(
            inArray(likes.postId, likedPostIds),
            ne(likes.userId, userId)
          ))
          .limit(500);
        
        for (const liker of otherLikers) {
          if (!excludeIds.has(liker.userId)) {
            engagementOverlapUsers.set(liker.userId, (engagementOverlapUsers.get(liker.userId) || 0) + 1);
          }
        }
      }
      
      // 2d. Get popular/verified users as fallback discovery pool
      let fallbackCandidates: User[] = [];
      if (secondDegreeIds.size < limit * 2) {
        fallbackCandidates = await db.select().from(users)
          .where(and(
            isNull(users.deactivatedAt),
            ne(users.id, userId)
          ))
          .orderBy(desc(users.influenceScore))
          .limit(limit * 3);
      }
      
      // 2e. NEW USER GROWTH: Get fresh accounts (joined in last 14 days) for discovery
      // This helps new users get visibility and grow their following
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const newUsers = await db.select().from(users)
        .where(and(
          isNull(users.deactivatedAt),
          ne(users.id, userId),
          gt(users.createdAt, fourteenDaysAgo)
        ))
        .orderBy(desc(users.createdAt))
        .limit(Math.ceil(limit / 3)); // Reserve ~1/3 of slots for new users
      
      // 2f. Get users who recently engaged with YOUR content (reciprocity)
      // If someone liked/commented on your posts, you should discover them
      const myPosts = await db.select({ id: posts.id })
        .from(posts)
        .where(eq(posts.authorId, userId))
        .limit(50);
      
      const myPostIds = myPosts.map(p => p.id);
      const engagedWithMeUsers = new Set<string>();
      
      if (myPostIds.length > 0) {
        const recentEngagers = await db.select({ userId: likes.userId })
          .from(likes)
          .where(and(
            inArray(likes.postId, myPostIds),
            ne(likes.userId, userId),
            gt(likes.createdAt, new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))
          ))
          .limit(100);
        
        for (const engager of recentEngagers) {
          if (!excludeIds.has(engager.userId)) {
            engagedWithMeUsers.add(engager.userId);
          }
        }
      }
      
      // ========== PHASE 3: Fetch All Candidates ==========
      const allCandidateIds = new Set([
        ...secondDegreeIds,
        ...pendingFollowBacks.map(u => u.id),
        ...engagementOverlapUsers.keys(),
        ...fallbackCandidates.map(u => u.id),
        ...newUsers.map(u => u.id),           // NEW: Fresh accounts
        ...engagedWithMeUsers                  // NEW: People who engaged with you
      ]);
      
      // Remove excluded users
      for (const id of excludeIds) {
        allCandidateIds.delete(id);
      }
      
      if (allCandidateIds.size === 0) {
        return [];
      }
      
      const candidates = await db.select().from(users)
        .where(and(
          inArray(users.id, [...allCandidateIds]),
          isNull(users.deactivatedAt)
        ))
        .limit(limit * 5);
      
      // ========== PHASE 4: Score Each Candidate ==========
      const scoredCandidates = await Promise.all(candidates.map(async (candidate) => {
        try {
          let score = 0;
          const scoreBreakdown: Record<string, number> = {};
          
          // Get candidate's network
          const candidateFollowers = await this.getFollowers(candidate.id);
          const candidateFollowing = await this.getFollowing(candidate.id);
          const candidateFollowerIds = new Set(candidateFollowers.map(u => u.id));
          const candidateFollowingIds = new Set(candidateFollowing.map(u => u.id));
          
          // ----- TIER 1: SOCIAL GRAPH SIGNALS (40% weight, max 400 points) -----
          
          // 1a. Mutual connections - people you both know (STRONGEST SIGNAL)
          // Facebook reports 42% higher acceptance with more mutuals
          const mutualFollowers = candidateFollowers.filter(f => 
            followingIds.has(f.id) || followerIds.has(f.id)
          );
          const mutualScore = Math.min(mutualFollowers.length * 40, 200);
          score += mutualScore;
          scoreBreakdown.mutualConnections = mutualScore;
          
          // 1b. 2nd-degree connection strength (more paths = stronger connection)
          const secondDegreePathCount = secondDegreeCounts.get(candidate.id) || 0;
          const secondDegreeScore = Math.min(secondDegreePathCount * 25, 100);
          score += secondDegreeScore;
          scoreBreakdown.secondDegree = secondDegreeScore;
          
          // 1c. Follows you back probability - if they already follow you, they're interested
          const followsYou = candidateFollowingIds.has(userId);
          if (followsYou) {
            score += 100;
            scoreBreakdown.followsYou = 100;
          }
          
          // ----- TIER 2: ENGAGEMENT OVERLAP (25% weight, max 250 points) -----
          
          // 2a. Content engagement overlap (liked same posts)
          const engagementOverlap = engagementOverlapUsers.get(candidate.id) || 0;
          const engagementScore = Math.min(engagementOverlap * 15, 150);
          score += engagementScore;
          scoreBreakdown.engagementOverlap = engagementScore;
          
          // 2b. Content type affinity - check if they post similar content
          // (We'd need to analyze post types, for now use bio similarity)
          const userBio = (currentUser.bio || "").toLowerCase();
          const candidateBio = (candidate.bio || "").toLowerCase();
          if (userBio && candidateBio) {
            const commonWords = this.findCommonKeywords(userBio, candidateBio);
            const bioScore = Math.min(commonWords * 10, 100);
            score += bioScore;
            scoreBreakdown.bioSimilarity = bioScore;
          }
          
          // ----- TIER 3: PROFILE SIMILARITY (20% weight, max 200 points) -----
          
          // 3a. Net worth tier matching (RabitChat elite focus)
          const userNetWorth = currentUser.netWorth || 0;
          const candidateNetWorth = candidate.netWorth || 0;
          const wealthTierMatch = this.calculateWealthTierSimilarity(userNetWorth, candidateNetWorth);
          score += wealthTierMatch;
          scoreBreakdown.wealthTier = wealthTierMatch;
          
          // 3b. Location matching (if available in bio)
          // TODO: Add location field for better matching
          
          // ----- TIER 4: USER QUALITY SIGNALS (15% weight, max 150 points) -----
          
          // 4a. Verified status - high credibility
          if (candidate.isVerified) {
            score += 50;
            scoreBreakdown.verified = 50;
          }
          
          // 4b. Profile completeness
          const profileScore = this.calculateProfileCompleteness(candidate);
          score += profileScore;
          scoreBreakdown.profileComplete = profileScore;
          
          // 4c. Activity recency - prefer recently active users
          const lastActive = candidate.lastActiveAt || candidate.createdAt;
          const daysSinceActive = Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24));
          const recencyScore = Math.max(0, 30 - daysSinceActive);
          score += recencyScore;
          scoreBreakdown.recency = recencyScore;
          
          // 4d. Follower-to-following ratio (quality signal)
          const followerCount = candidateFollowers.length;
          const followingCount = candidateFollowing.length;
          if (followingCount > 0) {
            const ratio = followerCount / followingCount;
            const ratioScore = ratio >= 1 ? Math.min(ratio * 10, 30) : 0;
            score += ratioScore;
            scoreBreakdown.ratio = ratioScore;
          }
          
          // 4e. Influence score bonus
          const influenceBonus = Math.min((candidate.influenceScore || 0) / 50, 40);
          score += influenceBonus;
          scoreBreakdown.influence = influenceBonus;
          
          // ----- TIER 5: NEW USER GROWTH BOOST (Help new accounts get discovered) -----
          
          // 5a. New user boost - accounts created in last 14 days get visibility
          const accountAgeDays = Math.floor((Date.now() - new Date(candidate.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          if (accountAgeDays <= 14) {
            // Sliding scale: newer = more boost (max 75 points for brand new, decreasing over 14 days)
            const newUserBoost = Math.max(0, 75 - (accountAgeDays * 5));
            score += newUserBoost;
            scoreBreakdown.newUserBoost = newUserBoost;
          }
          
          // 5b. Engaged with you - if they liked/commented on your posts, high priority
          if (engagedWithMeUsers.has(candidate.id)) {
            score += 80; // Strong signal - they're interested in your content
            scoreBreakdown.engagedWithYou = 80;
          }
          
          // 5c. First content bonus - new users who have posted get extra visibility
          if (accountAgeDays <= 7) {
            const candidatePosts = await db.select({ id: posts.id })
              .from(posts)
              .where(eq(posts.authorId, candidate.id))
              .limit(1);
            
            if (candidatePosts.length > 0) {
              score += 40; // Reward new users who are actively posting
              scoreBreakdown.hasFirstPost = 40;
            }
          }
          
          // ----- DISCOVERY FACTOR (Prevent Filter Bubble) -----
          // Add small random factor for serendipitous discovery
          const discoveryFactor = Math.random() * 15;
          score += discoveryFactor;
          
          return {
            id: candidate.id,
            username: candidate.username,
            displayName: candidate.displayName,
            avatarUrl: candidate.avatarUrl,
            bio: candidate.bio,
            netWorth: candidate.netWorth,
            influenceScore: candidate.influenceScore,
            isVerified: candidate.isVerified,
            followersCount: followerCount,
            followingCount: followingCount,
            mutualFollowersCount: mutualFollowers.length,
            mutualFollowers: mutualFollowers.slice(0, 3).map(u => ({
              id: u.id,
              username: u.username,
              displayName: u.displayName,
              avatarUrl: u.avatarUrl
            })),
            followsYou,
            score: Math.round(score),
            scoreBreakdown
          };
        } catch (err) {
          console.error(`Error scoring candidate ${candidate.id}:`, err);
          return {
            id: candidate.id,
            username: candidate.username,
            displayName: candidate.displayName,
            avatarUrl: candidate.avatarUrl,
            bio: candidate.bio,
            netWorth: candidate.netWorth || 0,
            influenceScore: candidate.influenceScore || 0,
            isVerified: candidate.isVerified || false,
            followersCount: 0,
            followingCount: 0,
            mutualFollowersCount: 0,
            mutualFollowers: [],
            followsYou: false,
            score: Math.random() * 10
          };
        }
      }));
      
      // ========== PHASE 5: Final Ranking & Diversification ==========
      // Sort by score
      scoredCandidates.sort((a, b) => b.score - a.score);
      
      // Diversify results - don't show too many from same network cluster
      const diversified = this.diversifySuggestions(scoredCandidates, limit);
      
      return diversified;
    } catch (error) {
      console.error("getSuggestedPeople error:", error);
      throw error;
    }
  }
  
  /**
   * Find common keywords between two bio strings
   */
  private findCommonKeywords(bio1: string, bio2: string): number {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'i', 'my', 'me', 'we', 'you', 'it']);
    const words1 = new Set(bio1.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w)));
    const words2 = new Set(bio2.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w)));
    
    let commonCount = 0;
    for (const word of words1) {
      if (words2.has(word)) commonCount++;
    }
    return commonCount;
  }
  
  /**
   * Calculate wealth tier similarity for elite app matching
   */
  private calculateWealthTierSimilarity(worth1: number, worth2: number): number {
    const getTier = (w: number) => {
      if (w >= 10000000) return 5; // $10M+ Ultra Elite
      if (w >= 1000000) return 4;  // $1M+ Millionaire
      if (w >= 100000) return 3;   // $100K+ Wealthy
      if (w >= 10000) return 2;    // $10K+ Affluent
      return 1;                     // Emerging
    };
    
    const tier1 = getTier(worth1);
    const tier2 = getTier(worth2);
    const tierDiff = Math.abs(tier1 - tier2);
    
    // Same tier = 50 points, adjacent tier = 25 points, 2 tiers apart = 10 points
    if (tierDiff === 0) return 50;
    if (tierDiff === 1) return 25;
    if (tierDiff === 2) return 10;
    return 0;
  }
  
  /**
   * Calculate profile completeness score
   */
  private calculateProfileCompleteness(user: User): number {
    let score = 0;
    if (user.avatarUrl) score += 10;
    if (user.bio && user.bio.length > 20) score += 10;
    if (user.displayName && user.displayName !== user.username) score += 5;
    if (user.coverUrl) score += 5;
    return score;
  }
  
  /**
   * Diversify suggestions to prevent showing too many from same cluster
   */
  private diversifySuggestions(candidates: any[], limit: number): any[] {
    const result: any[] = [];
    const mutualCounts = new Map<number, number>(); // Track how many per mutual count
    
    for (const candidate of candidates) {
      if (result.length >= limit) break;
      
      const mutualCount = candidate.mutualFollowersCount;
      const currentMutualCount = mutualCounts.get(mutualCount) || 0;
      
      // Limit users with same mutual count to prevent cluster dominance
      if (mutualCount > 0 && currentMutualCount >= Math.ceil(limit / 3)) {
        continue; // Skip to add variety
      }
      
      result.push(candidate);
      mutualCounts.set(mutualCount, currentMutualCount + 1);
    }
    
    // Fill remaining slots if needed
    if (result.length < limit) {
      for (const candidate of candidates) {
        if (result.length >= limit) break;
        if (!result.includes(candidate)) {
          result.push(candidate);
        }
      }
    }
    
    return result;
  }

  // ================================================================================
  // DISCOVERY ALGORITHM - Content Rotation & Personalization (TikTok/Instagram-style)
  // ================================================================================

  /**
   * Record a content interaction (view, like, save, share, skip, rewatch)
   * This is the core data collection for the algorithm
   */
  async recordContentInteraction(data: {
    userId: string;
    contentId: string;
    contentType: 'REEL' | 'VOICE' | 'PHOTO' | 'TEXT' | 'STORY';
    interactionType: 'VIEW' | 'LIKE' | 'SAVE' | 'SHARE' | 'COMMENT' | 'SKIP' | 'REWATCH';
    watchTimeMs?: number;
    completionRate?: number;
    rewatchCount?: number;
    skippedAtMs?: number;
    creatorId?: string;
    sessionId?: string;
  }): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO content_interactions (
          id, user_id, content_id, content_type, interaction_type, 
          watch_time_ms, completion_rate, rewatch_count, skipped_at_ms,
          creator_id, session_id
        ) VALUES (
          ${crypto.randomUUID()}, ${data.userId}, ${data.contentId},
          ${data.contentType}::content_type, ${data.interactionType}::interaction_type,
          ${data.watchTimeMs || 0}, ${data.completionRate || 0}, ${data.rewatchCount || 0},
          ${data.skippedAtMs || null}, ${data.creatorId || null}, ${data.sessionId || null}
        )
      `);

      // Update creator affinity if this is meaningful engagement
      if (data.creatorId && ['LIKE', 'SAVE', 'SHARE', 'COMMENT', 'REWATCH'].includes(data.interactionType)) {
        await this.updateCreatorAffinity(data.userId, data.creatorId, data);
      }

      // Update user interest profile
      await this.updateUserInterestProfile(data.userId, data);

      // Mark content as seen
      await this.markContentAsSeen(data.userId, data.contentId, data.contentType, data.sessionId);

      // Update content fatigue
      await this.updateContentFatigue(data.contentId, data.contentType, data);

      // Update velocity for viral detection (track engagement velocity per hour)
      await this.updateContentVelocity(data.contentId, data.contentType, data.interactionType);
    } catch (error) {
      console.error("recordContentInteraction error:", error);
    }
  }

  /**
   * Update content velocity for viral/trending detection
   * Tracks engagement per hour since content creation
   */
  async updateContentVelocity(
    contentId: string,
    contentType: 'REEL' | 'VOICE' | 'PHOTO' | 'TEXT' | 'STORY',
    interactionType: string
  ): Promise<void> {
    try {
      // Get content creation time to calculate hour number
      const postResult = await db.execute(sql`
        SELECT created_at FROM posts WHERE id = ${contentId} LIMIT 1
      `);
      
      if (!postResult.rows.length) return;
      
      const createdAt = new Date(postResult.rows[0].created_at as string);
      const now = new Date();
      const hourNumber = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
      
      // Determine which field to increment
      const fieldMapping: Record<string, string> = {
        'VIEW': 'views',
        'LIKE': 'likes',
        'SHARE': 'shares',
        'SAVE': 'saves',
        'COMMENT': 'comments'
      };
      
      const field = fieldMapping[interactionType];
      if (!field) return;
      
      // Upsert velocity record for this content/hour
      await db.execute(sql`
        INSERT INTO content_velocity (id, content_id, content_type, hour_number, ${sql.raw(field)}, velocity_score)
        VALUES (
          ${crypto.randomUUID()}, 
          ${contentId}, 
          ${contentType}::content_type, 
          ${hourNumber}, 
          1,
          1.0
        )
        ON CONFLICT ON CONSTRAINT content_velocity_content_hour 
        DO UPDATE SET 
          ${sql.raw(field)} = content_velocity.${sql.raw(field)} + 1,
          velocity_score = (
            (content_velocity.views + 1) * 1.0 + 
            (content_velocity.likes + 1) * 2.0 + 
            (content_velocity.saves + 1) * 3.0 + 
            (content_velocity.shares + 1) * 4.0 + 
            (content_velocity.comments + 1) * 2.5
          ) / GREATEST(1, ${hourNumber + 1})
      `);
    } catch (error) {
      console.error("updateContentVelocity error:", error);
    }
  }

  /**
   * Get high-velocity (viral) content IDs for boosting in feeds
   * Returns content that's gaining engagement faster than normal
   */
  async getViralContentIds(contentType?: string, limit: number = 50): Promise<string[]> {
    try {
      const result = await db.execute(sql`
        SELECT DISTINCT content_id 
        FROM content_velocity
        WHERE velocity_score > 5.0
          AND recorded_at > NOW() - INTERVAL '24 hours'
          ${contentType ? sql`AND content_type = ${contentType}::content_type` : sql``}
        ORDER BY velocity_score DESC
        LIMIT ${limit}
      `);
      
      return result.rows.map((row: any) => row.content_id);
    } catch (error) {
      console.error("getViralContentIds error:", error);
      return [];
    }
  }

  /**
   * Mark content as seen (prevents repeats within session/timeframe)
   */
  async markContentAsSeen(
    userId: string, 
    contentId: string, 
    contentType: 'REEL' | 'VOICE' | 'PHOTO' | 'TEXT' | 'STORY',
    sessionId?: string
  ): Promise<void> {
    // Content expires after 24 hours (user might want to see it again later)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await db.execute(sql`
      INSERT INTO seen_content (id, user_id, content_id, content_type, session_id, expires_at)
      VALUES (${crypto.randomUUID()}, ${userId}, ${contentId}, ${contentType}::content_type, ${sessionId || null}, ${expiresAt})
      ON CONFLICT (user_id, content_id) DO UPDATE SET
        seen_at = NOW(),
        session_id = COALESCE(EXCLUDED.session_id, seen_content.session_id)
    `);
  }

  /**
   * Mark profile as seen in discovery (prevents repeats)
   */
  async markProfileAsSeen(userId: string, profileId: string, sessionId?: string): Promise<void> {
    // Profile suggestions expire after 6 hours (faster rotation for people)
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
    
    await db.execute(sql`
      INSERT INTO seen_profiles (id, user_id, profile_id, session_id, expires_at)
      VALUES (${crypto.randomUUID()}, ${userId}, ${profileId}, ${sessionId || null}, ${expiresAt})
      ON CONFLICT (user_id, profile_id) DO UPDATE SET
        seen_at = NOW(),
        session_id = COALESCE(EXCLUDED.session_id, seen_profiles.session_id)
    `);
  }

  /**
   * Get list of seen content IDs for a user (to exclude from feeds)
   */
  async getSeenContentIds(userId: string, contentType?: string): Promise<string[]> {
    const result = await db.execute(sql`
      SELECT content_id FROM seen_content 
      WHERE user_id = ${userId} 
        AND expires_at > NOW()
        ${contentType ? sql`AND content_type = ${contentType}::content_type` : sql``}
    `);
    return (result.rows as any[]).map(r => r.content_id);
  }

  /**
   * Get list of seen profile IDs for a user (to exclude from suggestions)
   */
  async getSeenProfileIds(userId: string): Promise<string[]> {
    const result = await db.execute(sql`
      SELECT profile_id FROM seen_profiles 
      WHERE user_id = ${userId} AND expires_at > NOW()
    `);
    return (result.rows as any[]).map(r => r.profile_id);
  }

  /**
   * Update or create user interest profile based on engagement
   */
  async updateUserInterestProfile(userId: string, interaction: {
    contentType: string;
    interactionType: string;
    watchTimeMs?: number;
    completionRate?: number;
  }): Promise<void> {
    // Get or create profile
    const existing = await db.execute(sql`
      SELECT * FROM user_interest_profiles WHERE user_id = ${userId}
    `);

    // Calculate preference delta based on interaction
    let prefDelta = 0;
    if (interaction.interactionType === 'SAVE') prefDelta = 10;
    else if (interaction.interactionType === 'SHARE') prefDelta = 8;
    else if (interaction.interactionType === 'COMMENT') prefDelta = 5;
    else if (interaction.interactionType === 'LIKE') prefDelta = 3;
    else if (interaction.interactionType === 'VIEW' && (interaction.completionRate || 0) > 0.8) prefDelta = 2;
    else if (interaction.interactionType === 'SKIP') prefDelta = -5;
    else if (interaction.interactionType === 'REWATCH') prefDelta = 15; // Highest signal!

    const contentTypeField = interaction.contentType.toLowerCase() + '_preference';
    
    if (existing.rows.length === 0) {
      await db.execute(sql`
        INSERT INTO user_interest_profiles (
          id, user_id, reel_preference, voice_preference, photo_preference, text_preference,
          avg_watch_time_ms, avg_completion_rate, total_interactions
        ) VALUES (
          ${crypto.randomUUID()}, ${userId}, 50, 50, 50, 50,
          ${interaction.watchTimeMs || 0}, ${interaction.completionRate || 0}, 1
        )
      `);
    } else {
      const profile = existing.rows[0] as any;
      const newWatchTime = Math.round((profile.avg_watch_time_ms * profile.total_interactions + (interaction.watchTimeMs || 0)) / (profile.total_interactions + 1));
      const newCompletionRate = (profile.avg_completion_rate * profile.total_interactions + (interaction.completionRate || 0)) / (profile.total_interactions + 1);
      
      // Dynamic SQL update based on content type
      const updateField = (field: string, value: number) => {
        return sql`${sql.raw(field)} = LEAST(100, GREATEST(0, ${sql.raw(field)} + ${value}))`;
      };

      await db.execute(sql`
        UPDATE user_interest_profiles SET
          ${interaction.contentType === 'REEL' ? sql`reel_preference = LEAST(100, GREATEST(0, reel_preference + ${prefDelta})),` : sql``}
          ${interaction.contentType === 'VOICE' ? sql`voice_preference = LEAST(100, GREATEST(0, voice_preference + ${prefDelta})),` : sql``}
          ${interaction.contentType === 'PHOTO' ? sql`photo_preference = LEAST(100, GREATEST(0, photo_preference + ${prefDelta})),` : sql``}
          ${interaction.contentType === 'TEXT' ? sql`text_preference = LEAST(100, GREATEST(0, text_preference + ${prefDelta})),` : sql``}
          avg_watch_time_ms = ${newWatchTime},
          avg_completion_rate = ${newCompletionRate},
          total_interactions = total_interactions + 1,
          updated_at = NOW()
        WHERE user_id = ${userId}
      `);
    }
  }

  /**
   * Update creator affinity score (how much a user engages with a specific creator)
   */
  async updateCreatorAffinity(userId: string, creatorId: string, interaction: {
    interactionType: string;
    watchTimeMs?: number;
    completionRate?: number;
  }): Promise<void> {
    // Calculate affinity delta
    let affinityDelta = 0;
    if (interaction.interactionType === 'SAVE') affinityDelta = 20;
    else if (interaction.interactionType === 'SHARE') affinityDelta = 15;
    else if (interaction.interactionType === 'COMMENT') affinityDelta = 10;
    else if (interaction.interactionType === 'LIKE') affinityDelta = 5;
    else if (interaction.interactionType === 'REWATCH') affinityDelta = 25;

    await db.execute(sql`
      INSERT INTO creator_affinities (
        id, user_id, creator_id, affinity_score, total_views, total_likes, total_shares, total_saves,
        avg_watch_time_ms, avg_completion_rate, last_interacted_at
      ) VALUES (
        ${crypto.randomUUID()}, ${userId}, ${creatorId}, ${affinityDelta}, 
        ${interaction.interactionType === 'VIEW' ? 1 : 0},
        ${interaction.interactionType === 'LIKE' ? 1 : 0},
        ${interaction.interactionType === 'SHARE' ? 1 : 0},
        ${interaction.interactionType === 'SAVE' ? 1 : 0},
        ${interaction.watchTimeMs || 0}, ${interaction.completionRate || 0}, NOW()
      )
      ON CONFLICT (user_id, creator_id) DO UPDATE SET
        affinity_score = creator_affinities.affinity_score + ${affinityDelta},
        total_views = creator_affinities.total_views + ${interaction.interactionType === 'VIEW' ? 1 : 0},
        total_likes = creator_affinities.total_likes + ${interaction.interactionType === 'LIKE' ? 1 : 0},
        total_shares = creator_affinities.total_shares + ${interaction.interactionType === 'SHARE' ? 1 : 0},
        total_saves = creator_affinities.total_saves + ${interaction.interactionType === 'SAVE' ? 1 : 0},
        avg_watch_time_ms = (creator_affinities.avg_watch_time_ms * creator_affinities.total_views + ${interaction.watchTimeMs || 0}) / (creator_affinities.total_views + 1),
        avg_completion_rate = (creator_affinities.avg_completion_rate * creator_affinities.total_views + ${interaction.completionRate || 0}) / (creator_affinities.total_views + 1),
        last_interacted_at = NOW(),
        updated_at = NOW()
    `);
  }

  /**
   * Update content fatigue score (prevents over-showing the same content)
   */
  async updateContentFatigue(contentId: string, contentType: string, interaction: {
    interactionType: string;
    watchTimeMs?: number;
    completionRate?: number;
  }): Promise<void> {
    const isSkip = interaction.interactionType === 'SKIP';
    
    await db.execute(sql`
      INSERT INTO content_fatigue (
        id, content_id, content_type, total_impressions, total_skips, skip_rate,
        avg_watch_time_ms, avg_completion_rate, fatigue_score, last_shown_at
      ) VALUES (
        ${crypto.randomUUID()}, ${contentId}, ${contentType}::content_type, 1, ${isSkip ? 1 : 0}, ${isSkip ? 1.0 : 0.0},
        ${interaction.watchTimeMs || 0}, ${interaction.completionRate || 0}, ${isSkip ? 10 : -2}, NOW()
      )
      ON CONFLICT (content_id) DO UPDATE SET
        total_impressions = content_fatigue.total_impressions + 1,
        total_skips = content_fatigue.total_skips + ${isSkip ? 1 : 0},
        skip_rate = (content_fatigue.total_skips + ${isSkip ? 1 : 0})::REAL / (content_fatigue.total_impressions + 1)::REAL,
        avg_watch_time_ms = (content_fatigue.avg_watch_time_ms * content_fatigue.total_impressions + ${interaction.watchTimeMs || 0}) / (content_fatigue.total_impressions + 1),
        avg_completion_rate = (content_fatigue.avg_completion_rate * content_fatigue.total_impressions + ${interaction.completionRate || 0}) / (content_fatigue.total_impressions + 1),
        fatigue_score = LEAST(100, content_fatigue.fatigue_score + ${isSkip ? 10 : -2}),
        last_shown_at = NOW(),
        updated_at = NOW()
    `);
  }

  /**
   * Get top creator affinities for a user (who they engage with most)
   */
  async getTopCreatorAffinities(userId: string, limit: number = 20): Promise<string[]> {
    const result = await db.execute(sql`
      SELECT creator_id FROM creator_affinities 
      WHERE user_id = ${userId}
      ORDER BY affinity_score DESC
      LIMIT ${limit}
    `);
    return (result.rows as any[]).map(r => r.creator_id);
  }

  /**
   * Get user's content type preferences
   */
  async getUserContentPreferences(userId: string): Promise<{
    reelPreference: number;
    voicePreference: number;
    photoPreference: number;
    textPreference: number;
  } | null> {
    const result = await db.execute(sql`
      SELECT reel_preference, voice_preference, photo_preference, text_preference
      FROM user_interest_profiles WHERE user_id = ${userId}
    `);
    if (result.rows.length === 0) return null;
    const row = result.rows[0] as any;
    return {
      reelPreference: row.reel_preference,
      voicePreference: row.voice_preference,
      photoPreference: row.photo_preference,
      textPreference: row.text_preference
    };
  }

  /**
   * Get personalized content feed with rotation (like TikTok/Instagram Reels)
   * This is the main recommendation engine
   */
  async getPersonalizedContentFeed(
    userId: string,
    contentType: 'REEL' | 'VOICE' | 'PHOTO' | 'TEXT',
    options: {
      limit?: number;
      sessionId?: string;
      excludeIds?: string[];
    } = {}
  ): Promise<any[]> {
    const limit = options.limit || 20;
    
    // Get exclusions: seen content + not interested
    const seenIds = await this.getSeenContentIds(userId, contentType);
    const notInterestedIds = await this.getNotInterestedContentIds(userId);
    const allExclusions = new Set([...seenIds, ...notInterestedIds, ...(options.excludeIds || [])]);
    
    // Get user's preferred creators
    const topCreators = await this.getTopCreatorAffinities(userId, 10);
    
    // Get user's following list for priority content
    const following = await this.getFollowing(userId);
    const followingIds = following.map(f => f.id);
    
    // Content query based on type
    let contentQuery;
    if (contentType === 'REEL' || contentType === 'VOICE') {
      contentQuery = sql`
        SELECT p.*, u.username, u.display_name, u.avatar_url, u.verified,
          CASE 
            WHEN p.author_id = ANY(${followingIds}::varchar[]) THEN 100
            WHEN p.author_id = ANY(${topCreators}::varchar[]) THEN 80
            ELSE 0
          END as creator_boost,
          COALESCE(cf.fatigue_score, 0) as fatigue_penalty,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
          EXTRACT(EPOCH FROM NOW() - p.created_at) / 3600 as hours_old
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN content_fatigue cf ON p.id = cf.content_id
        WHERE p.media_type = ${contentType}
          AND p.visibility = 'PUBLIC'
          AND p.id NOT IN (SELECT unnest(${[...allExclusions].length > 0 ? [...allExclusions] : ['']}::varchar[]))
          AND p.author_id != ${userId}
        ORDER BY 
          creator_boost DESC,
          (like_count + comment_count * 2) - fatigue_penalty DESC,
          RANDOM() * 10 DESC
        LIMIT ${limit * 2}
      `;
    } else {
      contentQuery = sql`
        SELECT p.*, u.username, u.display_name, u.avatar_url, u.verified,
          CASE 
            WHEN p.author_id = ANY(${followingIds}::varchar[]) THEN 100
            WHEN p.author_id = ANY(${topCreators}::varchar[]) THEN 80
            ELSE 0
          END as creator_boost,
          COALESCE(cf.fatigue_score, 0) as fatigue_penalty,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        LEFT JOIN content_fatigue cf ON p.id = cf.content_id
        WHERE p.media_type = ${contentType}
          AND p.visibility = 'PUBLIC'
          AND p.id NOT IN (SELECT unnest(${[...allExclusions].length > 0 ? [...allExclusions] : ['']}::varchar[]))
          AND p.author_id != ${userId}
        ORDER BY 
          creator_boost DESC,
          (like_count + comment_count * 2) - fatigue_penalty DESC,
          RANDOM() * 10 DESC
        LIMIT ${limit * 2}
      `;
    }
    
    const result = await db.execute(contentQuery);
    let posts = result.rows as any[];
    
    // Shuffle to add variety (prevents predictable ordering)
    posts = this.shuffleWithSeed(posts, options.sessionId || userId);
    
    // Take only the requested limit
    return posts.slice(0, limit);
  }

  /**
   * Shuffle array with consistent seed (same session = same shuffle)
   */
  private shuffleWithSeed(array: any[], seed: string): any[] {
    const shuffled = [...array];
    let seedNum = this.hashCode(seed);
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      seedNum = (seedNum * 9301 + 49297) % 233280;
      const j = Math.floor((seedNum / 233280) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Clean up expired seen content/profiles (run periodically)
   */
  async cleanupExpiredSeenItems(): Promise<void> {
    await db.execute(sql`DELETE FROM seen_content WHERE expires_at < NOW()`);
    await db.execute(sql`DELETE FROM seen_profiles WHERE expires_at < NOW()`);
  }

  // ============================================
  // PASSWORD RESET & EMAIL VERIFICATION
  // ============================================

  /**
   * Create a password reset token (6-digit code)
   */
  async createPasswordResetToken(userId: string): Promise<string> {
    // Generate 6-digit code
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Invalidate any existing tokens for this user
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(
        eq(passwordResetTokens.userId, userId),
        isNull(passwordResetTokens.usedAt)
      ));

    // Create new token
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });

    return token;
  }

  /**
   * Verify a password reset token
   */
  async verifyPasswordResetToken(email: string, token: string): Promise<{ valid: boolean; userId?: string }> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return { valid: false };
    }

    const [resetToken] = await db.select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.userId, user.id),
        eq(passwordResetTokens.token, token),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      ))
      .limit(1);

    if (!resetToken) {
      return { valid: false };
    }

    return { valid: true, userId: user.id };
  }

  /**
   * Mark password reset token as used
   */
  async markPasswordResetTokenUsed(userId: string, token: string): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(
        eq(passwordResetTokens.userId, userId),
        eq(passwordResetTokens.token, token)
      ));
  }

  /**
   * Create an email verification token (6-digit code)
   */
  async createEmailVerificationToken(userId: string, email: string): Promise<string> {
    // Generate 6-digit code
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate any existing tokens for this user/email
    await db.update(emailVerificationTokens)
      .set({ verifiedAt: new Date() })
      .where(and(
        eq(emailVerificationTokens.userId, userId),
        isNull(emailVerificationTokens.verifiedAt)
      ));

    // Create new token
    await db.insert(emailVerificationTokens).values({
      userId,
      email,
      token,
      expiresAt,
    });

    return token;
  }

  /**
   * Verify an email verification token
   */
  async verifyEmailToken(userId: string, token: string): Promise<{ valid: boolean; email?: string }> {
    const [verificationToken] = await db.select()
      .from(emailVerificationTokens)
      .where(and(
        eq(emailVerificationTokens.userId, userId),
        eq(emailVerificationTokens.token, token),
        isNull(emailVerificationTokens.verifiedAt),
        gt(emailVerificationTokens.expiresAt, new Date())
      ))
      .limit(1);

    if (!verificationToken) {
      return { valid: false };
    }

    // Mark as verified
    await db.update(emailVerificationTokens)
      .set({ verifiedAt: new Date() })
      .where(eq(emailVerificationTokens.id, verificationToken.id));

    return { valid: true, email: verificationToken.email };
  }

  /**
   * Update user password
   */
  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  // ===== PAYFAST ORDERS =====

  async createPayfastOrder(data: InsertPayfastOrder): Promise<PayfastOrder> {
    const [order] = await db.insert(payfastOrders).values(data).returning();
    return order;
  }

  async getPayfastOrder(orderId: string): Promise<PayfastOrder | undefined> {
    const [order] = await db.select().from(payfastOrders).where(eq(payfastOrders.id, orderId));
    return order;
  }

  async getPayfastOrderByPaymentId(pfPaymentId: string): Promise<PayfastOrder | undefined> {
    const [order] = await db.select().from(payfastOrders).where(eq(payfastOrders.pfPaymentId, pfPaymentId));
    return order;
  }

  async updatePayfastOrder(orderId: string, data: Partial<PayfastOrder>): Promise<PayfastOrder | undefined> {
    const [order] = await db.update(payfastOrders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(payfastOrders.id, orderId))
      .returning();
    return order;
  }

  async completePayfastOrder(orderId: string, itnData: {
    pfPaymentId: string;
    paymentStatus: string;
    amountGross: string;
    amountFee: string;
    amountNet: string;
    signature: string;
    itnPayload: string;
  }): Promise<PayfastOrder | undefined> {
    const [order] = await db.update(payfastOrders)
      .set({
        status: "COMPLETE",
        pfPaymentId: itnData.pfPaymentId,
        paymentStatus: itnData.paymentStatus,
        amountGross: itnData.amountGross,
        amountFee: itnData.amountFee,
        amountNet: itnData.amountNet,
        signature: itnData.signature,
        itnPayload: itnData.itnPayload,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payfastOrders.id, orderId))
      .returning();
    return order;
  }

  async getUserPayfastOrders(userId: string): Promise<PayfastOrder[]> {
    return db.select().from(payfastOrders)
      .where(eq(payfastOrders.userId, userId))
      .orderBy(desc(payfastOrders.createdAt));
  }

  // ===== ADMIN 2FA MANAGEMENT =====

  async getAdmin2FAStats(): Promise<{ total: number; enabled: number; disabled: number }> {
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const total = Number(totalResult[0]?.count || 0);
    
    const enabledResult = await db.select({ count: sql<number>`count(*)` })
      .from(totpSecrets)
      .where(eq(totpSecrets.isEnabled, true));
    const enabled = Number(enabledResult[0]?.count || 0);
    
    const disabled = total - enabled;
    
    return { total, enabled, disabled };
  }

  async getAdminTotpSecrets(options: { page?: number; limit?: number; search?: string }): Promise<{ secrets: (TotpSecret & { user: User })[], total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    const search = options.search?.trim() || "";
    
    let baseQuery = db.select({
      totp: totpSecrets,
      user: users
    })
      .from(totpSecrets)
      .innerJoin(users, eq(totpSecrets.userId, users.id));
    
    if (search) {
      baseQuery = baseQuery.where(
        or(
          ilike(users.username, `%${search}%`),
          ilike(users.displayName, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      ) as typeof baseQuery;
    }
    
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(totpSecrets)
      .innerJoin(users, eq(totpSecrets.userId, users.id))
      .where(search ? or(
        ilike(users.username, `%${search}%`),
        ilike(users.displayName, `%${search}%`),
        ilike(users.email, `%${search}%`)
      ) : undefined);
    
    const total = Number(countResult[0]?.count || 0);
    
    const results = await baseQuery
      .orderBy(desc(totpSecrets.createdAt))
      .limit(limit)
      .offset(offset);
    
    const secrets = results.map(r => ({
      ...r.totp,
      user: r.user
    }));
    
    return { secrets, total };
  }

  async adminReset2FA(userId: string): Promise<void> {
    await db.delete(backupCodes).where(eq(backupCodes.userId, userId));
    await db.delete(totpSecrets).where(eq(totpSecrets.userId, userId));
  }

  async getAdminUserBackupCodesCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(backupCodes)
      .where(and(
        eq(backupCodes.userId, userId),
        isNull(backupCodes.usedAt)
      ));
    return Number(result[0]?.count || 0);
  }

  // ===== ADMIN SESSION MANAGEMENT =====

  async getAdminSessionStats(): Promise<{ total: number; active: number; inactive: number }> {
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(loginSessions);
    const total = Number(totalResult[0]?.count || 0);
    
    const activeResult = await db.select({ count: sql<number>`count(*)` })
      .from(loginSessions)
      .where(eq(loginSessions.isActive, true));
    const active = Number(activeResult[0]?.count || 0);
    
    const inactive = total - active;
    
    return { total, active, inactive };
  }

  async getAdminLoginSessions(options: { page?: number; limit?: number; search?: string; activeOnly?: boolean }): Promise<{ sessions: (LoginSession & { user: User })[], total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    const search = options.search?.trim() || "";
    const activeOnly = options.activeOnly || false;
    
    const conditions: SQL[] = [];
    
    if (activeOnly) {
      conditions.push(eq(loginSessions.isActive, true));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(users.username, `%${search}%`),
          ilike(users.displayName, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )!
      );
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(loginSessions)
      .innerJoin(users, eq(loginSessions.userId, users.id))
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);
    
    const results = await db.select({
      session: loginSessions,
      user: users
    })
      .from(loginSessions)
      .innerJoin(users, eq(loginSessions.userId, users.id))
      .where(whereClause)
      .orderBy(desc(loginSessions.lastActiveAt))
      .limit(limit)
      .offset(offset);
    
    const sessions = results.map(r => ({
      ...r.session,
      user: r.user
    }));
    
    return { sessions, total };
  }

  async adminTerminateSession(sessionId: string): Promise<void> {
    await db.update(loginSessions)
      .set({ isActive: false })
      .where(eq(loginSessions.id, sessionId));
  }

  async adminTerminateAllUserSessions(userId: string): Promise<number> {
    const result = await db.update(loginSessions)
      .set({ isActive: false })
      .where(and(
        eq(loginSessions.userId, userId),
        eq(loginSessions.isActive, true)
      ))
      .returning({ id: loginSessions.id });
    return result.length;
  }

  // ===== ADMIN DEVICE MANAGEMENT =====

  async getAdminDeviceStats(): Promise<{ total: number; activeLastMonth: number; deviceTypes: Record<string, number> }> {
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(trustedDevices);
    const total = Number(totalResult[0]?.count || 0);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeResult = await db.select({ count: sql<number>`count(*)` })
      .from(trustedDevices)
      .where(gte(trustedDevices.lastUsedAt, thirtyDaysAgo));
    const activeLastMonth = Number(activeResult[0]?.count || 0);
    
    const deviceTypesResult = await db.select({
      deviceType: trustedDevices.deviceType,
      count: sql<number>`count(*)`
    })
      .from(trustedDevices)
      .groupBy(trustedDevices.deviceType);
    
    const deviceTypes: Record<string, number> = {};
    for (const row of deviceTypesResult) {
      const type = row.deviceType || 'unknown';
      deviceTypes[type] = Number(row.count);
    }
    
    return { total, activeLastMonth, deviceTypes };
  }

  async getAdminTrustedDevices(options: { page?: number; limit?: number; search?: string }): Promise<{ devices: (TrustedDevice & { user: User })[], total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    const search = options.search?.trim() || "";
    
    const conditions: SQL[] = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(users.username, `%${search}%`),
          ilike(users.displayName, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(trustedDevices.deviceName, `%${search}%`)
        )!
      );
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(trustedDevices)
      .innerJoin(users, eq(trustedDevices.userId, users.id))
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);
    
    const results = await db.select({
      device: trustedDevices,
      user: users
    })
      .from(trustedDevices)
      .innerJoin(users, eq(trustedDevices.userId, users.id))
      .where(whereClause)
      .orderBy(desc(trustedDevices.lastUsedAt))
      .limit(limit)
      .offset(offset);
    
    const devices = results.map(r => ({
      ...r.device,
      user: r.user
    }));
    
    return { devices, total };
  }

  async adminRemoveTrustedDevice(deviceId: string): Promise<void> {
    await db.delete(trustedDevices).where(eq(trustedDevices.id, deviceId));
  }

  async adminRemoveAllUserDevices(userId: string): Promise<number> {
    const result = await db.delete(trustedDevices)
      .where(eq(trustedDevices.userId, userId))
      .returning({ id: trustedDevices.id });
    return result.length;
  }

  async getAdminPaymentStats(): Promise<{ totalOrders: number; pendingOrders: number; completedOrders: number; failedOrders: number; totalRevenue: number; last30DaysRevenue: number }> {
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(payfastOrders);
    const totalOrders = Number(totalResult[0]?.count || 0);
    
    const pendingResult = await db.select({ count: sql<number>`count(*)` })
      .from(payfastOrders)
      .where(eq(payfastOrders.status, "PENDING"));
    const pendingOrders = Number(pendingResult[0]?.count || 0);
    
    const completedResult = await db.select({ count: sql<number>`count(*)` })
      .from(payfastOrders)
      .where(eq(payfastOrders.status, "COMPLETE"));
    const completedOrders = Number(completedResult[0]?.count || 0);
    
    const failedResult = await db.select({ count: sql<number>`count(*)` })
      .from(payfastOrders)
      .where(eq(payfastOrders.status, "FAILED"));
    const failedOrders = Number(failedResult[0]?.count || 0);
    
    const revenueResult = await db.select({ total: sql<number>`COALESCE(SUM(amount_cents), 0)` })
      .from(payfastOrders)
      .where(eq(payfastOrders.status, "COMPLETE"));
    const totalRevenue = Number(revenueResult[0]?.total || 0);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const last30DaysResult = await db.select({ total: sql<number>`COALESCE(SUM(amount_cents), 0)` })
      .from(payfastOrders)
      .where(and(
        eq(payfastOrders.status, "COMPLETE"),
        gte(payfastOrders.completedAt, thirtyDaysAgo)
      ));
    const last30DaysRevenue = Number(last30DaysResult[0]?.total || 0);
    
    return { totalOrders, pendingOrders, completedOrders, failedOrders, totalRevenue, last30DaysRevenue };
  }

  async getAdminPayfastOrders(options: { page?: number; limit?: number; search?: string; status?: string }): Promise<{ orders: (PayfastOrder & { user: User })[], total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    const search = options.search?.trim() || "";
    const status = options.status?.trim() || "";
    
    const conditions: SQL[] = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(users.username, `%${search}%`),
          ilike(users.displayName, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(payfastOrders.itemName, `%${search}%`),
          ilike(payfastOrders.id, `%${search}%`)
        )!
      );
    }
    
    if (status && ["PENDING", "COMPLETE", "FAILED", "CANCELLED"].includes(status.toUpperCase())) {
      conditions.push(eq(payfastOrders.status, status.toUpperCase() as any));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(payfastOrders)
      .innerJoin(users, eq(payfastOrders.userId, users.id))
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);
    
    const results = await db.select({
      order: payfastOrders,
      user: users
    })
      .from(payfastOrders)
      .innerJoin(users, eq(payfastOrders.userId, users.id))
      .where(whereClause)
      .orderBy(desc(payfastOrders.createdAt))
      .limit(limit)
      .offset(offset);
    
    const orders = results.map(r => ({
      ...r.order,
      user: r.user
    }));
    
    return { orders, total };
  }

  async getAdminPayfastOrder(orderId: string): Promise<(PayfastOrder & { user: User }) | undefined> {
    const result = await db.select({
      order: payfastOrders,
      user: users
    })
      .from(payfastOrders)
      .innerJoin(users, eq(payfastOrders.userId, users.id))
      .where(eq(payfastOrders.id, orderId))
      .limit(1);
    
    if (result.length === 0) return undefined;
    
    return {
      ...result[0].order,
      user: result[0].user
    };
  }

  async adminUpdateOrderStatus(orderId: string, status: string, notes?: string): Promise<PayfastOrder | undefined> {
    const validStatuses = ["PENDING", "COMPLETE", "FAILED", "CANCELLED"];
    if (!validStatuses.includes(status.toUpperCase())) {
      throw new Error("Invalid status");
    }
    
    const updateData: any = {
      status: status.toUpperCase() as any,
      updatedAt: new Date()
    };
    
    if (status.toUpperCase() === "COMPLETE") {
      updateData.completedAt = new Date();
    }
    
    if (notes) {
      updateData.itemDescription = notes;
    }
    
    const result = await db.update(payfastOrders)
      .set(updateData)
      .where(eq(payfastOrders.id, orderId))
      .returning();
    
    return result[0];
  }

  async getAdminGroupChatStats(): Promise<{ totalGroups: number; activeGroups: number; totalMessages: number; totalMembers: number }> {
    const totalGroupsResult = await db.select({ count: sql<number>`count(*)` }).from(groupConversations);
    const totalGroups = Number(totalGroupsResult[0]?.count || 0);
    
    const activeGroupsResult = await db.select({ count: sql<number>`count(*)` })
      .from(groupConversations)
      .where(eq(groupConversations.isActive, true));
    const activeGroups = Number(activeGroupsResult[0]?.count || 0);
    
    const totalMessagesResult = await db.select({ count: sql<number>`count(*)` })
      .from(groupMessages)
      .where(eq(groupMessages.isDeleted, false));
    const totalMessages = Number(totalMessagesResult[0]?.count || 0);
    
    const totalMembersResult = await db.select({ count: sql<number>`count(*)` }).from(groupConversationMembers);
    const totalMembers = Number(totalMembersResult[0]?.count || 0);
    
    return { totalGroups, activeGroups, totalMessages, totalMembers };
  }

  async getAdminGroupConversations(options: { page?: number; limit?: number; search?: string }): Promise<{ groups: GroupConversation[], total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    const search = options.search?.trim() || "";
    
    const conditions: SQL[] = [];
    
    if (search) {
      conditions.push(ilike(groupConversations.name, `%${search}%`));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(groupConversations)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);
    
    const groups = await db.select()
      .from(groupConversations)
      .where(whereClause)
      .orderBy(desc(groupConversations.lastMessageAt))
      .limit(limit)
      .offset(offset);
    
    return { groups, total };
  }

  async getAdminGroupConversationDetails(groupId: string): Promise<{ group: GroupConversation; members: (GroupConversationMember & { user: User })[] } | undefined> {
    const groupResult = await db.select()
      .from(groupConversations)
      .where(eq(groupConversations.id, groupId))
      .limit(1);
    
    if (groupResult.length === 0) return undefined;
    
    const membersResult = await db.select({
      member: groupConversationMembers,
      user: users
    })
      .from(groupConversationMembers)
      .innerJoin(users, eq(groupConversationMembers.userId, users.id))
      .where(eq(groupConversationMembers.conversationId, groupId))
      .orderBy(groupConversationMembers.joinedAt);
    
    const members = membersResult.map(r => ({
      ...r.member,
      user: r.user
    }));
    
    return { group: groupResult[0], members };
  }

  async getAdminGroupMessages(groupId: string, options: { page?: number; limit?: number }): Promise<{ messages: (GroupMessage & { sender: User })[], total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;
    
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(groupMessages)
      .where(eq(groupMessages.conversationId, groupId));
    const total = Number(countResult[0]?.count || 0);
    
    const messagesResult = await db.select({
      message: groupMessages,
      sender: users
    })
      .from(groupMessages)
      .innerJoin(users, eq(groupMessages.senderId, users.id))
      .where(eq(groupMessages.conversationId, groupId))
      .orderBy(desc(groupMessages.createdAt))
      .limit(limit)
      .offset(offset);
    
    const messages = messagesResult.map(r => ({
      ...r.message,
      sender: r.sender
    }));
    
    return { messages, total };
  }

  async adminDeleteGroupMessage(messageId: string): Promise<void> {
    await db.update(groupMessages)
      .set({ isDeleted: true, content: "[Message deleted by admin]" })
      .where(eq(groupMessages.id, messageId));
  }

  async adminRemoveGroupMember(groupId: string, userId: string): Promise<void> {
    await db.delete(groupConversationMembers)
      .where(and(
        eq(groupConversationMembers.conversationId, groupId),
        eq(groupConversationMembers.userId, userId)
      ));
    
    await db.update(groupConversations)
      .set({ memberCount: sql`${groupConversations.memberCount} - 1` })
      .where(eq(groupConversations.id, groupId));
  }

  // ===== ADMIN VIDEO CALLS =====

  async getAdminVideoCallStats(): Promise<{ totalCalls: number; activeCalls: number; completedToday: number; avgDuration: number }> {
    const totalCallsResult = await db.select({ count: sql<number>`count(*)` }).from(videoCalls);
    const totalCalls = Number(totalCallsResult[0]?.count || 0);
    
    const activeCallsResult = await db.select({ count: sql<number>`count(*)` })
      .from(videoCalls)
      .where(or(eq(videoCalls.status, "RINGING"), eq(videoCalls.status, "ONGOING")));
    const activeCalls = Number(activeCallsResult[0]?.count || 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedTodayResult = await db.select({ count: sql<number>`count(*)` })
      .from(videoCalls)
      .where(and(
        eq(videoCalls.status, "ENDED"),
        gte(videoCalls.endedAt, today)
      ));
    const completedToday = Number(completedTodayResult[0]?.count || 0);
    
    const avgDurationResult = await db.select({ avg: sql<number>`coalesce(avg(${videoCalls.durationSeconds}), 0)` })
      .from(videoCalls)
      .where(and(
        eq(videoCalls.status, "ENDED"),
        isNotNull(videoCalls.durationSeconds)
      ));
    const avgDuration = Math.round(Number(avgDurationResult[0]?.avg || 0));
    
    return { totalCalls, activeCalls, completedToday, avgDuration };
  }

  async getAdminVideoCalls(options: { page?: number; limit?: number; search?: string; status?: string }): Promise<{ calls: (VideoCall & { caller: User; callee: User })[], total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    const search = options.search?.trim() || "";
    const status = options.status || "";
    
    const conditions: SQL[] = [];
    
    if (status && status !== "all") {
      conditions.push(eq(videoCalls.status, status as any));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(videoCalls)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);
    
    const callerAlias = db.select().from(users).as("caller");
    const calleeAlias = db.select().from(users).as("callee");
    
    const callsResult = await db.select({
      call: videoCalls,
      caller: users,
    })
      .from(videoCalls)
      .innerJoin(users, eq(videoCalls.callerId, users.id))
      .where(whereClause)
      .orderBy(desc(videoCalls.createdAt))
      .limit(limit)
      .offset(offset);
    
    const callsWithCallee = await Promise.all(callsResult.map(async (r) => {
      const [callee] = await db.select().from(users).where(eq(users.id, r.call.calleeId));
      return {
        ...r.call,
        caller: r.caller,
        callee: callee
      };
    }));
    
    const filteredCalls = search
      ? callsWithCallee.filter(c => 
          c.caller.username.toLowerCase().includes(search.toLowerCase()) ||
          c.callee?.username?.toLowerCase().includes(search.toLowerCase()) ||
          c.caller.displayName.toLowerCase().includes(search.toLowerCase()) ||
          c.callee?.displayName?.toLowerCase().includes(search.toLowerCase())
        )
      : callsWithCallee;
    
    return { calls: filteredCalls, total: search ? filteredCalls.length : total };
  }

  async getAdminVideoCallDetails(callId: string): Promise<(VideoCall & { caller: User; callee: User }) | undefined> {
    const [callResult] = await db.select()
      .from(videoCalls)
      .where(eq(videoCalls.id, callId));
    
    if (!callResult) return undefined;
    
    const [caller] = await db.select().from(users).where(eq(users.id, callResult.callerId));
    const [callee] = await db.select().from(users).where(eq(users.id, callResult.calleeId));
    
    return {
      ...callResult,
      caller,
      callee
    };
  }

  async adminEndVideoCall(callId: string): Promise<void> {
    await db.update(videoCalls)
      .set({
        status: "ENDED",
        endedAt: new Date(),
      })
      .where(and(
        eq(videoCalls.id, callId),
        or(eq(videoCalls.status, "RINGING"), eq(videoCalls.status, "ONGOING"))
      ));
  }

  // ===== ADMIN MESSAGE MODERATION FUNCTIONS =====

  async adminSearchMessages(options: { search: string; page?: number; limit?: number }): Promise<{ messages: (Message & { sender: User; conversation: Conversation })[], total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    const search = options.search?.trim() || "";

    if (!search) {
      return { messages: [], total: 0 };
    }

    const searchPattern = `%${search}%`;
    
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(ilike(messages.content, searchPattern));
    const total = Number(countResult[0]?.count || 0);

    const messagesResult = await db.select()
      .from(messages)
      .where(ilike(messages.content, searchPattern))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    const messagesWithDetails = await Promise.all(messagesResult.map(async (msg) => {
      const [sender] = await db.select().from(users).where(eq(users.id, msg.senderId));
      const [conversation] = await db.select().from(conversations).where(eq(conversations.id, msg.conversationId));
      return {
        ...msg,
        sender,
        conversation
      };
    }));

    return { messages: messagesWithDetails, total };
  }

  async adminDeleteMessage(messageId: string): Promise<void> {
    await db.delete(messages).where(eq(messages.id, messageId));
  }

  async getAdminConversationMessages(conversationId: string, options: { page?: number; limit?: number }): Promise<{ messages: (Message & { sender: User })[], total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.conversationId, conversationId));
    const total = Number(countResult[0]?.count || 0);

    const messagesResult = await db.select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    const messagesWithSender = await Promise.all(messagesResult.map(async (msg) => {
      const [sender] = await db.select().from(users).where(eq(users.id, msg.senderId));
      return {
        ...msg,
        sender
      };
    }));

    return { messages: messagesWithSender, total };
  }

  async adminFlagMessage(messageId: string, reason: string, adminId: string): Promise<void> {
    const [message] = await db.select().from(messages).where(eq(messages.id, messageId));
    if (!message) {
      throw new Error("Message not found");
    }
    
    await db.insert(reports).values({
      reporterId: adminId,
      reportedUserId: message.senderId,
      reason: `[MESSAGE FLAG] ${reason}`,
      adminNotes: `Flagged message ID: ${messageId}\nMessage content: ${message.content?.substring(0, 500)}`,
      status: "PENDING",
    });
  }

  async getAdminFlaggedMessages(options: { page?: number; limit?: number }): Promise<{ reports: (Report & { reportedUser: User | null })[], total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(reports)
      .where(ilike(reports.reason, '[MESSAGE FLAG]%'));
    const total = Number(countResult[0]?.count || 0);

    const reportsResult = await db.select()
      .from(reports)
      .where(ilike(reports.reason, '[MESSAGE FLAG]%'))
      .orderBy(desc(reports.createdAt))
      .limit(limit)
      .offset(offset);

    const reportsWithUser = await Promise.all(reportsResult.map(async (report) => {
      let reportedUser = null;
      if (report.reportedUserId) {
        const [user] = await db.select().from(users).where(eq(users.id, report.reportedUserId));
        reportedUser = user || null;
      }
      return {
        ...report,
        reportedUser
      };
    }));

    return { reports: reportsWithUser, total };
  }

  // ===== ADMIN THREADS & DUET/STITCH MODERATION =====

  async getAdminThreadStats(): Promise<{ totalThreads: number; totalDuets: number; totalStitches: number }> {
    const [threadsResult] = await db.select({ count: sql<number>`count(*)` }).from(postThreads);
    const [duetsResult] = await db.select({ count: sql<number>`count(*)` }).from(duetStitchPosts).where(eq(duetStitchPosts.type, 'DUET'));
    const [stitchesResult] = await db.select({ count: sql<number>`count(*)` }).from(duetStitchPosts).where(eq(duetStitchPosts.type, 'STITCH'));
    
    return {
      totalThreads: Number(threadsResult?.count || 0),
      totalDuets: Number(duetsResult?.count || 0),
      totalStitches: Number(stitchesResult?.count || 0)
    };
  }

  async getAdminPostThreads(options: { page?: number; limit?: number; search?: string }): Promise<{ threads: (PostThread & { author: User; posts: Post[] })[], total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    const search = options.search?.trim();

    let whereClause: SQL | undefined = undefined;
    if (search) {
      whereClause = ilike(postThreads.title, `%${search}%`);
    }

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(postThreads)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    const threadsResult = whereClause
      ? await db.select().from(postThreads).where(whereClause).orderBy(desc(postThreads.createdAt)).limit(limit).offset(offset)
      : await db.select().from(postThreads).orderBy(desc(postThreads.createdAt)).limit(limit).offset(offset);

    const threadsWithDetails = await Promise.all(threadsResult.map(async (thread) => {
      const [author] = await db.select().from(users).where(eq(users.id, thread.authorId));
      
      const threadPostsResult = await db.select()
        .from(threadPosts)
        .where(eq(threadPosts.threadId, thread.id))
        .orderBy(threadPosts.position);
      
      const postsInThread = await Promise.all(threadPostsResult.map(async (tp) => {
        const [post] = await db.select().from(posts).where(eq(posts.id, tp.postId));
        return post;
      }));
      
      return {
        ...thread,
        author: author || {} as User,
        posts: postsInThread.filter(Boolean) as Post[]
      };
    }));

    return { threads: threadsWithDetails, total };
  }

  async getAdminDuetStitchPosts(options: { page?: number; limit?: number; type?: 'duet' | 'stitch' }): Promise<{ posts: (DuetStitchPost & { author: User; originalPost: Post; post: Post })[], total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    const typeFilter = options.type;

    let whereClause: SQL | undefined = undefined;
    if (typeFilter) {
      whereClause = eq(duetStitchPosts.type, typeFilter.toUpperCase() as 'DUET' | 'STITCH');
    }

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(duetStitchPosts)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    const duetStitchResult = whereClause
      ? await db.select().from(duetStitchPosts).where(whereClause).orderBy(desc(duetStitchPosts.createdAt)).limit(limit).offset(offset)
      : await db.select().from(duetStitchPosts).orderBy(desc(duetStitchPosts.createdAt)).limit(limit).offset(offset);

    const postsWithDetails = await Promise.all(duetStitchResult.map(async (ds) => {
      const [post] = await db.select().from(posts).where(eq(posts.id, ds.postId));
      const [originalPost] = await db.select().from(posts).where(eq(posts.id, ds.originalPostId));
      
      let author: User | null = null;
      if (post?.authorId) {
        const [authorResult] = await db.select().from(users).where(eq(users.id, post.authorId));
        author = authorResult || null;
      }
      
      return {
        ...ds,
        post: post || {} as Post,
        author: author || {} as User,
        originalPost: originalPost || {} as Post
      };
    }));

    return { posts: postsWithDetails, total };
  }

  async adminDeleteDuetStitch(duetStitchId: string): Promise<void> {
    const [duetStitch] = await db.select().from(duetStitchPosts).where(eq(duetStitchPosts.id, duetStitchId));
    if (!duetStitch) {
      throw new Error("Duet/Stitch not found");
    }
    
    await db.delete(duetStitchPosts).where(eq(duetStitchPosts.id, duetStitchId));
    await db.delete(posts).where(eq(posts.id, duetStitch.postId));
  }

  async adminDeleteThread(threadId: string): Promise<void> {
    const [thread] = await db.select().from(postThreads).where(eq(postThreads.id, threadId));
    if (!thread) {
      throw new Error("Thread not found");
    }
    
    const threadPostsResult = await db.select().from(threadPosts).where(eq(threadPosts.threadId, threadId));
    
    for (const tp of threadPostsResult) {
      await db.delete(posts).where(eq(posts.id, tp.postId));
    }
    
    await db.delete(postThreads).where(eq(postThreads.id, threadId));
  }

  // Admin: Get platform usage overview
  async getAdminPlatformAnalytics(): Promise<{
    dau: number;
    wau: number;
    mau: number;
    totalUsers: number;
    totalPosts: number;
    totalMessages: number;
    avgSessionDuration: number;
  }> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(startOfToday);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(startOfToday);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // DAU - users active today
    const dauResult = await db.select({ count: sql<number>`count(distinct ${users.id})` })
      .from(users)
      .where(gte(users.lastActiveAt, startOfToday));
    const dau = Number(dauResult[0]?.count || 0);

    // WAU - users active in last 7 days
    const wauResult = await db.select({ count: sql<number>`count(distinct ${users.id})` })
      .from(users)
      .where(gte(users.lastActiveAt, sevenDaysAgo));
    const wau = Number(wauResult[0]?.count || 0);

    // MAU - users active in last 30 days
    const mauResult = await db.select({ count: sql<number>`count(distinct ${users.id})` })
      .from(users)
      .where(gte(users.lastActiveAt, thirtyDaysAgo));
    const mau = Number(mauResult[0]?.count || 0);

    // Total users
    const totalUsersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalUsers = Number(totalUsersResult[0]?.count || 0);

    // Total posts
    const totalPostsResult = await db.select({ count: sql<number>`count(*)` }).from(posts);
    const totalPosts = Number(totalPostsResult[0]?.count || 0);

    // Total messages
    const totalMessagesResult = await db.select({ count: sql<number>`count(*)` }).from(messages);
    const totalMessages = Number(totalMessagesResult[0]?.count || 0);

    // Average session duration from usageStats
    const avgSessionResult = await db.select({
      avg: sql<number>`coalesce(avg(${usageStats.screenTimeMinutes}), 0)`
    }).from(usageStats).where(gte(usageStats.date, thirtyDaysAgo));
    const avgSessionDuration = Math.round(Number(avgSessionResult[0]?.avg || 0));

    return {
      dau,
      wau,
      mau,
      totalUsers,
      totalPosts,
      totalMessages,
      avgSessionDuration
    };
  }

  // Admin: Get usage trends (last N days)
  async getAdminUsageTrends(days: number = 30): Promise<{
    date: string;
    activeUsers: number;
    newUsers: number;
    posts: number;
    messages: number;
  }[]> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startDate.setDate(startDate.getDate() - days);

    const trends: { date: string; activeUsers: number; newUsers: number; posts: number; messages: number }[] = [];

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDate);
      dayStart.setDate(startDate.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dateStr = dayStart.toISOString().split('T')[0];

      // Active users for this day
      const activeResult = await db.select({ count: sql<number>`count(distinct ${users.id})` })
        .from(users)
        .where(and(
          gte(users.lastActiveAt, dayStart),
          lt(users.lastActiveAt, dayEnd)
        ));
      const activeUsers = Number(activeResult[0]?.count || 0);

      // New users for this day
      const newUsersResult = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          gte(users.createdAt, dayStart),
          lt(users.createdAt, dayEnd)
        ));
      const newUsers = Number(newUsersResult[0]?.count || 0);

      // Posts created this day
      const postsResult = await db.select({ count: sql<number>`count(*)` })
        .from(posts)
        .where(and(
          gte(posts.createdAt, dayStart),
          lt(posts.createdAt, dayEnd)
        ));
      const postsCount = Number(postsResult[0]?.count || 0);

      // Messages sent this day
      const messagesResult = await db.select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(and(
          gte(messages.createdAt, dayStart),
          lt(messages.createdAt, dayEnd)
        ));
      const messagesCount = Number(messagesResult[0]?.count || 0);

      trends.push({
        date: dateStr,
        activeUsers,
        newUsers,
        posts: postsCount,
        messages: messagesCount
      });
    }

    return trends;
  }

  // Admin: Get user retention metrics
  async getAdminRetentionMetrics(): Promise<{
    day1Retention: number;
    day7Retention: number;
    day30Retention: number;
  }> {
    const now = new Date();
    
    // Calculate retention: % of users who signed up X days ago and were active after that
    const calculateRetention = async (daysAgo: number): Promise<number> => {
      const signupStart = new Date(now);
      signupStart.setDate(signupStart.getDate() - daysAgo - 7); // Look at users who signed up in a 7-day window
      const signupEnd = new Date(now);
      signupEnd.setDate(signupEnd.getDate() - daysAgo);
      
      const retentionCheckStart = new Date(signupEnd);
      
      // Get users who signed up in that window
      const signedUpUsers = await db.select({ id: users.id })
        .from(users)
        .where(and(
          gte(users.createdAt, signupStart),
          lt(users.createdAt, signupEnd)
        ));
      
      if (signedUpUsers.length === 0) return 0;
      
      // Count how many were active after the retention period
      const retainedUsers = await db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(
          inArray(users.id, signedUpUsers.map(u => u.id)),
          gte(users.lastActiveAt, retentionCheckStart)
        ));
      
      const retained = Number(retainedUsers[0]?.count || 0);
      return Math.round((retained / signedUpUsers.length) * 100);
    };

    const day1Retention = await calculateRetention(1);
    const day7Retention = await calculateRetention(7);
    const day30Retention = await calculateRetention(30);

    return {
      day1Retention,
      day7Retention,
      day30Retention
    };
  }

  // Admin: Get trending/viral content stats
  async getAdminContentVelocityStats(): Promise<{
    trendingNow: number;
    viralToday: number;
    avgEngagementRate: number;
  }> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Trending now: posts with high velocity in the last hour
    const trendingResult = await db.select({ count: sql<number>`count(distinct ${contentVelocity.contentId})` })
      .from(contentVelocity)
      .where(and(
        gte(contentVelocity.recordedAt, oneHourAgo),
        gt(contentVelocity.velocityScore, 5)
      ));
    const trendingNow = Number(trendingResult[0]?.count || 0);

    // Viral today: posts with very high engagement in last 24 hours
    const viralResult = await db.select({ count: sql<number>`count(distinct ${contentVelocity.contentId})` })
      .from(contentVelocity)
      .where(and(
        gte(contentVelocity.recordedAt, oneDayAgo),
        gt(contentVelocity.velocityScore, 20)
      ));
    const viralToday = Number(viralResult[0]?.count || 0);

    // Average engagement rate from recent posts
    const postsWithEngagement = await db.select({
      avgRate: sql<number>`avg((${posts.likesCount} + ${posts.commentsCount} + ${posts.sharesCount})::float / nullif(${posts.viewsCount}, 0) * 100)`
    })
      .from(posts)
      .where(and(
        gte(posts.createdAt, oneDayAgo),
        isNull(posts.deletedAt),
        gt(posts.viewsCount, 0)
      ));
    const avgEngagementRate = Math.round((postsWithEngagement[0]?.avgRate || 0) * 100) / 100;

    return {
      trendingNow,
      viralToday,
      avgEngagementRate
    };
  }

  // Admin: Get trending posts (high velocity)
  async getAdminTrendingPosts(options: { page?: number; limit?: number; timeframe?: string }): Promise<{
    posts: (Post & { author: User; velocity: number; engagementRate: number })[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;
    const timeframe = options.timeframe || '24h';

    let timeThreshold = new Date();
    switch (timeframe) {
      case '1h':
        timeThreshold = new Date(timeThreshold.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        timeThreshold = new Date(timeThreshold.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '7d':
        timeThreshold = new Date(timeThreshold.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default: // 24h
        timeThreshold = new Date(timeThreshold.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get posts with their velocity scores
    const trendingPosts = await db.select({
      post: posts,
      author: users,
      velocityScore: sql<number>`coalesce(max(${contentVelocity.velocityScore}), 0)`,
    })
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .leftJoin(contentVelocity, eq(posts.id, contentVelocity.contentId))
      .where(and(
        gte(posts.createdAt, timeThreshold),
        isNull(posts.deletedAt),
        eq(posts.isHidden, false)
      ))
      .groupBy(posts.id, users.id)
      .orderBy(desc(sql`coalesce(max(${contentVelocity.velocityScore}), (${posts.likesCount} + ${posts.commentsCount} * 2 + ${posts.sharesCount} * 3)::float / greatest(extract(epoch from (now() - ${posts.createdAt})) / 3600, 1))`))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db.select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(and(
        gte(posts.createdAt, timeThreshold),
        isNull(posts.deletedAt),
        eq(posts.isHidden, false)
      ));
    const total = Number(totalResult[0]?.count || 0);

    const postsWithVelocity = trendingPosts.map(row => {
      const totalEngagement = row.post.likesCount + row.post.commentsCount + row.post.sharesCount;
      const engagementRate = row.post.viewsCount > 0 
        ? Math.round((totalEngagement / row.post.viewsCount) * 10000) / 100 
        : 0;
      
      const hoursOld = Math.max(1, (Date.now() - new Date(row.post.createdAt).getTime()) / (1000 * 60 * 60));
      const velocity = row.velocityScore || Math.round((totalEngagement / hoursOld) * 100) / 100;

      return {
        ...row.post,
        author: row.author,
        velocity,
        engagementRate
      };
    });

    return { posts: postsWithVelocity, total };
  }

  // Admin: Get daily trends
  async getAdminDailyTrends(days: number = 7): Promise<{
    date: string;
    topHashtags: { tag: string; count: number }[];
    topPosts: { postId: string; title: string; engagement: number }[];
  }[]> {
    const results: {
      date: string;
      topHashtags: { tag: string; count: number }[];
      topPosts: { postId: string; title: string; engagement: number }[];
    }[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = new Date(dateStr);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      // Get trends for this day from trendsDaily
      const dailyTrends = await db.select()
        .from(trendsDaily)
        .where(and(
          gte(trendsDaily.windowStart, dayStart),
          lt(trendsDaily.windowStart, dayEnd)
        ))
        .orderBy(desc(trendsDaily.score))
        .limit(10);

      // Get top posts for this day
      const topPostsResult = await db.select({
        id: posts.id,
        content: posts.content,
        caption: posts.caption,
        engagement: sql<number>`(${posts.likesCount} + ${posts.commentsCount} * 2 + ${posts.sharesCount} * 3)::int`
      })
        .from(posts)
        .where(and(
          gte(posts.createdAt, dayStart),
          lt(posts.createdAt, dayEnd),
          isNull(posts.deletedAt)
        ))
        .orderBy(desc(sql`${posts.likesCount} + ${posts.commentsCount} * 2 + ${posts.sharesCount} * 3`))
        .limit(5);

      results.push({
        date: dateStr,
        topHashtags: dailyTrends.map(t => ({ tag: t.topic, count: t.postCount })),
        topPosts: topPostsResult.map(p => ({
          postId: p.id,
          title: (p.caption || p.content || '').slice(0, 50) + ((p.caption || p.content || '').length > 50 ? '...' : ''),
          engagement: p.engagement
        }))
      });
    }

    return results;
  }

  // Admin: Get content velocity for a specific post
  async getAdminPostVelocity(postId: string): Promise<{
    likes: number;
    comments: number;
    shares: number;
    velocityScore: number;
    peakTime: Date | null;
  } | null> {
    const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
    if (!post[0]) return null;

    // Get velocity records for this post
    const velocityRecords = await db.select()
      .from(contentVelocity)
      .where(eq(contentVelocity.contentId, postId))
      .orderBy(desc(contentVelocity.velocityScore))
      .limit(1);

    // Calculate current velocity if no records exist
    const hoursOld = Math.max(1, (Date.now() - new Date(post[0].createdAt).getTime()) / (1000 * 60 * 60));
    const totalEngagement = post[0].likesCount + post[0].commentsCount + post[0].sharesCount;
    const calculatedVelocity = Math.round((totalEngagement / hoursOld) * 100) / 100;

    return {
      likes: post[0].likesCount,
      comments: post[0].commentsCount,
      shares: post[0].sharesCount,
      velocityScore: velocityRecords[0]?.velocityScore || calculatedVelocity,
      peakTime: velocityRecords[0]?.recordedAt || null
    };
  }

  // ===== ADMIN LOCATION MANAGEMENT =====

  async getAdminLocationStats(): Promise<{
    totalVenues: number;
    verifiedVenues: number;
    totalCheckIns: number;
    activeLocations: number;
  }> {
    const [venueStats] = await db.select({
      total: sql<number>`count(*)::int`,
      verified: sql<number>`count(*) filter (where ${venues.isVerified} = true)::int`
    }).from(venues);

    const [checkInStats] = await db.select({
      total: sql<number>`count(*)::int`
    }).from(checkIns);

    const [locationStats] = await db.select({
      active: sql<number>`count(*) filter (where ${userLocations.isSharing} = true)::int`
    }).from(userLocations);

    return {
      totalVenues: venueStats?.total || 0,
      verifiedVenues: venueStats?.verified || 0,
      totalCheckIns: checkInStats?.total || 0,
      activeLocations: locationStats?.active || 0
    };
  }

  async getAdminVenues(options: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    verified?: boolean 
  }): Promise<{ venues: Venue[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (options.search) {
      conditions.push(
        or(
          ilike(venues.name, `%${options.search}%`),
          ilike(venues.address, `%${options.search}%`),
          ilike(venues.city, `%${options.search}%`)
        )!
      );
    }

    if (options.verified !== undefined) {
      conditions.push(eq(venues.isVerified, options.verified));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [venuesList, countResult] = await Promise.all([
      db.select()
        .from(venues)
        .where(whereClause)
        .orderBy(desc(venues.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` })
        .from(venues)
        .where(whereClause)
    ]);

    return {
      venues: venuesList,
      total: countResult[0]?.count || 0
    };
  }

  async adminCreateVenue(data: { 
    name: string; 
    address: string; 
    lat: number; 
    lng: number; 
    category?: string;
    city?: string;
    country?: string;
  }): Promise<Venue> {
    const [venue] = await db.insert(venues).values({
      name: data.name,
      address: data.address,
      latitude: data.lat,
      longitude: data.lng,
      category: data.category || null,
      city: data.city || null,
      country: data.country || null,
      isVerified: false,
      checkInCount: 0
    }).returning();

    return venue;
  }

  async adminUpdateVenue(venueId: string, data: Partial<Venue>): Promise<Venue | undefined> {
    const updateData: Record<string, any> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;

    if (Object.keys(updateData).length === 0) {
      const existing = await db.select().from(venues).where(eq(venues.id, venueId)).limit(1);
      return existing[0];
    }

    const [updated] = await db.update(venues)
      .set(updateData)
      .where(eq(venues.id, venueId))
      .returning();

    return updated;
  }

  async adminVerifyVenue(venueId: string, verified: boolean): Promise<Venue | undefined> {
    const [updated] = await db.update(venues)
      .set({ isVerified: verified })
      .where(eq(venues.id, venueId))
      .returning();

    return updated;
  }

  async adminDeleteVenue(venueId: string): Promise<void> {
    await db.delete(venues).where(eq(venues.id, venueId));
  }

  async getAdminCheckIns(options: { 
    page?: number; 
    limit?: number; 
    venueId?: string 
  }): Promise<{ 
    checkIns: (CheckIn & { user: User | null; venue: Venue | null })[]; 
    total: number 
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (options.venueId) {
      conditions.push(eq(checkIns.venueId, options.venueId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [checkInsList, countResult] = await Promise.all([
      db.select({
        checkIn: checkIns,
        user: users,
        venue: venues
      })
        .from(checkIns)
        .leftJoin(users, eq(checkIns.userId, users.id))
        .leftJoin(venues, eq(checkIns.venueId, venues.id))
        .where(whereClause)
        .orderBy(desc(checkIns.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` })
        .from(checkIns)
        .where(whereClause)
    ]);

    return {
      checkIns: checkInsList.map(row => ({
        ...row.checkIn,
        user: row.user,
        venue: row.venue
      })),
      total: countResult[0]?.count || 0
    };
  }

  async adminDeleteCheckIn(checkInId: string): Promise<void> {
    const checkIn = await db.select().from(checkIns).where(eq(checkIns.id, checkInId)).limit(1);
    
    if (checkIn[0]?.venueId) {
      await db.update(venues)
        .set({ checkInCount: sql`${venues.checkInCount} - 1` })
        .where(eq(venues.id, checkIn[0].venueId));
    }

    await db.delete(checkIns).where(eq(checkIns.id, checkInId));
  }

  // ===== ADMIN AR FILTERS =====

  async getAdminARFilterStats(): Promise<{
    totalFilters: number;
    activeFilters: number;
    featuredFilters: number;
    totalUsage: number;
  }> {
    const [stats] = await db.select({
      totalFilters: sql<number>`count(*)::int`,
      activeFilters: sql<number>`count(*) filter (where ${arFilters.isActive} = true)::int`,
      featuredFilters: sql<number>`count(*) filter (where ${arFilters.isFeatured} = true)::int`,
      totalUsage: sql<number>`coalesce(sum(${arFilters.usageCount}), 0)::int`,
    }).from(arFilters);

    return {
      totalFilters: stats?.totalFilters || 0,
      activeFilters: stats?.activeFilters || 0,
      featuredFilters: stats?.featuredFilters || 0,
      totalUsage: stats?.totalUsage || 0,
    };
  }

  async getAdminARFilters(options: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    featured?: boolean 
  }): Promise<{ filters: ArFilter[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (options.search) {
      conditions.push(
        or(
          ilike(arFilters.name, `%${options.search}%`),
          ilike(arFilters.description, `%${options.search}%`),
          ilike(arFilters.category, `%${options.search}%`)
        )!
      );
    }

    if (options.featured !== undefined) {
      conditions.push(eq(arFilters.isFeatured, options.featured));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [filtersList, countResult] = await Promise.all([
      db.select()
        .from(arFilters)
        .where(whereClause)
        .orderBy(desc(arFilters.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` })
        .from(arFilters)
        .where(whereClause)
    ]);

    return {
      filters: filtersList,
      total: countResult[0]?.count || 0,
    };
  }

  async adminCreateARFilter(data: { 
    name: string; 
    description?: string; 
    previewUrl: string; 
    filterUrl: string; 
    category?: string;
    creatorId?: string;
  }): Promise<ArFilter> {
    const [filter] = await db.insert(arFilters)
      .values({
        name: data.name,
        description: data.description || null,
        thumbnailUrl: data.previewUrl,
        filterUrl: data.filterUrl,
        category: data.category || null,
        creatorId: data.creatorId || null,
        isActive: true,
        isFeatured: false,
        usageCount: 0,
      })
      .returning();

    return filter;
  }

  async adminUpdateARFilter(filterId: string, data: Partial<ArFilter>): Promise<ArFilter | undefined> {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
    if (data.filterUrl !== undefined) updateData.filterUrl = data.filterUrl;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;

    if (Object.keys(updateData).length === 0) {
      const existing = await db.select().from(arFilters).where(eq(arFilters.id, filterId)).limit(1);
      return existing[0];
    }

    const [updated] = await db.update(arFilters)
      .set(updateData)
      .where(eq(arFilters.id, filterId))
      .returning();

    return updated;
  }

  async adminFeatureARFilter(filterId: string, featured: boolean): Promise<ArFilter | undefined> {
    const [updated] = await db.update(arFilters)
      .set({ isFeatured: featured })
      .where(eq(arFilters.id, filterId))
      .returning();

    return updated;
  }

  async adminToggleARFilter(filterId: string, active: boolean): Promise<ArFilter | undefined> {
    const [updated] = await db.update(arFilters)
      .set({ isActive: active })
      .where(eq(arFilters.id, filterId))
      .returning();

    return updated;
  }

  async adminDeleteARFilter(filterId: string): Promise<void> {
    await db.delete(arFilters).where(eq(arFilters.id, filterId));
  }

  // ===== ADMIN AI CONTENT MANAGEMENT =====

  async getAdminAIContentStats(): Promise<{
    totalAvatars: number;
    totalTranslations: number;
    pendingReview: number;
    flaggedContent: number;
  }> {
    const [avatarCountResult] = await db.select({ count: sql<number>`count(*)::int` }).from(aiAvatars);
    const [translationCountResult] = await db.select({ count: sql<number>`count(*)::int` }).from(aiTranslations);
    const [pendingResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(aiAvatars)
      .where(eq(aiAvatars.isActive, false));
    const [flaggedResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(aiAvatars)
      .where(eq(aiAvatars.isActive, false));

    return {
      totalAvatars: avatarCountResult?.count || 0,
      totalTranslations: translationCountResult?.count || 0,
      pendingReview: pendingResult?.count || 0,
      flaggedContent: flaggedResult?.count || 0,
    };
  }

  async getAdminAIAvatars(options: { page?: number; limit?: number; status?: string }): Promise<{
    avatars: (AiAvatar & { user: User })[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let conditions: SQL[] = [];
    
    if (options.status === 'active') {
      conditions.push(eq(aiAvatars.isActive, true));
    } else if (options.status === 'inactive') {
      conditions.push(eq(aiAvatars.isActive, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const avatarsData = await db.select({
      avatar: aiAvatars,
      user: users,
    })
      .from(aiAvatars)
      .leftJoin(users, eq(aiAvatars.userId, users.id))
      .where(whereClause)
      .orderBy(desc(aiAvatars.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(aiAvatars)
      .where(whereClause);

    const avatars = avatarsData.map((row) => ({
      ...row.avatar,
      user: row.user as User,
    }));

    return {
      avatars,
      total: countResult?.count || 0,
    };
  }

  async getAdminAITranslations(options: { page?: number; limit?: number }): Promise<{
    translations: AiTranslation[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const translations = await db.select()
      .from(aiTranslations)
      .orderBy(desc(aiTranslations.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(aiTranslations);

    return {
      translations,
      total: countResult?.count || 0,
    };
  }

  async adminReviewAIAvatar(avatarId: string, status: 'approved' | 'rejected', reason?: string): Promise<AiAvatar | undefined> {
    const isActive = status === 'approved';
    
    const [updated] = await db.update(aiAvatars)
      .set({ isActive })
      .where(eq(aiAvatars.id, avatarId))
      .returning();

    return updated;
  }

  async adminDeleteAIAvatar(avatarId: string): Promise<void> {
    await db.delete(aiAvatars).where(eq(aiAvatars.id, avatarId));
  }

  async getAIAvatarById(avatarId: string): Promise<AiAvatar | undefined> {
    const [avatar] = await db.select().from(aiAvatars).where(eq(aiAvatars.id, avatarId)).limit(1);
    return avatar;
  }

  // ===== ADMIN EXPLORE CATEGORIES MANAGEMENT =====

  async getAdminExploreCategoryStats(): Promise<{
    totalCategories: number;
    activeCategories: number;
    featuredCategories: number;
  }> {
    const [totalResult] = await db.select({ count: sql<number>`count(*)::int` }).from(exploreCategories);
    const [activeResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(exploreCategories)
      .where(eq(exploreCategories.isActive, true));
    const [featuredResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(exploreCategories)
      .where(and(eq(exploreCategories.isActive, true), lte(exploreCategories.sortOrder, 5)));

    return {
      totalCategories: totalResult?.count || 0,
      activeCategories: activeResult?.count || 0,
      featuredCategories: featuredResult?.count || 0,
    };
  }

  async getAdminExploreCategories(options: { page?: number; limit?: number }): Promise<{
    categories: ExploreCategory[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    const categories = await db.select()
      .from(exploreCategories)
      .orderBy(exploreCategories.sortOrder, desc(exploreCategories.createdAt))
      .limit(limit)
      .offset(offset);

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(exploreCategories);

    return {
      categories,
      total: countResult?.count || 0,
    };
  }

  async adminCreateExploreCategory(data: {
    name: string;
    slug: string;
    description?: string;
    iconUrl?: string;
    color?: string;
    order?: number;
  }): Promise<ExploreCategory> {
    const [maxOrderResult] = await db.select({ maxOrder: sql<number>`coalesce(max(sort_order), 0)::int` })
      .from(exploreCategories);
    const nextOrder = data.order !== undefined ? data.order : (maxOrderResult?.maxOrder || 0) + 1;

    const [category] = await db.insert(exploreCategories)
      .values({
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        iconName: data.iconUrl || null,
        coverUrl: data.color || null,
        sortOrder: nextOrder,
        isActive: true,
      })
      .returning();

    return category;
  }

  async adminUpdateExploreCategory(categoryId: string, data: Partial<{
    name: string;
    slug: string;
    description: string;
    iconUrl: string;
    color: string;
    order: number;
    isActive: boolean;
  }>): Promise<ExploreCategory | undefined> {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.iconUrl !== undefined) updateData.iconName = data.iconUrl;
    if (data.color !== undefined) updateData.coverUrl = data.color;
    if (data.order !== undefined) updateData.sortOrder = data.order;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (Object.keys(updateData).length === 0) {
      const [existing] = await db.select().from(exploreCategories).where(eq(exploreCategories.id, categoryId)).limit(1);
      return existing;
    }

    const [updated] = await db.update(exploreCategories)
      .set(updateData)
      .where(eq(exploreCategories.id, categoryId))
      .returning();

    return updated;
  }

  async adminReorderExploreCategories(categoryIds: string[]): Promise<void> {
    for (let i = 0; i < categoryIds.length; i++) {
      await db.update(exploreCategories)
        .set({ sortOrder: i })
        .where(eq(exploreCategories.id, categoryIds[i]));
    }
  }

  async adminDeleteExploreCategory(categoryId: string): Promise<void> {
    await db.delete(exploreCategories).where(eq(exploreCategories.id, categoryId));
  }

  async getExploreCategoryById(categoryId: string): Promise<ExploreCategory | undefined> {
    const [category] = await db.select().from(exploreCategories).where(eq(exploreCategories.id, categoryId)).limit(1);
    return category;
  }

  // ===== ADMIN STORY EXTENDED FEATURES =====

  async getAdminStoryExtendedStats(): Promise<{
    totalHighlights: number;
    totalStickers: number;
    totalStickerResponses: number;
    totalTips: number;
    totalTipAmount: number;
  }> {
    const [highlightsResult] = await db.select({ count: sql<number>`count(*)::int` }).from(storyHighlights);
    const [stickersResult] = await db.select({ count: sql<number>`count(*)::int` }).from(storyStickers);
    const [responsesResult] = await db.select({ count: sql<number>`count(*)::int` }).from(storyStickerResponses);
    const [tipsResult] = await db.select({ 
      count: sql<number>`count(*)::int`,
      totalAmount: sql<number>`coalesce(sum(amount), 0)::int`
    }).from(storyTips);

    return {
      totalHighlights: highlightsResult?.count || 0,
      totalStickers: stickersResult?.count || 0,
      totalStickerResponses: responsesResult?.count || 0,
      totalTips: tipsResult?.count || 0,
      totalTipAmount: tipsResult?.totalAmount || 0,
    };
  }

  async getAdminStoryHighlights(options: { page?: number; limit?: number; search?: string }): Promise<{
    highlights: (StoryHighlight & { user: User; itemCount: number })[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (options.search) {
      conditions.push(ilike(storyHighlights.name, `%${options.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(storyHighlights)
      .where(whereClause);

    const highlightsResult = await db.select()
      .from(storyHighlights)
      .where(whereClause)
      .orderBy(desc(storyHighlights.createdAt))
      .limit(limit)
      .offset(offset);

    const highlightsWithUsers = await Promise.all(
      highlightsResult.map(async (highlight) => {
        const [user] = await db.select().from(users).where(eq(users.id, highlight.userId)).limit(1);
        const [itemCountResult] = await db.select({ count: sql<number>`count(*)::int` })
          .from(storyHighlightItems)
          .where(eq(storyHighlightItems.highlightId, highlight.id));
        return {
          ...highlight,
          user: user!,
          itemCount: itemCountResult?.count || 0,
        };
      })
    );

    return {
      highlights: highlightsWithUsers,
      total: countResult?.count || 0,
    };
  }

  async adminDeleteStoryHighlight(highlightId: string): Promise<void> {
    await db.delete(storyHighlightItems).where(eq(storyHighlightItems.highlightId, highlightId));
    await db.delete(storyHighlights).where(eq(storyHighlights.id, highlightId));
  }

  async getAdminStoryStickers(options: { page?: number; limit?: number }): Promise<{
    stickers: (StorySticker & { responsesCount: number })[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(storyStickers);

    const stickersResult = await db.select()
      .from(storyStickers)
      .orderBy(desc(storyStickers.createdAt))
      .limit(limit)
      .offset(offset);

    const stickersWithResponses = await Promise.all(
      stickersResult.map(async (sticker) => {
        const [responsesCountResult] = await db.select({ count: sql<number>`count(*)::int` })
          .from(storyStickerResponses)
          .where(eq(storyStickerResponses.stickerId, sticker.id));
        return {
          ...sticker,
          responsesCount: responsesCountResult?.count || 0,
        };
      })
    );

    return {
      stickers: stickersWithResponses,
      total: countResult?.count || 0,
    };
  }

  async getAdminStoryTips(options: { page?: number; limit?: number }): Promise<{
    tips: (StoryTip & { sender: User; recipient: User })[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(storyTips);

    const tipsResult = await db.select()
      .from(storyTips)
      .orderBy(desc(storyTips.createdAt))
      .limit(limit)
      .offset(offset);

    const tipsWithUsers = await Promise.all(
      tipsResult.map(async (tip) => {
        const [sender] = await db.select().from(users).where(eq(users.id, tip.senderId)).limit(1);
        const [recipient] = await db.select().from(users).where(eq(users.id, tip.recipientId)).limit(1);
        return {
          ...tip,
          sender: sender!,
          recipient: recipient!,
        };
      })
    );

    return {
      tips: tipsWithUsers,
      total: countResult?.count || 0,
    };
  }

  // ===== ADMIN USER PROFILE FEATURES =====

  async getAdminUserProfileStats(): Promise<{
    totalFeaturedIntros: number;
    pendingIntros: number;
    totalLinkedAccounts: number;
    totalUserNotes: number;
  }> {
    const [introCountResult] = await db.select({ count: sql<number>`count(*)::int` }).from(featuredIntros);
    const [linkedCountResult] = await db.select({ count: sql<number>`count(*)::int` }).from(linkedAccounts);
    const [notesCountResult] = await db.select({ count: sql<number>`count(*)::int` })
      .from(userNotes)
      .where(gt(userNotes.expiresAt, new Date()));

    return {
      totalFeaturedIntros: introCountResult?.count || 0,
      pendingIntros: 0,
      totalLinkedAccounts: linkedCountResult?.count || 0,
      totalUserNotes: notesCountResult?.count || 0,
    };
  }

  async getAdminFeaturedIntros(options: { page?: number; limit?: number; status?: string }): Promise<{
    intros: (FeaturedIntro & { user: User })[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(featuredIntros);

    const introsResult = await db.select({
      intro: featuredIntros,
      user: users,
    })
      .from(featuredIntros)
      .leftJoin(users, eq(featuredIntros.userId, users.id))
      .orderBy(desc(featuredIntros.updatedAt))
      .limit(limit)
      .offset(offset);

    const intros = introsResult.map((row) => ({
      ...row.intro,
      user: row.user as User,
    }));

    return {
      intros,
      total: countResult?.count || 0,
    };
  }

  async adminDeleteFeaturedIntro(introId: string): Promise<void> {
    await db.delete(featuredIntros).where(eq(featuredIntros.id, introId));
  }

  async getAdminLinkedAccounts(options: { page?: number; limit?: number; search?: string }): Promise<{
    accounts: (LinkedAccount & { primaryUser: User; linkedUser: User })[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(linkedAccounts);

    const accountsResult = await db.select()
      .from(linkedAccounts)
      .orderBy(desc(linkedAccounts.linkedAt))
      .limit(limit)
      .offset(offset);

    const accountsWithUsers = await Promise.all(
      accountsResult.map(async (account) => {
        const [primaryUser] = await db.select().from(users).where(eq(users.id, account.primaryUserId)).limit(1);
        const [linkedUser] = await db.select().from(users).where(eq(users.id, account.linkedUserId)).limit(1);
        return {
          ...account,
          primaryUser: primaryUser!,
          linkedUser: linkedUser!,
        };
      })
    );

    if (options.search) {
      const search = options.search.toLowerCase();
      const filtered = accountsWithUsers.filter((a) =>
        a.primaryUser?.username?.toLowerCase().includes(search) ||
        a.linkedUser?.username?.toLowerCase().includes(search)
      );
      return {
        accounts: filtered,
        total: filtered.length,
      };
    }

    return {
      accounts: accountsWithUsers,
      total: countResult?.count || 0,
    };
  }

  async adminUnlinkAccount(accountId: string): Promise<void> {
    await db.delete(linkedAccounts).where(eq(linkedAccounts.id, accountId));
  }

  async getAdminUserNotesList(options: { page?: number; limit?: number }): Promise<{
    notes: (UserNote & { user: User })[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(userNotes);

    const notesResult = await db.select({
      note: userNotes,
      user: users,
    })
      .from(userNotes)
      .leftJoin(users, eq(userNotes.userId, users.id))
      .orderBy(desc(userNotes.createdAt))
      .limit(limit)
      .offset(offset);

    const notes = notesResult.map((row) => ({
      ...row.note,
      user: row.user as User,
    }));

    return {
      notes,
      total: countResult?.count || 0,
    };
  }

  async adminDeleteUserNote(noteId: string): Promise<void> {
    await db.delete(userNotes).where(eq(userNotes.id, noteId));
  }

  // ===== ADMIN DEVELOPER API MANAGEMENT =====

  async getAdminDevApiStats(): Promise<{
    totalWebhooks: number;
    activeWebhooks: number;
    totalApiTokens: number;
    totalDeliveries: number;
    failedDeliveries: number;
  }> {
    const [webhooksCount] = await db.select({ count: sql<number>`count(*)::int` }).from(webhooks);
    const [activeCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(webhooks)
      .where(eq(webhooks.isActive, true));
    const [tokensCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(apiAccessTokens)
      .where(eq(apiAccessTokens.isRevoked, false));
    const [deliveriesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(webhookDeliveries);
    const [failedCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.success, false));

    return {
      totalWebhooks: webhooksCount?.count || 0,
      activeWebhooks: activeCount?.count || 0,
      totalApiTokens: tokensCount?.count || 0,
      totalDeliveries: deliveriesCount?.count || 0,
      failedDeliveries: failedCount?.count || 0,
    };
  }

  async getAdminWebhooks(options: { page?: number; limit?: number; search?: string }): Promise<{
    webhooks: (Webhook & { user: User })[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let baseQuery = db.select({ count: sql<number>`count(*)::int` }).from(webhooks);
    if (options.search) {
      baseQuery = baseQuery.where(ilike(webhooks.url, `%${options.search}%`)) as typeof baseQuery;
    }
    const [countResult] = await baseQuery;

    let webhooksQuery = db.select({
      webhook: webhooks,
      user: users,
    })
      .from(webhooks)
      .leftJoin(users, eq(webhooks.userId, users.id))
      .orderBy(desc(webhooks.createdAt))
      .limit(limit)
      .offset(offset);

    if (options.search) {
      webhooksQuery = webhooksQuery.where(ilike(webhooks.url, `%${options.search}%`)) as typeof webhooksQuery;
    }

    const webhooksResult = await webhooksQuery;

    const result = webhooksResult.map((row) => ({
      ...row.webhook,
      user: row.user as User,
    }));

    return {
      webhooks: result,
      total: countResult?.count || 0,
    };
  }

  async adminToggleWebhook(webhookId: string, enabled: boolean): Promise<Webhook | undefined> {
    const [updated] = await db.update(webhooks)
      .set({ isActive: enabled, updatedAt: new Date() })
      .where(eq(webhooks.id, webhookId))
      .returning();
    return updated;
  }

  async adminDeleteWebhook(webhookId: string): Promise<void> {
    await db.delete(webhooks).where(eq(webhooks.id, webhookId));
  }

  async getAdminWebhookDeliveryLogs(options: { page?: number; limit?: number; webhookId?: string; status?: string }): Promise<{
    logs: (WebhookDelivery & { webhook?: Webhook })[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (options.webhookId) {
      conditions.push(eq(webhookDeliveries.webhookId, options.webhookId));
    }
    if (options.status === 'success') {
      conditions.push(eq(webhookDeliveries.success, true));
    } else if (options.status === 'failed') {
      conditions.push(eq(webhookDeliveries.success, false));
    }

    let countQuery = db.select({ count: sql<number>`count(*)::int` }).from(webhookDeliveries);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as typeof countQuery;
    }
    const [countResult] = await countQuery;

    let logsQuery = db.select({
      delivery: webhookDeliveries,
      webhook: webhooks,
    })
      .from(webhookDeliveries)
      .leftJoin(webhooks, eq(webhookDeliveries.webhookId, webhooks.id))
      .orderBy(desc(webhookDeliveries.createdAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      logsQuery = logsQuery.where(and(...conditions)) as typeof logsQuery;
    }

    const logsResult = await logsQuery;

    const logs = logsResult.map((row) => ({
      ...row.delivery,
      webhook: row.webhook || undefined,
    }));

    return {
      logs,
      total: countResult?.count || 0,
    };
  }

  async getAdminApiAccessTokens(options: { page?: number; limit?: number; search?: string }): Promise<{
    tokens: (ApiAccessToken & { user: User })[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(apiAccessTokens);

    let tokensQuery = db.select({
      token: apiAccessTokens,
      user: users,
    })
      .from(apiAccessTokens)
      .leftJoin(users, eq(apiAccessTokens.userId, users.id))
      .orderBy(desc(apiAccessTokens.createdAt))
      .limit(limit)
      .offset(offset);

    if (options.search) {
      tokensQuery = tokensQuery.where(
        or(
          ilike(apiAccessTokens.name, `%${options.search}%`),
          ilike(users.username, `%${options.search}%`)
        )
      ) as typeof tokensQuery;
    }

    const tokensResult = await tokensQuery;

    const tokens = tokensResult.map((row) => ({
      ...row.token,
      user: row.user as User,
    }));

    return {
      tokens,
      total: countResult?.count || 0,
    };
  }

  async adminRevokeApiToken(tokenId: string): Promise<void> {
    await db.update(apiAccessTokens)
      .set({ isRevoked: true })
      .where(eq(apiAccessTokens.id, tokenId));
  }

  async getAdminDataPrivacyStats(): Promise<{
    totalExportRequests: number;
    pendingExports: number;
    completedExports: number;
    totalBackups: number;
    totalImports: number;
  }> {
    const [exportResult] = await db.select({ count: sql<number>`count(*)::int` }).from(dataExportRequests);
    const [pendingResult] = await db.select({ count: sql<number>`count(*)::int` }).from(dataExportRequests).where(eq(dataExportRequests.status, 'PENDING'));
    const [completedResult] = await db.select({ count: sql<number>`count(*)::int` }).from(dataExportRequests).where(eq(dataExportRequests.status, 'COMPLETED'));
    const [backupResult] = await db.select({ count: sql<number>`count(*)::int` }).from(accountBackups);
    const [importResult] = await db.select({ count: sql<number>`count(*)::int` }).from(platformImports);

    return {
      totalExportRequests: exportResult?.count || 0,
      pendingExports: pendingResult?.count || 0,
      completedExports: completedResult?.count || 0,
      totalBackups: backupResult?.count || 0,
      totalImports: importResult?.count || 0,
    };
  }

  async getAdminExportRequests(options: { page?: number; limit?: number; status?: string }): Promise<{
    requests: (DataExportRequest & { user: User })[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (options.status) {
      conditions.push(eq(dataExportRequests.status, options.status as any));
    }

    let countQuery = db.select({ count: sql<number>`count(*)::int` }).from(dataExportRequests);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as typeof countQuery;
    }
    const [countResult] = await countQuery;

    let requestsQuery = db.select({
      request: dataExportRequests,
      user: users,
    })
      .from(dataExportRequests)
      .leftJoin(users, eq(dataExportRequests.userId, users.id))
      .orderBy(desc(dataExportRequests.createdAt))
      .limit(limit)
      .offset(offset);

    if (conditions.length > 0) {
      requestsQuery = requestsQuery.where(and(...conditions)) as typeof requestsQuery;
    }

    const requestsResult = await requestsQuery;

    const requests = requestsResult.map((row) => ({
      ...row.request,
      user: row.user as User,
    }));

    return {
      requests,
      total: countResult?.count || 0,
    };
  }

  async adminUpdateExportRequestStatus(requestId: string, status: string): Promise<DataExportRequest | undefined> {
    const updateData: any = { status };
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      updateData.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    
    const [updated] = await db.update(dataExportRequests)
      .set(updateData)
      .where(eq(dataExportRequests.id, requestId))
      .returning();
    return updated;
  }

  async getAdminAccountBackups(options: { page?: number; limit?: number }): Promise<{
    backups: (AccountBackup & { user: User })[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(accountBackups);

    const backupsResult = await db.select({
      backup: accountBackups,
      user: users,
    })
      .from(accountBackups)
      .leftJoin(users, eq(accountBackups.userId, users.id))
      .orderBy(desc(accountBackups.createdAt))
      .limit(limit)
      .offset(offset);

    const backups = backupsResult.map((row) => ({
      ...row.backup,
      user: row.user as User,
    }));

    return {
      backups,
      total: countResult?.count || 0,
    };
  }

  async getAdminPlatformImports(options: { page?: number; limit?: number }): Promise<{
    imports: (PlatformImport & { user: User })[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(platformImports);

    const importsResult = await db.select({
      import: platformImports,
      user: users,
    })
      .from(platformImports)
      .leftJoin(users, eq(platformImports.userId, users.id))
      .orderBy(desc(platformImports.createdAt))
      .limit(limit)
      .offset(offset);

    const imports = importsResult.map((row) => ({
      ...row.import,
      user: row.user as User,
    }));

    return {
      imports,
      total: countResult?.count || 0,
    };
  }

  async adminProcessExportRequest(requestId: string): Promise<void> {
    await db.update(dataExportRequests)
      .set({ 
        status: 'PROCESSING'
      })
      .where(eq(dataExportRequests.id, requestId));
  }

  // ===== PLATFORM SETTINGS: WORD FILTERS =====

  async getAdminWordFilters(options: { page?: number; limit?: number }): Promise<{ filters: WordFilter[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(wordFilters);
    
    const filters = await db.select()
      .from(wordFilters)
      .orderBy(desc(wordFilters.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      filters,
      total: countResult?.count || 0,
    };
  }

  async adminCreateWordFilter(data: { word: string; action: string; replacement?: string; createdBy?: string }): Promise<WordFilter> {
    const [filter] = await db.insert(wordFilters)
      .values({
        word: data.word.toLowerCase().trim(),
        action: data.action as any,
        replacement: data.replacement || null,
        createdBy: data.createdBy || null,
      })
      .returning();
    return filter;
  }

  async adminUpdateWordFilter(filterId: string, data: Partial<WordFilter>): Promise<WordFilter | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.word) {
      updateData.word = data.word.toLowerCase().trim();
    }
    const [updated] = await db.update(wordFilters)
      .set(updateData)
      .where(eq(wordFilters.id, filterId))
      .returning();
    return updated;
  }

  async adminDeleteWordFilter(filterId: string): Promise<void> {
    await db.delete(wordFilters).where(eq(wordFilters.id, filterId));
  }

  // ===== PLATFORM SETTINGS: ADMIN KEYWORD FILTERS =====

  async getAdminKeywordFilters(options: { page?: number; limit?: number }): Promise<{ filters: AdminKeywordFilter[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    const [countResult] = await db.select({ count: sql<number>`count(*)::int` }).from(adminKeywordFilters);
    
    const filters = await db.select()
      .from(adminKeywordFilters)
      .orderBy(desc(adminKeywordFilters.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      filters,
      total: countResult?.count || 0,
    };
  }

  async adminCreateKeywordFilter(data: { keyword: string; action: string; createdBy?: string }): Promise<AdminKeywordFilter> {
    const [filter] = await db.insert(adminKeywordFilters)
      .values({
        keyword: data.keyword.toLowerCase().trim(),
        action: data.action as any,
        createdBy: data.createdBy || null,
      })
      .returning();
    return filter;
  }

  async adminUpdateKeywordFilter(filterId: string, data: Partial<AdminKeywordFilter>): Promise<AdminKeywordFilter | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.keyword) {
      updateData.keyword = data.keyword.toLowerCase().trim();
    }
    const [updated] = await db.update(adminKeywordFilters)
      .set(updateData)
      .where(eq(adminKeywordFilters.id, filterId))
      .returning();
    return updated;
  }

  async adminDeleteKeywordFilter(filterId: string): Promise<void> {
    await db.delete(adminKeywordFilters).where(eq(adminKeywordFilters.id, filterId));
  }

  // ===== PLATFORM SETTINGS: APP SETTINGS =====

  async getAdminAppSettings(): Promise<AppSetting[]> {
    return db.select().from(appSettings).orderBy(appSettings.key);
  }

  async adminUpdateAppSetting(key: string, value: string, updatedBy?: string): Promise<AppSetting | undefined> {
    const [existing] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    
    if (existing) {
      const [updated] = await db.update(appSettings)
        .set({ value, updatedAt: new Date(), updatedBy: updatedBy || null })
        .where(eq(appSettings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(appSettings)
        .values({ key, value, updatedBy: updatedBy || null })
        .returning();
      return created;
    }
  }

  async adminCreateAppSetting(data: { key: string; value: string; type?: string; description?: string; updatedBy?: string }): Promise<AppSetting> {
    const [setting] = await db.insert(appSettings)
      .values({
        key: data.key,
        value: data.value,
        type: data.type || 'string',
        description: data.description || null,
        updatedBy: data.updatedBy || null,
      })
      .returning();
    return setting;
  }

  // ===== PLATFORM SETTINGS: NOTIFICATION DEFAULTS =====

  async getAdminNotificationDefaults(): Promise<NotificationDefault[]> {
    return db.select().from(notificationDefaults).orderBy(notificationDefaults.category, notificationDefaults.key);
  }

  async adminUpdateNotificationDefault(id: string, enabled: boolean, updatedBy?: string): Promise<NotificationDefault | undefined> {
    const [updated] = await db.update(notificationDefaults)
      .set({ defaultEnabled: enabled, updatedAt: new Date(), updatedBy: updatedBy || null })
      .where(eq(notificationDefaults.id, id))
      .returning();
    return updated;
  }

  async adminCreateNotificationDefault(data: { key: string; name: string; description?: string; category: string; defaultEnabled?: boolean; canUserDisable?: boolean; updatedBy?: string }): Promise<NotificationDefault> {
    const [setting] = await db.insert(notificationDefaults)
      .values({
        key: data.key,
        name: data.name,
        description: data.description || null,
        category: data.category,
        defaultEnabled: data.defaultEnabled !== false,
        canUserDisable: data.canUserDisable !== false,
        updatedBy: data.updatedBy || null,
      })
      .returning();
    return setting;
  }

  async adminDeleteNotificationDefault(id: string): Promise<void> {
    await db.delete(notificationDefaults).where(eq(notificationDefaults.id, id));
  }

  // ===== ADVANCED DASHBOARD ANALYTICS =====

  async getAdvancedDashboardStats(): Promise<{
    users: { total: number; today: number; thisWeek: number; lastWeek: number; growth: number };
    posts: { total: number; today: number; thisWeek: number; lastWeek: number; growth: number };
    engagement: { likes: number; comments: number; shares: number; avgEngagementRate: number };
    revenue: { total: number; thisMonth: number; lastMonth: number; growth: number };
    contentBreakdown: { type: string; count: number; percentage: number }[];
    moderation: { pendingReports: number; resolvedToday: number; flaggedContent: number };
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Helper function for safe queries
    const safeCount = async (queryFn: () => Promise<{count: number}[]>): Promise<number> => {
      try {
        const [result] = await queryFn();
        return result?.count || 0;
      } catch (e) {
        console.error('[Dashboard] Query error:', e);
        return 0;
      }
    };

    const safeSum = async (queryFn: () => Promise<{sum: number}[]>): Promise<number> => {
      try {
        const [result] = await queryFn();
        return result?.sum || 0;
      } catch (e) {
        console.error('[Dashboard] Sum query error:', e);
        return 0;
      }
    };

    // User stats - each query wrapped safely
    const totalUsersCount = await safeCount(() => db.select({ count: sql<number>`count(*)::int` }).from(users));
    const usersTodayCount = await safeCount(() => db.select({ count: sql<number>`count(*)::int` }).from(users).where(gte(users.createdAt, todayStart)));
    const usersThisWeekCount = await safeCount(() => db.select({ count: sql<number>`count(*)::int` }).from(users).where(gte(users.createdAt, weekStart)));
    const usersLastWeekCount = await safeCount(() => db.select({ count: sql<number>`count(*)::int` }).from(users).where(and(gte(users.createdAt, lastWeekStart), lt(users.createdAt, weekStart))));
    const userGrowth = usersLastWeekCount > 0 ? ((usersThisWeekCount - usersLastWeekCount) / usersLastWeekCount * 100) : 0;

    // Post stats
    const totalPostsCount = await safeCount(() => db.select({ count: sql<number>`count(*)::int` }).from(posts));
    const postsTodayCount = await safeCount(() => db.select({ count: sql<number>`count(*)::int` }).from(posts).where(gte(posts.createdAt, todayStart)));
    const postsThisWeekCount = await safeCount(() => db.select({ count: sql<number>`count(*)::int` }).from(posts).where(gte(posts.createdAt, weekStart)));
    const postsLastWeekCount = await safeCount(() => db.select({ count: sql<number>`count(*)::int` }).from(posts).where(and(gte(posts.createdAt, lastWeekStart), lt(posts.createdAt, weekStart))));
    const postGrowth = postsLastWeekCount > 0 ? ((postsThisWeekCount - postsLastWeekCount) / postsLastWeekCount * 100) : 0;

    // Engagement stats
    const totalLikesCount = await safeCount(() => db.select({ count: sql<number>`count(*)::int` }).from(likes));
    const totalCommentsCount = await safeCount(() => db.select({ count: sql<number>`count(*)::int` }).from(comments));
    const totalSharesCount = await safeCount(() => db.select({ count: sql<number>`count(*)::int` }).from(shares));
    const avgEngagementRate = totalPostsCount > 0 
      ? (totalLikesCount + totalCommentsCount + totalSharesCount) / totalPostsCount 
      : 0;

    // Revenue stats from mall purchases
    const totalRevenueSum = await safeSum(() => db.select({ sum: sql<number>`COALESCE(sum(net_worth_gained), 0)::int` }).from(mallPurchases));
    const revenueThisMonthSum = await safeSum(() => db.select({ sum: sql<number>`COALESCE(sum(net_worth_gained), 0)::int` }).from(mallPurchases).where(gte(mallPurchases.createdAt, monthStart)));
    const revenueLastMonthSum = await safeSum(() => db.select({ sum: sql<number>`COALESCE(sum(net_worth_gained), 0)::int` }).from(mallPurchases).where(and(gte(mallPurchases.createdAt, lastMonthStart), lte(mallPurchases.createdAt, lastMonthEnd))));
    const revenueGrowth = revenueLastMonthSum > 0 ? ((revenueThisMonthSum - revenueLastMonthSum) / revenueLastMonthSum * 100) : 0;

    // Content breakdown by type
    let contentBreakdown: { type: string; count: number; percentage: number }[] = [];
    try {
      const contentCounts = await db.select({
        type: posts.type,
        count: sql<number>`count(*)::int`
      }).from(posts).groupBy(posts.type);
      const totalPostCount = contentCounts.reduce((sum, c) => sum + c.count, 0);
      contentBreakdown = contentCounts.map(c => ({
        type: c.type || 'TEXT',
        count: c.count,
        percentage: totalPostCount > 0 ? Math.round(c.count / totalPostCount * 100) : 0
      }));
    } catch (e) {
      console.error('[Dashboard] Content breakdown error:', e);
    }

    // Moderation stats
    const pendingReportsCount = await safeCount(() => db.select({ count: sql<number>`count(*)::int` }).from(reports).where(eq(reports.status, 'PENDING')));
    const resolvedTodayCount = await safeCount(() => db.select({ count: sql<number>`count(*)::int` }).from(reports).where(and(eq(reports.status, 'RESOLVED'), gte(reports.resolvedAt, todayStart))));
    const flaggedContentCount = await safeCount(() => db.select({ count: sql<number>`count(*)::int` }).from(posts).where(eq(posts.isHidden, true)));

    return {
      users: {
        total: totalUsersCount,
        today: usersTodayCount,
        thisWeek: usersThisWeekCount,
        lastWeek: usersLastWeekCount,
        growth: Math.round(userGrowth * 10) / 10
      },
      posts: {
        total: totalPostsCount,
        today: postsTodayCount,
        thisWeek: postsThisWeekCount,
        lastWeek: postsLastWeekCount,
        growth: Math.round(postGrowth * 10) / 10
      },
      engagement: {
        likes: totalLikesCount,
        comments: totalCommentsCount,
        shares: totalSharesCount,
        avgEngagementRate: Math.round(avgEngagementRate * 100) / 100
      },
      revenue: {
        total: totalRevenueSum,
        thisMonth: revenueThisMonthSum,
        lastMonth: revenueLastMonthSum,
        growth: Math.round(revenueGrowth * 10) / 10
      },
      contentBreakdown,
      moderation: {
        pendingReports: pendingReportsCount,
        resolvedToday: resolvedTodayCount,
        flaggedContent: flaggedContentCount
      }
    };
  }

  async getDashboardUserGrowth(days: number): Promise<{
    labels: string[];
    newUsers: number[];
    totalUsers: number[];
  }> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const dailyNewUsers = await db.select({
      date: sql<string>`DATE(created_at)::text`,
      count: sql<number>`count(*)::int`
    })
    .from(users)
    .where(gte(users.createdAt, startDate))
    .groupBy(sql`DATE(created_at)`)
    .orderBy(sql`DATE(created_at)`);

    // Get total user count before start date for running total
    const [usersBefore] = await db.select({ count: sql<number>`count(*)::int` }).from(users).where(lt(users.createdAt, startDate));
    let runningTotal = usersBefore?.count || 0;

    const labels: string[] = [];
    const newUsers: number[] = [];
    const totalUsers: number[] = [];
    const dataMap = new Map(dailyNewUsers.map(d => [d.date, d.count]));

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayCount = dataMap.get(dateStr) || 0;
      
      labels.push(dateStr);
      newUsers.push(dayCount);
      runningTotal += dayCount;
      totalUsers.push(runningTotal);
    }

    return { labels, newUsers, totalUsers };
  }

  async getDashboardEngagementTrends(days: number): Promise<{
    labels: string[];
    likes: number[];
    comments: number[];
    posts: number[];
  }> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const dailyLikes = await db.select({
      date: sql<string>`DATE(created_at)::text`,
      count: sql<number>`count(*)::int`
    }).from(likes).where(gte(likes.createdAt, startDate)).groupBy(sql`DATE(created_at)`);

    const dailyComments = await db.select({
      date: sql<string>`DATE(created_at)::text`,
      count: sql<number>`count(*)::int`
    }).from(comments).where(gte(comments.createdAt, startDate)).groupBy(sql`DATE(created_at)`);

    const dailyPosts = await db.select({
      date: sql<string>`DATE(created_at)::text`,
      count: sql<number>`count(*)::int`
    }).from(posts).where(gte(posts.createdAt, startDate)).groupBy(sql`DATE(created_at)`);

    const likesMap = new Map(dailyLikes.map(d => [d.date, d.count]));
    const commentsMap = new Map(dailyComments.map(d => [d.date, d.count]));
    const postsMap = new Map(dailyPosts.map(d => [d.date, d.count]));

    const labels: string[] = [];
    const likesArr: number[] = [];
    const commentsArr: number[] = [];
    const postsArr: number[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      labels.push(dateStr);
      likesArr.push(likesMap.get(dateStr) || 0);
      commentsArr.push(commentsMap.get(dateStr) || 0);
      postsArr.push(postsMap.get(dateStr) || 0);
    }

    return { labels, likes: likesArr, comments: commentsArr, posts: postsArr };
  }

  async getDashboardActivityFeed(limit: number): Promise<{
    id: string;
    type: 'new_user' | 'new_post' | 'new_comment' | 'report' | 'verification' | 'purchase';
    message: string;
    timestamp: Date;
    userId?: string;
    userName?: string;
  }[]> {
    const activities: {
      id: string;
      type: 'new_user' | 'new_post' | 'new_comment' | 'report' | 'verification' | 'purchase';
      message: string;
      timestamp: Date;
      userId?: string;
      userName?: string;
    }[] = [];

    // Get recent users
    const recentUsers = await db.select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      createdAt: users.createdAt
    }).from(users).orderBy(desc(users.createdAt)).limit(Math.ceil(limit / 5));

    for (const user of recentUsers) {
      if (user.createdAt) {
        activities.push({
          id: `user-${user.id}`,
          type: 'new_user',
          message: `${user.displayName || user.username} joined the platform`,
          timestamp: user.createdAt,
          userId: user.id,
          userName: user.username
        });
      }
    }

    // Get recent posts
    const recentPosts = await db.select({
      id: posts.id,
      type: posts.type,
      authorId: posts.authorId,
      createdAt: posts.createdAt
    }).from(posts).orderBy(desc(posts.createdAt)).limit(Math.ceil(limit / 5));

    for (const post of recentPosts) {
      const author = await this.getUser(post.authorId);
      if (post.createdAt) {
        activities.push({
          id: `post-${post.id}`,
          type: 'new_post',
          message: `${author?.displayName || 'User'} created a ${post.type?.toLowerCase() || 'text'} post`,
          timestamp: post.createdAt,
          userId: post.authorId,
          userName: author?.username
        });
      }
    }

    // Get recent reports
    const recentReports = await db.select({
      id: reports.id,
      reporterId: reports.reporterId,
      reason: reports.reason,
      createdAt: reports.createdAt
    }).from(reports).orderBy(desc(reports.createdAt)).limit(Math.ceil(limit / 5));

    for (const report of recentReports) {
      if (report.createdAt) {
        activities.push({
          id: `report-${report.id}`,
          type: 'report',
          message: `New report: ${report.reason.substring(0, 50)}${report.reason.length > 50 ? '...' : ''}`,
          timestamp: report.createdAt,
          userId: report.reporterId
        });
      }
    }

    // Get recent verification requests
    const recentVerifications = await db.select({
      id: verificationRequests.id,
      userId: verificationRequests.userId,
      status: verificationRequests.status,
      updatedAt: verificationRequests.updatedAt
    }).from(verificationRequests).orderBy(desc(verificationRequests.updatedAt)).limit(Math.ceil(limit / 5));

    for (const verification of recentVerifications) {
      const user = await this.getUser(verification.userId);
      if (verification.updatedAt) {
        activities.push({
          id: `verification-${verification.id}`,
          type: 'verification',
          message: `${user?.displayName || 'User'} submitted verification request`,
          timestamp: verification.updatedAt,
          userId: verification.userId,
          userName: user?.username
        });
      }
    }

    // Get recent mall purchases
    const recentPurchases = await db.select({
      id: mallPurchases.id,
      userId: mallPurchases.userId,
      netWorthGained: mallPurchases.netWorthGained,
      createdAt: mallPurchases.createdAt
    }).from(mallPurchases).orderBy(desc(mallPurchases.createdAt)).limit(Math.ceil(limit / 5));

    for (const purchase of recentPurchases) {
      const user = await this.getUser(purchase.userId);
      if (purchase.createdAt) {
        activities.push({
          id: `purchase-${purchase.id}`,
          type: 'purchase',
          message: `${user?.displayName || 'User'} made a purchase worth ${purchase.netWorthGained.toLocaleString()} net worth`,
          timestamp: purchase.createdAt,
          userId: purchase.userId,
          userName: user?.username
        });
      }
    }

    // Sort by timestamp descending and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getDashboardTopPerformers(): Promise<{
    topUsers: { id: string; name: string; username: string; avatar: string; followers: number; posts: number; engagement: number }[];
    topPosts: { id: string; userId: string; userName: string; type: string; likes: number; comments: number; createdAt: Date }[];
    topHashtags: { name: string; postCount: number; growth: number }[];
  }> {
    // Get top users by follower count
    const topUsersByFollowers = await db.select({
      userId: follows.followingId,
      followers: sql<number>`count(*)::int`
    })
    .from(follows)
    .groupBy(follows.followingId)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

    const topUsers: { id: string; name: string; username: string; avatar: string; followers: number; posts: number; engagement: number }[] = [];

    for (const u of topUsersByFollowers) {
      const user = await this.getUser(u.userId);
      if (user) {
        const [postCount] = await db.select({ count: sql<number>`count(*)::int` }).from(posts).where(eq(posts.authorId, user.id));
        const [likeCount] = await db.select({ count: sql<number>`count(*)::int` }).from(likes)
          .innerJoin(posts, eq(likes.postId, posts.id))
          .where(eq(posts.authorId, user.id));
        
        topUsers.push({
          id: user.id,
          name: user.displayName || user.username,
          username: user.username,
          avatar: user.avatarUrl || '',
          followers: u.followers,
          posts: postCount?.count || 0,
          engagement: likeCount?.count || 0
        });
      }
    }

    // Get top posts by likes
    const topPostsByLikes = await db.select({
      postId: likes.postId,
      likeCount: sql<number>`count(*)::int`
    })
    .from(likes)
    .groupBy(likes.postId)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

    const topPosts: { id: string; userId: string; userName: string; type: string; likes: number; comments: number; createdAt: Date }[] = [];

    for (const p of topPostsByLikes) {
      const post = await this.getPost(p.postId);
      if (post) {
        const [commentCount] = await db.select({ count: sql<number>`count(*)::int` }).from(comments).where(eq(comments.postId, post.id));
        topPosts.push({
          id: post.id,
          userId: post.authorId,
          userName: post.author?.displayName || post.author?.username || 'Unknown',
          type: post.type || 'TEXT',
          likes: p.likeCount,
          comments: commentCount?.count || 0,
          createdAt: post.createdAt
        });
      }
    }

    // Get top hashtags (from trendsDaily table)
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(weekAgo);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);

    const currentTrends = await db.select({
      topic: trendsDaily.topic,
      count: sql<number>`sum(post_count)::int`
    })
    .from(trendsDaily)
    .where(gte(trendsDaily.windowStart, weekAgo))
    .groupBy(trendsDaily.topic)
    .orderBy(desc(sql`sum(post_count)`))
    .limit(10);

    const lastWeekTrends = await db.select({
      topic: trendsDaily.topic,
      count: sql<number>`sum(post_count)::int`
    })
    .from(trendsDaily)
    .where(and(gte(trendsDaily.windowStart, twoWeeksAgo), lt(trendsDaily.windowStart, weekAgo)))
    .groupBy(trendsDaily.topic);

    const lastWeekMap = new Map(lastWeekTrends.map(t => [t.topic, t.count]));

    const topHashtags = currentTrends.map(t => {
      const lastWeekCount = lastWeekMap.get(t.topic) || 0;
      const growth = lastWeekCount > 0 ? ((t.count - lastWeekCount) / lastWeekCount * 100) : 0;
      return {
        name: t.topic,
        postCount: t.count,
        growth: Math.round(growth * 10) / 10
      };
    });

    return { topUsers, topPosts, topHashtags };
  }

  async getDashboardContentDistribution(): Promise<{
    labels: string[];
    data: number[];
  }> {
    const distribution = await db.select({
      type: posts.type,
      count: sql<number>`count(*)::int`
    })
    .from(posts)
    .groupBy(posts.type)
    .orderBy(desc(sql`count(*)`));

    const labels = distribution.map(d => d.type || 'TEXT');
    const data = distribution.map(d => d.count);

    return { labels, data };
  }

  async getDashboardPeakHours(): Promise<{
    hour: number;
    dayOfWeek: number;
    activity: number;
  }[]> {
    // Get activity distribution by hour and day of week from posts
    const postActivity = await db.select({
      hour: sql<number>`EXTRACT(HOUR FROM created_at)::int`,
      dayOfWeek: sql<number>`EXTRACT(DOW FROM created_at)::int`,
      count: sql<number>`count(*)::int`
    })
    .from(posts)
    .where(gte(posts.createdAt, sql`NOW() - INTERVAL '30 days'`))
    .groupBy(sql`EXTRACT(HOUR FROM created_at)`, sql`EXTRACT(DOW FROM created_at)`);

    // Also include likes in activity
    const likeActivity = await db.select({
      hour: sql<number>`EXTRACT(HOUR FROM created_at)::int`,
      dayOfWeek: sql<number>`EXTRACT(DOW FROM created_at)::int`,
      count: sql<number>`count(*)::int`
    })
    .from(likes)
    .where(gte(likes.createdAt, sql`NOW() - INTERVAL '30 days'`))
    .groupBy(sql`EXTRACT(HOUR FROM created_at)`, sql`EXTRACT(DOW FROM created_at)`);

    // Combine activities
    const activityMap = new Map<string, number>();
    
    for (const p of postActivity) {
      const key = `${p.hour}-${p.dayOfWeek}`;
      activityMap.set(key, (activityMap.get(key) || 0) + p.count);
    }
    
    for (const l of likeActivity) {
      const key = `${l.hour}-${l.dayOfWeek}`;
      activityMap.set(key, (activityMap.get(key) || 0) + l.count);
    }

    // Generate full grid (0-23 hours x 0-6 days)
    const result: { hour: number; dayOfWeek: number; activity: number }[] = [];
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${hour}-${day}`;
        result.push({
          hour,
          dayOfWeek: day,
          activity: activityMap.get(key) || 0
        });
      }
    }

    return result;
  }

  // ===== WALLET & COIN OPERATIONS =====

  async getOrCreateWallet(userId: string): Promise<Wallet> {
    const existing = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    if (existing.length > 0) {
      return existing[0];
    }
    const [wallet] = await db.insert(wallets).values({
      userId,
      coinBalance: 0,
      lifetimeEarned: 0,
      lifetimeSpent: 0,
      isFrozen: false,
    }).returning();
    return wallet;
  }

  async getWallet(userId: string): Promise<Wallet | null> {
    const result = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
    return result[0] || null;
  }

  async addCoins(userId: string, amount: number, type: string, description: string, referenceType?: string, referenceId?: string): Promise<{ wallet: Wallet; transaction: CoinTransaction }> {
    if (amount <= 0) throw new Error("Amount must be positive");
    
    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.isFrozen) throw new Error("Wallet is frozen");

    const [updatedWallet] = await db.update(wallets)
      .set({
        coinBalance: sql`${wallets.coinBalance} + ${amount}`,
        lifetimeEarned: sql`${wallets.lifetimeEarned} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId))
      .returning();

    const [transaction] = await db.insert(coinTransactions).values({
      walletId: wallet.id,
      amount,
      type: type as any,
      description,
      balanceAfter: updatedWallet.coinBalance,
      referenceType,
      referenceId,
    }).returning();

    return { wallet: updatedWallet, transaction };
  }

  async deductCoins(userId: string, amount: number, type: string, description: string, referenceType?: string, referenceId?: string): Promise<{ wallet: Wallet; transaction: CoinTransaction }> {
    if (amount <= 0) throw new Error("Amount must be positive");
    
    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.isFrozen) throw new Error("Wallet is frozen");
    if (wallet.coinBalance < amount) throw new Error("Insufficient balance");

    const [updatedWallet] = await db.update(wallets)
      .set({
        coinBalance: sql`${wallets.coinBalance} - ${amount}`,
        lifetimeSpent: sql`${wallets.lifetimeSpent} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId))
      .returning();

    const [transaction] = await db.insert(coinTransactions).values({
      walletId: wallet.id,
      amount: -amount,
      type: type as any,
      description,
      balanceAfter: updatedWallet.coinBalance,
      referenceType,
      referenceId,
    }).returning();

    return { wallet: updatedWallet, transaction };
  }

  async adminAdjustWallet(userId: string, amount: number, reason: string, adminId: string): Promise<Wallet> {
    const wallet = await this.getOrCreateWallet(userId);
    const newBalance = wallet.coinBalance + amount;
    if (newBalance < 0) throw new Error("Cannot set negative balance");

    const [updatedWallet] = await db.update(wallets)
      .set({
        coinBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId))
      .returning();

    await db.insert(coinTransactions).values({
      walletId: wallet.id,
      amount,
      type: amount > 0 ? "ADMIN_CREDIT" : "ADMIN_DEBIT",
      description: `Admin adjustment: ${reason}`,
      balanceAfter: newBalance,
      referenceType: "admin",
      referenceId: adminId,
    });

    return updatedWallet;
  }

  async freezeWallet(userId: string, frozen: boolean): Promise<Wallet> {
    const [wallet] = await db.update(wallets)
      .set({ isFrozen: frozen, updatedAt: new Date() })
      .where(eq(wallets.userId, userId))
      .returning();
    return wallet;
  }

  async getCoinTransactions(userId: string, limit = 50, offset = 0): Promise<CoinTransaction[]> {
    const wallet = await this.getWallet(userId);
    if (!wallet) return [];
    return db.select().from(coinTransactions)
      .where(eq(coinTransactions.walletId, wallet.id))
      .orderBy(desc(coinTransactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // ===== COIN BUNDLES =====

  async getCoinBundles(activeOnly = true): Promise<CoinBundle[]> {
    const query = activeOnly 
      ? db.select().from(coinBundles).where(eq(coinBundles.isActive, true))
      : db.select().from(coinBundles);
    return query.orderBy(coinBundles.sortOrder);
  }

  async getCoinBundle(id: string): Promise<CoinBundle | null> {
    const result = await db.select().from(coinBundles).where(eq(coinBundles.id, id)).limit(1);
    return result[0] || null;
  }

  async createCoinBundle(data: Partial<CoinBundle>): Promise<CoinBundle> {
    const [bundle] = await db.insert(coinBundles).values(data as any).returning();
    return bundle;
  }

  async updateCoinBundle(id: string, data: Partial<CoinBundle>): Promise<CoinBundle> {
    const [bundle] = await db.update(coinBundles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(coinBundles.id, id))
      .returning();
    return bundle;
  }

  async createCoinPurchase(userId: string, bundleId: string, coinsReceived: number, amountPaidRands: number, paymentReference: string): Promise<CoinPurchase> {
    const [purchase] = await db.insert(coinPurchases).values({
      userId,
      bundleId,
      coinsReceived,
      amountPaidRands,
      paymentReference,
      status: "pending",
    }).returning();
    return purchase;
  }

  async getCoinPurchase(id: string): Promise<CoinPurchase | null> {
    const result = await db.select().from(coinPurchases).where(eq(coinPurchases.id, id)).limit(1);
    return result[0] || null;
  }

  async getCoinPurchaseByReference(paymentReference: string): Promise<CoinPurchase | null> {
    const result = await db.select().from(coinPurchases).where(eq(coinPurchases.paymentReference, paymentReference)).limit(1);
    return result[0] || null;
  }

  async completeCoinPurchase(paymentReference: string): Promise<{ purchase: CoinPurchase; wallet: Wallet } | null> {
    const [purchase] = await db.select().from(coinPurchases)
      .where(and(eq(coinPurchases.paymentReference, paymentReference), eq(coinPurchases.status, "pending")))
      .limit(1);
    
    if (!purchase) return null;

    const [updatedPurchase] = await db.update(coinPurchases)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(coinPurchases.id, purchase.id))
      .returning();

    const { wallet } = await this.addCoins(
      purchase.userId,
      purchase.coinsReceived,
      "PURCHASE",
      `Coin bundle purchase`,
      "coin_purchase",
      purchase.id
    );

    await db.insert(platformRevenue).values({
      source: "COIN_PURCHASE",
      amountRands: purchase.amountPaidRands,
      referenceType: "coin_purchase",
      referenceId: purchase.id,
      userId: purchase.userId,
    });

    return { purchase: updatedPurchase, wallet };
  }

  // ===== DAILY REWARDS =====

  async getDailyRewardStatus(userId: string): Promise<DailyReward | null> {
    const result = await db.select().from(dailyRewards).where(eq(dailyRewards.userId, userId)).limit(1);
    return result[0] || null;
  }

  async getDailyRewardConfig(): Promise<DailyRewardConfig[]> {
    return db.select().from(dailyRewardConfig).where(eq(dailyRewardConfig.isActive, true)).orderBy(dailyRewardConfig.dayNumber);
  }

  async claimDailyReward(userId: string): Promise<{ reward: DailyReward; coinsEarned: number; wallet: Wallet }> {
    const today = new Date().toISOString().split('T')[0];
    let status = await this.getDailyRewardStatus(userId);
    
    if (status?.lastClaimDate === today) {
      throw new Error("Already claimed today");
    }

    const configs = await this.getDailyRewardConfig();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let newStreak = 1;
    if (status?.lastClaimDate === yesterday) {
      newStreak = status.currentStreak + 1;
    }

    const dayConfig = configs.find(c => c.dayNumber === ((newStreak - 1) % 7) + 1) || configs[0];
    const coinsEarned = (dayConfig?.baseCoins || 10) + (dayConfig?.streakBonus || 0) * Math.floor(newStreak / 7);

    if (status) {
      const [updated] = await db.update(dailyRewards)
        .set({
          lastClaimDate: today,
          currentStreak: newStreak,
          longestStreak: Math.max(status.longestStreak, newStreak),
          totalClaimed: status.totalClaimed + 1,
          totalCoinsEarned: status.totalCoinsEarned + coinsEarned,
          updatedAt: new Date(),
        })
        .where(eq(dailyRewards.userId, userId))
        .returning();
      status = updated;
    } else {
      const [created] = await db.insert(dailyRewards).values({
        userId,
        lastClaimDate: today,
        currentStreak: 1,
        longestStreak: 1,
        totalClaimed: 1,
        totalCoinsEarned: coinsEarned,
      }).returning();
      status = created;
    }

    const { wallet } = await this.addCoins(userId, coinsEarned, "DAILY_REWARD", `Day ${newStreak} daily reward`);

    return { reward: status, coinsEarned, wallet };
  }

  // ===== MALL WISHLISTS & REVIEWS =====

  async addToWishlist(userId: string, itemId: string): Promise<MallWishlist> {
    const [wishlist] = await db.insert(mallWishlists).values({ userId, itemId }).returning();
    return wishlist;
  }

  async removeFromWishlist(userId: string, itemId: string): Promise<void> {
    await db.delete(mallWishlists).where(and(eq(mallWishlists.userId, userId), eq(mallWishlists.itemId, itemId)));
  }

  async getWishlist(userId: string): Promise<MallWishlist[]> {
    return db.select().from(mallWishlists).where(eq(mallWishlists.userId, userId)).orderBy(desc(mallWishlists.createdAt));
  }

  async createReview(userId: string, itemId: string, rating: number, review?: string): Promise<MallReview> {
    const purchases = await db.select().from(mallPurchases)
      .where(and(eq(mallPurchases.userId, userId), eq(mallPurchases.itemId, itemId)))
      .limit(1);
    
    const [created] = await db.insert(mallReviews).values({
      userId,
      itemId,
      rating,
      review,
      isVerifiedPurchase: purchases.length > 0,
    }).returning();
    return created;
  }

  async getItemReviews(itemId: string, limit = 20): Promise<MallReview[]> {
    return db.select().from(mallReviews)
      .where(and(eq(mallReviews.itemId, itemId), eq(mallReviews.isHidden, false)))
      .orderBy(desc(mallReviews.createdAt))
      .limit(limit);
  }

  // ===== GIFT OPERATIONS =====

  async getGiftTypes(activeOnly = true): Promise<GiftType[]> {
    const query = activeOnly
      ? db.select().from(giftTypes).where(eq(giftTypes.isActive, true))
      : db.select().from(giftTypes);
    return query.orderBy(giftTypes.sortOrder);
  }

  async getGiftType(id: string): Promise<GiftType | null> {
    const result = await db.select().from(giftTypes).where(eq(giftTypes.id, id)).limit(1);
    return result[0] || null;
  }

  async sendGift(senderId: string, recipientId: string, giftTypeId: string, quantity: number, contextType?: string, contextId?: string, message?: string): Promise<{ transaction: GiftTransaction; senderWallet: Wallet }> {
    const gift = await this.getGiftType(giftTypeId);
    if (!gift) throw new Error("Gift type not found");
    if (!gift.isActive) throw new Error("Gift type is disabled");

    const totalCoins = gift.coinCost * quantity;
    const netWorthValue = gift.netWorthValue * quantity;

    const { wallet: senderWallet } = await this.deductCoins(
      senderId,
      totalCoins,
      "GIFT_SENT",
      `Sent ${quantity}x ${gift.name} gift`,
      "gift",
      giftTypeId
    );

    const [transaction] = await db.insert(giftTransactions).values({
      senderId,
      recipientId,
      giftTypeId,
      quantity,
      totalCoins,
      contextType,
      contextId,
      message,
    }).returning();

    if (netWorthValue > 0) {
      await db.update(users)
        .set({ netWorth: sql`${users.netWorth} + ${netWorthValue}` })
        .where(eq(users.id, recipientId));

      await db.insert(netWorthLedger).values({
        userId: recipientId,
        delta: netWorthValue,
        reason: "GIFT",
        refType: "gift_transaction",
        refId: transaction.id,
      });
    }

    return { transaction, senderWallet };
  }

  // ===== WITHDRAWALS =====

  async createWithdrawalRequest(userId: string, bankAccountId: string, amountCoins: number): Promise<WithdrawalRequest> {
    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.isFrozen) throw new Error("Wallet is frozen");
    if (wallet.coinBalance < amountCoins) throw new Error("Insufficient balance");

    const kyc = await db.select().from(userKyc).where(eq(userKyc.userId, userId)).limit(1);
    if (!kyc[0] || kyc[0].status !== "APPROVED") throw new Error("KYC verification required");

    const platformFeeCoins = Math.floor(amountCoins * 0.5);
    const netAmountCoins = amountCoins - platformFeeCoins;
    const amountRands = Math.floor(netAmountCoins / 100);

    await this.deductCoins(userId, amountCoins, "WITHDRAWAL", "Withdrawal request", "withdrawal", "pending");

    const [request] = await db.insert(withdrawalRequests).values({
      userId,
      bankAccountId,
      amountCoins,
      platformFeeCoins,
      netAmountCoins,
      amountRands,
      status: "PENDING",
    }).returning();

    return request;
  }

  async getWithdrawalRequests(userId?: string, status?: string, limit = 50): Promise<WithdrawalRequest[]> {
    let query = db.select().from(withdrawalRequests);
    const conditions: SQL[] = [];
    
    if (userId) conditions.push(eq(withdrawalRequests.userId, userId));
    if (status) conditions.push(eq(withdrawalRequests.status, status as any));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return query.orderBy(desc(withdrawalRequests.createdAt)).limit(limit);
  }

  async approveWithdrawal(requestId: string, adminId: string, paymentReference?: string): Promise<WithdrawalRequest> {
    const [request] = await db.update(withdrawalRequests)
      .set({
        status: "APPROVED",
        processedBy: adminId,
        processedAt: new Date(),
        paymentReference,
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, requestId))
      .returning();

    await db.insert(platformRevenue).values({
      source: "WITHDRAWAL_FEE",
      amountRands: Math.floor(request.platformFeeCoins / 100),
      referenceType: "withdrawal",
      referenceId: requestId,
      userId: request.userId,
    });

    return request;
  }

  async rejectWithdrawal(requestId: string, adminId: string, reason: string): Promise<WithdrawalRequest> {
    const [existing] = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, requestId)).limit(1);
    if (!existing) throw new Error("Request not found");

    await this.addCoins(existing.userId, existing.amountCoins, "WITHDRAWAL_REFUND", "Withdrawal rejected - refund", "withdrawal", requestId);

    const [request] = await db.update(withdrawalRequests)
      .set({
        status: "REJECTED",
        processedBy: adminId,
        processedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, requestId))
      .returning();

    return request;
  }

  // ===== BANK ACCOUNTS & KYC =====

  async addBankAccount(userId: string, data: Partial<UserBankAccount>): Promise<UserBankAccount> {
    const existing = await db.select().from(userBankAccounts).where(eq(userBankAccounts.userId, userId));
    const isPrimary = existing.length === 0;
    
    const [account] = await db.insert(userBankAccounts).values({
      ...data,
      userId,
      isPrimary,
    } as any).returning();
    return account;
  }

  async getUserBankAccounts(userId: string): Promise<UserBankAccount[]> {
    return db.select().from(userBankAccounts).where(eq(userBankAccounts.userId, userId)).orderBy(desc(userBankAccounts.createdAt));
  }

  async getBankAccountById(bankAccountId: string): Promise<UserBankAccount | undefined> {
    const [account] = await db.select().from(userBankAccounts).where(eq(userBankAccounts.id, bankAccountId)).limit(1);
    return account;
  }

  async deleteBankAccount(userId: string, bankAccountId: string): Promise<boolean> {
    const account = await this.getBankAccountById(bankAccountId);
    if (!account || account.userId !== userId) return false;
    
    const pendingWithdrawals = await db.select().from(withdrawalRequests)
      .where(and(
        eq(withdrawalRequests.bankAccountId, bankAccountId),
        inArray(withdrawalRequests.status, ["PENDING", "PROCESSING"])
      )).limit(1);
    
    if (pendingWithdrawals.length > 0) {
      throw new Error("Cannot delete bank account with pending withdrawals");
    }
    
    await db.delete(userBankAccounts).where(eq(userBankAccounts.id, bankAccountId));
    
    if (account.isPrimary) {
      const remaining = await this.getUserBankAccounts(userId);
      if (remaining.length > 0) {
        await db.update(userBankAccounts)
          .set({ isPrimary: true, updatedAt: new Date() })
          .where(eq(userBankAccounts.id, remaining[0].id));
      }
    }
    
    return true;
  }

  async setPrimaryBankAccount(userId: string, bankAccountId: string): Promise<UserBankAccount> {
    const account = await this.getBankAccountById(bankAccountId);
    if (!account || account.userId !== userId) {
      throw new Error("Bank account not found");
    }
    
    await db.update(userBankAccounts)
      .set({ isPrimary: false, updatedAt: new Date() })
      .where(eq(userBankAccounts.userId, userId));
    
    const [updated] = await db.update(userBankAccounts)
      .set({ isPrimary: true, updatedAt: new Date() })
      .where(eq(userBankAccounts.id, bankAccountId))
      .returning();
    
    return updated;
  }

  async getWithdrawalById(withdrawalId: string): Promise<WithdrawalRequest | undefined> {
    const [request] = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, withdrawalId)).limit(1);
    return request;
  }

  async processWithdrawal(requestId: string, adminId: string, paymentReference: string): Promise<WithdrawalRequest> {
    const existing = await this.getWithdrawalById(requestId);
    if (!existing) throw new Error("Withdrawal request not found");
    if (existing.status !== "APPROVED") throw new Error("Only approved withdrawals can be processed");

    const [request] = await db.update(withdrawalRequests)
      .set({
        status: "COMPLETED",
        paymentReference,
        processedBy: adminId,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, requestId))
      .returning();

    return request;
  }

  async getOrCreateKyc(userId: string): Promise<UserKyc> {
    const existing = await db.select().from(userKyc).where(eq(userKyc.userId, userId)).limit(1);
    if (existing.length > 0) return existing[0];
    
    const [kyc] = await db.insert(userKyc).values({ userId }).returning();
    return kyc;
  }

  async updateKyc(userId: string, data: Partial<UserKyc>): Promise<UserKyc> {
    const [kyc] = await db.update(userKyc)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userKyc.userId, userId))
      .returning();
    return kyc;
  }

  async submitKyc(userId: string, data: Partial<UserKyc>): Promise<UserKyc> {
    const [kyc] = await db.update(userKyc)
      .set({
        ...data,
        status: "PENDING",
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userKyc.userId, userId))
      .returning();
    return kyc;
  }

  async reviewKyc(userId: string, status: "APPROVED" | "REJECTED", adminId: string, rejectionReason?: string): Promise<UserKyc> {
    const [kyc] = await db.update(userKyc)
      .set({
        status,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        expiresAt: status === "APPROVED" ? new Date(Date.now() + 365 * 86400000) : null,
        updatedAt: new Date(),
      })
      .where(eq(userKyc.userId, userId))
      .returning();
    return kyc;
  }

  async getPendingKycReviews(limit = 50): Promise<UserKyc[]> {
    return db.select().from(userKyc)
      .where(eq(userKyc.status, "PENDING"))
      .orderBy(userKyc.submittedAt)
      .limit(limit);
  }

  // ===== PLATFORM STATS =====

  async getEconomyStats(): Promise<{
    totalCoinsInCirculation: number;
    totalWallets: number;
    totalRevenue: number;
    pendingWithdrawals: number;
    averageBalance: number;
  }> {
    const [walletStats] = await db.select({
      total: sql<number>`COALESCE(SUM(${wallets.coinBalance}), 0)`,
      count: sql<number>`COUNT(*)`,
      avg: sql<number>`COALESCE(AVG(${wallets.coinBalance}), 0)`,
    }).from(wallets);

    const [revenueStats] = await db.select({
      total: sql<number>`COALESCE(SUM(${platformRevenue.amountRands}), 0)`,
    }).from(platformRevenue);

    const [withdrawalStats] = await db.select({
      pending: sql<number>`COUNT(*)`,
    }).from(withdrawalRequests).where(eq(withdrawalRequests.status, "PENDING"));

    return {
      totalCoinsInCirculation: Number(walletStats.total),
      totalWallets: Number(walletStats.count),
      totalRevenue: Number(revenueStats.total),
      pendingWithdrawals: Number(withdrawalStats.pending),
      averageBalance: Math.floor(Number(walletStats.avg)),
    };
  }

  async getRevenueBySource(startDate?: Date, endDate?: Date): Promise<{ source: string; total: number }[]> {
    let query = db.select({
      source: platformRevenue.source,
      total: sql<number>`SUM(${platformRevenue.amountRands})`,
    }).from(platformRevenue);

    const conditions: SQL[] = [];
    if (startDate) conditions.push(gte(platformRevenue.createdAt, startDate));
    if (endDate) conditions.push(lte(platformRevenue.createdAt, endDate));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return query.groupBy(platformRevenue.source) as any;
  }

  async getGiftStats(): Promise<{
    totalGiftsSent: number;
    totalCoinsGifted: number;
    topGiftTypes: { giftTypeId: string; name: string; count: number }[];
  }> {
    const [stats] = await db.select({
      total: sql<number>`COUNT(*)`,
      coins: sql<number>`COALESCE(SUM(${giftTransactions.totalCoins}), 0)`,
    }).from(giftTransactions);

    const topGifts = await db.select({
      giftTypeId: giftTransactions.giftTypeId,
      name: giftTypes.name,
      count: sql<number>`COUNT(*)`,
    })
    .from(giftTransactions)
    .leftJoin(giftTypes, eq(giftTransactions.giftTypeId, giftTypes.id))
    .groupBy(giftTransactions.giftTypeId, giftTypes.name)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

    return {
      totalGiftsSent: Number(stats.total),
      totalCoinsGifted: Number(stats.coins),
      topGiftTypes: topGifts.map(g => ({
        giftTypeId: g.giftTypeId,
        name: g.name || "Unknown",
        count: Number(g.count),
      })),
    };
  }

  // ===== PLATFORM CONFIG =====

  async getPlatformConfig(category?: string): Promise<PlatformConfig[]> {
    if (category) {
      return db.select().from(platformConfig).where(eq(platformConfig.category, category));
    }
    return db.select().from(platformConfig);
  }

  async setPlatformConfig(key: string, value: string, category: string, adminId?: string): Promise<PlatformConfig> {
    const existing = await db.select().from(platformConfig).where(eq(platformConfig.key, key)).limit(1);
    
    if (existing.length > 0) {
      const [updated] = await db.update(platformConfig)
        .set({ value, updatedBy: adminId, updatedAt: new Date() })
        .where(eq(platformConfig.key, key))
        .returning();
      return updated;
    }

    const [created] = await db.insert(platformConfig).values({
      key,
      value,
      category,
      updatedBy: adminId,
    }).returning();
    return created;
  }

  // ===== WEALTH CLUBS =====

  async getWealthClubs(): Promise<WealthClub[]> {
    return db.select().from(wealthClubs).orderBy(wealthClubs.minNetWorth);
  }

  async getUserWealthClub(userId: string): Promise<(UserWealthClub & WealthClub) | null> {
    const result = await db.select()
      .from(userWealthClub)
      .innerJoin(wealthClubs, eq(userWealthClub.clubId, wealthClubs.id))
      .where(eq(userWealthClub.userId, userId))
      .limit(1);
    
    if (result.length === 0) return null;
    
    return {
      ...result[0].user_wealth_club,
      ...result[0].wealth_clubs,
    };
  }

  async updateUserWealthClub(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const clubs = await this.getWealthClubs();
    let matchingClub: WealthClub | null = null;

    for (const club of clubs) {
      if (user.netWorth >= club.minNetWorth) {
        if (!club.maxNetWorth || user.netWorth <= club.maxNetWorth) {
          matchingClub = club;
        }
      }
    }

    if (!matchingClub) return;

    const existing = await db.select()
      .from(userWealthClub)
      .where(eq(userWealthClub.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].clubId !== matchingClub.id) {
        await db.update(userWealthClub)
          .set({ clubId: matchingClub.id, updatedAt: new Date() })
          .where(eq(userWealthClub.userId, userId));
      }
    } else {
      await db.insert(userWealthClub).values({
        userId,
        clubId: matchingClub.id,
      });
    }
  }

  // ===== GIFT STAKING =====

  async getStakingTiers(): Promise<StakingTier[]> {
    return db.select()
      .from(stakingTiers)
      .where(eq(stakingTiers.isActive, true))
      .orderBy(stakingTiers.sortOrder);
  }

  async createGiftStake(userId: string, giftTransactionId: string, tierId: string): Promise<GiftStake> {
    const tier = await db.select().from(stakingTiers).where(eq(stakingTiers.id, tierId)).limit(1);
    if (tier.length === 0) {
      throw new Error("Invalid staking tier");
    }

    const transaction = await db.select().from(giftTransactions).where(eq(giftTransactions.id, giftTransactionId)).limit(1);
    if (transaction.length === 0) {
      throw new Error("Invalid gift transaction");
    }

    const stakedCoins = transaction[0].totalCoins;
    const bonusPercent = tier[0].bonusPercent;
    const expectedReturn = Math.floor(stakedCoins * (1 + bonusPercent / 100));
    const maturesAt = new Date();
    maturesAt.setDate(maturesAt.getDate() + tier[0].durationDays);

    const [stake] = await db.insert(giftStakes).values({
      userId,
      giftTransactionId,
      stakedCoins,
      stakeDurationDays: tier[0].durationDays,
      bonusPercent,
      expectedReturn,
      maturesAt,
    }).returning();

    return stake;
  }

  async getUserStakes(userId: string): Promise<GiftStake[]> {
    return db.select()
      .from(giftStakes)
      .where(and(
        eq(giftStakes.userId, userId),
        eq(giftStakes.status, "ACTIVE")
      ))
      .orderBy(giftStakes.maturesAt);
  }

  async claimMaturedStake(stakeId: string, userId: string): Promise<{ stake: GiftStake; coinsEarned: number }> {
    const [stake] = await db.select()
      .from(giftStakes)
      .where(and(
        eq(giftStakes.id, stakeId),
        eq(giftStakes.userId, userId)
      ))
      .limit(1);

    if (!stake) {
      throw new Error("Stake not found");
    }

    if (stake.status !== "ACTIVE") {
      throw new Error("Stake is not active");
    }

    if (new Date() < stake.maturesAt) {
      throw new Error("Stake has not matured yet");
    }

    const [updatedStake] = await db.update(giftStakes)
      .set({ status: "CLAIMED", claimedAt: new Date() })
      .where(eq(giftStakes.id, stakeId))
      .returning();

    const wallet = await this.getOrCreateWallet(userId);
    const newBalance = wallet.coinBalance + stake.expectedReturn;
    await db.update(wallets)
      .set({ coinBalance: newBalance, lifetimeEarned: sql`${wallets.lifetimeEarned} + ${stake.expectedReturn}` })
      .where(eq(wallets.userId, userId));

    await db.insert(coinTransactions).values({
      walletId: wallet.id,
      type: "ADMIN_CREDIT",
      amount: stake.expectedReturn,
      balanceAfter: newBalance,
      description: `Staking reward claimed`,
    });

    return { stake: updatedStake, coinsEarned: stake.expectedReturn };
  }

  // ===== CREATOR MONETIZATION =====

  async getOrCreateCreatorEarnings(userId: string): Promise<CreatorEarnings> {
    const existing = await db.select()
      .from(creatorEarnings)
      .where(eq(creatorEarnings.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [created] = await db.insert(creatorEarnings).values({
      userId,
      totalEarningsCoins: 0,
      pendingWithdrawalCoins: 0,
      withdrawnCoins: 0,
      platformFeePaid: 0,
    }).returning();

    return created;
  }

  async addCreatorEarning(
    userId: string,
    amount: number,
    sourceType: string,
    sourceId?: string,
    description?: string
  ): Promise<void> {
    const earnings = await this.getOrCreateCreatorEarnings(userId);

    await db.update(creatorEarnings)
      .set({
        totalEarningsCoins: earnings.totalEarningsCoins + amount,
        pendingWithdrawalCoins: earnings.pendingWithdrawalCoins + amount,
        lastUpdated: new Date(),
      })
      .where(eq(creatorEarnings.userId, userId));

    await db.insert(earningsHistory).values({
      userId,
      amount,
      sourceType,
      sourceId,
      description,
    });
  }

  async getCreatorEarningsHistory(userId: string, limit: number = 50, offset: number = 0): Promise<EarningsHistory[]> {
    return db.select()
      .from(earningsHistory)
      .where(eq(earningsHistory.userId, userId))
      .orderBy(desc(earningsHistory.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // ===== ACHIEVEMENTS =====

  async getAchievements(): Promise<Achievement[]> {
    return db.select()
      .from(achievements)
      .where(eq(achievements.isActive, true))
      .orderBy(achievements.sortOrder);
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return db.select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.updatedAt));
  }

  async checkAndAwardAchievements(userId: string): Promise<Achievement[]> {
    const allAchievements = await this.getAchievements();
    const userAchievementsList = await this.getUserAchievements(userId);
    const existingAchievementIds = new Set(userAchievementsList.map(ua => ua.achievementId));
    
    const newlyCompleted: Achievement[] = [];

    for (const achievement of allAchievements) {
      if (existingAchievementIds.has(achievement.id)) continue;

      const userAchievement = userAchievementsList.find(ua => ua.achievementId === achievement.id);
      if (userAchievement?.isCompleted) continue;

      const progressMax = parseInt(achievement.requirement) || 1;
      
      if (!userAchievement) {
        await db.insert(userAchievements).values({
          userId,
          achievementId: achievement.id,
          progress: 0,
          progressMax,
          isCompleted: false,
        });
      }
    }

    for (const userAchievement of userAchievementsList) {
      if (!userAchievement.isCompleted && userAchievement.progress >= userAchievement.progressMax) {
        await db.update(userAchievements)
          .set({
            isCompleted: true,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(userAchievements.id, userAchievement.id));

        const achievement = allAchievements.find(a => a.id === userAchievement.achievementId);
        if (achievement) {
          newlyCompleted.push(achievement);
        }
      }
    }

    return newlyCompleted;
  }

  async claimAchievementReward(userId: string, achievementId: string): Promise<number> {
    const [userAchievement] = await db.select()
      .from(userAchievements)
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievementId)
      ))
      .limit(1);

    if (!userAchievement) {
      throw new Error("Achievement not found for user");
    }

    if (!userAchievement.isCompleted) {
      throw new Error("Achievement not completed");
    }

    if (userAchievement.rewardClaimed) {
      throw new Error("Reward already claimed");
    }

    const [achievement] = await db.select()
      .from(achievements)
      .where(eq(achievements.id, achievementId))
      .limit(1);

    if (!achievement) {
      throw new Error("Achievement not found");
    }

    await db.update(userAchievements)
      .set({ rewardClaimed: true, updatedAt: new Date() })
      .where(eq(userAchievements.id, userAchievement.id));

    if (achievement.rewardCoins > 0) {
      const wallet = await this.getOrCreateWallet(userId);
      const newBalance = wallet.coinBalance + achievement.rewardCoins;
      await db.update(wallets)
        .set({ coinBalance: newBalance, lifetimeEarned: sql`${wallets.lifetimeEarned} + ${achievement.rewardCoins}` })
        .where(eq(wallets.userId, userId));

      await db.insert(coinTransactions).values({
        walletId: wallet.id,
        type: "ADMIN_CREDIT",
        amount: achievement.rewardCoins,
        balanceAfter: newBalance,
        description: `Achievement reward: ${achievement.name}`,
      });
    }

    return achievement.rewardCoins;
  }

  // ===== PLATFORM BATTLES =====

  async getActiveBattles(): Promise<PlatformBattle[]> {
    const now = new Date();
    return db.select()
      .from(platformBattles)
      .where(and(
        eq(platformBattles.status, "ACTIVE"),
        lte(platformBattles.startsAt, now),
        gte(platformBattles.endsAt, now)
      ))
      .orderBy(platformBattles.startsAt);
  }

  async createBattle(creatorId: string, data: {
    name: string;
    description?: string;
    entryFeeCoins?: number;
    maxParticipants?: number;
    startsAt: Date;
    endsAt: Date;
  }): Promise<PlatformBattle> {
    const [battle] = await db.insert(platformBattles).values({
      creatorId,
      name: data.name,
      description: data.description,
      entryFeeCoins: data.entryFeeCoins || 0,
      maxParticipants: data.maxParticipants,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      status: "PENDING",
      prizePoolCoins: 0,
    }).returning();

    return battle;
  }

  async joinBattle(battleId: string, userId: string): Promise<BattleParticipant> {
    const [battle] = await db.select()
      .from(platformBattles)
      .where(eq(platformBattles.id, battleId))
      .limit(1);

    if (!battle) {
      throw new Error("Battle not found");
    }

    if (battle.status !== "PENDING" && battle.status !== "ACTIVE") {
      throw new Error("Battle is not accepting participants");
    }

    const existingParticipant = await db.select()
      .from(battleParticipants)
      .where(and(
        eq(battleParticipants.battleId, battleId),
        eq(battleParticipants.userId, userId)
      ))
      .limit(1);

    if (existingParticipant.length > 0) {
      throw new Error("Already joined this battle");
    }

    if (battle.maxParticipants) {
      const currentCount = await db.select({ count: sql<number>`COUNT(*)` })
        .from(battleParticipants)
        .where(eq(battleParticipants.battleId, battleId));
      
      if (Number(currentCount[0].count) >= battle.maxParticipants) {
        throw new Error("Battle is full");
      }
    }

    if (battle.entryFeeCoins > 0) {
      const wallet = await this.getOrCreateWallet(userId);
      if (wallet.coinBalance < battle.entryFeeCoins) {
        throw new Error("Insufficient coins for entry fee");
      }

      const newBalance = wallet.coinBalance - battle.entryFeeCoins;
      await db.update(wallets)
        .set({ coinBalance: newBalance, lifetimeSpent: sql`${wallets.lifetimeSpent} + ${battle.entryFeeCoins}` })
        .where(eq(wallets.userId, userId));

      await db.insert(coinTransactions).values({
        walletId: wallet.id,
        type: "ADMIN_DEBIT",
        amount: -battle.entryFeeCoins,
        balanceAfter: newBalance,
        description: `Battle entry fee: ${battle.name}`,
      });

      await db.update(platformBattles)
        .set({ prizePoolCoins: battle.prizePoolCoins + battle.entryFeeCoins })
        .where(eq(platformBattles.id, battleId));
    }

    const [participant] = await db.insert(battleParticipants).values({
      battleId,
      userId,
      totalGiftsReceived: 0,
      totalCoinsReceived: 0,
    }).returning();

    return participant;
  }

  async recordBattleGift(battleId: string, recipientId: string, coins: number): Promise<void> {
    const [participant] = await db.select()
      .from(battleParticipants)
      .where(and(
        eq(battleParticipants.battleId, battleId),
        eq(battleParticipants.userId, recipientId)
      ))
      .limit(1);

    if (!participant) {
      throw new Error("Recipient is not a battle participant");
    }

    await db.update(battleParticipants)
      .set({
        totalGiftsReceived: participant.totalGiftsReceived + 1,
        totalCoinsReceived: participant.totalCoinsReceived + coins,
      })
      .where(eq(battleParticipants.id, participant.id));

    await db.update(platformBattles)
      .set({ prizePoolCoins: sql`${platformBattles.prizePoolCoins} + ${coins}` })
      .where(eq(platformBattles.id, battleId));
  }

  async endBattle(battleId: string): Promise<PlatformBattle> {
    const [battle] = await db.select()
      .from(platformBattles)
      .where(eq(platformBattles.id, battleId))
      .limit(1);

    if (!battle) {
      throw new Error("Battle not found");
    }

    const participants = await db.select()
      .from(battleParticipants)
      .where(eq(battleParticipants.battleId, battleId))
      .orderBy(desc(battleParticipants.totalCoinsReceived));

    for (let i = 0; i < participants.length; i++) {
      await db.update(battleParticipants)
        .set({ rank: i + 1 })
        .where(eq(battleParticipants.id, participants[i].id));
    }

    const winner = participants[0];
    let updatedBattle: PlatformBattle;

    if (winner && battle.prizePoolCoins > 0) {
      const platformFee = Math.floor(battle.prizePoolCoins * (battle.platformFeePercent / 100));
      const winnerPrize = battle.prizePoolCoins - platformFee;

      const wallet = await this.getOrCreateWallet(winner.userId);
      const newBalance = wallet.coinBalance + winnerPrize;
      await db.update(wallets)
        .set({ coinBalance: newBalance, lifetimeEarned: sql`${wallets.lifetimeEarned} + ${winnerPrize}` })
        .where(eq(wallets.userId, winner.userId));

      await db.insert(coinTransactions).values({
        walletId: wallet.id,
        type: "ADMIN_CREDIT",
        amount: winnerPrize,
        balanceAfter: newBalance,
        description: `Battle winner prize: ${battle.name}`,
      });

      if (platformFee > 0) {
        await db.insert(platformRevenue).values({
          source: "BATTLE_FEE",
          amountRands: Math.floor(platformFee / 100),
          referenceId: battleId,
          referenceType: "battle",
        });
      }

      [updatedBattle] = await db.update(platformBattles)
        .set({
          status: "COMPLETED",
          winnerId: winner.userId,
        })
        .where(eq(platformBattles.id, battleId))
        .returning();
    } else {
      [updatedBattle] = await db.update(platformBattles)
        .set({ status: "COMPLETED" })
        .where(eq(platformBattles.id, battleId))
        .returning();
    }

    return updatedBattle;
  }

  // ===== ECONOMY CONFIG =====

  async getEconomyConfig(): Promise<Record<string, string>> {
    const configs = await db.select().from(economyConfig);
    const result: Record<string, string> = {};
    for (const config of configs) {
      result[config.key] = config.value;
    }
    return result;
  }

  async setEconomyConfig(key: string, value: string, adminId?: string): Promise<void> {
    const existing = await db.select()
      .from(economyConfig)
      .where(eq(economyConfig.key, key))
      .limit(1);

    if (existing.length > 0) {
      await db.update(economyConfig)
        .set({ value, updatedBy: adminId, updatedAt: new Date() })
        .where(eq(economyConfig.key, key));
    } else {
      await db.insert(economyConfig).values({
        key,
        value,
        updatedBy: adminId,
      });
    }
  }

  async isFeatureEnabled(key: string): Promise<boolean> {
    const [config] = await db.select()
      .from(economyConfig)
      .where(eq(economyConfig.key, key))
      .limit(1);

    if (!config) return true;
    
    return config.value.toLowerCase() === "true" || config.value === "1" || config.value.toLowerCase() === "enabled";
  }
}

export const storage = new DatabaseStorage();
