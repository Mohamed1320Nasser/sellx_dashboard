import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quoteService } from "../../services/quoteService";
import { useApiErrorHandler } from "../useApiErrorHandler";
import { generateQuotePdf } from "../../utils/quotePdfGenerator";
import toast from "react-hot-toast";
import type {
  CreateQuoteRequest,
  CalculateQuoteRequest,
  UpdateQuoteRequest,
  GetQuoteListRequest,
  Quote,
} from "../../types";

// Get quotes list
export const useQuotes = (params: GetQuoteListRequest) => {
  return useQuery({
    queryKey: ["quotes", params],
    queryFn: () => quoteService.getList(params),
    enabled: !!params.companyId && params.companyId > 0,
    staleTime: 5 * 60 * 1000,
  });
};

// Get single quote
export const useQuote = (id: string, companyId: number) => {
  return useQuery({
    queryKey: ["quotes", id, companyId],
    queryFn: () => quoteService.getById(id, companyId),
    enabled: !!id && !!companyId && companyId > 0,
    staleTime: 5 * 60 * 1000,
    select: (data: any) => data?.data || data, // Extract the actual quote data from wrapped response
  });
};

// Calculate quote with enhanced error handling and retry logic
export const useCalculateQuote = () => {
  const { handleError } = useApiErrorHandler();

  return useMutation({
    mutationFn: async (data: CalculateQuoteRequest) => {
      // Validate input data
      if (!data.companyId || data.companyId <= 0) {
        throw new Error("معرف الشركة غير صحيح");
      }

      if (!data.items || data.items.length === 0) {
        throw new Error("يجب إضافة منتجات للعرض السعري");
      }

      const result = await quoteService.calculate(data);

      // Validate response
      if (!result || typeof result.total !== "number") {
        throw new Error("استجابة غير صحيحة من الخادم");
      }

      return result;
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "حدث خطأ في حساب العرض السعري";
      handleError(error, errorMessage);
    },
    retry: (failureCount, error: any) => {
      // Don't retry on validation errors
      if (error?.response?.status === 400) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Create quote with enhanced validation and error handling
export const useCreateQuote = () => {
  const queryClient = useQueryClient();
  const { handleError } = useApiErrorHandler();

  return useMutation({
    mutationFn: async (data: CreateQuoteRequest) => {
      // Validate input data
      if (!data.companyId || data.companyId <= 0) {
        throw new Error("معرف الشركة غير صحيح");
      }

      if (!data.items || data.items.length === 0) {
        throw new Error("يجب إضافة منتجات للعرض السعري");
      }

      // Validate items
      for (const item of data.items) {
        if (!item.productId) {
          throw new Error("معرف المنتج مطلوب");
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error("كمية المنتج يجب أن تكون أكبر من صفر");
        }
      }

      return await quoteService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["quotes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["analytics"],
      });
      toast.success("تم إنشاء العرض السعري بنجاح");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "حدث خطأ في إنشاء العرض السعري";
      handleError(error, errorMessage);
    },
  });
};

// Update quote
export const useUpdateQuote = () => {
  const queryClient = useQueryClient();
  const { handleError } = useApiErrorHandler();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuoteRequest }) =>
      quoteService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["quotes"],
      });
      queryClient.invalidateQueries({
        queryKey: ["quotes", id],
      });
      toast.success("تم تحديث العرض السعري بنجاح");
    },
    onError: (error) => {
      handleError(error, "حدث خطأ في تحديث العرض السعري");
    },
  });
};

// Delete quote
export const useDeleteQuote = () => {
  const queryClient = useQueryClient();
  const { handleError } = useApiErrorHandler();

  return useMutation({
    mutationFn: (id: string) => quoteService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["quotes"],
      });
      toast.success("تم حذف العرض السعري بنجاح");
    },
    onError: (error) => {
      handleError(error, "حدث خطأ في حذف العرض السعري");
    },
  });
};

// Print quote
export const usePrintQuote = () => {
  const { handleError } = useApiErrorHandler();

  return useMutation({
    mutationFn: (id: string) => quoteService.print(id),
    onSuccess: () => {
      toast.success("تم تحضير العرض السعري للطباعة");
    },
    onError: (error) => {
      handleError(error, "حدث خطأ في تحضير العرض السعري للطباعة");
    },
  });
};

// Convert quote to sale
export const useConvertQuoteToSale = () => {
  const queryClient = useQueryClient();
  const { handleError } = useApiErrorHandler();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: number }) =>
      quoteService.convertToSale(id, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("تم تحويل العرض السعري إلى فاتورة بنجاح");
    },
    onError: (error) => {
      handleError(error, "حدث خطأ في تحويل العرض السعري");
    },
  });
};

// Email quote to customer
export const useEmailQuote = () => {
  const queryClient = useQueryClient();
  const { handleError } = useApiErrorHandler();

  return useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: number }) =>
      quoteService.email(id, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("تم إرسال العرض السعري بنجاح");
    },
    onError: (error) => {
      handleError(error, "حدث خطأ في إرسال العرض السعري");
    },
  });
};

// Generate Quote PDF
export const useGenerateQuotePdf = () => {
  return useMutation({
    mutationFn: async ({ quote, company }: { quote: Quote; company?: any }) => {
      await generateQuotePdf(quote, company);
      return quote;
    },
    onSuccess: () => {
      toast.success("تم تحميل العرض السعري بنجاح");
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء ملف PDF";
      toast.error(errorMessage);
    },
  });
};
