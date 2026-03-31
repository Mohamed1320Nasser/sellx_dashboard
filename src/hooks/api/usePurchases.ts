import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseService } from "../../services/purchaseService";
import { handleApiError } from "../../utils/errorHandler";
import toast from "react-hot-toast";

export const usePurchases = (params: {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
  supplierId?: number;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ["purchases", params],
    queryFn: () => purchaseService.getList(params),
    enabled: !!params.companyId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: purchaseService.create,
    onSuccess: () => {
      // Invalidate ALL purchases queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("تم إنشاء عملية الشراء بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useDeletePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: number; companyId: number }) =>
      purchaseService.delete(id, companyId),
    onSuccess: () => {
      // Invalidate ALL purchases queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("تم حذف عملية الشراء بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};
