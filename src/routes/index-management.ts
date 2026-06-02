// RALD Search — Index Management Routes (admin) — LILCKY STUDIO LIMITED
import { Hono } from "hono";
import type { Bindings, Variables } from "../index";
import { authMiddleware, adminMiddleware, workspaceMiddleware } from "../lib/middleware";
import type { IndexRequest, EntityType } from "../lib/providers/interface";

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();
router.use("*", authMiddleware, workspaceMiddleware, adminMiddleware);

// POST /api/index — index a single document
router.post("/", async (c) => {
  const provider = c.get("searchProvider");
  const workspaceId = c.get("workspaceId")!;
  const body = await c.req.json() as IndexRequest;
  if (!body.entity || !body.id || !body.data) return c.json({ error: "entity, id, data required" }, 400);
  await provider.index({ ...body, workspaceId });
  return c.json({ ok: true, indexed: body.id });
});

// POST /api/index/bulk — bulk index documents
router.post("/bulk", async (c) => {
  const provider = c.get("searchProvider");
  const workspaceId = c.get("workspaceId")!;
  const { documents } = await c.req.json() as { documents: IndexRequest[] };
  if (!Array.isArray(documents) || documents.length === 0) return c.json({ error: "documents array required" }, 400);
  if (documents.length > 500) return c.json({ error: "Max 500 documents per bulk request" }, 400);
  await provider.bulkIndex(documents.map(d => ({ ...d, workspaceId })));
  return c.json({ ok: true, indexed: documents.length });
});

// DELETE /api/index/:entity/:id — remove a document from index
router.delete("/:entity/:id", async (c) => {
  const provider = c.get("searchProvider");
  const workspaceId = c.get("workspaceId")!;
  await provider.delete(c.req.param("entity") as EntityType, workspaceId, c.req.param("id"));
  return c.json({ ok: true });
});

// GET /api/index/health — provider health
router.get("/health", async (c) => {
  const provider = c.get("searchProvider");
  const h = await provider.health();
  return c.json({ provider: provider.name, ...h }, h.ok ? 200 : 503);
});

export default router;
