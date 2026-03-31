import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stockMovementService } from "../../services/stockMovementService";
import { useSessionAuthStore } from "../../stores/sessionAuthStore";
import type {
  StockMovementFilters,
  CreateStockMovementRequest,
} from "../../services/stockMovementService";

// Get stock movements list
export const useStockMovements = (
  filters: Partial<StockMovementFilters> = {}
) => {
  const { company } = useSessionAuthStore();

  return useQuery({
    queryKey: ["stockMovements", company?.companyId, filters],
    queryFn: () =>
      stockMovementService.getList({
        companyId: company?.companyId || 0,
        ...filters,
      } as StockMovementFilters),
    enabled: !!company?.companyId,
  });
};

// Get single stock movement
export const useStockMovement = (id: string) => {
  return useQuery({
    queryKey: ["stockMovement", id],
    queryFn: () => stockMovementService.getById(id),
    enabled: !!id,
  });
};

// Get stock movement summary
export const useStockMovementSummary = () => {
  const { company } = useSessionAuthStore();

  return useQuery({
    queryKey: ["stockMovementSummary", company?.companyId],
    queryFn: () => stockMovementService.getSummary(company?.companyId || 0),
    enabled: !!company?.companyId,
  });
};

// Get product stock history
export const useProductStockHistory = (productId: string) => {
  const { company } = useSessionAuthStore();

  return useQuery({
    queryKey: ["productStockHistory", productId, company?.companyId],
    queryFn: () =>
      stockMovementService.getProductHistory(
        productId,
        company?.companyId || 0
      ),
    enabled: !!productId && !!company?.companyId,
  });
};

// Get low stock products
export const useLowStockProducts = () => {
  const { company } = useSessionAuthStore();

  return useQuery({
    queryKey: ["lowStockProducts", company?.companyId],
    queryFn: () => stockMovementService.getLowStock(company?.companyId || 0),
    enabled: !!company?.companyId,
  });
};

// Create stock movement mutation
export const useCreateStockMovement = () => {
  const queryClient = useQueryClient();
  const { company } = useSessionAuthStore();

  return useMutation({
    mutationFn: (data: Omit<CreateStockMovementRequest, "companyId">) =>
      stockMovementService.create({
        ...data,
        companyId: company?.companyId || 0,
      }),
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ["stockMovements"] });
      queryClient.invalidateQueries({ queryKey: ["stockMovementSummary"] });
      queryClient.invalidateQueries({ queryKey: ["lowStockProducts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productStockHistory"] });
    },
  });
};
