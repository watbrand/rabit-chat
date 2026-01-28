# RabitChat Production Database Guide

**Last Updated:** January 14, 2026

## Overview

RabitChat uses PostgreSQL with Drizzle ORM for all data persistence. The database is the source of truth for users, posts, comments, likes, follows, conversations, and messages.

## Database Setup

### On Replit (Recommended)

1. **Provision Database**
   - Open the "Database" tool in the left sidebar
   - Click "Create Database"
   - A PostgreSQL database is automatically provisioned
   - `DATABASE_URL` is automatically set in your environment

2. **Push Schema**
   ```bash
   npm run db:push
   ```

3. **Seed Demo Data (Optional)**
   ```bash
   npx tsx server/seed.ts
   ```

4. **Verify Setup**
   ```bash
   npx tsx server/doctor.ts
   ```

### External PostgreSQL

For external providers (Neon, Supabase, Railway, etc.):

1. **Create Database**
   - Create a PostgreSQL database on your provider
   - Get the connection string

2. **Set Environment Variable**
   - Add `DATABASE_URL` to Replit Secrets:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   ```

3. **Push Schema**
   ```bash
   npm run db:push
   ```

## Schema

### Tables

| Table | Description | Key Indexes |
|-------|-------------|-------------|
| `users` | User accounts | `username` (unique), `email` (unique) |
| `posts` | User posts | `created_at`, `author_id` |
| `comments` | Post comments | `post_id` (FK) |
| `likes` | Post likes | `(user_id, post_id)` unique, `post_id` |
| `follows` | Follow relationships | `(follower_id, following_id)` unique, individual indexes |
| `conversations` | Chat conversations | `(participant1_id, participant2_id)` unique |
| `messages` | Chat messages | `(conversation_id, created_at)` composite |
| `user_sessions` | Session storage | Managed by connect-pg-simple |

### Performance Indexes

The following indexes are defined for query optimization:

```sql
-- Posts: Feed ordering and user posts
CREATE INDEX posts_created_at_idx ON posts(created_at);
CREATE INDEX posts_author_id_idx ON posts(author_id);

-- Likes: Query likes by post
CREATE INDEX likes_post_id_idx ON likes(post_id);

-- Follows: Query followers and following
CREATE INDEX follows_follower_id_idx ON follows(follower_id);
CREATE INDEX follows_following_id_idx ON follows(following_id);

-- Messages: Conversation message ordering
CREATE INDEX messages_conversation_created_idx ON messages(conversation_id, created_at);
```

### Unique Constraints (Auto-indexed)

```sql
-- Prevent duplicate likes
UNIQUE(user_id, post_id) ON likes

-- Prevent duplicate follows
UNIQUE(follower_id, following_id) ON follows

-- One conversation per pair
UNIQUE(participant1_id, participant2_id) ON conversations
```

## Migrations

### Using Drizzle Kit

RabitChat uses Drizzle ORM with `db:push` for schema management:

```bash
# Push schema changes to database (safe for development)
npm run db:push

# Force push (use with caution in production)
npm run db:push --force

# Open Drizzle Studio (GUI for database inspection)
npx drizzle-kit studio
```

### Production Migration Best Practices

1. **Always backup before migrations** (see Backup Strategy below)
2. **Test migrations on a copy first**
3. **Use transactions for data migrations**
4. **Avoid changing primary key types** - This breaks existing data

### Schema Changes

To modify the schema:

1. Edit `shared/schema.ts`
2. Run `npm run db:push`
3. Drizzle will show the changes and apply them

## Backup Strategy

### Replit Deployments

- Replit automatically manages database backups for deployed apps
- Access via Replit's checkpoint/history system
- Contact Replit support for point-in-time recovery

### Manual Backups

#### Export Data
```bash
# Using pg_dump (if available)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Using Drizzle Studio
npx drizzle-kit studio
# Export tables from the GUI
```

#### Export via SQL
```sql
-- Export users (excluding passwords for security)
COPY (SELECT id, username, email, display_name, bio, avatar_url, net_worth, influence_score, created_at FROM users) TO STDOUT WITH CSV HEADER;

-- Export posts
COPY posts TO STDOUT WITH CSV HEADER;
```

### Restore from Backup
```bash
# Using psql
psql $DATABASE_URL < backup_file.sql
```

## Connection Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Full PostgreSQL connection string | Yes |
| `PGHOST` | Database host | Auto-set on Replit |
| `PGPORT` | Database port (default: 5432) | Auto-set on Replit |
| `PGUSER` | Database user | Auto-set on Replit |
| `PGPASSWORD` | Database password | Auto-set on Replit |
| `PGDATABASE` | Database name | Auto-set on Replit |

### Connection Pooling

The application uses `pg` connection pooling:

```typescript
// server/db.ts
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

Default pool settings are used. For high-traffic production:

```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,              // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Monitoring

### Health Check

Run the doctor script to verify database connectivity:

```bash
npx tsx server/doctor.ts
```

### Query Performance

Use Drizzle Studio or connect with psql to analyze queries:

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(quote_ident(tablename)))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(quote_ident(tablename)) DESC;
```

## Troubleshooting

### Connection Issues

1. **Check DATABASE_URL is set**
   ```bash
   echo $DATABASE_URL
   ```

2. **Test connection**
   ```bash
   npx tsx server/doctor.ts
   ```

3. **SSL issues** - Add `?sslmode=require` to connection string for external databases

### Schema Sync Issues

1. **Run db:push with force**
   ```bash
   npm run db:push --force
   ```

2. **Check for conflicting constraints**
   - Drop and recreate if needed (backup first!)

### Session Issues

Sessions are stored in `user_sessions` table via connect-pg-simple:

```sql
-- Clear all sessions (forces all users to re-login)
TRUNCATE user_sessions;

-- Clear expired sessions
DELETE FROM user_sessions WHERE expire < NOW();
```

## Security

### Production Checklist

- [ ] Use SSL connections (`sslmode=require`)
- [ ] Use strong, unique passwords
- [ ] Limit database user permissions
- [ ] Enable connection logging
- [ ] Regular backup schedule
- [ ] Monitor for unusual query patterns

### Password Hashing

User passwords are hashed with bcrypt (10 rounds) before storage. Never store or log plain-text passwords.
