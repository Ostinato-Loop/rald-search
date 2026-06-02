# SEARCH SCALE REPORT
**Service:** `rald-search` — search.rald.cloud  
**Phase:** E  
**Owner:** LILCKY STUDIO LIMITED  
**Date:** 2026-06-02

---

## Postgres FTS Performance

| Factor | Detail |
|---|---|
| Index type | GIN on `tsvector` column — optimal for full-text |
| Partial indexes | All GIN indexes include `WHERE deleted_at IS NULL` |
| Multi-entity queries | Each entity queried independently; merged in-process |
| Language config | `english` dictionary (trigram for African names: phase F) |
| Max results per entity | 100 (enforced) |

---

## African-First Optimizations

| Optimization | Implementation |
|---|---|
| Minimal GET endpoint | `GET /api/search?q=` returns 5-field hit objects |
| Pagination | Default limit 20, max 100 — avoids large payloads |
| Entity scoping | Clients can search 1 entity at a time to reduce payload |
| Offline tolerance | Recent + saved searches cached client-side |
| Cloudflare edge | Query hits nearest CF PoP — Lagos, Nairobi, Johannesburg all covered |

---

## Scale Estimates (Postgres FTS Provider)

| Metric | Estimate |
|---|---|
| Index size at 10M customers | ~2GB (GIN index) |
| Query latency p50 (FTS) | <50ms |
| Query latency p99 (FTS) | <200ms |
| Write throughput (bulk index) | 500 docs/request, ~10k docs/min |
| Max concurrent searches | Unbounded (CF Worker horizontal scale) |

## Provider Migration Path

When customer count exceeds 50M records per workspace or latency targets cannot be met:

1. Provision Meilisearch Cloud
2. Set `SEARCH_PROVIDER=meilisearch` + secrets
3. Run bulk reindex via `POST /api/index/bulk`
4. Zero downtime — application API unchanged

---

## Conclusion

Platform is designed to scale from MVP (Postgres FTS, zero cost) to production-grade Meilisearch/OpenSearch with **zero API changes** and **zero client code changes**. Provider swap is purely operational.
