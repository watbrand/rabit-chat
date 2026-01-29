# RabitChat

## Overview
RabitChat is a Forbes-style mobile social network application designed to celebrate wealth and influence. It offers a luxurious digital space for users to connect, share content, and communicate in real-time. Key features include a distinctive glassmorphism UI with purple accents, user badges indicating net worth and influence scores, and comprehensive social networking functionalities like feeds, profiles, following, and chat. The project aims to create a premium, engaging social experience for high-net-worth individuals and influencers, with a specific focus on the South African market for its anonymous gossip system.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
-   **Framework**: Expo SDK 54 with React Native 0.81 (iOS, Android, web support).
-   **Navigation**: React Navigation v7 with a nested structure and main tabs (Home, Discover, Mall, Messages, Profile).
-   **State Management**: TanStack React Query for server state, React Context for authentication and audio playback.
-   **Styling**: Dual-mode luxury glassmorphism theme with Poppins Google Font, Reanimated animations, and custom premium UI components (e.g., Avatar, PostCard, ChatBubble, animated UserBadge, GlassButton, GlassInput, glassmorphic Card).
    - **Light Mode**: Purple/pink/blue gradient background with animated floating orbs, white frosted glass cards with blur effects (70% opacity), and soft shadows.
    - **Dark Mode**: Deep dark backgrounds (rgba(26, 26, 36)) with purple accent glows and subtle glass effects.
    - **GradientBackground Component**: Renders animated gradient orbs in light mode, solid dark in dark mode.
-   **Custom Animation System**: Complete brand-consistent animation system using Reanimated (no Lottie - Expo Go compatible):
    - **RabitLogo**: SVG logo component with 3 variants (full, simple, minimal) and brand colors (purple/gold rabbit + chat bubble)
    - **AnimatedLogo**: Base animation component with 6 presets: pulse, bounce, spin, shake, loading, glow
    - **LoadingIndicator**: Replaces all ActivityIndicator with branded pulsing logo (sizes: small/medium/large/fullScreen)
    - **InlineLoader**: Compact spinning logo for inline button states
    - **ErrorState**: Shaking logo with red glow, contextual error messages, and retry button
    - **SuccessState**: Checkmark celebration with confetti-like animation
    - **EmptyState**: Floating logo with 14+ contextual messages (posts, messages, followers, notifications, etc.)
    - **BrandShimmer**: Purple-gradient skeleton loader for loading content placeholders
    - **SkeletonCard/SkeletonAvatar/SkeletonText**: Pre-built skeleton components for common patterns
    - **Accessibility**: All animations respect reduced-motion preferences
    - **Usage**: Import from `@/components/animations` (e.g., `import { LoadingIndicator, EmptyState } from "@/components/animations"`)

### Backend
-   **Server**: Express.js with TypeScript, running on port 5000.
-   **Authentication**: Session-based using `express-session` and PostgreSQL, with `bcrypt` for password hashing.
-   **Real-time**: WebSocket server (`ws`) for live chat messaging.
-   **API Design**: RESTful endpoints under `/api/`, using JSON.
-   **Security**: Rate limiting, Zod validation, Helmet security headers, enhanced cookie security.
-   **Access Control**: Role-Based Access Control (RBAC) system with roles (SUPER_ADMIN, ADMIN, MODERATOR, SUPPORT) and granular permissions.
-   **Policy Engine**: Centralized privacy and access control.

### Data Storage
-   **Database**: PostgreSQL with Drizzle ORM.
-   **Schema**: Comprehensive schema with 100+ tables including core social features, stories, virtual currency, live streaming, groups, events, subscriptions, broadcast channels, enhanced reactions, location features, group chats, video calling, advanced messaging, security, content features, social features, discovery algorithm, usage/wellness, AI features, developer tools, and admin functionalities.

### Key Design Patterns
-   **Path Aliases**: `@/` for client, `@shared/` for shared modules.
-   **Shared Schema**: Centralized database schema and type definitions.
-   **API Client**: Consistent `apiRequest` helper.
-   **Error Handling**: React error boundaries and global API error handler.
-   **Cross-platform Compatibility**: `Platform.select` for styling differences.

