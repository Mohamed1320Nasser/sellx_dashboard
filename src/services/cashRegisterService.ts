import { apiClient } from "./apiClient";

export interface CashRegister {
  id: string;
  companyId: number;
  name: string;
  location: string | null;
  description: string | null;
  serialNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  shifts?: {
    id: string;
    status: string;
    user: {
      id: number;
      fullname: string;
    };
  }[];
}

interface CreateCashRegisterRequest {
  companyId: number;
  name: string;
  location?: string;
  description?: string;
  serialNumber?: string;
}

interface EditCashRegisterRequest {
  companyId: number;
  name?: string;
  location?: string;
  description?: string;
  serialNumber?: string;
  isActive?: boolean;
}

export const cashRegisterService = {
  create: (
    data: CreateCashRegisterRequest
  ): Promise<{ message: string; cashRegister: CashRegister }> =>
    apiClient.post("/cash-register/new", data),

  getList: (
    companyId: number
  ): Promise<{ cashRegisters: CashRegister[] }> =>
    apiClient.get("/cash-register/list", { params: { companyId } }),

  getById: (
    id: string,
    companyId: number
  ): Promise<{ cashRegister: CashRegister }> =>
    apiClient.get(`/cash-register/single/${id}`, { params: { companyId } }),

  edit: (
    id: string,
    data: EditCashRegisterRequest
  ): Promise<{ message: string; cashRegister: CashRegister }> =>
    apiClient.put(`/cash-register/single/${id}`, data),

  delete: (
    id: string,
    companyId: number
  ): Promise<{ message: string }> =>
    apiClient.delete(`/cash-register/single/${id}`, {
      params: { companyId },
    }),
};
