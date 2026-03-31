import { apiClient } from "./apiClient";
import type { Supplier, PaginatedResponse, BackendApiResponse } from "../types";

interface CreateSupplierRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  companyId: number;
}

export const supplierService = {
  create: (data: CreateSupplierRequest): Promise<Supplier> =>
    apiClient.post("/supplier/new", data),

  getList: (params: {
    companyId: number;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<BackendApiResponse<PaginatedResponse<Supplier>>> =>
    apiClient.get("/supplier/list", { params }),

  getById: (id: number): Promise<Supplier> =>
    apiClient.get(`/supplier/single/${id}`),

  edit: (id: number, data: Partial<CreateSupplierRequest>): Promise<Supplier> =>
    apiClient.put(`/supplier/single/${id}`, data),

  delete: (id: number, companyId: number): Promise<void> =>
    apiClient.delete(`/supplier/single/${id}`, { params: { companyId } }),
};
