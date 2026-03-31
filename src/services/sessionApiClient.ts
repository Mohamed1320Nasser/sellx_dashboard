import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { sessionAuthService } from "./sessionAuthService";

// Session-based API Client (inspired by eduloom's axiosClon)
class SessionApiClient {
  private instance: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || "https://api.sellpoint.morita.vip";

    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add token (like eduloom's Authorization header)
    this.instance.interceptors.request.use(
      (config) => {
        const token = sessionAuthService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        config.headers["Accept-Language"] = "*";
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle 403 (like eduloom's ForberidenAlert)
    this.instance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 403) {
          // Handle session expired (like eduloom's ForberidenAlert)
          this.handleSessionExpired();
        }
        return Promise.reject(error);
      }
    );
  }

  private handleSessionExpired() {
    // Show session expired alert (like eduloom)
    alert("Your session has expired. Please login again.");

    // Clear session and redirect
    sessionAuthService.clearSession();
    window.location.href = "/login";
  }

  // GET request (like eduloom's getData)
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.get(url, config);
    return response.data;
  }

  // POST request (like eduloom's postData)
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.post(
      url,
      data,
      config
    );
    return response.data;
  }

  // PUT request (like eduloom's putData)
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.put(
      url,
      data,
      config
    );
    return response.data;
  }

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.instance.delete(url, config);
    return response.data;
  }

  // Public POST request (like eduloom's postPuplicData)
  async postPublic<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await axios.post(
      `${this.baseURL}${url}`,
      data,
      {
        ...config,
        headers: {
          "Content-Type": "application/json",
          ...config?.headers,
        },
      }
    );
    return response.data;
  }

  // Public GET request (like eduloom's getPuplicData)
  async getPublic<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await axios.get(
      `${this.baseURL}${url}`,
      {
        ...config,
        headers: {
          "Accept-Language": "*",
          ...config?.headers,
        },
      }
    );
    return response.data;
  }
}

// Export singleton instance
export const sessionApiClient = new SessionApiClient();
export default sessionApiClient;
