import { useQuery } from "@tanstack/react-query";
import { financialReportService } from "../../services/financialReportService";
import { useSessionAuthStore } from "../../stores/sessionAuthStore";
import type {
  SalesReportFilters,
  ProfitLossReportFilters,
} from "../../types/business";

// Get sales report
export const useSalesReport = (filters: Partial<SalesReportFilters> = {}) => {
  const { company } = useSessionAuthStore();
  const companyId = company?.companyId;

  return useQuery({
    queryKey: ["salesReport", companyId, filters],
    queryFn: () =>
      financialReportService.getSalesReport({
        companyId: companyId!,
        ...filters,
      } as SalesReportFilters),
    enabled: !!companyId && companyId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get profit/loss report
export const useProfitLossReport = (
  filters: Partial<ProfitLossReportFilters> = {}
) => {
  const { company } = useSessionAuthStore();
  const companyId = company?.companyId;

  return useQuery({
    queryKey: ["profitLossReport", companyId, filters],
    queryFn: () =>
      financialReportService.getProfitLossReport({
        companyId: companyId!,
        ...filters,
      } as ProfitLossReportFilters),
    enabled: !!companyId && companyId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get top selling products
export const useTopSellingProducts = (limit: number = 10) => {
  const { company } = useSessionAuthStore();
  const companyId = company?.companyId;

  return useQuery({
    queryKey: ["topSellingProducts", companyId, limit],
    queryFn: () =>
      financialReportService.getTopSellingProducts({
        companyId: companyId!,
        limit,
      }),
    enabled: !!companyId && companyId > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get sales trends
export const useSalesTrends = (days: number = 30) => {
  const { company } = useSessionAuthStore();
  const companyId = company?.companyId;

  return useQuery({
    queryKey: ["salesTrends", companyId, days],
    queryFn: () =>
      financialReportService.getSalesTrends({
        companyId: companyId!,
        days,
      }),
    enabled: !!companyId && companyId > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
