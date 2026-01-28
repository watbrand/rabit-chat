# Creator Studio

Creator Studio provides content creators with analytics and insights about their performance on RabitChat. All authenticated users have access to their own Studio data.

## Access

Navigate to **Profile > Settings > Creator Tools > Creator Studio**

## Features

### Overview Dashboard

The main Studio screen shows key metrics for the selected time period:

- **Profile Views**: Number of times other users viewed your profile
- **Total Views**: Combined views across all your posts
- **Engagement**: Total likes, comments, shares, and saves
- **Watch Time**: Total watch time for VIDEO/VOICE posts
- **Follower Changes**: Net change in followers with trend indicators

Each metric includes a trend comparison vs the previous period (e.g., comparing last 7 days to the 7 days before).

### Content Performance

View analytics for individual posts:

- **Filtering**: Filter by post type (TEXT, PHOTO, VIDEO, VOICE)
- **Sorting**: Sort by views, likes, comments, shares, or watch time
- **Post List**: Shows thumbnail, type, views, likes, and additional metrics

Tap any post to view detailed analytics.

### Post Detail Analytics

Detailed breakdown for a single post:

- **Engagement Stats**: Views, unique views, likes, comments, shares, saves
- **Watch Time** (VIDEO/VOICE only): Total watch time, average per view, completion rate
- **Traffic Sources**: Where views came from (Feed, Profile, Search, Share)

### Audience Insights

Understand your follower growth:

- **Total Followers**: Current follower count
- **Net Growth**: Followers gained minus lost
- **New Followers**: Users who followed you in the period
- **Unfollows**: Users who unfollowed you in the period
- **Growth Chart**: Visual representation of daily follower changes

## Date Ranges

All Studio screens support three time periods:
- **7 Days**: Last week with comparison to previous week
- **30 Days**: Last month with comparison to previous month
- **90 Days**: Last quarter with comparison to previous quarter

## Database Schema

### Tables

```sql
-- Profile view events
profile_views (
  id SERIAL PRIMARY KEY,
  profile_user_id VARCHAR NOT NULL REFERENCES users(id),
  viewer_id VARCHAR REFERENCES users(id),
  source traffic_source_enum DEFAULT 'DIRECT',
  created_at TIMESTAMP DEFAULT NOW()
)

-- Video/Voice watch events
watch_events (
  id SERIAL PRIMARY KEY,
  post_id VARCHAR NOT NULL REFERENCES posts(id),
  user_id VARCHAR REFERENCES users(id),
  watch_time_ms INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  source traffic_source_enum DEFAULT 'FEED',
  created_at TIMESTAMP DEFAULT NOW()
)

-- Daily aggregated user metrics
daily_user_analytics (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  profile_views INTEGER DEFAULT 0,
  post_views INTEGER DEFAULT 0,
  likes_received INTEGER DEFAULT 0,
  comments_received INTEGER DEFAULT 0,
  shares_received INTEGER DEFAULT 0,
  saves_received INTEGER DEFAULT 0,
  followers_gained INTEGER DEFAULT 0,
  followers_lost INTEGER DEFAULT 0,
  total_watch_time_ms BIGINT DEFAULT 0,
  UNIQUE(user_id, date)
)

-- Daily aggregated post metrics
daily_post_analytics (
  id SERIAL PRIMARY KEY,
  post_id VARCHAR NOT NULL REFERENCES posts(id),
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  total_watch_time_ms BIGINT DEFAULT 0,
  avg_watch_time_ms INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  traffic_feed INTEGER DEFAULT 0,
  traffic_profile INTEGER DEFAULT 0,
  traffic_search INTEGER DEFAULT 0,
  traffic_share INTEGER DEFAULT 0,
  UNIQUE(post_id, date)
)
```

### Traffic Source Enum

```typescript
enum traffic_source_enum {
  FEED = 'FEED',       // Discovered in main feed
  PROFILE = 'PROFILE', // From viewing user's profile
  SEARCH = 'SEARCH',   // From search results
  SHARE = 'SHARE',     // From shared link
  DIRECT = 'DIRECT'    // Direct access
}
```

## API Endpoints

### Studio Overview
```
GET /api/studio/overview?startDate=ISO&endDate=ISO
```
Returns aggregated metrics for the authenticated user.

### Content List
```
GET /api/studio/content?startDate=ISO&endDate=ISO&type=VIDEO&sortBy=views&order=desc
```
Returns paginated list of user's posts with analytics.

### Post Detail
```
GET /api/studio/posts/:postId?startDate=ISO&endDate=ISO
```
Returns detailed analytics for a specific post.

### Audience Insights
```
GET /api/studio/audience?startDate=ISO&endDate=ISO
```
Returns follower analytics and growth data.

### Admin Access (RBAC)
Admins with `studio.view_others` permission can view any user's analytics:
```
GET /api/admin/studio/:userId/overview
GET /api/admin/studio/:userId/content
GET /api/admin/studio/:userId/audience
```

## Event Tracking

### Profile Views
Recorded automatically when users visit another user's profile:
```
POST /api/studio/profile-view
{ profileUserId: string, source: traffic_source_enum }
```

### Watch Events
Record watch time for VIDEO/VOICE posts:
```
POST /api/studio/watch-event
{ postId: string, watchTimeMs: number, completed: boolean, source: traffic_source_enum }
```

## RBAC Permissions

| Permission | Description |
|------------|-------------|
| `studio.view_others` | View other users' Studio analytics (admin only) |

The SUPER_ADMIN role has this permission by default.

## Implementation Notes

- Analytics are tracked in real-time but aggregated daily for performance
- Self-views are excluded from profile view counts
- Watch time is only tracked for VIDEO and VOICE post types
- Completion rate = (completions / total plays) * 100
- Trend calculations compare current period to previous equal-length period
