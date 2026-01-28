import { db } from "./db";
import { users, posts, comments, likes, follows } from "@shared/schema";
import bcrypt from "bcrypt";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  try {
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      console.log("Database already has data. Skipping seed.");
      console.log("To reseed, clear the database first with: npm run db:reset");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("password123", 10);

    const [user1] = await db
      .insert(users)
      .values({
        username: "elonmusk",
        email: "elon@example.com",
        password: hashedPassword,
        displayName: "Elon Musk",
        bio: "CEO of SpaceX, Tesla, and X. Building the future.",
        avatarUrl: null,
        netWorth: 250000000000,
        influenceScore: 9500,
      })
      .returning();

    const [user2] = await db
      .insert(users)
      .values({
        username: "jeffbezos",
        email: "jeff@example.com",
        password: hashedPassword,
        displayName: "Jeff Bezos",
        bio: "Founder of Amazon and Blue Origin. Day 1 philosophy.",
        avatarUrl: null,
        netWorth: 180000000000,
        influenceScore: 7200,
      })
      .returning();

    const [user3] = await db
      .insert(users)
      .values({
        username: "billgates",
        email: "bill@example.com",
        password: hashedPassword,
        displayName: "Bill Gates",
        bio: "Co-founder of Microsoft. Philanthropist. Climate advocate.",
        avatarUrl: null,
        netWorth: 130000000000,
        influenceScore: 8100,
      })
      .returning();

    const [user4] = await db
      .insert(users)
      .values({
        username: "demo",
        email: "demo@example.com",
        password: hashedPassword,
        displayName: "Demo User",
        bio: "Welcome to RabitChat! This is a demo account.",
        avatarUrl: null,
        netWorth: 1000000,
        influenceScore: 100,
      })
      .returning();

    console.log("Created users:", [user1, user2, user3, user4].map((u) => u.username).join(", "));

    const [post1] = await db
      .insert(posts)
      .values({
        authorId: user1.id,
        content:
          "Just launched another rocket. The future of humanity is multi-planetary. What an incredible time to be alive!",
        likesCount: 15420,
        commentsCount: 3,
      })
      .returning();

    const [post2] = await db
      .insert(posts)
      .values({
        authorId: user2.id,
        content:
          "Customer obsession is still Day 1 at Amazon. Remember: your margin is my opportunity.",
        likesCount: 8750,
        commentsCount: 2,
      })
      .returning();

    const [post3] = await db
      .insert(posts)
      .values({
        authorId: user3.id,
        content:
          "Climate change is the defining challenge of our time. We need innovation and policy working together.",
        likesCount: 12300,
        commentsCount: 4,
      })
      .returning();

    const [post4] = await db
      .insert(posts)
      .values({
        authorId: user1.id,
        content: "The AI revolution is here. Those who embrace it will thrive. Those who resist will be left behind.",
        likesCount: 9800,
        commentsCount: 1,
      })
      .returning();

    console.log("Created posts:", 4);

    await db.insert(comments).values([
      { postId: post1.id, authorId: user2.id, content: "Incredible achievement! Congrats to the SpaceX team." },
      { postId: post1.id, authorId: user3.id, content: "The progress in space exploration has been remarkable." },
      { postId: post2.id, authorId: user1.id, content: "Day 1 mentality is the key to success." },
      { postId: post3.id, authorId: user4.id, content: "Thank you for your work on climate, Bill!" },
    ]);

    console.log("Created comments:", 4);

    await db.insert(follows).values([
      { followerId: user4.id, followingId: user1.id },
      { followerId: user4.id, followingId: user2.id },
      { followerId: user4.id, followingId: user3.id },
      { followerId: user2.id, followingId: user1.id },
      { followerId: user3.id, followingId: user1.id },
    ]);

    console.log("Created follow relationships:", 5);

    console.log("\nSeed completed successfully!");
    console.log("\nDemo account credentials:");
    console.log("  Email: demo@example.com");
    console.log("  Password: password123");
    console.log("\nOther test accounts (same password):");
    console.log("  - elon@example.com");
    console.log("  - jeff@example.com");
    console.log("  - bill@example.com");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
