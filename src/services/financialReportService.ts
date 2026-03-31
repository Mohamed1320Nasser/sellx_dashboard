import { apiClient } from "./apiClient";
import type {
  SalesReportFilters,
  ProfitLossReportFilters,
  SalesReportResponse,
  ProfitLossReport,
  TopSellingProduct,
  SalesTrendsResponse,
} from "../types/business";

export const financialReportService = {
  // Get sales report
  getSalesReport: async (
    params: SalesReportFilters
  ): Promise<SalesReportResponse> => {
    const response = await apiClient.get("/financial-report/sales", { params });

    // Extract data from the response format: { msg: "ok", status: 200, data: result, error: false }
    if (
      response &&
      (response as any).data &&
      (response as any).error === false
    ) {
      const extractedData = (response as any).data;
      return extractedData as SalesReportResponse;
    } else {
      throw new Error("Invalid response format from API");
    }
  },

  // Get profit/loss report
  getProfitLossReport: async (
    params: ProfitLossReportFilters
  ): Promise<ProfitLossReport> => {
    const response = await apiClient.get("/financial-report/profit-loss", {
      params,
    });

    // Extract data from the response format: { msg: "ok", status: 200, data: result, error: false }
    if (
      response &&
      (response as any).data &&
      (response as any).error === false
    ) {
      const extractedData = (response as any).data;
      return extractedData as ProfitLossReport;
    } else {
      throw new Error("Invalid response format from API");
    }
  },

  // Get top selling products
  getTopSellingProducts: async (params: {
    companyId: number;
    limit?: number;
  }): Promise<TopSellingProduct[]> => {
    const response = await apiClient.get(
      "/financial-report/top-selling-products",
      { params }
    );

    // Extract data from the response format: { msg: "ok", status: 200, data: result, error: false }
    if (
      response &&
      (response as any).data &&
      (response as any).error === false
    ) {
      const extractedData = (response as any).data;
      return extractedData as TopSellingProduct[];
    } else {
      throw new Error("Invalid response format from API");
    }
  },

  // Get sales trends
  getSalesTrends: async (params: {
    companyId: number;
    days?: number;
  }): Promise<SalesTrendsResponse> => {
    const response = await apiClient.get("/financial-report/sales-trends", {
      params,
    });

    // Extract data from the response format: { msg: "ok", status: 200, data: result, error: false }
    if (
      response &&
      (response as any).data &&
      (response as any).error === false
    ) {
      const extractedData = (response as any).data;
      return extractedData as SalesTrendsResponse;
    } else {
      throw new Error("Invalid response format from API");
    }
  },
};
