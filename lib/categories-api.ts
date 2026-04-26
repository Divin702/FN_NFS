import { api } from "./api";
import { getToken } from "./auth";

export interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function getCategories(): Promise<TemplateCategory[]> {
  return api.get<TemplateCategory[]>("/template-categories", getToken() ?? undefined);
}

export function createCategory(data: { name: string; description?: string }): Promise<TemplateCategory> {
  return api.post<TemplateCategory>("/template-categories", data, getToken() ?? undefined);
}

export function updateCategory(id: string, data: { name?: string; description?: string }): Promise<TemplateCategory> {
  return api.patch<TemplateCategory>(`/template-categories/${id}`, data, getToken() ?? undefined);
}

export function deleteCategory(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/template-categories/${id}`, getToken() ?? undefined);
}
