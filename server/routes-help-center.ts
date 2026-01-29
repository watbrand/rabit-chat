import type { Express, Request, Response, NextFunction } from "express";
import { db, pool } from "./db";
import { storage } from "./storage";
import { eq, and, desc, sql, inArray, isNull, or, ilike, asc, count, gt, lt, gte, lte, ne } from "drizzle-orm";
import { users } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import {
  uploadToCloudinaryFromFile,
  cleanupTempFile,
  UPLOAD_TEMP_DIR,
} from "./cloudinary";
import { summarizeContent } from "./services/ai-moderation";
import type { AuditAction } from "@shared/schema";
import {
  sendTicketCreatedEmail,
  sendTicketReplyEmail,
  sendTicketStatusUpdateEmail,
  sendTicketSatisfactionEmail,
} from "./services/email";

const diskStorage = multer.diskStorage({
  destination: UPLOAD_TEMP_DIR,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `support-${uniqueSuffix}-${file.originalname}`);
  },
});

const supportUpload = multer({
  storage: diskStorage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB max
});

// Helper to check admin access using storage.getUser like main routes
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const user = await storage.getUser(userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  (req as any).adminUser = user;
  next();
}

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().optional(),
});

const createArticleSchema = z.object({
  categoryId: z.string(),
  title: z.string().min(1).max(200),
  summary: z.string().optional(),
  content: z.string().min(1),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  hasWalkthrough: z.boolean().optional(),
  hasVideo: z.boolean().optional(),
  videoUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  estimatedReadTime: z.number().optional(),
  tags: z.array(z.string()).optional(),
  relatedArticleIds: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

const createFaqSchema = z.object({
  categoryId: z.string().optional(),
  question: z.string().min(1),
  answer: z.string().min(1),
  sortOrder: z.number().optional(),
  isFeatured: z.boolean().optional(),
});

const createTicketSchema = z.object({
  category: z.enum([
    "ACCOUNT", "PAYMENT", "WITHDRAWAL", "COINS", "GIFTS", 
    "MALL", "TECHNICAL", "REPORT", "OTHER"
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  subject: z.string().min(1).max(200),
  description: z.string().min(1),
});

const createTicketMessageSchema = z.object({
  content: z.string().min(1),
});

const createAppealSchema = z.object({
  type: z.enum(["ACCOUNT_SUSPENSION", "CONTENT_REMOVAL", "VERIFICATION_DENIAL", "WITHDRAWAL_DENIAL", "OTHER"]),
  subject: z.string().min(1).max(200),
  description: z.string().min(1),
  referenceId: z.string().optional(),
});

const createFeatureRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  category: z.string().optional(),
});

const createCommunityQuestionSchema = z.object({
  categoryId: z.string().optional(),
  title: z.string().min(1).max(200),
  body: z.string().min(1),
});

const createCommunityAnswerSchema = z.object({
  body: z.string().min(1),
});

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100);
}

