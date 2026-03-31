import { apiClient } from "./apiClient";
import type {
  StockMovement,
  StockMovementSummary,
  ProductStockHistory,
  LowStockProduct,
  StockMovementType,
} from "../types/business";

// Request/Response Types
export interface CreateStockMovementRequest {
  productId: string;
  companyId: number;
  type: StockMovementType;
  quantity: number;
  reference?: string;
}

export interface StockMovementFilters {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
  productId?: string;
  type?: StockMovementType;
  startDate?: string;
  endDate?: string;
}

export interface StockMovementListResponse {
  list: StockMovement[];
  totalCount: number;
  filterCount: number;
}

export interface LowStockResponse {
  lowStockProducts: LowStockProduct[];
  count: number;
}

// Service Methods
export const stockMovementService = {
  // Create stock movement (adjustment)
  create: (data: CreateStockMovementRequest): Promise<StockMovement> =>
    apiClient.post("/stock-movement/adjust", data),

  // Get stock movements list
  getList: async (
    params: StockMovementFilters
  ): Promise<StockMovementListResponse> => {
    const response = await apiClient.get("/stock-movement/list", { params });

    // Extract data from the response format: { msg: "ok", status: 200, data: result, error: false }
    if (
      response &&
      (response as any).data &&
      (response as any).error === false
    ) {
      const extractedData = (response as any).data;
      return extractedData as StockMovementListResponse;
    } else {
      throw new Error("Invalid response format from API");
    }
  },

  // Get single stock movement
  getById: (id: string): Promise<StockMovement> =>
    apiClient.get(`/stock-movement/single/${id}`),

  // Get stock movement summary
  getSummary: (companyId: number): Promise<StockMovementSummary> =>
    apiClient.get("/stock-movement/summary", { params: { companyId } }),

  // Get product stock history
  getProductHistory: (
    productId: string,
    companyId: number
  ): Promise<ProductStockHistory> =>
    apiClient.get(`/stock-movement/product-history/${productId}`, {
      params: { companyId },
    }),

  // Get low stock products
  getLowStock: (companyId: number): Promise<LowStockResponse> =>
    apiClient.get("/stock-movement/low-stock", { params: { companyId } }),
};

// Types are already exported above
