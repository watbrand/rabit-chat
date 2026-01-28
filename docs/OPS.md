# Operations Guide

**Version:** 1.0.4  
**Last Updated:** January 15, 2026

## Overview

This guide covers deployment, monitoring, logging, and troubleshooting for RabitChat in production on Replit.

## Deployment on Replit

### Publishing Your App

1. From your Replit workspace, click the **Publish** button at the top
2. In the Publishing tab, select your deployment option:
   - **Autoscale**: Automatically scales based on traffic (recommended)
   - **Reserved VM**: Dedicated always-on instance
   - **Static**: For frontend-only deployments
3. Add a payment method if prompted
4. Click **Publish** to deploy

Your app will be available at `https://your-app-name.replit.app` or a custom domain if configured.

### Environment Setup for Production

Ensure these secrets are configured before publishing:

| Secret | Required | Description |
|--------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string (auto-provisioned) |
| SESSION_SECRET | Yes | 32+ byte random hex string for session encryption |
| SENTRY_DSN | No | Sentry project DSN for error tracking |
| CLOUDINARY_CLOUD_NAME | No | Cloudinary cloud name for media uploads |
| CLOUDINARY_API_KEY | No | Cloudinary API key |
| CLOUDINARY_API_SECRET | No | Cloudinary API secret |

### Pre-Deployment Checklist

- [ ] Run `npm run db:push` to ensure database schema is up to date
- [ ] Verify SESSION_SECRET is set and secure (32+ characters)
- [ ] Test authentication flow locally
- [ ] Check health endpoint returns healthy status

## Monitoring

### Health Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| GET /api/health | Full health check | Database, memory, uptime stats |
| GET /api/health/live | Liveness probe | Simple OK response |
| GET /api/health/ready | Readiness probe | Database connectivity check |

#### Health Response Example

```json
{
  "status": "healthy",
  "timestamp": "2026-01-15T05:00:00.000Z",
  "version": "1.0.4",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "ok",
      "latency": 5
    },
    "memory": {
      "status": "ok",
      "heapUsed": 45,
      "heapTotal": 100,
      "percentUsed": 45
    }
  }
}
```

#### Status Codes

- **200 healthy/degraded**: App is operational
- **503 unhealthy**: Critical failure (database down)

### Uptime Monitoring

Set up external uptime monitoring by checking:

1. **Primary Check**: `GET /api/health/live`
   - Check interval: 1 minute
   - Timeout: 5 seconds
   - Alert if: 3 consecutive failures

2. **Deep Check**: `GET /api/health`
   - Check interval: 5 minutes
   - Verify `status` is "healthy" or "degraded"
   - Alert if: status is "unhealthy" or HTTP 503

Recommended services: UptimeRobot, Better Uptime, Pingdom

## Logging

### Structured Log Format

All API requests are logged with structured data:

```
[2026-01-15T05:00:00.000Z] [abc12345] [user:uuid-here] GET /api/posts 200 45ms
```

Components:
- **Timestamp**: ISO 8601 format
- **Request ID**: 8-character unique identifier
- **User ID**: Authenticated user or "-" if anonymous
- **Method Path**: HTTP method and path
- **Status Code**: Response status
- **Duration**: Request processing time

### Viewing Logs on Replit

1. **Development**: Logs appear in the Console panel below your code
2. **Production**: 
   - Click "Deployments" in left sidebar
   - Select your deployment
   - Click "Logs" tab to view recent output

### Log Levels

| Level | Use Case |
|-------|----------|
| INFO | Normal operations, startup messages |
| WARN | Non-critical issues, deprecated usage |
| ERROR | Failures requiring attention |

### Error Tracking with Sentry

To enable Sentry error tracking:

1. Create a project at [sentry.io](https://sentry.io)
2. Add `SENTRY_DSN` secret with your project's DSN
3. Restart the backend

Sentry captures:
- Unhandled exceptions with stack traces
- Request context (path, method, user ID)
- Environment information

To install Sentry:
```bash
npm install @sentry/node
```

## Debugging Common Failures

### Database Connection Issues

**Symptoms**: 
- Health check shows database error
- API returns 500 errors

**Solutions**:
1. Verify DATABASE_URL is set correctly
2. Check Replit's Database panel for status
3. Run health check: `curl https://your-app.replit.app/api/health`
4. In Shell, test connection: `npx tsx server/doctor.ts`

### Session/Authentication Problems

**Symptoms**:
- Users logged out unexpectedly
- "Not authenticated" errors

**Solutions**:
1. Verify SESSION_SECRET is set and unchanged
2. Check cookie settings in browser dev tools
3. Ensure HTTPS is used in production
4. Clear browser cookies and retry

### Rate Limiting Issues

**Symptoms**:
- Users getting 429 errors
- "Too many requests" messages

**Solutions**:
1. Check rate limit headers in response
2. Review request patterns for abuse
3. Current limits:
   - Login: 10/15min
   - Signup: 5/hour
   - Posts: 10/min
   - API: 100/min

### Memory Issues

**Symptoms**:
- Health check shows memory warning
- App becomes unresponsive

**Solutions**:
1. Check health endpoint for memory usage
2. Review recent changes for memory leaks
3. Consider upgrading Replit plan for more resources
4. Restart deployment to clear memory

### WebSocket Connection Failures

**Symptoms**:
- Real-time chat not working
- Notifications not appearing

**Solutions**:
1. Check browser console for WebSocket errors
2. Verify `/ws` path is accessible
3. Check CORS configuration
4. Review `/docs/CHAT.md` for architecture details

## Doctor Script

Run diagnostics with the doctor script:

```bash
npx tsx server/doctor.ts
```

This checks:
- Environment variables
- Database connectivity
- Required secrets

## Rollback Procedure

If a deployment has issues:

1. Go to your Replit workspace
2. Click "View Checkpoints" to see previous states
3. Select a working checkpoint
4. Choose to rollback code, database, or both
5. Re-publish from the stable checkpoint

## Performance Tips

1. **Database**: Indexes are defined for common queries (see `/docs/DB_PROD.md`)
2. **Caching**: Consider adding Redis for session storage at scale
3. **Assets**: Static files are served efficiently through Replit's CDN
4. **WebSockets**: Connection pooling is handled automatically

## Security Checklist

- [ ] SESSION_SECRET is strong (32+ random bytes)
- [ ] HTTPS is enforced (automatic on Replit)
- [ ] Rate limiting is active
- [ ] Helmet security headers enabled
- [ ] Sensitive data not logged (passwords, tokens)
- [ ] Admin accounts have strong passwords

See `/docs/SECURITY.md` for full security documentation.
