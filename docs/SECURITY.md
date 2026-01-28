# Security Documentation

**Version:** 1.0.4  
**Last Updated:** January 15, 2026

## Overview

RabitChat implements comprehensive security measures to protect user data and prevent abuse. This document covers rate limiting, request validation, secure headers, and cookie security.

## Rate Limiting

Rate limiting is implemented using `express-rate-limit` to prevent abuse and brute-force attacks.

### Endpoint Limits

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| POST /api/auth/login | 10 requests | 15 minutes | Prevent brute-force login attempts |
| POST /api/auth/signup | 5 requests | 1 hour | Prevent mass account creation |
| POST /api/posts | 10 requests | 1 minute | Prevent spam posting |
| POST /api/posts/:id/comments | 20 requests | 1 minute | Prevent comment spam |
| POST /api/conversations/:id/messages | 30 requests | 1 minute | Prevent message spam |
| All /api/* endpoints | 100 requests | 1 minute | General API protection |

### Rate Limit Response

When rate limited, clients receive a 429 status with:
```json
{
  "code": "RATE_LIMITED",
  "message": "Too many requests. Please try again later."
}
```

Rate limit headers are included in responses:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in window
- `RateLimit-Reset`: Time when limit resets

## Request Validation

All endpoints with request bodies use Zod schemas for validation, defined in `server/validation.ts`.

### Validated Schemas

| Schema | Fields | Constraints |
|--------|--------|-------------|
| signupSchema | username, email, password, name | email format, password min 8 chars, username 3-30 chars |
| loginSchema | email, password | required fields |
| createPostSchema | content, mediaUrl? | content 1-5000 chars |
| createCommentSchema | content | content 1-2000 chars |
| sendMessageSchema | content, receiverId | content 1-5000 chars |
| reportSchema | targetType, targetId, reason | reason 10-1000 chars |
| updateProfileSchema | name?, bio?, netWorth?, influenceScore? | optional fields with type validation |

### Validation Error Response

Invalid requests receive a 400 status with detailed field errors:
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Security Headers

Security headers are configured using `helmet` middleware.

### Headers Applied

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | Configured directives | Prevent XSS and code injection |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | Force HTTPS connections |
| X-Content-Type-Options | nosniff | Prevent MIME type sniffing |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-XSS-Protection | 1; mode=block | Enable browser XSS filter |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer information |
| X-Download-Options | noopen | Prevent IE file execution |
| X-Permitted-Cross-Domain-Policies | none | Restrict Flash/PDF cross-domain |

### Content Security Policy

```
default-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https: blob:;
script-src 'self' 'unsafe-inline' 'unsafe-eval';
connect-src 'self' https: wss:;
frame-src 'none';
object-src 'none';
```

Note: `unsafe-inline` and `unsafe-eval` are required for Expo web compatibility.

## Cookie Security

Session cookies are configured with secure settings:

| Setting | Development | Production |
|---------|-------------|------------|
| httpOnly | true | true |
| secure | false | true |
| sameSite | lax | lax |
| maxAge | 7 days | 7 days |

### Key Security Features

- **httpOnly**: Prevents JavaScript access to cookies (XSS protection)
- **secure**: Cookies only sent over HTTPS in production
- **sameSite=lax**: Prevents CSRF while allowing normal navigation
- **trust proxy**: Enabled for correct IP detection behind Replit proxy

## Error Handling

A global error handler provides consistent API error responses:

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Access denied |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (e.g., duplicate) |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

### Error Response Format

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": [] // Optional field-level details
}
```

## Password Security

- Passwords are hashed using bcrypt with automatic salt generation
- Minimum password length: 8 characters
- Password hashes are never exposed in API responses

## Session Security

- Sessions stored in PostgreSQL with connect-pg-simple
- Session IDs are cryptographically secure random strings
- SESSION_SECRET should be at least 32 bytes of random data

## Recommendations

### Production Deployment

1. Ensure `SESSION_SECRET` is a strong random value
2. Enable HTTPS (automatic on Replit)
3. Monitor rate limit rejections for potential attacks
4. Review and rotate secrets periodically

### Client Implementation

1. Handle 429 responses with appropriate backoff
2. Display validation errors to users
3. Implement token refresh for long sessions
4. Clear local data on 401 responses
