import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierService } from "../../services/supplierService";
import { handleApiError } from "../../utils/errorHandler";
import toast from "react-hot-toast";

export const useSuppliers = (params: {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => supplierService.getList(params),
    enabled: !!params.companyId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: supplierService.create,
    onSuccess: () => {
      // Invalidate ALL suppliers queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("تم إنشاء المورد بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      supplierService.edit(id, data),
    onSuccess: () => {
      // Invalidate ALL suppliers queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("تم تحديث المورد بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: number; companyId: number }) =>
      supplierService.delete(id, companyId),
    onSuccess: () => {
      // Invalidate ALL suppliers queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("تم حذف المورد بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};
