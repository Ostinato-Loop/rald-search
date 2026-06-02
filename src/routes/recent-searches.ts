// RALD Search — Recent Searches Routes — LILCKY STUDIO LIMITED
import { Hono } from "hono";
import type { Bindings, Variables } from "../index";
import { authMiddleware, workspaceMiddleware } from "../lib/middleware";

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();
router.use("*", authMiddleware, workspaceMiddleware);

router.get("/", async (c) => {
  const db = c.get("db"); const user = c.get("user")!; const workspaceId = c.get("workspaceId")!;
  const { limit = "10" } = c.req.query();
  const { data } = await db.from("search_recent").select("query,entity_scope,result_count,searched_at").eq("workspace_id", workspaceId).eq("user_id", user.id).order("searched_at", { ascending: false }).limit(Math.min(parseInt(limit), 50));
  return c.json({ recent: data ?? [] });
});

router.delete("/", async (c) => {
  const db = c.get("db"); const user = c.get("user")!; const workspaceId = c.get("workspaceId")!;
  await db.from("search_recent").delete().eq("workspace_id", workspaceId).eq("user_id", user.id);
  return c.json({ ok: true, cleared: true });
});

export default router;
