# SEARCH PLATFORM CERTIFICATION
**Service:** `rald-search` — search.rald.cloud  
**Phase:** E  
**Owner:** LILCKY STUDIO LIMITED  
**Date:** 2026-06-02  
**Status:** ✅ PASS

---

## 1. Platform Overview

`rald-search` is the single, canonical search service for the entire RALD ecosystem. It is a Cloudflare Worker backed by Supabase Postgres FTS (default), with an abstract provider layer supporting zero-API-change migration to Meilisearch or OpenSearch.

**No product in the RALD ecosystem may implement its own search engine.** All products call `search.rald.cloud`.

---

## 2. Architecture

| Component | Implementation |
|---|---|
| Runtime | Cloudflare Worker (Hono framework) |
| Default Provider | Postgres Full Text Search (GIN-indexed tsvector) |
| Future Providers | Meilisearch, OpenSearch (drop-in, same API) |
| Database | Supabase (Postgres) — service role, no RLS |
| Auth | RALD JWT (HS256) |
| Workspace Isolation | `workspace_id` enforced on every index and query |
| Provider Selection | `SEARCH_PROVIDER` env var — no code changes required |

---

## 3. Provider Abstraction Certification

| Provider | Status | Activation |
|---|---|---|
| Postgres FTS | ✅ DEFAULT | `SEARCH_PROVIDER=postgres` (or unset) |
| Meilisearch | ✅ IMPLEMENTED | `SEARCH_PROVIDER=meilisearch` + `MEILISEARCH_HOST` + `MEILISEARCH_API_KEY` |
| OpenSearch | ✅ IMPLEMENTED | `SEARCH_PROVIDER=opensearch` + `OPENSEARCH_HOST` + `OPENSEARCH_API_KEY` |

Switching providers requires **zero application code changes**. The `SearchProvider` interface (`src/lib/providers/interface.ts`) is the contract all providers implement.

---

## 4. Searchable Entity Certification

| Entity | Status | Index Table |
|---|---|---|
| Customers | ✅ LIVE | `search_index_customers` |
| Customer Notes | ✅ LIVE | `search_index_customer_notes` |
| Customer Activities | ✅ LIVE | `search_index_customer_activities` |
| Segments | ✅ LIVE | `search_index_segments` |
| Workspaces | ✅ LIVE | `search_index_workspaces` |
| Users | ✅ LIVE | `search_index_users` |
| Notifications | ✅ LIVE | `search_index_notifications` |
| Templates | ✅ LIVE | `search_index_templates` |
| Conversations | 🔵 PLANNED | Phase F |
| Messages | 🔵 PLANNED | Phase F |
| Bookings | 🔵 PLANNED | Phase F |
| Campaigns | 🔵 PLANNED | Phase F |
| Knowledge Base | 🔵 PLANNED | Phase F |
| Documents | 🔵 PLANNED | Phase F |

---

## 5. Search Feature Certification

| Feature | Status |
|---|---|
| Global search (all entities) | ✅ |
| Workspace-scoped search | ✅ |
| Entity filtering | ✅ |
| Field filters (eq, neq, gt, lt, in) | ✅ |
| Sort (asc/desc any field) | ✅ |
| Pagination (page + limit) | ✅ |
| Faceted search | ✅ (provider-dependent) |
| Saved searches | ✅ |
| Recent searches | ✅ |
| Highlight (Meilisearch/OpenSearch) | ✅ |
| Minimal payload GET variant | ✅ (African-first) |

---

## 6. Audit Integration Certification

Every search operation records:

| Field | Tracked |
|---|---|
| `workspace_id` | ✅ |
| `user_id` | ✅ |
| `query` | ✅ |
| `timestamp` | ✅ |
| `entity_scope` | ✅ |
| `result_count` | ✅ |
| `provider` | ✅ |
| `ip_address` | ✅ |

---

## 7. API Surface

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/search` | POST | Full search (all options) |
| `/api/search` | GET | Quick search via `?q=` (minimal payload) |
| `/api/saved` | GET/POST | Saved search management |
| `/api/saved/:id` | DELETE | Remove saved search |
| `/api/recent` | GET | Recent searches list |
| `/api/recent` | DELETE | Clear recent searches |
| `/api/index` | POST | Index single document |
| `/api/index/bulk` | POST | Bulk index (max 500) |
| `/api/index/:entity/:id` | DELETE | Remove from index |
| `/api/index/health` | GET | Provider health check |
| `/healthz` | GET | Service health |
| `/ready` | GET | Readiness check |

---

## 8. Certification Decision

**PASS** — All Phase E search platform requirements satisfied.

- One search system: ✅
- Workspace isolation: ✅
- RBAC enforcement: ✅
- Rate limiting: ✅
- Audit trails: ✅
- Abstract provider layer: ✅
- All current entities implemented: ✅
- Future entities designed for: ✅
