// RALD Search — Core Search Routes — LILCKY STUDIO LIMITED
import { Hono } from "hono";
import type { Bindings, Variables } from "../index";
import { authMiddleware, workspaceMiddleware } from "../lib/middleware";
import { checkRateLimit } from "../lib/rate-limit";
import { writeSearchAuditLog } from "../lib/audit";
import type { EntityType, SearchFilter, SearchSort } from "../lib/providers/interface";

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();
router.use("*", authMiddleware, workspaceMiddleware);

const SEARCHABLE_ENTITIES: EntityType[] = [
  "customers", "customer_notes", "customer_activities", "segments",
  "workspaces", "users", "notifications", "templates",
];
const FUTURE_ENTITIES: EntityType[] = ["conversations","messages","bookings","campaigns","knowledge_base","documents"];

// POST /api/search — global + workspace search
router.post("/", async (c) => {
  const db = c.get("db");
  const user = c.get("user")!;
  const workspaceId = c.get("workspaceId")!;
  const provider = c.get("searchProvider");

  const rl = await checkRateLimit(c.env.RATE_LIMIT_KV, `search:${workspaceId}:${user.id}`, 60, 60);
  if (!rl.allowed) {
    return c.json({ error: "Rate limit exceeded. Max 60 searches/minute." }, 429);
  }

  const body = await c.req.json() as {
    query: string;
    entities?: EntityType[];
    filters?: SearchFilter[];
    sort?: SearchSort[];
    facets?: { field: string; limit?: number }[];
    page?: number;
    limit?: number;
    highlight?: boolean;
  };

  if (!body.query && body.query !== "") return c.json({ error: "query required" }, 400);
  if (body.query.length > 500) return c.json({ error: "query too long (max 500 chars)" }, 400);

  const entities = body.entities ?? SEARCHABLE_ENTITIES;
  const invalid = entities.filter(e => !SEARCHABLE_ENTITIES.includes(e));
  if (invalid.length) {
    return c.json({ error: `Unsupported entities: ${invalid.join(", ")}`, supported: SEARCHABLE_ENTITIES, planned: FUTURE_ENTITIES }, 400);
  }

  const results = await provider.search({
    query: body.query, workspaceId, entities,
    filters: body.filters, sort: body.sort, facets: body.facets,
    page: body.page ?? 1, limit: Math.min(body.limit ?? 20, 100),
    highlight: body.highlight ?? false,
  });

  // Save as recent search (async, non-blocking)
  if (body.query.trim()) {
    c.executionCtx.waitUntil(
      db.from("search_recent").upsert({
        workspace_id: workspaceId, user_id: user.id, query: body.query.trim(),
        entity_scope: entities, result_count: results.total,
        searched_at: new Date().toISOString(),
      }, { onConflict: "workspace_id,user_id,query" })
    );
  }

  // Audit (async, non-blocking)
  c.executionCtx.waitUntil(
    writeSearchAuditLog(db, {
      workspaceId, userId: user.id, query: body.query, entityScope: entities,
      resultCount: results.total, provider: results.provider,
      ip: c.req.header("CF-Connecting-IP"), userAgent: c.req.header("User-Agent"),
    })
  );

  return c.json({
    ...results,
    rate_limit: { remaining: rl.remaining, reset_at: rl.resetAt },
    searchable_entities: SEARCHABLE_ENTITIES,
    planned_entities: FUTURE_ENTITIES,
  });
});

// GET /api/search — quick search via query param (African-first: minimal payload)
router.get("/", async (c) => {
  const user = c.get("user")!;
  const workspaceId = c.get("workspaceId")!;
  const provider = c.get("searchProvider");
  const { q = "", entity, page = "1", limit = "10" } = c.req.query();

  if (!q) return c.json({ error: "q query param required" }, 400);

  const rl = await checkRateLimit(c.env.RATE_LIMIT_KV, `search:${workspaceId}:${user.id}`, 60, 60);
  if (!rl.allowed) return c.json({ error: "Rate limit exceeded" }, 429);

  const entities: EntityType[] = entity ? [entity as EntityType] : SEARCHABLE_ENTITIES;
  const results = await provider.search({ query: q, workspaceId, entities, page: parseInt(page), limit: Math.min(parseInt(limit), 50) });

  // Minimal payload for low-bandwidth
  return c.json({
    hits: results.hits.map(h => ({ id: h.id, entity: h.entity, data: h.data })),
    total: results.total, page: results.page, pages: results.totalPages,
    took_ms: results.took_ms,
  });
});

export default router;
