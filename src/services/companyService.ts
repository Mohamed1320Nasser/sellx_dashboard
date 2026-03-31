import { apiClient } from "./apiClient";

export interface CompanyRegisterRequest {
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  companyAddress?: string;
  taxNumber?: string;
  ownerFullname: string;
  ownerEmail: string;
  ownerPhone?: string;
  password: string;
}

export interface Company {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  description?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  status: string;
  logoId?: number;
  logo?: {
    id: number;
    title: string;
    folder: string;
    format: string;
  };
  logoUrl?: string; // Full CDN URL from backend
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanyData {
  companyId: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
}

export const companyService = {
  // Register new company with optional logo
  register: (data: CompanyRegisterRequest, logoFile?: File): Promise<{ message: string }> => {
    // If logo provided, use FormData
    if (logoFile) {
      const formData = new FormData();

      // Append all data fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Append logo file
      formData.append("logo", logoFile);

      return apiClient.post("/company/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }

    // Otherwise use JSON
    return apiClient.post("/company/register", data);
  },

  // Get company details (for admin use)
  getById: (id: number): Promise<Company> => apiClient.get(`/company/${id}`),

  // Get all companies (for admin use)
  getAll: (): Promise<Company[]> => apiClient.get("/company/all"),

  // Approve company (for admin use)
  approve: (id: number): Promise<{ message: string }> =>
    apiClient.put(`/company/${id}/approve`),

  // Reject company (for admin use)
  reject: (id: number, reason?: string): Promise<{ message: string }> =>
    apiClient.put(`/company/${id}/reject`, { reason }),

  // Get company profile (for users in the company)
  getProfile: async (companyId: number): Promise<CompanyProfile> => {
    const response = await apiClient.get(`/company/profile/${companyId}`);
    // apiClient returns {msg, status, data, error}, extract the nested data
    return (response as any).data || response;
  },

  // Update company profile with optional logo
  updateProfile: async (
    data: UpdateCompanyData,
    logoFile?: File
  ): Promise<{ success: boolean; message: string; company: CompanyProfile }> => {
    const formData = new FormData();

    // Append all data fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    // Append logo file if provided
    if (logoFile) {
      formData.append("logo", logoFile);
    }

    const response = await apiClient.put("/company/profile/update", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // apiClient returns {msg, status, data, error}, extract the nested data
    return (response as any).data || response;
  },
};
