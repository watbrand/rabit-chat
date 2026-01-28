# User Verification System

This document describes the verification request system for RabitChat, allowing users to request verified status and admins to review and approve/deny those requests.

## Overview

The verification system enables users to submit requests for verified status (indicated by the blue checkmark badge). Admins with the appropriate permissions can review, approve, deny, or request additional information for these requests.

## User Flow

### Submitting a Request

1. Navigate to **Settings → Account → Verification**
2. Fill out the verification request form:
   - **Full Name**: Legal name for identity verification
   - **Category**: Type of account (Celebrity, Influencer, Business, Organization, Government, Other)
   - **Reason**: Why verification is requested (50-2000 characters)
   - **Links**: Supporting links (social media, articles, official websites) - up to 5 optional
3. Submit the request

### Request Status

Users can view their current request status on the verification screen:

- **SUBMITTED**: Request has been submitted and is awaiting review
- **UNDER_REVIEW**: An admin is actively reviewing the request
- **APPROVED**: Request was approved, user is now verified
- **DENIED**: Request was denied (with reason provided)
- **MORE_INFO_NEEDED**: Admin requires additional information

### Cooldown Period

After a request is denied or more information is requested, users must wait **7 days** before submitting a new request. This prevents spam and allows time for users to gather additional documentation.

## Admin Flow

### Permissions Required

- **verification.view**: View verification requests
- **verification.manage**: Approve, deny, or request more info

These permissions are assigned to the SUPER_ADMIN role by default.

### Accessing Verification Management

1. Navigate to **Settings → Admin → Verification**
2. Use filters to view requests by status:
   - All, Submitted, Under Review, Approved, Denied, More Info Needed

### Actions

For each pending request, admins can:

1. **Approve**: Sets the user as verified (`isVerified = true`)
2. **Deny**: Requires a reason that will be shown to the user
3. **Request More Info**: Requires notes specifying what additional information is needed

All actions are logged in the audit trail.

## Database Schema

### verification_requests Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Reference to users table |
| fullName | VARCHAR(255) | User's full legal name |
| category | ENUM | Account category type |
| documentUrls | JSON | Array of document URLs (admin only) |
| links | JSON | Array of supporting links |
| reason | TEXT | Why verification is requested |
| status | ENUM | Current request status |
| adminNotes | TEXT | Internal notes from reviewer |
| denialReason | TEXT | Reason for denial (shown to user) |
| reviewedById | UUID | Admin who reviewed the request |
| submittedAt | TIMESTAMP | When request was submitted |
| updatedAt | TIMESTAMP | Last update time |

### Enums

**verification_status**: SUBMITTED, UNDER_REVIEW, APPROVED, DENIED, MORE_INFO_NEEDED

**verification_category**: CELEBRITY, INFLUENCER, BUSINESS, ORGANIZATION, GOVERNMENT, OTHER

## API Endpoints

### User Endpoints

#### Submit Verification Request
```
POST /api/me/verification
Content-Type: application/json

{
  "fullName": "John Doe",
  "category": "INFLUENCER",
  "reason": "I have over 500k followers and verified presence on...",
  "links": ["https://twitter.com/johndoe", "https://instagram.com/johndoe"]
}
```

#### Get Current Request Status
```
GET /api/me/verification
```

Returns current request status and history.

### Admin Endpoints

#### List Verification Requests
```
GET /api/admin/verification?status=SUBMITTED
```

Query parameters:
- `status`: Filter by status (optional)

#### Take Action on Request
```
POST /api/admin/verification/:requestId/action
Content-Type: application/json

{
  "action": "approve" | "deny" | "request_info",
  "reason": "Required for deny action",
  "notes": "Required for request_info action"
}
```

## Notifications

Users receive notifications for the following events:

- **VERIFICATION_APPROVED**: When their request is approved
- **VERIFICATION_DENIED**: When their request is denied (includes reason)
- **VERIFICATION_INFO_NEEDED**: When more information is requested (includes notes)

## Audit Logging

All verification actions are logged:

- **verification.submitted**: User submitted a verification request
- **verification.approved**: Admin approved a request
- **verification.denied**: Admin denied a request
- **verification.info_requested**: Admin requested more information

Audit logs include the actor, target user, and relevant metadata.

## Security Considerations

1. Document URLs are restricted to admin view only
2. All actions require proper RBAC permissions
3. Rate limiting is applied to submission endpoint
4. Cooldown period prevents request spam
5. All admin actions are audit logged
