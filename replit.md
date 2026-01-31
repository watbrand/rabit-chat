# RabitChat

## Overview
RabitChat is a Forbes-style mobile social network application targeting high-net-worth individuals and influencers. It provides a luxurious digital environment for connection, content sharing, and real-time communication, featuring a glassmorphism UI, user badges reflecting net worth, and a comprehensive suite of social networking functionalities. The project's core purpose is to deliver a premium, engaging social experience, with a unique anonymous gossip system tailored for the South African market.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (January 31, 2026)

**Comprehensive Issue Fix - 200+ Issues Resolved:**

**Phase 1: UI Layout Fixes (100+ issues)**
- Fixed FlatList scrollIndicatorInsets across 30+ screens (ChatScreen, admin screens, help screens, settings screens)
- Fixed keyboard handling with KeyboardAvoidingView from react-native-keyboard-controller (not react-native)
- Fixed ScrollView contentContainerStyle padding using proper headerHeight + Spacing.md for top, insets.bottom + Spacing.lg for bottom
- Fixed missing safe area insets (GossipDMChatScreen, AdminEconomyScreen, WalletScreen, FeedScreen)
- Replaced hardcoded padding values with dynamic Spacing constants
- Tab screens now use useBottomTabBarHeight() for proper bottom padding
- Gossip components fixed (AnonymousGossipTab, GossipDMChat, GossipDMList, GossipLeaderboard, GossipRepliesModal)

**Phase 2: Chat/Messaging Fixes (35 issues)**
- WebSocket reconnection with exponential backoff (max 5 attempts, 10s max delay)
- Message length validation (max 2000 characters)
- File size validation (max 25MB)
- Typing indicator cleanup on component unmount
- User-facing error Alerts for WebSocket auth failure and mutation errors
- Connection status indicator (isConnected state)

**Phase 3: Gossip DM Fixes (28 issues)**
- Message deletion with confirmation
- Block/report functionality with reason selection
- Real-time sync with WebSocket reconnection
- Search functionality for DM conversations
- Empty states with helpful messaging
- Content length validation (2000 chars for posts, 1000 chars for replies)

**Phase 4: Wallet/Economy Fixes (42 issues)**
- Empty catch blocks replaced with proper error handling
- Confirmation dialogs for purchases, withdrawals, staking
- Amount validation (positive numbers, balance checks)
- Balance sync after transactions with query invalidation
- Loading states for all mutations

**Phase 5: Groups/Events Fixes (32 issues)**
- Leave group confirmation dialog
- Error handling for all mutations (create, join, leave, delete)
- Validation for group creation (name 3-50 chars, description max 500 chars)
- Event editing functionality with validation
- Event deletion with confirmation
- RSVP sync with proper query invalidation
- Event validation (title 3-100 chars, description max 1000 chars)

**Phase 6: Settings/Security Fixes (48 issues)**
- 2FA backup codes display and regeneration
- Copy backup codes to clipboard functionality
- Session management with logout all sessions
- Password strength indicator with requirements checklist
- Login activity screen with session termination
- Trusted devices screen with trust level management
- Profile field validation (displayName, bio, location, pronouns, avatar)

**Phase 7-8: Backend Improvements**
- 332+ admin endpoints for complete platform control
- Zod validation schemas for messages, groups, events, wallet endpoints
- Rate limiting on sensitive endpoints:
  - Login: 5 attempts per 15 minutes per IP
  - Password reset: 3 requests per 15 minutes per IP
  - Registration: 10 per hour per IP
  - Messages: 60 per minute per user
  - Wallet: 10 transactions per minute per user

**Phase 9-10: Data Sync & Cross-Cutting**
- Optimistic updates for likes, bookmarks, follows
- Proper cache invalidation with queryClient.invalidateQueries()
- Error states with retry buttons across all screens
- Loading states with InlineLoader components
- Pull-to-refresh throttling (2 second cooldown)

## System Architecture

### Frontend
-   **Framework**: Expo SDK 54 with React Native 0.81 (iOS, Android, web).
-   **Navigation**: React Navigation v7 with a nested tab structure.
-   **State Management**: TanStack React Query for server state, React Context for local state.
-   **Styling**: Dual-mode luxury glassmorphism theme (light and dark) with Poppins Google Font, Reanimated animations, and custom premium UI components.
-   **Custom Animation System**: Brand-consistent animations using Reanimated, including various loading states, error/success indicators, empty states, and skeleton loaders.

