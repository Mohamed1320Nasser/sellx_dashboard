import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shiftService } from "../../services/shiftService";
import { handleApiError } from "../../utils/errorHandler";
import toast from "react-hot-toast";

export const useShifts = (params: {
  companyId: number;
  page?: number;
  limit?: number;
  status?: "OPEN" | "CLOSED";
  registerId?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ["shifts", params],
    queryFn: () => shiftService.getList(params),
    enabled: !!params.companyId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useShift = (id: string, companyId: number) => {
  return useQuery({
    queryKey: ["shift", id, companyId],
    queryFn: () => shiftService.getById(id, companyId),
    enabled: !!id && !!companyId,
  });
};

export const useCurrentShift = (companyId: number) => {
  return useQuery({
    queryKey: ["current-shift", companyId],
    queryFn: () => shiftService.getCurrent(companyId),
    enabled: !!companyId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
};

export const useCreateShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: shiftService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["shifts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["current-shift"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cash-registers"],
      });
      toast.success("تم فتح الوردية بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useCloseShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      shiftService.close(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["shifts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["current-shift"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cash-registers"],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-summary"],
      });
      toast.success("تم إغلاق الوردية بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useCreateCashMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: shiftService.createCashMovement,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["shift", data.cashMovement.shiftId],
      });
      queryClient.invalidateQueries({
        queryKey: ["current-shift"],
      });
      toast.success("تم تسجيل الحركة النقدية بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};
