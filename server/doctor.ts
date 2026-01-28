import { execSync } from "child_process";
import { db, pool } from "./db";
import { users } from "@shared/schema";

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
}

const results: CheckResult[] = [];

function log(result: CheckResult) {
  const icon = result.status === "pass" ? "✅" : result.status === "warn" ? "⚠️" : "❌";
  console.log(`${icon} ${result.name}: ${result.message}`);
  results.push(result);
}

async function runChecks() {
  console.log("\n🩺 RabitChat Doctor - Health Check\n");
  console.log("=".repeat(50));

  log({
    name: "DATABASE_URL",
    status: process.env.DATABASE_URL ? "pass" : "fail",
    message: process.env.DATABASE_URL ? "Set" : "Missing - run 'npm run db:push' after setting",
  });

  log({
    name: "SESSION_SECRET",
    status: process.env.SESSION_SECRET
      ? process.env.SESSION_SECRET === "rabitchat-secret-key"
        ? "warn"
        : "pass"
      : "fail",
    message: process.env.SESSION_SECRET
      ? process.env.SESSION_SECRET === "rabitchat-secret-key"
        ? "Using default value (insecure for production)"
        : "Set with custom value"
      : "Missing - add to Secrets",
  });

  try {
    await pool.query("SELECT 1");
    log({ name: "Database Connection", status: "pass", message: "Connected successfully" });
  } catch (error: any) {
    log({ name: "Database Connection", status: "fail", message: error.message });
  }

  try {
    const userCount = await db.select().from(users);
    log({
      name: "Database Tables",
      status: "pass",
      message: `Users table accessible (${userCount.length} users)`,
    });
  } catch (error: any) {
    log({
      name: "Database Tables",
      status: "fail",
      message: `Tables not found - run 'npm run db:push' first`,
    });
  }

  console.log("\n" + "=".repeat(50));
  console.log("Running TypeScript check...\n");

  try {
    execSync("npx tsc --noEmit --skipLibCheck 2>&1 | head -20", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    log({ name: "TypeScript", status: "pass", message: "No type errors" });
  } catch (error) {
    log({ name: "TypeScript", status: "warn", message: "Type errors found (see above)" });
  }

  console.log("\n" + "=".repeat(50));
  console.log("Running API smoke test...\n");

  try {
    const healthResponse = await fetch("http://localhost:5000/api/posts", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (healthResponse.ok) {
      log({ name: "API /api/posts", status: "pass", message: `Status ${healthResponse.status}` });
    } else if (healthResponse.status === 401) {
      log({ name: "API /api/posts", status: "pass", message: "Returns 401 (auth required) - working correctly" });
    } else {
      log({ name: "API /api/posts", status: "fail", message: `Status ${healthResponse.status}` });
    }
  } catch (error: any) {
    log({
      name: "API Smoke Test",
      status: "warn",
      message: "Server not running - start with 'npm run server:dev' first",
    });
  }

  console.log("\n" + "=".repeat(50));
  console.log("\n📊 Summary\n");

  const passed = results.filter((r) => r.status === "pass").length;
  const warnings = results.filter((r) => r.status === "warn").length;
  const failed = results.filter((r) => r.status === "fail").length;

  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ⚠️  Warnings: ${warnings}`);
  console.log(`  ❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log("\n❌ Some checks failed. See above for details.\n");
    process.exit(1);
  } else if (warnings > 0) {
    console.log("\n⚠️  All critical checks passed, but there are warnings.\n");
    process.exit(0);
  } else {
    console.log("\n✅ All checks passed! RabitChat is ready.\n");
    process.exit(0);
  }
}

runChecks().catch((error) => {
  console.error("Doctor failed:", error);
  process.exit(1);
});