### Backend
-   **Server**: Express.js with TypeScript.
-   **Authentication**: Session-based using `express-session`, PostgreSQL, and `bcrypt`.
-   **Real-time**: WebSocket server (`ws`) for live chat.
-   **API Design**: RESTful endpoints (`/api/`) with JSON.
-   **Security**: Rate limiting, Zod validation, Helmet, enhanced cookie security.
-   **Access Control**: Role-Based Access Control (RBAC) and a centralized policy engine.

### Data Storage
-   **Database**: PostgreSQL with Drizzle ORM.
-   **Schema**: Extensive schema supporting core social features, virtual currency, stories, live streaming, groups, events, and more.

### Key Design Patterns
-   **Path Aliases**: `@/` for client, `@shared/` for shared modules.
-   **Shared Schema**: Centralized database schema and type definitions.
-   **API Client**: Consistent `apiRequest` helper.
-   **Error Handling**: React error boundaries and global API error handling.

### Core Features
-   **User Management**: Authentication, profiles with net worth/influence scores, blocking, and verified badges.
-   **Multi-Media Posts**: Support for TEXT, PHOTO, VIDEO, VOICE posts with visibility settings.
-   **Social Feed**: Policy-enforced visibility, follow system, user blocking, and an advanced Elite Feed Algorithm.
-   **Gossip System (v2)**: Anonymous platform for South Africa with true anonymity, location hierarchy, dynamic aliases, various post types, reactions, "Tea Meter" engagement scoring, nested comments, accuracy voting, trending algorithms, anonymous DMs, gamified "Tea Spiller" levels, hood rivalries, awards, weekly spill sessions, and robust moderation.
-   **Rich Messaging System**: Real-time messaging supporting multiple message types (TEXT, PHOTO, VIDEO, FILE, VOICE, LINK), voice notes, file attachments, link previews, reactions, replies, message deletion, typing indicators, delivery status, message search, conversation settings, and E2E encryption.
-   **Camera & Media Effects**: Instagram/TikTok-style camera with photo filters, stickers, text overlays, drawing tools, and video speed controls.
-   **Stories and Reels**: Ephemeral photo/video stories and TikTok-style vertical video reels.
-   **Moderation & Admin Tools**: Content reporting, admin review panel, RBAC management, feature flags, analytics, and user verification workflows accessible via a comprehensive browser-based admin panel.
-   **Rabit Coins Virtual Currency System**: TikTok-style virtual currency with wallets, purchasable bundles, gift types, mall integration, net worth system, daily rewards, wealth clubs, creator monetization, achievements, platform battles, and emergency economic controls.
-   **Luxury Marketplace (Mall)**: Premium marketplace with luxury items priced in Rabit Coins.
-   **Discover Screen**: Features tabs for New People, Reels, Voices, Gossip, and People recommendations with an advanced discovery algorithm.
-   **Security & Privacy**: Login session tracking, trusted devices, restricted/muted accounts, keyword filters, and granular notification preferences.
-   **Onboarding System**: A 7-step onboarding flow including interest selection, industry selection, net worth tier selection, privacy setup, and suggested users.
-   **Interest-Based Algorithm**: Feed algorithm enhanced with affinity scoring across 15 luxury categories.
-   **Coaching Marks**: First-session tutorial overlays.
-   **AI Content Analysis**: Gemini-powered content categorization for posts.

## External Dependencies
-   **Database**: PostgreSQL
-   **Real-time Communication**: `ws`
-   **Authentication**: `bcrypt`, `express-session`, `connect-pg-simple`
-   **ORM**: Drizzle ORM
-   **Validation**: Zod
-   **Security**: `express-rate-limit`, `helmet`
-   **UI/UX**: Expo, React Native, React Navigation, Reanimated, TanStack React Query
-   **Media Storage**: Cloudinary (for images, videos, audio with optimized large file upload support)
-   **AI Integration**: OpenAI (text generation), Gemini (content moderation, image analysis, summarization)
-   **Email**: Resend
-   **SMS**: Twilio
-   **Push Notifications**: Expo Push Service