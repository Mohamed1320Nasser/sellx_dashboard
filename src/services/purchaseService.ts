import { apiClient } from "./apiClient";
import type { Purchase, PaginatedResponse, BackendApiResponse } from "../types";

interface CreatePurchaseRequest {
  companyId: number;
  invoiceNumber: string;
  supplierId: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod?: string;
  taxRate?: number;
  taxAmount?: number;
  dueDate?: string;
  purchaseDate?: string;
  reminderEnabled?: boolean;
  reminderDate?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    updateProductPrice?: boolean;
    newProductPrice?: number;
  }[];
}

interface PurchaseFilters {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
  supplierId?: number;
  startDate?: string;
  endDate?: string;
}

export const purchaseService = {
  create: (data: CreatePurchaseRequest | FormData): Promise<Purchase> =>
    apiClient.post("/purchase/new", data),

  getList: (
    params: PurchaseFilters
  ): Promise<BackendApiResponse<PaginatedResponse<Purchase>>> =>
    apiClient.get("/purchase/list", { params }),

  getById: (id: number, companyId: number): Promise<Purchase> =>
    apiClient.get(`/purchase/single/${id}`, { params: { companyId } }),

  edit: (id: number, data: Partial<CreatePurchaseRequest> | FormData): Promise<Purchase> =>
    apiClient.put(`/purchase/single/${id}`, data),

  delete: (id: number, companyId: number): Promise<void> =>
    apiClient.delete(`/purchase/single/${id}`, { params: { companyId } }),
};
