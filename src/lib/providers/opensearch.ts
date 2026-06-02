// RALD Search — OpenSearch Provider (future) — LILCKY STUDIO LIMITED
// Drop-in replacement. Activate by setting SEARCH_PROVIDER=opensearch.
import type { SearchProvider, SearchRequest, SearchResult, IndexRequest, EntityType } from "./interface";

export class OpenSearchProvider implements SearchProvider {
  readonly name = "opensearch";
  constructor(private host: string, private apiKey: string) {}

  async search(req: SearchRequest): Promise<SearchResult> {
    const start = Date.now();
    const limit = Math.min(req.limit ?? 20, 100);
    const page = req.page ?? 1;
    const allHits: any[] = [];
    let totalCount = 0;

    const msearchBody = req.entities.flatMap(entity => [
      { index: this.indexName(req.workspaceId, entity) },
      {
        query: req.query.trim()
          ? { bool: { must: [{ multi_match: { query: req.query, fields: ["*"], type: "best_fields" } }], filter: [{ term: { workspace_id: req.workspaceId } }] } }
          : { bool: { filter: [{ term: { workspace_id: req.workspaceId } }] } },
        from: (page - 1) * limit, size: limit,
        highlight: req.highlight ? { fields: { "*": {} } } : undefined,
      },
    ]);

    try {
      const res = await fetch(`${this.host}/_msearch`, {
        method: "POST",
        headers: { "Authorization": `Basic ${this.apiKey}`, "Content-Type": "application/x-ndjson" },
        body: msearchBody.map(l => JSON.stringify(l)).join("\n") + "\n",
      });
      if (res.ok) {
        const data = await res.json() as { responses: any[] };
        for (let i = 0; i < req.entities.length; i++) {
          const r = data.responses[i];
          if (!r?.hits) continue;
          totalCount += r.hits.total?.value ?? 0;
          for (const hit of r.hits.hits ?? []) {
            allHits.push({ id: hit._id, entity: req.entities[i], score: hit._score ?? 1.0, data: hit._source, highlights: hit.highlight });
          }
        }
      }
    } catch (err) { console.warn("[opensearch] msearch failed:", err); }

    return { hits: allHits, total: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit), took_ms: Date.now() - start, provider: this.name };
  }

  async index(doc: IndexRequest): Promise<void> {
    await fetch(`${this.host}/${this.indexName(doc.workspaceId, doc.entity)}/_doc/${doc.id}`, {
      method: "PUT",
      headers: { "Authorization": `Basic ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: doc.workspaceId, ...doc.data, indexed_at: new Date().toISOString() }),
    });
  }

  async bulkIndex(docs: IndexRequest[]): Promise<void> {
    const body = docs.flatMap(d => [
      { index: { _index: this.indexName(d.workspaceId, d.entity), _id: d.id } },
      { workspace_id: d.workspaceId, ...d.data, indexed_at: new Date().toISOString() },
    ]);
    await fetch(`${this.host}/_bulk`, {
      method: "POST",
      headers: { "Authorization": `Basic ${this.apiKey}`, "Content-Type": "application/x-ndjson" },
      body: body.map(l => JSON.stringify(l)).join("\n") + "\n",
    });
  }

  async delete(entity: EntityType, workspaceId: string, id: string): Promise<void> {
    await fetch(`${this.host}/${this.indexName(workspaceId, entity)}/_doc/${id}`, {
      method: "DELETE", headers: { "Authorization": `Basic ${this.apiKey}` },
    });
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    const entities: EntityType[] = ["customers","customer_notes","customer_activities","segments","users","notifications","templates"];
    await Promise.all(entities.map(e =>
      fetch(`${this.host}/${this.indexName(workspaceId, e)}/_delete_by_query`, {
        method: "POST",
        headers: { "Authorization": `Basic ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: { term: { workspace_id: workspaceId } } }),
      })
    ));
  }

  async health(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      const res = await fetch(`${this.host}/_cluster/health`, { headers: { "Authorization": `Basic ${this.apiKey}` } });
      return { ok: res.ok, latencyMs: Date.now() - start };
    } catch { return { ok: false, latencyMs: Date.now() - start }; }
  }

  private indexName(workspaceId: string, entity: string): string {
    return `rald-${workspaceId}-${entity}`;
  }
}
