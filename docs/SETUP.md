# RabitChat Setup Guide

This guide will help you get RabitChat running from a fresh fork with zero setup mistakes.

## Quick Start (Replit)

### 1. Fork the Project

Click the "Fork" button on the Replit project page.

### 2. Set Up the Database

1. Open the **Database** tool in the left sidebar (or Tools panel)
2. Click **Create Database** to provision PostgreSQL
3. Wait for the database to be created (takes ~10 seconds)
4. `DATABASE_URL` and related variables are automatically set

### 3. Set Up Secrets

1. Open the **Secrets** tab in the Tools panel
2. Add the following secret:

| Key | How to Generate |
|-----|-----------------|
| `SESSION_SECRET` | Run in Shell: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

Copy the output and paste it as the value.

### 4. Initialize the Database

Run in the Shell:

```bash
npm run db:push
```

This creates all the necessary tables.

### 5. (Optional) Seed Demo Data

```bash
npx tsx server/seed.ts
```

This creates demo users you can use to test:

| Email | Password |
|-------|----------|
| demo@example.com | password123 |
| elon@example.com | password123 |
| jeff@example.com | password123 |
| bill@example.com | password123 |

### 6. Start the App

Click the **Run** button, or run:

```bash
npm run server:dev
```

The app will start on port 5000 (backend). Use `npm run expo:dev` for the development Metro server (port 8081).

---

## Local Development Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/rabitchat.git
cd rabitchat
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```bash
# Required
DATABASE_URL="postgresql://postgres:password@localhost:5432/rabitchat"
SESSION_SECRET="your-generated-secret-here"

# Generate SESSION_SECRET with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Create the Database

```bash
createdb rabitchat
```

### 5. Push the Schema

```bash
npm run db:push
```

### 6. (Optional) Seed Data

```bash
npx tsx server/seed.ts
```

### 7. Start Development

```bash
npm run server:dev
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run server:dev` | Start the backend server (development) |
| `npm run expo:dev` | Start the Expo dev server |
| `npm run server:prod` | Start production server |
| `npm run db:push` | Push schema changes to database |
| `npx tsx server/seed.ts` | Seed database with demo data |
| `npx drizzle-kit studio` | Open Drizzle Studio (database GUI) |
| `npx tsx server/doctor.ts` | Run health checks on your setup |

---

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Session encryption key (32+ chars) | Use crypto.randomBytes |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | `development` or `production` |

### Auto-set on Replit

These are automatically configured by Replit:

- `REPLIT_DEV_DOMAIN` - Development domain
- `REPLIT_DOMAINS` - Production domains  
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Individual DB params

---

## Common Errors & Fixes

### Error: "DATABASE_URL must be set"

**On Replit:**
1. Open Database tool in sidebar
2. Click "Create Database"
3. Restart the app

**Locally:**
1. Ensure PostgreSQL is running
2. Check your `.env` file has `DATABASE_URL`
3. Verify the connection string is correct

### Error: "SESSION_SECRET is not set"

**On Replit:**
1. Open Secrets tab
2. Add `SESSION_SECRET` with a generated value:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

**Locally:**
1. Add `SESSION_SECRET` to your `.env` file

### Error: "relation does not exist" / Table not found

Run the database migration:
```bash
npm run db:push
```

### Error: "ECONNREFUSED" / Can't connect to database

**On Replit:** The database might be sleeping. Wait a moment and try again.

**Locally:** 
1. Ensure PostgreSQL is running: `pg_isready`
2. Check your `DATABASE_URL` credentials

### Expo/Metro bundler errors

Try clearing the cache:
```bash
npx expo start --clear
```

### TypeScript errors in VSCode

These are often false positives. The app compiles correctly with Metro. Run `npm run doctor` to verify.

---

## Testing Your Setup

Run the doctor command to verify everything is configured correctly:

```bash
npx tsx server/doctor.ts
```

This checks:
- ✅ Environment variables
- ✅ Database connection
- ✅ Tables exist
- ✅ TypeScript compilation
- ✅ API endpoints

---

## Architecture Overview

```
RabitChat/
├── client/           # Expo React Native app
│   ├── screens/      # App screens
│   ├── components/   # Reusable components
│   ├── navigation/   # React Navigation setup
│   └── lib/          # Utilities and API client
├── server/           # Express.js backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API routes + WebSocket
│   ├── storage.ts    # Database operations
│   └── db.ts         # Drizzle ORM setup
├── shared/           # Shared code
│   └── schema.ts     # Database schema (Drizzle)
└── docs/             # Documentation
```

---

## Need Help?

1. Run `npm run doctor` to diagnose issues
2. Check the error messages - they include fix instructions
3. Review this SETUP.md for common solutions
4. Check `/docs/AUDIT.md` for API documentation