### Core Features
-   **User Management**: Authentication, profiles with net worth/influence scores, blocking, account deletion, and verified badges.
-   **Multi-Media Posts**: Support for TEXT, PHOTO, VIDEO, VOICE posts with visibility settings.
-   **Social Feed**: Policy-enforced visibility, follow system, user blocking, and an advanced Elite Feed Algorithm prioritizing high-net-worth individuals, verified users, and engagement velocity.
-   **Gossip System (v2)**: South Africa-only, zero-identity anonymous gossip with location-based segmentation, GPS-based posting, "Tea Meter" scoring, animated reactions, and 24-hour auto-delete "Whisper Mode."
-   **Rich Messaging System**: Full-featured real-time messaging with:
    - **Message Types**: TEXT, PHOTO, VIDEO, FILE, VOICE, LINK with rich rendering
    - **Voice Notes**: Hold-to-record voice messages (up to 3 minutes) with waveform visualization and speed control (1x, 1.5x, 2x)
    - **File Attachments**: Documents, PDFs, photos, videos up to 100MB with thumbnails and download
    - **Link Previews**: Automatic OpenGraph metadata fetching for rich URL cards
    - **Message Reactions**: 6 quick reactions (Like, Love, Laugh, Wow, Sad, Angry)
    - **Reply/Quote**: Reply to specific messages with preview
    - **Delete Messages**: Delete for self or delete for everyone (within 1 hour)
    - **Typing Indicators**: Real-time "User is typing..." with animated dots
    - **Delivery Status**: Sent, Delivered, Read checkmarks with timestamps
    - **Message Search**: Full-text search within conversations with highlighting
    - **Conversation Settings**: Mute (with duration), pin, archive, custom names
    - **Push Notifications**: Expo Push for new messages, files, voice notes
    - **E2E Encryption**: End-to-end encryption with public/private key pairs (client-side encryption)
-   **Camera & Media Effects**: Instagram/TikTok-style camera with:
    - **CameraScreen**: Full-featured camera with photo/video toggle, flip camera, flash, zoom
    - **Photo Filters**: 11 preset color filters (Vivid, Warm, Cool, Vintage, Noir, etc.) with real-time preview
    - **Stickers**: Drag-and-resize sticker overlays with category tabs (Emotes, Reactions, Decorative, Text)
    - **Text Overlays**: Multiple fonts (Poppins, Montserrat, Playfair, Space Mono, Dancing Script), sizes, colors, alignment
    - **Drawing Tool**: Freehand drawing with color palette, brush sizes, eraser, undo
    - **Video Speed Controls**: 0.5x, 1x, 1.5x, 2x, 3x playback speed adjustment
-   **Stories System**: Instagram-style ephemeral photo/video content with shared posts.
-   **Reels**: TikTok-style vertical video player.
-   **Moderation & Admin Tools**: Content reporting, admin review panel, RBAC management, feature flags, analytics dashboard, audit logs, and user verification workflow.
-   **Browser-Based Admin Panel**: Comprehensive admin panel at `/admin` with 24 sections including Dashboard, Users, Posts, Reports, Verification, Mall (503 products, 107 categories), Analytics, Feature Flags, Audit Log, Messages, Groups, Live Streams, Wallet (coin economy management), Gossip, Stories, User Wealth, Broadcasts, Events, Subscriptions, Hashtags, Blocks/Mutes, Reels, and Discovery. See ADMIN_GUIDE.md and ADMIN_GAP_MAP.md for full documentation. Login: admin@rabitchat.com / AdminPass123!
-   **Rabit Coins Virtual Currency System**: Complete TikTok-style virtual currency and gifting system:
    - **Wallets**: User coin wallets with balance, lifetime earned/spent tracking, freeze capability
    - **Coin Bundles**: 6 purchasable bundles from R10 (100 coins) to R3500 (50,000+ bonus coins)
    - **Gift Types**: 8 gift tiers from Rose (10 coins) to Private Jet (500,000 coins) with net worth transfer
    - **Mall Integration**: All 503 mall items now priced in Rabit Coins (1 Rand = 1 coin)
    - **Net Worth System**: 10x multiplier on mall purchases, direct transfer for gifts
    - **Daily Rewards**: Streak-based free coin rewards
    - **Wealth Clubs**: 5 tiers (Bronze, Silver, Gold, Platinum, Diamond) with exclusive perks based on net worth
    - **Gift Staking**: Lock gifts for bonus coin returns over time
    - **Creator Monetization**: Dashboard with earnings tracking, 50% platform fee on withdrawals
    - **Achievements System**: Gamification with coin rewards for milestones
    - **Platform Battles**: Competitive gifting with 20% platform fee
    - **Admin Controls**: Full wallet management, gift types, coin bundles, economy dashboard, emergency controls
    - **Emergency Economy Controls**: 6 toggle switches in admin panel to instantly pause features:
      - `withdrawals_enabled`: Pause/resume all user withdrawals
      - `purchases_enabled`: Pause/resume coin purchases
      - `gifts_enabled`: Pause/resume gift sending
      - `staking_enabled`: Pause/resume gift staking
      - `battles_enabled`: Pause/resume platform battles
      - `daily_rewards_enabled`: Pause/resume daily reward claims
    - **KYC & Withdrawals**: Bank account verification, POPIA/FICA compliance, PayFast payouts with admin approval
