// RALD Search — Meilisearch Provider (future) — LILCKY STUDIO LIMITED
// Drop-in replacement for PostgresSearchProvider. Activate by setting SEARCH_PROVIDER=meilisearch.
import type { SearchProvider, SearchRequest, SearchResult, IndexRequest, EntityType } from "./interface";

export class MeilisearchProvider implements SearchProvider {
  readonly name = "meilisearch";
  constructor(private host: string, private apiKey: string) {}

  async search(req: SearchRequest): Promise<SearchResult> {
    const start = Date.now();
    const allHits: any[] = [];
    let totalCount = 0;
    const limit = Math.min(req.limit ?? 20, 100);
    const page = req.page ?? 1;

    for (const entity of req.entities) {
      try {
        const res = await fetch(`${this.host}/indexes/${this.indexName(req.workspaceId, entity)}/search`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            q: req.query, limit, offset: (page - 1) * limit,
            attributesToHighlight: req.highlight ? ["*"] : undefined,
            filter: req.filters?.map(f => `${f.field} ${f.operator} ${JSON.stringify(f.value)}`),
          }),
        });
        if (res.ok) {
          const data = await res.json() as { hits: any[]; estimatedTotalHits: number };
          totalCount += data.estimatedTotalHits;
          for (const hit of data.hits ?? []) {
            allHits.push({ id: hit.id, entity, score: hit._rankingScore ?? 1.0, data: hit, highlights: hit._formatted });
          }
        }
      } catch (err) {
        console.warn(`[meilisearch] ${entity} search failed:`, err);
      }
    }

    return { hits: allHits, total: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit), took_ms: Date.now() - start, provider: this.name };
  }

  async index(doc: IndexRequest): Promise<void> {
    await fetch(`${this.host}/indexes/${this.indexName(doc.workspaceId, doc.entity)}/documents`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify([{ id: doc.id, workspace_id: doc.workspaceId, ...doc.data }]),
    });
  }

  async bulkIndex(docs: IndexRequest[]): Promise<void> {
    const byIndex: Record<string, object[]> = {};
    for (const d of docs) {
      const idx = this.indexName(d.workspaceId, d.entity);
      byIndex[idx] = byIndex[idx] ?? [];
      byIndex[idx].push({ id: d.id, workspace_id: d.workspaceId, ...d.data });
    }
    await Promise.all(Object.entries(byIndex).map(([idx, rows]) =>
      fetch(`${this.host}/indexes/${idx}/documents`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(rows),
      })
    ));
  }

  async delete(entity: EntityType, workspaceId: string, id: string): Promise<void> {
    await fetch(`${this.host}/indexes/${this.indexName(workspaceId, entity)}/documents/${id}`, {
      method: "DELETE", headers: { "Authorization": `Bearer ${this.apiKey}` },
    });
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    const entities: EntityType[] = ["customers","customer_notes","customer_activities","segments","users","notifications","templates"];
    await Promise.all(entities.map(e =>
      fetch(`${this.host}/indexes/${this.indexName(workspaceId, e)}/documents?filter=workspace_id=${workspaceId}`, {
        method: "DELETE", headers: { "Authorization": `Bearer ${this.apiKey}` },
      })
    ));
  }

  async health(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.host}/health`, { headers: { "Authorization": `Bearer ${this.apiKey}` } });
      return { ok: res.ok, latencyMs: Date.now() - start };
    } catch { return { ok: false, latencyMs: Date.now() - start }; }
  }

  private indexName(workspaceId: string, entity: string): string {
    return `${workspaceId}__${entity}`;
  }
}
