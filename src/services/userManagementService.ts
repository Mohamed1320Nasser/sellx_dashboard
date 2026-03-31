import { apiClient } from "./apiClient";
import type { PaginatedResponse, BackendApiResponse } from "../types";

interface CreateCompanyUserRequest {
  fullname: string;
  email: string;
  password: string;
  phone?: string;
  role: "CASHIER" | "MANAGER" | "ADMIN";
  companyId: number;
}

interface InviteUserRequest {
  email: string;
  role: "CASHIER" | "MANAGER" | "ADMIN";
  companyId: number;
}

interface CompanyUser {
  id: number;
  fullname: string;
  email: string;
  phone?: string;
  role: string;
  companyPermissions: Array<{
    id: number;
    role: "CASHIER" | "MANAGER" | "ADMIN";
    isActive: boolean;
    createdAt: string;
  }>;
}

export const userManagementService = {
  // Create new company user
  createCompanyUser: (data: CreateCompanyUserRequest): Promise<CompanyUser> =>
    apiClient.post("/user-management/new", data),

  // Invite existing user to company
  inviteUser: (data: InviteUserRequest): Promise<void> =>
    apiClient.post("/user-management/invite", data),

  // List company users
  getCompanyUsers: (params: {
    companyId: number;
    page?: number;
    limit?: number;
    search?: string;
    role?: "CASHIER" | "MANAGER" | "ADMIN";
  }): Promise<BackendApiResponse<PaginatedResponse<CompanyUser>>> => {
    // Filter out empty role parameter to avoid validation errors
    const cleanParams: any = { ...params };
    if (!cleanParams.role) {
      delete cleanParams.role;
    }
    if (!cleanParams.search) {
      delete cleanParams.search;
    }
    return apiClient.get("/user-management/list", { params: cleanParams });
  },

  // Get single company user
  getCompanyUser: (userId: number, companyId: number): Promise<CompanyUser> =>
    apiClient.get(`/user-management/single/${userId}`, {
      params: { companyId },
    }),

  // Edit company user
  editCompanyUser: (
    userId: number,
    data: Partial<CreateCompanyUserRequest>
  ): Promise<CompanyUser> =>
    apiClient.put(`/user-management/single/${userId}`, data),

  // Change user role
  changeUserRole: (
    userId: number,
    data: {
      newRole: "CASHIER" | "MANAGER" | "ADMIN";
      companyId: number;
    }
  ): Promise<void> =>
    apiClient.put(`/user-management/change-role/${userId}`, data),

  // Activate user
  activateUser: (userId: number, companyId: number): Promise<void> =>
    apiClient.put(
      `/user-management/activate/${userId}`,
      {},
      { params: { companyId } }
    ),

  // Deactivate user
  deactivateUser: (userId: number, companyId: number): Promise<void> =>
    apiClient.put(
      `/user-management/deactivate/${userId}`,
      {},
      { params: { companyId } }
    ),

  // Remove user from company
  removeUser: (userId: number, companyId: number): Promise<void> =>
    apiClient.delete(`/user-management/remove/${userId}`, {
      params: { companyId },
    }),

  // Get available roles
  getAvailableRoles: (companyId: number): Promise<string[]> =>
    apiClient.get("/user-management/available-roles", {
      params: { companyId },
    }),
};
