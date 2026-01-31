# RabitChat

## Overview
RabitChat is a Forbes-style mobile social network application targeting high-net-worth individuals and influencers. It provides a luxurious digital environment for connection, content sharing, and real-time communication, featuring a glassmorphism UI, user badges reflecting net worth, and a comprehensive suite of social networking functionalities. The project's core purpose is to deliver a premium, engaging social experience, with a unique anonymous gossip system tailored for the South African market.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes (January 31, 2026)
**Major Backend API Completion - 60+ Endpoints Added:**
- **Subscriptions/Super Follows**: 9 endpoints for creator subscriptions, tiers, subscriber management
- **Check-In System**: 7 endpoints for location updates, venue discovery, nearby users
- **Digital Wellness**: 3 endpoints for focus mode settings, usage statistics
- **Chat Folders**: 5 endpoints for organizing conversations into folders
- **Social Features**: 7 endpoints for pokes, BFF status, close friends management
- **Broadcast Channels**: 9 endpoints for channel creation, subscriptions, messaging
- **Webhooks/Developer Tools**: 6 endpoints for webhook management and delivery history
- **Groups**: 6 endpoints for group CRUD, join/leave, member management
- **Events**: 4 endpoints for event CRUD, RSVP functionality
- **Content Features**: 10 endpoints for threads, duets/stitches, AR filters
- **Privacy Controls**: 7 endpoints for keyword filters, muted/restricted accounts
- **AI Features**: 5 endpoints for AI avatars and translations
- **Live Streams**: 7 endpoints for stream viewing, comments, reactions
- **Algorithm Settings**: Added mutation and UI for updating feed preferences
- **Fixed 2FA Bug**: All 6 2FA endpoints now correctly use `userSettings` table instead of `users` table

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