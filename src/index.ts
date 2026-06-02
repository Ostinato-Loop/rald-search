// RALD Search — Search Platform — LILCKY STUDIO LIMITED
// search.rald.cloud
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { JwtPayload } from "./lib/auth";
import type { SearchProvider } from "./lib/providers/interface";
import { PostgresSearchProvider } from "./lib/providers/postgres";
import { MeilisearchProvider } from "./lib/providers/meilisearch";
import { OpenSearchProvider } from "./lib/providers/opensearch";
import healthRoutes from "./routes/health";
import searchRoutes from "./routes/search";
import savedRoutes from "./routes/saved-searches";
import recentRoutes from "./routes/recent-searches";
import indexRoutes from "./routes/index-management";

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  RALD_JWT_SECRET: string;
  SEARCH_PROVIDER?: string;
  MEILISEARCH_HOST?: string;
  MEILISEARCH_API_KEY?: string;
  OPENSEARCH_HOST?: string;
  OPENSEARCH_API_KEY?: string;
  ENVIRONMENT?: string;
  RATE_LIMIT_KV?: KVNamespace;
};

export type Variables = {
  db: SupabaseClient;
  user?: JwtPayload;
  workspaceId?: string;
  searchProvider: SearchProvider;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", cors({
  origin: [
    "https://rald.cloud", "https://app.rald.cloud", "https://admin.rald.cloud",
    "https://control.rald.cloud", "https://business.rald.cloud",
    "https://messenger.rald.cloud", "https://loop.rald.cloud",
    "https://pay.rald.cloud", "https://dispatch.rald.cloud",
    "http://localhost:5173", "http://localhost:3000", "http://localhost:5174",
  ],
  allowHeaders: ["Authorization", "Content-Type", "X-Workspace-ID", "X-Request-ID", "X-RALD-SDK"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
}));

// DB + Search Provider middleware
app.use("*", async (c, next) => {
  const db = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
  c.set("db", db);

  // Abstract provider selection — swap without changing any application code
  const providerName = c.env.SEARCH_PROVIDER ?? "postgres";
  let provider: SearchProvider;
  if (providerName === "meilisearch" && c.env.MEILISEARCH_HOST && c.env.MEILISEARCH_API_KEY) {
    provider = new MeilisearchProvider(c.env.MEILISEARCH_HOST, c.env.MEILISEARCH_API_KEY);
  } else if (providerName === "opensearch" && c.env.OPENSEARCH_HOST && c.env.OPENSEARCH_API_KEY) {
    provider = new OpenSearchProvider(c.env.OPENSEARCH_HOST, c.env.OPENSEARCH_API_KEY);
  } else {
    provider = new PostgresSearchProvider(db);
  }
  c.set("searchProvider", provider);

  await next();
});

// Health (public)
app.route("/", healthRoutes);

// API Routes
app.route("/api/search",  searchRoutes);
app.route("/api/saved",   savedRoutes);
app.route("/api/recent",  recentRoutes);
app.route("/api/index",   indexRoutes);

// Root
app.get("/", (c) => c.json({
  service: "RALD Search", version: "1.0.0",
  environment: c.env.ENVIRONMENT ?? "production",
  owner: "LILCKY STUDIO LIMITED",
  provider: c.env.SEARCH_PROVIDER ?? "postgres",
  docs: "https://search.rald.cloud/api/health",
  timestamp: new Date().toISOString(),
}));

app.notFound((c) => c.json({ error: "Not found", path: c.req.path }, 404));
app.onError((err, c) => {
  console.error("[RALD Search Error]", err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