-   **Luxury Marketplace (Mall)**: Premium marketplace with luxury items priced in Rabit Coins, purchase flow, and net worth updates (10x multiplier).
-   **Discover Screen**: Tabs for New People, Reels, Voices, Gossip, and People recommendations.
-   **Advanced Discovery Algorithm**: Prioritizes watch time, tracks rewatches, scores engagement quality, detects skips, builds creator affinity and interest graphs, utilizes viral velocity detection, session-based rotation, content fatigue management, and a "Not Interested" system.
-   **Security & Privacy**: Login session tracking, trusted devices, restricted accounts, muted accounts, keyword filters, and granular notification preferences.
-   **Onboarding System**: Complete 7-step onboarding flow:
    - ContentPreviewScreen: Shows 5 trending posts before auth with "Join the Elite" overlay
    - InterestSelectionScreen: Animated grid with 15 luxury interest categories
    - IndustrySelectionScreen: 20 industry/profession options for networking
    - NetWorthTierScreen: 5 wealth tiers (Building, Silver, Gold, Platinum, Diamond)
    - PrivacySetupScreen: Net worth and profile visibility controls
    - SuggestedUsersScreen: Interest and industry-based user recommendations
    - WelcomeCompleteScreen: Personalized welcome with elite score and profile progress
-   **Interest-Based Algorithm**: Feed algorithm enhanced with interest affinity scoring:
    - 15 luxury categories: Luxury Lifestyle, Investments, Real Estate, Yachts & Aviation, Fine Dining, Fashion, Art, Exotic Cars, Watches, Tech, Wellness, Entertainment, Sports, Philanthropy, Crypto
    - Affinity scores (1-10) weighted into feed scoring with 0.1-1.0x boost per category
    - Maximum 2x total interest boost cap
    - Algorithm transparency panel in Settings showing interests, affinity scores, and personalization level
-   **Coaching Marks**: First-session tutorial overlays guiding users through key features (stories, compose, feed algorithm)
-   **AI Content Analysis**: Gemini-powered content categorization for posts (POST /api/content/analyze)

## External Dependencies
-   **Database**: PostgreSQL
-   **Real-time Communication**: `ws` (WebSocket library)
-   **Authentication**: `bcrypt`, `express-session`, `connect-pg-simple`
-   **ORM**: Drizzle ORM
-   **Validation**: Zod
-   **Security**: `express-rate-limit`, `helmet`
-   **UI/UX**: Expo, React Native, React Navigation, Reanimated, TanStack React Query
-   **Media Storage**: Cloudinary (for images, videos, and audio) with optimized large file upload support:
    - Images: up to 100MB
    - Videos: up to 2GB with streaming upload (disk storage + fs.createReadStream)
    - Audio: up to 100MB
    - Server timeouts configured for long uploads (10-15 minutes)
    - Automatic temp file cleanup (every 30 minutes)
    - Frontend pre-validation to save bandwidth
-   **AI Integration**: OpenAI (text generation, mall product descriptions), Gemini (content moderation, image analysis, language detection, summarization)
-   **Email**: Resend for transactional emails.
-   **SMS**: Twilio (for phone verification and notifications).
-   **Push Notifications**: Expo Push Service (for iOS and Android notifications).

## Production Infrastructure

### API Usage Monitoring
-   **Tracking**: Daily API usage tracking for Cloudinary, Resend, OpenAI, Gemini, Twilio, PayFast, Expo Push
-   **Alerts**: Configurable thresholds for daily limits, cost limits, and error rates
-   **Admin Dashboard**: View usage summaries and alert history at `/api/admin/api-usage/*`

### AWS Deployment Ready
-   **Dockerfile**: Multi-stage production build with health checks
-   **docker-compose.yml**: Local testing with Redis for sessions
-   **AWS_DEPLOYMENT.md**: Complete guide for ECS/Fargate deployment with:
    - RDS PostgreSQL setup
    - ElastiCache Redis configuration
    - Auto-scaling for 50k+ users
    - Load balancer and CloudFront CDN
    - Secrets Manager integration
    - Estimated costs: ~$435/month base

### Rate Limiting
-   **API Limiter**: 500 requests/minute for general endpoints
-   **Feed Limiter**: 1000 requests/minute for read-heavy endpoints (posts, discover, reels, stories, users)
-   **Debounced Analytics**: Frontend debouncing on view tracking to prevent rate limit issues