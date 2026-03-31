import { apiClient } from "./apiClient";
import type { User, PaginatedResponse } from "../types";

interface CreateUserRequest {
  fullname: string;
  email: string;
  password: string;
  phone?: string;
  role?: "user" | "admin";
}

export const userService = {
  // Create system user (System Admin only)
  create: (data: CreateUserRequest, profileFile?: File): Promise<User> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    if (profileFile) {
      formData.append("profile", profileFile);
    }
    return apiClient.post("/user/create", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // List all system users (Admin only)
  getList: (params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<User>> => apiClient.post("/user/list", params), // Changed to POST with body
};
