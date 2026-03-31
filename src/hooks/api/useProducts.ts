import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "../../services/productService";
import { handleApiError } from "../../utils/errorHandler";
import toast from "react-hot-toast";
import type { Product } from "../../types/business";

// List products
export const useProducts = (params: {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  lowStock?: boolean;
}) => {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productService.getList(params),
    enabled: !!params.companyId,
    staleTime: 5 * 60 * 1000,
  });
};

// Get single product
export const useProduct = (id: string, companyId: number) => {
  return useQuery({
    queryKey: ["product", id, companyId],
    queryFn: () => productService.getById(id, companyId),
    enabled: !!id && !!companyId,
    select: (data) => data?.data || data, // Extract the actual product data
  }) as { data: Product | undefined; isLoading: boolean; error: any };
};

// Create product
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productService.create,
    onSuccess: () => {
      // Invalidate ALL products queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم إنشاء المنتج بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

// Update product
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productService.edit(id, data),
    onSuccess: (_, variables) => {
      // Invalidate ALL products queries and single product
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
      toast.success("تم تحديث المنتج بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

// Delete product
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: number }) =>
      productService.delete(id, companyId),
    onSuccess: () => {
      // Invalidate ALL products queries to ensure refresh
      queryClient.invalidateQueries({
        queryKey: ["products"],
      });
      toast.success("تم حذف المنتج بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};
