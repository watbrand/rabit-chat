# RabitChat Real-time Messaging Architecture

## Overview

RabitChat uses WebSockets for real-time 1-on-1 messaging. The WebSocket server runs on the same port as the Express backend (5000), attached to the same HTTP server - no separate process required.

## Architecture

### Server-Side (Express + WebSocket)

```
┌──────────────────────────────────────────────────────────┐
│                    Express Server (port 5000)            │
├──────────────────────────────────────────────────────────┤
│  HTTP Routes          │  WebSocket Server (/ws)          │
│  - /api/auth/*        │  - Cookie-based auth            │
│  - /api/posts/*       │  - Fallback: message auth       │
│  - /api/conversations │  - User connection tracking     │
│  - /api/messages      │  - Real-time message broadcast  │
└──────────────────────────────────────────────────────────┘
```

### Authentication Flow

WebSocket connections are authenticated using session cookies only - there is no fallback authentication mechanism for security.

1. When a WebSocket connection opens, the server parses the `connect.sid` cookie from the request headers
2. The session ID is looked up in the PostgreSQL session store
3. If the session is valid and not expired, the user is authenticated
4. If authentication fails, the connection is immediately closed with code 1008

This ensures that only authenticated users can establish WebSocket connections, using the same session as HTTP requests.

### Message Flow

```
User A sends message → POST /api/conversations/:id/messages
                           │
                           ├── Message saved to PostgreSQL
                           │
                           └── WebSocket broadcast to User B
                                   │
                                   └── Client refetches messages via query invalidation
```

### Connection Management

- Each user can have multiple WebSocket connections (multiple tabs/devices)
- Connections are tracked in a `Map<userId, Set<WebSocket>>`
- Messages are broadcast to ALL connections for a user
- Connections are cleaned up on close/error

## Client-Side Implementation

### Reconnection Strategy

The client uses exponential backoff for reconnection:

1. On disconnect, wait `min(1000 * 2^attempts, 10000)` ms
2. On reconnect, immediately refetch messages for current conversation
3. Max 5 reconnection attempts before giving up
4. Reconnection resets on successful connection

### WebSocket URL Construction

```javascript
const wsUrl = getApiUrl().replace("https://", "wss://").replace("http://", "ws://");
const ws = new WebSocket(`${wsUrl}ws`);
```

The URL is derived from `EXPO_PUBLIC_DOMAIN` environment variable, ensuring correct routing through Replit's proxy.

## Message Persistence

All messages are:
1. Saved to PostgreSQL before WebSocket broadcast
2. Associated with a conversation (participant1Id < participant2Id for uniqueness)
3. Include sender information
4. Marked as read when fetched by recipient

## Testing with Two Users

### Prerequisites
- Backend running (`npm run server:dev`)
- Two browser sessions (incognito + regular, or two different browsers)

### Step-by-Step Test

1. **Create two test accounts**
   - Open browser 1, navigate to app, sign up as User A
   - Open browser 2 (incognito), sign up as User B

2. **Start a conversation**
   - User A: Go to Discover, find User B, tap to view profile
   - User A: Tap "Message" button to create conversation
   - User A: Send a message

3. **Verify real-time delivery**
   - User B: Navigate to Messages tab
   - User B: Open the conversation with User A
   - User B should see User A's message immediately (or within seconds)

4. **Test bidirectional messaging**
   - User B: Send a reply
   - User A: Should see the reply appear instantly

5. **Test reconnection**
   - User B: Disconnect network briefly (or close/reopen tab)
   - User A: Send a message while User B is disconnected
   - User B: Reconnect - should see the message after refetch

6. **Test persistence**
   - Both users: Refresh the page
   - Messages should persist and appear after refresh

### Automated Testing

Run the smoke tests to verify chat integrity:

```bash
npx tsx server/smoke-tests.ts
```

## Troubleshooting

### Messages not appearing in real-time
- Check browser console for WebSocket errors
- Verify both users are authenticated (check for `auth_success` message)
- Check server logs for connection errors

### WebSocket connection failing
- Ensure `EXPO_PUBLIC_DOMAIN` is set correctly
- On Replit, the domain should be auto-configured
- Check that the backend is running on port 5000

### Messages not persisting
- Verify PostgreSQL is running and `DATABASE_URL` is set
- Check server logs for database errors
- Run `npm run db:push` if schema is out of sync

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Session encryption key |
| `EXPO_PUBLIC_DOMAIN` | Public domain for API/WebSocket URLs |

## Security Considerations

1. **Session-based auth**: WebSocket connections authenticate via the same session as HTTP requests
2. **Message authorization**: Users can only send messages in conversations they belong to
3. **Receiver validation**: Message recipient is derived from conversation record, not user input
4. **No message spoofing**: Cannot send messages to arbitrary users
