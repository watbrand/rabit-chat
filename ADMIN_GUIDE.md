# RabitChat Admin Panel Guide

## Overview
The RabitChat admin panel provides comprehensive management tools for the luxury social network. It features a premium glassmorphism design matching the mobile app aesthetic.

## Accessing the Admin Panel

### URL
- **Development**: `http://localhost:5000/admin`
- **Production**: `https://your-domain.replit.app/admin`

### Login Credentials
- **Email**: `admin@rabitchat.com`
- **Password**: `AdminPass123!`

### Authentication
- Session-based authentication with secure cookies
- Admins must have RBAC role: `SUPER_ADMIN`, `ADMIN`, `MODERATOR`, or `SUPPORT`
- Session expires after inactivity (configure in server settings)

## Admin Panel Sections

### 1. Dashboard
**Overview of platform health and activity**
- Total users, posts, and messages
- Active sessions and engagement metrics
- Quick access to all admin sections
- Real-time stats update on page load

### 2. Users
**Manage platform users**
- View all registered users with search/filter
- User details: username, email, verification status
- Actions: View profile, suspend/unsuspend accounts
- Net worth and influence score visibility

### 3. Posts
**Content management**
- View all posts with visibility status
- Filter by post type (TEXT, PHOTO, VIDEO, VOICE)
- Content moderation actions
- Visibility policy enforcement

### 4. Reports
**Handle user reports and content moderation**
- View pending reports
- Filter by report type and status
- Actions: Review, resolve, dismiss
- Reporter and reported user details

### 5. Verification
**User verification workflow**
- Pending verification requests
- Review submitted documents
- Approve/reject verifications
- Verification badge management

### 6. Mall
**Marketplace management**
- **503 products** currently in the database
- **107 categories** organized hierarchically
- Product creation with AI-powered descriptions (OpenAI integration)
- Pricing in South African Rands (R)
- Category management (create, edit, delete)

### 7. Analytics
**Platform insights**
- User growth trends
- Engagement metrics
- Content performance
- Revenue analytics

### 8. Feature Flags
**Control platform features**
- Toggle features on/off in real-time
- Target specific user segments
- A/B testing support
- Gradual rollout capabilities

### 9. Audit Log
**Security and compliance tracking**
- All admin actions logged
- User activity audit trail
- Login/logout events
- Data modification records

### 10. Messages
**Communication oversight**
- Total conversations and message stats
- Active chat monitoring
- Message delivery metrics
- Conversation management

### 11. Groups
**Community management**
- View all groups with member counts
- Group activity metrics
- Moderation tools
- Group settings management
- Actions: View details, delete groups

### 12. Live Streams
**Live content management**
- Active and ended streams
- Viewer count monitoring
- Stream moderation controls
- Actions: End streams, view stream details

### 13. Wallet
**Virtual economy management**
- Total coins in circulation
- Transaction history with user details
- Gift type management (create, edit gift types)
- Transaction monitoring (24h, 7d metrics)
- Balance statistics across all wallets

### 14. Gossip
**Anonymous gossip management (South Africa only)**
- Gossip post management
- Trend monitoring
- "Tea Meter" score visibility
- Moderation of anonymous content

### 15. Stories
**Ephemeral content management**
- Active story count
- Story moderation
- View/engagement metrics

### 16. Reels
**Short-form video management**
- Video content moderation
- Algorithm insights
- Trending reels management

### 17. Discovery
**Content recommendation system**
- Algorithm tuning
- Trending content management
- User recommendation rules

## Key Features

### Real-Time Sync
All admin actions sync in real-time:
- User status changes reflect immediately
- Content moderation takes effect instantly
- Statistics update on each section load

### Security
- All admin routes protected by `requireAdmin` middleware
- RBAC (Role-Based Access Control) enforcement
- Audit logging for all sensitive actions
- Rate limiting on API endpoints

### Design
- Luxury glassmorphism UI matching mobile app
- Dark theme with purple accents
- Responsive layout for desktop browsers
- Consistent iconography and typography

## API Endpoints

### Authentication
- `POST /api/login` - Admin login
- `POST /api/logout` - End session
- `GET /api/user` - Check current session

### Admin APIs
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - User listing
- `GET /api/admin/posts` - Post management
- `GET /api/admin/messages/stats` - Message statistics
- `GET /api/admin/groups` - Group listing
- `GET /api/admin/groups/:id/stats` - Group statistics
- `DELETE /api/admin/groups/:id` - Delete group
- `GET /api/admin/livestreams` - Stream listing
- `POST /api/admin/livestreams/:id/end` - End stream
- `GET /api/admin/wallet/stats` - Wallet statistics
- `GET /api/admin/wallet/transactions` - Transaction history
- `GET /api/admin/wallet/gift-types` - Gift type listing
- `GET /api/admin/feature-flags` - Feature flags
- `PUT /api/admin/feature-flags/:id` - Toggle flags

## Troubleshooting

### Cannot Login
1. Verify credentials are correct
2. Check if user has admin role in database
3. Clear browser cookies and retry
4. Check server logs for authentication errors

### Stats Not Loading
1. Verify backend is running (`npm run server:dev`)
2. Check browser console for API errors
3. Verify database connection is active

### Actions Not Working
1. Check for permission errors in console
2. Verify session is still active
3. Confirm you have required RBAC permissions

## Development Notes

### Adding New Admin Sections
1. Add route in `server/routes.ts` with `requireAdmin` middleware
2. Add section to navigation in `server/admin/index.html`
3. Create section HTML and event handlers
4. Update this guide

### Testing Admin Features
1. Login with admin credentials
2. Navigate to section
3. Test all CRUD operations
4. Verify audit log captures actions

## Contact
For admin panel issues, contact the development team or check server logs.
