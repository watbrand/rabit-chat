const REQUIRED_ENV_VARS = [
  {
    name: "DATABASE_URL",
    message: `
DATABASE_URL is not set!

How to fix on Replit:
  1. Open the "Database" tool in the left sidebar
  2. Click "Create Database" to provision PostgreSQL
  3. DATABASE_URL will be automatically set

How to fix locally:
  1. Install PostgreSQL
  2. Create a database: createdb rabitchat
  3. Set DATABASE_URL in your .env file:
     DATABASE_URL="postgresql://user:password@localhost:5432/rabitchat"

See /docs/SETUP.md for detailed instructions.
`,
  },
  {
    name: "SESSION_SECRET",
    message: `
SESSION_SECRET is not set!

How to fix on Replit:
  1. Open the "Secrets" tab in the Tools panel
  2. Add a new secret with key: SESSION_SECRET
  3. Generate a secure value with:
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  4. Paste the generated value

How to fix locally:
  1. Copy .env.example to .env
  2. Generate a secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  3. Set SESSION_SECRET in your .env file

See /docs/SETUP.md for detailed instructions.
`,
  },
];

export function validateEnvironment(): void {
  const missing: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar.name]) {
      console.error(`\n${"=".repeat(60)}`);
      console.error(`ERROR: Missing required environment variable`);
      console.error(`${"=".repeat(60)}`);
      console.error(envVar.message);
      missing.push(envVar.name);
    }
  }

  if (missing.length > 0) {
    console.error(`\n${"=".repeat(60)}`);
    console.error(`Missing ${missing.length} required variable(s): ${missing.join(", ")}`);
    console.error(`${"=".repeat(60)}\n`);
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production" && process.env.SESSION_SECRET === "rabitchat-secret-key") {
    console.warn(`
${"!".repeat(60)}
WARNING: Using default SESSION_SECRET in production!
This is a security risk. Please set a unique SESSION_SECRET.
${"!".repeat(60)}
`);
  }

  console.log("Environment validation passed");
}
