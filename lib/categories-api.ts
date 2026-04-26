import { api } from "./api";

export interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export const categoriesKeys = {
  all: ["categories"] as const,
  lists: () => [...categoriesKeys.all, "list"] as const,
  detail: (id: string) => [...categoriesKeys.all, "detail", id] as const,
};

export const categoriesApi = {
  getAll: () => api.get<TemplateCategory[]>("/template-categories"),
  create: (data: { name: string; description?: string }) =>
    api.post<TemplateCategory>("/template-categories", data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch<TemplateCategory>(`/template-categories/${id}`, data),
  remove: (id: string) =>
    api.delete<{ message: string }>(`/template-categories/${id}`),
};
