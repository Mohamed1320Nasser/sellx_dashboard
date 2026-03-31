import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryService } from "../../services/categoryService";
import { handleApiError } from "../../utils/errorHandler";
import toast from "react-hot-toast";

// List categories
export const useCategories = (params: {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: () => categoryService.getList(params),
    enabled: !!params.companyId && params.companyId > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
  });
};

// Get single category
export const useCategory = (id: string) => {
  return useQuery({
    queryKey: ["category", id],
    queryFn: () => categoryService.getById(id),
    enabled: !!id,
  });
};

// Create category
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryService.create,
    onSuccess: () => {
      // Invalidate all categories queries
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });
      toast.success("تم إنشاء الفئة بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

// Update category
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      categoryService.edit(id, data),
    onSuccess: (data) => {
      // Invalidate all categories queries
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });
      queryClient.invalidateQueries({ queryKey: ["category", data.id] });
      toast.success("تم تحديث الفئة بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

// Delete category
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: number }) =>
      categoryService.delete(id, companyId),
    onSuccess: () => {
      // Invalidate all categories queries
      queryClient.invalidateQueries({
        queryKey: ["categories"],
      });
      toast.success("تم حذف الفئة بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};
