# RabitChat Production Readiness Plan

**Version:** 1.0.0 MVP  
**Date:** January 14, 2026  
**Status:** MVP Frozen - Production Planning

## Current State

The RabitChat MVP is feature-complete and stable. All core user journeys have been validated:
- Authentication (signup, login, logout)
- Social feed (posts, likes, comments)
- Follow system
- User discovery and search
- Real-time 1-on-1 chat
- Account management (profile, deletion)

## Production Readiness Checklist

### Security (Priority: High)

- [ ] **Rate Limiting** - Add express-rate-limit to prevent abuse
  - Login/signup: 5 attempts per 15 minutes
  - API endpoints: 100 requests per minute per user
  - WebSocket connections: 1 per user
- [ ] **Input Validation Hardening** - Add length limits and sanitization
  - Username: 3-30 characters, alphanumeric + underscore
  - Display name: 1-50 characters
  - Post content: 1-5000 characters
  - Comment content: 1-1000 characters
  - Message content: 1-2000 characters
- [ ] **CORS Configuration** - Verify production domains are whitelisted
- [ ] **Session Security** - Verify secure cookie settings for production
  - `secure: true` in production
  - `sameSite: 'strict'`
  - Appropriate maxAge
- [ ] **SQL Injection** - Verify all queries use parameterized statements (Drizzle ORM handles this)
- [ ] **XSS Prevention** - Verify React's default escaping is intact

### Performance (Priority: Medium)

- [ ] **Pagination** - Implement cursor-based pagination for:
  - Feed endpoint (GET /api/posts/feed)
  - User posts (GET /api/users/:id/posts)
  - Search results (GET /api/posts/search, /api/users/search)
  - Conversation messages (GET /api/conversations/:id/messages)
- [ ] **Database Indexes** - Add indexes for common queries:
  - posts.createdAt (for feed ordering)
  - posts.authorId (for user posts)
  - follows.followerId, follows.followingId (for follow queries)
  - messages.conversationId, messages.createdAt (for message ordering)
- [ ] **Caching** - Consider Redis for:
  - Session storage (currently PostgreSQL)
  - Frequently accessed user profiles
  - Follower/following counts
- [ ] **Connection Pooling** - Verify pg connection pool settings

### Reliability (Priority: High)

- [ ] **Error Monitoring** - Integrate Sentry for error tracking
  - Frontend: @sentry/react-native
  - Backend: @sentry/node
- [ ] **Health Checks** - Add /health endpoint for load balancer
- [ ] **Graceful Shutdown** - Handle SIGTERM for WebSocket cleanup
- [ ] **Database Backups** - Enable automated backups (Replit handles for deployed apps)
- [ ] **Log Aggregation** - Consider structured logging with log levels

### Authentication Enhancements (Priority: Medium)

- [ ] **Email Verification** - Verify email before activation
- [ ] **Password Reset** - Forgot password flow with email
- [ ] **Password Requirements** - Enforce minimum complexity
- [ ] **Account Lockout** - Lock after N failed login attempts
- [ ] **Session Management** - Allow users to view/revoke sessions

### Feature Enhancements (Priority: Low)

- [ ] **Image Upload** - Posts and avatar images
- [ ] **Push Notifications** - Expo push notifications for messages
- [ ] **Read Receipts** - Show when messages are read
- [ ] **Typing Indicators** - Real-time typing status
- [ ] **User Blocking** - Block users from messaging/following

### DevOps (Priority: Medium)

- [ ] **Environment Separation** - Verify dev/prod database separation
- [ ] **CI/CD Pipeline** - Automated testing before deploy
- [ ] **Rollback Strategy** - Document rollback procedures
- [ ] **Load Testing** - Test with expected user load
- [ ] **Monitoring Dashboard** - Uptime and performance metrics

## Implementation Priority Order

### Phase 1: Critical Security (Before public launch)
1. Rate limiting
2. Input validation hardening
3. Error monitoring (Sentry)
4. Health check endpoint

### Phase 2: Scale Preparation
1. Pagination for all list endpoints
2. Database indexes
3. Connection pool optimization

### Phase 3: User Experience
1. Email verification
2. Password reset
3. Push notifications

### Phase 4: Advanced Features
1. Image upload
2. Read receipts
3. Typing indicators

## Rollback Strategy

### Using Replit Checkpoints
1. Navigate to the Replit project
2. Click the three-dot menu → History
3. Find the checkpoint labeled "release: rabitchat mvp stable" or the publish checkpoint
4. Click "Restore" to rollback code

### Database Rollback
1. Replit deployments maintain database snapshots
2. Contact Replit support for database restoration if needed
3. Document any schema changes before applying

### Manual Backup Instructions
Before major changes:
1. Export database: Use Drizzle Studio or pg_dump
2. Fork the Repl as a backup copy
3. Document the current state in RELEASE.md

## Dependencies

Current production dependencies (verify versions before upgrade):
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- Expo SDK 54 / React Native 0.81
- WebSocket (ws) for real-time chat
- bcrypt for password hashing
- express-session with connect-pg-simple

## Sign-off

- [ ] Security review completed
- [ ] Performance benchmarks acceptable
- [ ] Error monitoring active
- [ ] Rollback tested
- [ ] Documentation updated
