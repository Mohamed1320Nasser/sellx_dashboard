import { apiClient } from "./apiClient";
import type {
  Quote,
  CreateQuoteRequest,
  CalculateQuoteRequest,
  UpdateQuoteRequest,
  GetQuoteListRequest,
  BackendApiResponse,
  PaginatedResponse,
} from "../types";

export const quoteService = {
  // Calculate quote without saving
  calculate: (data: CalculateQuoteRequest): Promise<Quote> =>
    apiClient.post("/quote/calculate", data),

  // Create and save quote
  create: (data: CreateQuoteRequest): Promise<Quote> =>
    apiClient.post("/quote/new", data),

  // Get quote by ID
  getById: (id: string, companyId: number): Promise<Quote> =>
    apiClient.get(`/quote/single/${id}`, { params: { companyId } }),

  // Get quotes list
  getList: (
    params: GetQuoteListRequest
  ): Promise<BackendApiResponse<PaginatedResponse<Quote>>> =>
    apiClient.get("/quote/list", { params }),

  // Update quote
  update: (id: string, data: UpdateQuoteRequest): Promise<Quote> =>
    apiClient.put(`/quote/single/${id}`, data),

  // Delete quote
  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    apiClient.delete(`/quote/single/${id}`),

  // Print quote
  print: (id: string): Promise<Quote> =>
    apiClient.get(`/quote/single/${id}/print`),

  // Convert quote to sale
  convertToSale: (id: string, companyId: number): Promise<{ success: boolean; saleId: number; sale: any }> =>
    apiClient.post(`/quote/convert-to-sale/${id}`, { companyId }),

  // Email quote to customer
  email: (id: string, companyId: number): Promise<{ success: boolean; message: string }> =>
    apiClient.post(`/quote/email/${id}`, { companyId }),
};
