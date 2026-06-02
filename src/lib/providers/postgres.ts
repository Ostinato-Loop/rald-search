// RALD Search — Postgres Full Text Search Provider — LILCKY STUDIO LIMITED
// Default provider. Abstracts FTS using Supabase client.
import { SupabaseClient } from "@supabase/supabase-js";
import type { SearchProvider, SearchRequest, SearchResult, SearchHit, IndexRequest, EntityType } from "./interface";

// Entity → table mapping for FTS
const ENTITY_TABLE: Record<string, string> = {
  customers:           "search_index_customers",
  customer_notes:      "search_index_customer_notes",
  customer_activities: "search_index_customer_activities",
  segments:            "search_index_segments",
  workspaces:          "search_index_workspaces",
  users:               "search_index_users",
  notifications:       "search_index_notifications",
  templates:           "search_index_templates",
};

export class PostgresSearchProvider implements SearchProvider {
  readonly name = "postgres";
  constructor(private db: SupabaseClient) {}

  async search(req: SearchRequest): Promise<SearchResult> {
    const start = Date.now();
    const page = req.page ?? 1;
    const limit = Math.min(req.limit ?? 20, 100);
    const offset = (page - 1) * limit;
    const allHits: SearchHit[] = [];
    let totalCount = 0;

    for (const entity of req.entities) {
      const table = ENTITY_TABLE[entity];
      if (!table) continue;

      let q = this.db.from(table)
        .select("id,entity_type,data,search_vector,ts_rank(search_vector, plainto_tsquery('english', $1))", { count: "exact" })
        .eq("workspace_id", req.workspaceId)
        .is("deleted_at", null);

      if (req.query.trim()) {
        q = (this.db.from(table) as any)
          .select("id,entity_type,data", { count: "exact" })
          .eq("workspace_id", req.workspaceId)
          .is("deleted_at", null)
          .textSearch("search_vector", req.query, { type: "plain", config: "english" });
      } else {
        q = this.db.from(table).select("id,entity_type,data", { count: "exact" })
          .eq("workspace_id", req.workspaceId).is("deleted_at", null);
      }

      // Apply filters
      for (const filter of req.filters ?? []) {
        switch (filter.operator) {
          case "eq":  q = q.eq(`data->>'${filter.field}'`, filter.value as string); break;
          case "neq": q = q.neq(`data->>'${filter.field}'`, filter.value as string); break;
          case "in":  q = q.in(`data->>'${filter.field}'`, filter.value as string[]); break;
        }
      }

      // Sorting
      for (const sort of req.sort ?? []) {
        q = q.order(sort.field, { ascending: sort.direction === "asc" });
      }

      const { data, count, error } = await q.range(offset, offset + limit - 1);
      if (error) { console.warn(`[postgres-search] ${entity} query error:`, error.message); continue; }

      totalCount += (count ?? 0);
      for (const row of (data ?? []) as { id: string; entity_type: string; data: Record<string, unknown> }[]) {
        allHits.push({
          id: row.id, entity: entity as EntityType,
          score: 1.0, data: row.data, highlights: {},
        });
      }
    }

    return {
      hits: allHits.slice(0, limit),
      total: totalCount, page, limit,
      totalPages: Math.ceil(totalCount / limit),
      took_ms: Date.now() - start,
      provider: this.name,
    };
  }

  async index(doc: IndexRequest): Promise<void> {
    const table = ENTITY_TABLE[doc.entity];
    if (!table) return;
    const searchText = Object.values(doc.data).filter(v => typeof v === "string").join(" ");
    await this.db.from(table).upsert({
      id: doc.id, workspace_id: doc.workspaceId, entity_type: doc.entity,
      data: doc.data, raw_text: searchText,
      indexed_at: new Date().toISOString(),
    }, { onConflict: "id,workspace_id" });
  }

  async bulkIndex(docs: IndexRequest[]): Promise<void> {
    const byTable: Record<string, typeof docs> = {};
    for (const doc of docs) {
      const table = ENTITY_TABLE[doc.entity];
      if (!table) continue;
      byTable[table] = byTable[table] ?? [];
      byTable[table].push(doc);
    }
    for (const [table, tableDocs] of Object.entries(byTable)) {
      const rows = tableDocs.map(d => ({
        id: d.id, workspace_id: d.workspaceId, entity_type: d.entity, data: d.data,
        raw_text: Object.values(d.data).filter(v => typeof v === "string").join(" "),
        indexed_at: new Date().toISOString(),
      }));
      await this.db.from(table).upsert(rows, { onConflict: "id,workspace_id" });
    }
  }

  async delete(entity: EntityType, workspaceId: string, id: string): Promise<void> {
    const table = ENTITY_TABLE[entity];
    if (!table) return;
    await this.db.from(table).update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", workspaceId);
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    for (const table of Object.values(ENTITY_TABLE)) {
      await this.db.from(table).update({ deleted_at: new Date().toISOString() }).eq("workspace_id", workspaceId);
    }
  }

  async health(): Promise<{ ok: boolean; latencyMs: number; details?: Record<string, unknown> }> {
    const start = Date.now();
    try {
      await this.db.from("search_index_customers").select("id").limit(1);
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - start, details: { error: String(err) } };
    }
  }
}
