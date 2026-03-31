import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cashRegisterService } from "../../services/cashRegisterService";
import { handleApiError } from "../../utils/errorHandler";
import toast from "react-hot-toast";

export const useCashRegisters = (companyId: number) => {
  return useQuery({
    queryKey: ["cash-registers", companyId],
    queryFn: () => cashRegisterService.getList(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCashRegister = (id: string, companyId: number) => {
  return useQuery({
    queryKey: ["cash-register", id, companyId],
    queryFn: () => cashRegisterService.getById(id, companyId),
    enabled: !!id && !!companyId,
  });
};

export const useCreateCashRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cashRegisterService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["cash-registers"],
      });
      toast.success("تم إنشاء صندوق النقد بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useUpdateCashRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      cashRegisterService.edit(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["cash-registers"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cash-register", data.cashRegister.id],
      });
      toast.success("تم تحديث صندوق النقد بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useDeleteCashRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: number }) =>
      cashRegisterService.delete(id, companyId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["cash-registers"],
      });
      toast.success("تم حذف صندوق النقد بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};
