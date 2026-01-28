import cron from "node-cron";
import { gossipStorage } from "./gossip-storage";

let jobsInitialized = false;

export function initGossipJobs() {
  if (jobsInitialized) {
    console.log("Gossip jobs already initialized, skipping...");
    return;
  }

  console.log("Initializing gossip background jobs...");

  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("[Gossip Jobs] Running whisper cleanup...");
      const cleaned = await gossipStorage.cleanupExpiredWhispers();
      console.log(`[Gossip Jobs] Cleaned ${cleaned} expired whisper posts`);
    } catch (error) {
      console.error("[Gossip Jobs] Whisper cleanup failed:", error);
    }
  });

  cron.schedule("0 * * * *", async () => {
    try {
      console.log("[Gossip Jobs] Recalculating trending scores...");
      await gossipStorage.recalculateTrendingScores();
      console.log("[Gossip Jobs] Trending scores updated");
    } catch (error) {
      console.error("[Gossip Jobs] Trending recalculation failed:", error);
    }
  });

  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("[Gossip Jobs] Updating daily streaks...");
      await gossipStorage.updateDailyStreaks();
      console.log("[Gossip Jobs] Streaks updated");
    } catch (error) {
      console.error("[Gossip Jobs] Streak update failed:", error);
    }
  });

  cron.schedule("0 0 * * 1", async () => {
    try {
      console.log("[Gossip Jobs] Resetting weekly stats...");
      await gossipStorage.resetWeeklyStats();
      console.log("[Gossip Jobs] Weekly stats reset");
    } catch (error) {
      console.error("[Gossip Jobs] Weekly reset failed:", error);
    }
  });

  jobsInitialized = true;
  console.log("Gossip background jobs initialized:");
  console.log("  - Whisper cleanup: every 5 minutes");
  console.log("  - Trending recalculation: every hour");
  console.log("  - Daily streaks: every day at midnight UTC");
  console.log("  - Weekly stats reset: every Monday at midnight UTC");
}

export async function runJobManually(jobName: "whisper" | "trending" | "streaks" | "weekly"): Promise<string> {
  switch (jobName) {
    case "whisper":
      const cleaned = await gossipStorage.cleanupExpiredWhispers();
      return `Cleaned ${cleaned} expired whisper posts`;
    case "trending":
      await gossipStorage.recalculateTrendingScores();
      return "Trending scores recalculated";
    case "streaks":
      await gossipStorage.updateDailyStreaks();
      return "Daily streaks updated";
    case "weekly":
      await gossipStorage.resetWeeklyStats();
      return "Weekly stats reset";
    default:
      throw new Error(`Unknown job: ${jobName}`);
  }
}
