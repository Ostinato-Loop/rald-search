# SEARCH SECURITY REPORT
**Service:** `rald-search` — search.rald.cloud  
**Phase:** E  
**Owner:** LILCKY STUDIO LIMITED  
**Date:** 2026-06-02  
**Severity Summary:** 0 CRITICAL · 0 HIGH · 2 MEDIUM · 1 LOW

---

## Security Controls

| Control | Implementation | Status |
|---|---|---|
| Authentication | RALD JWT (HS256) — required on all routes | ✅ |
| Authorization | RBAC — admin required for index management | ✅ |
| Workspace isolation | All index tables partitioned by workspace_id | ✅ |
| Rate limiting | 60 searches/minute per user per workspace (KV) | ✅ |
| Search abuse prevention | Rate limit + query length cap (500 chars) | ✅ |
| Provider secret protection | Stored as CF Worker secrets, never logged | ✅ |
| Audit trail | Every search logged with workspace_id, user_id, query | ✅ |
| Pagination limit | Max 100 results per request | ✅ |
| Bulk index limit | Max 500 documents per bulk request | ✅ |
| CORS | Whitelist-only | ✅ |

---

## Findings

### MEDIUM — Query not sanitized for Postgres FTS injection
**Description:** User-supplied query strings are passed to `plainto_tsquery()`. While Postgres's `plainto_tsquery` is not directly injectable like SQL, malformed unicode or very long strings could cause performance issues.  
**Risk:** Low — Cloudflare Worker CPU limits bound worst-case damage.  
**Mitigation:** Enforce 500-char limit (done). Add unicode normalization. Consider `websearch_to_tsquery` for better parsing.  
**Status:** Partially mitigated — length limit in place.

### MEDIUM — Cross-workspace data exposure via bulk index
**Description:** Admin users could bulk-index documents with a mismatched `workspace_id`.  
**Risk:** Data from one workspace could appear in another's search results.  
**Mitigation:** Override `workspaceId` from auth context in all index routes — never trust client-supplied workspace_id in the document body.  
**Status:** Fixed — server overrides workspaceId from the authenticated context.

### LOW — Recent search history leakage
**Description:** Recent searches are stored per-user but could expose query patterns if audit log is accessed by workspace admin.  
**Risk:** Low — admins legitimately have access to workspace data.  
**Mitigation:** Clarify in documentation that recent searches are user-private, not workspace-visible.  
**Status:** Accepted — documented.

---

## No CRITICAL or HIGH Findings

Phase F authorization is **not blocked** by this report.
