import { api } from "./api";
import type { TemplateCategory } from "./categories-api";

export type TemplateStatus = "draft" | "published";

export interface TemplateField {
  key: string;
  label: string;
  required: boolean;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  templateCode: string;
  version: string;
  shortDescription: string | null;
  content: string | null;
  fileUrl: string | null;
  fields: TemplateField[];
  status: TemplateStatus;
  categoryId: string | null;
  category: TemplateCategory | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplatesResponse {
  data: DocumentTemplate[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TemplatesQuery {
  search?: string;
  categoryId?: string;
  status?: TemplateStatus;
  page?: number;
  limit?: number;
}

export interface CreateTemplateDto {
  name: string;
  templateCode: string;
  shortDescription?: string;
  content?: string;
  fileUrl?: string;
  status?: TemplateStatus;
  categoryId?: string;
}

function buildQs(q: TemplatesQuery): string {
  const params = new URLSearchParams();
  if (q.search) params.set("search", q.search);
  if (q.categoryId) params.set("categoryId", q.categoryId);
  if (q.status) params.set("status", q.status);
  if (q.page) params.set("page", String(q.page));
  if (q.limit) params.set("limit", String(q.limit));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const templatesKeys = {
  all: ["templates"] as const,
  lists: () => [...templatesKeys.all, "list"] as const,
  list: (query: TemplatesQuery) => [...templatesKeys.lists(), query] as const,
  detail: (id: string) => [...templatesKeys.all, "detail", id] as const,
};

export const templatesApi = {
  getAll: (query: TemplatesQuery = {}) =>
    api.get<TemplatesResponse>(`/document-templates${buildQs(query)}`),
  getOne: (id: string) =>
    api.get<DocumentTemplate>(`/document-templates/${id}`),
  create: (data: CreateTemplateDto) =>
    api.post<DocumentTemplate>("/document-templates", data),
  update: (id: string, data: Partial<CreateTemplateDto>) =>
    api.patch<DocumentTemplate>(`/document-templates/${id}`, data),
  remove: (id: string) =>
    api.delete<{ message: string }>(`/document-templates/${id}`),
};
