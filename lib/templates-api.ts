import { api } from "./api";
import { getToken } from "./auth";
import type { TemplateCategory } from "./categories-api";

export type TemplateStatus = "draft" | "published";

export interface DocumentTemplate {
  id: string;
  name: string;
  templateCode: string;
  version: string;
  shortDescription: string | null;
  content: string | null;
  fileUrl: string | null;
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

export function getTemplates(query: TemplatesQuery = {}): Promise<TemplatesResponse> {
  return api.get<TemplatesResponse>(`/document-templates${buildQs(query)}`, getToken() ?? undefined);
}

export function getTemplate(id: string): Promise<DocumentTemplate> {
  return api.get<DocumentTemplate>(`/document-templates/${id}`, getToken() ?? undefined);
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

export function createTemplate(data: CreateTemplateDto): Promise<DocumentTemplate> {
  return api.post<DocumentTemplate>("/document-templates", data, getToken() ?? undefined);
}

export function updateTemplate(id: string, data: Partial<CreateTemplateDto>): Promise<DocumentTemplate> {
  return api.patch<DocumentTemplate>(`/document-templates/${id}`, data, getToken() ?? undefined);
}

export function deleteTemplate(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/document-templates/${id}`, getToken() ?? undefined);
}
