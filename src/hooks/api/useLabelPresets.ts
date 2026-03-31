import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { labelPresetService } from "../../services/labelPresetService";
import { handleApiError } from "../../utils/errorHandler";
import toast from "react-hot-toast";
import type { GetLabelPresetsRequest, CreateLabelPresetRequest, UpdateLabelPresetRequest } from "../../types";

// List label presets
export const useLabelPresets = (params: GetLabelPresetsRequest) => {
  return useQuery({
    queryKey: ["labelPresets", params],
    queryFn: () => labelPresetService.getList(params),
    enabled: !!params.companyId && params.companyId > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
  });
};

// Get active label presets (for dropdowns)
export const useActiveLabelPresets = (companyId: number) => {
  return useQuery({
    queryKey: ["labelPresets", "active", companyId],
    queryFn: () => labelPresetService.getActive(companyId),
    enabled: !!companyId && companyId > 0,
    staleTime: 5 * 60 * 1000,
  });
};

// Get default label preset
export const useDefaultLabelPreset = (companyId: number) => {
  return useQuery({
    queryKey: ["labelPresets", "default", companyId],
    queryFn: () => labelPresetService.getDefault(companyId),
    enabled: !!companyId && companyId > 0,
    staleTime: 5 * 60 * 1000,
  });
};

// Get single label preset
export const useLabelPreset = (id: string, companyId: number) => {
  return useQuery({
    queryKey: ["labelPreset", id],
    queryFn: () => labelPresetService.getById(id, companyId),
    enabled: !!id && !!companyId,
  });
};

// Create label preset
export const useCreateLabelPreset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLabelPresetRequest) => labelPresetService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labelPresets"] });
      toast.success("تم إنشاء حجم الملصق بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

// Update label preset
export const useUpdateLabelPreset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLabelPresetRequest }) =>
      labelPresetService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["labelPresets"] });
      queryClient.invalidateQueries({ queryKey: ["labelPreset", data.id] });
      toast.success("تم تحديث حجم الملصق بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

// Delete label preset
export const useDeleteLabelPreset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: number }) =>
      labelPresetService.delete(id, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labelPresets"] });
      toast.success("تم حذف حجم الملصق بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

// Toggle label preset active status
export const useToggleLabelPreset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: number }) =>
      labelPresetService.toggle(id, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labelPresets"] });
      toast.success("تم تغيير حالة حجم الملصق بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

// Set label preset as default
export const useSetDefaultLabelPreset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: number }) =>
      labelPresetService.setDefault(id, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labelPresets"] });
      toast.success("تم تعيين حجم الملصق الافتراضي بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};
