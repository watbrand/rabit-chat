import { pool } from './db';

async function seedHelpCenter() {
  console.log('Starting Help Center seed...');
  
  const categories = [
    { id: 'getting-started', name: 'Getting Started', slug: 'getting-started', description: 'New to RabitChat? Start here for the basics', icon: 'play-circle', color: '#8B5CF6', sortOrder: 1 },
    { id: 'account-profile', name: 'Account & Profile', slug: 'account-profile', description: 'Manage your account settings, profile, and privacy', icon: 'user', color: '#3B82F6', sortOrder: 2 },
    { id: 'messaging', name: 'Messaging', slug: 'messaging', description: 'Direct messages, group chats, and voice notes', icon: 'message-circle', color: '#14B8A6', sortOrder: 3 },
    { id: 'social-features', name: 'Social Features', slug: 'social-features', description: 'Posts, stories, reels, and following', icon: 'users', color: '#EC4899', sortOrder: 4 },
    { id: 'rabit-coins', name: 'Rabit Coins & Gifts', slug: 'rabit-coins', description: 'Virtual currency, gifting, and earning coins', icon: 'gift', color: '#F59E0B', sortOrder: 5 },
    { id: 'mall-shopping', name: 'Luxury Mall', slug: 'mall-shopping', description: 'Browse and purchase from our premium marketplace', icon: 'shopping-bag', color: '#10B981', sortOrder: 6 },
    { id: 'gossip-anonymous', name: 'Anonymous Gossip', slug: 'gossip-anonymous', description: 'Zero-identity gossip system (South Africa only)', icon: 'eye-off', color: '#EF4444', sortOrder: 7 },
    { id: 'safety-privacy', name: 'Safety & Privacy', slug: 'safety-privacy', description: 'Protect your account and stay safe online', icon: 'shield', color: '#6366F1', sortOrder: 8 },
    { id: 'technical', name: 'Technical Support', slug: 'technical', description: 'App issues, bugs, and troubleshooting', icon: 'tool', color: '#64748B', sortOrder: 9 },
    { id: 'payments', name: 'Payments & Withdrawals', slug: 'payments', description: 'Buy coins, withdraw earnings, and billing', icon: 'credit-card', color: '#0EA5E9', sortOrder: 10 },
  ];

  const subcategories = [
    { id: 'onboarding', parentId: 'getting-started', name: 'Onboarding', slug: 'onboarding', sortOrder: 1 },
    { id: 'first-steps', parentId: 'getting-started', name: 'First Steps', slug: 'first-steps', sortOrder: 2 },
    { id: 'app-navigation', parentId: 'getting-started', name: 'App Navigation', slug: 'app-navigation', sortOrder: 3 },
    { id: 'profile-setup', parentId: 'account-profile', name: 'Profile Setup', slug: 'profile-setup', sortOrder: 1 },
    { id: 'account-settings', parentId: 'account-profile', name: 'Account Settings', slug: 'account-settings', sortOrder: 2 },
    { id: 'verification', parentId: 'account-profile', name: 'Verification', slug: 'verification', sortOrder: 3 },
    { id: 'net-worth', parentId: 'account-profile', name: 'Net Worth & Influence', slug: 'net-worth', sortOrder: 4 },
    { id: 'direct-messages', parentId: 'messaging', name: 'Direct Messages', slug: 'direct-messages', sortOrder: 1 },
    { id: 'group-chats', parentId: 'messaging', name: 'Group Chats', slug: 'group-chats', sortOrder: 2 },
    { id: 'voice-video', parentId: 'messaging', name: 'Voice & Video', slug: 'voice-video', sortOrder: 3 },
    { id: 'message-features', parentId: 'messaging', name: 'Message Features', slug: 'message-features', sortOrder: 4 },
    { id: 'posts-feed', parentId: 'social-features', name: 'Posts & Feed', slug: 'posts-feed', sortOrder: 1 },
    { id: 'stories', parentId: 'social-features', name: 'Stories', slug: 'stories', sortOrder: 2 },
    { id: 'reels', parentId: 'social-features', name: 'Reels', slug: 'reels', sortOrder: 3 },
    { id: 'following', parentId: 'social-features', name: 'Following & Followers', slug: 'following', sortOrder: 4 },
    { id: 'earning-coins', parentId: 'rabit-coins', name: 'Earning Coins', slug: 'earning-coins', sortOrder: 1 },
    { id: 'spending-coins', parentId: 'rabit-coins', name: 'Spending Coins', slug: 'spending-coins', sortOrder: 2 },
    { id: 'gifts-staking', parentId: 'rabit-coins', name: 'Gifts & Staking', slug: 'gifts-staking', sortOrder: 3 },
    { id: 'wealth-clubs', parentId: 'rabit-coins', name: 'Wealth Clubs', slug: 'wealth-clubs', sortOrder: 4 },
    { id: 'browsing', parentId: 'mall-shopping', name: 'Browsing', slug: 'browsing', sortOrder: 1 },
    { id: 'purchasing', parentId: 'mall-shopping', name: 'Purchasing', slug: 'purchasing', sortOrder: 2 },
    { id: 'orders', parentId: 'mall-shopping', name: 'Orders & Delivery', slug: 'orders', sortOrder: 3 },
    { id: 'posting-gossip', parentId: 'gossip-anonymous', name: 'Posting Gossip', slug: 'posting-gossip', sortOrder: 1 },
    { id: 'tea-meter', parentId: 'gossip-anonymous', name: 'Tea Meter', slug: 'tea-meter', sortOrder: 2 },
    { id: 'whisper-mode', parentId: 'gossip-anonymous', name: 'Whisper Mode', slug: 'whisper-mode', sortOrder: 3 },
    { id: 'blocking', parentId: 'safety-privacy', name: 'Blocking & Muting', slug: 'blocking', sortOrder: 1 },
    { id: 'reporting', parentId: 'safety-privacy', name: 'Reporting', slug: 'reporting', sortOrder: 2 },
    { id: 'privacy-settings', parentId: 'safety-privacy', name: 'Privacy Settings', slug: 'privacy-settings', sortOrder: 3 },
    { id: 'app-issues', parentId: 'technical', name: 'App Issues', slug: 'app-issues', sortOrder: 1 },
    { id: 'notifications', parentId: 'technical', name: 'Notifications', slug: 'notifications', sortOrder: 2 },
    { id: 'media', parentId: 'technical', name: 'Media Issues', slug: 'media', sortOrder: 3 },
    { id: 'buying-coins', parentId: 'payments', name: 'Buying Coins', slug: 'buying-coins', sortOrder: 1 },
    { id: 'withdrawals', parentId: 'payments', name: 'Withdrawals', slug: 'withdrawals', sortOrder: 2 },
    { id: 'billing', parentId: 'payments', name: 'Billing Issues', slug: 'billing', sortOrder: 3 },
  ];

  const articles = [
    { categoryId: 'getting-started', title: 'Welcome to RabitChat', slug: 'welcome-to-rabitchat', summary: 'Your introduction to the elite social network', content: `# Welcome to RabitChat\n\nRabitChat is the Forbes-style social network designed to celebrate wealth and influence. Whether you're a high-net-worth individual, entrepreneur, or rising influencer, you've found your digital home.\n\n## What Makes RabitChat Special\n\n- **Elite Community**: Connect with verified wealth creators and influencers\n- **Rabit Coins**: Our virtual currency system for gifting and purchasing\n- **Luxury Mall**: Access exclusive products and services\n- **Anonymous Gossip**: Zero-identity gossip for South African users\n\n## Getting Started\n\n1. Complete your profile with your interests and industry\n2. Set your net worth tier (completely private)\n3. Follow suggested users based on your interests\n4. Start exploring the feed and discover amazing content\n\nWelcome to the elite!`, viewCount: 15420, helpfulCount: 892 },
    { categoryId: 'getting-started', title: 'Completing Your Profile', slug: 'completing-your-profile', summary: 'Set up your profile to maximize your RabitChat experience', content: `# Completing Your Profile\n\n## Profile Photo\n\nUpload a high-quality photo that represents you professionally.\n\n## Bio\n\nWrite a compelling bio (up to 500 characters) that showcases your achievements and interests.\n\n## Net Worth Tier\n\nSelect your wealth tier:\n- **Building**: Just getting started\n- **Silver**: R100K - R1M\n- **Gold**: R1M - R10M\n- **Platinum**: R10M - R100M\n- **Diamond**: R100M+\n\n## Privacy Settings\n\nChoose who can see your net worth and profile details.`, viewCount: 8932, helpfulCount: 654 },
    { categoryId: 'getting-started', title: 'Your First Post', slug: 'your-first-post', summary: 'Learn how to create engaging content', content: `# Creating Your First Post\n\n## Post Types\n\n- **Text**: Share thoughts and updates\n- **Photo**: Upload stunning images\n- **Video**: Share videos up to 10 minutes\n- **Voice**: Record voice posts\n\n## Tips for Great Posts\n\n1. Use high-quality media\n2. Write engaging captions\n3. Use relevant hashtags\n4. Tag other users when appropriate\n\n## Visibility Options\n\n- **Public**: Everyone can see\n- **Followers**: Only followers\n- **Close Friends**: Your inner circle`, viewCount: 6543, helpfulCount: 421 },
    { categoryId: 'getting-started', title: 'Navigating the App', slug: 'navigating-the-app', summary: 'Find your way around RabitChat', content: `# App Navigation\n\n## Main Tabs\n\n- **Home**: Your personalized feed\n- **Discover**: Find new content and users\n- **Mall**: Browse luxury items\n- **Messages**: Chat with connections\n- **Profile**: Your personal space\n\n## Quick Actions\n\n- Swipe down to refresh\n- Long-press for more options\n- Double-tap to like`, viewCount: 12890, helpfulCount: 923 },
    { categoryId: 'account-profile', title: 'Changing Your Profile Photo', slug: 'changing-profile-photo', summary: 'Update your profile picture in seconds', content: `# Changing Your Profile Photo\n\n1. Go to your Profile tab\n2. Tap on your current photo\n3. Choose from camera or gallery\n4. Crop and apply filters\n5. Save changes\n\n## Photo Guidelines\n\n- Minimum 500x500 pixels\n- Clear, well-lit image\n- Face should be visible\n- No inappropriate content`, viewCount: 4532, helpfulCount: 342 },
    { categoryId: 'account-profile', title: 'Writing a Great Bio', slug: 'writing-great-bio', summary: 'Craft a bio that stands out', content: `# Writing a Great Bio\n\nYour bio is your elevator pitch. Here's how to make it count:\n\n## Include:\n- Your profession/industry\n- Key achievements\n- Interests and passions\n- A touch of personality\n\n## Examples\n\n"Serial entrepreneur. Founded 3 tech startups. Passionate about sustainable luxury. Coffee connoisseur."\n\n"Real estate mogul. 50+ properties. Helping others build wealth. Father of 3."`, viewCount: 3421, helpfulCount: 287 },
    { categoryId: 'account-profile', title: 'Changing Your Password', slug: 'changing-password', summary: 'Keep your account secure with a strong password', content: `# Changing Your Password\n\n1. Go to Settings > Security\n2. Tap "Change Password"\n3. Enter current password\n4. Enter new password (8+ characters)\n5. Confirm new password\n\n## Password Requirements\n\n- At least 8 characters\n- One uppercase letter\n- One lowercase letter\n- One number\n- One special character`, viewCount: 2134, helpfulCount: 189 },
    { categoryId: 'account-profile', title: 'Deleting Your Account', slug: 'deleting-account', summary: 'Permanently remove your RabitChat account', content: `# Deleting Your Account\n\n**Warning**: This action is permanent and cannot be undone.\n\n## Before You Delete\n\n- Withdraw any Rabit Coins\n- Download your data\n- Consider deactivating instead\n\n## How to Delete\n\n1. Go to Settings > Account\n2. Tap "Delete Account"\n3. Enter your password\n4. Confirm deletion\n\nYour data will be removed within 30 days.`, viewCount: 1234, helpfulCount: 98 },
    { categoryId: 'account-profile', title: 'Getting Verified', slug: 'getting-verified', summary: 'Learn how to earn the purple checkmark', content: `# Getting Verified\n\nThe purple checkmark shows you're a verified member of the elite community.\n\n## Eligibility\n\n- 1000+ followers\n- Active for 30+ days\n- Complete profile\n- No community violations\n\n## How to Apply\n\n1. Go to Settings > Verification\n2. Tap "Apply for Verification"\n3. Upload required documents\n4. Wait for review (7-14 days)\n\n## Required Documents\n\n- Government ID\n- Proof of public presence\n- Business documentation (if applicable)`, viewCount: 8765, helpfulCount: 654 },
    { categoryId: 'account-profile', title: 'Understanding Net Worth Scores', slug: 'net-worth-scores', summary: 'How your net worth score is calculated', content: `# Net Worth Scores\n\n## How It Works\n\nYour net worth score increases when:\n- You receive gifts (10x multiplier)\n- You make Mall purchases (10x multiplier)\n- You complete achievements\n\n## Wealth Tiers\n\n- **Building**: Starting out\n- **Silver**: 100K - 1M points\n- **Gold**: 1M - 10M points\n- **Platinum**: 10M - 100M points\n- **Diamond**: 100M+ points\n\n## Benefits\n\nHigher tiers unlock:\n- Exclusive features\n- Priority support\n- Special badges`, viewCount: 5432, helpfulCount: 412 },
    { categoryId: 'messaging', title: 'Starting a Conversation', slug: 'starting-conversation', summary: 'How to send your first message', content: `# Starting a Conversation\n\n## From a Profile\n\n1. Visit the user's profile\n2. Tap the message icon\n3. Type your message\n4. Tap send\n\n## From Messages Tab\n\n1. Go to Messages\n2. Tap the + button\n3. Search for a user\n4. Start typing\n\n## Message Types\n\n- Text messages\n- Photos and videos\n- Voice notes (hold to record)\n- Files (up to 100MB)`, viewCount: 7654, helpfulCount: 543 },
    { categoryId: 'messaging', title: 'Message Reactions', slug: 'message-reactions', summary: 'React to messages with emoji', content: `# Message Reactions\n\n## How to React\n\n1. Long-press on a message\n2. Choose from 6 reactions:\n   - Like\n   - Love\n   - Laugh\n   - Wow\n   - Sad\n   - Angry\n\n## Viewing Reactions\n\nTap on reaction bubbles to see who reacted.`, viewCount: 3421, helpfulCount: 276 },
    { categoryId: 'messaging', title: 'Recording Voice Notes', slug: 'recording-voice-notes', summary: 'Send voice messages up to 3 minutes', content: `# Recording Voice Notes\n\n## How to Record\n\n1. Tap and hold the microphone icon\n2. Record your message (max 3 minutes)\n3. Release to send\n4. Slide left to cancel\n\n## Playback Options\n\n- 1x, 1.5x, 2x speed\n- Waveform visualization\n- Scrub through audio\n\n## Tips\n\n- Find a quiet environment\n- Speak clearly\n- Keep messages concise`, viewCount: 4567, helpfulCount: 345 },
    { categoryId: 'messaging', title: 'Deleting Messages', slug: 'deleting-messages', summary: 'Remove messages you sent', content: `# Deleting Messages\n\n## Delete for Yourself\n\nRemoves the message from your view only.\n\n## Delete for Everyone\n\nRemoves the message for all participants. Available within 1 hour of sending.\n\n## How to Delete\n\n1. Long-press the message\n2. Tap "Delete"\n3. Choose delete option\n4. Confirm`, viewCount: 2345, helpfulCount: 198 },
    { categoryId: 'messaging', title: 'Creating Group Chats', slug: 'creating-group-chats', summary: 'Chat with multiple people at once', content: `# Creating Group Chats\n\n## How to Create\n\n1. Go to Messages\n2. Tap the + button\n3. Select "New Group"\n4. Add participants (up to 100)\n5. Name your group\n6. Tap "Create"\n\n## Group Settings\n\n- Custom group photo\n- Admin controls\n- Add/remove members\n- Mute notifications`, viewCount: 5678, helpfulCount: 432 },
    { categoryId: 'social-features', title: 'Understanding Your Feed', slug: 'understanding-feed', summary: 'How the Elite Feed Algorithm works', content: `# Understanding Your Feed\n\n## The Elite Algorithm\n\nYour feed is personalized using:\n\n- **Interest Affinity**: Content matching your interests\n- **Engagement Velocity**: Popular posts rising fast\n- **Creator Affinity**: Users you interact with most\n- **Net Worth Boost**: Verified wealthy users get priority\n\n## Feed Controls\n\n- "Not Interested" to hide similar content\n- Follow more users for variety\n- Adjust interests in Settings`, viewCount: 9876, helpfulCount: 765 },
    { categoryId: 'social-features', title: 'Liking and Commenting', slug: 'liking-commenting', summary: 'Engage with posts in your feed', content: `# Liking and Commenting\n\n## Liking Posts\n\n- Tap the heart icon\n- Double-tap the post\n- Posts you like appear in your Liked tab\n\n## Commenting\n\n- Tap the comment icon\n- Write your comment\n- @mention other users\n- Reply to other comments\n\n## Comment Guidelines\n\n- Be respectful\n- Add value to discussions\n- Report inappropriate comments`, viewCount: 4321, helpfulCount: 321 },
    { categoryId: 'social-features', title: 'Creating Stories', slug: 'creating-stories', summary: 'Share moments that disappear in 24 hours', content: `# Creating Stories\n\n## How to Create\n\n1. Tap your profile icon on the stories bar\n2. Capture or select media\n3. Add filters, stickers, and text\n4. Tap "Share to Story"\n\n## Story Features\n\n- **Filters**: 11 preset color filters\n- **Stickers**: Drag and resize\n- **Text**: Multiple fonts and colors\n- **Drawing**: Freehand with brush tools\n\n## Duration\n\nStories automatically delete after 24 hours.`, viewCount: 7654, helpfulCount: 567 },
    { categoryId: 'social-features', title: 'Watching Reels', slug: 'watching-reels', summary: 'Discover short-form video content', content: `# Watching Reels\n\n## Navigation\n\n- Swipe up for next reel\n- Swipe down for previous\n- Tap to pause/play\n\n## Engagement\n\n- Like, comment, share\n- Follow the creator\n- Send gifts\n\n## For You Algorithm\n\nReels are personalized based on:\n- Watch time\n- Rewatches\n- Engagement\n- Creator affinity`, viewCount: 8765, helpfulCount: 654 },
    { categoryId: 'social-features', title: 'Following Other Users', slug: 'following-users', summary: 'Build your network on RabitChat', content: `# Following Other Users\n\n## How to Follow\n\n1. Visit their profile\n2. Tap "Follow"\n3. Their posts appear in your feed\n\n## Followers vs Following\n\n- **Followers**: People who follow you\n- **Following**: People you follow\n\n## Suggested Users\n\nWe suggest users based on:\n- Shared interests\n- Same industry\n- Mutual connections`, viewCount: 5432, helpfulCount: 432 },
    { categoryId: 'rabit-coins', title: 'How to Earn Rabit Coins', slug: 'earning-rabit-coins', summary: 'Multiple ways to earn virtual currency', content: `# Earning Rabit Coins\n\n## Free Methods\n\n- **Daily Rewards**: Log in daily for streak bonuses\n- **Achievements**: Complete milestones\n- **Referrals**: Invite friends (bonus coins)\n\n## Receiving Gifts\n\nWhen others send you gifts, you receive coins based on the gift value.\n\n## Creator Monetization\n\nPopular creators can earn from:\n- Gifts received on content\n- Live stream donations\n- Platform battles`, viewCount: 12345, helpfulCount: 987 },
    { categoryId: 'rabit-coins', title: 'Daily Reward Streaks', slug: 'daily-reward-streaks', summary: 'Maximize your daily coin earnings', content: `# Daily Reward Streaks\n\n## How It Works\n\n- Log in every day to maintain your streak\n- Streak bonuses increase with consecutive days\n- Miss a day and your streak resets\n\n## Rewards\n\n- Day 1-7: Base coins\n- Day 8-14: 1.5x multiplier\n- Day 15-30: 2x multiplier\n- Day 31+: 3x multiplier\n\n## Tips\n\n- Enable notifications for reminders\n- Claim before midnight`, viewCount: 6543, helpfulCount: 543 },
    { categoryId: 'rabit-coins', title: 'Sending Gifts', slug: 'sending-gifts', summary: 'Show appreciation with virtual gifts', content: `# Sending Gifts\n\n## Gift Types\n\n- **Rose** (10 coins): Simple appreciation\n- **Champagne** (500 coins): Celebrate success\n- **Diamond** (10,000 coins): Ultimate luxury\n- **Private Jet** (500,000 coins): The elite gift\n\n## How to Send\n\n1. View a post or profile\n2. Tap the gift icon\n3. Choose your gift\n4. Confirm purchase\n\n## Net Worth Impact\n\nGifts add to the receiver's net worth at full value.`, viewCount: 8765, helpfulCount: 654 },
    { categoryId: 'rabit-coins', title: 'Gift Staking Explained', slug: 'gift-staking', summary: 'Lock gifts to earn bonus coins over time', content: `# Gift Staking\n\n## What Is Staking?\n\nLock your received gifts to earn additional coins as interest over time.\n\n## How to Stake\n\n1. Go to Wallet > Staking\n2. Select gifts to stake\n3. Choose lock period\n4. Confirm\n\n## Returns\n\n- 30 days: 5% bonus\n- 90 days: 15% bonus\n- 180 days: 35% bonus\n\n## Unlock\n\nEarly unlock incurs a 10% penalty.`, viewCount: 4321, helpfulCount: 321 },
    { categoryId: 'rabit-coins', title: 'Wealth Clubs Guide', slug: 'wealth-clubs', summary: 'Unlock exclusive perks based on your net worth', content: `# Wealth Clubs\n\n## Tiers\n\n- **Bronze**: Entry level\n- **Silver**: 100K net worth\n- **Gold**: 1M net worth\n- **Platinum**: 10M net worth\n- **Diamond**: 100M net worth\n\n## Benefits\n\n- Exclusive badges\n- Priority customer support\n- Early access to features\n- Special events and meetups\n- Higher withdrawal limits`, viewCount: 5678, helpfulCount: 456 },
    { categoryId: 'mall-shopping', title: 'Browsing the Luxury Mall', slug: 'browsing-mall', summary: 'Discover 500+ premium products', content: `# Browsing the Luxury Mall\n\n## Categories\n\n- Watches & Jewelry\n- Fashion & Accessories\n- Tech & Gadgets\n- Home & Living\n- Experiences\n- And more...\n\n## Filtering\n\n- By category\n- By price range\n- By popularity\n- By new arrivals\n\n## Wishlist\n\nSave items for later by tapping the heart icon.`, viewCount: 7654, helpfulCount: 543 },
    { categoryId: 'mall-shopping', title: 'Making a Purchase', slug: 'making-purchase', summary: 'Buy items with Rabit Coins', content: `# Making a Purchase\n\n## How to Buy\n\n1. Select your item\n2. Choose options (size, color)\n3. Tap "Buy Now"\n4. Confirm coin payment\n5. Enter shipping details\n\n## Pricing\n\nAll items are priced in Rabit Coins (1 Rand = 1 Coin).\n\n## Net Worth Boost\n\nMall purchases give a 10x net worth multiplier!`, viewCount: 5432, helpfulCount: 432 },
    { categoryId: 'mall-shopping', title: 'Tracking Your Orders', slug: 'tracking-orders', summary: 'Monitor your purchases from mall to doorstep', content: `# Tracking Orders\n\n## Order Status\n\n- **Processing**: Order received\n- **Shipped**: In transit\n- **Delivered**: Arrived\n\n## How to Track\n\n1. Go to Profile > Orders\n2. Select your order\n3. View tracking details\n\n## Delivery Times\n\n- Standard: 5-7 business days\n- Express: 2-3 business days\n- Premium: Next day`, viewCount: 3456, helpfulCount: 276 },
    { categoryId: 'gossip-anonymous', title: 'How Anonymous Gossip Works', slug: 'anonymous-gossip-intro', summary: 'Zero-identity posting for South African users', content: `# Anonymous Gossip System\n\n**Available in South Africa only**\n\n## True Anonymity\n\n- No usernames attached\n- No profile links\n- GPS-based location only\n- Zero identity traces\n\n## Guidelines\n\n- No real names\n- No identifying information\n- Respect privacy\n- Report violations\n\n## Auto-Delete\n\nAll gossip posts automatically delete after 24 hours in Whisper Mode.`, viewCount: 8765, helpfulCount: 654 },
    { categoryId: 'gossip-anonymous', title: 'Understanding the Tea Meter', slug: 'tea-meter-explained', summary: 'How gossip posts are scored', content: `# Tea Meter\n\n## What Is It?\n\nThe Tea Meter scores how "hot" your gossip is based on engagement.\n\n## Scoring Factors\n\n- Views\n- Reactions\n- Comments\n- Shares\n- Time since posting\n\n## Tea Levels\n\n- Cold: Low engagement\n- Warm: Moderate interest\n- Hot: Trending\n- Boiling: Viral\n\n## Benefits\n\nHigh Tea Meter scores boost visibility.`, viewCount: 5432, helpfulCount: 432 },
    { categoryId: 'gossip-anonymous', title: 'Using Whisper Mode', slug: 'whisper-mode', summary: 'Extra-private gossip that disappears faster', content: `# Whisper Mode\n\n## What Is Whisper Mode?\n\nUltra-private gossip that:\n- Deletes in 24 hours\n- Has no reactions\n- Cannot be shared\n- Shows no view count\n\n## Enabling Whisper Mode\n\n1. Create new gossip\n2. Toggle "Whisper Mode" on\n3. Post your content\n\n## Best For\n\n- Sensitive topics\n- Time-sensitive info\n- Maximum privacy`, viewCount: 4321, helpfulCount: 321 },
    { categoryId: 'safety-privacy', title: 'Blocking a User', slug: 'blocking-user', summary: 'Stop someone from contacting you', content: `# Blocking a User\n\n## What Happens When You Block\n\n- They can't see your profile\n- They can't message you\n- Their content disappears from your feed\n- Previous messages are hidden\n\n## How to Block\n\n1. Go to their profile\n2. Tap the menu\n3. Select "Block"\n4. Confirm\n\n## Unblocking\n\nGo to Settings > Privacy > Blocked Users.`, viewCount: 3456, helpfulCount: 287 },
    { categoryId: 'safety-privacy', title: 'Muting Users and Conversations', slug: 'muting-users', summary: 'Hide content without blocking', content: `# Muting\n\n## Muting vs Blocking\n\n- Mute: Hide their content, they don't know\n- Block: Complete separation, they may notice\n\n## What Gets Muted\n\n- Posts in your feed\n- Story updates\n- Message notifications\n\n## Mute Options\n\n- 24 hours\n- 7 days\n- Until you unmute`, viewCount: 2345, helpfulCount: 198 },
    { categoryId: 'safety-privacy', title: 'Reporting Content', slug: 'reporting-content', summary: 'Help keep the community safe', content: `# Reporting Content\n\n## What to Report\n\n- Harassment or bullying\n- Hate speech\n- Nudity or sexual content\n- Violence or threats\n- Spam or scams\n- Impersonation\n- Misinformation\n\n## How to Report\n\n1. Tap the menu on the content\n2. Select "Report"\n3. Choose reason\n4. Add details (optional)\n5. Submit\n\n## After Reporting\n\nOur team reviews within 24 hours.`, viewCount: 4567, helpfulCount: 376 },
    { categoryId: 'safety-privacy', title: 'Adjusting Privacy Settings', slug: 'privacy-settings', summary: 'Control who sees what', content: `# Privacy Settings\n\n## Available Options\n\n- **Profile Visibility**: Public, Followers, Private\n- **Net Worth Display**: Show, Hide, Followers Only\n- **Online Status**: Show, Hide\n- **Read Receipts**: On, Off\n- **Activity Status**: On, Off\n\n## How to Access\n\n1. Go to Settings\n2. Tap "Privacy"\n3. Adjust preferences\n4. Changes save automatically`, viewCount: 5678, helpfulCount: 456 },
    { categoryId: 'technical', title: 'App Crashing on Launch', slug: 'app-crashing', summary: 'Fix startup issues', content: `# App Crashing on Launch\n\n## Quick Fixes\n\n1. **Force close and reopen**\n2. **Restart your device**\n3. **Update the app** (App Store/Play Store)\n4. **Clear app cache** (Android only)\n5. **Reinstall the app**\n\n## Still Having Issues?\n\nContact support with:\n- Device model\n- OS version\n- When the issue started\n- Screenshot of any error`, viewCount: 6543, helpfulCount: 543 },
    { categoryId: 'technical', title: 'App Running Slowly', slug: 'app-slow', summary: 'Improve app performance', content: `# App Running Slowly\n\n## Performance Tips\n\n1. **Close other apps** running in background\n2. **Free up storage** (at least 500MB)\n3. **Update to latest version**\n4. **Restart device**\n5. **Disable auto-play videos**\n\n## System Requirements\n\n- iOS 14+ or Android 8+\n- 2GB RAM minimum\n- 500MB free storage`, viewCount: 4321, helpfulCount: 365 },
    { categoryId: 'technical', title: 'Not Receiving Notifications', slug: 'no-notifications', summary: 'Fix missing push notifications', content: `# Not Receiving Notifications\n\n## Check These Settings\n\n1. **Device Settings**\n   - Settings > Notifications > RabitChat > Allow\n\n2. **In-App Settings**\n   - Settings > Notifications > Enable all\n\n3. **Do Not Disturb**\n   - Ensure DND is off\n\n4. **Battery Optimization** (Android)\n   - Exclude RabitChat from battery saver\n\n## Test Notifications\n\nAsk a friend to message you!`, viewCount: 5432, helpfulCount: 432 },
    { categoryId: 'technical', title: 'Photos Not Uploading', slug: 'photos-not-uploading', summary: 'Resolve image upload issues', content: `# Photos Not Uploading\n\n## Common Causes\n\n- Slow internet connection\n- File too large (max 100MB)\n- Unsupported format\n- Storage permission missing\n\n## Solutions\n\n1. Check internet connection\n2. Reduce image size\n3. Try different format (JPG, PNG)\n4. Grant storage permissions\n5. Restart the app\n\n## Supported Formats\n\nJPG, PNG, GIF, HEIC, WEBP`, viewCount: 3456, helpfulCount: 287 },
    { categoryId: 'technical', title: 'Videos Not Playing', slug: 'videos-not-playing', summary: 'Fix video playback problems', content: `# Videos Not Playing\n\n## Quick Fixes\n\n1. **Check internet speed** (minimum 5 Mbps)\n2. **Wait for buffering**\n3. **Refresh the page**\n4. **Clear app cache**\n5. **Update the app**\n\n## Settings to Check\n\n- Auto-play videos: On\n- Data saver mode: Off\n- Background restrictions: Disabled\n\n## Supported Formats\n\nMP4, MOV, AVI, MKV (max 2GB)`, viewCount: 4321, helpfulCount: 354 },
    { categoryId: 'payments', title: 'How to Buy Rabit Coins', slug: 'buying-coins', summary: 'Purchase coins using PayFast', content: `# Buying Rabit Coins\n\n## Available Bundles\n\n- **Starter**: R10 = 100 coins\n- **Basic**: R50 = 550 coins (10% bonus)\n- **Popular**: R200 = 2,400 coins (20% bonus)\n- **Premium**: R500 = 6,500 coins (30% bonus)\n- **VIP**: R1000 = 14,000 coins (40% bonus)\n- **Elite**: R3500 = 50,000+ coins (50% bonus)\n\n## How to Purchase\n\n1. Go to Wallet > Buy Coins\n2. Select bundle\n3. Complete PayFast checkout\n4. Coins credited instantly`, viewCount: 8765, helpfulCount: 678 },
    { categoryId: 'payments', title: 'Accepted Payment Methods', slug: 'payment-methods', summary: 'PayFast supported payment options', content: `# Payment Methods\n\n## Supported via PayFast\n\n- Credit/Debit Cards (Visa, Mastercard)\n- Instant EFT\n- Mobicred\n- SnapScan\n- Zapper\n- Samsung Pay\n\n## Security\n\n- PCI-DSS compliant\n- 3D Secure authentication\n- Fraud protection\n\n## Currency\n\nAll payments are in South African Rand (ZAR).`, viewCount: 4321, helpfulCount: 345 },
    { categoryId: 'payments', title: 'Withdrawing Your Earnings', slug: 'withdrawals', summary: 'Convert coins to real money', content: `# Withdrawing Earnings\n\n## Eligibility\n\n- Verified account\n- KYC completed\n- Minimum 10,000 coins\n- 30-day account age\n\n## How to Withdraw\n\n1. Go to Wallet > Withdraw\n2. Enter amount\n3. Confirm bank details\n4. Request withdrawal\n\n## Processing\n\n- Review: 1-3 business days\n- Transfer: 2-5 business days\n- Platform fee: 50%\n\n## Bank Requirements\n\n- South African bank account\n- Account in your name\n- Valid FICA documents`, viewCount: 7654, helpfulCount: 567 },
    { categoryId: 'payments', title: 'KYC Verification for Withdrawals', slug: 'kyc-verification', summary: 'Complete identity verification to withdraw', content: `# KYC Verification\n\n## Required Documents\n\n- Government ID (ID book or card)\n- Proof of address (utility bill, bank statement)\n- Selfie with ID\n\n## Process\n\n1. Go to Settings > Verification > KYC\n2. Upload documents\n3. Complete selfie verification\n4. Wait for review (24-48 hours)\n\n## POPIA/FICA Compliance\n\nWe comply with South African financial regulations.`, viewCount: 5432, helpfulCount: 432 },
    { categoryId: 'payments', title: 'Refund Policy', slug: 'refund-policy', summary: 'When and how to request refunds', content: `# Refund Policy\n\n## Coin Purchases\n\n- Unused coins: Full refund within 14 days\n- Partially used: Pro-rata refund\n- Fully used: No refund\n\n## Mall Purchases\n\n- Unused/unopened: Full refund within 30 days\n- Shipping costs: Non-refundable\n- Digital items: Non-refundable\n\n## How to Request\n\n1. Contact support\n2. Provide order details\n3. Explain reason\n4. Await response (2-5 days)`, viewCount: 3456, helpfulCount: 276 },
    { categoryId: 'social-features', title: 'Saving Posts', slug: 'saving-posts', summary: 'Save content to view later', content: `# Saving Posts\n\n## How to Save\n\n1. Find a post you like\n2. Tap the bookmark icon\n3. Post is saved to your collection\n\n## Viewing Saved Posts\n\n1. Go to Profile\n2. Tap "Saved"\n3. Browse your collection\n\n## Organizing\n\n- Create collections\n- Name your collections\n- Move posts between collections`, viewCount: 2345, helpfulCount: 198 },
    { categoryId: 'social-features', title: 'Sharing Posts', slug: 'sharing-posts', summary: 'Share content with others', content: `# Sharing Posts\n\n## Share Options\n\n- **To Story**: Share to your story\n- **Direct Message**: Send to specific users\n- **Copy Link**: Get shareable URL\n- **External**: Share to other apps\n\n## How to Share\n\n1. Tap the share arrow on any post\n2. Choose your sharing method\n3. Add optional message\n4. Send or share`, viewCount: 3456, helpfulCount: 276 },
    { categoryId: 'account-profile', title: 'Two-Factor Authentication', slug: 'two-factor-auth', summary: 'Add extra security to your account', content: `# Two-Factor Authentication\n\n## What Is 2FA?\n\nAn extra layer of security requiring both your password and a verification code.\n\n## Setting Up\n\n1. Go to Settings > Security\n2. Tap "Two-Factor Authentication"\n3. Choose method:\n   - SMS (phone number)\n   - Authenticator app\n4. Verify setup\n\n## Backup Codes\n\nSave your backup codes in case you lose access to your 2FA method.`, viewCount: 4567, helpfulCount: 378 },
    { categoryId: 'account-profile', title: 'Managing Linked Accounts', slug: 'linked-accounts', summary: 'Connect and disconnect social accounts', content: `# Linked Accounts\n\n## Benefits\n\n- Faster login\n- Share content across platforms\n- Import contacts\n\n## How to Link\n\n1. Go to Settings > Accounts\n2. Tap "Link Account"\n3. Choose platform\n4. Authorize connection\n\n## Unlinking\n\n1. Go to Settings > Accounts\n2. Find linked account\n3. Tap "Unlink"\n4. Confirm`, viewCount: 2345, helpfulCount: 187 },
    { categoryId: 'messaging', title: 'Message Search', slug: 'message-search', summary: 'Find messages quickly', content: `# Message Search\n\n## How to Search\n\n1. Open Messages\n2. Tap the search icon\n3. Enter keywords\n4. View results\n\n## Search Within Conversation\n\n1. Open conversation\n2. Tap menu\n3. Select "Search in Chat"\n4. Enter keywords\n\n## Tips\n\n- Use exact phrases\n- Search by username\n- Filter by date`, viewCount: 3456, helpfulCount: 265 },
    { categoryId: 'messaging', title: 'Pinning Conversations', slug: 'pinning-conversations', summary: 'Keep important chats at the top', content: `# Pinning Conversations\n\n## How to Pin\n\n1. Swipe right on conversation\n2. Tap the pin icon\n3. Conversation moves to top\n\n## Managing Pins\n\n- Up to 5 pinned conversations\n- Unpin by swiping right again\n- Pinned chats show a pin icon`, viewCount: 2345, helpfulCount: 198 },
    { categoryId: 'safety-privacy', title: 'Restricting Accounts', slug: 'restricting-accounts', summary: 'Limit interactions without blocking', content: `# Restricting Accounts\n\n## What Happens\n\n- Their comments on your posts need approval\n- They can't see when you're online\n- DM requests go to message requests\n- They won't know they're restricted\n\n## How to Restrict\n\n1. Go to their profile\n2. Tap menu\n3. Select "Restrict"\n4. Confirm`, viewCount: 3456, helpfulCount: 276 },
    { categoryId: 'technical', title: 'Login Problems', slug: 'login-problems', summary: 'Trouble accessing your account', content: `# Login Problems\n\n## Forgot Password\n\n1. Tap "Forgot Password"\n2. Enter email/phone\n3. Receive reset code\n4. Create new password\n\n## Account Locked\n\n- Wait 24 hours\n- Complete security verification\n- Contact support if persistent\n\n## Other Issues\n\n- Clear app cache\n- Check internet connection\n- Update the app\n- Try different network`, viewCount: 5432, helpfulCount: 432 },
    { categoryId: 'technical', title: 'Customizing Notification Sounds', slug: 'notification-sounds', summary: 'Change your alert tones', content: `# Notification Sounds\n\n## Available Sounds\n\n- Default RabitChat tone\n- Classic\n- Subtle\n- Energetic\n- Silent\n\n## How to Change\n\n1. Go to Settings\n2. Tap "Notifications"\n3. Select "Sound"\n4. Choose your preferred tone\n5. Test and save`, viewCount: 2345, helpfulCount: 187 },
    { categoryId: 'rabit-coins', title: 'Platform Battles', slug: 'platform-battles', summary: 'Compete in gifting competitions', content: `# Platform Battles\n\n## What Are Battles?\n\nCompetitive gifting events where users support their favorite creators.\n\n## How to Participate\n\n1. Find an active battle\n2. Send gifts to your chosen creator\n3. Track the leaderboard\n4. Winners get special badges\n\n## Fees\n\n20% platform fee on battle gifts\n\n## Rewards\n\n- Winner badges\n- Featured placement\n- Coin bonuses`, viewCount: 4321, helpfulCount: 345 },
    { categoryId: 'rabit-coins', title: 'Creator Monetization Guide', slug: 'creator-monetization', summary: 'Turn your content into income', content: `# Creator Monetization\n\n## Requirements\n\n- 500+ followers\n- 30+ days account age\n- Verified profile\n- KYC completed\n\n## Income Sources\n\n- Gifts on posts\n- Live stream donations\n- Battle winnings\n- Subscription tiers\n\n## Dashboard\n\nTrack earnings, analytics, and payouts in Creator Dashboard.\n\n## Withdrawal\n\n50% platform fee applies.`, viewCount: 6543, helpfulCount: 534 },
    { categoryId: 'social-features', title: 'Creating Reels', slug: 'creating-reels', summary: 'Make engaging short videos', content: `# Creating Reels\n\n## Recording\n\n1. Tap + button\n2. Select "Reel"\n3. Hold to record (up to 60 seconds)\n4. Use speed controls (0.5x - 3x)\n\n## Editing\n\n- Add filters\n- Include music\n- Add text overlays\n- Use stickers\n\n## Publishing\n\n1. Write caption\n2. Add hashtags\n3. Choose cover\n4. Tap "Share"`, viewCount: 5432, helpfulCount: 432 },
    { categoryId: 'social-features', title: 'Story Highlights', slug: 'story-highlights', summary: 'Save stories to your profile permanently', content: `# Story Highlights\n\n## Creating Highlights\n\n1. Go to Profile\n2. Tap "+" on Highlights\n3. Select stories to add\n4. Name your highlight\n5. Choose cover image\n\n## Managing\n\n- Add more stories anytime\n- Rearrange order\n- Edit name and cover\n- Delete highlight\n\n## Tips\n\n- Organize by theme\n- Keep covers consistent\n- Use for important info`, viewCount: 4321, helpfulCount: 345 },
    { categoryId: 'getting-started', title: 'Following Suggested Users', slug: 'following-suggested', summary: 'Discover your community', content: `# Suggested Users\n\n## How Suggestions Work\n\nWe recommend users based on:\n- Shared interests\n- Same industry\n- Mutual connections\n- Similar net worth tier\n\n## Where to Find\n\n- Onboarding flow\n- Discover tab\n- "People You May Know" section\n\n## Building Your Network\n\nFollow at least 20 users to have a great feed experience.`, viewCount: 3456, helpfulCount: 276 },
    { categoryId: 'safety-privacy', title: 'Reporting a Fake Account', slug: 'reporting-fake-account', summary: 'Help us remove impersonators', content: `# Reporting Fake Accounts\n\n## Signs of Fake Account\n\n- Using someone else's photos\n- Impersonating a celebrity/brand\n- Suspicious activity\n- Requesting money or personal info\n\n## How to Report\n\n1. Go to the profile\n2. Tap menu\n3. Select "Report"\n4. Choose "Impersonation"\n5. Provide details\n\n## What Happens\n\nWe investigate within 24-48 hours.`, viewCount: 2345, helpfulCount: 198 },
    { categoryId: 'messaging', title: 'Video Calling', slug: 'video-calling', summary: 'Make face-to-face calls', content: `# Video Calling\n\n## Starting a Call\n\n1. Open conversation\n2. Tap video camera icon\n3. Wait for answer\n\n## During Call\n\n- Mute/unmute audio\n- Turn camera on/off\n- Switch cameras\n- Add participants\n\n## Requirements\n\n- Stable internet (5+ Mbps)\n- Camera and mic permissions\n- Both users online`, viewCount: 4321, helpfulCount: 345 },
    { categoryId: 'account-profile', title: 'Influence Score Explained', slug: 'influence-score', summary: 'How your influence is measured', content: `# Influence Score\n\n## Calculation\n\nYour influence score considers:\n- Follower count\n- Engagement rate\n- Content quality\n- Verification status\n- Account age\n\n## Improving Score\n\n- Post consistently\n- Engage with community\n- Create quality content\n- Get verified\n- Receive gifts\n\n## Benefits\n\nHigher influence = more visibility in feeds.`, viewCount: 5432, helpfulCount: 432 },
    { categoryId: 'mall-shopping', title: 'Using Promo Codes', slug: 'promo-codes', summary: 'Save on Mall purchases', content: `# Promo Codes\n\n## Where to Find\n\n- Email newsletters\n- In-app promotions\n- Social media\n- Special events\n\n## How to Use\n\n1. Select item\n2. Go to checkout\n3. Enter promo code\n4. Tap "Apply"\n5. See discount\n\n## Terms\n\n- One code per order\n- May have minimum spend\n- Check expiry date`, viewCount: 3456, helpfulCount: 276 },
    { categoryId: 'technical', title: 'Supported Media Formats', slug: 'supported-media', summary: 'File types we accept', content: `# Supported Media Formats\n\n## Images\n\n- JPG/JPEG\n- PNG\n- GIF\n- HEIC\n- WEBP\n- Max size: 100MB\n\n## Videos\n\n- MP4\n- MOV\n- AVI\n- MKV\n- Max size: 2GB\n\n## Audio\n\n- MP3\n- AAC\n- M4A\n- Max size: 100MB\n\n## Documents (Support Chat)\n\n- PDF\n- DOC/DOCX\n- XLS/XLSX\n- Max size: 1GB`, viewCount: 4321, helpfulCount: 345 },
    { categoryId: 'safety-privacy', title: 'What Happens After Reporting', slug: 'after-reporting', summary: 'Our review process explained', content: `# After You Report\n\n## Review Process\n\n1. Report received\n2. AI initial screening\n3. Human moderator review\n4. Decision made\n5. Action taken\n\n## Timeframe\n\n- Most reports: 24 hours\n- Complex cases: 3-5 days\n- Appeals: 7 days\n\n## Possible Actions\n\n- Warning issued\n- Content removed\n- Account suspended\n- Account banned`, viewCount: 3456, helpfulCount: 287 },
    { categoryId: 'payments', title: 'Disputed Transactions', slug: 'disputed-transactions', summary: 'Handle payment issues', content: `# Disputed Transactions\n\n## When to Dispute\n\n- Unauthorized charge\n- Duplicate charge\n- Wrong amount\n- Never received coins\n\n## How to Dispute\n\n1. Contact support\n2. Provide transaction ID\n3. Explain issue\n4. Attach proof (if any)\n\n## Resolution\n\nMost disputes resolved within 5 business days.`, viewCount: 2345, helpfulCount: 198 },
    { categoryId: 'getting-started', title: 'Using the Search Feature', slug: 'using-search', summary: 'Find users, posts, and hashtags', content: `# Search Feature\n\n## Search Types\n\n- **Users**: Find people by username or name\n- **Hashtags**: Discover trending topics\n- **Posts**: Search post content\n- **Sounds**: Find audio/music\n\n## Tips\n\n- Use exact usernames\n- Try hashtags for topics\n- Recent searches saved\n- Filter by category`, viewCount: 5432, helpfulCount: 432 },
    { categoryId: 'social-features', title: 'Managing Close Friends', slug: 'close-friends', summary: 'Share private content with select people', content: `# Close Friends\n\n## What It Is\n\nA private list of people who can see your close friends-only content.\n\n## Adding People\n\n1. Go to Settings\n2. Tap "Close Friends"\n3. Search and add users\n4. They'll see a green ring on your stories\n\n## Sharing\n\nWhen posting, select "Close Friends" audience.`, viewCount: 4321, helpfulCount: 345 },
    { categoryId: 'getting-started', title: 'Setting Your Interests', slug: 'setting-interests', summary: 'Personalize your experience', content: `# Setting Your Interests\n\n## Available Categories\n\n- Luxury Lifestyle\n- Investments\n- Real Estate\n- Yachts & Aviation\n- Fine Dining\n- Fashion\n- Art\n- Exotic Cars\n- Watches\n- Tech\n- Wellness\n- Entertainment\n- Sports\n- Philanthropy\n- Crypto\n\n## How It Affects Your Feed\n\nInterests boost content in those categories in your feed.`, viewCount: 5432, helpfulCount: 432 },
    { categoryId: 'technical', title: 'Downloading Your Data', slug: 'downloading-data', summary: 'Get a copy of your information', content: `# Downloading Your Data\n\n## What's Included\n\n- Profile information\n- Posts and media\n- Messages\n- Comments and likes\n- Follower lists\n\n## How to Request\n\n1. Go to Settings > Privacy\n2. Tap "Download Data"\n3. Confirm email\n4. Wait for email (1-3 days)\n5. Download ZIP file\n\n## Format\n\nData is provided in JSON format with media files.`, viewCount: 2345, helpfulCount: 198 },
  ];

  const faqs = [
    { question: 'How do I reset my password?', answer: 'Go to Settings > Security > Change Password. If you forgot your password, tap "Forgot Password" on the login screen.', categoryId: 'account-profile', isFeatured: true },
    { question: 'How do I buy Rabit Coins?', answer: 'Go to Wallet > Buy Coins, select a bundle, and complete payment via PayFast using card, EFT, or mobile payment.', categoryId: 'rabit-coins', isFeatured: true },
    { question: 'How do I withdraw my earnings?', answer: 'Complete KYC verification first, then go to Wallet > Withdraw. Minimum 10,000 coins, 50% platform fee applies.', categoryId: 'payments', isFeatured: true },
    { question: 'How do I get verified?', answer: 'Go to Settings > Verification. You need 1000+ followers, 30+ days active, and must submit ID verification.', categoryId: 'account-profile', isFeatured: true },
    { question: 'How do I block someone?', answer: 'Go to their profile, tap the menu, and select "Block". They won\'t be notified.', categoryId: 'safety-privacy', isFeatured: true },
    { question: 'Why can\'t I post gossip?', answer: 'Anonymous gossip is only available in South Africa due to regional regulations.', categoryId: 'gossip-anonymous', isFeatured: true },
    { question: 'How long do stories last?', answer: 'Stories automatically disappear after 24 hours. Save them as Highlights to keep them on your profile.', categoryId: 'social-features', isFeatured: false },
    { question: 'What is the Tea Meter?', answer: 'The Tea Meter scores how engaging your gossip post is based on views, reactions, and comments.', categoryId: 'gossip-anonymous', isFeatured: false },
    { question: 'How do Wealth Clubs work?', answer: 'Wealth Clubs are tiers based on your net worth. Higher tiers unlock exclusive features and priority support.', categoryId: 'rabit-coins', isFeatured: false },
    { question: 'Why was my content removed?', answer: 'Content may be removed if it violates community guidelines. Check your notifications for details or submit an appeal.', categoryId: 'safety-privacy', isFeatured: false },
    { question: 'How do I contact support?', answer: 'Go to Settings > Help & Support > Contact Us or use the Support Inbox for direct communication.', categoryId: 'technical', isFeatured: true },
    { question: 'What payment methods are accepted?', answer: 'We accept credit/debit cards, Instant EFT, Mobicred, SnapScan, Zapper, and Samsung Pay via PayFast.', categoryId: 'payments', isFeatured: false },
    { question: 'How do I delete my account?', answer: 'Go to Settings > Account > Delete Account. This is permanent and data will be removed within 30 days.', categoryId: 'account-profile', isFeatured: false },
    { question: 'Why are my notifications not working?', answer: 'Check device notification settings, ensure notifications are enabled in app settings, and disable battery optimization for RabitChat.', categoryId: 'technical', isFeatured: false },
    { question: 'How do gifts affect net worth?', answer: 'Gifts you receive add to your net worth at full value. Mall purchases give a 10x net worth multiplier.', categoryId: 'rabit-coins', isFeatured: false },
  ];

  const systemStatusItems = [
    { component: 'Core Services', status: 'OPERATIONAL', description: 'Authentication, profiles, and core features' },
    { component: 'Feed & Discovery', status: 'OPERATIONAL', description: 'Posts, reels, and content discovery' },
    { component: 'Messaging', status: 'OPERATIONAL', description: 'Direct messages and group chats' },
    { component: 'Rabit Coins', status: 'OPERATIONAL', description: 'Virtual currency and gifting' },
    { component: 'Luxury Mall', status: 'OPERATIONAL', description: 'Marketplace and purchases' },
    { component: 'Gossip System', status: 'OPERATIONAL', description: 'Anonymous gossip (South Africa)' },
    { component: 'Payment Processing', status: 'OPERATIONAL', description: 'PayFast integration and withdrawals' },
    { component: 'Push Notifications', status: 'OPERATIONAL', description: 'Mobile notifications' },
    { component: 'Media Upload', status: 'OPERATIONAL', description: 'Photo, video, and file uploads' },
  ];

  const knownIssuesList = [
    { title: 'Slow feed loading on Android 13', description: 'Some Android 13 devices experience slower feed loading times. We are optimizing performance.', status: 'INVESTIGATING', affectedPlatforms: ['Android'], workaround: 'Clear app cache and restart the app.', priority: 'MEDIUM' },
  ];

  const changelogList = [
    { version: '2.5.0', title: 'Help Center Launch', description: 'Comprehensive Help Center with AI-powered search, support inbox, and instant answers.', features: ['AI Smart Assistant', 'Support Inbox', 'Article Library', 'FAQ System', 'System Status'], isPublished: true },
    { version: '2.4.0', title: 'Camera Effects Update', description: 'New photo filters, stickers, text overlays, and drawing tools.', features: ['11 photo filters', 'Sticker overlays', 'Text styling', 'Drawing tools'], isPublished: true },
    { version: '2.3.0', title: 'Enhanced Messaging', description: 'Voice notes, file attachments, reactions, and delete for everyone.', features: ['Voice notes up to 3 min', 'File attachments 100MB', 'Message reactions', 'Delete for everyone'], isPublished: true },
    { version: '2.2.0', title: 'Rabit Coins Economy', description: 'Complete virtual currency system with gifts, staking, and withdrawals.', features: ['Coin bundles', '8 gift types', 'Gift staking', 'Creator payouts'], isPublished: true },
    { version: '2.1.0', title: 'Luxury Mall Launch', description: '500+ premium products available for purchase with Rabit Coins.', features: ['Product catalog', 'Coin payments', 'Order tracking', 'Net worth boost'], isPublished: true },
  ];

  const safetyResourcesList = [
    { title: 'Reporting Harassment', description: 'If you\'re being harassed, block the user immediately and report them. Go to their profile > Menu > Report > Harassment.', category: 'HARASSMENT', sortOrder: 1 },
    { title: 'Account Security', description: 'Enable two-factor authentication, use a strong password, and never share your login details with anyone.', category: 'SECURITY', sortOrder: 2 },
    { title: 'Online Scams', description: 'Never send money to strangers or click suspicious links. RabitChat will never ask for your password.', category: 'SCAMS', sortOrder: 3 },
    { title: 'Mental Health Resources', description: 'If you\'re struggling, please reach out to SADAG (South African Depression and Anxiety Group).', category: 'CRISIS', contactNumber: '0800 567 567', sortOrder: 4 },
    { title: 'Privacy Protection', description: 'Control who sees your content through privacy settings. Never share personal information publicly.', category: 'PRIVACY', sortOrder: 5 },
    { title: 'Emergency SOS', description: 'If you\'re in immediate danger, contact local emergency services.', category: 'CRISIS', contactNumber: 'Police: 10111, Ambulance: 10177', isEmergency: true, sortOrder: 0 },
  ];

  const cannedList = [
    { title: 'Welcome Response', shortcut: '/welcome', content: 'Thank you for contacting RabitChat support! I\'m here to help. Could you please describe your issue in more detail?', category: 'OTHER' },
    { title: 'Account Recovery', shortcut: '/recovery', content: 'To recover your account, please provide the email or phone number associated with it. We\'ll send you a verification code.', category: 'ACCOUNT' },
    { title: 'Coin Purchase Issue', shortcut: '/coinissue', content: 'I understand you\'re having trouble with a coin purchase. Please provide the transaction ID and payment method used so I can investigate.', category: 'PAYMENT' },
    { title: 'Withdrawal Pending', shortcut: '/withdraw', content: 'Withdrawals are processed within 1-3 business days after admin approval. Bank transfers take an additional 2-5 days. Is there anything else I can help with?', category: 'WITHDRAWAL' },
    { title: 'Bug Report Thanks', shortcut: '/bugthx', content: 'Thank you for reporting this bug! I\'ve forwarded it to our development team. We appreciate your help in improving RabitChat.', category: 'TECHNICAL' },
    { title: 'Feature Noted', shortcut: '/feature', content: 'Thank you for this feature suggestion! I\'ve added it to our feedback system where our product team reviews all suggestions regularly.', category: 'OTHER' },
    { title: 'Verification Help', shortcut: '/verify', content: 'To get verified, you need: 1000+ followers, 30+ days account age, and submit valid ID. Go to Settings > Verification to apply.', category: 'ACCOUNT' },
    { title: 'Closing Ticket', shortcut: '/close', content: 'I\'m glad I could help! I\'m closing this ticket now. If you have any other questions, feel free to open a new ticket anytime.', category: 'OTHER' },
  ];

  try {
    console.log('Inserting categories...');
    for (const cat of categories) {
      await pool.query(
        `INSERT INTO help_categories (id, name, slug, description, icon, color, sort_order, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, true) 
         ON CONFLICT (id) DO UPDATE SET name = $2, slug = $3, description = $4, icon = $5, color = $6, sort_order = $7`,
        [cat.id, cat.name, cat.slug, cat.description, cat.icon, cat.color, cat.sortOrder]
      );
    }
    console.log(`Inserted ${categories.length} categories`);

    console.log('Inserting subcategories...');
    for (const sub of subcategories) {
      await pool.query(
        `INSERT INTO help_categories (id, name, slug, parent_id, sort_order, is_active) 
         VALUES ($1, $2, $3, $4, $5, true) 
         ON CONFLICT (id) DO UPDATE SET name = $2, slug = $3, parent_id = $4, sort_order = $5`,
        [sub.id, sub.name, sub.slug, sub.parentId, sub.sortOrder]
      );
    }
    console.log(`Inserted ${subcategories.length} subcategories`);

    console.log('Inserting articles...');
    for (const art of articles) {
      await pool.query(
        `INSERT INTO help_articles (category_id, title, slug, summary, content, view_count, helpful_count, status, published_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'PUBLISHED', NOW()) 
         ON CONFLICT (slug) DO UPDATE SET title = $2, summary = $4, content = $5, view_count = $6, helpful_count = $7`,
        [art.categoryId, art.title, art.slug, art.summary, art.content, art.viewCount, art.helpfulCount]
      );
    }
    console.log(`Inserted ${articles.length} articles`);

    console.log('Inserting FAQs...');
    for (const faq of faqs) {
      await pool.query(
        `INSERT INTO help_faqs (question, answer, category_id, is_featured, is_active) 
         VALUES ($1, $2, $3, $4, true) 
         ON CONFLICT DO NOTHING`,
        [faq.question, faq.answer, faq.categoryId, faq.isFeatured]
      );
    }
    console.log(`Inserted ${faqs.length} FAQs`);

    console.log('Inserting system status...');
    for (const status of systemStatusItems) {
      await pool.query(
        `INSERT INTO system_status (component, status, description) 
         VALUES ($1, $2, $3) 
         ON CONFLICT DO NOTHING`,
        [status.component, status.status, status.description]
      );
    }
    console.log(`Inserted ${systemStatusItems.length} status items`);

    console.log('Inserting known issues...');
    for (const issue of knownIssuesList) {
      await pool.query(
        `INSERT INTO known_issues (title, description, status, affected_platforms, workaround, priority) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT DO NOTHING`,
        [issue.title, issue.description, issue.status, JSON.stringify(issue.affectedPlatforms), issue.workaround, issue.priority]
      );
    }
    console.log(`Inserted ${knownIssuesList.length} known issues`);

    console.log('Inserting changelog...');
    for (const log of changelogList) {
      await pool.query(
        `INSERT INTO app_changelog (version, title, description, features, is_published, published_at) 
         VALUES ($1, $2, $3, $4, $5, NOW()) 
         ON CONFLICT DO NOTHING`,
        [log.version, log.title, log.description, JSON.stringify(log.features), log.isPublished]
      );
    }
    console.log(`Inserted ${changelogList.length} changelog entries`);

    console.log('Inserting safety resources...');
    for (const resource of safetyResourcesList) {
      await pool.query(
        `INSERT INTO safety_resources (title, description, category, contact_number, is_emergency, sort_order) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT DO NOTHING`,
        [resource.title, resource.description, resource.category, resource.contactNumber || null, resource.isEmergency || false, resource.sortOrder]
      );
    }
    console.log(`Inserted ${safetyResourcesList.length} safety resources`);

    console.log('Inserting canned responses...');
    for (const cann of cannedList) {
      await pool.query(
        `INSERT INTO canned_responses (title, shortcut, content, category, is_active) 
         VALUES ($1, $2, $3, $4, true) 
         ON CONFLICT DO NOTHING`,
        [cann.title, cann.shortcut, cann.content, cann.category]
      );
    }
    console.log(`Inserted ${cannedList.length} canned responses`);

    const totalItems = categories.length + subcategories.length + articles.length + faqs.length + 
                       systemStatusItems.length + knownIssuesList.length + changelogList.length + 
                       safetyResourcesList.length + cannedList.length;
    console.log(`\nHelp Center seed completed! ${totalItems} total items seeded.`);
    console.log(`${articles.length} comprehensive help articles covering all app features`);
    
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  }
}

seedHelpCenter().catch(console.error);
