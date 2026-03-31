import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taxService } from "../../services/taxService";
import { handleApiError } from "../../utils/errorHandler";
import toast from "react-hot-toast";
import type { GetTaxSettingsRequest, CreateTaxSettingRequest, UpdateTaxSettingRequest } from "../../types";

// List tax settings
export const useTaxSettings = (params: GetTaxSettingsRequest) => {
  return useQuery({
    queryKey: ["taxSettings", params],
    queryFn: () => taxService.getList(params),
    enabled: !!params.companyId && params.companyId > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
  });
};

// Get active tax settings (for dropdowns)
export const useActiveTaxSettings = (companyId: number) => {
  return useQuery({
    queryKey: ["taxSettings", "active", companyId],
    queryFn: () => taxService.getActive(companyId),
    enabled: !!companyId && companyId > 0,
    staleTime: 5 * 60 * 1000,
  });
};

// Get default tax setting
export const useDefaultTaxSetting = (companyId: number) => {
  return useQuery({
    queryKey: ["taxSettings", "default", companyId],
    queryFn: () => taxService.getDefault(companyId),
    enabled: !!companyId && companyId > 0,
    staleTime: 5 * 60 * 1000,
  });
};

// Get single tax setting
export const useTaxSetting = (id: string, companyId: number) => {
  return useQuery({
    queryKey: ["taxSetting", id],
    queryFn: () => taxService.getById(id, companyId),
    enabled: !!id && !!companyId,
  });
};

// Create tax setting
export const useCreateTaxSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaxSettingRequest) => taxService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxSettings"] });
      toast.success("تم إنشاء إعداد الضريبة بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

// Update tax setting
export const useUpdateTaxSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaxSettingRequest }) =>
      taxService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["taxSettings"] });
      queryClient.invalidateQueries({ queryKey: ["taxSetting", data.id] });
      toast.success("تم تحديث إعداد الضريبة بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

// Delete tax setting
export const useDeleteTaxSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: number }) =>
      taxService.delete(id, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxSettings"] });
      toast.success("تم حذف إعداد الضريبة بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

// Toggle tax setting active status
export const useToggleTaxSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: number }) =>
      taxService.toggle(id, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxSettings"] });
      toast.success("تم تغيير حالة الضريبة بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

// Set tax setting as default
export const useSetDefaultTaxSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: number }) =>
      taxService.setDefault(id, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxSettings"] });
      toast.success("تم تعيين الضريبة الافتراضية بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};
