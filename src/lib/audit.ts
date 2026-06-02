// RALD Search — Audit Logging — LILCKY STUDIO LIMITED
import { SupabaseClient } from "@supabase/supabase-js";

export async function writeSearchAuditLog(db: SupabaseClient, entry: {
  workspaceId: string; userId?: string; query: string; entityScope: string[];
  resultCount: number; provider: string; ip?: string; userAgent?: string; saved?: boolean;
}): Promise<void> {
  try {
    await db.from("search_audit_log").insert({
      workspace_id: entry.workspaceId,
      user_id: entry.userId ?? null,
      query: entry.query,
      entity_scope: entry.entityScope,
      result_count: entry.resultCount,
      provider: entry.provider,
      ip_address: entry.ip ?? null,
      user_agent: entry.userAgent ?? null,
      saved: entry.saved ?? false,
      searched_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[search-audit] write failed:", err);
  }
}