export function registerHelpCenterRoutes(app: Express) {
  
  // ==================== HELP CATEGORIES ====================
  
  // GET /api/help/categories - Get all categories
  app.get("/api/help/categories", async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT * FROM help_categories 
        WHERE is_active = true 
        ORDER BY sort_order ASC, name ASC
      `);
      res.json({ categories: result.rows });
    } catch (error: any) {
      console.error("Error fetching help categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  
  // GET /api/help/categories/:slug - Get category by slug with articles
  app.get("/api/help/categories/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      const categoryResult = await pool.query(
        `SELECT * FROM help_categories WHERE slug = $1 AND is_active = true`,
        [slug]
      );
      
      if (categoryResult.rows.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      const category = categoryResult.rows[0];
      
      const articlesResult = await pool.query(`
        SELECT id, title, slug, summary, difficulty, has_walkthrough, has_video,
               estimated_read_time, view_count, helpful_count, tags, published_at
        FROM help_articles 
        WHERE category_id = $1 AND status = 'PUBLISHED'
        ORDER BY view_count DESC
      `, [category.id]);
      
      res.json({ ...category, articles: articlesResult.rows });
    } catch (error: any) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });
  
  // POST /api/admin/help/categories - Create category (admin)
  app.post("/api/admin/help/categories", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = createCategorySchema.parse(req.body);
      const slug = generateSlug(data.name);
      
      const result = await pool.query(`
        INSERT INTO help_categories (name, slug, description, icon, color, parent_id, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [data.name, slug, data.description, data.icon, data.color, data.parentId, data.sortOrder || 0]);
      
      const adminUser = (req as any).adminUser;
      await storage.createAuditLog({
        actorId: adminUser.id,
        action: "CREATE_HELP_CATEGORY" as AuditAction,
        targetType: "help_category",
        targetId: result.rows[0].id,
        details: { name: data.name },
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
      });
      
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error("Error creating category:", error);
      res.status(500).json({ error: error.message || "Failed to create category" });
    }
  });
  
  // PUT /api/admin/help/categories/:id - Update category (admin)
  app.put("/api/admin/help/categories/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = createCategorySchema.partial().parse(req.body);
      
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (data.name) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
        updates.push(`slug = $${paramIndex++}`);
        values.push(generateSlug(data.name));
      }
      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      if (data.icon !== undefined) {
        updates.push(`icon = $${paramIndex++}`);
        values.push(data.icon);
      }
      if (data.color !== undefined) {
        updates.push(`color = $${paramIndex++}`);
        values.push(data.color);
      }
      if (data.parentId !== undefined) {
        updates.push(`parent_id = $${paramIndex++}`);
        values.push(data.parentId);
      }
      if (data.sortOrder !== undefined) {
        updates.push(`sort_order = $${paramIndex++}`);
        values.push(data.sortOrder);
      }
      
      updates.push(`updated_at = NOW()`);
      values.push(id);
      
      const result = await pool.query(`
        UPDATE help_categories SET ${updates.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error("Error updating category:", error);
      res.status(500).json({ error: error.message || "Failed to update category" });
    }
  });
  
  // DELETE /api/admin/help/categories/:id - Delete category (admin)
  app.delete("/api/admin/help/categories/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      await pool.query(`UPDATE help_categories SET is_active = false WHERE id = $1`, [id]);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });
  
  // ==================== HELP ARTICLES ====================
  
  // GET /api/help/articles - Get published articles with pagination
  app.get("/api/help/articles", async (req: Request, res: Response) => {
    try {
      const { category, search, limit = 20, offset = 0 } = req.query;
      
      let whereClause = "status = 'PUBLISHED'";
      const values: any[] = [];
      let paramIndex = 1;
      
      if (category) {
        whereClause += ` AND category_id = $${paramIndex++}`;
        values.push(category);
      }
      
      if (search) {
        whereClause += ` AND (title ILIKE $${paramIndex} OR summary ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
        values.push(`%${search}%`);
        paramIndex++;
      }
      
      values.push(Number(limit), Number(offset));
      
      const result = await pool.query(`
        SELECT a.id, a.title, a.slug, a.summary, a.difficulty, a.has_walkthrough, a.has_video,
               a.estimated_read_time, a.view_count, a.helpful_count, a.tags, a.thumbnail_url,
               a.published_at, a.category_id, c.name as category_name, c.slug as category_slug
        FROM help_articles a
        LEFT JOIN help_categories c ON a.category_id = c.id
        WHERE ${whereClause}
        ORDER BY a.view_count DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `, values);
      
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM help_articles WHERE ${whereClause}`,
        values.slice(0, -2)
      );
      
      res.json({
        articles: result.rows,
        total: parseInt(countResult.rows[0].count),
        limit: Number(limit),
        offset: Number(offset),
      });
    } catch (error: any) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });
  
  // GET /api/help/search - Search articles
  app.get("/api/help/search", async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      
      if (!query || String(query).length < 2) {
        return res.json([]);
      }
      
      const searchTerm = `%${String(query).toLowerCase()}%`;
      
      const result = await pool.query(`
        SELECT a.id, a.title, a.slug, a.summary, a.difficulty, a.has_walkthrough, a.has_video,
               a.estimated_read_time, a.view_count, a.helpful_count, a.thumbnail_url,
               a.category_id, c.name as category_name, c.slug as category_slug
        FROM help_articles a
        LEFT JOIN help_categories c ON a.category_id = c.id
        WHERE a.status = 'PUBLISHED' AND (
          LOWER(a.title) LIKE $1 OR 
          LOWER(a.summary) LIKE $1 OR 
          LOWER(a.content) LIKE $1 OR
          LOWER(a.tags::text) LIKE $1
        )
        ORDER BY 
          CASE WHEN LOWER(a.title) LIKE $1 THEN 1 ELSE 2 END,
          a.view_count DESC
        LIMIT 20
      `, [searchTerm]);
      
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error searching articles:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });
  
  // GET /api/help/articles/featured - Get featured articles
  app.get("/api/help/articles/featured", async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT a.id, a.title, a.slug, a.summary, a.difficulty, a.has_walkthrough, a.has_video,
               a.estimated_read_time, a.view_count, a.helpful_count, a.thumbnail_url,
               a.category_id, c.name as category_name, c.slug as category_slug
        FROM help_articles a
        LEFT JOIN help_categories c ON a.category_id = c.id
        WHERE a.status = 'PUBLISHED'
        ORDER BY a.view_count DESC
        LIMIT 10
      `);
      
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching featured articles:", error);
      res.status(500).json({ error: "Failed to fetch featured articles" });
    }
  });
  
  // GET /api/help/articles/id/:id - Get article by ID (MUST be before :slug to avoid catch-all)
  app.get("/api/help/articles/id/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req.session as any)?.userId;
      
      const result = await pool.query(`
        SELECT a.*, c.name as category_name, c.slug as category_slug,
               u.username as author_username, u.display_name as author_name
        FROM help_articles a
        LEFT JOIN help_categories c ON a.category_id = c.id
        LEFT JOIN users u ON a.author_id = u.id
        WHERE a.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      const article = result.rows[0];
      
      if (article.status !== "PUBLISHED") {
        if (!userId) {
          return res.status(404).json({ error: "Article not found" });
        }
        const user = await storage.getUser(userId);
        if (!user || !user.isAdmin) {
          return res.status(404).json({ error: "Article not found" });
        }
      }
      
      await pool.query(
        `UPDATE help_articles SET view_count = view_count + 1 WHERE id = $1`,
        [article.id]
      );
      
      let steps: any[] = [];
      if (article.has_walkthrough) {
        const stepsResult = await pool.query(`
          SELECT * FROM help_article_steps WHERE article_id = $1 ORDER BY step_number ASC
        `, [article.id]);
        steps = stepsResult.rows;
      }
      
      let relatedArticles: any[] = [];
      if (article.related_article_ids && article.related_article_ids.length > 0) {
        const relatedResult = await pool.query(`
          SELECT id, title, slug, summary, thumbnail_url FROM help_articles
          WHERE id = ANY($1) AND status = 'PUBLISHED'
        `, [article.related_article_ids]);
        relatedArticles = relatedResult.rows;
      }
      
      res.json({ article: { ...article, steps, relatedArticles } });
    } catch (error: any) {
      console.error("Error fetching article by ID:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });
  
  // GET /api/help/articles/:slug - Get article by slug
  app.get("/api/help/articles/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const userId = (req.session as any)?.userId;
      
      const result = await pool.query(`
        SELECT a.*, c.name as category_name, c.slug as category_slug,
               u.username as author_username, u.display_name as author_name
        FROM help_articles a
        LEFT JOIN help_categories c ON a.category_id = c.id
        LEFT JOIN users u ON a.author_id = u.id
        WHERE a.slug = $1
      `, [slug]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      const article = result.rows[0];
      
      // Check access for non-published articles
      if (article.status !== "PUBLISHED") {
        if (!userId) {
          return res.status(404).json({ error: "Article not found" });
        }
        const user = await storage.getUser(userId);
        if (!user || !user.isAdmin) {
          return res.status(404).json({ error: "Article not found" });
        }
      }
      
      // Increment view count
      await pool.query(
        `UPDATE help_articles SET view_count = view_count + 1 WHERE id = $1`,
        [article.id]
      );
      
      // Get walkthrough steps if available
      let steps: any[] = [];
      if (article.has_walkthrough) {
        const stepsResult = await pool.query(`
          SELECT * FROM help_article_steps 
          WHERE article_id = $1 
          ORDER BY step_number ASC
        `, [article.id]);
        steps = stepsResult.rows;
      }
      
      // Get related articles
      let relatedArticles: any[] = [];
      if (article.related_article_ids && article.related_article_ids.length > 0) {
        const relatedResult = await pool.query(`
          SELECT id, title, slug, summary, thumbnail_url
          FROM help_articles
          WHERE id = ANY($1) AND status = 'PUBLISHED'
        `, [article.related_article_ids]);
        relatedArticles = relatedResult.rows;
      }
      
      res.json({ article: { ...article, steps, relatedArticles } });
    } catch (error: any) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });
  
  
  // POST /api/help/articles/:id/feedback - Submit article feedback
  app.post("/api/help/articles/:id/feedback", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isHelpful, comment } = req.body;
      const userId = (req.session as any)?.userId;
      
      await pool.query(`
        INSERT INTO help_feedback (user_id, article_id, is_helpful, comment)
        VALUES ($1, $2, $3, $4)
      `, [userId, id, isHelpful, comment]);
      
      // Update article counts
      if (isHelpful) {
        await pool.query(`UPDATE help_articles SET helpful_count = helpful_count + 1 WHERE id = $1`, [id]);
      } else {
        await pool.query(`UPDATE help_articles SET not_helpful_count = not_helpful_count + 1 WHERE id = $1`, [id]);
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });
  
  // POST /api/admin/help/articles - Create article (admin)
  app.post("/api/admin/help/articles", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = createArticleSchema.parse(req.body);
      const adminUser = (req as any).adminUser;
      const slug = generateSlug(data.title);
      
      const result = await pool.query(`
        INSERT INTO help_articles (
          category_id, title, slug, summary, content, difficulty,
          has_walkthrough, has_video, video_url, thumbnail_url,
          estimated_read_time, tags, related_article_ids,
          meta_title, meta_description, author_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'DRAFT')
        RETURNING *
      `, [
        data.categoryId, data.title, slug, data.summary, data.content,
        data.difficulty || "BEGINNER", data.hasWalkthrough || false, data.hasVideo || false,
        data.videoUrl, data.thumbnailUrl, data.estimatedReadTime || 2,
        JSON.stringify(data.tags || []), JSON.stringify(data.relatedArticleIds || []),
        data.metaTitle, data.metaDescription, adminUser.id
      ]);
      
      // Update category article count
      await pool.query(`
        UPDATE help_categories SET article_count = article_count + 1 WHERE id = $1
      `, [data.categoryId]);
      
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error("Error creating article:", error);
      res.status(500).json({ error: error.message || "Failed to create article" });
    }
  });
  
  // PUT /api/admin/help/articles/:id - Update article (admin)
  app.put("/api/admin/help/articles/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = createArticleSchema.partial().parse(req.body);
      const adminUser = (req as any).adminUser;
      
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      const fieldMap: { [key: string]: string } = {
        categoryId: "category_id",
        title: "title",
        summary: "summary",
        content: "content",
        difficulty: "difficulty",
        hasWalkthrough: "has_walkthrough",
        hasVideo: "has_video",
        videoUrl: "video_url",
        thumbnailUrl: "thumbnail_url",
        estimatedReadTime: "estimated_read_time",
        metaTitle: "meta_title",
        metaDescription: "meta_description",
      };
      
      for (const [key, dbField] of Object.entries(fieldMap)) {
        if ((data as any)[key] !== undefined) {
          updates.push(`${dbField} = $${paramIndex++}`);
          values.push((data as any)[key]);
        }
      }
      
      if (data.title) {
        updates.push(`slug = $${paramIndex++}`);
        values.push(generateSlug(data.title));
      }
      
      if (data.tags !== undefined) {
        updates.push(`tags = $${paramIndex++}`);
        values.push(JSON.stringify(data.tags));
      }
      
      if (data.relatedArticleIds !== undefined) {
        updates.push(`related_article_ids = $${paramIndex++}`);
        values.push(JSON.stringify(data.relatedArticleIds));
      }
      
      updates.push(`last_updated_by = $${paramIndex++}`);
      values.push(adminUser.id);
      updates.push(`updated_at = NOW()`);
      
      values.push(id);
      
      const result = await pool.query(`
        UPDATE help_articles SET ${updates.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error("Error updating article:", error);
      res.status(500).json({ error: error.message || "Failed to update article" });
    }
  });
  
  // POST /api/admin/help/articles/:id/publish - Publish article (admin)
  app.post("/api/admin/help/articles/:id/publish", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await pool.query(`
        UPDATE help_articles 
        SET status = 'PUBLISHED', published_at = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error("Error publishing article:", error);
      res.status(500).json({ error: "Failed to publish article" });
    }
  });
  
  // DELETE /api/admin/help/articles/:id - Delete article (admin)
  app.delete("/api/admin/help/articles/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [article] = (await pool.query(`SELECT category_id FROM help_articles WHERE id = $1`, [id])).rows;
      
      await pool.query(`DELETE FROM help_articles WHERE id = $1`, [id]);
      
      if (article) {
        await pool.query(`
          UPDATE help_categories SET article_count = article_count - 1 
          WHERE id = $1 AND article_count > 0
        `, [article.category_id]);
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting article:", error);
      res.status(500).json({ error: "Failed to delete article" });
    }
  });
  
  // ==================== ARTICLE WALKTHROUGH STEPS ====================
  
  // POST /api/admin/help/articles/:id/steps - Add walkthrough steps (admin)
  app.post("/api/admin/help/articles/:id/steps", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { steps } = req.body;
      
      if (!Array.isArray(steps)) {
        return res.status(400).json({ error: "Steps must be an array" });
      }
      
      // Delete existing steps
      await pool.query(`DELETE FROM help_article_steps WHERE article_id = $1`, [id]);
      
      // Insert new steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await pool.query(`
          INSERT INTO help_article_steps (
            article_id, step_number, title, description, image_url, video_url,
            target_element, screen_name, action_type
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          id, i + 1, step.title, step.description, step.imageUrl, step.videoUrl,
          step.targetElement, step.screenName, step.actionType
        ]);
      }
      
      // Update article
      await pool.query(`
        UPDATE help_articles SET has_walkthrough = true WHERE id = $1
      `, [id]);
      
      res.json({ success: true, stepsAdded: steps.length });
    } catch (error: any) {
      console.error("Error adding walkthrough steps:", error);
      res.status(500).json({ error: "Failed to add steps" });
    }
  });
  
  // ==================== FAQs ====================
  
  // GET /api/help/faqs - Get all FAQs
  app.get("/api/help/faqs", async (req: Request, res: Response) => {
    try {
      const { category, featured } = req.query;
      
      let whereClause = "f.is_active = true";
      const values: any[] = [];
      let paramIndex = 1;
      
      if (category) {
        whereClause += ` AND f.category_id = $${paramIndex++}`;
        values.push(category);
      }
      
      if (featured === "true") {
        whereClause += ` AND f.is_featured = true`;
      }
      
      const result = await pool.query(`
        SELECT f.*, c.name as category_name
        FROM help_faqs f
        LEFT JOIN help_categories c ON f.category_id = c.id
        WHERE ${whereClause}
        ORDER BY f.is_featured DESC, f.sort_order ASC, f.helpful_count DESC
      `, values);
      
      res.json({ faqs: result.rows });
    } catch (error: any) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });
  
  // POST /api/help/faqs/:id/feedback - Submit FAQ feedback
  app.post("/api/help/faqs/:id/feedback", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isHelpful } = req.body;
      const userId = (req.session as any)?.userId;
      
      await pool.query(`
        INSERT INTO help_feedback (user_id, faq_id, is_helpful)
        VALUES ($1, $2, $3)
      `, [userId, id, isHelpful]);
      
      if (isHelpful) {
        await pool.query(`UPDATE help_faqs SET helpful_count = helpful_count + 1 WHERE id = $1`, [id]);
      } else {
        await pool.query(`UPDATE help_faqs SET not_helpful_count = not_helpful_count + 1 WHERE id = $1`, [id]);
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error submitting FAQ feedback:", error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });
  
  // POST /api/admin/help/faqs - Create FAQ (admin)
  app.post("/api/admin/help/faqs", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = createFaqSchema.parse(req.body);
      
      const result = await pool.query(`
        INSERT INTO help_faqs (category_id, question, answer, sort_order, is_featured)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [data.categoryId, data.question, data.answer, data.sortOrder || 0, data.isFeatured || false]);
      
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error("Error creating FAQ:", error);
      res.status(500).json({ error: error.message || "Failed to create FAQ" });
    }
  });
  
  // PUT /api/admin/help/faqs/:id - Update FAQ (admin)
  app.put("/api/admin/help/faqs/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = createFaqSchema.partial().parse(req.body);
      
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (data.categoryId !== undefined) {
        updates.push(`category_id = $${paramIndex++}`);
        values.push(data.categoryId);
      }
      if (data.question !== undefined) {
        updates.push(`question = $${paramIndex++}`);
        values.push(data.question);
      }
      if (data.answer !== undefined) {
        updates.push(`answer = $${paramIndex++}`);
        values.push(data.answer);
      }
      if (data.sortOrder !== undefined) {
        updates.push(`sort_order = $${paramIndex++}`);
        values.push(data.sortOrder);
      }
      if (data.isFeatured !== undefined) {
        updates.push(`is_featured = $${paramIndex++}`);
        values.push(data.isFeatured);
      }
      
      updates.push(`updated_at = NOW()`);
      values.push(id);
      
      const result = await pool.query(`
        UPDATE help_faqs SET ${updates.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "FAQ not found" });
      }
      
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error("Error updating FAQ:", error);
      res.status(500).json({ error: error.message || "Failed to update FAQ" });
    }
  });
  
  // DELETE /api/admin/help/faqs/:id - Delete FAQ (admin)
  app.delete("/api/admin/help/faqs/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      await pool.query(`UPDATE help_faqs SET is_active = false WHERE id = $1`, [id]);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting FAQ:", error);
      res.status(500).json({ error: "Failed to delete FAQ" });
    }
  });
  
  // ==================== SUPPORT INBOX & TICKETS ====================
  
  // GET /api/support/inbox - Get user's support inbox
  app.get("/api/support/inbox", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Get or create inbox
      let inboxResult = await pool.query(
        `SELECT * FROM support_inboxes WHERE user_id = $1`,
        [userId]
      );
      
      if (inboxResult.rows.length === 0) {
        inboxResult = await pool.query(`
          INSERT INTO support_inboxes (user_id) VALUES ($1) RETURNING *
        `, [userId]);
      }
      
      const inbox = inboxResult.rows[0];
      
      // Get tickets
      const ticketsResult = await pool.query(`
        SELECT t.*, 
          (SELECT COUNT(*) FROM support_ticket_messages WHERE ticket_id = t.id) as message_count,
          (SELECT content FROM support_ticket_messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM support_tickets t
        WHERE t.user_id = $1
        ORDER BY t.updated_at DESC
      `, [userId]);
      
      res.json({ inbox, tickets: ticketsResult.rows });
    } catch (error: any) {
      console.error("Error fetching support inbox:", error);
      res.status(500).json({ error: "Failed to fetch inbox" });
    }
  });
  
  // POST /api/support/tickets - Create support ticket
  app.post("/api/support/tickets", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const data = createTicketSchema.parse(req.body);
      
      // Ensure user has inbox
      await pool.query(`
        INSERT INTO support_inboxes (user_id) VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING
      `, [userId]);
      
      // Create ticket
      const ticketResult = await pool.query(`
        INSERT INTO support_tickets (user_id, category, priority, subject, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [userId, data.category, data.priority || "MEDIUM", data.subject, data.description]);
      
      const ticket = ticketResult.rows[0];
      
      // Create initial message
      await pool.query(`
        INSERT INTO support_ticket_messages (ticket_id, sender_id, sender_type, content)
        VALUES ($1, $2, 'USER', $3)
      `, [ticket.id, userId, data.description]);
      
      // Update inbox stats
      await pool.query(`
        UPDATE support_inboxes 
        SET total_tickets = total_tickets + 1, open_tickets = open_tickets + 1, last_activity_at = NOW()
        WHERE user_id = $1
      `, [userId]);
      
      // Send confirmation email (async, don't block response)
      const user = await storage.getUser(userId);
      if (user && user.email) {
        sendTicketCreatedEmail(
          user.email,
          user.displayName || user.username || 'User',
          ticket.id,
          data.subject,
          data.category
        ).catch(err => console.error('[Email] Failed to send ticket created email:', err));
      }
      
      res.status(201).json(ticket);
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ error: error.message || "Failed to create ticket" });
    }
  });
  
  // GET /api/support/tickets/:id - Get ticket with messages
  app.get("/api/support/tickets/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { id } = req.params;
      
      const ticketResult = await pool.query(`
        SELECT t.*, u.username, u.display_name, u.avatar_url
        FROM support_tickets t
        JOIN users u ON t.user_id = u.id
        WHERE t.id = $1
      `, [id]);
      
      if (ticketResult.rows.length === 0) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      const ticket = ticketResult.rows[0];
      
      // Check access
      const user = await storage.getUser(userId);
      const isAdmin = user && user.isAdmin;
      
      if (ticket.user_id !== userId && !isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get messages with attachments
      const messagesResult = await pool.query(`
        SELECT m.*, u.username, u.display_name, u.avatar_url
        FROM support_ticket_messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.ticket_id = $1
        ORDER BY m.created_at ASC
      `, [id]);
      
      // Get attachments for messages
      const messageIds = messagesResult.rows.map(m => m.id);
      let attachments: any[] = [];
      if (messageIds.length > 0) {
        const attachmentsResult = await pool.query(`
          SELECT * FROM ticket_attachments WHERE message_id = ANY($1)
        `, [messageIds]);
        attachments = attachmentsResult.rows;
      }
      
      // Group attachments by message
      const messageAttachments: { [key: string]: any[] } = {};
      for (const att of attachments) {
        if (!messageAttachments[att.message_id]) {
          messageAttachments[att.message_id] = [];
        }
        messageAttachments[att.message_id].push(att);
      }
      
      const messagesWithAttachments = messagesResult.rows.map(m => ({
        ...m,
        attachments: messageAttachments[m.id] || [],
      }));
      
      res.json({ ticket, messages: messagesWithAttachments });
    } catch (error: any) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  });
  
  // GET /api/support/tickets/:id/messages - Get ticket messages (for polling)
  app.get("/api/support/tickets/:id/messages", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { id } = req.params;
      
      // Verify ticket access
      const ticketResult = await pool.query(`
        SELECT user_id FROM support_tickets WHERE id = $1
      `, [id]);
      
      if (ticketResult.rows.length === 0) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      const user = await storage.getUser(userId);
      const isAdmin = user && user.isAdmin;
      
      if (ticketResult.rows[0].user_id !== userId && !isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Get messages with attachments
      const messagesResult = await pool.query(`
        SELECT m.*, u.username, u.display_name, u.avatar_url
        FROM support_ticket_messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.ticket_id = $1
        ORDER BY m.created_at ASC
      `, [id]);
      
      // Get attachments
      const messageIds = messagesResult.rows.map(m => m.id);
      let attachments: any[] = [];
      if (messageIds.length > 0) {
        const attachmentsResult = await pool.query(`
          SELECT * FROM ticket_attachments WHERE message_id = ANY($1)
        `, [messageIds]);
        attachments = attachmentsResult.rows;
      }
      
      const messageAttachments: { [key: string]: any[] } = {};
      for (const att of attachments) {
        if (!messageAttachments[att.message_id]) {
          messageAttachments[att.message_id] = [];
        }
        messageAttachments[att.message_id].push(att);
      }
      
      const messagesWithAttachments = messagesResult.rows.map(m => ({
        ...m,
        attachments: messageAttachments[m.id] || [],
      }));
      
      res.json({ messages: messagesWithAttachments });
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  
  // POST /api/support/tickets/:id/messages - Send message in ticket
  app.post("/api/support/tickets/:id/messages", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { id } = req.params;
      const data = createTicketMessageSchema.parse(req.body);
      
      // Verify access
      const ticketResult = await pool.query(`SELECT * FROM support_tickets WHERE id = $1`, [id]);
      if (ticketResult.rows.length === 0) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      const ticket = ticketResult.rows[0];
      const user = await storage.getUser(userId);
      const isAdmin = user && user.isAdmin;
      
      if (ticket.user_id !== userId && !isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const senderType = isAdmin ? "ADMIN" : "USER";
      
      // Create message
      const messageResult = await pool.query(`
        INSERT INTO support_ticket_messages (ticket_id, sender_id, sender_type, content)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [id, userId, senderType, data.content]);
      
      // Update ticket
      await pool.query(`
        UPDATE support_tickets SET updated_at = NOW() WHERE id = $1
      `, [id]);
      
      // Update inbox
      await pool.query(`
        UPDATE support_inboxes SET last_activity_at = NOW() WHERE user_id = $1
      `, [ticket.user_id]);
      
      // Send email notification when admin replies to user
      if (senderType === "ADMIN" && ticket.user_id !== userId) {
        const ticketOwner = await storage.getUser(ticket.user_id);
        if (ticketOwner && ticketOwner.email) {
          sendTicketReplyEmail(
            ticketOwner.email,
            ticketOwner.displayName || ticketOwner.username || 'User',
            ticket.id,
            ticket.subject,
            user?.displayName || user?.username || 'Support Team',
            data.content
          ).catch(err => console.error('[Email] Failed to send ticket reply email:', err));
        }
      }
      
      res.status(201).json(messageResult.rows[0]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: error.message || "Failed to send message" });
    }
  });
  
  // POST /api/support/tickets/:ticketId/messages/:messageId/attachments - Upload attachment
  app.post(
    "/api/support/tickets/:ticketId/messages/:messageId/attachments",
    supportUpload.single("file"),
    async (req: Request, res: Response) => {
      try {
        const userId = (req.session as any)?.userId;
        if (!userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        
        const { ticketId, messageId } = req.params;
        const file = req.file;
        
        if (!file) {
          return res.status(400).json({ error: "No file provided" });
        }
        
        // Verify access
        const ticketResult = await pool.query(`SELECT * FROM support_tickets WHERE id = $1`, [ticketId]);
        if (ticketResult.rows.length === 0) {
          cleanupTempFile(file.path);
          return res.status(404).json({ error: "Ticket not found" });
        }
        
        const ticket = ticketResult.rows[0];
        const user = await storage.getUser(userId);
        const isAdmin = user && user.isAdmin;
        
        if (ticket.user_id !== userId && !isAdmin) {
          cleanupTempFile(file.path);
          return res.status(403).json({ error: "Access denied" });
        }
        
        // Determine file type
        let fileType = "OTHER";
        if (file.mimetype.startsWith("image/")) fileType = "IMAGE";
        else if (file.mimetype.startsWith("video/")) fileType = "VIDEO";
        else if (file.mimetype.startsWith("audio/")) fileType = "AUDIO";
        else if (file.mimetype === "application/pdf") fileType = "DOCUMENT";
        else if (file.mimetype.includes("document") || file.mimetype.includes("text")) fileType = "DOCUMENT";
        
        // Upload to Cloudinary
        const resourceType = fileType === "VIDEO" ? "video" : fileType === "AUDIO" ? "raw" : "image";
        const uploadResult = await uploadToCloudinaryFromFile(
          file.path,
          `support/${ticketId}`,
          resourceType as "image" | "video" | "raw"
        );
        
        cleanupTempFile(file.path);
        
        // Create attachment record
        const attachmentResult = await pool.query(`
          INSERT INTO ticket_attachments (
            message_id, ticket_id, file_name, file_type, mime_type,
            file_size, file_url, thumbnail_url, public_id, uploaded_by_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `, [
          messageId, ticketId, file.originalname, fileType, file.mimetype,
          file.size, uploadResult.url, uploadResult.thumbnailUrl || uploadResult.url,
          uploadResult.publicId, userId
        ]);
        
        res.status(201).json(attachmentResult.rows[0]);
      } catch (error: any) {
        console.error("Error uploading attachment:", error);
        if (req.file) cleanupTempFile(req.file.path);
        res.status(500).json({ error: error.message || "Failed to upload attachment" });
      }
    }
  );
  
  // POST /api/support/tickets/:id/read - Mark messages as read
  app.post("/api/support/tickets/:id/read", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { id } = req.params;
      
      // Verify access
      const ticketResult = await pool.query(`SELECT user_id FROM support_tickets WHERE id = $1`, [id]);
      if (ticketResult.rows.length === 0) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      const user = await storage.getUser(userId);
      const isAdmin = user && user.isAdmin;
      
      if (ticketResult.rows[0].user_id !== userId && !isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Mark all messages from the other party as read
      const senderType = isAdmin ? "USER" : "ADMIN";
      await pool.query(`
        UPDATE support_ticket_messages 
        SET read_at = NOW() 
        WHERE ticket_id = $1 AND sender_type = $2 AND read_at IS NULL
      `, [id, senderType]);
      
      // Update unread count in inbox if user
      if (!isAdmin) {
        await pool.query(`
          UPDATE support_inboxes 
          SET unread_messages = GREATEST(unread_messages - 1, 0)
          WHERE user_id = $1
        `, [userId]);
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });
  
  // PATCH /api/support/tickets/:id - Update ticket (supports status changes)
  app.patch("/api/support/tickets/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { id } = req.params;
      const { status } = req.body;
      
      const ticketResult = await pool.query(`SELECT * FROM support_tickets WHERE id = $1`, [id]);
      if (ticketResult.rows.length === 0) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      const ticket = ticketResult.rows[0];
      const user = await storage.getUser(userId);
      const isAdmin = user && user.isAdmin;
      
      // Users can only close their own tickets
      if (!isAdmin && (ticket.user_id !== userId || status !== "CLOSED")) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await pool.query(`
        UPDATE support_tickets 
        SET status = $1, updated_at = NOW(), 
            resolved_at = CASE WHEN $1 IN ('CLOSED', 'RESOLVED') THEN NOW() ELSE resolved_at END,
            closed_at = CASE WHEN $1 = 'CLOSED' THEN NOW() ELSE closed_at END
        WHERE id = $2
      `, [status, id]);
      
      // Update inbox stats
      if (status === "CLOSED" || status === "RESOLVED") {
        await pool.query(`
          UPDATE support_inboxes 
          SET open_tickets = GREATEST(open_tickets - 1, 0)
          WHERE user_id = $1
        `, [ticket.user_id]);
      }
      
      res.json({ success: true, status });
    } catch (error: any) {
      console.error("Error updating ticket:", error);
      res.status(500).json({ error: "Failed to update ticket" });
    }
  });
  
  // PUT /api/support/tickets/:id/status - Update ticket status (user can close)
  app.put("/api/support/tickets/:id/status", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { id } = req.params;
      const { status } = req.body;
      
      const ticketResult = await pool.query(`SELECT * FROM support_tickets WHERE id = $1`, [id]);
      if (ticketResult.rows.length === 0) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      const ticket = ticketResult.rows[0];
      const user = await storage.getUser(userId);
      const isAdmin = user && user.isAdmin;
      
      // Users can only close their own tickets
      if (!isAdmin && (ticket.user_id !== userId || status !== "CLOSED")) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const updates: any = { status, updated_at: new Date() };
      if (status === "CLOSED" || status === "RESOLVED") {
        updates.resolved_at = new Date();
      }
      
      await pool.query(`
        UPDATE support_tickets 
        SET status = $1, updated_at = NOW(), resolved_at = CASE WHEN $1 IN ('CLOSED', 'RESOLVED') THEN NOW() ELSE resolved_at END
        WHERE id = $2
      `, [status, id]);
      
      // Update inbox stats
      if (status === "CLOSED" || status === "RESOLVED") {
        await pool.query(`
          UPDATE support_inboxes 
          SET open_tickets = GREATEST(open_tickets - 1, 0)
          WHERE user_id = $1
        `, [ticket.user_id]);
      }
      
      // Send status update email to ticket owner
      if (isAdmin && ticket.user_id !== userId) {
        const ticketOwner = await storage.getUser(ticket.user_id);
        if (ticketOwner && ticketOwner.email) {
          const statusMessages: Record<string, string> = {
            RESOLVED: "Your issue has been resolved. If you have any further questions, feel free to reopen this ticket within 7 days.",
            CLOSED: "This ticket has been closed. Thank you for contacting RabitChat Support.",
            IN_PROGRESS: "Our team is now actively working on your request. We'll update you as soon as we have more information.",
            ESCALATED: "Your ticket has been escalated to our senior support team for priority handling.",
            PENDING: "We're waiting for additional information to proceed. Please respond to this ticket if you have updates."
          };
          
          sendTicketStatusUpdateEmail(
            ticketOwner.email,
            ticketOwner.displayName || ticketOwner.username || 'User',
            ticket.id,
            ticket.subject,
            status,
            statusMessages[status] || "Your ticket status has been updated."
          ).catch(err => console.error('[Email] Failed to send status update email:', err));
          
          // Send satisfaction survey for resolved tickets
          if (status === "RESOLVED") {
            sendTicketSatisfactionEmail(
              ticketOwner.email,
              ticketOwner.displayName || ticketOwner.username || 'User',
              ticket.id,
              ticket.subject
            ).catch(err => console.error('[Email] Failed to send satisfaction email:', err));
          }
        }
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating ticket status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });
  
  // ==================== ADMIN TICKET MANAGEMENT ====================
  
  // GET /api/admin/support/tickets - Get all tickets (admin)
  app.get("/api/admin/support/tickets", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status, category, priority, assignee, search, limit = 50, offset = 0 } = req.query;
      
      let whereClause = "1=1";
      const values: any[] = [];
      let paramIndex = 1;
      
      if (status) {
        whereClause += ` AND t.status = $${paramIndex++}`;
        values.push(status);
      }
      if (category) {
        whereClause += ` AND t.category = $${paramIndex++}`;
        values.push(category);
      }
      if (priority) {
        whereClause += ` AND t.priority = $${paramIndex++}`;
        values.push(priority);
      }
      if (assignee) {
        whereClause += ` AND t.assigned_to = $${paramIndex++}`;
        values.push(assignee);
      }
      if (search) {
        whereClause += ` AND (t.subject ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
        values.push(`%${search}%`);
        paramIndex++;
      }
      
      values.push(Number(limit), Number(offset));
      
      const result = await pool.query(`
        SELECT t.*, u.username, u.display_name, u.avatar_url,
          a.username as assignee_username, a.display_name as assignee_name,
          (SELECT COUNT(*) FROM support_ticket_messages WHERE ticket_id = t.id) as message_count
        FROM support_tickets t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN users a ON t.assigned_to = a.id
        WHERE ${whereClause}
        ORDER BY 
          CASE t.priority 
            WHEN 'URGENT' THEN 1 
            WHEN 'HIGH' THEN 2 
            WHEN 'MEDIUM' THEN 3 
            ELSE 4 
          END,
          t.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `, values);
      
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM support_tickets t WHERE ${whereClause}`,
        values.slice(0, -2)
      );
      
      res.json({
        tickets: result.rows,
        total: parseInt(countResult.rows[0].count),
      });
    } catch (error: any) {
      console.error("Error fetching admin tickets:", error);
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  });
  
  // PUT /api/admin/support/tickets/:id/assign - Assign ticket (admin)
  app.put("/api/admin/support/tickets/:id/assign", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { assigneeId } = req.body;
      
      await pool.query(`
        UPDATE support_tickets 
        SET assigned_to = $1, status = CASE WHEN status = 'OPEN' THEN 'IN_PROGRESS' ELSE status END, updated_at = NOW()
        WHERE id = $2
      `, [assigneeId, id]);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error assigning ticket:", error);
      res.status(500).json({ error: "Failed to assign ticket" });
    }
  });
  
  // POST /api/admin/support/tickets/:id/notes - Add internal note (admin)
  app.post("/api/admin/support/tickets/:id/notes", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { note } = req.body;
      const adminUser = (req as any).adminUser;
      
      const result = await pool.query(`
        INSERT INTO ticket_internal_notes (ticket_id, admin_id, note)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [id, adminUser.id, note]);
      
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error("Error adding internal note:", error);
      res.status(500).json({ error: "Failed to add note" });
    }
  });
  
  // GET /api/admin/support/tickets/:id/notes - Get internal notes (admin)
  app.get("/api/admin/support/tickets/:id/notes", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await pool.query(`
        SELECT n.*, u.username, u.display_name, u.avatar_url
        FROM ticket_internal_notes n
        JOIN users u ON n.admin_id = u.id
        WHERE n.ticket_id = $1
        ORDER BY n.created_at DESC
      `, [id]);
      
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching internal notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });
  
  // ==================== CANNED RESPONSES ====================
  
  // GET /api/admin/support/canned-responses - Get canned responses (admin)
  app.get("/api/admin/support/canned-responses", requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT * FROM canned_responses WHERE is_active = true ORDER BY usage_count DESC
      `);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching canned responses:", error);
      res.status(500).json({ error: "Failed to fetch canned responses" });
    }
  });
  
  // POST /api/admin/support/canned-responses - Create canned response (admin)
  app.post("/api/admin/support/canned-responses", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { title, content, category, shortcut } = req.body;
      const adminUser = (req as any).adminUser;
      
      const result = await pool.query(`
        INSERT INTO canned_responses (title, content, category, shortcut, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [title, content, category, shortcut, adminUser.id]);
      
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error("Error creating canned response:", error);
      res.status(500).json({ error: "Failed to create canned response" });
    }
  });
  
  // ==================== SYSTEM STATUS ====================
  
  // GET /api/help/status - Get system status
  app.get("/api/help/status", async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT * FROM system_status 
        WHERE resolved_at IS NULL OR resolved_at > NOW() - INTERVAL '24 hours'
        ORDER BY 
          CASE status 
            WHEN 'MAJOR_OUTAGE' THEN 1 
            WHEN 'PARTIAL_OUTAGE' THEN 2
            WHEN 'DEGRADED' THEN 3 
            WHEN 'MAINTENANCE' THEN 4 
            ELSE 5 
          END,
          started_at DESC
      `);
      
      // Calculate overall status
      const statuses = result.rows;
      let overallStatus = "OPERATIONAL";
      let overallMessage = "All systems operational";
      
      if (statuses.some(s => s.status === "MAJOR_OUTAGE" && !s.resolved_at)) {
        overallStatus = "MAJOR_OUTAGE";
        overallMessage = "Major outage detected";
      } else if (statuses.some(s => s.status === "PARTIAL_OUTAGE" && !s.resolved_at)) {
        overallStatus = "PARTIAL_OUTAGE";
        overallMessage = "Partial outage detected";
      } else if (statuses.some(s => s.status === "DEGRADED" && !s.resolved_at)) {
        overallStatus = "DEGRADED";
        overallMessage = "Some services experiencing issues";
      } else if (statuses.some(s => s.status === "MAINTENANCE" && !s.resolved_at)) {
        overallStatus = "MAINTENANCE";
        overallMessage = "Scheduled maintenance in progress";
      }
      
      // Return format expected by frontend
      res.json({ 
        status: overallStatus === "OPERATIONAL" ? "operational" : overallStatus.toLowerCase(),
        message: overallMessage,
        lastChecked: new Date().toISOString(),
        incidents: statuses 
      });
    } catch (error: any) {
      console.error("Error fetching system status:", error);
      res.status(500).json({ error: "Failed to fetch status" });
    }
  });
  
  // POST /api/admin/help/status - Create status incident (admin)
  app.post("/api/admin/help/status", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { component, status, title, description, affectedFeatures } = req.body;
      const adminUser = (req as any).adminUser;
      
      const result = await pool.query(`
        INSERT INTO system_status (component, status, title, description, affected_features, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [component, status, title, description, JSON.stringify(affectedFeatures || []), adminUser.id]);
      
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error("Error creating status:", error);
      res.status(500).json({ error: "Failed to create status" });
    }
  });
  
  // PUT /api/admin/help/status/:id/resolve - Resolve status incident (admin)
  app.put("/api/admin/help/status/:id/resolve", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      await pool.query(`
        UPDATE system_status SET status = 'OPERATIONAL', resolved_at = NOW(), updated_at = NOW()
        WHERE id = $1
      `, [id]);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error resolving status:", error);
      res.status(500).json({ error: "Failed to resolve status" });
    }
  });
  
  // ==================== KNOWN ISSUES ====================
  
  // GET /api/help/known-issues - Get known issues
  app.get("/api/help/known-issues", async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT * FROM known_issues 
        WHERE is_public = true AND status != 'FIXED'
        ORDER BY priority DESC, report_count DESC
      `);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching known issues:", error);
      res.status(500).json({ error: "Failed to fetch known issues" });
    }
  });
  
  // ==================== SAFETY RESOURCES ====================
  
  // GET /api/help/safety-resources - Get safety resources
  app.get("/api/help/safety-resources", async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT * FROM safety_resources 
        ORDER BY is_emergency DESC, sort_order ASC
      `);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching safety resources:", error);
      res.status(500).json({ error: "Failed to fetch safety resources" });
    }
  });
  
  // ==================== FEATURE REQUESTS ====================
  
  // GET /api/help/feature-requests - Get feature requests
  app.get("/api/help/feature-requests", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      const { status, sort = "popular" } = req.query;
      
      let whereClause = "1=1";
      const values: any[] = [];
      let paramIndex = 1;
      
      if (status) {
        whereClause += ` AND fr.status = $${paramIndex++}`;
        values.push(status);
      }
      
      let orderBy = "fr.upvotes DESC";
      if (sort === "newest") orderBy = "fr.created_at DESC";
      else if (sort === "trending") orderBy = "(fr.upvotes - fr.downvotes) DESC";
      
      const result = await pool.query(`
        SELECT fr.*, u.username, u.display_name, u.avatar_url
        FROM feature_requests fr
        JOIN users u ON fr.user_id = u.id
        WHERE ${whereClause}
        ORDER BY ${orderBy}
        LIMIT 50
      `, values);
      
      // Get user's votes if logged in
      let userVotes: { [key: string]: boolean } = {};
      if (userId) {
        const votesResult = await pool.query(`
          SELECT request_id, is_upvote FROM feature_request_votes WHERE user_id = $1
        `, [userId]);
        for (const vote of votesResult.rows) {
          userVotes[vote.request_id] = vote.is_upvote;
        }
      }
      
      const requestsWithVotes = result.rows.map(r => ({
        ...r,
        userVote: userVotes[r.id],
      }));
      
      res.json(requestsWithVotes);
    } catch (error: any) {
      console.error("Error fetching feature requests:", error);
      res.status(500).json({ error: "Failed to fetch feature requests" });
    }
  });
  
  // POST /api/help/feature-requests - Create feature request
  app.post("/api/help/feature-requests", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const data = createFeatureRequestSchema.parse(req.body);
      
      const result = await pool.query(`
        INSERT INTO feature_requests (user_id, title, description, category)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [userId, data.title, data.description, data.category]);
      
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error("Error creating feature request:", error);
      res.status(500).json({ error: error.message || "Failed to create feature request" });
    }
  });
  
  // POST /api/help/feature-requests/:id/vote - Vote on feature request
  app.post("/api/help/feature-requests/:id/vote", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { id } = req.params;
      const { isUpvote } = req.body;
      
      // Check existing vote
      const existingVote = await pool.query(`
        SELECT * FROM feature_request_votes WHERE request_id = $1 AND user_id = $2
      `, [id, userId]);
      
      if (existingVote.rows.length > 0) {
        const oldVote = existingVote.rows[0];
        
        if (oldVote.is_upvote === isUpvote) {
          // Remove vote
          await pool.query(`DELETE FROM feature_request_votes WHERE id = $1`, [oldVote.id]);
          
          if (isUpvote) {
            await pool.query(`UPDATE feature_requests SET upvotes = upvotes - 1 WHERE id = $1`, [id]);
          } else {
            await pool.query(`UPDATE feature_requests SET downvotes = downvotes - 1 WHERE id = $1`, [id]);
          }
        } else {
          // Change vote
          await pool.query(`UPDATE feature_request_votes SET is_upvote = $1 WHERE id = $2`, [isUpvote, oldVote.id]);
          
          if (isUpvote) {
            await pool.query(`UPDATE feature_requests SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = $1`, [id]);
          } else {
            await pool.query(`UPDATE feature_requests SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = $1`, [id]);
          }
        }
      } else {
        // New vote
        await pool.query(`
          INSERT INTO feature_request_votes (request_id, user_id, is_upvote)
          VALUES ($1, $2, $3)
        `, [id, userId, isUpvote]);
        
        if (isUpvote) {
          await pool.query(`UPDATE feature_requests SET upvotes = upvotes + 1 WHERE id = $1`, [id]);
        } else {
          await pool.query(`UPDATE feature_requests SET downvotes = downvotes + 1 WHERE id = $1`, [id]);
        }
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error voting on feature request:", error);
      res.status(500).json({ error: "Failed to vote" });
    }
  });
  
  // ==================== COMMUNITY Q&A ====================
  
  // GET /api/help/community/questions - Get community questions
  app.get("/api/help/community/questions", async (req: Request, res: Response) => {
    try {
      const { category, solved, search, limit = 20, offset = 0 } = req.query;
      
      let whereClause = "1=1";
      const values: any[] = [];
      let paramIndex = 1;
      
      if (category) {
        whereClause += ` AND q.category_id = $${paramIndex++}`;
        values.push(category);
      }
      if (solved !== undefined) {
        whereClause += ` AND q.is_solved = $${paramIndex++}`;
        values.push(solved === "true");
      }
      if (search) {
        whereClause += ` AND (q.title ILIKE $${paramIndex} OR q.body ILIKE $${paramIndex})`;
        values.push(`%${search}%`);
        paramIndex++;
      }
      
      values.push(Number(limit), Number(offset));
      
      const result = await pool.query(`
        SELECT q.*, u.username, u.display_name, u.avatar_url, u.is_verified,
               c.name as category_name
        FROM community_questions q
        JOIN users u ON q.user_id = u.id
        LEFT JOIN help_categories c ON q.category_id = c.id
        WHERE ${whereClause}
        ORDER BY q.is_pinned DESC, q.upvotes DESC, q.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `, values);
      
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching community questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });
  
  // POST /api/help/community/questions - Ask a question
  app.post("/api/help/community/questions", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const data = createCommunityQuestionSchema.parse(req.body);
      
      const result = await pool.query(`
        INSERT INTO community_questions (user_id, category_id, title, body)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [userId, data.categoryId, data.title, data.body]);
      
      // Update user progress
      await pool.query(`
        INSERT INTO user_help_progress (user_id, questions_asked)
        VALUES ($1, 1)
        ON CONFLICT (user_id) DO UPDATE SET questions_asked = user_help_progress.questions_asked + 1
      `, [userId]);
      
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error("Error creating question:", error);
      res.status(500).json({ error: error.message || "Failed to create question" });
    }
  });
  
  // GET /api/help/community/questions/:id - Get question with answers
  app.get("/api/help/community/questions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const questionResult = await pool.query(`
        SELECT q.*, u.username, u.display_name, u.avatar_url, u.is_verified,
               c.name as category_name
        FROM community_questions q
        JOIN users u ON q.user_id = u.id
        LEFT JOIN help_categories c ON q.category_id = c.id
        WHERE q.id = $1
      `, [id]);
      
      if (questionResult.rows.length === 0) {
        return res.status(404).json({ error: "Question not found" });
      }
      
      // Increment view count
      await pool.query(`UPDATE community_questions SET view_count = view_count + 1 WHERE id = $1`, [id]);
      
      const answersResult = await pool.query(`
        SELECT a.*, u.username, u.display_name, u.avatar_url, u.is_verified,
               v.username as verifier_username
        FROM community_answers a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN users v ON a.verified_by = v.id
        WHERE a.question_id = $1
        ORDER BY a.is_accepted DESC, a.is_verified DESC, a.upvotes DESC
      `, [id]);
      
      res.json({ question: questionResult.rows[0], answers: answersResult.rows });
    } catch (error: any) {
      console.error("Error fetching question:", error);
      res.status(500).json({ error: "Failed to fetch question" });
    }
  });
  
  // POST /api/help/community/questions/:id/answers - Answer a question
  app.post("/api/help/community/questions/:id/answers", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { id } = req.params;
      const data = createCommunityAnswerSchema.parse(req.body);
      
      const result = await pool.query(`
        INSERT INTO community_answers (question_id, user_id, body)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [id, userId, data.body]);
      
      // Update question answer count
      await pool.query(`UPDATE community_questions SET answer_count = answer_count + 1 WHERE id = $1`, [id]);
      
      // Update user progress
      await pool.query(`
        INSERT INTO user_help_progress (user_id, answers_posted)
        VALUES ($1, 1)
        ON CONFLICT (user_id) DO UPDATE SET answers_posted = user_help_progress.answers_posted + 1
      `, [userId]);
      
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error("Error creating answer:", error);
      res.status(500).json({ error: error.message || "Failed to create answer" });
    }
  });
  
  // POST /api/help/community/answers/:id/accept - Accept answer (question owner)
  app.post("/api/help/community/answers/:id/accept", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const { id } = req.params;
      
      const answerResult = await pool.query(`SELECT * FROM community_answers WHERE id = $1`, [id]);
      if (answerResult.rows.length === 0) {
        return res.status(404).json({ error: "Answer not found" });
      }
      
      const answer = answerResult.rows[0];
      
      const questionResult = await pool.query(`SELECT * FROM community_questions WHERE id = $1`, [answer.question_id]);
      if (questionResult.rows[0].user_id !== userId) {
        return res.status(403).json({ error: "Only question owner can accept answer" });
      }
      
      // Unaccept previous answer if any
      await pool.query(`UPDATE community_answers SET is_accepted = false WHERE question_id = $1`, [answer.question_id]);
      
      // Accept this answer
      await pool.query(`UPDATE community_answers SET is_accepted = true WHERE id = $1`, [id]);
      
      // Mark question as solved
      await pool.query(`UPDATE community_questions SET is_solved = true, accepted_answer_id = $1 WHERE id = $2`, [id, answer.question_id]);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error accepting answer:", error);
      res.status(500).json({ error: "Failed to accept answer" });
    }
  });
  
  // ==================== APPEALS ====================
  
  // GET /api/help/appeals - Get user's appeals
  app.get("/api/help/appeals", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const result = await pool.query(`
        SELECT * FROM appeals WHERE user_id = $1 ORDER BY created_at DESC
      `, [userId]);
      
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching appeals:", error);
      res.status(500).json({ error: "Failed to fetch appeals" });
    }
  });
  
  // POST /api/help/appeals - Submit appeal
  app.post("/api/help/appeals", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const data = createAppealSchema.parse(req.body);
      
      const result = await pool.query(`
        INSERT INTO appeals (user_id, type, subject, description, reference_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [userId, data.type, data.subject, data.description, data.referenceId]);
      
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error("Error creating appeal:", error);
      res.status(500).json({ error: error.message || "Failed to create appeal" });
    }
  });
  
  // ==================== APP CHANGELOG ====================
  
  // GET /api/help/changelog - Get app changelog
  app.get("/api/help/changelog", async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT * FROM app_changelog 
        WHERE is_published = true 
        ORDER BY published_at DESC
        LIMIT 20
      `);
      res.json({ entries: result.rows });
    } catch (error: any) {
      console.error("Error fetching changelog:", error);
      res.status(500).json({ error: "Failed to fetch changelog" });
    }
  });
  
  // POST /api/admin/help/changelog - Create changelog entry (admin)
  app.post("/api/admin/help/changelog", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { version, title, description, features, improvements, bugFixes, imageUrl, isPublished } = req.body;
      
      const result = await pool.query(`
        INSERT INTO app_changelog (version, title, description, features, improvements, bug_fixes, image_url, is_published, published_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $8 THEN NOW() ELSE NULL END)
        RETURNING *
      `, [version, title, description, JSON.stringify(features || []), JSON.stringify(improvements || []), JSON.stringify(bugFixes || []), imageUrl, isPublished || false]);
      
      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error("Error creating changelog:", error);
      res.status(500).json({ error: "Failed to create changelog" });
    }
  });
  
  // ==================== SAFETY RESOURCES ====================
  
  // GET /api/help/safety - Get safety resources
  app.get("/api/help/safety", async (req: Request, res: Response) => {
    try {
      const { category, country } = req.query;
      
      let whereClause = "is_active = true";
      const values: any[] = [];
      let paramIndex = 1;
      
      if (category) {
        whereClause += ` AND category = $${paramIndex++}`;
        values.push(category);
      }
      if (country) {
        whereClause += ` AND (country = $${paramIndex} OR country IS NULL)`;
        values.push(country);
        paramIndex++;
      }
      
      const result = await pool.query(`
        SELECT * FROM safety_resources 
        WHERE ${whereClause}
        ORDER BY is_emergency DESC, sort_order ASC
      `, values);
      
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching safety resources:", error);
      res.status(500).json({ error: "Failed to fetch safety resources" });
    }
  });
  
  // ==================== AI SMART ASSISTANT ====================
  
  // POST /api/help/ai/search - AI-powered search
  app.post("/api/help/ai/search", async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      const userId = (req.session as any)?.userId;
      
      if (!query || query.length < 3) {
        return res.status(400).json({ error: "Query too short" });
      }
      
      // Search articles
      const articlesResult = await pool.query(`
        SELECT id, title, slug, summary, difficulty, has_walkthrough
        FROM help_articles
        WHERE status = 'PUBLISHED' AND (
          title ILIKE $1 OR summary ILIKE $1 OR content ILIKE $1 OR
          tags::text ILIKE $1
        )
        ORDER BY 
          CASE WHEN title ILIKE $1 THEN 1 ELSE 2 END,
          view_count DESC
        LIMIT 5
      `, [`%${query}%`]);
      
      // Search FAQs
      const faqsResult = await pool.query(`
        SELECT id, question, answer
        FROM help_faqs
        WHERE is_active = true AND (question ILIKE $1 OR answer ILIKE $1)
        ORDER BY helpful_count DESC
        LIMIT 3
      `, [`%${query}%`]);
      
      // Log search
      await pool.query(`
        INSERT INTO help_search_history (user_id, query, results_count)
        VALUES ($1, $2, $3)
      `, [userId, query, articlesResult.rows.length + faqsResult.rows.length]);
      
      // Generate AI summary if we have Gemini
      let aiSummary = null;
      try {
        if (articlesResult.rows.length > 0 || faqsResult.rows.length > 0) {
          const context = [
            ...articlesResult.rows.map(a => `Article: ${a.title} - ${a.summary}`),
            ...faqsResult.rows.map(f => `FAQ: ${f.question} - ${f.answer}`),
          ].join("\n");
          
          aiSummary = await summarizeContent([
            `User query: "${query}"`,
            `Relevant help content:\n${context}`,
            `Provide a brief, helpful answer to the user's query based on this content. Keep it under 100 words.`
          ]);
        }
      } catch (e) {
        console.log("AI summary not available");
      }
      
      res.json({
        articles: articlesResult.rows,
        faqs: faqsResult.rows,
        aiSummary,
        totalResults: articlesResult.rows.length + faqsResult.rows.length,
      });
    } catch (error: any) {
      console.error("Error in AI search:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });
  
  // POST /api/help/ai-search - AI-powered search (alias)
  app.post("/api/help/ai-search", async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      const userId = (req.session as any)?.userId;
      
      if (!query || query.length < 3) {
        return res.status(400).json({ error: "Query too short" });
      }
      
      const articlesResult = await pool.query(`
        SELECT id, title, slug, summary, difficulty, has_walkthrough
        FROM help_articles
        WHERE status = 'PUBLISHED' AND (
          title ILIKE $1 OR summary ILIKE $1 OR content ILIKE $1 OR tags::text ILIKE $1
        )
        ORDER BY CASE WHEN title ILIKE $1 THEN 1 ELSE 2 END, view_count DESC
        LIMIT 5
      `, [`%${query}%`]);
      
      const faqsResult = await pool.query(`
        SELECT id, question, answer FROM help_faqs
        WHERE is_active = true AND (question ILIKE $1 OR answer ILIKE $1)
        ORDER BY helpful_count DESC LIMIT 3
      `, [`%${query}%`]);
      
      await pool.query(`
        INSERT INTO help_search_history (user_id, query, results_count) VALUES ($1, $2, $3)
      `, [userId, query, articlesResult.rows.length + faqsResult.rows.length]);
      
      let aiAnswer = null;
      try {
        if (articlesResult.rows.length > 0 || faqsResult.rows.length > 0) {
          const context = [
            ...articlesResult.rows.map((a: any) => `Article: ${a.title} - ${a.summary}`),
            ...faqsResult.rows.map((f: any) => `FAQ: ${f.question} - ${f.answer}`),
          ].join("\n");
          aiAnswer = await summarizeContent([
            `User query: "${query}"`, `Relevant help content:\n${context}`,
            `Provide a brief, helpful answer to the user's query based on this content. Keep it under 100 words.`
          ]);
        }
      } catch (e) {
        console.log("AI summary not available");
      }
      
      res.json({
        results: articlesResult.rows,
        faqs: faqsResult.rows,
        aiAnswer,
        totalResults: articlesResult.rows.length + faqsResult.rows.length,
      });
    } catch (error: any) {
      console.error("Error in AI search:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });
  
  // ==================== HELP ACHIEVEMENTS ====================
  
  // GET /api/help/achievements - Get all achievements
  app.get("/api/help/achievements", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      
      const achievementsResult = await pool.query(`
        SELECT * FROM help_achievements WHERE is_active = true ORDER BY threshold ASC
      `);
      
      let userAchievements: string[] = [];
      if (userId) {
        const userResult = await pool.query(`
          SELECT achievement_id FROM user_help_achievements WHERE user_id = $1
        `, [userId]);
        userAchievements = userResult.rows.map(r => r.achievement_id);
      }
      
      const achievements = achievementsResult.rows.map(a => ({
        ...a,
        earned: userAchievements.includes(a.id),
      }));
      
      res.json(achievements);
    } catch (error: any) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });
  
  // GET /api/help/progress - Get user's help progress
  app.get("/api/help/progress", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const progressResult = await pool.query(`
        SELECT * FROM user_help_progress WHERE user_id = $1
      `, [userId]);
      
      if (progressResult.rows.length === 0) {
        // Create initial progress
        const newProgress = await pool.query(`
          INSERT INTO user_help_progress (user_id) VALUES ($1) RETURNING *
        `, [userId]);
        return res.json(newProgress.rows[0]);
      }
      
      res.json(progressResult.rows[0]);
    } catch (error: any) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });
  
  // ==================== ADMIN STATS ====================
  
  // GET /api/admin/help/stats - Get help center stats (admin)
  app.get("/api/admin/help/stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await Promise.all([
        pool.query(`SELECT COUNT(*) as total FROM help_articles WHERE status = 'PUBLISHED'`),
        pool.query(`SELECT COUNT(*) as total FROM help_faqs WHERE is_active = true`),
        pool.query(`SELECT COUNT(*) as total FROM support_tickets WHERE status IN ('OPEN', 'IN_PROGRESS', 'WAITING_USER')`),
        pool.query(`SELECT COUNT(*) as total FROM support_tickets WHERE status = 'OPEN'`),
        pool.query(`SELECT COUNT(*) as total FROM community_questions WHERE NOT is_solved`),
        pool.query(`SELECT COUNT(*) as total FROM appeals WHERE status = 'PENDING'`),
        pool.query(`SELECT COUNT(*) as total FROM feature_requests WHERE status = 'NEW'`),
        pool.query(`SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::numeric(10,2) as avg_hours FROM support_tickets WHERE resolved_at IS NOT NULL AND created_at > NOW() - INTERVAL '30 days'`),
      ]);
      
      res.json({
        publishedArticles: parseInt(stats[0].rows[0].total),
        activeFaqs: parseInt(stats[1].rows[0].total),
        activeTickets: parseInt(stats[2].rows[0].total),
        newTickets: parseInt(stats[3].rows[0].total),
        unsolvedQuestions: parseInt(stats[4].rows[0].total),
        pendingAppeals: parseInt(stats[5].rows[0].total),
        newFeatureRequests: parseInt(stats[6].rows[0].total),
        avgResolutionTimeHours: parseFloat(stats[7].rows[0].avg_hours) || 0,
      });
    } catch (error: any) {
      console.error("Error fetching help stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
  
  console.log("Help Center routes registered");
}
