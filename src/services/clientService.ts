import { apiClient } from "./apiClient";
import type { Client, PaginatedResponse, BackendApiResponse } from "../types";

interface CreateClientRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  companyId: number;
}

export const clientService = {
  create: (data: CreateClientRequest): Promise<Client> =>
    apiClient.post("/client/new", data),

  getList: (params: {
    companyId: number;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<BackendApiResponse<PaginatedResponse<Client>>> =>
    apiClient.get("/client/list", { params }),

  getById: (id: number): Promise<Client> =>
    apiClient.get(`/client/single/${id}`),

  edit: (id: number, data: Partial<CreateClientRequest>): Promise<Client> =>
    apiClient.put(`/client/single/${id}`, data),

  delete: (id: number, companyId: number): Promise<void> =>
    apiClient.delete(`/client/single/${id}`, { params: { companyId } }),
};
