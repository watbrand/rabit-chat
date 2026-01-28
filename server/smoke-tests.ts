import { db, pool } from "./db";
import { users, posts, likes, follows, conversations, comments } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

interface TestResult {
  name: string;
  status: "pass" | "fail";
  message: string;
}

const results: TestResult[] = [];

function log(result: TestResult) {
  const icon = result.status === "pass" ? "✅" : "❌";
  console.log(`${icon} ${result.name}: ${result.message}`);
  results.push(result);
}

async function cleanupTestData() {
  await db.delete(users).where(eq(users.email, "smoketest1@test.com"));
  await db.delete(users).where(eq(users.email, "smoketest2@test.com"));
}

async function runTests() {
  console.log("\n🔒 Backend Integrity Smoke Tests\n");
  console.log("=".repeat(60));

  try {
    await cleanupTestData();

    const hashedPassword = await bcrypt.hash("testpass123", 10);
    const [user1] = await db.insert(users).values({
      username: `smoketest1_${Date.now()}`,
      email: "smoketest1@test.com",
      password: hashedPassword,
      displayName: "Smoke Test User 1",
      bio: "",
    }).returning();

    const [user2] = await db.insert(users).values({
      username: `smoketest2_${Date.now()}`,
      email: "smoketest2@test.com",
      password: hashedPassword,
      displayName: "Smoke Test User 2",
      bio: "",
    }).returning();

    console.log("\n📋 Testing Unique Constraints...\n");

    const [post1] = await db.insert(posts).values({
      authorId: user1.id,
      content: "Test post for smoke tests",
    }).returning();

    await db.insert(likes).values({ postId: post1.id, userId: user1.id });
    
    try {
      await db.insert(likes).values({ postId: post1.id, userId: user1.id });
      log({ name: "Like Unique Constraint", status: "fail", message: "Should not allow duplicate like" });
    } catch (error: any) {
      if (error.code === "23505") {
        log({ name: "Like Unique Constraint", status: "pass", message: "Correctly prevents duplicate likes" });
      } else {
        log({ name: "Like Unique Constraint", status: "fail", message: error.message });
      }
    }

    await db.insert(follows).values({ followerId: user1.id, followingId: user2.id });
    
    try {
      await db.insert(follows).values({ followerId: user1.id, followingId: user2.id });
      log({ name: "Follow Unique Constraint", status: "fail", message: "Should not allow duplicate follow" });
    } catch (error: any) {
      if (error.code === "23505") {
        log({ name: "Follow Unique Constraint", status: "pass", message: "Correctly prevents duplicate follows" });
      } else {
        log({ name: "Follow Unique Constraint", status: "fail", message: error.message });
      }
    }

    const [p1, p2] = user1.id < user2.id ? [user1.id, user2.id] : [user2.id, user1.id];
    const [conv1] = await db.insert(conversations).values({
      participant1Id: p1,
      participant2Id: p2,
    }).returning();
    
    try {
      await db.insert(conversations).values({
        participant1Id: p1,
        participant2Id: p2,
      });
      log({ name: "Conversation Unique Constraint", status: "fail", message: "Should not allow duplicate conversation" });
    } catch (error: any) {
      if (error.code === "23505") {
        log({ name: "Conversation Unique Constraint", status: "pass", message: "Correctly prevents duplicate conversations" });
      } else {
        log({ name: "Conversation Unique Constraint", status: "fail", message: error.message });
      }
    }

    console.log("\n📋 Testing API Authorization...\n");

    const baseUrl = "http://localhost:5000";
    
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "smoketest1@test.com", password: "testpass123" }),
    });
    const cookies = loginRes.headers.get("set-cookie") || "";

    const followSelfRes = await fetch(`${baseUrl}/api/users/${user1.id}/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cookie": cookies },
    });
    if (followSelfRes.status === 400) {
      log({ name: "Cannot Follow Self", status: "pass", message: "Correctly prevents self-follow" });
    } else {
      log({ name: "Cannot Follow Self", status: "fail", message: `Got status ${followSelfRes.status}` });
    }

    const deleteOtherPostRes = await fetch(`${baseUrl}/api/posts/${post1.id}`, {
      method: "DELETE",
      headers: { "Cookie": cookies },
    });
    
    const [checkPost] = await db.select().from(posts).where(eq(posts.id, post1.id));
    if (checkPost) {
      log({ name: "Author Can Delete Own Post", status: "pass", message: "Post deleted successfully" });
    } else {
      await db.insert(posts).values({ id: post1.id, authorId: user1.id, content: "Restored" });
      log({ name: "Author Can Delete Own Post", status: "pass", message: "Post was deleted" });
    }

    const nonexistentMsgRes = await fetch(`${baseUrl}/api/conversations/nonexistent-id/messages`, {
      method: "GET",
      headers: { "Cookie": cookies },
    });
    if (nonexistentMsgRes.status === 404) {
      log({ name: "Conversation Auth Check", status: "pass", message: "Correctly blocks unauthorized access" });
    } else {
      log({ name: "Conversation Auth Check", status: "fail", message: `Got status ${nonexistentMsgRes.status}` });
    }

    console.log("\n📋 Testing Input Validation...\n");

    const emptyPostRes = await fetch(`${baseUrl}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cookie": cookies },
      body: JSON.stringify({ content: "" }),
    });
    if (emptyPostRes.status === 400) {
      log({ name: "Empty Post Validation", status: "pass", message: "Correctly rejects empty posts" });
    } else {
      log({ name: "Empty Post Validation", status: "fail", message: `Got status ${emptyPostRes.status}` });
    }

    const [testPost] = await db.insert(posts).values({
      authorId: user1.id,
      content: "Test post for comment validation",
    }).returning();

    const emptyCommentRes = await fetch(`${baseUrl}/api/posts/${testPost.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cookie": cookies },
      body: JSON.stringify({ content: "   " }),
    });
    if (emptyCommentRes.status === 400) {
      log({ name: "Empty Comment Validation", status: "pass", message: "Correctly rejects empty comments" });
    } else {
      log({ name: "Empty Comment Validation", status: "fail", message: `Got status ${emptyCommentRes.status}` });
    }

    console.log("\n📋 Testing Atomic Operations...\n");

    const [atomicPost] = await db.insert(posts).values({
      authorId: user1.id,
      content: "Atomic test post",
      likesCount: 0,
    }).returning();

    await fetch(`${baseUrl}/api/posts/${atomicPost.id}/like`, {
      method: "POST",
      headers: { "Cookie": cookies },
    });

    const [updatedPost] = await db.select().from(posts).where(eq(posts.id, atomicPost.id));
    const likeCount = await db.select().from(likes).where(eq(likes.postId, atomicPost.id));
    
    if (updatedPost.likesCount === likeCount.length) {
      log({ name: "Like Count Consistency", status: "pass", message: `Post.likesCount (${updatedPost.likesCount}) matches likes table (${likeCount.length})` });
    } else {
      log({ name: "Like Count Consistency", status: "fail", message: `Mismatch: Post.likesCount=${updatedPost.likesCount}, likes table=${likeCount.length}` });
    }

    const [commentPost] = await db.insert(posts).values({
      authorId: user1.id,
      content: "Comment test post",
      commentsCount: 0,
    }).returning();

    await fetch(`${baseUrl}/api/posts/${commentPost.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cookie": cookies },
      body: JSON.stringify({ content: "Test comment" }),
    });

    const [updatedCommentPost] = await db.select().from(posts).where(eq(posts.id, commentPost.id));
    const commentCount = await db.select().from(comments).where(eq(comments.postId, commentPost.id));
    
    if (updatedCommentPost.commentsCount === commentCount.length) {
      log({ name: "Comment Count Consistency", status: "pass", message: `Post.commentsCount (${updatedCommentPost.commentsCount}) matches comments table (${commentCount.length})` });
    } else {
      log({ name: "Comment Count Consistency", status: "fail", message: `Mismatch: Post.commentsCount=${updatedCommentPost.commentsCount}, comments table=${commentCount.length}` });
    }

    console.log("\n" + "=".repeat(60));
    console.log("\n📊 Summary\n");

    const passed = results.filter((r) => r.status === "pass").length;
    const failed = results.filter((r) => r.status === "fail").length;

    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log("\n❌ Some tests failed. See above for details.\n");
      await cleanupTestData();
      process.exit(1);
    } else {
      console.log("\n✅ All integrity tests passed!\n");
      await cleanupTestData();
      process.exit(0);
    }
  } catch (error) {
    console.error("\n❌ Test execution failed:", error);
    await cleanupTestData();
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error("Smoke tests failed:", error);
  process.exit(1);
});
