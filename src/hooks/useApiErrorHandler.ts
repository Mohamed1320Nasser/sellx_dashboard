import { useSessionAuthStore } from "../stores/sessionAuthStore";
import toast from "react-hot-toast";

export const useApiErrorHandler = () => {
  const { logout, isAuthenticated } = useSessionAuthStore();

  const handleError = (
    error: any,
    defaultMessage: string = "حدث خطأ غير متوقع"
  ) => {
    // Handle different types of errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (isAuthenticated) {
        toast.error("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى");
        logout();
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
      return;
    }

    if (error.response?.status === 403) {
      // Forbidden - insufficient permissions
      toast.error("ليس لديك صلاحية للقيام بهذا الإجراء");
      return;
    }

    if (error.response?.status === 404) {
      // Not found
      toast.error("المورد المطلوب غير موجود");
      return;
    }

    if (error.response?.status === 422) {
      // Validation error
      const message = error.response?.data?.msg || "بيانات غير صحيحة";
      toast.error(message);
      return;
    }

    if (error.response?.status >= 500) {
      // Server error
      toast.error("خطأ في الخادم، يرجى المحاولة لاحقاً");
      return;
    }

    if (error.code === "NETWORK_ERROR" || !error.response) {
      // Network error
      toast.error("خطأ في الاتصال، تحقق من اتصال الإنترنت");
      return;
    }

    // Default error message
    const message =
      error.response?.data?.msg || error.message || defaultMessage;
    toast.error(message);
  };

  return { handleError };
};
