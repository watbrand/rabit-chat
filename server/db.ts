import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Run startup migrations to ensure production database has correct column types
export async function runStartupMigrations() {
  const client = await pool.connect();
  try {
    console.log("[DB] Running startup migrations...");
    
    // Alter netWorth columns to bigint if they're still integer
    const migrations = [
      `DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'net_worth' AND data_type = 'integer') THEN
          ALTER TABLE users ALTER COLUMN net_worth TYPE bigint;
          RAISE NOTICE 'Altered users.net_worth to bigint';
        END IF;
      END $$;`,
      `DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'mall_purchases' AND column_name = 'net_worth_gained' AND data_type = 'integer') THEN
          ALTER TABLE mall_purchases ALTER COLUMN net_worth_gained TYPE bigint;
          RAISE NOTICE 'Altered mall_purchases.net_worth_gained to bigint';
        END IF;
      END $$;`,
      `DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'net_worth_ledger' AND column_name = 'delta' AND data_type = 'integer') THEN
          ALTER TABLE net_worth_ledger ALTER COLUMN delta TYPE bigint;
          RAISE NOTICE 'Altered net_worth_ledger.delta to bigint';
        END IF;
      END $$;`,
    ];
    
    for (const migration of migrations) {
      await client.query(migration);
    }
    
    console.log("[DB] Startup migrations completed");
  } catch (error) {
    console.error("[DB] Startup migration error:", error);
  } finally {
    client.release();
  }
  
  // Seed admin user if it doesn't exist
  await seedAdminUser();
  
  // Seed economy config if not present
  await seedEconomyConfig();
  
  // Seed help center content if not present
  try {
    const { seedHelpCenterOnStartup } = await import('./seed-help-center-startup');
    await seedHelpCenterOnStartup();
  } catch (error) {
    console.error("[DB] Help center seed error:", error);
  }
}

// Create admin user if it doesn't exist
async function seedAdminUser() {
  try {
    const adminEmail = "admin@rabitchat.com";
    const adminPassword = "AdminPass123!";
    
    // Check if admin already exists
    const existingAdmin = await db.select().from(schema.users).where(eq(schema.users.email, adminEmail)).limit(1);
    
    if (existingAdmin.length === 0) {
      console.log("[DB] Creating admin user...");
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await db.insert(schema.users).values({
        id: crypto.randomUUID(),
        email: adminEmail,
        username: "admin",
        displayName: "Administrator",
        password: hashedPassword,
        isAdmin: true,
        isVerified: true,
        verifiedAt: new Date(),
        bio: "RabitChat Administrator",
        influenceScore: 100,
        netWorth: 0,
      });
      
      console.log("[DB] Admin user created: " + adminEmail);
    } else {
      console.log("[DB] Admin user already exists");
    }
  } catch (error) {
    console.error("[DB] Admin seed error:", error);
  }
}

// Seed economy config defaults
async function seedEconomyConfig() {
  try {
    const defaultConfigs = [
      { key: "withdrawals_enabled", value: "true" },
      { key: "purchases_enabled", value: "true" },
      { key: "gifts_enabled", value: "true" },
      { key: "staking_enabled", value: "true" },
      { key: "battles_enabled", value: "true" },
      { key: "daily_rewards_enabled", value: "true" },
      { key: "coin_to_rand_rate", value: "0.10" },
      { key: "platform_fee_percent", value: "50" },
      { key: "min_withdrawal_amount", value: "1000" },
      { key: "battle_fee_percent", value: "20" },
    ];
    
    for (const config of defaultConfigs) {
      const existing = await db.select().from(schema.economyConfig)
        .where(eq(schema.economyConfig.key, config.key))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(schema.economyConfig).values({
          key: config.key,
          value: config.value,
        });
      }
    }
    
    console.log("[DB] Economy config seeded");
    
    // Seed the custom purchase bundle (required for custom coin amounts)
    const customBundleId = "custom-purchase-bundle";
    const existingBundle = await db.select().from(schema.coinBundles)
      .where(eq(schema.coinBundles.id, customBundleId))
      .limit(1);
    
    if (existingBundle.length === 0) {
      await db.insert(schema.coinBundles).values({
        id: customBundleId,
        name: "Custom Purchase",
        description: "Custom coin amount purchase",
        coinAmount: 0,
        bonusCoins: 0,
        priceRands: 0,
        isActive: false,
        isFeatured: false,
        sortOrder: 999,
      });
      console.log("[DB] Custom purchase bundle created");
    }
  } catch (error) {
    console.error("[DB] Economy config seed error:", error);
  }
}
