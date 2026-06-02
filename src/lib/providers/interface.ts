// RALD Search — Abstract Provider Interface — LILCKY STUDIO LIMITED
// Designed for Postgres FTS (default), Meilisearch, OpenSearch — zero API change on swap

export type EntityType =
  | "customers" | "customer_notes" | "customer_activities" | "segments"
  | "workspaces" | "users" | "notifications" | "templates"
  | "conversations" | "messages" | "bookings" | "campaigns" | "knowledge_base" | "documents";

export interface SearchFilter {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains" | "startswith";
  value: unknown;
}

export interface SearchSort {
  field: string;
  direction: "asc" | "desc";
}

export interface FacetRequest {
  field: string;
  limit?: number;
}

export interface SearchRequest {
  query: string;
  workspaceId: string;
  entities: EntityType[];
  filters?: SearchFilter[];
  sort?: SearchSort[];
  facets?: FacetRequest[];
  page?: number;
  limit?: number;
  highlight?: boolean;
}

export interface SearchHit {
  id: string;
  entity: EntityType;
  score: number;
  data: Record<string, unknown>;
  highlights?: Record<string, string[]>;
}

export interface FacetValue {
  value: string;
  count: number;
}

export interface SearchFacet {
  field: string;
  values: FacetValue[];
}

export interface SearchResult {
  hits: SearchHit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets?: SearchFacet[];
  took_ms: number;
  provider: string;
}

export interface IndexRequest {
  entity: EntityType;
  workspaceId: string;
  id: string;
  data: Record<string, unknown>;
}

export interface SearchProvider {
  readonly name: string;
  search(req: SearchRequest): Promise<SearchResult>;
  index(doc: IndexRequest): Promise<void>;
  bulkIndex(docs: IndexRequest[]): Promise<void>;
  delete(entity: EntityType, workspaceId: string, id: string): Promise<void>;
  deleteWorkspace(workspaceId: string): Promise<void>;
  health(): Promise<{ ok: boolean; latencyMs: number; details?: Record<string, unknown> }>;
}
