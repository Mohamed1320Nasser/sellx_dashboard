import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { absenceService } from "../../services/absenceService";
import type {
  CreateAbsenceRequest,
  UpdateAbsenceRequest,
  ApproveAbsenceRequest,
  GetAbsenceListRequest,
} from "../../types";

// Query Keys
export const absenceKeys = {
  all: ["absences"] as const,
  lists: () => [...absenceKeys.all, "list"] as const,
  list: (params: GetAbsenceListRequest) =>
    [...absenceKeys.lists(), params] as const,
  details: () => [...absenceKeys.all, "detail"] as const,
  detail: (id: string) => [...absenceKeys.details(), id] as const,
  summary: (companyId: number) =>
    [...absenceKeys.all, "summary", companyId] as const,
};

// Get absences list
export const useAbsences = (params: GetAbsenceListRequest) => {
  return useQuery({
    queryKey: absenceKeys.list(params),
    queryFn: () => absenceService.getList(params),
    enabled: !!params.companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get absence by ID
export const useAbsence = (id: string) => {
  return useQuery({
    queryKey: absenceKeys.detail(id),
    queryFn: () => absenceService.getById(id),
    enabled: !!id,
  });
};

// Get absence summary/statistics
export const useAbsenceSummary = (companyId: number) => {
  return useQuery({
    queryKey: absenceKeys.summary(companyId),
    queryFn: () => absenceService.getSummary(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create absence mutation
export const useCreateAbsence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAbsenceRequest) => absenceService.create(data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch absences list
      queryClient.invalidateQueries({ queryKey: absenceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: absenceKeys.summary(variables.companyId),
      });

      // Invalidate analytics and dashboard data
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      toast.success("تم إنشاء طلب الغياب بنجاح");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "فشل في إنشاء طلب الغياب";
      toast.error(message);
    },
  });
};

// Update absence mutation
export const useUpdateAbsence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAbsenceRequest }) =>
      absenceService.update(id, data),
    onSuccess: (data) => {
      // Invalidate and refetch absences data
      queryClient.invalidateQueries({ queryKey: absenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: absenceKeys.detail(data.id) });
      queryClient.invalidateQueries({
        queryKey: absenceKeys.summary(data.companyId),
      });

      // Invalidate analytics and dashboard data
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      toast.success("تم تحديث طلب الغياب بنجاح");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "فشل في تحديث طلب الغياب";
      toast.error(message);
    },
  });
};

// Approve absence mutation
export const useApproveAbsence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveAbsenceRequest }) =>
      absenceService.approve(id, data),
    onSuccess: (data) => {
      // Invalidate and refetch absences data
      queryClient.invalidateQueries({ queryKey: absenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: absenceKeys.detail(data.id) });
      queryClient.invalidateQueries({
        queryKey: absenceKeys.summary(data.companyId),
      });

      // Invalidate analytics and dashboard data
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      const statusText =
        data.status === "APPROVED"
          ? "موافقة"
          : data.status === "REJECTED"
            ? "رفض"
            : "إلغاء";
      toast.success(`تم ${statusText} طلب الغياب بنجاح`);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "فشل في معالجة طلب الغياب";
      toast.error(message);
    },
  });
};

// Delete absence mutation
export const useDeleteAbsence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => absenceService.delete(id),
    onSuccess: (data, id) => {
      // Invalidate and refetch absences data
      queryClient.invalidateQueries({ queryKey: absenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: absenceKeys.detail(id) });

      // Invalidate analytics and dashboard data
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      toast.success("تم حذف طلب الغياب بنجاح");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "فشل في حذف طلب الغياب";
      toast.error(message);
    },
  });
};
