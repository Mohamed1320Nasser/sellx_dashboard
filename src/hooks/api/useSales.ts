import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { saleService } from "../../services/saleService";
import { handleApiError } from "../../utils/errorHandler";
import { generateHtmlReceipt } from "../../utils/htmlPdfGenerator";
import toast from "react-hot-toast";

export const useSales = (params: {
  companyId: number;
  page?: number;
  limit?: number;
  search?: string;
  clientId?: number;
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  additionalFeeFilter?: string;
}) => {
  return useQuery({
    queryKey: ["sales", params],
    queryFn: () => saleService.getList(params),
    enabled: !!params.companyId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSale = (id: number, companyId: number) => {
  return useQuery({
    queryKey: ["sale", id, companyId],
    queryFn: () => saleService.getById(id.toString(), companyId),
    enabled: !!id && !!companyId,
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saleService.create,
    onSuccess: () => {
      // Invalidate ALL sales queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم إنشاء عملية البيع بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useUpdateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      saleService.edit(id, data),
    onSuccess: (_, variables) => {
      // Invalidate ALL sales queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sale", variables.id] });
      toast.success("تم تحديث عملية البيع بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useDeleteSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: number; companyId: number }) =>
      saleService.delete(id, companyId),
    onSuccess: () => {
      // Invalidate ALL sales queries to ensure refresh
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("تم حذف عملية البيع بنجاح");
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message);
    },
  });
};

export const useGenerateReceipt = () => {
  return useMutation({
    mutationFn: async ({
      saleId,
      companyId,
    }: {
      saleId: number;
      companyId: number;
    }) => {
      // Fetch the sale data first
      const response = await saleService.getById(saleId.toString(), companyId);

      // Debug: Log the raw response in development

      // Handle different response structures
      let saleData: any = response;
      if (response && typeof response === "object" && "data" in response) {
        saleData = (response as any).data;
      }

      // Validate that we have the required data
      if (!saleData || !saleData.receiptNumber) {
        throw new Error(
          `Invalid sale data received: ${JSON.stringify(saleData)}`
        );
      }

      return saleData;
    },
    onSuccess: async (saleData) => {
      try {
        // Generate PDF receipt using the sale data
        await generateHtmlReceipt({ sale: saleData });
        toast.success("تم تحميل الفاتورة بنجاح");
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء إنشاء الفاتورة";
        toast.error(errorMessage);
      }
    },
    onError: (error) => {
      const message = handleApiError(error);
      toast.error(message || "حدث خطأ أثناء إنشاء الفاتورة");
    },
  });
};
