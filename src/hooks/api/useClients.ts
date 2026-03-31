import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientService } from "../../services/clientService";
import { handleApiError } from "../../utils/errorHandler";
import toast from "react-hot-toast";

export const useClients = (params: {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["clients", params],
    queryFn: () => clientService.getList(params),
    enabled: !!params.companyId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clientService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["clients"],
      });
      toast.success("تم إنشاء العميل بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      clientService.edit(id, data),
    onSuccess: () => {
      // Invalidate ALL clients queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("تم تحديث العميل بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: number; companyId: number }) =>
      clientService.delete(id, companyId),
    onSuccess: () => {
      // Invalidate ALL clients queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("تم حذف العميل بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};
