import { useQuery } from "@tanstack/react-query";
import analyticsService, {
  SalesTrendsFilters,
  ProductPerformanceFilters,
  CustomerAnalyticsFilters,
  InventoryAnalyticsFilters,
} from "../../services/analyticsService";
import { useSessionAuthStore } from "../../stores/sessionAuthStore";

// Sales Trends Analytics Hook
export const useSalesTrends = (
  filters: Omit<SalesTrendsFilters, "companyId">
) => {
  const { company } = useSessionAuthStore();
  const companyId = company?.companyId || 0;

  return useQuery({
    queryKey: ["analytics", "sales-trends", companyId, filters],
    queryFn: () => analyticsService.getSalesTrends({ ...filters, companyId }),
    enabled: !!companyId && companyId > 0,
  });
};

// Product Performance Analytics Hook
export const useProductPerformance = (
  filters: Omit<ProductPerformanceFilters, "companyId">
) => {
  const { company } = useSessionAuthStore();
  const companyId = company?.companyId || 0;

  return useQuery({
    queryKey: ["analytics", "product-performance", companyId, filters],
    queryFn: () =>
      analyticsService.getProductPerformance({ ...filters, companyId }),
    enabled: !!companyId && companyId > 0,
  });
};

// Customer Analytics Hook
export const useCustomerAnalytics = (
  filters: Omit<CustomerAnalyticsFilters, "companyId">
) => {
  const { company } = useSessionAuthStore();
  const companyId = company?.companyId || 0;

  return useQuery({
    queryKey: ["analytics", "customer-analytics", companyId, filters],
    queryFn: () =>
      analyticsService.getCustomerAnalytics({ ...filters, companyId }),
    enabled: !!companyId && companyId > 0,
  });
};

// Inventory Analytics Hook
export const useInventoryAnalytics = (
  filters: Omit<InventoryAnalyticsFilters, "companyId">
) => {
  const { company } = useSessionAuthStore();
  const companyId = company?.companyId || 0;

  return useQuery({
    queryKey: ["analytics", "inventory-analytics", companyId, filters],
    queryFn: () =>
      analyticsService.getInventoryAnalytics({ ...filters, companyId }),
    enabled: !!companyId && companyId > 0,
  });
};

// Dashboard Summary Hook
export const useDashboardSummary = () => {
  const { company } = useSessionAuthStore();
  const companyId = company?.companyId || 0;

  return useQuery({
    queryKey: ["analytics", "dashboard-summary", companyId],
    queryFn: () => analyticsService.getDashboardSummary(companyId),
    enabled: !!companyId && companyId > 0,
  });
};
