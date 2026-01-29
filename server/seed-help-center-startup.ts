import { pool } from './db';
import crypto from 'crypto';

export async function seedHelpCenterOnStartup() {
  console.log('[Help Center] Starting seed check...');
  
  const client = await pool.connect();
  try {
    // First, clean up any stuck transactions
    try {
      await client.query('ROLLBACK');
    } catch (e) { /* no transaction to rollback is fine */ }
    
    // Check if help_categories table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'help_categories'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('[Help Center] Tables do not exist yet - skipping seed (will run after schema push)');
      return;
    }
    
    // Check current content state
    const catCount = await client.query(`SELECT COUNT(*) FROM help_categories WHERE is_active = true`);
    const artCount = await client.query(`SELECT COUNT(*) FROM help_articles WHERE status = 'PUBLISHED'`);
    const faqCount = await client.query(`SELECT COUNT(*) FROM help_faqs WHERE is_active = true`);
    
    const categories = parseInt(catCount.rows[0].count);
    const articles = parseInt(artCount.rows[0].count);
    const faqs = parseInt(faqCount.rows[0].count);
    
    console.log(`[Help Center] Current state: ${categories} categories, ${articles} articles, ${faqs} FAQs`);
    
    // Only skip if we have substantial content in all three areas
    if (categories >= 10 && articles >= 50 && faqs >= 20) {
      console.log('[Help Center] Content already seeded - skipping');
      return;
    }
    
    console.log('[Help Center] Content incomplete - starting comprehensive seed...');
    
    // NO transaction - use individual inserts with ON CONFLICT for safety
    // This is more resilient to partial failures
    
    // Clear existing partial data (one by one, ignore errors)
    try { await client.query(`DELETE FROM help_article_feedback`); } catch (e) { console.log('[Help Center] Skipping help_article_feedback clear'); }
    try { await client.query(`DELETE FROM help_search_history`); } catch (e) { console.log('[Help Center] Skipping help_search_history clear'); }
    try { await client.query(`DELETE FROM help_articles`); } catch (e) { console.log('[Help Center] Skipping help_articles clear'); }
    try { await client.query(`DELETE FROM help_categories`); } catch (e) { console.log('[Help Center] Skipping help_categories clear'); }
    try { await client.query(`DELETE FROM help_faqs`); } catch (e) { console.log('[Help Center] Skipping help_faqs clear'); }
    try { await client.query(`DELETE FROM help_changelogs`); } catch (e) { console.log('[Help Center] Skipping help_changelogs clear'); }
    try { await client.query(`DELETE FROM help_featured_articles`); } catch (e) { console.log('[Help Center] Skipping help_featured_articles clear'); }
    
    console.log('[Help Center] Cleared existing content, inserting new...');
    
    // ===========================================
    // CATEGORIES (15 main categories)
    // ===========================================
    const categoryData = [
      { id: 'getting-started', name: 'Getting Started', slug: 'getting-started', description: 'New to RabitChat? Start here for the basics', icon: 'play-circle', color: '#8B5CF6', sortOrder: 1 },
      { id: 'account-profile', name: 'Account & Profile', slug: 'account-profile', description: 'Manage your account settings, profile, and privacy', icon: 'user', color: '#3B82F6', sortOrder: 2 },
      { id: 'messaging', name: 'Messaging', slug: 'messaging', description: 'Direct messages, group chats, voice notes, and video calls', icon: 'message-circle', color: '#14B8A6', sortOrder: 3 },
      { id: 'social-features', name: 'Social Features', slug: 'social-features', description: 'Posts, stories, reels, following, and engagement', icon: 'users', color: '#EC4899', sortOrder: 4 },
      { id: 'rabit-coins', name: 'Rabit Coins & Gifts', slug: 'rabit-coins', description: 'Virtual currency, gifting, earning, and staking', icon: 'gift', color: '#F59E0B', sortOrder: 5 },
      { id: 'mall-shopping', name: 'Luxury Mall', slug: 'mall-shopping', description: 'Browse and purchase from our premium marketplace with 500+ products', icon: 'shopping-bag', color: '#10B981', sortOrder: 6 },
      { id: 'gossip-anonymous', name: 'Anonymous Gossip', slug: 'gossip-anonymous', description: 'Zero-identity gossip system (South Africa only)', icon: 'eye-off', color: '#EF4444', sortOrder: 7 },
      { id: 'camera-media', name: 'Camera & Media', slug: 'camera-media', description: 'Photo filters, stickers, drawing, video editing, and effects', icon: 'camera', color: '#A855F7', sortOrder: 8 },
      { id: 'safety-privacy', name: 'Safety & Privacy', slug: 'safety-privacy', description: 'Protect your account, block users, and stay safe', icon: 'shield', color: '#6366F1', sortOrder: 9 },
      { id: 'technical', name: 'Technical Support', slug: 'technical', description: 'App issues, bugs, performance, and troubleshooting', icon: 'tool', color: '#64748B', sortOrder: 10 },
      { id: 'payments', name: 'Payments & Withdrawals', slug: 'payments', description: 'Buy coins, withdraw earnings, KYC, and billing', icon: 'credit-card', color: '#0EA5E9', sortOrder: 11 },
      { id: 'interests-discovery', name: 'Interests & Discovery', slug: 'interests-discovery', description: 'Personalize your feed with 15 luxury interest categories', icon: 'compass', color: '#F97316', sortOrder: 12 },
      { id: 'live-streaming', name: 'Live Streaming', slug: 'live-streaming', description: 'Go live, host streams, and interact with viewers', icon: 'video', color: '#DC2626', sortOrder: 13 },
      { id: 'groups-events', name: 'Groups & Events', slug: 'groups-events', description: 'Create groups, join communities, and attend events', icon: 'calendar', color: '#7C3AED', sortOrder: 14 },
      { id: 'creator-monetization', name: 'Creator Monetization', slug: 'creator-monetization', description: 'Earn money, creator dashboard, and withdrawal setup', icon: 'dollar-sign', color: '#059669', sortOrder: 15 },
    ];

    for (const cat of categoryData) {
      await client.query(
        `INSERT INTO help_categories (id, name, slug, description, icon, color, sort_order, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET name = $2, description = $4, is_active = true`,
        [cat.id, cat.name, cat.slug, cat.description, cat.icon, cat.color, cat.sortOrder]
      );
    }
    console.log(`[Help Center] Inserted ${categoryData.length} categories`);

    // ===========================================
    // ARTICLES (Comprehensive coverage)
    // ===========================================
    const articleData = [
      // Getting Started
      { categoryId: 'getting-started', title: 'Welcome to RabitChat', slug: 'welcome-to-rabitchat', summary: 'Your introduction to the elite social network', difficulty: 'BEGINNER', readTime: 3, content: `Welcome to RabitChat - the Forbes-style social network celebrating wealth and influence.\n\nWhat is RabitChat?\n\nRabitChat is a luxury social platform designed for high-net-worth individuals and influencers. Unlike other social networks, we celebrate success and provide exclusive features for our elite community.\n\nKey Features:\n\n• Net Worth Display - Show your financial achievements\n• Rabit Coins - Our virtual currency for gifts and purchases\n• Luxury Mall - 500+ premium products to boost your net worth\n• Anonymous Gossip - Share and discover secrets (SA only)\n• Wealth Clubs - Bronze, Silver, Gold, Platinum, and Diamond tiers\n• Live Streaming - Go live and receive gifts from fans\n\nGetting Started:\n\n1. Complete your profile with a photo and bio\n2. Set your net worth tier during onboarding\n3. Follow suggested users based on your interests\n4. Start posting and engaging with the community\n\nWelcome to the elite.` },
      
      { categoryId: 'getting-started', title: 'Creating Your Account', slug: 'creating-your-account', summary: 'Step-by-step guide to signing up', difficulty: 'BEGINNER', readTime: 2, content: `How to Create Your RabitChat Account\n\n1. Download the App\n   • Available on iOS App Store and Google Play\n   • Search "RabitChat" and tap Install\n\n2. Sign Up\n   • Open the app and tap "Create Account"\n   • Enter your email address\n   • Create a secure password (8+ characters)\n   • Verify your email with the code we send\n\n3. Complete Onboarding\n   • Select your interests (15 luxury categories)\n   • Choose your industry/profession\n   • Set your net worth tier\n   • Configure privacy settings\n   • Follow suggested users\n\n4. Set Up Your Profile\n   • Add a profile photo\n   • Write a bio (up to 500 characters)\n   • Add your location (optional)\n   • Link other social accounts\n\nYour account is now ready to use!` },
      
      { categoryId: 'getting-started', title: 'Navigating the App', slug: 'navigating-the-app', summary: 'Understanding the main tabs and features', difficulty: 'BEGINNER', readTime: 4, content: `Understanding RabitChat Navigation\n\nBottom Tab Bar:\n\n1. Home - Your personalized feed showing posts from people you follow\n\n2. Discover - Find new content:\n   • New People - User recommendations\n   • Reels - Short vertical videos\n   • Voices - Audio content\n   • Gossip - Anonymous posts (SA only)\n\n3. Mall - Luxury marketplace:\n   • 500+ premium products\n   • Prices in Rabit Coins\n   • Net worth boost on purchases\n\n4. Messages - Your conversations:\n   • Direct messages\n   • Group chats\n   • Voice notes\n   • Video calls\n\n5. Profile - Your personal space:\n   • View and edit profile\n   • Your posts, stories, reels\n   • Settings and preferences\n   • Wallet and earnings\n\nQuick Actions:\n• Tap the + button to create posts\n• Swipe down to refresh feeds\n• Long-press for additional options` },

      // Rabit Coins (Critical feature)
      { categoryId: 'rabit-coins', title: 'Understanding Rabit Coins', slug: 'understanding-rabit-coins', summary: 'Complete guide to our virtual currency', difficulty: 'BEGINNER', readTime: 5, content: `What Are Rabit Coins?\n\nRabit Coins are RabitChat's virtual currency. They power gifting, purchases, and the creator economy.\n\nHow Coins Work:\n\n• 1 Rand = 1 Rabit Coin (when purchasing)\n• Coins can be earned, bought, or received as gifts\n• Coins convert to net worth through spending\n\nWays to Get Coins:\n\n1. Purchase Bundles:\n   • 100 coins - R10\n   • 500 coins - R45 (10% bonus)\n   • 1,000 coins - R85 (15% bonus)\n   • 5,000 coins - R400 (20% bonus)\n   • 10,000 coins - R750 (25% bonus)\n   • 50,000 coins - R3,500 (43% bonus)\n\n2. Daily Rewards:\n   • Claim free coins daily\n   • Streaks increase rewards\n   • 7-day streak = bonus multiplier\n\n3. Receive Gifts:\n   • When someone gifts you, coins go to your wallet\n   • 50% platform fee on creator withdrawals\n\n4. Creator Earnings:\n   • Go live and receive gifts\n   • Post engaging content\n   • Build your audience\n\nSpending Coins:\n\n• Send gifts to creators and friends\n• Purchase Mall items\n• Stake gifts for returns\n• Join platform battles` },

      { categoryId: 'rabit-coins', title: 'Gift Types Explained', slug: 'gift-types-explained', summary: 'All 8 gift tiers from Rose to Private Jet', difficulty: 'BEGINNER', readTime: 4, content: `RabitChat Gift Types\n\nSend gifts to show appreciation and support creators!\n\nGift Tiers:\n\n1. Rose - 10 coins\n   Perfect for quick appreciation\n   Net worth transfer: 10 coins\n\n2. Heart - 50 coins\n   Show some love\n   Net worth transfer: 50 coins\n\n3. Diamond - 100 coins\n   A sparkling gesture\n   Net worth transfer: 100 coins\n\n4. Crown - 500 coins\n   For royalty moments\n   Net worth transfer: 500 coins\n\n5. Rocket - 1,000 coins\n   Launch their success\n   Net worth transfer: 1,000 coins\n\n6. Mansion - 10,000 coins\n   Ultimate luxury\n   Net worth transfer: 10,000 coins\n\n7. Yacht - 50,000 coins\n   Sailing in style\n   Net worth transfer: 50,000 coins\n\n8. Private Jet - 500,000 coins\n   The ultimate gift\n   Net worth transfer: 500,000 coins\n\nGifts increase both your and the recipient's net worth!` },

      { categoryId: 'rabit-coins', title: 'Buying Coin Bundles', slug: 'buying-coin-bundles', summary: 'How to purchase Rabit Coins', difficulty: 'BEGINNER', readTime: 3, content: `How to Buy Rabit Coins\n\nStep 1: Open Your Wallet\n• Go to Profile → Wallet\n• Tap "Buy Coins"\n\nStep 2: Choose a Bundle\n\nAvailable bundles:\n• 100 coins - R10 (Best for trying out)\n• 500 coins - R45 (10% bonus - 550 total)\n• 1,000 coins - R85 (15% bonus - 1,150 total)\n• 5,000 coins - R400 (20% bonus - 6,000 total)\n• 10,000 coins - R750 (25% bonus - 12,500 total)\n• 50,000 coins - R3,500 (43% bonus - 71,500 total)\n\nStep 3: Complete Payment\n• Secure payment via PayFast\n• Supports credit/debit cards, EFT, SnapScan\n• Coins credited instantly after payment\n\nPayment Security:\n• All transactions encrypted\n• No card details stored\n• Instant purchase confirmation\n\nNote: Coin purchases are final and non-refundable.` },

      { categoryId: 'rabit-coins', title: 'Wealth Clubs Explained', slug: 'wealth-clubs-explained', summary: 'Bronze, Silver, Gold, Platinum, and Diamond tiers', difficulty: 'INTERMEDIATE', readTime: 4, content: `RabitChat Wealth Clubs\n\nYour net worth determines your Wealth Club tier, unlocking exclusive perks!\n\nTiers:\n\n1. Bronze Club\n   • Net Worth: R0 - R99,999\n   • Benefits: Basic features, standard support\n\n2. Silver Club\n   • Net Worth: R100,000 - R499,999\n   • Benefits: Silver badge, priority support, 5% gift bonus\n\n3. Gold Club\n   • Net Worth: R500,000 - R1,999,999\n   • Benefits: Gold badge, exclusive content access, 10% gift bonus\n\n4. Platinum Club\n   • Net Worth: R2,000,000 - R9,999,999\n   • Benefits: Platinum badge, VIP events, 15% gift bonus, dedicated support\n\n5. Diamond Club\n   • Net Worth: R10,000,000+\n   • Benefits: Diamond badge, all perks, 20% gift bonus, personal account manager, exclusive features\n\nHow to Increase Net Worth:\n• Purchase Mall items (10x multiplier)\n• Receive gifts (1x multiplier)\n• Stake gifts for returns\n• Win platform battles` },

      // Messaging
      { categoryId: 'messaging', title: 'Sending Messages', slug: 'sending-messages', summary: 'How to chat with friends and followers', difficulty: 'BEGINNER', readTime: 3, content: `Messaging on RabitChat\n\nStarting a Conversation:\n\n1. Tap the Messages tab\n2. Tap the + button to start new chat\n3. Search for a user\n4. Start typing!\n\nMessage Types:\n\n• Text - Regular messages\n• Photos - Send images from camera or gallery\n• Videos - Share video clips up to 100MB\n• Voice Notes - Hold to record up to 3 minutes\n• Files - Send documents and PDFs\n• Links - Auto-preview with rich cards\n\nMessage Features:\n\n• Reply - Swipe right on a message to reply\n• React - Long-press to add reactions (Like, Love, Laugh, Wow, Sad, Angry)\n• Delete - Delete for yourself or everyone (within 1 hour)\n• Forward - Share messages to other chats\n\nConversation Settings:\n\n• Mute - Silence notifications\n• Pin - Keep at top of list\n• Archive - Hide from main list\n• Custom name - Rename conversations` },

      { categoryId: 'messaging', title: 'Voice Notes', slug: 'voice-notes', summary: 'Recording and listening to voice messages', difficulty: 'BEGINNER', readTime: 2, content: `Voice Notes on RabitChat\n\nRecording Voice Notes:\n\n1. Open a conversation\n2. Hold the microphone button\n3. Speak your message (up to 3 minutes)\n4. Release to send\n\nTips:\n• Swipe left while recording to cancel\n• See waveform visualization as you record\n• Preview before sending (tap and hold, then slide up)\n\nListening to Voice Notes:\n\n• Tap to play\n• Tap again to pause\n• Speed controls: 1x, 1.5x, 2x\n• See waveform and duration\n\nVoice notes are perfect for:\n• Quick responses when typing is inconvenient\n• Adding personality to messages\n• Sharing longer thoughts\n• Sending audio greetings` },

      { categoryId: 'messaging', title: 'Group Chats', slug: 'group-chats', summary: 'Creating and managing group conversations', difficulty: 'BEGINNER', readTime: 3, content: `Group Chats on RabitChat\n\nCreating a Group:\n\n1. Go to Messages\n2. Tap + then "New Group"\n3. Add members (up to 100)\n4. Set group name and photo\n5. Tap "Create"\n\nGroup Admin Features:\n\n• Add/remove members\n• Change group name and photo\n• Set who can send messages\n• Promote members to admin\n• Delete group\n\nGroup Settings:\n\n• Mute notifications\n• Leave group\n• Report group\n• See member list\n\nGroup Etiquette:\n\n• Respect all members\n• Stay on topic\n• Don't spam\n• Be mindful of notification volume` },

      // Mall/Shopping
      { categoryId: 'mall-shopping', title: 'Shopping in the Mall', slug: 'shopping-in-mall', summary: 'Browse and buy luxury items with coins', difficulty: 'BEGINNER', readTime: 4, content: `The RabitChat Luxury Mall\n\nOur marketplace features 500+ premium products across 107 categories!\n\nBrowsing:\n\n• Go to the Mall tab\n• Browse by category\n• Search for specific items\n• Filter by price range\n• Sort by popularity, price, or new\n\nCategories Include:\n\n• Watches & Jewelry\n• Designer Fashion\n• Electronics\n• Art & Collectibles\n• Automotive\n• Real Estate Experiences\n• Travel & Leisure\n• Fine Dining\n• Wellness & Spa\n• And many more!\n\nMaking a Purchase:\n\n1. Find an item you love\n2. Tap to view details\n3. Tap "Buy Now"\n4. Confirm with your wallet\n5. Item added to your collection\n\nNet Worth Boost:\n\nEvery Mall purchase gives you 10x the net worth!\nExample: Buy R1,000 item → Gain R10,000 net worth\n\nThis is the fastest way to climb Wealth Club tiers!` },

      { categoryId: 'mall-shopping', title: 'Net Worth Multiplier', slug: 'net-worth-multiplier', summary: 'How purchases boost your net worth 10x', difficulty: 'BEGINNER', readTime: 2, content: `Net Worth 10x Multiplier\n\nWhen you shop in the Mall, your net worth increases by 10 times the purchase price!\n\nHow It Works:\n\n• Purchase price: 1,000 coins\n• Net worth gained: 10,000\n\nExamples:\n\n• Buy a R500 watch → +R5,000 net worth\n• Buy a R5,000 bag → +R50,000 net worth\n• Buy a R50,000 ring → +R500,000 net worth\n\nWhy 10x?\n\nMall purchases represent luxury lifestyle choices. We reward members who invest in the RabitChat economy with significant net worth boosts.\n\nStrategic Shopping:\n\n• Time purchases around Wealth Club thresholds\n• Combine with daily rewards\n• Stack with event bonuses when available\n\nThis multiplier makes the Mall the fastest path to Diamond Club status!` },

      // Camera & Media
      { categoryId: 'camera-media', title: 'Using Photo Filters', slug: 'using-photo-filters', summary: 'Apply stunning effects to your photos', difficulty: 'BEGINNER', readTime: 3, content: `Photo Filters on RabitChat\n\nMake your photos stand out with our 11 professional filters!\n\nAvailable Filters:\n\n1. Vivid - Enhanced colors and saturation\n2. Warm - Golden, sunny tones\n3. Cool - Blue, crisp tones\n4. Vintage - Retro film look\n5. Noir - Black and white drama\n6. Fade - Soft, muted aesthetic\n7. Chrome - High contrast metallic\n8. Mono - Classic monochrome\n9. Tonal - Subtle color grading\n10. Transfer - Cross-processed look\n11. Instant - Polaroid style\n\nHow to Apply:\n\n1. Take or select a photo\n2. Tap the filters icon\n3. Scroll through options\n4. Tap to preview\n5. Adjust intensity with slider\n6. Save or post\n\nFilters work on:\n• New photos from camera\n• Gallery images\n• Story and post content` },

      { categoryId: 'camera-media', title: 'Adding Stickers', slug: 'adding-stickers', summary: 'Decorate photos with drag-and-resize stickers', difficulty: 'BEGINNER', readTime: 2, content: `Stickers on RabitChat\n\nAdd fun elements to your photos and stories!\n\nSticker Categories:\n\n• Emotes - Expressions and emotions\n• Reactions - Love, fire, celebration\n• Decorative - Frames, borders, sparkles\n• Text - Stylized text overlays\n\nHow to Use:\n\n1. Take or select a photo\n2. Tap the sticker icon\n3. Browse categories\n4. Tap to add sticker\n5. Drag to position\n6. Pinch to resize\n7. Two-finger rotate\n\nTips:\n\n• Layer multiple stickers\n• Use stickers to highlight key elements\n• Match stickers to your photo mood\n• Remove by dragging to trash icon` },

      { categoryId: 'camera-media', title: 'Drawing on Photos', slug: 'drawing-on-photos', summary: 'Freehand drawing with colors and brushes', difficulty: 'BEGINNER', readTime: 2, content: `Drawing Tool on RabitChat\n\nAdd personal touches with freehand drawing!\n\nFeatures:\n\n• Full color palette\n• Multiple brush sizes\n• Eraser tool\n• Undo/redo buttons\n\nHow to Draw:\n\n1. Open photo in editor\n2. Tap the pencil icon\n3. Select a color\n4. Choose brush size\n5. Draw with your finger\n6. Tap undo if needed\n7. Save when done\n\nIdeas:\n\n• Highlight important elements\n• Add arrows or circles\n• Write messages\n• Create artistic effects\n• Sign your photos\n\nThe drawing layer saves separately, so you can edit or remove it later!` },

      // Safety & Privacy
      { categoryId: 'safety-privacy', title: 'Blocking Users', slug: 'blocking-users', summary: 'How to block and unblock accounts', difficulty: 'BEGINNER', readTime: 2, content: `Blocking Users on RabitChat\n\nIf someone is bothering you, block them.\n\nTo Block:\n\n1. Go to their profile\n2. Tap the three dots menu\n3. Select "Block"\n4. Confirm\n\nWhat Blocking Does:\n\n• They can't see your profile\n• They can't message you\n• They can't see your posts\n• They won't appear in your feeds\n• They won't be notified\n\nTo Unblock:\n\n1. Go to Settings\n2. Tap "Blocked Accounts"\n3. Find the user\n4. Tap "Unblock"\n\nNote: If you unblock someone, they won't automatically follow you again. You'll both need to re-follow if desired.\n\nBlocking is private - the person won't know they're blocked.` },

      { categoryId: 'safety-privacy', title: 'Reporting Content', slug: 'reporting-content', summary: 'Report inappropriate posts, messages, or users', difficulty: 'BEGINNER', readTime: 2, content: `Reporting on RabitChat\n\nHelp keep our community safe by reporting violations.\n\nWhat to Report:\n\n• Harassment or bullying\n• Hate speech\n• Nudity or sexual content\n• Violence or threats\n• Spam or scams\n• Impersonation\n• Intellectual property violations\n\nHow to Report a Post:\n\n1. Tap the three dots on the post\n2. Select "Report"\n3. Choose a reason\n4. Add details (optional)\n5. Submit\n\nHow to Report a User:\n\n1. Go to their profile\n2. Tap the three dots\n3. Select "Report User"\n4. Follow the prompts\n\nWhat Happens Next:\n\n• Our team reviews within 24 hours\n• Violating content is removed\n• Repeat offenders are banned\n• You may receive a follow-up\n\nReports are confidential.` },

      { categoryId: 'safety-privacy', title: 'Privacy Settings', slug: 'privacy-settings', summary: 'Control who sees your content and information', difficulty: 'BEGINNER', readTime: 3, content: `Privacy Settings on RabitChat\n\nYou control who sees what.\n\nProfile Privacy:\n\n• Public - Anyone can see your profile\n• Private - Only approved followers see posts\n• Net Worth Visible - Show or hide your net worth\n• Activity Status - Show when you're online\n\nContent Privacy:\n\n• Post Visibility - Public, Followers, or Close Friends\n• Story Visibility - Same options\n• Allow Comments - Everyone, Followers, or Off\n• Allow Messages - Everyone, Followers, or Off\n\nDiscoverability:\n\n• Appear in Suggestions - Be recommended to others\n• Searchable - Found in user search\n• Show in Wealth Rankings - Appear on leaderboards\n\nTo Access:\n\n1. Go to Profile\n2. Tap Settings\n3. Select "Privacy"\n4. Adjust your preferences\n\nChanges take effect immediately.` },

      // Gossip
      { categoryId: 'gossip-anonymous', title: 'How Anonymous Gossip Works', slug: 'how-gossip-works', summary: 'Zero-identity gossip in South Africa', difficulty: 'BEGINNER', readTime: 4, content: `Anonymous Gossip on RabitChat\n\nShare and discover secrets completely anonymously!\n\nAvailability:\n\n• South Africa only (GPS verified)\n• No account linking\n• Zero identity tracking\n\nHow It Works:\n\n1. Go to Discover → Gossip\n2. Tap + to post anonymously\n3. Write your gossip\n4. Select location (city/province)\n5. Post!\n\nFeatures:\n\n• Tea Meter - Measures how "hot" the gossip is\n• Animated Reactions - Express yourself\n• Location-Based - See gossip from your area\n• 24-Hour Whisper Mode - Auto-deletes\n\nAnonymity Guarantee:\n\n• No username attached\n• No profile link\n• No IP tracking\n• Encrypted content\n\nRules:\n\n• No illegal content\n• No doxxing\n• No threats\n• No harassment\n\nViolations are removed; severe cases reported to authorities.` },

      // Live Streaming
      { categoryId: 'live-streaming', title: 'Going Live', slug: 'going-live', summary: 'Start your first live stream', difficulty: 'INTERMEDIATE', readTime: 4, content: `Live Streaming on RabitChat\n\nConnect with your audience in real-time!\n\nStarting a Live:\n\n1. Tap the + button\n2. Select "Go Live"\n3. Add a title\n4. Choose a category\n5. Tap "Start Stream"\n\nDuring Your Stream:\n\n• See viewer count\n• Read live comments\n• Receive gifts in real-time\n• Use filters and effects\n• Invite guests to co-host\n\nEarning From Lives:\n\n• Gifts convert to coins in your wallet\n• 50% platform fee on withdrawals\n• Higher tiers earn better splits\n• Regular streaming builds audience\n\nTips for Success:\n\n• Announce streams in advance\n• Have good lighting\n• Engage with comments\n• Thank gift senders\n• Stream consistently\n• Minimum 15 minutes recommended\n\nEnding:\n\nTap "End Stream" → See summary of gifts received, viewer peak, and duration.` },

      // Payments
      { categoryId: 'payments', title: 'Withdrawing Earnings', slug: 'withdrawing-earnings', summary: 'How to cash out your Rabit Coins', difficulty: 'INTERMEDIATE', readTime: 4, content: `Withdrawing Your Earnings\n\nConvert Rabit Coins to real money!\n\nRequirements:\n\n1. Complete KYC verification\n2. Link a South African bank account\n3. Minimum 1,000 coins to withdraw\n\nKYC Process:\n\n• ID document upload\n• Selfie verification\n• Address confirmation\n• Usually approved within 24-48 hours\n\nLinking Bank Account:\n\n1. Go to Profile → Wallet\n2. Tap "Withdrawal Settings"\n3. Enter bank details\n4. Verify with test deposit\n\nMaking a Withdrawal:\n\n1. Go to Wallet\n2. Tap "Withdraw"\n3. Enter amount\n4. Confirm details\n5. Submit request\n\nFees:\n\n• 50% platform fee on creator earnings\n• Standard: 3-5 business days\n• Express (coming soon): 24 hours\n\nCompliance:\n\n• All withdrawals comply with POPIA\n• FICA verification required\n• Tax reporting as required by SARS` },

      // Interests & Discovery
      { categoryId: 'interests-discovery', title: '15 Interest Categories', slug: 'interest-categories', summary: 'Luxury lifestyle categories for feed personalization', difficulty: 'BEGINNER', readTime: 3, content: `RabitChat Interest Categories\n\nPersonalize your feed with 15 luxury lifestyle categories!\n\n1. Luxury Lifestyle - High-end living, exclusive experiences\n2. Investments - Stocks, property, portfolios\n3. Real Estate - Mansions, penthouses, property\n4. Yachts & Aviation - Boats, jets, travel\n5. Fine Dining - Michelin stars, exclusive restaurants\n6. Fashion - Designer brands, couture\n7. Art & Collectibles - Fine art, rare items\n8. Exotic Cars - Supercars, classics, motorsport\n9. Watches & Jewelry - Timepieces, gems\n10. Tech & Innovation - Gadgets, startups\n11. Wellness & Spa - Health, retreats\n12. Entertainment - Parties, events, nightlife\n13. Sports & Fitness - Golf, polo, training\n14. Philanthropy - Charity, giving back\n15. Crypto & NFTs - Digital assets, blockchain\n\nHow to Select:\n\n• During onboarding, or\n• Settings → Interests\n• Select at least 3\n• Update anytime\n\nYour interests influence:\n• Feed algorithm\n• User suggestions\n• Content recommendations` },

      // Groups & Events
      { categoryId: 'groups-events', title: 'Creating Groups', slug: 'creating-groups', summary: 'Build communities around shared interests', difficulty: 'INTERMEDIATE', readTime: 3, content: `Creating Groups on RabitChat\n\nBuild communities around shared interests!\n\nTo Create a Group:\n\n1. Go to Discover → Groups\n2. Tap "Create Group"\n3. Set name and description\n4. Choose privacy (Public/Private)\n5. Select category\n6. Add cover photo\n7. Invite initial members\n8. Tap "Create"\n\nGroup Types:\n\n• Public - Anyone can join and see posts\n• Private - Approval required, posts hidden\n• Secret - Invite only, not searchable\n\nAdmin Tools:\n\n• Accept/reject join requests\n• Remove members\n• Promote moderators\n• Edit group settings\n• Pin announcements\n• Set posting rules\n\nGroup Features:\n\n• Discussion posts\n• Events\n• Media sharing\n• Member directory\n• Group chat\n\nTips:\n\n• Clear rules increase engagement\n• Regular posts keep groups active\n• Promote trusted members to moderators` },

      { categoryId: 'groups-events', title: 'Attending Events', slug: 'attending-events', summary: 'Discover and join exclusive events', difficulty: 'BEGINNER', readTime: 2, content: `Events on RabitChat\n\nDiscover and attend exclusive gatherings!\n\nFinding Events:\n\n1. Go to Discover → Events\n2. Browse upcoming events\n3. Filter by category, date, location\n4. Tap to view details\n\nEvent Types:\n\n• Virtual - Online streams and meetups\n• In-Person - Real world gatherings\n• Hybrid - Both options\n\nJoining an Event:\n\n1. Tap "Interested" or "Going"\n2. Add to calendar\n3. Receive reminders\n4. Join when it starts\n\nCreating Events:\n\n1. Tap "Create Event"\n2. Set details\n3. Choose privacy\n4. Invite people\n5. Publish\n\nEvent Features:\n\n• RSVP tracking\n• Discussion wall\n• Photo sharing\n• Check-in on arrival` },

      // Creator Monetization
      { categoryId: 'creator-monetization', title: 'Creator Dashboard', slug: 'creator-dashboard', summary: 'Track your earnings and analytics', difficulty: 'INTERMEDIATE', readTime: 3, content: `Creator Dashboard\n\nTrack your RabitChat earnings and performance!\n\nAccessing Dashboard:\n\n1. Go to Profile\n2. Tap "Creator Dashboard"\n\nMetrics Shown:\n\n• Total Earnings - Lifetime coins received\n• This Month - Current month earnings\n• Available Balance - Ready to withdraw\n• Pending - Processing withdrawals\n\nAnalytics:\n\n• Gift breakdown by type\n• Top supporters\n• Best performing content\n• Viewer demographics\n• Growth trends\n\nEarnings Sources:\n\n• Live stream gifts\n• Post gifts\n• Story tips\n• Subscription payments\n\nWithdrawal Status:\n\n• See pending requests\n• Track approval status\n• View payout history\n\nGrowth Tips:\n\n• Check what content earns most\n• Double down on successful formats\n• Engage your top supporters` },

      { categoryId: 'creator-monetization', title: 'Maximizing Earnings', slug: 'maximizing-earnings', summary: 'Tips to grow your income', difficulty: 'INTERMEDIATE', readTime: 4, content: `Maximizing Your RabitChat Earnings\n\nStrategies to grow your income!\n\nContent Strategy:\n\n1. Post Consistently\n   • Daily posts get more engagement\n   • Schedule content in advance\n   • Mix content types (posts, stories, reels, live)\n\n2. Go Live Regularly\n   • Live streams earn the most gifts\n   • Schedule weekly streams\n   • Announce in advance\n\n3. Engage Your Audience\n   • Reply to comments\n   • Thank gift senders\n   • Build genuine relationships\n\n4. Create Gift-Worthy Moments\n   • Celebrations and milestones\n   • Q&A sessions\n   • Exclusive content reveals\n\n5. Collaborate\n   • Team up with other creators\n   • Cross-promote audiences\n   • Join platform battles\n\nAnalytics Tips:\n\n• Check your best posting times\n• See which content earns most\n• Double down on what works\n\nRemember: Authentic connection beats aggressive monetization every time.` },

      // Technical Support
      { categoryId: 'technical', title: 'App Not Loading', slug: 'app-not-loading', summary: 'Troubleshooting when the app won\'t start', difficulty: 'BEGINNER', readTime: 2, content: `App Not Loading?\n\nTry these steps:\n\n1. Check Internet Connection\n   • Test with other apps\n   • Try WiFi and mobile data\n   • Reset router if needed\n\n2. Force Close and Restart\n   • Swipe up to close app completely\n   • Wait 10 seconds\n   • Open again\n\n3. Clear Cache\n   • iOS: Offload app in Settings\n   • Android: Settings → Apps → RabitChat → Clear Cache\n\n4. Update the App\n   • Check App Store/Play Store\n   • Install latest version\n\n5. Check Device Storage\n   • Free up space if low\n   • At least 500MB recommended\n\n6. Restart Device\n   • Power off completely\n   • Wait 30 seconds\n   • Power on\n\nStill not working?\n\nContact support with:\n• Device model\n• OS version\n• Error message (if any)\n• When the issue started` },

      { categoryId: 'technical', title: 'Connection Issues', slug: 'connection-issues', summary: 'Fixing API and server connection problems', difficulty: 'INTERMEDIATE', readTime: 3, content: `Connection Issues\n\nIf you see "Connection Issue" or API errors:\n\n1. Check Your Internet\n   • Open a web browser\n   • Test loading a website\n   • Try different WiFi network\n\n2. Check RabitChat Status\n   • Visit our status page\n   • Check @RabitChat on social media\n   • Server issues are usually resolved quickly\n\n3. Retry Connection\n   • Tap "Retry Connection" button\n   • Wait 30 seconds between attempts\n   • Try 3-5 times\n\n4. Check App Version\n   • Older versions may have connectivity issues\n   • Update to latest from app store\n\n5. VPN Issues\n   • Disable VPN temporarily\n   • Some VPNs block our servers\n\n6. Firewall/Network Restrictions\n   • Corporate networks may block apps\n   • Try on mobile data instead\n\nIf Problem Persists:\n\nTake a screenshot of the error and contact support with details about when it started and what you were doing.` },

      // Account & Profile
      { categoryId: 'account-profile', title: 'Editing Your Profile', slug: 'editing-profile', summary: 'Update your photo, bio, and settings', difficulty: 'BEGINNER', readTime: 2, content: `Editing Your Profile\n\nMake your profile stand out!\n\nTo Edit:\n\n1. Go to Profile tab\n2. Tap "Edit Profile"\n\nWhat You Can Change:\n\n• Profile Photo - Tap to upload new image\n• Cover Photo - The banner at top\n• Display Name - Your visible name\n• Username - Your @handle\n• Bio - Up to 500 characters\n• Location - City or country\n• Website - Link to your site\n• Industry - Your profession\n\nProfile Tips:\n\n• Use a clear, recent photo\n• Write an engaging bio\n• Include your achievements\n• Add relevant hashtags\n• Keep information current\n\nVerification:\n\nVerified badges are available for:\n• Public figures\n• Brands\n• High-net-worth individuals\n\nApply through Settings → Verification.` },

      { categoryId: 'account-profile', title: 'Changing Password', slug: 'changing-password', summary: 'How to update your account password', difficulty: 'BEGINNER', readTime: 2, content: `Changing Your Password\n\nKeep your account secure!\n\nTo Change:\n\n1. Go to Profile → Settings\n2. Tap "Security"\n3. Tap "Change Password"\n4. Enter current password\n5. Enter new password\n6. Confirm new password\n7. Tap "Save"\n\nPassword Requirements:\n\n• At least 8 characters\n• Mix of letters and numbers\n• Special character recommended\n• Don't reuse old passwords\n\nForgot Password?\n\n1. On login screen, tap "Forgot Password"\n2. Enter your email\n3. Check for reset link\n4. Create new password\n\nSecurity Tips:\n\n• Use unique password for RabitChat\n• Enable two-factor authentication\n• Don't share password with anyone\n• Update password every 6 months` },

      // Social Features
      { categoryId: 'social-features', title: 'Creating Posts', slug: 'creating-posts', summary: 'Share content with your followers', difficulty: 'BEGINNER', readTime: 3, content: `Creating Posts on RabitChat\n\nShare with your audience!\n\nTo Create a Post:\n\n1. Tap the + button (bottom center)\n2. Choose post type:\n   • Text - Write your thoughts\n   • Photo - Share images\n   • Video - Upload clips\n   • Voice - Record audio\n3. Add your content\n4. Add caption, location, tags\n5. Set visibility (Public/Followers/Close Friends)\n6. Tap "Post"\n\nPost Features:\n\n• Filters - Enhance photos\n• Stickers - Add decorations\n• Tags - Mention other users\n• Location - Tag where you are\n• Hashtags - Join conversations\n\nAfter Posting:\n\n• Track likes and comments\n• See who shared\n• Receive notifications\n• Edit caption anytime\n• Delete if needed\n\nTips:\n\n• Best times: Morning and evening\n• Use relevant hashtags\n• Engage with comments\n• Post consistently` },

      { categoryId: 'social-features', title: 'Stories', slug: 'stories', summary: 'Share moments that disappear in 24 hours', difficulty: 'BEGINNER', readTime: 2, content: `Stories on RabitChat\n\n24-hour content for quick sharing!\n\nCreating Stories:\n\n1. Tap your profile picture with + icon\n2. Take photo/video or choose from gallery\n3. Add filters, stickers, text\n4. Tap "Share to Story"\n\nStory Features:\n\n• Multiple slides - Add several moments\n• Music - Add background tracks\n• Polls - Get audience feedback\n• Questions - Let followers ask you\n• Countdowns - Build anticipation\n• Links - Swipe-up for verified users\n\nViewing Stories:\n\n• Tap profile pictures at top of feed\n• Tap to advance, swipe for next person\n• Reply by swiping up\n• React with quick emojis\n\nStory Settings:\n\n• Hide from specific people\n• Allow/disable replies\n• Save to highlights\n• Share to feed as post\n\nStories auto-delete after 24 hours unless saved to Highlights.` },

      { categoryId: 'social-features', title: 'Following and Followers', slug: 'following-followers', summary: 'Build your network on RabitChat', difficulty: 'BEGINNER', readTime: 2, content: `Following on RabitChat\n\nBuild your network!\n\nTo Follow Someone:\n\n1. Find their profile\n2. Tap "Follow"\n3. For private accounts, request to follow\n\nFollower Types:\n\n• Regular Followers - See your public posts\n• Close Friends - See exclusive content\n• Pending - Waiting for approval\n\nManaging Followers:\n\n• View follower list on profile\n• Remove followers if needed\n• Block to prevent re-following\n\nFollowing Feed:\n\n• Posts from people you follow\n• Sorted by algorithm\n• Toggle to "Latest" for chronological\n\nGrowing Followers:\n\n• Post quality content consistently\n• Engage with your niche community\n• Use relevant hashtags\n• Collaborate with others\n• Go live regularly\n\nQuality > Quantity\n\nEngaged followers matter more than total count!` },
    ];

    for (const article of articleData) {
      await client.query(
        `INSERT INTO help_articles (id, category_id, title, slug, summary, content, difficulty, status, estimated_read_time, view_count, helpful_count, published_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'PUBLISHED', $8, $9, $10, NOW(), NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET title = $3, content = $6, status = 'PUBLISHED'`,
        [
          crypto.randomUUID(),
          article.categoryId,
          article.title,
          article.slug,
          article.summary,
          article.content,
          article.difficulty,
          article.readTime,
          Math.floor(Math.random() * 15000) + 1000,
          Math.floor(Math.random() * 900) + 100
        ]
      );
    }
    console.log(`[Help Center] Inserted ${articleData.length} articles`);

    // ===========================================
    // FAQs (30 comprehensive questions)
    // ===========================================
    const faqData = [
      { question: 'How do I create an account on RabitChat?', answer: 'Download RabitChat from the App Store or Google Play, tap "Sign Up", enter your email and create a password. Then complete the 7-step onboarding process which includes selecting your interests, industry, net worth tier, privacy preferences, and following suggested users.', category: 'getting-started', sortOrder: 1 },
      { question: 'Is RabitChat free to use?', answer: 'Yes! RabitChat is completely free to download and use. You can create posts, follow users, message friends, and access most features at no cost. Optional paid features include purchasing Rabit Coins for gifts and Mall purchases.', category: 'getting-started', sortOrder: 2 },
      { question: 'What are Rabit Coins?', answer: 'Rabit Coins are our virtual currency. You can buy them in bundles (100 coins = R10), earn them through daily rewards and receiving gifts, or win them in battles. Use coins to send gifts to creators, buy Mall items, and stake for returns.', category: 'rabit-coins', sortOrder: 3 },
      { question: 'How do I buy Rabit Coins?', answer: 'Go to Profile → Wallet → Buy Coins. Choose a bundle (100 to 50,000 coins), complete secure payment via PayFast using card, EFT, or SnapScan. Coins are credited instantly after payment.', category: 'rabit-coins', sortOrder: 4 },
      { question: 'What are Wealth Clubs?', answer: 'Wealth Clubs are tiers based on your net worth: Bronze (R0-99K), Silver (R100K-499K), Gold (R500K-1.9M), Platinum (R2M-9.9M), Diamond (R10M+). Higher tiers unlock exclusive perks, gift bonuses, and premium features.', category: 'rabit-coins', sortOrder: 5 },
      { question: 'How does the 10x net worth multiplier work?', answer: 'When you purchase items from the Luxury Mall, your net worth increases by 10 times the purchase price. Buy a R1,000 item = gain R10,000 net worth. This is the fastest way to climb Wealth Club tiers!', category: 'mall-shopping', sortOrder: 6 },
      { question: 'How do I send gifts?', answer: 'Open any post, story, or live stream, tap the gift icon, choose from 8 gift types (Rose 10 coins to Private Jet 500,000 coins), and send! Gifts add to both your and the recipient\'s net worth.', category: 'rabit-coins', sortOrder: 7 },
      { question: 'Can I withdraw my earnings?', answer: 'Yes! Complete KYC verification (ID + selfie + address), link a South African bank account, and request withdrawal of 1,000+ coins. Processing takes 3-5 business days with a 50% platform fee on creator earnings.', category: 'payments', sortOrder: 8 },
      { question: 'What is Anonymous Gossip?', answer: 'Our zero-identity gossip feature (South Africa only) lets you post and read anonymous content without any account linking. GPS verified, 24-hour auto-delete option, and complete anonymity guaranteed.', category: 'gossip-anonymous', sortOrder: 9 },
      { question: 'How do I go live?', answer: 'Tap the + button, select "Go Live", add a title, choose category, and start streaming! Viewers can send gifts in real-time. End the stream to see your earnings summary.', category: 'live-streaming', sortOrder: 10 },
      { question: 'How do I block someone?', answer: 'Go to their profile, tap the three dots menu, select "Block", and confirm. They can\'t see your profile, message you, or appear in your feeds. They won\'t be notified.', category: 'safety-privacy', sortOrder: 11 },
      { question: 'How do I report inappropriate content?', answer: 'Tap the three dots on any post, select "Report", choose a reason, add details if needed, and submit. Our team reviews reports within 24 hours. Reports are confidential.', category: 'safety-privacy', sortOrder: 12 },
      { question: 'What photo filters are available?', answer: 'We offer 11 professional filters: Vivid, Warm, Cool, Vintage, Noir, Fade, Chrome, Mono, Tonal, Transfer, and Instant. Apply in the camera or photo editor, adjust intensity, and save!', category: 'camera-media', sortOrder: 13 },
      { question: 'How do voice notes work?', answer: 'In any chat, hold the microphone button to record (up to 3 minutes), release to send. Listen with 1x, 1.5x, or 2x speed. Swipe left while recording to cancel.', category: 'messaging', sortOrder: 14 },
      { question: 'Can I create group chats?', answer: 'Yes! Go to Messages, tap +, select "New Group", add up to 100 members, set a name and photo, and create. Admins can manage members and settings.', category: 'messaging', sortOrder: 15 },
      { question: 'What are the 15 interest categories?', answer: 'Luxury Lifestyle, Investments, Real Estate, Yachts & Aviation, Fine Dining, Fashion, Art & Collectibles, Exotic Cars, Watches & Jewelry, Tech & Innovation, Wellness & Spa, Entertainment, Sports & Fitness, Philanthropy, and Crypto & NFTs.', category: 'interests-discovery', sortOrder: 16 },
      { question: 'How do I change my password?', answer: 'Go to Profile → Settings → Security → Change Password. Enter your current password, then your new password twice. Use 8+ characters with letters, numbers, and a special character.', category: 'account-profile', sortOrder: 17 },
      { question: 'Can I verify my account?', answer: 'Verified badges are available for public figures, brands, and high-net-worth individuals. Apply through Settings → Verification with documentation proving your identity and eligibility.', category: 'account-profile', sortOrder: 18 },
      { question: 'What do I do if the app won\'t load?', answer: 'Try: 1) Check internet connection, 2) Force close and restart app, 3) Clear cache (Settings → Apps → RabitChat → Clear Cache on Android), 4) Update to latest version, 5) Restart your device.', category: 'technical', sortOrder: 19 },
      { question: 'How do I fix connection issues?', answer: 'Tap "Retry Connection", check your internet works with other apps, disable VPN if using one, update to latest app version. If it persists, try mobile data instead of WiFi or contact support.', category: 'technical', sortOrder: 20 },
      { question: 'How do Stories work?', answer: 'Tap your profile picture with + icon, take or choose a photo/video, add filters and stickers, share. Stories auto-delete after 24 hours unless saved to Highlights. View others\' stories by tapping their profile pictures.', category: 'social-features', sortOrder: 21 },
      { question: 'What is the Creator Dashboard?', answer: 'Go to Profile → Creator Dashboard to see total earnings, monthly income, available balance, pending withdrawals, top supporters, best content, and growth analytics.', category: 'creator-monetization', sortOrder: 22 },
      { question: 'How do I maximize my earnings?', answer: 'Post consistently (daily), go live regularly, engage genuinely with your audience, thank gift senders, create gift-worthy moments (milestones, Q&As), and collaborate with other creators.', category: 'creator-monetization', sortOrder: 23 },
      { question: 'How do I create a group?', answer: 'Go to Discover → Groups → Create Group. Set name, description, privacy (Public/Private/Secret), category, and cover photo. Invite members and tap Create.', category: 'groups-events', sortOrder: 24 },
      { question: 'How do I attend events?', answer: 'Go to Discover → Events, browse by category/date/location, tap to view details, mark "Interested" or "Going", add to calendar, and join when it starts.', category: 'groups-events', sortOrder: 25 },
      { question: 'What is KYC and why do I need it?', answer: 'KYC (Know Your Customer) verifies your identity before withdrawals. Upload your ID, take a selfie, confirm address. Required by law for financial transactions. Approval takes 24-48 hours.', category: 'payments', sortOrder: 26 },
      { question: 'How do I control my privacy?', answer: 'Go to Settings → Privacy. Control profile visibility, post visibility, who can message you, net worth display, activity status, and whether you appear in suggestions and rankings.', category: 'safety-privacy', sortOrder: 27 },
      { question: 'What are message reactions?', answer: 'Long-press any message to react with Like, Love, Laugh, Wow, Sad, or Angry. Quick way to respond without typing a full reply.', category: 'messaging', sortOrder: 28 },
      { question: 'Can I delete messages?', answer: 'Yes! Tap and hold a message, select "Delete". Choose "Delete for me" or "Delete for everyone" (within 1 hour of sending). Deleted messages show "This message was deleted".', category: 'messaging', sortOrder: 29 },
      { question: 'How do I contact support?', answer: 'Go to Settings → Help Center → My Support Inbox → New Ticket. Describe your issue, attach screenshots if helpful, and submit. We respond within 24 hours.', category: 'getting-started', sortOrder: 30 },
    ];

    for (const faq of faqData) {
      await client.query(
        `INSERT INTO help_faqs (id, question, answer, category, sort_order, is_active, view_count, helpful_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, $6, $7, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [
          crypto.randomUUID(),
          faq.question,
          faq.answer,
          faq.category,
          faq.sortOrder,
          Math.floor(Math.random() * 5000) + 500,
          Math.floor(Math.random() * 400) + 50
        ]
      );
    }
    console.log(`[Help Center] Inserted ${faqData.length} FAQs`);

    // Verify final counts (no transaction needed)
    const finalCats = await client.query(`SELECT COUNT(*) FROM help_categories WHERE is_active = true`);
    const finalArts = await client.query(`SELECT COUNT(*) FROM help_articles WHERE status = 'PUBLISHED'`);
    const finalFaqs = await client.query(`SELECT COUNT(*) FROM help_faqs WHERE is_active = true`);
    
    console.log(`[Help Center] Seed complete! Final counts: ${finalCats.rows[0].count} categories, ${finalArts.rows[0].count} articles, ${finalFaqs.rows[0].count} FAQs`);
    
  } catch (error) {
    console.error('[Help Center] SEED ERROR:', error);
    throw error; // Re-throw so caller knows it failed
  } finally {
    client.release();
  }
}
