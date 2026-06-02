// RALD Search — Saved Searches Routes — LILCKY STUDIO LIMITED
import { Hono } from "hono";
import type { Bindings, Variables } from "../index";
import { authMiddleware, workspaceMiddleware } from "../lib/middleware";

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();
router.use("*", authMiddleware, workspaceMiddleware);

router.get("/", async (c) => {
  const db = c.get("db"); const user = c.get("user")!; const workspaceId = c.get("workspaceId")!;
  const { data } = await db.from("search_saved").select("*").eq("workspace_id", workspaceId).eq("user_id", user.id).order("created_at", { ascending: false });
  return c.json({ saved: data ?? [] });
});

router.post("/", async (c) => {
  const db = c.get("db"); const user = c.get("user")!; const workspaceId = c.get("workspaceId")!;
  const body = await c.req.json() as { name: string; query: string; entities?: string[]; filters?: unknown };
  if (!body.name || !body.query) return c.json({ error: "name and query required" }, 400);
  const { data: existing } = await db.from("search_saved").select("id").eq("workspace_id", workspaceId).eq("user_id", user.id).eq("name", body.name).single();
  if (existing) return c.json({ error: "A saved search with this name already exists" }, 409);
  const { data, error } = await db.from("search_saved").insert({ workspace_id: workspaceId, user_id: user.id, name: body.name, query: body.query, entities: body.entities ?? [], filters: body.filters ?? null }).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ saved: data }, 201);
});

router.delete("/:id", async (c) => {
  const db = c.get("db"); const user = c.get("user")!; const workspaceId = c.get("workspaceId")!;
  const { data } = await db.from("search_saved").select("id").eq("id", c.req.param("id")).eq("workspace_id", workspaceId).eq("user_id", user.id).single();
  if (!data) return c.json({ error: "Not found" }, 404);
  await db.from("search_saved").delete().eq("id", data.id);
  return c.json({ ok: true });
});

export default router;
