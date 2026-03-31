import { apiClient } from "./apiClient";
import type { Category, PaginatedResponse, BackendApiResponse } from "../types";

interface CreateCategoryRequest {
  name: string;
  description?: string;
  companyId: number;
}

export const categoryService = {
  // Create category
  create: (data: CreateCategoryRequest): Promise<Category> =>
    apiClient.post("/category/new", data),

  // List categories
  getList: (params: {
    companyId: number;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<BackendApiResponse<PaginatedResponse<Category>>> =>
    apiClient.post("/category/list", params),

  // Get single category
  getById: (id: string): Promise<Category> =>
    apiClient.get(`/category/single/${id}`),

  // Edit category
  edit: (id: string, data: Partial<CreateCategoryRequest>): Promise<Category> =>
    apiClient.put(`/category/single/${id}`, data),

  // Delete category
  delete: (id: string, companyId: number): Promise<void> =>
    apiClient.delete(`/category/single/${id}`, {
      params: { companyId },
    }),
};
