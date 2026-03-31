import axios from "axios";
import { API_CONFIG, getCurrentApiConfig } from "../config/api";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import toast from "react-hot-toast";

// Axios instance with interceptors
export const apiClient = axios.create(API_CONFIG);

// Update the baseURL dynamically
const updateApiClientBaseURL = () => {
  const currentConfig = getCurrentApiConfig();
  apiClient.defaults.baseURL = currentConfig.baseURL;
  apiClient.defaults.timeout = currentConfig.timeout;
  console.log("[API CLIENT] Updated baseURL to:", currentConfig.baseURL);
};

// Initialize with dynamic config
updateApiClientBaseURL();

// Export function to refresh API client configuration
export const refreshApiClientConfig = () => {
  updateApiClientBaseURL();
};

// Request interceptor for authentication with token validation
apiClient.interceptors.request.use(
  (config) => {
    console.log(
      "[API CLIENT] Request:",
      config.method?.toUpperCase(),
      config.url
    );
    // Check both storages - localStorage first (remember me), then sessionStorage
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      // Basic token format validation
      try {
        // Check if token is a valid JWT format (3 parts separated by dots)
        const tokenParts = token.split(".");
        if (tokenParts.length !== 3) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          const authStore = useSessionAuthStore.getState();
          if (authStore.isAuthenticated) {
            authStore.logout();
          }
          return config; // Continue without token
        }

        // Check if token is expired (basic check)
        const payload = JSON.parse(atob(tokenParts[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        if (payload.exp && payload.exp < currentTime) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          const authStore = useSessionAuthStore.getState();
          if (authStore.isAuthenticated) {
            authStore.logout();
          }
          return config; // Continue without token
        }

        config.headers.Authorization = `Bearer ${token}`;
      } catch {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        const authStore = useSessionAuthStore.getState();
        if (authStore.isAuthenticated) {
          authStore.logout();
        }
      }
    }
    return config;
  },
  (error) => {
    console.error("[API CLIENT] Request error:", error);
    return Promise.reject(error);
  }
);

// Helper functions for error handling
const clearAuthAndRedirect = (message: string) => {
  const authStore = useSessionAuthStore.getState();

  if (authStore.isAuthenticated) {
    authStore.logout();
    sessionStorage.clear();

    toast.error(message, { duration: 5000 });
    window.dispatchEvent(new CustomEvent("auth-error"));

    setTimeout(() => {
      window.location.href = "/login";
    }, 500);
  }
};

const getErrorMessage = (status: number): string => {
  switch (status) {
    case 403:
      return "ليس لديك صلاحية للوصول إلى هذا المورد";
    case 419:
    case 401:
      return "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى";
    case 500:
      return "حدث خطأ في الخادم، يرجى المحاولة مرة أخرى";
    default:
      return "حدث خطأ غير متوقع";
  }
};

const isUserNotFoundError = (message: string): boolean => {
  return (
    message &&
    (message.includes("المستخدم غير موجود") ||
      message.includes("user not found"))
  );
};

// Response interceptor for error handling
// NOTE: Toast notifications are handled by useApiErrorHandler in individual hooks
// to prevent duplicate error messages
apiClient.interceptors.response.use(
  (response) => {
    console.log("[API CLIENT] Response:", response.status, response.config.url);
    // Check if response has error flag
    if (response.data.error === true || response.data.error === "true") {
      // This is an error response, let it go to the error handler
      return Promise.reject({
        response: {
          status: response.data.status,
          data: {
            msg: response.data.msg,
            message: response.data.msg,
          },
        },
      });
    }
    // Success response - return the full response data
    return response.data;
  },
  (error) => {
    const { response } = error;
    const status = response?.status;
    const message = response?.data?.msg || response?.data?.message;

    // Critical authentication errors - only handle auth redirect here
    // Toast notifications are shown by useApiErrorHandler
    if ([401, 419].includes(status)) {
      clearAuthAndRedirect(getErrorMessage(status));
    }
    // User not found error
    else if (status === 400 && isUserNotFoundError(message)) {
      clearAuthAndRedirect("المستخدم غير موجود، يرجى تسجيل الدخول مرة أخرى");
    }
    // For all other errors, just log and reject - let useApiErrorHandler show toast

    const errorDetails = {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    };
    console.error("[API CLIENT] Response error:", JSON.stringify(errorDetails, null, 2));
    return Promise.reject(error);
  }
);

// Helper function to make authenticated requests
export const makeAuthenticatedRequest = async (
  method: "get" | "post" | "put" | "patch" | "delete",
  url: string,
  data?: any,
  config?: any
) => {
  const response = await apiClient[method](url, data, config);
  return response;
};

// Helper function to upload files with progress
export const uploadFile = async (
  url: string,
  file: File,
  onProgress?: (progress: number) => void
) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(progress);
      }
    },
  });
  return response;
};

export default apiClient;
