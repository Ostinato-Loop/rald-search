// RALD Search — Health Routes — LILCKY STUDIO LIMITED
import { Hono } from "hono";
import type { Bindings, Variables } from "../index";

const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const healthResponse = (c: any) => c.json({
  status: "ok", service: "rald-search", version: "1.0.0",
  environment: c.env.ENVIRONMENT ?? "production",
  owner: "LILCKY STUDIO LIMITED",
  provider: c.env.SEARCH_PROVIDER ?? "postgres",
  timestamp: new Date().toISOString(),
  searchable_entities: ["customers","customer_notes","customer_activities","segments","workspaces","users","notifications","templates"],
  planned_entities: ["conversations","messages","bookings","campaigns","knowledge_base","documents"],
});

router.get("/health", healthResponse);
router.get("/api/health", healthResponse);
router.get("/healthz", healthResponse);
router.get("/api/healthz", healthResponse);
router.get("/ready", (c) => c.json({ ready: true, service: "rald-search", checks: { supabase: !!c.env.SUPABASE_URL }, timestamp: new Date().toISOString() }));

export default router;
