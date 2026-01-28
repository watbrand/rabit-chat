import { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "./storage";
import * as adsStorage from "./ads-storage";
import { pool, db } from "./db";
import { sql, eq, desc, and, gte, lte } from "drizzle-orm";
import {
  advertisers, adCampaigns, adGroups, ads, adWalletAccounts, adWalletTransactions,
  adEvents, adCustomAudiences, adAuditLogs, adPolicies, advertisingTerms,
  adPromoCodes, adPromoCodeRedemptions, adReviewHistory, adSystemSettings,
  adConversionPixels, adDeliveryDiagnostics, advertiserAchievements, adDisputes
} from "@shared/schema";
import { hasPermission as hasRbacPermission } from "./rbac";
import type { NotificationType } from "@shared/schema";

// Helper function to send advertising notifications
async function sendAdNotification(advertiserId: string, type: NotificationType, entityId?: string) {
  try {
    // Get the user ID associated with this advertiser
    const [advertiser] = await db.select().from(advertisers).where(eq(advertisers.id, advertiserId));
    if (advertiser?.userId) {
      await storage.createNotification(advertiser.userId, 'system', type, entityId);
    }
  } catch (error) {
    console.error('Failed to send ad notification:', error);
  }
}

const createAdvertiserSchema = z.object({
  businessName: z.string().min(1).max(200),
  businessType: z.enum(['INDIVIDUAL', 'SMALL_BUSINESS', 'ENTERPRISE', 'AGENCY', 'NON_PROFIT']).optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  billingEmail: z.string().email().optional(),
});

const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  objective: z.enum(['AWARENESS', 'TRAFFIC', 'ENGAGEMENT', 'LEADS', 'SALES', 'APP_PROMOTION', 'VIDEO_VIEWS', 'COMMUNITY_GROWTH']),
  budgetType: z.enum(['DAILY', 'LIFETIME']).optional(),
  budgetAmount: z.number().positive().optional(),
  bidStrategy: z.enum(['LOWEST_COST', 'TARGET_COST', 'MANUAL']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const createAdGroupSchema = z.object({
  campaignId: z.string().uuid(),
  name: z.string().min(1).max(200),
  budgetAmount: z.number().positive().optional(),
  bidAmount: z.number().positive().optional(),
  billingModel: z.enum(['CPM', 'CPC', 'CPV', 'CPA']).optional(),
  placements: z.array(z.enum(['FEED', 'STORIES', 'REELS', 'DISCOVER', 'MESSAGES', 'MALL', 'GOSSIP', 'PROFILE'])).optional(),
  netWorthTiers: z.array(z.enum(['BUILDING', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'])).optional(),
  minInfluenceScore: z.number().min(0).max(1000).optional(),
  maxInfluenceScore: z.number().min(0).max(1000).optional(),
  ageMin: z.number().min(18).max(65).optional(),
  ageMax: z.number().min(18).max(65).optional(),
  genders: z.array(z.string()).optional(),
  countries: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  frequencyCapImpressions: z.number().min(1).max(100).optional(),
  frequencyCapPeriodHours: z.number().min(1).max(168).optional(),
});

const createAdSchema = z.object({
  adGroupId: z.string().uuid(),
  name: z.string().min(1).max(200),
  format: z.enum(['IMAGE', 'VIDEO', 'CAROUSEL', 'STORIES', 'COLLECTION', 'VOICE', 'POLL', 'CONVERSATION', 'DARK_POST']),
  headline: z.string().max(125).optional(),
  description: z.string().max(1000).optional(),
  callToAction: z.string().max(50).optional(),
  destinationUrl: z.string().url().optional(),
  primaryMediaUrl: z.string().url().optional(),
  primaryMediaType: z.string().optional(),
  carouselItems: z.array(z.object({
    mediaUrl: z.string().url(),
    headline: z.string().optional(),
    description: z.string().optional(),
    destinationUrl: z.string().url().optional(),
  })).optional(),
  voiceUrl: z.string().url().optional(),
  voiceDuration: z.number().optional(),
  pollQuestion: z.string().optional(),
  pollOptions: z.array(z.string()).optional(),
});

const walletTopupSchema = z.object({
  amount: z.number().positive().min(5000),
  paymentMethod: z.enum(['PAYFAST', 'BANK_TRANSFER', 'PROMO_CODE']),
  promoCode: z.string().optional(),
});

export function registerAdsRoutes(app: Express, requireAuth: any) {
  const requireAdmin = async (req: Request, res: Response, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  const getAdvertiserOrFail = async (userId: string): Promise<any> => {
    const advertiser = await adsStorage.getAdvertiserByUserId(userId);
    if (!advertiser) {
      throw new Error("Advertiser account not found");
    }
    return advertiser;
  };

  const logAuditAction = async (
    action: string,
    entityType: string,
    entityId: string,
    actorId: string | undefined,
    actorType: string,
    previousState: any = null,
    newState: any = null,
    req: Request
  ) => {
    await adsStorage.createAdAuditLog({
      advertiserId: actorType === 'ADVERTISER' ? actorId : undefined,
      actorId,
      actorType,
      action: action as any,
      entityType,
      entityId,
      previousState,
      newState,
      changesSummary: `${action} on ${entityType}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });
  };

  // ===== ADVERTISER ACCOUNT ENDPOINTS =====

  app.post("/api/ads/advertisers", requireAuth, async (req: Request, res: Response) => {
    try {
      const data = createAdvertiserSchema.parse(req.body);
      const userId = req.session.userId!;

      const existing = await adsStorage.getAdvertiserByUserId(userId);
      if (existing) {
        return res.status(400).json({ message: "Advertiser account already exists" });
      }

      const advertiser = await adsStorage.createAdvertiser({
        userId,
        ...data,
      });

      await adsStorage.createWalletAccount(advertiser.id);

      await logAuditAction('ADVERTISER_CREATED', 'advertiser', advertiser.id, userId, 'ADVERTISER', null, advertiser, req);

      res.status(201).json(advertiser);
    } catch (error: any) {
      console.error("Failed to create advertiser:", error);
      res.status(400).json({ message: error.message || "Failed to create advertiser" });
    }
  });

  app.get("/api/ads/advertisers/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await adsStorage.getAdvertiserByUserId(req.session.userId!);
      if (!advertiser) {
        return res.status(404).json({ message: "Advertiser account not found" });
      }

      const wallet = await adsStorage.getWalletByAdvertiserId(advertiser.id);
      const achievements = await adsStorage.getAdvertiserAchievements(advertiser.id);

      res.json({ ...advertiser, wallet, achievements });
    } catch (error: any) {
      console.error("Failed to get advertiser:", error);
      res.status(500).json({ message: "Failed to get advertiser" });
    }
  });

  app.patch("/api/ads/advertisers/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const data = createAdvertiserSchema.partial().parse(req.body);

      const previousState = { ...advertiser };
      const updated = await adsStorage.updateAdvertiser(advertiser.id, data);

      await logAuditAction('ADVERTISER_UPDATED', 'advertiser', advertiser.id, req.session.userId, 'ADVERTISER', previousState, updated, req);

      res.json(updated);
    } catch (error: any) {
      console.error("Failed to update advertiser:", error);
      res.status(400).json({ message: error.message || "Failed to update advertiser" });
    }
  });

  // ===== WALLET ENDPOINTS =====

  app.get("/api/ads/wallet", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const wallet = await adsStorage.getWalletByAdvertiserId(advertiser.id);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      res.json(wallet);
    } catch (error: any) {
      console.error("Failed to get wallet:", error);
      res.status(500).json({ message: error.message || "Failed to get wallet" });
    }
  });

  app.get("/api/ads/wallet/transactions", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const wallet = await adsStorage.getWalletByAdvertiserId(advertiser.id);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const transactions = await adsStorage.getWalletTransactions(wallet.id, { limit, offset });

      res.json(transactions);
    } catch (error: any) {
      console.error("Failed to get transactions:", error);
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  app.post("/api/ads/wallet/topup", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const wallet = await adsStorage.getWalletByAdvertiserId(advertiser.id);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      if (wallet.isFrozen) {
        return res.status(403).json({ message: "Wallet is frozen. Contact support." });
      }

      const data = walletTopupSchema.parse(req.body);

      if (data.paymentMethod === 'PROMO_CODE' && data.promoCode) {
        const promo = await adsStorage.getPromoCodeByCode(data.promoCode);
        if (!promo) {
          return res.status(400).json({ message: "Invalid promo code" });
        }
        if (promo.validUntil && new Date(promo.validUntil) < new Date()) {
          return res.status(400).json({ message: "Promo code expired" });
        }

        const redeemResult = await adsStorage.atomicRedeemPromoCode(
          promo.id,
          advertiser.id,
          wallet.id,
          promo.amount,
          promo.usageLimit
        );

        if (!redeemResult.success) {
          return res.status(400).json({ message: redeemResult.error });
        }

        const balanceBefore = wallet.balance || 0;
        const updatedWallet = await adsStorage.updateWalletBalance(wallet.id, promo.amount, 'credit');
        
        if (!updatedWallet) {
          return res.status(500).json({ message: "Failed to credit wallet" });
        }

        await adsStorage.createWalletTransaction({
          walletId: wallet.id,
          type: 'PROMO_CREDIT',
          amount: promo.amount,
          balanceBefore: balanceBefore,
          balanceAfter: updatedWallet.balance || 0,
          status: 'COMPLETED',
          description: `Promo code: ${promo.code}`,
          promoCodeId: promo.id,
          completedAt: new Date(),
        });

        await logAuditAction('WALLET_TOPUP', 'wallet', wallet.id, req.session.userId, 'ADVERTISER', { balance: balanceBefore }, { balance: updatedWallet.balance }, req);

        return res.json({ success: true, wallet: updatedWallet });
      }

      if (data.paymentMethod === 'PAYFAST') {
        const tx = await adsStorage.createWalletTransaction({
          walletId: wallet.id,
          type: 'TOP_UP',
          amount: data.amount,
          balanceBefore: wallet.balance || 0,
          balanceAfter: (wallet.balance || 0) + data.amount,
          status: 'PENDING',
          description: `PayFast top-up`,
          reference: `PAYFAST-${Date.now()}`,
        });

        const payfastUrl = `/payfast/checkout?type=ad_wallet_topup&amount=${data.amount}&txId=${tx.id}`;
        
        return res.json({ 
          success: true, 
          paymentUrl: payfastUrl,
          transactionId: tx.id 
        });
      }

      if (data.paymentMethod === 'BANK_TRANSFER') {
        const tx = await adsStorage.createWalletTransaction({
          walletId: wallet.id,
          type: 'TOP_UP',
          amount: data.amount,
          balanceBefore: wallet.balance || 0,
          balanceAfter: (wallet.balance || 0) + data.amount,
          status: 'PENDING',
          description: `Bank transfer - awaiting confirmation`,
          reference: `BANK-${Date.now()}`,
        });

        return res.json({
          success: true,
          transactionId: tx.id,
          bankDetails: {
            bankName: "First National Bank",
            accountName: "RabitChat Advertising",
            accountNumber: "62XXXXXXXX",
            branchCode: "250655",
            reference: `ADV-${tx.id.slice(0, 8).toUpperCase()}`,
          }
        });
      }

      res.status(400).json({ message: "Invalid payment method" });
    } catch (error: any) {
      console.error("Failed to top up wallet:", error);
      res.status(400).json({ message: error.message || "Failed to top up wallet" });
    }
  });

  // ===== PAYFAST AD WALLET INTEGRATION =====

  app.post("/api/ads/wallet/payfast/create", requireAuth, async (req: Request, res: Response) => {
    try {
      const {
        isPayFastConfigured,
        getPayFastUrl,
        createPaymentData,
        formatAmountCents,
      } = await import("./services/payfast");

      if (!isPayFastConfigured()) {
        return res.status(500).json({ message: "PayFast is not configured" });
      }

      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const wallet = await adsStorage.getWalletByAdvertiserId(advertiser.id);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      if (wallet.isFrozen) {
        return res.status(403).json({ message: "Wallet is frozen" });
      }

      const { amount } = req.body;
      if (!amount || amount < 5000) {
        return res.status(400).json({ message: "Minimum top-up is R50.00 (5000 cents)" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const tx = await adsStorage.createWalletTransaction({
        walletId: wallet.id,
        type: 'TOP_UP',
        amount: amount,
        balanceBefore: wallet.balance || 0,
        balanceAfter: (wallet.balance || 0) + amount,
        status: 'PENDING',
        description: `PayFast wallet top-up`,
        reference: `PAYFAST-${Date.now()}`,
      });

      const host = req.get('host') || process.env.REPLIT_DEV_DOMAIN || 'localhost:5000';
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      const baseUrl = `${protocol}://${host}`;
      const amountInRands = formatAmountCents(amount);

      const paymentData = createPaymentData({
        orderId: `ADWALLET-${tx.id}`,
        amount: amountInRands,
        itemName: "RabitChat Ads Wallet Top-Up",
        itemDescription: `Add R${amountInRands.toFixed(2)} to your advertising wallet`,
        email: user.email || undefined,
        firstName: user.displayName?.split(" ")[0] || user.username,
        lastName: user.displayName?.split(" ").slice(1).join(" ") || undefined,
        returnUrl: `${baseUrl}/api/ads/wallet/payfast/return?tx_id=${tx.id}`,
        cancelUrl: `${baseUrl}/api/ads/wallet/payfast/cancel?tx_id=${tx.id}`,
        notifyUrl: `${baseUrl}/api/ads/wallet/payfast/notify`,
        userId: req.session.userId!,
      });

      // Return payment data for in-app WebView checkout (like mall)
      res.json({
        transactionId: tx.id,
        paymentUrl: getPayFastUrl(),
        paymentData,
        topup: {
          amount: amount,
          amountRands: amountInRands,
        },
      });
    } catch (error: any) {
      console.error("[PayFast Ads] Failed to create payment:", error);
      res.status(400).json({ message: error.message || "Failed to create payment" });
    }
  });

  // Complete wallet top-up after in-app payment
  // This is the GUARANTEED way to complete a top-up - called by client after PayFast return
  app.post("/api/ads/wallet/payfast/complete-topup", requireAuth, async (req: Request, res: Response) => {
    try {
      const { transactionId } = req.body;
      console.log("[PayFast Ads Complete] Starting top-up completion for transaction:", transactionId);
      console.log("[PayFast Ads Complete] User ID from session:", req.session.userId);
      
      if (!transactionId) {
        console.log("[PayFast Ads Complete] No transaction ID provided");
        return res.status(400).json({ success: false, message: "Transaction ID is required" });
      }

      const transaction = await adsStorage.getTransactionById(transactionId);
      console.log("[PayFast Ads Complete] Transaction found:", transaction ? "yes" : "no");
      
      if (!transaction) {
        console.log("[PayFast Ads Complete] Transaction not found:", transactionId);
        return res.status(404).json({ success: false, message: "Transaction not found" });
      }

      console.log("[PayFast Ads Complete] Transaction details:", {
        id: transaction.id,
        walletId: transaction.walletId,
        amount: transaction.amount,
        status: transaction.status,
        type: transaction.type,
      });

      // If already complete, return success with current balance
      if (transaction.status === 'COMPLETED') {
        console.log("[PayFast Ads Complete] Transaction already completed");
        const wallet = await adsStorage.getWalletById(transaction.walletId);
        return res.json({
          success: true,
          message: "Top-up already completed",
          newBalance: wallet?.balance || 0,
          alreadyCompleted: true,
        });
      }

      // If failed or cancelled, don't allow completion
      if (transaction.status === 'FAILED' || transaction.status === 'CANCELLED') {
        console.log("[PayFast Ads Complete] Transaction already failed/cancelled");
        const wallet = await adsStorage.getWalletById(transaction.walletId);
        return res.json({
          success: false,
          message: `Transaction was ${transaction.status.toLowerCase()}`,
          newBalance: wallet?.balance || 0,
        });
      }

      // Get the wallet
      const wallet = await adsStorage.getWalletById(transaction.walletId);
      if (!wallet) {
        console.log("[PayFast Ads Complete] Wallet not found:", transaction.walletId);
        return res.status(404).json({ success: false, message: "Wallet not found" });
      }

      // Verify the wallet belongs to the current user's advertiser account
      const advertiser = await adsStorage.getAdvertiserById(wallet.advertiserId);
      if (!advertiser || advertiser.userId !== req.session.userId) {
        console.log("[PayFast Ads Complete] User mismatch");
        return res.json({ success: false, message: "Transaction does not belong to this user" });
      }

      // Complete the transaction and credit the wallet
      console.log("[PayFast Ads Complete] Crediting wallet with amount:", transaction.amount);
      const balanceBefore = wallet.balance || 0;
      
      const updatedWallet = await adsStorage.updateWalletBalance(wallet.id, transaction.amount, 'credit');
      if (!updatedWallet) {
        throw new Error("Failed to update wallet balance");
      }
      
      console.log("[PayFast Ads Complete] Wallet updated. Before:", balanceBefore, "After:", updatedWallet.balance);

      // Mark transaction as completed
      await adsStorage.updateTransaction(transactionId, {
        status: 'COMPLETED',
        balanceBefore: balanceBefore,
        balanceAfter: updatedWallet.balance || 0,
        completedAt: new Date(),
      });

      console.log("[PayFast Ads Complete] Transaction marked as COMPLETED");

      // Log the audit action
      await logAuditAction(
        'WALLET_TOPUP', 
        'wallet', 
        wallet.id, 
        req.session.userId, 
        'ADVERTISER', 
        { balance: balanceBefore }, 
        { balance: updatedWallet.balance, amount: transaction.amount }, 
        req
      );

      res.json({
        success: true,
        message: "Top-up completed successfully",
        newBalance: updatedWallet.balance || 0,
        amountAdded: transaction.amount,
      });
    } catch (error: any) {
      console.error("[PayFast Ads Complete] Error:", error);
      res.status(500).json({ success: false, message: error.message || "Failed to complete top-up" });
    }
  });

  app.get("/api/ads/wallet/payfast/checkout/:transactionId", async (req: Request, res: Response) => {
    try {
      const {
        isPayFastConfigured,
        getPayFastUrl,
        createPaymentData,
        formatAmountCents,
      } = await import("./services/payfast");

      if (!isPayFastConfigured()) {
        return res.status(500).send("PayFast is not configured");
      }

      const { transactionId } = req.params;
      const tx = await adsStorage.getTransactionById(transactionId);
      
      if (!tx) {
        return res.status(404).send("Transaction not found");
      }

      if (tx.status !== 'PENDING') {
        return res.status(400).send("Transaction is no longer pending");
      }

      const wallet = await adsStorage.getWalletById(tx.walletId);
      if (!wallet) {
        return res.status(404).send("Wallet not found");
      }

      const advertiser = await adsStorage.getAdvertiserById(wallet.advertiserId);
      if (!advertiser) {
        return res.status(404).send("Advertiser not found");
      }

      const user = await storage.getUser(advertiser.userId);
      if (!user) {
        return res.status(404).send("User not found");
      }

      const host = req.get('host') || process.env.REPLIT_DEV_DOMAIN || 'localhost:5000';
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      const baseUrl = `${protocol}://${host}`;
      const amountInRands = formatAmountCents(tx.amount);

      const paymentData = createPaymentData({
        orderId: `ADWALLET-${tx.id}`,
        amount: amountInRands,
        itemName: "RabitChat Ads Wallet Top-Up",
        itemDescription: `Add R${amountInRands.toFixed(2)} to your advertising wallet`,
        email: user.email || undefined,
        firstName: user.displayName?.split(" ")[0] || user.username,
        lastName: user.displayName?.split(" ").slice(1).join(" ") || undefined,
        returnUrl: `${baseUrl}/api/ads/wallet/payfast/return?tx_id=${tx.id}`,
        cancelUrl: `${baseUrl}/api/ads/wallet/payfast/cancel?tx_id=${tx.id}`,
        notifyUrl: `${baseUrl}/api/ads/wallet/payfast/notify`,
        userId: advertiser.userId,
      });

      const payFastUrl = getPayFastUrl();

      const formFields = Object.entries(paymentData)
        .filter(([_, value]) => value !== undefined && value !== "")
        .map(([key, value]) => `<input type="hidden" name="${key}" value="${String(value).replace(/"/g, '&quot;')}" />`)
        .join("\n");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Complete Your Payment</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
          <meta name="format-detection" content="telephone=no">
          <style>
            * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 40px 30px;
              background: rgba(255,255,255,0.15);
              border-radius: 24px;
              backdrop-filter: blur(10px);
              -webkit-backdrop-filter: blur(10px);
              max-width: 400px;
              width: 100%;
            }
            .logo {
              font-size: 48px;
              margin-bottom: 16px;
            }
            h2 {
              margin: 0 0 8px 0;
              font-size: 24px;
            }
            .amount {
              font-size: 36px;
              font-weight: bold;
              margin: 20px 0;
              color: #FFD700;
            }
            p {
              margin: 0 0 24px 0;
              opacity: 0.9;
              font-size: 15px;
              line-height: 1.5;
            }
            .btn {
              display: block;
              width: 100%;
              margin-top: 10px;
              padding: 20px 30px;
              background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
              color: #1a1a2e;
              border: none;
              border-radius: 50px;
              font-size: 18px;
              font-weight: bold;
              cursor: pointer;
              text-decoration: none;
              box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
              -webkit-appearance: none;
              appearance: none;
              touch-action: manipulation;
            }
            .btn:active, .btn.pressed { 
              transform: scale(0.98);
              opacity: 0.9;
            }
            .btn.loading {
              opacity: 0.7;
              pointer-events: none;
            }
            .secure {
              margin-top: 24px;
              font-size: 13px;
              opacity: 0.7;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">💳</div>
            <h2>Complete Your Payment</h2>
            <div class="amount">R${amountInRands}</div>
            <p>Tap the button below to pay securely with PayFast.</p>
            <form id="payfast-form" action="${payFastUrl}" method="POST">
              ${formFields}
              <input type="submit" class="btn" value="Pay Now with PayFast">
            </form>
            <p class="secure">🔒 Secured by PayFast</p>
          </div>
        </body>
        </html>
      `;

      res.type('html').send(html);
    } catch (error: any) {
      console.error("[PayFast Ads Checkout] Error:", error);
      res.status(500).send("Failed to load checkout page");
    }
  });

  app.post("/api/ads/wallet/payfast/notify", async (req: Request, res: Response) => {
    try {
      const { validateITNSignature } = await import("./services/payfast");
      console.log("[PayFast Ads ITN] Received:", JSON.stringify(req.body));

      const data = req.body;
      
      if (!validateITNSignature(data)) {
        console.error("[PayFast Ads ITN] Invalid signature");
        return res.status(400).send("Invalid signature");
      }

      const paymentId = data.m_payment_id;
      if (!paymentId?.startsWith('ADWALLET-')) {
        console.log("[PayFast Ads ITN] Not an ad wallet payment, ignoring");
        return res.status(200).send("OK");
      }

      const txId = paymentId.replace('ADWALLET-', '');
      const transaction = await adsStorage.getTransactionById(txId);
      
      if (!transaction) {
        console.error("[PayFast Ads ITN] Transaction not found:", txId);
        return res.status(404).send("Transaction not found");
      }

      if (transaction.status === 'COMPLETED') {
        console.log("[PayFast Ads ITN] Transaction already processed, ignoring duplicate ITN:", txId);
        return res.status(200).send("OK");
      }

      if (transaction.status === 'FAILED' || transaction.status === 'CANCELLED') {
        console.log("[PayFast Ads ITN] Transaction already marked as failed/cancelled:", txId);
        return res.status(200).send("OK");
      }

      if (data.payment_status === "COMPLETE") {
        const wallet = await adsStorage.getWalletById(transaction.walletId);
        if (wallet) {
          try {
            const updatedWallet = await adsStorage.updateWalletBalance(wallet.id, transaction.amount, 'credit');
            
            if (!updatedWallet) {
              throw new Error("Wallet update returned null");
            }
            
            await adsStorage.updateTransaction(txId, {
              status: 'COMPLETED',
              reference: data.pf_payment_id,
              balanceBefore: wallet.balance || 0,
              balanceAfter: updatedWallet.balance || 0,
              completedAt: new Date(),
            });

            console.log("[PayFast Ads ITN] Wallet credited:", transaction.amount, "to wallet:", wallet.id);
          } catch (error: any) {
            console.error("[PayFast Ads ITN] Failed to credit wallet:", error.message);
            await adsStorage.updateTransaction(txId, {
              status: 'FAILED',
              reference: data.pf_payment_id,
            });
          }
        }
      } else {
        await adsStorage.updateTransaction(txId, {
          status: 'FAILED',
          reference: data.pf_payment_id,
        });
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("[PayFast Ads ITN] Error:", error);
      res.status(500).send("Error processing notification");
    }
  });

  app.get("/api/ads/wallet/payfast/return", async (req: Request, res: Response) => {
    const txId = req.query.tx_id as string;
    console.log("[PayFast Ads] User returned from payment, tx:", txId);
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Processing</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0;
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              color: white;
            }
            .container { 
              text-align: center; 
              padding: 40px;
              background: rgba(255,255,255,0.1);
              border-radius: 16px;
              backdrop-filter: blur(10px);
            }
            h1 { color: #9333EA; margin-bottom: 16px; }
            p { color: rgba(255,255,255,0.7); margin-bottom: 24px; }
            .loader {
              width: 48px;
              height: 48px;
              border: 4px solid rgba(147, 51, 234, 0.2);
              border-top-color: #9333EA;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 24px;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <h1>Payment Complete!</h1>
            <p>Your wallet top-up is being processed. Your balance will update shortly.</p>
            <a href="rabitchat://wallet" class="btn">Return to App</a>
            <p class="hint">Or close this window to return to the app</p>
          </div>
          <style>
            .success-icon { font-size: 48px; color: #22C55E; margin-bottom: 16px; }
            .btn { 
              display: inline-block; 
              background: #9333EA; 
              color: white; 
              padding: 16px 32px; 
              border-radius: 12px; 
              text-decoration: none; 
              font-weight: 600;
              margin-top: 16px;
            }
            .hint { font-size: 12px; opacity: 0.5; margin-top: 16px; }
          </style>
        </body>
      </html>
    `);
  });

  app.get("/api/ads/wallet/payfast/cancel", async (req: Request, res: Response) => {
    const txId = req.query.tx_id as string;
    console.log("[PayFast Ads] User cancelled payment, tx:", txId);
    
    if (txId) {
      await adsStorage.updateTransaction(txId, { status: 'CANCELLED' });
    }
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Cancelled</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0;
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              color: white;
            }
            .container { 
              text-align: center; 
              padding: 40px;
              background: rgba(255,255,255,0.1);
              border-radius: 16px;
              backdrop-filter: blur(10px);
            }
            h1 { color: #EF4444; margin-bottom: 16px; }
            p { color: rgba(255,255,255,0.7); }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="cancel-icon">✕</div>
            <h1>Payment Cancelled</h1>
            <p>Your wallet top-up was cancelled. No charges were made.</p>
            <a href="rabitchat://wallet" class="btn">Return to App</a>
          </div>
          <style>
            .cancel-icon { font-size: 48px; color: #EF4444; margin-bottom: 16px; }
            .btn { 
              display: inline-block; 
              background: #9333EA; 
              color: white; 
              padding: 16px 32px; 
              border-radius: 12px; 
              text-decoration: none; 
              font-weight: 600;
              margin-top: 16px;
            }
          </style>
        </body>
      </html>
    `);
  });

  app.get("/api/ads/wallet/payfast/status/:txId", requireAuth, async (req: Request, res: Response) => {
    try {
      const transaction = await adsStorage.getTransactionById(req.params.txId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json({ status: transaction.status });
    } catch (error: any) {
      console.error("[PayFast Ads] Status check error:", error);
      res.status(500).json({ message: "Failed to check status" });
    }
  });

  // ===== AUTO-REGISTER ADVERTISER ENDPOINT =====

  app.post("/api/ads/advertiser/register", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      
      const existing = await adsStorage.getAdvertiserByUserId(userId);
      if (existing) {
        return res.json(existing);
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { companyName, businessType } = req.body;

      const advertiser = await adsStorage.createAdvertiser({
        userId,
        businessName: companyName || user.displayName || user.username,
        businessType: businessType || 'INDIVIDUAL',
        status: 'ACTIVE',
      });

      await adsStorage.createWalletAccount(advertiser.id);

      await logAuditAction('ADVERTISER_CREATED', 'advertiser', advertiser.id, userId, 'ADVERTISER', null, advertiser, req);

      res.status(201).json(advertiser);
    } catch (error: any) {
      console.error("Failed to register advertiser:", error);
      res.status(400).json({ message: error.message || "Failed to register advertiser" });
    }
  });

  app.get("/api/ads/advertiser/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await adsStorage.getAdvertiserByUserId(req.session.userId!);
      if (!advertiser) {
        return res.status(404).json({ message: "Advertiser account not found" });
      }

      const wallet = await adsStorage.getWalletByAdvertiserId(advertiser.id);
      res.json({ ...advertiser, wallet });
    } catch (error: any) {
      console.error("Failed to get advertiser:", error);
      res.status(500).json({ message: "Failed to get advertiser" });
    }
  });

  // ===== BOOST POST ENDPOINT =====

  app.post("/api/ads/boost-post", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { postId, budget, durationDays, targeting, callToAction, destinationUrl: customDestinationUrl } = req.body;

      if (!postId) {
        return res.status(400).json({ message: "Post ID is required" });
      }
      if (!budget || budget < 5000) {
        return res.status(400).json({ message: "Minimum budget is R50 (5000 cents)" });
      }
      if (!durationDays || durationDays < 1) {
        return res.status(400).json({ message: "Duration must be at least 1 day" });
      }
      if (durationDays > 90) {
        return res.status(400).json({ message: "Maximum campaign duration is 90 days" });
      }
      if (budget > 100000000) {
        return res.status(400).json({ message: "Maximum budget is R1,000,000 (100000000 cents)" });
      }

      // CTA validation - auto vs custom destination
      const autoCTAs = ['VISIT_PROFILE', 'VIEW_POST']; // These don't need custom URL
      const customCTAs = ['LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'CONTACT', 'WATCH_MORE', 'BOOK_NOW', 'GET_OFFER', 'DOWNLOAD', 'APPLY_NOW'];
      const validCTAs = [...autoCTAs, ...customCTAs];
      const selectedCTA = callToAction && validCTAs.includes(callToAction) ? callToAction : 'VISIT_PROFILE';
      
      // Validate custom destination URL for custom CTAs
      let validatedDestinationUrl: string | undefined;
      if (customCTAs.includes(selectedCTA)) {
        if (!customDestinationUrl) {
          return res.status(400).json({ 
            message: `A destination URL is required for "${selectedCTA}" call-to-action` 
          });
        }
        // Validate URL format
        try {
          const url = new URL(customDestinationUrl);
          if (url.protocol !== 'https:' && url.protocol !== 'http:') {
            return res.status(400).json({ message: "Destination URL must be a valid web address" });
          }
          // Prefer HTTPS
          if (url.protocol === 'http:') {
            console.log(`[Boost] Warning: Non-HTTPS URL used: ${customDestinationUrl}`);
          }
          validatedDestinationUrl = customDestinationUrl;
        } catch (e) {
          return res.status(400).json({ message: "Invalid destination URL format. Please enter a valid website address (e.g., https://yoursite.com)" });
        }
      }

      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (post.authorId !== userId) {
        return res.status(403).json({ message: "You can only boost your own posts" });
      }

      let advertiser = await adsStorage.getAdvertiserByUserId(userId);
      if (!advertiser) {
        const user = await storage.getUser(userId);
        advertiser = await adsStorage.createAdvertiser({
          userId,
          businessName: user?.displayName || user?.username || 'Personal',
          businessType: 'INDIVIDUAL',
          status: 'ACTIVE',
        });
        await adsStorage.createWalletAccount(advertiser.id);
      }

      const wallet = await adsStorage.getWalletByAdvertiserId(advertiser.id);
      if (!wallet) {
        return res.status(500).json({ message: "Wallet not found" });
      }

      const totalCost = budget * durationDays;
      if ((wallet.balance || 0) < totalCost) {
        return res.status(400).json({ 
          message: `Insufficient balance. Need R${(totalCost / 100).toFixed(2)}, have R${((wallet.balance || 0) / 100).toFixed(2)}` 
        });
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      const campaign = await adsStorage.createCampaign({
        advertiserId: advertiser.id,
        name: `Boost: ${post.content?.substring(0, 50) || 'Post'}...`,
        objective: 'BOOST_POST',
        budgetType: 'LIFETIME',
        budgetAmount: totalCost,
        bidStrategy: 'LOWEST_COST',
        startDate,
        endDate,
        status: 'PENDING_REVIEW',
      });

      const adGroup = await adsStorage.createAdGroup({
        campaignId: campaign.id,
        name: 'Boosted Post Targeting',
        budgetAmount: totalCost,
        billingModel: 'CPM',
        placements: ['FEED', 'STORIES', 'DISCOVER'],
        netWorthTiers: targeting?.netWorthTiers || ['BUILDING', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'],
        interests: targeting?.interests || [],
        status: 'ACTIVE',
      });

      const adFormat = post.type === 'VIDEO' ? 'VIDEO' : post.type === 'VOICE' ? 'VOICE' : 'IMAGE';
      
      const user = await storage.getUser(userId);
      const postDeepLink = `rabitchat://post/${postId}`;
      const profileUrl = `rabitchat://profile/${user?.username || userId}`;
      
      // Determine final destination URL based on CTA type
      let finalDestinationUrl: string;
      if (selectedCTA === 'VISIT_PROFILE') {
        finalDestinationUrl = profileUrl;
      } else if (selectedCTA === 'VIEW_POST') {
        finalDestinationUrl = postDeepLink;
      } else if (validatedDestinationUrl) {
        // Custom CTAs use the advertiser's provided URL
        finalDestinationUrl = validatedDestinationUrl;
      } else {
        // Fallback to post deep link
        finalDestinationUrl = postDeepLink;
      }
      
      const ad = await adsStorage.createAd({
        campaignId: campaign.id,
        adGroupId: adGroup.id,
        advertiserId: advertiser.id,
        name: 'Boosted Post',
        format: adFormat,
        headline: post.content?.substring(0, 125) || '',
        description: `Boosted from post: ${postId}\n${post.content || ''}`,
        primaryMediaUrl: post.mediaUrl || undefined,
        primaryMediaType: post.type || 'TEXT',
        status: 'PENDING_REVIEW',
        callToAction: selectedCTA,
        destinationUrl: finalDestinationUrl,
      });
      
      console.log(`[Boost] Created ad with CTA: ${selectedCTA}, destination: ${finalDestinationUrl}`);

      // NOTE: We do NOT deduct from wallet upfront anymore
      // The budget is reserved in the campaign, and actual charges happen per impression
      // This prevents the double-deduction bug where wallet was emptied upfront,
      // leaving no balance for impression charges
      
      // Log the budget reservation (using ADJUSTMENT type as informational log)
      await adsStorage.createWalletTransaction({
        walletId: wallet.id,
        type: 'ADJUSTMENT',
        amount: 0, // No actual deduction - budget is reserved but not spent
        balanceBefore: wallet.balance || 0,
        balanceAfter: wallet.balance || 0,
        status: 'COMPLETED',
        description: `Budget reserved for boost - R${(totalCost / 100).toFixed(2)} for ${durationDays} day(s)`,
        campaignId: campaign.id,
        completedAt: new Date(),
      });

      await logAuditAction('POST_BOOSTED', 'campaign', campaign.id, userId, 'ADVERTISER', null, { campaign, ad, postId }, req);

      res.status(201).json({
        success: true,
        campaign,
        ad,
        message: 'Post boost submitted for review',
      });
    } catch (error: any) {
      console.error("Failed to boost post:", error);
      res.status(400).json({ message: error.message || "Failed to boost post" });
    }
  });

  // ===== CAMPAIGN ENDPOINTS =====

  app.get("/api/ads/campaigns", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const status = req.query.status as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const campaigns = await adsStorage.getCampaignsByAdvertiser(advertiser.id, { status, limit, offset });
      
      // Terminal statuses that should NOT be auto-activated
      const terminalStatuses = ['ACTIVE', 'PAUSED', 'COMPLETED', 'DISABLED', 'ARCHIVED', 'REJECTED'];
      
      // Enrich campaigns with adStatus for proper status display
      // FIX 5 & 10: Auto-fix orphaned ads - if ad is APPROVED but campaign isn't ACTIVE, activate it
      const enrichedCampaigns = await Promise.all(
        campaigns.map(async (campaign) => {
          const ads = await adsStorage.getAdsByCampaign(campaign.id);
          const ad = ads.length > 0 ? ads[0] : null;
          const adStatus = ad?.status || undefined;
          const adNumber = ad?.adNumber || undefined;
          const adId = ad?.id || undefined;
          
          // FIX 5 & 10: Auto-activate campaign if ad is approved but campaign isn't active
          let campaignStatus = campaign.status;
          if (ad && (ad.status === 'APPROVED' || ad.status === 'ACTIVE') && !terminalStatuses.includes(campaign.status)) {
            // Auto-fix: activate the campaign
            await adsStorage.updateCampaign(campaign.id, { status: 'ACTIVE' });
            campaignStatus = 'ACTIVE';
            console.log(`[Auto-Fix] Campaign ${campaign.id} auto-activated on fetch - ad ${adNumber || adId} is ${ad.status}`);
          }
          
          return { 
            ...campaign, 
            status: campaignStatus, // Use possibly-fixed status
            adStatus, 
            adNumber, 
            adId 
          };
        })
      );
      
      res.json(enrichedCampaigns);
    } catch (error: any) {
      console.error("Failed to get campaigns:", error);
      res.status(500).json({ message: error.message || "Failed to get campaigns" });
    }
  });

  // FIX 7: User-callable sync endpoint to fix their campaigns
  app.post("/api/ads/campaigns/sync", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const campaigns = await adsStorage.getCampaignsByAdvertiser(advertiser.id, { limit: 100 });
      
      const terminalStatuses = ['ACTIVE', 'PAUSED', 'COMPLETED', 'DISABLED', 'ARCHIVED', 'REJECTED'];
      const fixed: { campaignId: string; adNumber: string; previousStatus: string }[] = [];
      
      for (const campaign of campaigns) {
        const ads = await adsStorage.getAdsByCampaign(campaign.id);
        const ad = ads.length > 0 ? ads[0] : null;
        
        if (ad && (ad.status === 'APPROVED' || ad.status === 'ACTIVE') && !terminalStatuses.includes(campaign.status)) {
          const previousStatus = campaign.status;
          await adsStorage.updateCampaign(campaign.id, { status: 'ACTIVE' });
          fixed.push({
            campaignId: campaign.id,
            adNumber: ad.adNumber || 'N/A',
            previousStatus,
          });
          console.log(`[User Sync] Campaign ${campaign.id} activated - ad ${ad.adNumber || ad.id} is ${ad.status}`);
        }
      }
      
      res.json({
        message: `Synced ${fixed.length} campaigns`,
        fixed,
        totalCampaigns: campaigns.length,
      });
    } catch (error: any) {
      console.error("Failed to sync campaigns:", error);
      res.status(500).json({ message: error.message || "Failed to sync campaigns" });
    }
  });

  // FIX 3: Debug endpoint to check campaign/ad status
  app.get("/api/ads/campaigns/:id/debug", requireAuth, async (req: Request, res: Response) => {
    try {
      const campaign = await adsStorage.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      const ads = await adsStorage.getAdsByCampaign(campaign.id);
      
      res.json({
        campaign: {
          id: campaign.id,
          status: campaign.status,
          objective: campaign.objective,
          createdAt: campaign.createdAt,
        },
        ads: ads.map(ad => ({
          id: ad.id,
          adNumber: ad.adNumber,
          status: ad.status,
          createdAt: ad.createdAt,
          reviewedAt: ad.reviewedAt,
        })),
        diagnosis: {
          hasAds: ads.length > 0,
          firstAdStatus: ads[0]?.status || 'NO_ADS',
          campaignStatus: campaign.status,
          isOrphaned: ads.some(a => a.status === 'APPROVED' || a.status === 'ACTIVE') && campaign.status !== 'ACTIVE',
          recommendation: ads.some(a => a.status === 'APPROVED' || a.status === 'ACTIVE') && campaign.status !== 'ACTIVE' 
            ? 'Campaign should be ACTIVE but is not. Call POST /api/ads/campaigns/sync to fix.'
            : 'Status looks correct',
        },
      });
    } catch (error: any) {
      console.error("Failed to debug campaign:", error);
      res.status(500).json({ message: error.message || "Failed to debug campaign" });
    }
  });

  app.post("/api/ads/campaigns", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      
      if (advertiser.status !== 'ACTIVE') {
        return res.status(403).json({ message: "Your advertiser account must be active to create campaigns" });
      }

      const data = createCampaignSchema.parse(req.body);

      const campaign = await adsStorage.createCampaign({
        advertiserId: advertiser.id,
        name: data.name,
        objective: data.objective,
        budgetType: data.budgetType,
        budgetAmount: data.budgetAmount ? Math.round(data.budgetAmount * 100) : 0,
        bidStrategy: data.bidStrategy,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      });

      await logAuditAction('CAMPAIGN_CREATED', 'campaign', campaign.id, req.session.userId, 'ADVERTISER', null, campaign, req);

      res.status(201).json(campaign);
    } catch (error: any) {
      console.error("Failed to create campaign:", error);
      res.status(400).json({ message: error.message || "Failed to create campaign" });
    }
  });

  app.get("/api/ads/campaigns/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const campaign = await adsStorage.getCampaignById(req.params.id);

      if (!campaign || campaign.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const adGroups = await adsStorage.getAdGroupsByCampaign(campaign.id);
      const diagnostics = await adsStorage.getCampaignDiagnostics(campaign.id);
      
      // Fetch the ad status for this campaign
      const campaignAds = await adsStorage.getAdsByCampaign(campaign.id);
      const adStatus = campaignAds.length > 0 ? campaignAds[0].status : undefined;
      
      // Fetch post preview if this is a boost campaign
      let postPreview = null;
      if (campaignAds.length > 0) {
        const ad = campaignAds[0];
        // Extract postId from description (format: "Boosted from post: {postId}\n...")
        const descMatch = ad.description?.match(/Boosted from post: ([a-f0-9-]+)/);
        const postId = descMatch ? descMatch[1] : null;
        if (postId) {
          const { storage } = await import('./storage');
          const post = await storage.getPost(postId);
          if (post) {
            postPreview = {
              id: post.id,
              content: post.content || '',
              mediaUrl: post.mediaUrl,
              mediaType: post.type, // Post uses 'type' field for TEXT/PHOTO/VIDEO
              user: post.author ? {
                displayName: post.author.displayName,
                username: post.author.username,
                profilePicUrl: post.author.avatarUrl,
              } : undefined,
            };
          }
        }
      }

      const adNumber = campaignAds.length > 0 ? campaignAds[0].adNumber : undefined;
      const adId = campaignAds.length > 0 ? campaignAds[0].id : undefined;
      const callToAction = campaignAds.length > 0 ? campaignAds[0].callToAction : undefined;
      const destinationUrl = campaignAds.length > 0 ? campaignAds[0].destinationUrl : undefined;
      res.json({ ...campaign, adGroups, diagnostics, adStatus, adNumber, adId, postPreview, callToAction, destinationUrl });
    } catch (error: any) {
      console.error("Failed to get campaign:", error);
      res.status(500).json({ message: error.message || "Failed to get campaign" });
    }
  });

  app.patch("/api/ads/campaigns/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const campaign = await adsStorage.getCampaignById(req.params.id);

      if (!campaign || campaign.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const data = createCampaignSchema.partial().parse(req.body);
      const previousState = { ...campaign };

      const updated = await adsStorage.updateCampaign(campaign.id, {
        ...data,
        budgetAmount: data.budgetAmount ? Math.round(data.budgetAmount * 100) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      });

      await logAuditAction('CAMPAIGN_UPDATED', 'campaign', campaign.id, req.session.userId, 'ADVERTISER', previousState, updated, req);

      res.json(updated);
    } catch (error: any) {
      console.error("Failed to update campaign:", error);
      res.status(400).json({ message: error.message || "Failed to update campaign" });
    }
  });

  app.post("/api/ads/campaigns/:id/submit", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const campaign = await adsStorage.getCampaignById(req.params.id);

      if (!campaign || campaign.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      if (campaign.status !== 'DRAFT') {
        return res.status(400).json({ message: "Only draft campaigns can be submitted" });
      }

      const adGroups = await adsStorage.getAdGroupsByCampaign(campaign.id);
      if (adGroups.length === 0) {
        return res.status(400).json({ message: "Campaign must have at least one ad group" });
      }

      let hasAds = false;
      for (const group of adGroups) {
        const adsInGroup = await adsStorage.getAdsByAdGroup(group.id);
        if (adsInGroup.length > 0) {
          hasAds = true;
          break;
        }
      }

      if (!hasAds) {
        return res.status(400).json({ message: "Campaign must have at least one ad" });
      }

      const updated = await adsStorage.updateCampaign(campaign.id, {
        status: 'PENDING_REVIEW',
        submittedAt: new Date(),
      });

      await logAuditAction('CAMPAIGN_SUBMITTED', 'campaign', campaign.id, req.session.userId, 'ADVERTISER', campaign, updated, req);

      res.json(updated);
    } catch (error: any) {
      console.error("Failed to submit campaign:", error);
      res.status(400).json({ message: error.message || "Failed to submit campaign" });
    }
  });

  app.post("/api/ads/campaigns/:id/pause", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const campaign = await adsStorage.getCampaignById(req.params.id);

      if (!campaign || campaign.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const updated = await adsStorage.updateCampaignStatus(campaign.id, 'PAUSED', req.session.userId);

      await logAuditAction('CAMPAIGN_PAUSED', 'campaign', campaign.id, req.session.userId, 'ADVERTISER', campaign, updated, req);

      res.json(updated);
    } catch (error: any) {
      console.error("Failed to pause campaign:", error);
      res.status(400).json({ message: error.message || "Failed to pause campaign" });
    }
  });

  app.post("/api/ads/campaigns/:id/resume", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const campaign = await adsStorage.getCampaignById(req.params.id);

      if (!campaign || campaign.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      if (campaign.status !== 'PAUSED') {
        return res.status(400).json({ message: "Only paused campaigns can be resumed" });
      }

      // Check if the associated ads are approved
      const campaignAds = await adsStorage.getAdsByCampaign(campaign.id);
      const hasApprovedAd = campaignAds.some(ad => ad.status === 'APPROVED' || ad.status === 'ACTIVE');
      const hasPendingAd = campaignAds.some(ad => ad.status === 'PENDING_REVIEW' || ad.status === 'IN_REVIEW');
      
      if (!hasApprovedAd && hasPendingAd) {
        return res.status(400).json({ message: "Cannot resume campaign while ads are pending review" });
      }

      const updated = await adsStorage.updateCampaignStatus(campaign.id, 'ACTIVE');

      await logAuditAction('CAMPAIGN_RESUMED', 'campaign', campaign.id, req.session.userId, 'ADVERTISER', campaign, updated, req);

      res.json(updated);
    } catch (error: any) {
      console.error("Failed to resume campaign:", error);
      res.status(400).json({ message: error.message || "Failed to resume campaign" });
    }
  });

  // ===== AD GROUP ENDPOINTS =====

  app.get("/api/ads/ad-groups", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const campaignId = req.query.campaignId as string;

      if (!campaignId) {
        return res.status(400).json({ message: "Campaign ID required" });
      }

      const campaign = await adsStorage.getCampaignById(campaignId);
      if (!campaign || campaign.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const adGroups = await adsStorage.getAdGroupsByCampaign(campaignId);
      res.json(adGroups);
    } catch (error: any) {
      console.error("Failed to get ad groups:", error);
      res.status(500).json({ message: error.message || "Failed to get ad groups" });
    }
  });

  app.post("/api/ads/ad-groups", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const data = createAdGroupSchema.parse(req.body);

      const campaign = await adsStorage.getCampaignById(data.campaignId);
      if (!campaign || campaign.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const adGroup = await adsStorage.createAdGroup({
        campaignId: data.campaignId,
        name: data.name,
        budgetAmount: data.budgetAmount ? Math.round(data.budgetAmount * 100) : undefined,
        bidAmount: data.bidAmount ? Math.round(data.bidAmount * 100) : undefined,
        billingModel: data.billingModel,
        placements: data.placements || [],
        netWorthTiers: data.netWorthTiers || [],
        minInfluenceScore: data.minInfluenceScore,
        maxInfluenceScore: data.maxInfluenceScore,
        ageMin: data.ageMin,
        ageMax: data.ageMax,
        genders: data.genders || [],
        countries: data.countries || [],
        interests: data.interests || [],
        frequencyCapImpressions: data.frequencyCapImpressions,
        frequencyCapPeriodHours: data.frequencyCapPeriodHours,
      });

      await logAuditAction('AD_GROUP_CREATED', 'ad_group', adGroup.id, req.session.userId, 'ADVERTISER', null, adGroup, req);

      res.status(201).json(adGroup);
    } catch (error: any) {
      console.error("Failed to create ad group:", error);
      res.status(400).json({ message: error.message || "Failed to create ad group" });
    }
  });

  app.patch("/api/ads/ad-groups/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const adGroup = await adsStorage.getAdGroupById(req.params.id);

      if (!adGroup) {
        return res.status(404).json({ message: "Ad group not found" });
      }

      const campaign = await adsStorage.getCampaignById(adGroup.campaignId);
      if (!campaign || campaign.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const data = createAdGroupSchema.partial().parse(req.body);
      const previousState = { ...adGroup };

      const updated = await adsStorage.updateAdGroup(adGroup.id, {
        ...data,
        budgetAmount: data.budgetAmount ? Math.round(data.budgetAmount * 100) : undefined,
        bidAmount: data.bidAmount ? Math.round(data.bidAmount * 100) : undefined,
      });

      await logAuditAction('AD_GROUP_UPDATED', 'ad_group', adGroup.id, req.session.userId, 'ADVERTISER', previousState, updated, req);

      res.json(updated);
    } catch (error: any) {
      console.error("Failed to update ad group:", error);
      res.status(400).json({ message: error.message || "Failed to update ad group" });
    }
  });

  // ===== AD ENDPOINTS =====

  app.get("/api/ads/ads", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const adGroupId = req.query.adGroupId as string;
      const campaignId = req.query.campaignId as string;

      if (adGroupId) {
        const adGroup = await adsStorage.getAdGroupById(adGroupId);
        if (!adGroup) {
          return res.status(404).json({ message: "Ad group not found" });
        }
        const campaign = await adsStorage.getCampaignById(adGroup.campaignId);
        if (!campaign || campaign.advertiserId !== advertiser.id) {
          return res.status(404).json({ message: "Campaign not found" });
        }
        const ads = await adsStorage.getAdsByAdGroup(adGroupId);
        return res.json(ads);
      }

      if (campaignId) {
        const campaign = await adsStorage.getCampaignById(campaignId);
        if (!campaign || campaign.advertiserId !== advertiser.id) {
          return res.status(404).json({ message: "Campaign not found" });
        }
        const ads = await adsStorage.getAdsByCampaign(campaignId);
        return res.json(ads);
      }

      return res.status(400).json({ message: "Campaign ID or Ad Group ID required" });
    } catch (error: any) {
      console.error("Failed to get ads:", error);
      res.status(500).json({ message: error.message || "Failed to get ads" });
    }
  });

  app.post("/api/ads/ads", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const data = createAdSchema.parse(req.body);

      const adGroup = await adsStorage.getAdGroupById(data.adGroupId);
      if (!adGroup) {
        return res.status(404).json({ message: "Ad group not found" });
      }

      const campaign = await adsStorage.getCampaignById(adGroup.campaignId);
      if (!campaign || campaign.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const ad = await adsStorage.createAd({
        adGroupId: data.adGroupId,
        campaignId: adGroup.campaignId,
        advertiserId: advertiser.id,
        name: data.name,
        format: data.format,
        headline: data.headline,
        description: data.description,
        callToAction: data.callToAction,
        destinationUrl: data.destinationUrl,
        primaryMediaUrl: data.primaryMediaUrl,
        primaryMediaType: data.primaryMediaType,
        carouselItems: data.carouselItems || [],
        voiceUrl: data.voiceUrl,
        voiceDuration: data.voiceDuration,
        pollQuestion: data.pollQuestion,
        pollOptions: data.pollOptions || [],
      });

      await logAuditAction('AD_CREATED', 'ad', ad.id, req.session.userId, 'ADVERTISER', null, ad, req);

      res.status(201).json(ad);
    } catch (error: any) {
      console.error("Failed to create ad:", error);
      res.status(400).json({ message: error.message || "Failed to create ad" });
    }
  });

  app.get("/api/ads/ads/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const ad = await adsStorage.getAdById(req.params.id);

      if (!ad || ad.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Ad not found" });
      }

      const reviewHistory = await adsStorage.getReviewHistoryByAd(ad.id);

      res.json({ ...ad, reviewHistory });
    } catch (error: any) {
      console.error("Failed to get ad:", error);
      res.status(500).json({ message: error.message || "Failed to get ad" });
    }
  });

  app.patch("/api/ads/ads/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const ad = await adsStorage.getAdById(req.params.id);

      if (!ad || ad.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Ad not found" });
      }

      if (ad.status !== 'DRAFT' && ad.status !== 'REJECTED') {
        return res.status(400).json({ message: "Only draft or rejected ads can be edited" });
      }

      const data = createAdSchema.partial().parse(req.body);
      const previousState = { ...ad };

      const updated = await adsStorage.updateAd(ad.id, data);

      await logAuditAction('AD_UPDATED', 'ad', ad.id, req.session.userId, 'ADVERTISER', previousState, updated, req);

      res.json(updated);
    } catch (error: any) {
      console.error("Failed to update ad:", error);
      res.status(400).json({ message: error.message || "Failed to update ad" });
    }
  });

  // ===== AD EVENT TRACKING ENDPOINTS =====

  app.post("/api/ads/track/click", requireAuth, async (req: Request, res: Response) => {
    try {
      const { adId, placement } = req.body;
      if (!adId) {
        return res.status(400).json({ message: "Ad ID is required" });
      }
      
      const { adsEngine } = await import("./ads-engine");
      await adsEngine.recordClick(adId, req.session.userId!, placement || 'feed');
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to track ad click:", error);
      res.status(500).json({ message: "Failed to track click" });
    }
  });

  // Enhanced CTA click tracking with destination URL logging
  app.post("/api/ads/track/cta-click", requireAuth, async (req: Request, res: Response) => {
    try {
      const { adId, ctaType, destinationUrl, placement } = req.body;
      if (!adId) {
        return res.status(400).json({ message: "Ad ID is required" });
      }
      
      const { adsEngine } = await import("./ads-engine");
      await adsEngine.recordClick(adId, req.session.userId!, placement || 'feed');
      
      // Log CTA-specific click for analytics
      console.log(`[CTA Click] Ad: ${adId}, CTA: ${ctaType || 'unknown'}, Destination: ${destinationUrl || 'none'}, User: ${req.session.userId}`);
      
      // Track as conversion if it's an external URL click
      if (destinationUrl && destinationUrl.startsWith('http')) {
        await adsEngine.recordConversion(adId, req.session.userId!, 'CTA_CLICK', 0);
      }
      
      res.json({ success: true, destinationUrl });
    } catch (error: any) {
      console.error("Failed to track CTA click:", error);
      res.status(500).json({ message: "Failed to track CTA click" });
    }
  });

  app.post("/api/ads/track/engagement", requireAuth, async (req: Request, res: Response) => {
    try {
      const { adId, engagementType } = req.body;
      if (!adId || !engagementType) {
        return res.status(400).json({ message: "Ad ID and engagement type are required" });
      }
      
      if (!['like', 'comment', 'share', 'save'].includes(engagementType)) {
        return res.status(400).json({ message: "Invalid engagement type" });
      }
      
      const { adsEngine } = await import("./ads-engine");
      await adsEngine.recordEngagement(adId, req.session.userId!, engagementType);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to track ad engagement:", error);
      res.status(500).json({ message: "Failed to track engagement" });
    }
  });

  app.post("/api/ads/track/conversion", requireAuth, async (req: Request, res: Response) => {
    try {
      const { adId, conversionType, value } = req.body;
      if (!adId || !conversionType) {
        return res.status(400).json({ message: "Ad ID and conversion type are required" });
      }
      
      const { adsEngine } = await import("./ads-engine");
      await adsEngine.recordConversion(adId, req.session.userId!, conversionType, value);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to track conversion:", error);
      res.status(500).json({ message: "Failed to track conversion" });
    }
  });

  // ===== STATS ENDPOINTS =====

  app.get("/api/ads/stats/overview", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      
      const campaigns = await adsStorage.getCampaignsByAdvertiser(advertiser.id);
      
      let totalSpend = 0;
      let totalImpressions = 0;
      let totalClicks = 0;
      let totalConversions = 0;

      for (const campaign of campaigns) {
        totalSpend += campaign.budgetSpent || 0;
        totalImpressions += campaign.impressions || 0;
        totalClicks += campaign.clicks || 0;
        totalConversions += campaign.conversions || 0;
      }

      res.json({
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
        totalSpend: totalSpend / 100,
        totalImpressions,
        totalClicks,
        totalConversions,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : 0,
      });
    } catch (error: any) {
      console.error("Failed to get stats overview:", error);
      res.status(500).json({ message: error.message || "Failed to get stats" });
    }
  });

  app.get("/api/ads/stats/campaign/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const campaign = await adsStorage.getCampaignById(req.params.id);

      if (!campaign || campaign.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const startDate = new Date(req.query.startDate as string || Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date(req.query.endDate as string || Date.now());

      const stats = await adsStorage.getCampaignStats(campaign.id, startDate, endDate);

      res.json({
        campaign: {
          impressions: campaign.impressions,
          clicks: campaign.clicks,
          conversions: campaign.conversions,
          spend: (campaign.budgetSpent || 0) / 100,
          ctr: campaign.impressions && campaign.impressions > 0 ? (campaign.clicks! / campaign.impressions * 100).toFixed(2) : 0,
        },
        daily: stats,
      });
    } catch (error: any) {
      console.error("Failed to get campaign stats:", error);
      res.status(500).json({ message: error.message || "Failed to get stats" });
    }
  });

  // ===== CUSTOM AUDIENCES =====

  app.get("/api/ads/audiences", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const audiences = await adsStorage.getCustomAudiencesByAdvertiser(advertiser.id);
      res.json(audiences);
    } catch (error: any) {
      console.error("Failed to get audiences:", error);
      res.status(500).json({ message: error.message || "Failed to get audiences" });
    }
  });

  app.post("/api/ads/audiences", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const { name, description, type, rules } = req.body;

      const audience = await adsStorage.createCustomAudience({
        advertiserId: advertiser.id,
        name,
        description,
        type: type || 'CUSTOM',
        rules: rules || {},
      });

      await logAuditAction('AUDIENCE_CREATED', 'audience', audience.id, req.session.userId, 'ADVERTISER', null, audience, req);

      res.status(201).json(audience);
    } catch (error: any) {
      console.error("Failed to create audience:", error);
      res.status(400).json({ message: error.message || "Failed to create audience" });
    }
  });

  // ===== CONVERSION PIXELS =====

  app.get("/api/ads/pixels", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const pixels = await adsStorage.getConversionPixelsByAdvertiser(advertiser.id);
      res.json(pixels);
    } catch (error: any) {
      console.error("Failed to get pixels:", error);
      res.status(500).json({ message: error.message || "Failed to get pixels" });
    }
  });

  app.post("/api/ads/pixels", requireAuth, async (req: Request, res: Response) => {
    try {
      const advertiser = await getAdvertiserOrFail(req.session.userId!);
      const { name, conversionType, defaultValue } = req.body;

      const pixel = await adsStorage.createConversionPixel({
        advertiserId: advertiser.id,
        name,
        conversionType,
        defaultValue: defaultValue ? Math.round(defaultValue * 100) : undefined,
      });

      res.status(201).json(pixel);
    } catch (error: any) {
      console.error("Failed to create pixel:", error);
      res.status(400).json({ message: error.message || "Failed to create pixel" });
    }
  });

  app.post("/api/ads/pixels/:code/fire", async (req: Request, res: Response) => {
    try {
      const pixel = await adsStorage.getConversionPixelByCode(req.params.code);
      if (!pixel || !pixel.isActive) {
        return res.status(404).json({ message: "Pixel not found" });
      }

      await adsStorage.incrementPixelFires(pixel.id);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to fire pixel:", error);
      res.status(500).json({ message: "Failed to fire pixel" });
    }
  });

  // ===== POLICIES & TERMS =====

  app.get("/api/ads/policies", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const policies = await adsStorage.getAdPolicies(category);
      res.json(policies);
    } catch (error: any) {
      console.error("Failed to get policies:", error);
      res.status(500).json({ message: "Failed to get policies" });
    }
  });

  app.get("/api/ads/terms", async (req: Request, res: Response) => {
    try {
      const terms = await adsStorage.getActiveAdvertisingTerms();
      res.json(terms || null);
    } catch (error: any) {
      console.error("Failed to get terms:", error);
      res.status(500).json({ message: "Failed to get terms" });
    }
  });

  // ===== ADMIN: ADVERTISERS =====

  app.get("/api/admin/ads/overview", requireAdmin, async (req: Request, res: Response) => {
    try {
      const overview = await adsStorage.getAdsOverview();
      res.json(overview);
    } catch (error: any) {
      console.error("Failed to get ads overview:", error);
      res.status(500).json({ message: "Failed to get overview" });
    }
  });

  // CTA performance analytics
  app.get("/api/admin/ads/cta-performance", requireAdmin, async (req: Request, res: Response) => {
    try {
      const ctaStats = await adsStorage.getCtaPerformanceStats();
      res.json({ ctaStats });
    } catch (error: any) {
      console.error("Failed to get CTA performance:", error);
      res.status(500).json({ message: "Failed to get CTA performance" });
    }
  });

  // Destination URL performance analytics
  app.get("/api/admin/ads/destination-performance", requireAdmin, async (req: Request, res: Response) => {
    try {
      const destinations = await adsStorage.getDestinationPerformanceStats();
      res.json({ destinations });
    } catch (error: any) {
      console.error("Failed to get destination performance:", error);
      res.status(500).json({ message: "Failed to get destination performance" });
    }
  });

  app.get("/api/admin/ads/advertisers", requireAdmin, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      const verificationStatus = req.query.verificationStatus as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await adsStorage.getAllAdvertisers({ status, verificationStatus, limit, offset });
      
      // Enrich with wallet information for admin
      const enrichedAdvertisers = await Promise.all(result.advertisers.map(async (adv) => {
        const wallet = await adsStorage.getWalletByAdvertiserId(adv.id);
        const user = await storage.getUser(adv.userId);
        const campaigns = await adsStorage.getCampaignsByAdvertiser(adv.id);
        
        return {
          ...adv,
          walletId: wallet?.id,
          walletBalance: wallet?.balance || 0,
          totalSpend: wallet?.lifetimeSpend || 0,
          campaignCount: campaigns.length,
          user: user ? { id: user.id, username: user.username, email: user.email } : null,
        };
      }));
      
      res.json({ advertisers: enrichedAdvertisers, total: result.total });
    } catch (error: any) {
      console.error("Failed to get advertisers:", error);
      res.status(500).json({ message: "Failed to get advertisers" });
    }
  });

  app.get("/api/admin/ads/advertisers/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const advertiser = await adsStorage.getAdvertiserById(req.params.id);
      if (!advertiser) {
        return res.status(404).json({ message: "Advertiser not found" });
      }

      const wallet = await adsStorage.getWalletByAdvertiserId(advertiser.id);
      const campaigns = await adsStorage.getCampaignsByAdvertiser(advertiser.id);
      const achievements = await adsStorage.getAdvertiserAchievements(advertiser.id);
      const user = await storage.getUser(advertiser.userId);

      res.json({ ...advertiser, wallet, campaigns, achievements, user });
    } catch (error: any) {
      console.error("Failed to get advertiser:", error);
      res.status(500).json({ message: "Failed to get advertiser" });
    }
  });

  app.patch("/api/admin/ads/advertisers/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const advertiser = await adsStorage.getAdvertiserById(req.params.id);
      if (!advertiser) {
        return res.status(404).json({ message: "Advertiser not found" });
      }

      const previousState = { ...advertiser };
      const updated = await adsStorage.updateAdvertiser(advertiser.id, req.body);

      await logAuditAction('ADVERTISER_UPDATED', 'advertiser', advertiser.id, req.session.userId, 'ADMIN', previousState, updated, req);

      res.json(updated);
    } catch (error: any) {
      console.error("Failed to update advertiser:", error);
      res.status(400).json({ message: error.message || "Failed to update advertiser" });
    }
  });

  app.post("/api/admin/ads/advertisers/:id/verify", requireAdmin, async (req: Request, res: Response) => {
    try {
      const advertiser = await adsStorage.getAdvertiserById(req.params.id);
      if (!advertiser) {
        return res.status(404).json({ message: "Advertiser not found" });
      }

      const { status, note } = req.body;
      const previousState = { ...advertiser };

      const updated = await adsStorage.updateAdvertiser(advertiser.id, {
        verificationStatus: status,
        verifiedAt: status === 'VERIFIED' ? new Date() : undefined,
        verifiedById: status === 'VERIFIED' ? req.session.userId : undefined,
        status: status === 'VERIFIED' ? 'ACTIVE' : advertiser.status,
      });

      await logAuditAction('ADVERTISER_VERIFIED', 'advertiser', advertiser.id, req.session.userId, 'ADMIN', previousState, updated, req);

      res.json(updated);
    } catch (error: any) {
      console.error("Failed to verify advertiser:", error);
      res.status(400).json({ message: error.message || "Failed to verify advertiser" });
    }
  });

  // ===== ADMIN: CAMPAIGNS =====

  app.get("/api/admin/ads/campaigns", requireAdmin, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await adsStorage.getAllCampaigns({ status, limit, offset });
      res.json(result);
    } catch (error: any) {
      console.error("Failed to get campaigns:", error);
      res.status(500).json({ message: "Failed to get campaigns" });
    }
  });

  app.get("/api/admin/ads/campaigns/pending", requireAdmin, async (req: Request, res: Response) => {
    try {
      const campaigns = await adsStorage.getPendingReviewCampaigns();
      res.json(campaigns);
    } catch (error: any) {
      console.error("Failed to get pending campaigns:", error);
      res.status(500).json({ message: "Failed to get pending campaigns" });
    }
  });

  app.post("/api/admin/ads/campaigns/:id/review", requireAdmin, async (req: Request, res: Response) => {
    try {
      const campaign = await adsStorage.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      const { action, reason } = req.body;
      const previousState = { ...campaign };

      let newStatus: string;
      if (action === 'approve') {
        newStatus = 'ACTIVE';
      } else if (action === 'reject') {
        newStatus = 'REJECTED';
      } else {
        return res.status(400).json({ message: "Invalid action" });
      }

      const updated = await adsStorage.updateCampaignStatus(campaign.id, newStatus, req.session.userId, reason);

      if (action === 'reject' && campaign.budgetAmount && campaign.budgetAmount > 0) {
        const wallet = await adsStorage.getWalletByAdvertiserId(campaign.advertiserId);
        if (wallet) {
          try {
            const balanceBefore = wallet.balance || 0;
            const updatedWallet = await adsStorage.updateWalletBalance(wallet.id, campaign.budgetAmount, 'credit');
            
            if (updatedWallet) {
              await adsStorage.createWalletTransaction({
                walletId: wallet.id,
                type: 'REFUND',
                amount: campaign.budgetAmount,
                balanceBefore: balanceBefore,
                balanceAfter: updatedWallet.balance || 0,
                status: 'COMPLETED',
                description: `Refund for rejected campaign: ${campaign.name}`,
                campaignId: campaign.id,
                completedAt: new Date(),
              });
              console.log(`[Campaign Refund] Refunded ${campaign.budgetAmount} cents to wallet ${wallet.id} for rejected campaign ${campaign.id}`);
            } else {
              console.error("[Campaign Refund] Wallet update returned null for campaign:", campaign.id);
            }
          } catch (refundError: any) {
            console.error("[Campaign Refund] Failed to refund:", refundError.message);
          }
        }
      }

      await logAuditAction(action === 'approve' ? 'CAMPAIGN_APPROVED' : 'CAMPAIGN_REJECTED', 'campaign', campaign.id, req.session.userId, 'ADMIN', previousState, updated, req);

      res.json(updated);
    } catch (error: any) {
      console.error("Failed to review campaign:", error);
      res.status(400).json({ message: error.message || "Failed to review campaign" });
    }
  });

  // ===== ADMIN: ADS =====

  app.get("/api/admin/ads/ads", requireAdmin, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      const format = req.query.format as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await adsStorage.getAllAds({ status, format, limit, offset });
      res.json(result);
    } catch (error: any) {
      console.error("Failed to get ads:", error);
      res.status(500).json({ message: "Failed to get ads" });
    }
  });

  app.get("/api/admin/ads/ads/pending", requireAdmin, async (req: Request, res: Response) => {
    try {
      const ads = await adsStorage.getPendingReviewAds();
      res.json(ads);
    } catch (error: any) {
      console.error("Failed to get pending ads:", error);
      res.status(500).json({ message: "Failed to get pending ads" });
    }
  });

  app.post("/api/admin/ads/ads/:id/review", requireAdmin, async (req: Request, res: Response) => {
    try {
      const ad = await adsStorage.getAdById(req.params.id);
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }

      const { action, reason, policyViolations } = req.body;
      const previousState = { ...ad };

      let newStatus: string;
      if (action === 'approve') {
        newStatus = 'APPROVED';
      } else if (action === 'reject') {
        newStatus = 'REJECTED';
      } else {
        return res.status(400).json({ message: "Invalid action" });
      }

      const updated = await adsStorage.updateAdStatus(ad.id, newStatus, req.session.userId, reason);

      if (policyViolations) {
        await adsStorage.updateAd(ad.id, { policyViolations });
      }

      await adsStorage.createReviewHistory({
        adId: ad.id,
        campaignId: ad.campaignId,
        reviewerId: req.session.userId,
        action: action.toUpperCase(),
        previousStatus: previousState.status,
        newStatus: newStatus as any,
        reason,
        policyViolations: policyViolations || [],
      });

      // When ad is approved, also activate the campaign - include ALL non-terminal statuses
      if (action === 'approve') {
        const campaign = await adsStorage.getCampaignById(ad.campaignId);
        const terminalStatuses = ['ACTIVE', 'PAUSED', 'COMPLETED', 'DISABLED', 'ARCHIVED'];
        if (campaign && !terminalStatuses.includes(campaign.status)) {
          const previousStatus = campaign.status;
          await adsStorage.updateCampaign(campaign.id, { status: 'ACTIVE' });
          console.log(`[Ad Approval] Campaign ${campaign.id} activated (was ${previousStatus}) after ad approval`);
          await logAuditAction('CAMPAIGN_ACTIVATED', 'campaign', campaign.id, req.session.userId, 'ADMIN', 
            { status: previousStatus }, 
            { status: 'ACTIVE' }, 
            req
          );
        } else if (campaign) {
          console.log(`[Ad Approval] Campaign ${campaign.id} already in terminal status ${campaign.status}, not activating`);
        }
      }

      if (action === 'reject') {
        const campaign = await adsStorage.getCampaignById(ad.campaignId);
        if (campaign && campaign.objective === 'BOOST_POST' && campaign.status === 'PENDING_REVIEW') {
          const wallet = await adsStorage.getWalletByAdvertiserId(campaign.advertiserId);
          if (wallet && campaign.budgetAmount && campaign.budgetAmount > 0) {
            const balanceBefore = wallet.balance || 0;
            const updatedWallet = await adsStorage.updateWalletBalance(wallet.id, campaign.budgetAmount, 'credit');
            
            if (updatedWallet) {
              await adsStorage.createWalletTransaction({
                walletId: wallet.id,
                type: 'REFUND',
                amount: campaign.budgetAmount,
                balanceBefore: balanceBefore,
                balanceAfter: updatedWallet.balance || 0,
                status: 'COMPLETED',
                description: `Refund for rejected boost ad #${ad.id}`,
                campaignId: campaign.id,
                completedAt: new Date(),
              });

              await adsStorage.updateCampaign(campaign.id, { status: 'REJECTED' });
              
              await logAuditAction('BOOST_AD_REFUNDED', 'campaign', campaign.id, req.session.userId, 'ADMIN', 
                { balance: balanceBefore }, 
                { balance: updatedWallet.balance, refundAmount: campaign.budgetAmount }, 
                req
              );
            }
          }
        }
      }

      await logAuditAction(action === 'approve' ? 'AD_APPROVED' : 'AD_REJECTED', 'ad', ad.id, req.session.userId, 'ADMIN', previousState, updated, req);

      res.json(updated);
    } catch (error: any) {
      console.error("Failed to review ad:", error);
      res.status(400).json({ message: error.message || "Failed to review ad" });
    }
  });

  // ===== ADMIN: WALLET MANAGEMENT =====

  app.get("/api/admin/ads/wallets", requireAdmin, async (req: Request, res: Response) => {
    try {
      const wallets = await db.select({
        wallet: adWalletAccounts,
        advertiser: advertisers,
      })
      .from(adWalletAccounts)
      .leftJoin(advertisers, eq(adWalletAccounts.advertiserId, advertisers.id))
      .orderBy(desc(adWalletAccounts.updatedAt))
      .limit(100);

      res.json(wallets);
    } catch (error: any) {
      console.error("Failed to get wallets:", error);
      res.status(500).json({ message: "Failed to get wallets" });
    }
  });

  app.post("/api/admin/ads/wallets/:id/adjust", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { amount, type, reason } = req.body;

      const [wallet] = await db.select().from(adWalletAccounts).where(eq(adWalletAccounts.id, req.params.id));
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      const previousBalance = wallet.balance;
      const amountCents = Math.round(amount * 100);

      await adsStorage.createWalletTransaction({
        walletId: wallet.id,
        type: type === 'credit' ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT',
        amount: amountCents,
        balanceBefore: wallet.balance || 0,
        balanceAfter: type === 'credit' ? (wallet.balance || 0) + amountCents : (wallet.balance || 0) - amountCents,
        status: 'COMPLETED',
        description: `Admin adjustment: ${reason}`,
        adminId: req.session.userId,
        adminNotes: reason,
        completedAt: new Date(),
      });

      const updated = await adsStorage.updateWalletBalance(wallet.id, amountCents, type);

      await logAuditAction('WALLET_ADJUSTED', 'wallet', wallet.id, req.session.userId, 'ADMIN', { balance: previousBalance }, { balance: updated?.balance }, req);

      res.json(updated);
    } catch (error: any) {
      console.error("Failed to adjust wallet:", error);
      res.status(400).json({ message: error.message || "Failed to adjust wallet" });
    }
  });

  app.post("/api/admin/ads/wallets/:id/freeze", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;

      const updated = await adsStorage.freezeWallet(req.params.id, reason, req.session.userId!);
      if (!updated) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      await logAuditAction('WALLET_FROZEN', 'wallet', req.params.id, req.session.userId, 'ADMIN', { isFrozen: false }, { isFrozen: true, reason }, req);

      res.json(updated);
    } catch (error: any) {
      console.error("Failed to freeze wallet:", error);
      res.status(400).json({ message: error.message || "Failed to freeze wallet" });
    }
  });

  app.post("/api/admin/ads/wallets/:id/unfreeze", requireAdmin, async (req: Request, res: Response) => {
    try {
      const updated = await adsStorage.unfreezeWallet(req.params.id);
      if (!updated) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      await logAuditAction('WALLET_UNFROZEN', 'wallet', req.params.id, req.session.userId, 'ADMIN', { isFrozen: true }, { isFrozen: false }, req);

      res.json(updated);
    } catch (error: any) {
      console.error("Failed to unfreeze wallet:", error);
      res.status(400).json({ message: error.message || "Failed to unfreeze wallet" });
    }
  });

  // ===== ADMIN: PROMO CODES =====

  app.get("/api/admin/ads/promo-codes", requireAdmin, async (req: Request, res: Response) => {
    try {
      const promoCodes = await adsStorage.getAllPromoCodes();
      res.json(promoCodes);
    } catch (error: any) {
      console.error("Failed to get promo codes:", error);
      res.status(500).json({ message: "Failed to get promo codes" });
    }
  });

  app.post("/api/admin/ads/promo-codes", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { code, amount, usageLimit, validUntil, description } = req.body;

      const promo = await adsStorage.createPromoCode({
        code: code.toUpperCase(),
        amount: Math.round(amount * 100),
        usageLimit,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        description,
        createdById: req.session.userId,
      });

      await logAuditAction('PROMO_CODE_CREATED', 'promo_code', promo.id, req.session.userId, 'ADMIN', null, promo, req);

      res.status(201).json(promo);
    } catch (error: any) {
      console.error("Failed to create promo code:", error);
      res.status(400).json({ message: error.message || "Failed to create promo code" });
    }
  });

  // ===== ADMIN: POLICIES & TERMS =====

  app.get("/api/admin/ads/policies", requireAdmin, async (req: Request, res: Response) => {
    try {
      const policies = await db.select().from(adPolicies).orderBy(adPolicies.sortOrder);
      res.json(policies);
    } catch (error: any) {
      console.error("Failed to get policies:", error);
      res.status(500).json({ message: "Failed to get policies" });
    }
  });

  app.post("/api/admin/ads/policies", requireAdmin, async (req: Request, res: Response) => {
    try {
      const policy = await adsStorage.createAdPolicy(req.body);

      await logAuditAction('POLICY_CREATED', 'policy', policy.id, req.session.userId, 'ADMIN', null, policy, req);

      res.status(201).json(policy);
    } catch (error: any) {
      console.error("Failed to create policy:", error);
      res.status(400).json({ message: error.message || "Failed to create policy" });
    }
  });

  app.patch("/api/admin/ads/policies/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const [existing] = await db.select().from(adPolicies).where(eq(adPolicies.id, req.params.id));
      if (!existing) {
        return res.status(404).json({ message: "Policy not found" });
      }

      const previousState = { ...existing };
      const updated = await adsStorage.updateAdPolicy(req.params.id, req.body);

      await logAuditAction('POLICY_UPDATED', 'policy', req.params.id, req.session.userId, 'ADMIN', previousState, updated, req);

      res.json(updated);
    } catch (error: any) {
      console.error("Failed to update policy:", error);
      res.status(400).json({ message: error.message || "Failed to update policy" });
    }
  });

  app.get("/api/admin/ads/terms", requireAdmin, async (req: Request, res: Response) => {
    try {
      const terms = await adsStorage.getAllAdvertisingTerms();
      res.json(terms);
    } catch (error: any) {
      console.error("Failed to get terms:", error);
      res.status(500).json({ message: "Failed to get terms" });
    }
  });

  app.post("/api/admin/ads/terms", requireAdmin, async (req: Request, res: Response) => {
    try {
      const terms = await adsStorage.createAdvertisingTerms({
        ...req.body,
        createdById: req.session.userId,
      });

      await logAuditAction('TERMS_CREATED', 'terms', terms.id, req.session.userId, 'ADMIN', null, terms, req);

      res.status(201).json(terms);
    } catch (error: any) {
      console.error("Failed to create terms:", error);
      res.status(400).json({ message: error.message || "Failed to create terms" });
    }
  });

  app.post("/api/admin/ads/terms/:id/activate", requireAdmin, async (req: Request, res: Response) => {
    try {
      await adsStorage.setActiveTerms(req.params.id);

      await logAuditAction('TERMS_ACTIVATED', 'terms', req.params.id, req.session.userId, 'ADMIN', null, null, req);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to activate terms:", error);
      res.status(400).json({ message: error.message || "Failed to activate terms" });
    }
  });

  // ===== ADMIN: AUDIT LOGS =====

  app.get("/api/admin/ads/audit-logs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const advertiserId = req.query.advertiserId as string;
      const action = req.query.action as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await adsStorage.getAdAuditLogs({ advertiserId, action, limit, offset });
      res.json(result);
    } catch (error: any) {
      console.error("Failed to get audit logs:", error);
      res.status(500).json({ message: "Failed to get audit logs" });
    }
  });

  // ===== ADMIN: SYSTEM SETTINGS =====

  app.get("/api/admin/ads/settings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const settings = await adsStorage.getAllSystemSettings(category);
      res.json(settings);
    } catch (error: any) {
      console.error("Failed to get settings:", error);
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  app.put("/api/admin/ads/settings/:key", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { value, description } = req.body;

      const previous = await adsStorage.getSystemSetting(req.params.key);
      const updated = await adsStorage.updateSystemSetting(req.params.key, value, req.session.userId!, description);

      await logAuditAction('SETTING_UPDATED', 'setting', req.params.key, req.session.userId, 'ADMIN', previous, updated, req);

      res.json(updated);
    } catch (error: any) {
      console.error("Failed to update setting:", error);
      res.status(400).json({ message: error.message || "Failed to update setting" });
    }
  });

  // ===== ADDITIONAL ADMIN ACTIONS =====

  app.get("/api/admin/ads/all", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { ads } = await adsStorage.getAllAds({ limit: 1000 });
      res.json(ads);
    } catch (error: any) {
      console.error("Failed to get all ads:", error);
      res.status(500).json({ message: "Failed to get ads" });
    }
  });

  app.post("/api/admin/ads/:id/approve", requireAdmin, async (req: Request, res: Response) => {
    try {
      // FIX 8: Enhanced logging for debugging
      console.log(`[Ad Approval] Starting approval for ad ${req.params.id}`);
      
      const ad = await adsStorage.getAdById(req.params.id);
      if (!ad) {
        console.log(`[Ad Approval] Ad ${req.params.id} not found`);
        return res.status(404).json({ message: "Ad not found" });
      }
      
      console.log(`[Ad Approval] Found ad ${ad.adNumber || ad.id}, current status: ${ad.status}, campaignId: ${ad.campaignId}`);
      
      const updated = await adsStorage.updateAd(ad.id, {
        status: 'APPROVED',
        reviewedById: req.session.userId,
        reviewedAt: new Date()
      });
      
      console.log(`[Ad Approval] Ad ${ad.adNumber || ad.id} status updated to APPROVED`);
      await logAuditAction('AD_APPROVED', 'ad', ad.id, req.session.userId, 'ADMIN', { status: ad.status }, updated, req);
      
      // CRITICAL: Activate the campaign when ad is approved - include ALL non-terminal statuses
      const campaign = await adsStorage.getCampaignById(ad.campaignId);
      console.log(`[Ad Approval] Campaign ${ad.campaignId} current status: ${campaign?.status || 'NOT_FOUND'}`);
      
      const terminalStatuses = ['ACTIVE', 'PAUSED', 'COMPLETED', 'DISABLED', 'ARCHIVED'];
      if (campaign && !terminalStatuses.includes(campaign.status)) {
        const previousStatus = campaign.status;
        await adsStorage.updateCampaign(campaign.id, { status: 'ACTIVE' });
        console.log(`[Ad Approval] SUCCESS: Campaign ${campaign.id} activated (was ${previousStatus}) after ad ${ad.adNumber || ad.id} approval`);
        await logAuditAction('CAMPAIGN_ACTIVATED', 'campaign', campaign.id, req.session.userId, 'ADMIN', 
          { status: previousStatus }, 
          { status: 'ACTIVE' }, 
          req
        );
      } else if (campaign) {
        console.log(`[Ad Approval] Campaign ${campaign.id} in terminal status ${campaign.status}, not activating`);
      } else {
        console.log(`[Ad Approval] WARNING: Campaign ${ad.campaignId} not found for ad ${ad.adNumber || ad.id}`);
      }
      
      // Return the updated ad with campaign status for debugging
      const updatedCampaign = await adsStorage.getCampaignById(ad.campaignId);
      res.json({
        ...updated,
        campaignStatus: updatedCampaign?.status,
        debug: {
          adApproved: true,
          campaignActivated: updatedCampaign?.status === 'ACTIVE',
          previousCampaignStatus: campaign?.status,
        }
      });
    } catch (error: any) {
      console.error("Failed to approve ad:", error);
      res.status(500).json({ message: "Failed to approve ad" });
    }
  });

  app.post("/api/admin/ads/:id/reject", requireAdmin, async (req: Request, res: Response) => {
    try {
      const ad = await adsStorage.getAdById(req.params.id);
      if (!ad) {
        return res.status(404).json({ message: "Ad not found" });
      }
      
      const { reason } = req.body;
      
      const updated = await adsStorage.updateAd(ad.id, {
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedById: req.session.userId,
        reviewedAt: new Date()
      });
      
      await logAuditAction('AD_REJECTED', 'ad', ad.id, req.session.userId, 'ADMIN', { status: ad.status }, updated, req);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Failed to reject ad:", error);
      res.status(500).json({ message: "Failed to reject ad" });
    }
  });

  // Fix orphaned ads - approved ads with non-ACTIVE campaigns
  app.post("/api/admin/ads/fix-orphaned", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Find all approved ads
      const { ads: allAds } = await adsStorage.getAllAds({ status: 'APPROVED', limit: 1000 });
      
      const fixedCampaigns: string[] = [];
      const issues: { adNumber: string; adId: string; campaignId: string; campaignStatus: string; fixed: boolean }[] = [];
      
      // Terminal statuses that should NOT be changed
      const terminalStatuses = ['ACTIVE', 'PAUSED', 'COMPLETED', 'DISABLED', 'ARCHIVED'];
      
      for (const ad of allAds) {
        const campaign = await adsStorage.getCampaignById(ad.campaignId);
        if (campaign && !terminalStatuses.includes(campaign.status)) {
          const previousStatus = campaign.status;
          issues.push({
            adNumber: ad.adNumber || 'N/A',
            adId: ad.id,
            campaignId: campaign.id,
            campaignStatus: previousStatus,
            fixed: true,
          });
          
          // Fix by activating the campaign
          await adsStorage.updateCampaign(campaign.id, { status: 'ACTIVE' });
          fixedCampaigns.push(campaign.id);
          
          console.log(`[Fix Orphaned] Activated campaign ${campaign.id} (was ${previousStatus}) for approved ad ${ad.adNumber || ad.id}`);
          await logAuditAction('CAMPAIGN_ACTIVATED', 'campaign', campaign.id, req.session.userId, 'ADMIN', 
            { status: previousStatus }, 
            { status: 'ACTIVE' }, 
            req
          );
        } else if (campaign && campaign.status !== 'ACTIVE') {
          // Campaign is in a terminal but non-active state (PAUSED, COMPLETED, etc.)
          issues.push({
            adNumber: ad.adNumber || 'N/A',
            adId: ad.id,
            campaignId: campaign.id,
            campaignStatus: campaign.status,
            fixed: false,
          });
        }
      }
      
      res.json({
        message: `Fixed ${fixedCampaigns.length} orphaned campaigns`,
        fixed: fixedCampaigns,
        issues,
        totalApprovedAds: allAds.length,
      });
    } catch (error: any) {
      console.error("Failed to fix orphaned ads:", error);
      res.status(500).json({ message: "Failed to fix orphaned ads" });
    }
  });

  // Fix upfront deductions - refund campaigns that were incorrectly charged upfront
  app.post("/api/admin/ads/fix-wallet-deductions", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get all campaigns and their associated wallets
      const campaigns = await db.select().from(adCampaigns).orderBy(desc(adCampaigns.createdAt));
      
      const fixes: { campaignId: string; advertiserId: string; amount: number; reason: string }[] = [];
      
      for (const campaign of campaigns) {
        // For each campaign, check if budget was deducted upfront but not spent
        const budgetAmount = campaign.budgetAmount || 0;
        const budgetSpent = campaign.budgetSpent || 0;
        
        if (budgetAmount > 0 && budgetSpent === 0) {
          // Campaign has budget but nothing spent - likely deducted upfront
          const wallet = await db.select().from(adWalletAccounts)
            .where(eq(adWalletAccounts.advertiserId, campaign.advertiserId))
            .limit(1);
            
          if (wallet.length > 0) {
            // Refund the budget amount to the wallet
            await db.update(adWalletAccounts)
              .set({ 
                balance: sql`COALESCE(${adWalletAccounts.balance}, 0) + ${budgetAmount}`,
                updatedAt: new Date()
              })
              .where(eq(adWalletAccounts.id, wallet[0].id));
            
            // Log the refund
            await adsStorage.createWalletTransaction({
              walletId: wallet[0].id,
              type: 'REFUND',
              amount: budgetAmount,
              balanceBefore: wallet[0].balance || 0,
              balanceAfter: (wallet[0].balance || 0) + budgetAmount,
              status: 'COMPLETED',
              description: `Refund for upfront deduction - Campaign ${campaign.name?.substring(0, 30)}`,
              campaignId: campaign.id,
              completedAt: new Date(),
            });
            
            fixes.push({
              campaignId: campaign.id,
              advertiserId: campaign.advertiserId,
              amount: budgetAmount,
              reason: 'Refunded upfront deduction'
            });
          }
        }
      }
      
      // Also fix any ad groups that are in DRAFT status
      const draftAdGroups = await db.select().from(adGroups).where(eq(adGroups.status, 'DRAFT'));
      const activatedAdGroups: string[] = [];
      
      for (const group of draftAdGroups) {
        // Check if the campaign is active
        const campaign = campaigns.find(c => c.id === group.campaignId);
        if (campaign && campaign.status === 'ACTIVE') {
          await db.update(adGroups)
            .set({ status: 'ACTIVE', updatedAt: new Date() })
            .where(eq(adGroups.id, group.id));
          activatedAdGroups.push(group.id);
        }
      }
      
      res.json({
        message: `Fixed ${fixes.length} wallet deductions, activated ${activatedAdGroups.length} ad groups`,
        walletFixes: fixes,
        activatedAdGroups,
      });
    } catch (error: any) {
      console.error("Failed to fix wallet deductions:", error);
      res.status(500).json({ message: "Failed to fix wallet deductions" });
    }
  });

  app.post("/api/admin/ads/advertisers/:id/suspend", requireAdmin, async (req: Request, res: Response) => {
    try {
      const advertiser = await adsStorage.getAdvertiserById(req.params.id);
      if (!advertiser) {
        return res.status(404).json({ message: "Advertiser not found" });
      }
      
      const updated = await adsStorage.updateAdvertiser(advertiser.id, {
        status: 'SUSPENDED'
      });
      
      await logAuditAction('ADVERTISER_SUSPENDED', 'advertiser', advertiser.id, req.session.userId, 'ADMIN', { status: advertiser.status }, updated, req);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Failed to suspend advertiser:", error);
      res.status(500).json({ message: "Failed to suspend advertiser" });
    }
  });

  app.post("/api/admin/ads/advertisers/:id/activate", requireAdmin, async (req: Request, res: Response) => {
    try {
      const advertiser = await adsStorage.getAdvertiserById(req.params.id);
      if (!advertiser) {
        return res.status(404).json({ message: "Advertiser not found" });
      }
      
      const updated = await adsStorage.updateAdvertiser(advertiser.id, {
        status: 'ACTIVE'
      });
      
      await logAuditAction('ADVERTISER_ACTIVATED', 'advertiser', advertiser.id, req.session.userId, 'ADMIN', { status: advertiser.status }, updated, req);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Failed to activate advertiser:", error);
      res.status(500).json({ message: "Failed to activate advertiser" });
    }
  });

  app.post("/api/admin/ads/campaigns/:id/pause", requireAdmin, async (req: Request, res: Response) => {
    try {
      const campaign = await adsStorage.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      const updated = await adsStorage.updateCampaign(campaign.id, {
        status: 'PAUSED'
      });
      
      await logAuditAction('CAMPAIGN_PAUSED', 'campaign', campaign.id, req.session.userId, 'ADMIN', { status: campaign.status }, updated, req);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Failed to pause campaign:", error);
      res.status(500).json({ message: "Failed to pause campaign" });
    }
  });

  app.post("/api/admin/ads/campaigns/:id/resume", requireAdmin, async (req: Request, res: Response) => {
    try {
      const campaign = await adsStorage.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      const updated = await adsStorage.updateCampaign(campaign.id, {
        status: 'ACTIVE'
      });
      
      await logAuditAction('CAMPAIGN_RESUMED', 'campaign', campaign.id, req.session.userId, 'ADMIN', { status: campaign.status }, updated, req);
      
      res.json(updated);
    } catch (error: any) {
      console.error("Failed to resume campaign:", error);
      res.status(500).json({ message: "Failed to resume campaign" });
    }
  });

  // ===== ADMIN: AD EVENTS (Impressions/Clicks/Conversions) =====

  app.get("/api/admin/ads/events", requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const eventType = req.query.eventType as string;
      const campaignId = req.query.campaignId as string;

      let whereClause = undefined;
      if (eventType && campaignId) {
        whereClause = and(eq(adEvents.eventType, eventType as any), eq(adEvents.campaignId, campaignId));
      } else if (eventType) {
        whereClause = eq(adEvents.eventType, eventType as any);
      } else if (campaignId) {
        whereClause = eq(adEvents.campaignId, campaignId);
      }

      const events = await db.select().from(adEvents)
        .where(whereClause)
        .orderBy(desc(adEvents.createdAt))
        .limit(limit)
        .offset(offset);

      const stats = await db.select({
        eventType: adEvents.eventType,
        count: sql<number>`count(*)::int`,
        totalCost: sql<number>`COALESCE(sum(${adEvents.costAmount}), 0)::int`,
      })
      .from(adEvents)
      .where(sql`${adEvents.createdAt} > NOW() - INTERVAL '24 hours'`)
      .groupBy(adEvents.eventType);

      res.json({ events, stats, totalCount: events.length });
    } catch (error: any) {
      console.error("Failed to get ad events:", error);
      res.status(500).json({ message: "Failed to get ad events" });
    }
  });

  // ===== ADMIN: WALLET TRANSACTIONS =====

  app.get("/api/admin/ads/transactions", requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const type = req.query.type as string;
      const walletId = req.query.walletId as string;

      let whereClause = undefined;
      if (type) {
        whereClause = eq(adWalletTransactions.type, type as any);
      }
      if (walletId) {
        whereClause = whereClause ? and(whereClause, eq(adWalletTransactions.walletId, walletId)) : eq(adWalletTransactions.walletId, walletId);
      }

      const transactions = await db.select({
        transaction: adWalletTransactions,
        wallet: adWalletAccounts,
        advertiser: advertisers,
      })
      .from(adWalletTransactions)
      .leftJoin(adWalletAccounts, eq(adWalletTransactions.walletId, adWalletAccounts.id))
      .leftJoin(advertisers, eq(adWalletAccounts.advertiserId, advertisers.id))
      .where(whereClause)
      .orderBy(desc(adWalletTransactions.createdAt))
      .limit(limit)
      .offset(offset);

      const summary = await db.select({
        type: adWalletTransactions.type,
        count: sql<number>`count(*)::int`,
        totalAmount: sql<number>`COALESCE(sum(${adWalletTransactions.amount}), 0)::int`,
      })
      .from(adWalletTransactions)
      .where(sql`${adWalletTransactions.createdAt} > NOW() - INTERVAL '24 hours'`)
      .groupBy(adWalletTransactions.type);

      res.json({ transactions, summary, totalCount: transactions.length });
    } catch (error: any) {
      console.error("Failed to get wallet transactions:", error);
      res.status(500).json({ message: "Failed to get wallet transactions" });
    }
  });

  // ===== ADMIN: BOOST CAMPAIGNS =====

  app.get("/api/admin/ads/boost-campaigns", requireAdmin, async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string;
      const limit = parseInt(req.query.limit as string) || 50;

      let whereClause = eq(adCampaigns.objective, 'BOOST_POST');
      if (status) {
        whereClause = and(whereClause, eq(adCampaigns.status, status as any)) as any;
      }

      const campaigns = await db.select({
        campaign: adCampaigns,
        advertiser: advertisers,
      })
      .from(adCampaigns)
      .leftJoin(advertisers, eq(adCampaigns.advertiserId, advertisers.id))
      .where(whereClause)
      .orderBy(desc(adCampaigns.createdAt))
      .limit(limit);

      const stats = await db.select({
        status: adCampaigns.status,
        count: sql<number>`count(*)::int`,
        totalBudget: sql<number>`COALESCE(sum(${adCampaigns.budgetAmount}), 0)::int`,
      })
      .from(adCampaigns)
      .where(eq(adCampaigns.objective, 'BOOST_POST'))
      .groupBy(adCampaigns.status);

      res.json({ campaigns, stats, totalCount: campaigns.length });
    } catch (error: any) {
      console.error("Failed to get boost campaigns:", error);
      res.status(500).json({ message: "Failed to get boost campaigns" });
    }
  });

  // ===== ADMIN: FEATURE CONTROLS =====

  app.get("/api/admin/ads/feature-controls", requireAdmin, async (req: Request, res: Response) => {
    try {
      const controls = [
        {
          key: 'ads_self_engagement_prevention',
          name: 'Self-Engagement Prevention',
          description: 'Prevents advertisers from counting their own impressions, clicks, and engagements',
          defaultValue: true,
        },
        {
          key: 'ads_boost_post_enabled',
          name: 'Boost Post Feature',
          description: 'Allows users to boost their posts as ads',
          defaultValue: true,
        },
        {
          key: 'ads_auto_pause_low_balance',
          name: 'Auto-Pause on Low Balance',
          description: 'Automatically pauses campaigns when wallet balance is insufficient',
          defaultValue: true,
        },
        {
          key: 'ads_refund_on_rejection',
          name: 'Refund on Ad Rejection',
          description: 'Automatically refunds budget when ads are rejected',
          defaultValue: true,
        },
      ];

      const settings = await Promise.all(
        controls.map(async (control) => {
          const setting = await adsStorage.getSystemSetting(control.key);
          return {
            ...control,
            enabled: setting ? setting.value === true || setting.value === 'true' : control.defaultValue,
            updatedAt: setting?.updatedAt,
          };
        })
      );

      res.json(settings);
    } catch (error: any) {
      console.error("Failed to get feature controls:", error);
      res.status(500).json({ message: "Failed to get feature controls" });
    }
  });

  app.put("/api/admin/ads/feature-controls/:key", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { enabled } = req.body;
      const key = req.params.key;

      const validKeys = [
        'ads_self_engagement_prevention',
        'ads_boost_post_enabled',
        'ads_auto_pause_low_balance',
        'ads_refund_on_rejection',
      ];

      if (!validKeys.includes(key)) {
        return res.status(400).json({ message: "Invalid feature control key" });
      }

      const previous = await adsStorage.getSystemSetting(key);
      const updated = await adsStorage.updateSystemSetting(key, enabled, req.session.userId!, `Feature control: ${key}`);

      await logAuditAction('FEATURE_CONTROL_UPDATED', 'setting', key, req.session.userId, 'ADMIN', 
        { enabled: previous?.value }, 
        { enabled: updated.value }, 
        req
      );

      res.json({ key, enabled: updated.value, updatedAt: updated.updatedAt });
    } catch (error: any) {
      console.error("Failed to update feature control:", error);
      res.status(400).json({ message: error.message || "Failed to update feature control" });
    }
  });

  // ===== ADMIN: REFUND HISTORY =====

  app.get("/api/admin/ads/refunds", requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;

      const refunds = await db.select({
        transaction: adWalletTransactions,
        wallet: adWalletAccounts,
        advertiser: advertisers,
      })
      .from(adWalletTransactions)
      .leftJoin(adWalletAccounts, eq(adWalletTransactions.walletId, adWalletAccounts.id))
      .leftJoin(advertisers, eq(adWalletAccounts.advertiserId, advertisers.id))
      .where(eq(adWalletTransactions.type, 'REFUND'))
      .orderBy(desc(adWalletTransactions.createdAt))
      .limit(limit);

      const totalRefunded = await db.select({
        count: sql<number>`count(*)::int`,
        totalAmount: sql<number>`COALESCE(sum(${adWalletTransactions.amount}), 0)::int`,
      })
      .from(adWalletTransactions)
      .where(eq(adWalletTransactions.type, 'REFUND'));

      res.json({ 
        refunds, 
        summary: totalRefunded[0] || { count: 0, totalAmount: 0 }
      });
    } catch (error: any) {
      console.error("Failed to get refunds:", error);
      res.status(500).json({ message: "Failed to get refunds" });
    }
  });

  // ===== ADMIN: END CAMPAIGN (COMPLETE) =====
  app.post("/api/admin/ads/campaigns/:id/end", requireAdmin, async (req: Request, res: Response) => {
    try {
      const campaign = await adsStorage.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      const updated = await adsStorage.updateCampaign(campaign.id, {
        status: 'COMPLETED',
        endDate: new Date()
      });
      
      if (!updated) {
        return res.status(500).json({ message: "Failed to update campaign" });
      }
      
      await logAuditAction('CAMPAIGN_ENDED', 'campaign', campaign.id, req.session.userId, 'ADMIN', 
        { status: campaign.status, endDate: campaign.endDate }, 
        { status: 'COMPLETED', endDate: updated.endDate }, 
        req
      );
      
      res.json({ message: "Campaign ended successfully", campaign: updated });
    } catch (error: any) {
      console.error("Failed to end campaign:", error);
      res.status(500).json({ message: "Failed to end campaign" });
    }
  });

  // ===== ADMIN: DELETE CAMPAIGN =====
  app.delete("/api/admin/ads/campaigns/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const campaign = await adsStorage.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Archive instead of delete to preserve audit trail
      const updated = await adsStorage.updateCampaign(campaign.id, {
        status: 'ARCHIVED'
      });
      
      await logAuditAction('CAMPAIGN_DELETED', 'campaign', campaign.id, req.session.userId, 'ADMIN', 
        campaign, 
        { status: 'ARCHIVED' }, 
        req
      );
      
      res.json({ message: "Campaign archived successfully" });
    } catch (error: any) {
      console.error("Failed to delete campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // ===== ADMIN: FULL WALLET REFUND =====
  app.post("/api/admin/ads/wallets/:id/refund", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { amount, reason } = req.body;
      
      const [wallet] = await db.select().from(adWalletAccounts).where(eq(adWalletAccounts.id, req.params.id));
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const refundAmount = amount || wallet.lifetimeSpend || 0;
      if (refundAmount <= 0) {
        return res.status(400).json({ message: "No amount to refund" });
      }
      
      const balanceBefore = wallet.balance || 0;
      const newBalance = balanceBefore + refundAmount;
      
      await db.update(adWalletAccounts)
        .set({ 
          balance: newBalance,
          updatedAt: new Date()
        })
        .where(eq(adWalletAccounts.id, wallet.id));
      
      await db.insert(adWalletTransactions).values({
        walletId: wallet.id,
        type: "REFUND",
        amount: refundAmount,
        balanceBefore,
        balanceAfter: newBalance,
        status: "COMPLETED",
        description: reason || "Admin refund",
        metadata: { adminUserId: req.session.userId, reason }
      });
      
      await logAuditAction('WALLET_REFUND', 'wallet', wallet.id, req.session.userId, 'ADMIN', 
        { balance: balanceBefore }, 
        { balance: newBalance, refundAmount }, 
        req
      );
      
      // Send notification to advertiser
      await sendAdNotification(wallet.advertiserId, 'AD_REFUND_PROCESSED', wallet.id);
      
      res.json({ message: "Refund processed successfully", refundAmount, newBalance });
    } catch (error: any) {
      console.error("Failed to process refund:", error);
      res.status(500).json({ message: "Failed to process refund" });
    }
  });

  // ===== ADMIN: CONVERT AD WALLET BALANCE TO RABIT COINS =====
  app.post("/api/admin/ads/wallets/:id/convert-to-coins", requireAdmin, async (req: Request, res: Response) => {
    try {
      const [wallet] = await db.select().from(adWalletAccounts).where(eq(adWalletAccounts.id, req.params.id));
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      const balanceToConvert = wallet.balance || 0;
      if (balanceToConvert <= 0) {
        return res.status(400).json({ message: "No balance to convert" });
      }
      
      // Get advertiser and their user
      const [advertiser] = await db.select().from(advertisers).where(eq(advertisers.id, wallet.advertiserId));
      if (!advertiser) {
        return res.status(404).json({ message: "Advertiser not found" });
      }
      
      // Add to user's Rabit Coin wallet (1:1 conversion)
      const { wallets } = await import("@shared/schema");
      let [userWallet] = await db.select().from(wallets).where(eq(wallets.userId, advertiser.userId));
      if (!userWallet) {
        [userWallet] = await db.insert(wallets).values({
          userId: advertiser.userId,
          coinBalance: 0,
          lifetimeEarned: 0,
          lifetimeSpent: 0
        }).returning();
      }
      
      await db.update(wallets).set({
        coinBalance: (userWallet.coinBalance || 0) + balanceToConvert,
        lifetimeEarned: (userWallet.lifetimeEarned || 0) + balanceToConvert,
        updatedAt: new Date()
      }).where(eq(wallets.id, userWallet.id));
      
      // Deduct from ad wallet
      await db.update(adWalletAccounts)
        .set({ 
          balance: 0,
          updatedAt: new Date()
        })
        .where(eq(adWalletAccounts.id, wallet.id));
      
      await db.insert(adWalletTransactions).values({
        walletId: wallet.id,
        type: "ADJUSTMENT",
        amount: -balanceToConvert,
        balanceBefore: balanceToConvert,
        balanceAfter: 0,
        status: "COMPLETED",
        description: "Converted to Rabit Coins",
        metadata: { adminUserId: req.session.userId, coinsReceived: balanceToConvert }
      });
      
      await logAuditAction('WALLET_CONVERTED_TO_COINS', 'wallet', wallet.id, req.session.userId, 'ADMIN', 
        { adWalletBalance: balanceToConvert }, 
        { coinsReceived: balanceToConvert }, 
        req
      );
      
      res.json({ 
        message: "Balance converted to Rabit Coins successfully", 
        convertedAmount: balanceToConvert,
        newCoinBalance: (userWallet.coinBalance || 0) + balanceToConvert
      });
    } catch (error: any) {
      console.error("Failed to convert to coins:", error);
      res.status(500).json({ message: "Failed to convert to coins" });
    }
  });

  // ===== ADMIN: PLATFORM REVENUE STATS =====
  app.get("/api/admin/ads/revenue", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      const { adsEngine } = await import("./ads-engine");
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const revenue = await adsEngine.getPlatformRevenue(start, end);
      
      // Also get daily breakdown for last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dailyStats = await db.select({
        date: sql<string>`DATE(${adWalletTransactions.createdAt})`,
        spend: sql<number>`COALESCE(SUM(ABS(${adWalletTransactions.amount})), 0)::int`,
        transactions: sql<number>`COUNT(*)::int`,
      })
      .from(adWalletTransactions)
      .where(and(
        eq(adWalletTransactions.type, 'AD_SPEND'),
        gte(adWalletTransactions.createdAt, thirtyDaysAgo)
      ))
      .groupBy(sql`DATE(${adWalletTransactions.createdAt})`)
      .orderBy(sql`DATE(${adWalletTransactions.createdAt})`);
      
      res.json({ revenue, dailyStats });
    } catch (error: any) {
      console.error("Failed to get revenue stats:", error);
      res.status(500).json({ message: "Failed to get revenue stats" });
    }
  });

  // ===== ADMIN: DELIVERY HEALTH - ZERO DELIVERY CAMPAIGNS =====
  app.get("/api/admin/ads/delivery-health", requireAdmin, async (req: Request, res: Response) => {
    try {
      const hoursThreshold = parseInt(req.query.hours as string) || 24;
      const { adsEngine } = await import("./ads-engine");
      
      const zeroDeliveryCampaigns = await adsEngine.getZeroDeliveryCampaigns(hoursThreshold);
      
      // Get campaigns with very low delivery relative to budget
      const lowDeliveryCampaigns = await db.select()
        .from(adCampaigns)
        .where(
          and(
            eq(adCampaigns.status, 'ACTIVE'),
            sql`${adCampaigns.budgetSpent} < (${adCampaigns.budgetAmount} * 0.1)`,
            sql`${adCampaigns.createdAt} < NOW() - INTERVAL '48 hours'`
          )
        );
      
      res.json({ 
        zeroDelivery: zeroDeliveryCampaigns,
        lowDelivery: lowDeliveryCampaigns,
        threshold: hoursThreshold
      });
    } catch (error: any) {
      console.error("Failed to get delivery health:", error);
      res.status(500).json({ message: "Failed to get delivery health" });
    }
  });

  // ===== ADMIN: TRIGGER AUTO-EXPIRE CAMPAIGNS =====
  app.post("/api/admin/ads/expire-campaigns", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { adsEngine } = await import("./ads-engine");
      const result = await adsEngine.expireEndedCampaigns();
      
      await logAuditAction('CAMPAIGNS_AUTO_EXPIRED', 'system', 'batch', req.session.userId, 'ADMIN', 
        null, 
        { expired: result.expired, campaigns: result.details }, 
        req
      );
      
      res.json({ 
        message: `Expired ${result.expired} campaigns`, 
        expired: result.expired,
        details: result.details
      });
    } catch (error: any) {
      console.error("Failed to expire campaigns:", error);
      res.status(500).json({ message: "Failed to expire campaigns" });
    }
  });

  // ===== ADMIN: EMERGENCY PAUSE ALL ADS PLATFORM-WIDE =====
  app.post("/api/admin/ads/emergency-pause", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { pause, reason } = req.body;
      
      // Update all active campaigns to paused (or vice versa)
      if (pause) {
        const pausedCampaigns = await db.update(adCampaigns)
          .set({ 
            status: 'PAUSED',
            updatedAt: new Date(),
            metadata: sql`COALESCE(${adCampaigns.metadata}, '{}')::jsonb || '{"emergencyPaused": true}'::jsonb`
          })
          .where(eq(adCampaigns.status, 'ACTIVE'))
          .returning();
        
        await logAuditAction('EMERGENCY_PAUSE_ALL', 'system', 'all_ads', req.session.userId, 'ADMIN', 
          null, 
          { paused: pausedCampaigns.length, reason }, 
          req
        );
        
        res.json({ message: `Emergency paused ${pausedCampaigns.length} campaigns`, count: pausedCampaigns.length });
      } else {
        // Resume only emergency-paused campaigns
        const resumedCampaigns = await db.update(adCampaigns)
          .set({ 
            status: 'ACTIVE',
            updatedAt: new Date(),
            metadata: sql`COALESCE(${adCampaigns.metadata}, '{}')::jsonb - 'emergencyPaused'`
          })
          .where(
            and(
              eq(adCampaigns.status, 'PAUSED'),
              sql`COALESCE(${adCampaigns.metadata}, '{}')::jsonb->>'emergencyPaused' = 'true'`
            )
          )
          .returning();
        
        await logAuditAction('EMERGENCY_RESUME_ALL', 'system', 'all_ads', req.session.userId, 'ADMIN', 
          null, 
          { resumed: resumedCampaigns.length, reason }, 
          req
        );
        
        res.json({ message: `Resumed ${resumedCampaigns.length} emergency-paused campaigns`, count: resumedCampaigns.length });
      }
    } catch (error: any) {
      console.error("Failed emergency pause/resume:", error);
      res.status(500).json({ message: "Failed to execute emergency action" });
    }
  });

  // ===== ADMIN: CAMPAIGN DETAILS WITH FULL STATS =====
  app.get("/api/admin/ads/campaigns/:id/details", requireAdmin, async (req: Request, res: Response) => {
    try {
      const campaign = await adsStorage.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Get advertiser info
      const [advertiser] = await db.select().from(advertisers).where(eq(advertisers.id, campaign.advertiserId));
      
      // Get wallet info
      let wallet = null;
      if (advertiser) {
        const [w] = await db.select().from(adWalletAccounts).where(eq(adWalletAccounts.advertiserId, advertiser.id));
        wallet = w;
      }
      
      // Get all ads in this campaign
      const campaignAds = await db.select()
        .from(ads)
        .leftJoin(adGroups, eq(ads.adGroupId, adGroups.id))
        .where(eq(adGroups.campaignId, campaign.id));
      
      // Get recent events
      const recentEvents = await db.select()
        .from(adEvents)
        .where(eq(adEvents.campaignId, campaign.id))
        .orderBy(desc(adEvents.createdAt))
        .limit(50);
      
      // Get total spend for this campaign
      const spendStats = await db.select({
        totalSpend: sql<number>`COALESCE(SUM(ABS(${adWalletTransactions.amount})), 0)::int`,
        transactionCount: sql<number>`COUNT(*)::int`,
      })
      .from(adWalletTransactions)
      .where(eq(adWalletTransactions.campaignId, campaign.id));
      
      res.json({ 
        campaign,
        advertiser,
        wallet,
        ads: campaignAds,
        recentEvents,
        spendStats: spendStats[0] || { totalSpend: 0, transactionCount: 0 }
      });
    } catch (error: any) {
      console.error("Failed to get campaign details:", error);
      res.status(500).json({ message: "Failed to get campaign details" });
    }
  });

  // ===== ADMIN: EDIT CAMPAIGN =====
  app.patch("/api/admin/ads/campaigns/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const campaign = await adsStorage.getCampaignById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      const { name, budgetAmount, budgetType, startDate, endDate, status } = req.body;
      
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (budgetAmount !== undefined) updates.budgetAmount = budgetAmount;
      if (budgetType !== undefined) updates.budgetType = budgetType;
      if (startDate !== undefined) updates.startDate = new Date(startDate);
      if (endDate !== undefined) updates.endDate = new Date(endDate);
      if (status !== undefined) updates.status = status;
      
      const updated = await adsStorage.updateCampaign(campaign.id, updates);
      
      await logAuditAction('CAMPAIGN_EDITED', 'campaign', campaign.id, req.session.userId, 'ADMIN', 
        campaign, 
        updated, 
        req
      );
      
      res.json({ message: "Campaign updated successfully", campaign: updated });
    } catch (error: any) {
      console.error("Failed to update campaign:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  });

  // ===== DISPUTE SYSTEM =====
  
  // Create a dispute (advertiser)
  app.post("/api/advertising/disputes", requireAuth, async (req: Request, res: Response) => {
    try {
      const { campaignId, disputeType, subject, description, requestedRefundAmount } = req.body;
      
      // Get advertiser account
      const [advertiser] = await db.select().from(advertisers).where(eq(advertisers.userId, req.session.userId!));
      if (!advertiser) {
        return res.status(403).json({ message: "No advertiser account found" });
      }
      
      // Validate campaign belongs to advertiser if provided
      if (campaignId) {
        const campaign = await adsStorage.getCampaignById(campaignId);
        if (!campaign || campaign.advertiserId !== advertiser.id) {
          return res.status(400).json({ message: "Invalid campaign" });
        }
      }
      
      const [dispute] = await db.insert(adDisputes).values({
        advertiserId: advertiser.id,
        campaignId,
        disputeType: disputeType || 'OTHER',
        subject: subject || 'Dispute',
        description: description || '',
        requestedRefundAmount: requestedRefundAmount ? Math.round(requestedRefundAmount) : null,
      }).returning();
      
      res.json({ message: "Dispute submitted successfully", dispute });
    } catch (error: any) {
      console.error("Failed to create dispute:", error);
      res.status(500).json({ message: "Failed to submit dispute" });
    }
  });

  // Get advertiser's disputes
  app.get("/api/advertising/disputes", requireAuth, async (req: Request, res: Response) => {
    try {
      const [advertiser] = await db.select().from(advertisers).where(eq(advertisers.userId, req.session.userId!));
      if (!advertiser) {
        return res.status(403).json({ message: "No advertiser account found" });
      }
      
      const disputes = await db.select()
        .from(adDisputes)
        .where(eq(adDisputes.advertiserId, advertiser.id))
        .orderBy(desc(adDisputes.createdAt));
      
      res.json({ disputes });
    } catch (error: any) {
      console.error("Failed to get disputes:", error);
      res.status(500).json({ message: "Failed to get disputes" });
    }
  });

  // Cancel a dispute (advertiser)
  app.post("/api/advertising/disputes/:id/cancel", requireAuth, async (req: Request, res: Response) => {
    try {
      const [advertiser] = await db.select().from(advertisers).where(eq(advertisers.userId, req.session.userId!));
      if (!advertiser) {
        return res.status(403).json({ message: "No advertiser account found" });
      }
      
      const [dispute] = await db.select().from(adDisputes).where(eq(adDisputes.id, req.params.id));
      if (!dispute || dispute.advertiserId !== advertiser.id) {
        return res.status(404).json({ message: "Dispute not found" });
      }
      
      if (dispute.status !== 'PENDING' && dispute.status !== 'UNDER_REVIEW') {
        return res.status(400).json({ message: "Cannot cancel resolved dispute" });
      }
      
      await db.update(adDisputes).set({ status: 'CANCELLED', updatedAt: new Date() }).where(eq(adDisputes.id, req.params.id));
      
      res.json({ message: "Dispute cancelled" });
    } catch (error: any) {
      console.error("Failed to cancel dispute:", error);
      res.status(500).json({ message: "Failed to cancel dispute" });
    }
  });

  // ===== ADMIN DISPUTE MANAGEMENT =====

  // Get all disputes (admin)
  app.get("/api/admin/ads/disputes", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      
      let query = db.select({
        dispute: adDisputes,
        advertiser: advertisers,
        campaign: adCampaigns,
      })
      .from(adDisputes)
      .leftJoin(advertisers, eq(adDisputes.advertiserId, advertisers.id))
      .leftJoin(adCampaigns, eq(adDisputes.campaignId, adCampaigns.id))
      .orderBy(desc(adDisputes.createdAt));
      
      const allDisputes = await query;
      
      // Filter by status if provided
      const disputes = status 
        ? allDisputes.filter(d => d.dispute.status === status)
        : allDisputes;
      
      // Get stats
      const pendingCount = allDisputes.filter(d => d.dispute.status === 'PENDING').length;
      const underReviewCount = allDisputes.filter(d => d.dispute.status === 'UNDER_REVIEW').length;
      const resolvedCount = allDisputes.filter(d => d.dispute.status === 'RESOLVED_APPROVED' || d.dispute.status === 'RESOLVED_DENIED').length;
      
      res.json({ 
        disputes,
        stats: { pendingCount, underReviewCount, resolvedCount, totalCount: allDisputes.length }
      });
    } catch (error: any) {
      console.error("Failed to get disputes:", error);
      res.status(500).json({ message: "Failed to get disputes" });
    }
  });

  // Start reviewing a dispute (admin)
  app.post("/api/admin/ads/disputes/:id/review", requireAdmin, async (req: Request, res: Response) => {
    try {
      const [dispute] = await db.select().from(adDisputes).where(eq(adDisputes.id, req.params.id));
      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }
      
      await db.update(adDisputes).set({ 
        status: 'UNDER_REVIEW', 
        updatedAt: new Date() 
      }).where(eq(adDisputes.id, req.params.id));
      
      res.json({ message: "Dispute marked as under review" });
    } catch (error: any) {
      console.error("Failed to update dispute:", error);
      res.status(500).json({ message: "Failed to update dispute" });
    }
  });

  // Resolve a dispute (admin)
  app.post("/api/admin/ads/disputes/:id/resolve", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { approved, adminResponse, refundAmount } = req.body;
      
      const [dispute] = await db.select().from(adDisputes).where(eq(adDisputes.id, req.params.id));
      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }
      
      // If approved and refund requested, process it
      if (approved && refundAmount && refundAmount > 0) {
        const [wallet] = await db.select().from(adWalletAccounts).where(eq(adWalletAccounts.advertiserId, dispute.advertiserId));
        if (wallet) {
          const balanceBefore = wallet.balance || 0;
          const newBalance = balanceBefore + refundAmount;
          
          // Credit the refund
          await db.update(adWalletAccounts).set({
            balance: newBalance,
            lifetimeRefunds: (wallet.lifetimeRefunds || 0) + refundAmount,
            updatedAt: new Date()
          }).where(eq(adWalletAccounts.id, wallet.id));
          
          // Log the transaction
          await db.insert(adWalletTransactions).values({
            walletId: wallet.id,
            type: 'REFUND',
            amount: refundAmount,
            balanceBefore,
            balanceAfter: newBalance,
            status: 'COMPLETED',
            description: `Dispute refund: ${dispute.subject}`,
            campaignId: dispute.campaignId,
          });
        }
      }
      
      await db.update(adDisputes).set({ 
        status: approved ? 'RESOLVED_APPROVED' : 'RESOLVED_DENIED',
        adminResponse: adminResponse || null,
        approvedRefundAmount: approved && refundAmount ? refundAmount : null,
        resolvedBy: req.session.userId,
        resolvedAt: new Date(),
        updatedAt: new Date() 
      }).where(eq(adDisputes.id, req.params.id));
      
      await logAuditAction('DISPUTE_RESOLVED', 'dispute', dispute.id, req.session.userId, 'ADMIN', 
        dispute, 
        { approved, refundAmount, adminResponse }, 
        req
      );
      
      // Send notification to advertiser
      await sendAdNotification(dispute.advertiserId, 'AD_DISPUTE_RESOLVED', dispute.id);
      
      res.json({ message: `Dispute ${approved ? 'approved' : 'denied'}` });
    } catch (error: any) {
      console.error("Failed to resolve dispute:", error);
      res.status(500).json({ message: "Failed to resolve dispute" });
    }
  });
}
