import { apiClient } from "./apiClient";
import type { Sale, PaginatedResponse, BackendApiResponse } from "../types";

interface CreateSaleRequest {
  companyId: number;
  receiptNumber: string;
  clientId?: number;
  paymentMethod?: "CASH" | "CARD" | "CREDIT";
  saleDate?: string;
  items: {
    productId: string; // Backend expects string
    quantity: number;
    unitPrice: number;
  }[];
}

interface SaleFilters {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
  clientId?: number;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
}

export const saleService = {
  create: (data: CreateSaleRequest): Promise<Sale> =>
    apiClient.post("/sale/new", data),

  getList: (
    params: SaleFilters
  ): Promise<BackendApiResponse<PaginatedResponse<Sale>>> =>
    apiClient.get("/sale/list", { params }),

  getById: (id: string, companyId: number): Promise<Sale> =>
    apiClient.get(`/sale/single/${id}`, { params: { companyId } }),

  edit: (id: number, data: Partial<CreateSaleRequest>): Promise<Sale> =>
    apiClient.put(`/sale/single/${id}`, data),

  delete: (id: number, companyId: number): Promise<void> =>
    apiClient.delete(`/sale/single/${id}`, { params: { companyId } }),
};
