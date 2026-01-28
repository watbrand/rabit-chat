# Moderation & Safety

**Last Updated:** January 14, 2026

This document describes the moderation and safety features in RabitChat, including user blocking and content reporting.

## Overview

RabitChat includes built-in moderation tools to help users protect themselves and to help administrators manage inappropriate content. These features include:

- **User Blocking**: Users can block other users to prevent all interaction
- **Content Reporting**: Users can report posts or profiles for review by administrators
- **Admin Review**: Administrators can view, review, and resolve reports

## User Blocking

### How Blocking Works

When User A blocks User B:

1. **Mutual unfollow**: Any existing follow relationships between the two users are removed in both directions
2. **No messaging**: Neither user can start a conversation or send messages to the other
3. **No following**: Neither user can follow the other
4. **Content visibility**: Posts from blocked users are hidden from all feeds (home feed, discover, search results)
5. **Profile visibility**: Both users can still view each other's profile pages, but interaction buttons are disabled
6. **Post interactions**: Neither user can like or comment on each other's posts
7. **Comments filtered**: Comments from blocked users are hidden from post comment sections
8. **Notifications filtered**: Notifications from blocked users are hidden from the activity feed
9. **Search filtering**: Blocked users are hidden from user search results
10. **Follower lists filtered**: Blocked users are hidden from follower/following lists
11. **Real-time blocking**: WebSocket notifications are blocked since interaction attempts are rejected
12. **Blocking is one-directional**: Only User A can unblock User B (User B cannot unblock themselves)

### Blocking UI

Users can block other users from their profile page:
1. Navigate to the user's profile
2. Tap the three-dot menu (more-vertical icon) in the header
3. Select "Block User" (or "Unblock User" if already blocked)

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/:id/block` | POST | Block a user |
| `/api/users/:id/block` | DELETE | Unblock a user |
| `/api/users/:id/blocked` | GET | Check if you've blocked this user and if they've blocked you |
| `/api/users/me/blocked` | GET | Get list of users you've blocked |

### Database Schema

```sql
CREATE TABLE blocks (
  id varchar(36) PRIMARY KEY,
  blocker_id varchar(36) NOT NULL REFERENCES users(id),
  blocked_id varchar(36) NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);
```

## Content Reporting

### What Can Be Reported

Users can report:
- **Posts**: Inappropriate, spam, or harmful content
- **Users**: Accounts that violate community guidelines

### Reporting UI

**To report a post:**
1. Find the post in the feed, discover, or profile page
2. Tap the three-dot menu (more-horizontal icon) on the post
3. Select "Report Post"
4. Enter a description of the issue
5. Submit the report

**To report a user:**
1. Navigate to the user's profile
2. Tap the three-dot menu (more-vertical icon) in the header
3. Select "Report User"
4. Enter a description of the issue
5. Submit the report

### Report Statuses

| Status | Description |
|--------|-------------|
| PENDING | New report awaiting admin review |
| REVIEWED | Admin has seen the report but needs further investigation |
| RESOLVED | Issue has been addressed and the report is closed |
| DISMISSED | Report was determined to be invalid or no action needed |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports` | POST | Create a new report |

**Request body:**
```json
{
  "reason": "Description of the issue",
  "reportedUserId": "user-uuid",  // Optional, for user reports
  "reportedPostId": "post-uuid"   // Optional, for post reports
}
```

### Database Schema

```sql
CREATE TABLE reports (
  id varchar(36) PRIMARY KEY,
  reporter_id varchar(36) NOT NULL REFERENCES users(id),
  reported_user_id varchar(36) REFERENCES users(id),
  reported_post_id varchar(36) REFERENCES posts(id),
  reason text NOT NULL,
  status report_status NOT NULL DEFAULT 'PENDING',
  admin_notes text,
  resolved_at timestamp,
  resolved_by_id varchar(36) REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TYPE report_status AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');
```

## Admin Features

### Making a User an Admin

To make a user an admin, update their `is_admin` flag in the database:

```sql
UPDATE users SET is_admin = true WHERE username = 'your_username';
```

### Admin Panel

Administrators can access the admin panel from:
1. Profile tab → Settings → Admin section → "View Reports"

The admin panel shows all reports and allows administrators to:
- View report details (reason, reporter, reported content)
- Update report status (Mark as Reviewed, Resolved, or Dismissed)
- Filter reports by status

### Admin API Endpoints

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/admin/reports` | GET | Get all reports (optional `?status=` filter) | Admin only |
| `/api/admin/reports/:id` | GET | Get specific report details | Admin only |
| `/api/admin/reports/:id` | PATCH | Update report status | Admin only |
| `/api/users/me/admin` | GET | Check if current user is admin | Authenticated |

**PATCH request body:**
```json
{
  "status": "RESOLVED",
  "notes": "Optional admin notes"
}
```

## Security Considerations

1. **Authentication**: All moderation endpoints require authentication
2. **Authorization**: Admin endpoints check the `is_admin` flag on the user
3. **Self-protection**: Users cannot block or report themselves
4. **Cascade on delete**: When a user is deleted, all their blocks and reports are cleaned up

## Best Practices for Administrators

1. Review reports regularly to maintain community trust
2. Use "Reviewed" status to mark reports that need investigation
3. Add notes when resolving or dismissing reports for audit purposes
4. Consider patterns - multiple reports about the same user may indicate a problem

## Future Enhancements

Potential future improvements:
- Block list management UI (view and manage all blocked users)
- Report categories (spam, harassment, inappropriate content, etc.)
- Automated moderation for common violations
- Appeal system for users whose content was actioned
