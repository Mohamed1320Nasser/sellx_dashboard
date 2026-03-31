import apiClient from "./apiClient";
import {
  SalesTrendsAnalyticsResponse,
  ProductPerformanceResponse,
  CustomerAnalyticsResponse,
  InventoryAnalyticsResponse,
  DashboardSummary,
  TrendPeriod,
  TrendMetric,
  PerformanceMetric,
  CustomerMetric,
  InventoryMetric,
  SortOrder,
} from "../types/business";

export interface SalesTrendsFilters {
  companyId: number;
  period?: TrendPeriod;
  metric?: TrendMetric;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface ProductPerformanceFilters {
  companyId: number;
  metric?: PerformanceMetric;
  sortOrder?: SortOrder;
  startDate?: string;
  endDate?: string;
  limit?: number;
  categoryId?: number;
}

export interface CustomerAnalyticsFilters {
  companyId: number;
  metric?: CustomerMetric;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface InventoryAnalyticsFilters {
  companyId: number;
  metric?: InventoryMetric;
  limit?: number;
  categoryId?: number;
}

class AnalyticsService {
  // Sales Trends Analytics
  async getSalesTrends(
    filters: SalesTrendsFilters
  ): Promise<SalesTrendsAnalyticsResponse> {
    const params = new URLSearchParams();

    params.append("companyId", filters.companyId.toString());

    if (filters.period) {
      params.append("period", filters.period);
    }
    if (filters.metric) {
      params.append("metric", filters.metric);
    }
    if (filters.startDate) {
      params.append("startDate", filters.startDate);
    }
    if (filters.endDate) {
      params.append("endDate", filters.endDate);
    }
    if (filters.limit) {
      params.append("limit", filters.limit.toString());
    }

    const response = await apiClient.get(
      `/analytics/sales-trends?${params.toString()}`
    );

    // Extract data from the response format: { msg: "ok", status: 200, data: result, error: false }
    if (
      response &&
      (response as any).data &&
      (response as any).error === false
    ) {
      const extractedData = (response as any).data;
      return extractedData as SalesTrendsAnalyticsResponse;
    } else {
      throw new Error("Invalid response format from API");
    }
  }

  // Product Performance Analytics
  async getProductPerformance(
    filters: ProductPerformanceFilters
  ): Promise<ProductPerformanceResponse> {
    const params = new URLSearchParams();

    params.append("companyId", filters.companyId.toString());

    if (filters.metric) {
      params.append("metric", filters.metric);
    }
    if (filters.sortOrder) {
      params.append("sortOrder", filters.sortOrder);
    }
    if (filters.startDate) {
      params.append("startDate", filters.startDate);
    }
    if (filters.endDate) {
      params.append("endDate", filters.endDate);
    }
    if (filters.limit) {
      params.append("limit", filters.limit.toString());
    }
    if (filters.categoryId) {
      params.append("categoryId", filters.categoryId.toString());
    }

    const response = await apiClient.get(
      `/analytics/product-performance?${params.toString()}`
    );

    // Extract data from the response format: { msg: "ok", status: 200, data: result, error: false }
    if (
      response &&
      (response as any).data &&
      (response as any).error === false
    ) {
      const extractedData = (response as any).data;
      return extractedData as ProductPerformanceResponse;
    } else {
      throw new Error("Invalid response format from API");
    }
  }

  // Customer Analytics
  async getCustomerAnalytics(
    filters: CustomerAnalyticsFilters
  ): Promise<CustomerAnalyticsResponse> {
    const params = new URLSearchParams();

    params.append("companyId", filters.companyId.toString());

    if (filters.metric) {
      params.append("metric", filters.metric);
    }
    if (filters.startDate) {
      params.append("startDate", filters.startDate);
    }
    if (filters.endDate) {
      params.append("endDate", filters.endDate);
    }
    if (filters.limit) {
      params.append("limit", filters.limit.toString());
    }

    const response = await apiClient.get(
      `/analytics/customer-analytics?${params.toString()}`
    );

    // Extract data from the response format: { msg: "ok", status: 200, data: result, error: false }
    if (
      response &&
      (response as any).data &&
      (response as any).error === false
    ) {
      const extractedData = (response as any).data;
      return extractedData as CustomerAnalyticsResponse;
    } else {
      throw new Error("Invalid response format from API");
    }
  }

  // Inventory Analytics
  async getInventoryAnalytics(
    filters: InventoryAnalyticsFilters
  ): Promise<InventoryAnalyticsResponse> {
    const params = new URLSearchParams();

    params.append("companyId", filters.companyId.toString());

    if (filters.metric) {
      params.append("metric", filters.metric);
    }
    if (filters.limit) {
      params.append("limit", filters.limit.toString());
    }
    if (filters.categoryId) {
      params.append("categoryId", filters.categoryId.toString());
    }

    const response = await apiClient.get(
      `/analytics/inventory-analytics?${params.toString()}`
    );

    // Extract data from the response format: { msg: "ok", status: 200, data: result, error: false }
    if (
      response &&
      (response as any).data &&
      (response as any).error === false
    ) {
      const extractedData = (response as any).data;
      return extractedData as InventoryAnalyticsResponse;
    } else {
      throw new Error("Invalid response format from API");
    }
  }

  // Dashboard Summary
  async getDashboardSummary(companyId: number): Promise<DashboardSummary> {
    const response = await apiClient.get(
      `/analytics/dashboard-summary/${companyId}`
    );

    // Extract data from the response format: { msg: "ok", status: 200, data: result, error: false }
    if (
      response &&
      (response as any).data &&
      (response as any).error === false
    ) {
      const extractedData = (response as any).data;
      return (extractedData as any).data as DashboardSummary;
    } else {
      throw new Error("Invalid response format from API");
    }
  }
}

export default new AnalyticsService();
