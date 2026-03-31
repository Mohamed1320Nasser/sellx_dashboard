import { AxiosError } from "axios";
import toast from "react-hot-toast";

/**
 * Handle API errors and return user-friendly messages
 * @param error - The error object from API calls
 * @returns User-friendly error message
 */
export const handleApiError = (error: any): string => {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    const { response } = error;

    if (response) {
      const { status, data } = response;

      // Handle specific HTTP status codes
      switch (status) {
        case 400:
          return data?.msg || data?.message || "بيانات غير صحيحة";
        case 401:
          return "غير مصرح لك بالوصول";
        case 403:
          return "ليس لديك صلاحية للوصول إلى هذا المورد";
        case 404:
          return "المورد المطلوب غير موجود";
        case 409:
          return "هذا المورد موجود بالفعل";
        case 422:
          return data?.msg || data?.message || "بيانات غير صحيحة";
        case 429:
          return "تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً";
        case 500:
          return "حدث خطأ في الخادم، يرجى المحاولة مرة أخرى";
        case 502:
          return "خطأ في الاتصال بالخادم";
        case 503:
          return "الخدمة غير متاحة حالياً";
        default:
          return data?.msg || data?.message || "حدث خطأ غير متوقع";
      }
    }

    // Handle network errors
    if (error.code === "NETWORK_ERROR" || error.message === "Network Error") {
      return "خطأ في الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت";
    }

    // Handle timeout errors
    if (error.code === "ECONNABORTED") {
      return "انتهت مهلة الاتصال، يرجى المحاولة مرة أخرى";
    }
  }

  // Handle generic errors
  if (error?.message) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Default error message
  return "حدث خطأ غير متوقع";
};

/**
 * Show error toast with consistent styling
 * @param error - The error object or message
 * @param options - Toast options
 */
export const showErrorToast = (error: any, options?: any) => {
  const message = handleApiError(error);
  toast.error(message, {
    duration: 5000,
    position: "top-center",
    ...options,
  });
};

/**
 * Show success toast with consistent styling
 * @param message - Success message
 * @param options - Toast options
 */
export const showSuccessToast = (message: string, options?: any) => {
  toast.success(message, {
    duration: 3000,
    position: "top-center",
    ...options,
  });
};

/**
 * Show info toast with consistent styling
 * @param message - Info message
 * @param options - Toast options
 */
export const showInfoToast = (message: string, options?: any) => {
  toast(message, {
    duration: 4000,
    position: "top-center",
    icon: "ℹ️",
    ...options,
  });
};

/**
 * Handle form validation errors
 * @param errors - Form validation errors
 * @returns Object with field-specific error messages
 */
export const handleFormErrors = (errors: any) => {
  const fieldErrors: Record<string, string> = {};

  if (errors?.response?.data?.errors) {
    const validationErrors = errors.response.data.errors;

    Object.keys(validationErrors).forEach((field) => {
      const fieldError = validationErrors[field];
      if (Array.isArray(fieldError)) {
        fieldErrors[field] = fieldError[0];
      } else {
        fieldErrors[field] = fieldError;
      }
    });
  }

  return fieldErrors;
};

/**
 * Check if error is a validation error
 * @param error - The error object
 * @returns boolean indicating if it's a validation error
 */
export const isValidationError = (error: any): boolean => {
  return error?.response?.status === 422 || error?.response?.status === 400;
};

/**
 * Check if error is an authentication error
 * @param error - The error object
 * @returns boolean indicating if it's an auth error
 */
export const isAuthError = (error: any): boolean => {
  return error?.response?.status === 401 || error?.response?.status === 403;
};

/**
 * Check if error is a network error
 * @param error - The error object
 * @returns boolean indicating if it's a network error
 */
export const isNetworkError = (error: any): boolean => {
  return !error?.response && error?.request;
};

/**
 * Log error for debugging (only in development)
 * @param error - The error object
 * @param context - Additional context information
 */
export const logError = (error: any, context?: string) => {
  if (import.meta.env.DEV) {
    console.group(`🚨 Error${context ? ` - ${context}` : ""}`);
    console.error("Error object:", error);
    console.error("Error message:", error?.message);
    console.error("Error response:", error?.response);
    console.error("Error stack:", error?.stack);
    console.groupEnd();
  }
};
