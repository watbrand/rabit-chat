import type { Express, Request, Response, NextFunction } from "express";
import { advancedStorage } from "./storage-advanced";
import { storage } from "./storage";
import { pushNotificationService } from "./services/push-notifications";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export function registerAdvancedRoutes(app: Express) {
  // ============================================
  // VIRTUAL CURRENCY / WALLETS
  // ============================================

  app.get("/api/wallet", requireAuth, async (req, res) => {
    try {
      const wallet = await advancedStorage.getOrCreateWallet(req.session.userId!);
      res.json(wallet);
    } catch (error) {
      console.error("Get wallet error:", error);
      res.status(500).json({ message: "Failed to get wallet" });
    }
  });

  app.get("/api/wallet/transactions", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await advancedStorage.getCoinTransactions(req.session.userId!, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  app.post("/api/wallet/add-coins", requireAuth, async (req, res) => {
    try {
      const { amount, type, description } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      const transaction = await advancedStorage.addCoins(
        req.session.userId!,
        amount,
        type || 'PURCHASE',
        description
      );
      res.json(transaction);
    } catch (error) {
      console.error("Add coins error:", error);
      res.status(500).json({ message: "Failed to add coins" });
    }
  });

  // ============================================
  // GIFTS
  // ============================================

  app.get("/api/gifts/types", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const giftTypes = await advancedStorage.getGiftTypes(category);
      res.json(giftTypes);
    } catch (error) {
      console.error("Get gift types error:", error);
      res.status(500).json({ message: "Failed to get gift types" });
    }
  });

  app.post("/api/gifts/send", requireAuth, async (req, res) => {
    try {
      const { recipientId, giftTypeId, quantity, contextType, contextId, message } = req.body;
      if (!recipientId || !giftTypeId) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const transaction = await advancedStorage.sendGift(
        req.session.userId!,
        recipientId,
        giftTypeId,
        quantity || 1,
        contextType,
        contextId,
        message
      );
      if (!transaction) {
        return res.status(400).json({ message: "Insufficient coins or invalid gift type" });
      }
      
      const sender = await storage.getUser(req.session.userId!);
      pushNotificationService.sendToUser(recipientId, {
        title: "Gift Received!",
        body: `${sender?.displayName || sender?.username || 'Someone'} sent you ${transaction.quantity} gift(s)`,
        data: { type: 'gift_received', transactionId: transaction.id }
      });
      
      res.json(transaction);
    } catch (error) {
      console.error("Send gift error:", error);
      res.status(500).json({ message: "Failed to send gift" });
    }
  });

  app.get("/api/gifts/received", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const gifts = await advancedStorage.getReceivedGifts(req.session.userId!, limit);
      res.json(gifts);
    } catch (error) {
      console.error("Get received gifts error:", error);
      res.status(500).json({ message: "Failed to get received gifts" });
    }
  });

  // ============================================
  // LIVE STREAMING
  // ============================================

  app.post("/api/live-streams", requireAuth, async (req, res) => {
    try {
      const { title, description } = req.body;
      const stream = await advancedStorage.createLiveStream(req.session.userId!, title, description);
      res.json(stream);
    } catch (error) {
      console.error("Create live stream error:", error);
      res.status(500).json({ message: "Failed to create live stream" });
    }
  });

  app.get("/api/live-streams", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const streams = await advancedStorage.getActiveLiveStreams(limit);
      res.json(streams);
    } catch (error) {
      console.error("Get live streams error:", error);
      res.status(500).json({ message: "Failed to get live streams" });
    }
  });

  app.get("/api/live-streams/:id", async (req, res) => {
    try {
      const stream = await advancedStorage.getLiveStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      res.json(stream);
    } catch (error) {
      console.error("Get live stream error:", error);
      res.status(500).json({ message: "Failed to get live stream" });
    }
  });

  app.post("/api/live-streams/:id/start", requireAuth, async (req, res) => {
    try {
      const stream = await advancedStorage.getLiveStream(req.params.id);
      if (!stream || stream.hostId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const updated = await advancedStorage.startLiveStream(req.params.id);
      
      const followers = await storage.getFollowers(req.session.userId!);
      const host = await storage.getUser(req.session.userId!);
      for (const follower of followers) {
        pushNotificationService.sendToUser(follower.id, {
          title: "Live Now!",
          body: `${host?.displayName || host?.username || 'Someone'} started a live stream`,
          data: { type: 'live_stream', streamId: req.params.id }
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Start live stream error:", error);
      res.status(500).json({ message: "Failed to start live stream" });
    }
  });

  app.post("/api/live-streams/:id/end", requireAuth, async (req, res) => {
    try {
      const stream = await advancedStorage.getLiveStream(req.params.id);
      if (!stream || stream.hostId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const saveToProfile = req.body.saveToProfile || false;
      const updated = await advancedStorage.endLiveStream(req.params.id, saveToProfile);
      res.json(updated);
    } catch (error) {
      console.error("End live stream error:", error);
      res.status(500).json({ message: "Failed to end live stream" });
    }
  });

  app.post("/api/live-streams/:id/join", requireAuth, async (req, res) => {
    try {
      const viewer = await advancedStorage.joinLiveStream(req.params.id, req.session.userId!);
      res.json(viewer);
    } catch (error) {
      console.error("Join live stream error:", error);
      res.status(500).json({ message: "Failed to join live stream" });
    }
  });

  app.post("/api/live-streams/:id/leave", requireAuth, async (req, res) => {
    try {
      await advancedStorage.leaveLiveStream(req.params.id, req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Leave live stream error:", error);
      res.status(500).json({ message: "Failed to leave live stream" });
    }
  });

  app.post("/api/live-streams/:id/comments", requireAuth, async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content required" });
      }
      const comment = await advancedStorage.addLiveStreamComment(req.params.id, req.session.userId!, content);
      res.json(comment);
    } catch (error) {
      console.error("Add live stream comment error:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  app.get("/api/live-streams/:id/comments", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const comments = await advancedStorage.getLiveStreamComments(req.params.id, limit);
      res.json(comments);
    } catch (error) {
      console.error("Get live stream comments error:", error);
      res.status(500).json({ message: "Failed to get comments" });
    }
  });

  app.post("/api/live-streams/:id/reactions", requireAuth, async (req, res) => {
    try {
      const { reactionType } = req.body;
      const reaction = await advancedStorage.addLiveStreamReaction(req.params.id, req.session.userId!, reactionType || 'HEART');
      res.json(reaction);
    } catch (error) {
      console.error("Add live stream reaction error:", error);
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });

  // ============================================
  // GROUPS / ELITE CIRCLES
  // ============================================

  app.post("/api/groups", requireAuth, async (req, res) => {
    try {
      const { name, description, privacy, netWorthRequirement } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Name required" });
      }
      const group = await advancedStorage.createGroup(
        req.session.userId!,
        name,
        description,
        privacy || 'PUBLIC',
        netWorthRequirement
      );
      res.json(group);
    } catch (error) {
      console.error("Create group error:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  app.get("/api/groups", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const groups = await advancedStorage.getPublicGroups(limit);
      res.json(groups);
    } catch (error) {
      console.error("Get groups error:", error);
      res.status(500).json({ message: "Failed to get groups" });
    }
  });

  app.get("/api/groups/my", requireAuth, async (req, res) => {
    try {
      const groups = await advancedStorage.getUserGroups(req.session.userId!);
      res.json(groups);
    } catch (error) {
      console.error("Get my groups error:", error);
      res.status(500).json({ message: "Failed to get groups" });
    }
  });

  app.get("/api/groups/:id", async (req, res) => {
    try {
      const group = await advancedStorage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      console.error("Get group error:", error);
      res.status(500).json({ message: "Failed to get group" });
    }
  });

  app.get("/api/groups/:id/members", async (req, res) => {
    try {
      const members = await advancedStorage.getGroupMembers(req.params.id);
      res.json(members);
    } catch (error) {
      console.error("Get group members error:", error);
      res.status(500).json({ message: "Failed to get members" });
    }
  });

  app.post("/api/groups/:id/join", requireAuth, async (req, res) => {
    try {
      const result = await advancedStorage.joinGroup(req.params.id, req.session.userId!);
      if (!result) {
        return res.status(400).json({ message: "Cannot join group" });
      }
      res.json(result);
    } catch (error) {
      console.error("Join group error:", error);
      res.status(500).json({ message: "Failed to join group" });
    }
  });

  app.post("/api/groups/:id/leave", requireAuth, async (req, res) => {
    try {
      await advancedStorage.leaveGroup(req.params.id, req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Leave group error:", error);
      res.status(500).json({ message: "Failed to leave group" });
    }
  });

  // ============================================
  // EVENTS
  // ============================================

  app.post("/api/events", requireAuth, async (req, res) => {
    try {
      const event = await advancedStorage.createEvent(req.session.userId!, req.body);
      res.json(event);
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.get("/api/events", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const events = await advancedStorage.getUpcomingEvents(limit);
      res.json(events);
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ message: "Failed to get events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await advancedStorage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Get event error:", error);
      res.status(500).json({ message: "Failed to get event" });
    }
  });

  app.post("/api/events/:id/rsvp", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      if (!['GOING', 'INTERESTED', 'NOT_GOING'].includes(status)) {
        return res.status(400).json({ message: "Invalid RSVP status" });
      }
      const rsvp = await advancedStorage.rsvpEvent(req.params.id, req.session.userId!, status);
      res.json(rsvp);
    } catch (error) {
      console.error("RSVP event error:", error);
      res.status(500).json({ message: "Failed to RSVP" });
    }
  });

  // ============================================
  // SUBSCRIPTIONS / SUPER FOLLOWS
  // ============================================

  app.get("/api/subscriptions/tiers/:creatorId", async (req, res) => {
    try {
      const tiers = await advancedStorage.getCreatorSubscriptionTiers(req.params.creatorId);
      res.json(tiers);
    } catch (error) {
      console.error("Get subscription tiers error:", error);
      res.status(500).json({ message: "Failed to get tiers" });
    }
  });

  app.post("/api/subscriptions/tiers", requireAuth, async (req, res) => {
    try {
      const { name, monthlyPriceCoins, description, benefits } = req.body;
      if (!name || !monthlyPriceCoins) {
        return res.status(400).json({ message: "Name and price required" });
      }
      const tier = await advancedStorage.createSubscriptionTier(
        req.session.userId!,
        name,
        monthlyPriceCoins,
        description,
        benefits
      );
      res.json(tier);
    } catch (error) {
      console.error("Create subscription tier error:", error);
      res.status(500).json({ message: "Failed to create tier" });
    }
  });

  app.post("/api/subscriptions/subscribe", requireAuth, async (req, res) => {
    try {
      const { creatorId, tierId } = req.body;
      if (!creatorId || !tierId) {
        return res.status(400).json({ message: "Creator and tier required" });
      }
      const subscription = await advancedStorage.subscribe(req.session.userId!, creatorId, tierId);
      if (!subscription) {
        return res.status(400).json({ message: "Insufficient coins or invalid tier" });
      }
      res.json(subscription);
    } catch (error) {
      console.error("Subscribe error:", error);
      res.status(500).json({ message: "Failed to subscribe" });
    }
  });

  app.get("/api/subscriptions/check/:creatorId", requireAuth, async (req, res) => {
    try {
      const isSubscribed = await advancedStorage.isSubscribed(req.session.userId!, req.params.creatorId);
      res.json({ isSubscribed });
    } catch (error) {
      console.error("Check subscription error:", error);
      res.status(500).json({ message: "Failed to check subscription" });
    }
  });

  // ============================================
  // BROADCAST CHANNELS
  // ============================================

  app.post("/api/broadcast-channels", requireAuth, async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Name required" });
      }
      const channel = await advancedStorage.createBroadcastChannel(req.session.userId!, name, description);
      res.json(channel);
    } catch (error) {
      console.error("Create broadcast channel error:", error);
      res.status(500).json({ message: "Failed to create channel" });
    }
  });

  app.get("/api/broadcast-channels/:id", async (req, res) => {
    try {
      const channel = await advancedStorage.getBroadcastChannel(req.params.id);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      res.json(channel);
    } catch (error) {
      console.error("Get broadcast channel error:", error);
      res.status(500).json({ message: "Failed to get channel" });
    }
  });

  app.post("/api/broadcast-channels/:id/subscribe", requireAuth, async (req, res) => {
    try {
      const subscriber = await advancedStorage.subscribeToBroadcastChannel(req.params.id, req.session.userId!);
      res.json(subscriber);
    } catch (error) {
      console.error("Subscribe to channel error:", error);
      res.status(500).json({ message: "Failed to subscribe" });
    }
  });

  app.post("/api/broadcast-channels/:id/messages", requireAuth, async (req, res) => {
    try {
      const channel = await advancedStorage.getBroadcastChannel(req.params.id);
      if (!channel || channel.ownerId !== req.session.userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      const { content, mediaUrl, mediaType } = req.body;
      const message = await advancedStorage.sendBroadcastMessage(req.params.id, content, mediaUrl, mediaType);
      res.json(message);
    } catch (error) {
      console.error("Send broadcast message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/broadcast-channels/:id/messages", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await advancedStorage.getBroadcastMessages(req.params.id, limit);
      res.json(messages);
    } catch (error) {
      console.error("Get broadcast messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  // ============================================
  // POST REACTIONS
  // ============================================

  app.post("/api/posts/:id/reactions", requireAuth, async (req, res) => {
    try {
      const { reactionType } = req.body;
      if (!['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY', 'FIRE', 'DIAMOND', 'CROWN'].includes(reactionType)) {
        return res.status(400).json({ message: "Invalid reaction type" });
      }
      const reaction = await advancedStorage.addPostReaction(req.params.id, req.session.userId!, reactionType);
      res.json(reaction);
    } catch (error) {
      console.error("Add post reaction error:", error);
      res.status(500).json({ message: "Failed to add reaction" });
    }
  });

  app.delete("/api/posts/:id/reactions", requireAuth, async (req, res) => {
    try {
      await advancedStorage.removePostReaction(req.params.id, req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove post reaction error:", error);
      res.status(500).json({ message: "Failed to remove reaction" });
    }
  });

  app.get("/api/posts/:id/reactions", async (req, res) => {
    try {
      const reactions = await advancedStorage.getPostReactions(req.params.id);
      res.json(reactions);
    } catch (error) {
      console.error("Get post reactions error:", error);
      res.status(500).json({ message: "Failed to get reactions" });
    }
  });

  // ============================================
  // LOCATION SHARING
  // ============================================

  app.put("/api/location", requireAuth, async (req, res) => {
    try {
      const { latitude, longitude, locationName } = req.body;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ message: "Invalid coordinates" });
      }
      const location = await advancedStorage.updateUserLocation(req.session.userId!, latitude, longitude, locationName);
      res.json(location);
    } catch (error) {
      console.error("Update location error:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  app.put("/api/location/sharing", requireAuth, async (req, res) => {
    try {
      const { isSharing, sharingMode, expiresAt } = req.body;
      const location = await advancedStorage.setLocationSharing(
        req.session.userId!,
        isSharing,
        sharingMode,
        expiresAt ? new Date(expiresAt) : undefined
      );
      res.json(location);
    } catch (error) {
      console.error("Set location sharing error:", error);
      res.status(500).json({ message: "Failed to update sharing" });
    }
  });

  app.get("/api/location/nearby", requireAuth, async (req, res) => {
    try {
      const radiusKm = parseFloat(req.query.radius as string) || 10;
      const nearbyUsers = await advancedStorage.getNearbyUsers(req.session.userId!, radiusKm);
      res.json(nearbyUsers);
    } catch (error) {
      console.error("Get nearby users error:", error);
      res.status(500).json({ message: "Failed to get nearby users" });
    }
  });

  // ============================================
  // CHECK-INS & VENUES
  // ============================================

  app.get("/api/venues/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      const venues = await advancedStorage.searchVenues(query);
      res.json(venues);
    } catch (error) {
      console.error("Search venues error:", error);
      res.status(500).json({ message: "Failed to search venues" });
    }
  });

  app.post("/api/venues", requireAuth, async (req, res) => {
    try {
      const { name, category, address, city, country, latitude, longitude } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Name required" });
      }
      const venue = await advancedStorage.createVenue(name, category, address, city, country, latitude, longitude);
      res.json(venue);
    } catch (error) {
      console.error("Create venue error:", error);
      res.status(500).json({ message: "Failed to create venue" });
    }
  });

  app.post("/api/check-ins", requireAuth, async (req, res) => {
    try {
      const { venueId, customLocationName, latitude, longitude, postId, caption } = req.body;
      const checkIn = await advancedStorage.checkIn(
        req.session.userId!,
        venueId,
        customLocationName,
        latitude,
        longitude,
        postId,
        caption
      );
      res.json(checkIn);
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  app.get("/api/check-ins/my", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const checkIns = await advancedStorage.getUserCheckIns(req.session.userId!, limit);
      res.json(checkIns);
    } catch (error) {
      console.error("Get check-ins error:", error);
      res.status(500).json({ message: "Failed to get check-ins" });
    }
  });

  // ============================================
  // GROUP CONVERSATIONS
  // ============================================

  app.post("/api/group-conversations", requireAuth, async (req, res) => {
    try {
      const { name, memberIds } = req.body;
      const conversation = await advancedStorage.createGroupConversation(
        req.session.userId!,
        name,
        memberIds || []
      );
      res.json(conversation);
    } catch (error) {
      console.error("Create group conversation error:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get("/api/group-conversations", requireAuth, async (req, res) => {
    try {
      const conversations = await advancedStorage.getUserGroupConversations(req.session.userId!);
      res.json(conversations);
    } catch (error) {
      console.error("Get group conversations error:", error);
      res.status(500).json({ message: "Failed to get conversations" });
    }
  });

  app.get("/api/group-conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const messages = await advancedStorage.getGroupMessages(req.params.id, limit);
      res.json(messages);
    } catch (error) {
      console.error("Get group messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.post("/api/group-conversations/:id/messages", requireAuth, async (req, res) => {
    try {
      const { content, messageType, mediaUrl } = req.body;
      const message = await advancedStorage.sendGroupMessage(
        req.params.id,
        req.session.userId!,
        content,
        messageType,
        mediaUrl
      );
      res.json(message);
    } catch (error) {
      console.error("Send group message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ============================================
  // VIDEO CALLS
  // ============================================

  app.post("/api/calls/initiate", requireAuth, async (req, res) => {
    try {
      const { calleeId, callType } = req.body;
      if (!calleeId) {
        return res.status(400).json({ message: "Callee required" });
      }
      const call = await advancedStorage.initiateCall(req.session.userId!, calleeId, callType || 'VIDEO');
      
      const caller = await storage.getUser(req.session.userId!);
      pushNotificationService.sendToUser(calleeId, {
        title: "Incoming Call",
        body: `${caller?.displayName || caller?.username || 'Someone'} is calling you`,
        data: { type: 'incoming_call', callId: call.id, callType: callType || 'VIDEO' }
      });
      
      res.json(call);
    } catch (error) {
      console.error("Initiate call error:", error);
      res.status(500).json({ message: "Failed to initiate call" });
    }
  });

  app.post("/api/calls/:id/answer", requireAuth, async (req, res) => {
    try {
      const call = await advancedStorage.answerCall(req.params.id);
      res.json(call);
    } catch (error) {
      console.error("Answer call error:", error);
      res.status(500).json({ message: "Failed to answer call" });
    }
  });

  app.post("/api/calls/:id/end", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      const call = await advancedStorage.endCall(req.params.id, status || 'ENDED');
      res.json(call);
    } catch (error) {
      console.error("End call error:", error);
      res.status(500).json({ message: "Failed to end call" });
    }
  });

  app.get("/api/calls/history", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const calls = await advancedStorage.getUserCallHistory(req.session.userId!, limit);
      res.json(calls);
    } catch (error) {
      console.error("Get call history error:", error);
      res.status(500).json({ message: "Failed to get call history" });
    }
  });

  // ============================================
  // FEATURE FLAGS (Admin)
  // ============================================

  app.get("/api/admin/feature-flags", requireAuth, async (req, res) => {
    try {
      const flags = await advancedStorage.getAllFeatureFlags();
      res.json(flags);
    } catch (error) {
      console.error("Get feature flags error:", error);
      res.status(500).json({ message: "Failed to get feature flags" });
    }
  });

  app.post("/api/admin/feature-flags", requireAuth, async (req, res) => {
    try {
      const { key, name, description } = req.body;
      if (!key || !name) {
        return res.status(400).json({ message: "Key and name required" });
      }
      const flag = await advancedStorage.createFeatureFlag(key, name, description);
      res.json(flag);
    } catch (error) {
      console.error("Create feature flag error:", error);
      res.status(500).json({ message: "Failed to create feature flag" });
    }
  });

  app.put("/api/admin/feature-flags/:key", requireAuth, async (req, res) => {
    try {
      const flag = await advancedStorage.updateFeatureFlag(req.params.key, req.body);
      res.json(flag);
    } catch (error) {
      console.error("Update feature flag error:", error);
      res.status(500).json({ message: "Failed to update feature flag" });
    }
  });

  app.get("/api/feature-flags/:key/enabled", async (req, res) => {
    try {
      const userId = req.session.userId;
      const enabled = await advancedStorage.isFeatureEnabled(req.params.key, userId);
      res.json({ enabled });
    } catch (error) {
      console.error("Check feature flag error:", error);
      res.status(500).json({ message: "Failed to check feature flag" });
    }
  });

  // ============================================
  // HASHTAGS
  // ============================================

  app.get("/api/hashtags/trending", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const hashtags = await advancedStorage.getTrendingHashtags(limit);
      res.json(hashtags);
    } catch (error) {
      console.error("Get trending hashtags error:", error);
      res.status(500).json({ message: "Failed to get hashtags" });
    }
  });

  app.get("/api/hashtags/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      const hashtags = await advancedStorage.searchHashtags(query);
      res.json(hashtags);
    } catch (error) {
      console.error("Search hashtags error:", error);
      res.status(500).json({ message: "Failed to search hashtags" });
    }
  });

  // ============================================
  // USAGE STATS & FOCUS MODE
  // ============================================

  app.post("/api/usage-stats", requireAuth, async (req, res) => {
    try {
      const stat = await advancedStorage.recordUsageStat(req.session.userId!, req.body);
      res.json(stat);
    } catch (error) {
      console.error("Record usage stat error:", error);
      res.status(500).json({ message: "Failed to record stat" });
    }
  });

  app.get("/api/usage-stats", requireAuth, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const stats = await advancedStorage.getUserUsageStats(req.session.userId!, days);
      res.json(stats);
    } catch (error) {
      console.error("Get usage stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  app.get("/api/focus-mode", requireAuth, async (req, res) => {
    try {
      const settings = await advancedStorage.getFocusModeSettings(req.session.userId!);
      res.json(settings || {});
    } catch (error) {
      console.error("Get focus mode error:", error);
      res.status(500).json({ message: "Failed to get focus mode" });
    }
  });

  app.put("/api/focus-mode", requireAuth, async (req, res) => {
    try {
      const settings = await advancedStorage.updateFocusModeSettings(req.session.userId!, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Update focus mode error:", error);
      res.status(500).json({ message: "Failed to update focus mode" });
    }
  });

  // ============================================
  // POKES / WAVES
  // ============================================

  app.post("/api/pokes", requireAuth, async (req, res) => {
    try {
      const { recipientId, pokeType } = req.body;
      if (!recipientId) {
        return res.status(400).json({ message: "Recipient required" });
      }
      const poke = await advancedStorage.sendPoke(req.session.userId!, recipientId, pokeType || 'WAVE');
      
      const sender = await storage.getUser(req.session.userId!);
      pushNotificationService.sendToUser(recipientId, {
        title: pokeType === 'WAVE' ? "👋 Wave!" : "Poke!",
        body: `${sender?.displayName || sender?.username || 'Someone'} sent you a ${pokeType?.toLowerCase() || 'wave'}`,
        data: { type: 'poke', pokeId: poke.id, pokeType: pokeType || 'WAVE' }
      });
      
      res.json(poke);
    } catch (error) {
      console.error("Send poke error:", error);
      res.status(500).json({ message: "Failed to send poke" });
    }
  });

  app.get("/api/pokes/received", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const pokes = await advancedStorage.getReceivedPokes(req.session.userId!, limit);
      res.json(pokes);
    } catch (error) {
      console.error("Get received pokes error:", error);
      res.status(500).json({ message: "Failed to get pokes" });
    }
  });

  app.post("/api/pokes/:id/seen", requireAuth, async (req, res) => {
    try {
      await advancedStorage.markPokeAsSeen(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark poke seen error:", error);
      res.status(500).json({ message: "Failed to mark poke as seen" });
    }
  });

  // ============================================
  // EXPLORE CATEGORIES
  // ============================================

  app.get("/api/explore/categories", async (req, res) => {
    try {
      const categories = await advancedStorage.getExploreCategories();
      res.json(categories);
    } catch (error) {
      console.error("Get explore categories error:", error);
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  app.post("/api/admin/explore/categories", requireAuth, async (req, res) => {
    try {
      const { name, slug, description, iconName } = req.body;
      if (!name || !slug) {
        return res.status(400).json({ message: "Name and slug required" });
      }
      const category = await advancedStorage.createExploreCategory(name, slug, description, iconName);
      res.json(category);
    } catch (error) {
      console.error("Create explore category error:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // ============================================
  // VANISH MODE
  // ============================================

  app.get("/api/conversations/:id/vanish-mode", requireAuth, async (req, res) => {
    try {
      const settings = await advancedStorage.getVanishModeSettings(req.session.userId!, req.params.id);
      res.json(settings || { isEnabled: false });
    } catch (error) {
      console.error("Get vanish mode error:", error);
      res.status(500).json({ message: "Failed to get vanish mode" });
    }
  });

  app.put("/api/conversations/:id/vanish-mode", requireAuth, async (req, res) => {
    try {
      const { enabled } = req.body;
      const settings = await advancedStorage.setVanishMode(req.session.userId!, req.params.id, enabled === true);
      res.json(settings);
    } catch (error) {
      console.error("Set vanish mode error:", error);
      res.status(500).json({ message: "Failed to set vanish mode" });
    }
  });

  // ============================================
  // SCHEDULED MESSAGES
  // ============================================

  app.get("/api/scheduled-messages", requireAuth, async (req, res) => {
    try {
      const messages = await advancedStorage.getScheduledMessages(req.session.userId!);
      res.json(messages);
    } catch (error) {
      console.error("Get scheduled messages error:", error);
      res.status(500).json({ message: "Failed to get scheduled messages" });
    }
  });

  app.post("/api/scheduled-messages", requireAuth, async (req, res) => {
    try {
      const { conversationId, content, scheduledFor } = req.body;
      if (!conversationId || !content || !scheduledFor) {
        return res.status(400).json({ message: "Conversation, content, and scheduled time required" });
      }
      const message = await advancedStorage.createScheduledMessage(
        req.session.userId!,
        conversationId,
        content,
        new Date(scheduledFor)
      );
      res.json(message);
    } catch (error) {
      console.error("Create scheduled message error:", error);
      res.status(500).json({ message: "Failed to schedule message" });
    }
  });

  app.delete("/api/scheduled-messages/:id", requireAuth, async (req, res) => {
    try {
      await advancedStorage.cancelScheduledMessage(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Cancel scheduled message error:", error);
      res.status(500).json({ message: "Failed to cancel scheduled message" });
    }
  });

  // ============================================
  // PINNED MESSAGES
  // ============================================

  app.get("/api/conversations/:id/pinned", requireAuth, async (req, res) => {
    try {
      const pinned = await advancedStorage.getPinnedMessages(req.params.id);
      res.json(pinned);
    } catch (error) {
      console.error("Get pinned messages error:", error);
      res.status(500).json({ message: "Failed to get pinned messages" });
    }
  });

  app.post("/api/conversations/:conversationId/messages/:messageId/pin", requireAuth, async (req, res) => {
    try {
      const pinned = await advancedStorage.pinMessage(req.params.conversationId, req.params.messageId, req.session.userId!);
      res.json(pinned);
    } catch (error) {
      console.error("Pin message error:", error);
      res.status(500).json({ message: "Failed to pin message" });
    }
  });

  app.delete("/api/conversations/:conversationId/messages/:messageId/pin", requireAuth, async (req, res) => {
    try {
      await advancedStorage.unpinMessage(req.params.conversationId, req.params.messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Unpin message error:", error);
      res.status(500).json({ message: "Failed to unpin message" });
    }
  });

  // ============================================
  // CHAT FOLDERS
  // ============================================

  app.get("/api/chat-folders", requireAuth, async (req, res) => {
    try {
      const folders = await advancedStorage.getUserChatFolders(req.session.userId!);
      res.json(folders);
    } catch (error) {
      console.error("Get chat folders error:", error);
      res.status(500).json({ message: "Failed to get chat folders" });
    }
  });

  app.post("/api/chat-folders", requireAuth, async (req, res) => {
    try {
      const { name, color, iconName } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Name required" });
      }
      const folder = await advancedStorage.createChatFolder(req.session.userId!, name, iconName);
      res.json(folder);
    } catch (error) {
      console.error("Create chat folder error:", error);
      res.status(500).json({ message: "Failed to create chat folder" });
    }
  });

  app.delete("/api/chat-folders/:id", requireAuth, async (req, res) => {
    try {
      await advancedStorage.deleteChatFolder(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete chat folder error:", error);
      res.status(500).json({ message: "Failed to delete chat folder" });
    }
  });

  app.get("/api/chat-folders/:id/conversations", requireAuth, async (req, res) => {
    try {
      const conversationIds = await advancedStorage.getConversationsInFolder(req.params.id);
      res.json(conversationIds);
    } catch (error) {
      console.error("Get folder conversations error:", error);
      res.status(500).json({ message: "Failed to get folder conversations" });
    }
  });

  app.post("/api/chat-folders/:folderId/conversations/:conversationId", requireAuth, async (req, res) => {
    try {
      await advancedStorage.addConversationToFolder(req.params.folderId, req.params.conversationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Add to folder error:", error);
      res.status(500).json({ message: "Failed to add to folder" });
    }
  });

  app.delete("/api/chat-folders/:folderId/conversations/:conversationId", requireAuth, async (req, res) => {
    try {
      await advancedStorage.removeConversationFromFolder(req.params.folderId, req.params.conversationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove from folder error:", error);
      res.status(500).json({ message: "Failed to remove from folder" });
    }
  });

  // ============================================
  // TWO-FACTOR AUTHENTICATION (2FA)
  // ============================================

  app.post("/api/security/2fa/setup", requireAuth, async (req, res) => {
    try {
      const { secret } = req.body;
      if (!secret) {
        return res.status(400).json({ message: "Secret required" });
      }
      const totp = await advancedStorage.createTotpSecret(req.session.userId!, secret);
      res.json({ id: totp.id, created: true });
    } catch (error) {
      console.error("Setup 2FA error:", error);
      res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });

  app.get("/api/security/2fa", requireAuth, async (req, res) => {
    try {
      const totp = await advancedStorage.getTotpSecret(req.session.userId!);
      res.json({ enabled: !!totp?.verifiedAt });
    } catch (error) {
      console.error("Get 2FA status error:", error);
      res.status(500).json({ message: "Failed to get 2FA status" });
    }
  });

  app.post("/api/security/2fa/verify", requireAuth, async (req, res) => {
    try {
      await advancedStorage.verifyTotp(req.session.userId!);
      res.json({ verified: true });
    } catch (error) {
      console.error("Verify 2FA error:", error);
      res.status(500).json({ message: "Failed to verify 2FA" });
    }
  });

  app.delete("/api/security/2fa", requireAuth, async (req, res) => {
    try {
      await advancedStorage.deleteTotp(req.session.userId!);
      res.json({ disabled: true });
    } catch (error) {
      console.error("Disable 2FA error:", error);
      res.status(500).json({ message: "Failed to disable 2FA" });
    }
  });

  app.post("/api/security/backup-codes", requireAuth, async (req, res) => {
    try {
      const { codes } = req.body;
      if (!codes || !Array.isArray(codes)) {
        return res.status(400).json({ message: "Codes array required" });
      }
      const backupCodes = await advancedStorage.createBackupCodes(req.session.userId!, codes);
      res.json(backupCodes);
    } catch (error) {
      console.error("Create backup codes error:", error);
      res.status(500).json({ message: "Failed to create backup codes" });
    }
  });

  app.get("/api/security/backup-codes", requireAuth, async (req, res) => {
    try {
      const codes = await advancedStorage.getBackupCodes(req.session.userId!);
      res.json({ count: codes.length });
    } catch (error) {
      console.error("Get backup codes error:", error);
      res.status(500).json({ message: "Failed to get backup codes" });
    }
  });

  app.post("/api/security/backup-codes/use", requireAuth, async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ message: "Code required" });
      }
      const success = await advancedStorage.useBackupCode(req.session.userId!, code);
      if (!success) {
        return res.status(400).json({ message: "Invalid or already used code" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Use backup code error:", error);
      res.status(500).json({ message: "Failed to use backup code" });
    }
  });

  // ============================================
  // LINKED ACCOUNTS
  // ============================================

  app.get("/api/linked-accounts", requireAuth, async (req, res) => {
    try {
      const accounts = await advancedStorage.getLinkedAccounts(req.session.userId!);
      res.json(accounts);
    } catch (error) {
      console.error("Get linked accounts error:", error);
      res.status(500).json({ message: "Failed to get linked accounts" });
    }
  });

  app.post("/api/linked-accounts", requireAuth, async (req, res) => {
    try {
      const { provider, providerId, email, displayName, avatarUrl } = req.body;
      if (!provider || !providerId) {
        return res.status(400).json({ message: "Provider and provider ID required" });
      }
      const account = await advancedStorage.linkAccounts(req.session.userId!, providerId);
      res.json(account);
    } catch (error) {
      console.error("Link account error:", error);
      res.status(500).json({ message: "Failed to link account" });
    }
  });

  app.delete("/api/linked-accounts/:provider", requireAuth, async (req, res) => {
    try {
      await advancedStorage.unlinkAccount(req.session.userId!, req.params.provider);
      res.json({ success: true });
    } catch (error) {
      console.error("Unlink account error:", error);
      res.status(500).json({ message: "Failed to unlink account" });
    }
  });

  // ============================================
  // HIDDEN WORDS
  // ============================================

  app.get("/api/hidden-words", requireAuth, async (req, res) => {
    try {
      const words = await advancedStorage.getHiddenWords(req.session.userId!);
      res.json(words);
    } catch (error) {
      console.error("Get hidden words error:", error);
      res.status(500).json({ message: "Failed to get hidden words" });
    }
  });

  app.post("/api/hidden-words", requireAuth, async (req, res) => {
    try {
      const { word } = req.body;
      if (!word) {
        return res.status(400).json({ message: "Word required" });
      }
      const hidden = await advancedStorage.addHiddenWord(req.session.userId!, word);
      res.json(hidden);
    } catch (error) {
      console.error("Add hidden word error:", error);
      res.status(500).json({ message: "Failed to add hidden word" });
    }
  });

  app.delete("/api/hidden-words/:id", requireAuth, async (req, res) => {
    try {
      await advancedStorage.removeHiddenWord(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove hidden word error:", error);
      res.status(500).json({ message: "Failed to remove hidden word" });
    }
  });

  // ============================================
  // POST THREADS
  // ============================================

  app.get("/api/threads", requireAuth, async (req, res) => {
    try {
      const threads = await advancedStorage.getUserThreads(req.session.userId!);
      res.json(threads);
    } catch (error) {
      console.error("Get threads error:", error);
      res.status(500).json({ message: "Failed to get threads" });
    }
  });

  app.post("/api/threads", requireAuth, async (req, res) => {
    try {
      const { title } = req.body;
      const thread = await advancedStorage.createThread(req.session.userId!, title);
      res.json(thread);
    } catch (error) {
      console.error("Create thread error:", error);
      res.status(500).json({ message: "Failed to create thread" });
    }
  });

  app.get("/api/threads/:id", async (req, res) => {
    try {
      const thread = await advancedStorage.getThread(req.params.id);
      if (!thread) {
        return res.status(404).json({ message: "Thread not found" });
      }
      res.json(thread);
    } catch (error) {
      console.error("Get thread error:", error);
      res.status(500).json({ message: "Failed to get thread" });
    }
  });

  app.post("/api/threads/:id/posts", requireAuth, async (req, res) => {
    try {
      const { postId, position } = req.body;
      if (!postId) {
        return res.status(400).json({ message: "Post ID required" });
      }
      const threadPost = await advancedStorage.addPostToThread(req.params.id, postId, position || 0);
      res.json(threadPost);
    } catch (error) {
      console.error("Add post to thread error:", error);
      res.status(500).json({ message: "Failed to add post to thread" });
    }
  });

  // ============================================
  // DUETS AND STITCHES
  // ============================================

  app.get("/api/posts/:id/duets", async (req, res) => {
    try {
      const duets = await advancedStorage.getDuetsForPost(req.params.id);
      res.json(duets);
    } catch (error) {
      console.error("Get duets error:", error);
      res.status(500).json({ message: "Failed to get duets" });
    }
  });

  app.get("/api/posts/:id/stitches", async (req, res) => {
    try {
      const stitches = await advancedStorage.getStitchesForPost(req.params.id);
      res.json(stitches);
    } catch (error) {
      console.error("Get stitches error:", error);
      res.status(500).json({ message: "Failed to get stitches" });
    }
  });

  app.post("/api/duets", requireAuth, async (req, res) => {
    try {
      const { originalPostId, responsePostId } = req.body;
      if (!originalPostId || !responsePostId) {
        return res.status(400).json({ message: "Original and response post IDs required" });
      }
      const duet = await advancedStorage.createDuetStitch('DUET', originalPostId, responsePostId);
      res.json(duet);
    } catch (error) {
      console.error("Create duet error:", error);
      res.status(500).json({ message: "Failed to create duet" });
    }
  });

  app.post("/api/stitches", requireAuth, async (req, res) => {
    try {
      const { originalPostId, responsePostId } = req.body;
      if (!originalPostId || !responsePostId) {
        return res.status(400).json({ message: "Original and response post IDs required" });
      }
      const stitch = await advancedStorage.createDuetStitch('STITCH', originalPostId, responsePostId);
      res.json(stitch);
    } catch (error) {
      console.error("Create stitch error:", error);
      res.status(500).json({ message: "Failed to create stitch" });
    }
  });

  // ============================================
  // WEBHOOKS
  // ============================================

  app.get("/api/webhooks", requireAuth, async (req, res) => {
    try {
      const webhooks = await advancedStorage.getUserWebhooks(req.session.userId!);
      res.json(webhooks);
    } catch (error) {
      console.error("Get webhooks error:", error);
      res.status(500).json({ message: "Failed to get webhooks" });
    }
  });

  app.post("/api/webhooks", requireAuth, async (req, res) => {
    try {
      const { url, events, secret } = req.body;
      if (!url || !events || !Array.isArray(events)) {
        return res.status(400).json({ message: "URL and events array required" });
      }
      const webhook = await advancedStorage.createWebhook(req.session.userId!, url, events, secret);
      res.json(webhook);
    } catch (error) {
      console.error("Create webhook error:", error);
      res.status(500).json({ message: "Failed to create webhook" });
    }
  });

  app.get("/api/webhooks/:id", requireAuth, async (req, res) => {
    try {
      const webhook = await advancedStorage.getWebhook(req.params.id);
      if (!webhook) {
        return res.status(404).json({ message: "Webhook not found" });
      }
      res.json(webhook);
    } catch (error) {
      console.error("Get webhook error:", error);
      res.status(500).json({ message: "Failed to get webhook" });
    }
  });

  app.put("/api/webhooks/:id", requireAuth, async (req, res) => {
    try {
      const updated = await advancedStorage.updateWebhook(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update webhook error:", error);
      res.status(500).json({ message: "Failed to update webhook" });
    }
  });

  app.delete("/api/webhooks/:id", requireAuth, async (req, res) => {
    try {
      await advancedStorage.deleteWebhook(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete webhook error:", error);
      res.status(500).json({ message: "Failed to delete webhook" });
    }
  });

  app.get("/api/webhooks/:id/deliveries", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const deliveries = await advancedStorage.getWebhookDeliveries(req.params.id, limit);
      res.json(deliveries);
    } catch (error) {
      console.error("Get webhook deliveries error:", error);
      res.status(500).json({ message: "Failed to get deliveries" });
    }
  });

  // ============================================
  // AR FILTERS
  // ============================================

  app.get("/api/ar-filters", async (req, res) => {
    try {
      const filters = await advancedStorage.getArFilters();
      res.json(filters);
    } catch (error) {
      console.error("Get AR filters error:", error);
      res.status(500).json({ message: "Failed to get AR filters" });
    }
  });

  app.post("/api/ar-filters", requireAuth, async (req, res) => {
    try {
      const { name, category, previewUrl, filterDataUrl } = req.body;
      if (!name || !category || !previewUrl || !filterDataUrl) {
        return res.status(400).json({ message: "Name, category, preview URL, and filter data URL required" });
      }
      const filter = await advancedStorage.createArFilter(name, category, previewUrl, filterDataUrl, req.session.userId);
      res.json(filter);
    } catch (error) {
      console.error("Create AR filter error:", error);
      res.status(500).json({ message: "Failed to create AR filter" });
    }
  });

  // ============================================
  // SECURITY CHECKUPS & ACCOUNT BACKUPS
  // ============================================

  app.get("/api/security/checkup", requireAuth, async (req, res) => {
    try {
      let checkup = await advancedStorage.getSecurityCheckup(req.session.userId!);
      if (!checkup) {
        checkup = await advancedStorage.createSecurityCheckup(req.session.userId!);
      }
      res.json(checkup);
    } catch (error) {
      console.error("Get security checkup error:", error);
      res.status(500).json({ message: "Failed to get security checkup" });
    }
  });

  app.put("/api/security/checkup", requireAuth, async (req, res) => {
    try {
      const checkup = await advancedStorage.getSecurityCheckup(req.session.userId!);
      if (!checkup) {
        return res.status(404).json({ message: "No security checkup found" });
      }
      const updated = await advancedStorage.updateSecurityCheckup(checkup.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update security checkup error:", error);
      res.status(500).json({ message: "Failed to update security checkup" });
    }
  });

  app.post("/api/account/backup", requireAuth, async (req, res) => {
    try {
      const backup = await advancedStorage.requestAccountBackup(req.session.userId!);
      res.json(backup);
    } catch (error) {
      console.error("Request account backup error:", error);
      res.status(500).json({ message: "Failed to request account backup" });
    }
  });

  app.get("/api/account/backup", requireAuth, async (req, res) => {
    try {
      const backup = await advancedStorage.getAccountBackup(req.session.userId!);
      res.json(backup || { status: 'NONE' });
    } catch (error) {
      console.error("Get account backup error:", error);
      res.status(500).json({ message: "Failed to get account backup" });
    }
  });

  // ===== LOGIN SESSIONS =====
  app.get("/api/sessions", requireAuth, async (req, res) => {
    try {
      const sessions = await advancedStorage.getLoginSessions(req.session.userId!);
      res.json(sessions);
    } catch (error) {
      console.error("Get login sessions error:", error);
      res.status(500).json({ message: "Failed to get login sessions" });
    }
  });

  app.delete("/api/sessions/:sessionId", requireAuth, async (req, res) => {
    try {
      await advancedStorage.deactivateLoginSession(req.session.userId!, req.params.sessionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Deactivate session error:", error);
      res.status(500).json({ message: "Failed to deactivate session" });
    }
  });

  app.delete("/api/sessions", requireAuth, async (req, res) => {
    try {
      const { exceptCurrent } = req.query;
      await advancedStorage.deactivateAllLoginSessions(
        req.session.userId!,
        exceptCurrent ? req.session.id : undefined
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Deactivate all sessions error:", error);
      res.status(500).json({ message: "Failed to deactivate sessions" });
    }
  });

  // ===== TRUSTED DEVICES =====
  app.get("/api/devices", requireAuth, async (req, res) => {
    try {
      const devices = await advancedStorage.getTrustedDevices(req.session.userId!);
      res.json(devices);
    } catch (error) {
      console.error("Get trusted devices error:", error);
      res.status(500).json({ message: "Failed to get trusted devices" });
    }
  });

  app.post("/api/devices", requireAuth, async (req, res) => {
    try {
      const { deviceFingerprint, deviceName, deviceType } = req.body;
      const device = await advancedStorage.addTrustedDevice(
        req.session.userId!,
        deviceFingerprint,
        deviceName,
        deviceType
      );
      res.json(device);
    } catch (error) {
      console.error("Add trusted device error:", error);
      res.status(500).json({ message: "Failed to add trusted device" });
    }
  });

  app.delete("/api/devices/:deviceId", requireAuth, async (req, res) => {
    try {
      await advancedStorage.removeTrustedDevice(req.session.userId!, req.params.deviceId);
      res.json({ success: true });
    } catch (error) {
      console.error("Remove trusted device error:", error);
      res.status(500).json({ message: "Failed to remove trusted device" });
    }
  });

  console.log("Advanced routes registered successfully");
}
