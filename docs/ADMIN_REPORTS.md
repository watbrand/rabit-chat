# Admin Reports Management

## Overview

The Admin Reports system provides comprehensive moderation tools for handling user-submitted reports about content and profiles. It includes advanced filtering, detailed context for each report, and quick action shortcuts to take immediate moderation actions.

## Features

### Report Types
- **User Reports**: Reports submitted against user profiles (harassment, spam, inappropriate content)
- **Post Reports**: Reports submitted against specific posts (content violations, misinformation)

### Report Status
- **PENDING**: New reports awaiting admin review
- **REVIEWED**: Reports that have been seen but not yet actioned
- **RESOLVED**: Reports that have been addressed with moderation action
- **DISMISSED**: Reports that were found to be invalid or no action needed

## API Endpoints

### Get Reports (with Filters)
```
GET /api/admin/reports
```

Query Parameters:
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status: PENDING, REVIEWED, RESOLVED, DISMISSED |
| type | string | Filter by report type: user, post |
| reporterId | string | Filter by reporter user ID |
| dateFrom | ISO date | Filter reports from this date |
| dateTo | ISO date | Filter reports until this date |

Response includes enriched data:
- `reporter`: Full user object of who submitted the report
- `reportedUser`: Full user object if this is a user report
- `reportedPost`: Full post object with author if this is a post report

### Get Single Report
```
GET /api/admin/reports/:id
```

Returns the full report details including all related entities.

### Update Report Status
```
PATCH /api/admin/reports/:id
```

Request Body:
```json
{
  "status": "RESOLVED",
  "notes": "Optional admin notes"
}
```

### Take Action (Shortcut)
```
POST /api/admin/reports/:id/action
```

Request Body:
```json
{
  "action": "suspend_user" | "hide_post" | "delete_post",
  "reason": "Reason for the action (required for suspend_user)"
}
```

Available Actions:
| Action | Description | Applies To |
|--------|-------------|-----------|
| suspend_user | Suspends the reported user | User reports only |
| hide_post | Soft-deletes the reported post (can be unhidden) | Post reports only |
| delete_post | Permanently deletes the reported post | Post reports only |

**Note**: All actions automatically:
1. Mark the report as RESOLVED
2. Create an entry in the Audit Log for accountability

## UI Features

### Filtering
The AdminReportsScreen provides filtering by:
- Status (Pending, Reviewed, Resolved, Dismissed, All)
- Type (All Types, User Reports, Post Reports)

### Report Cards
Each report card displays:
- Report reason/description
- Status badge with color coding
- Report type indicator
- Reporter username
- Reported entity (user or post preview)
- Timestamp

### Actions
- **Status Button**: Opens menu to change report status
- **Take Action Button**: Opens menu with moderation shortcuts (only shown for PENDING/REVIEWED reports)

## Audit Logging

All moderation actions are logged to the audit_logs table:
- Who performed the action (adminId)
- What action was taken
- Which entity was affected
- When it happened
- IP address and user agent

This ensures full accountability and enables review of moderation decisions.

## Access Control

Reports management requires admin privileges. Users without the `isAdmin` flag will receive a 403 Forbidden response.

## Database Schema

### Reports Table
```sql
reports (
  id VARCHAR PRIMARY KEY,
  reporter_id VARCHAR NOT NULL REFERENCES users(id),
  reported_user_id VARCHAR REFERENCES users(id),
  reported_post_id VARCHAR REFERENCES posts(id),
  reason TEXT NOT NULL,
  status VARCHAR DEFAULT 'PENDING',
  admin_notes TEXT,
  resolved_at TIMESTAMP,
  resolved_by_id VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
)
```

## Best Practices

1. **Review Context First**: Always check the full report details before taking action
2. **Use Soft Delete**: Prefer "Hide Post" over "Delete Post" to allow for appeals
3. **Document Decisions**: Add admin notes explaining your decision
4. **Check History**: Review the user's report history before severe actions like suspension
5. **Follow Up**: After taking action, consider notifying the reporter (future feature)
