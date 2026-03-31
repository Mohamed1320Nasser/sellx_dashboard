import { apiClient } from "./apiClient";
import type {
  Return,
  CreateReturnRequest,
  UpdateReturnStatusRequest,
  GetReturnListRequest,
  ReturnStatistics,
  BackendApiResponse,
  PaginatedResponse,
} from "../types";

export const returnService = {
  create: (data: CreateReturnRequest): Promise<Return> =>
    apiClient.post("/return/new", data),

  // Get returns list
  getList: (
    params: GetReturnListRequest
  ): Promise<BackendApiResponse<PaginatedResponse<Return>>> =>
    apiClient.get("/return/list", { params }),

  // Get return by ID
  getById: (id: string, companyId: number): Promise<Return> =>
    apiClient.get(`/return/single/${id}`, { params: { companyId } }),

  // Update return status
  updateStatus: (
    id: string,
    data: UpdateReturnStatusRequest
  ): Promise<Return> => apiClient.put(`/return/single/${id}`, data),

  // Delete return
  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    apiClient.delete(`/return/single/${id}`),

  // Get return statistics
  getStatistics: async (companyId: number): Promise<ReturnStatistics> => {
    const response = await apiClient.get("/return/statistics", {
      params: { companyId },
    });

    // Extract data from the response format: { msg: "ok", status: 200, data: result, error: false }
    if (
      response &&
      (response as any).data &&
      (response as any).error === false
    ) {
      return (response as any).data as ReturnStatistics;
    } else {
      throw new Error("Invalid response format from API");
    }
  },

  // Get returns by sale ID
  getBySale: (saleId: number): Promise<Return[]> =>
    apiClient.get(`/return/sale/${saleId}`),
};
