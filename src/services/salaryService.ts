import { apiClient } from "./apiClient";
import type { Salary, PaginatedResponse } from "../types";

interface CreateSalaryRequest {
  userId: number;
  companyId: number;
  baseSalary: number;
  allowances: number;
  deductions: number;
  totalSalary: number;
  month: number;
  year: number;
  notes?: string;
}

export const salaryService = {
  create: (data: CreateSalaryRequest): Promise<Salary> =>
    apiClient.post("/salary/new", data),

  getList: (params: {
    companyId: number;
    page?: number;
    limit?: number;
    userId?: number;
    month?: number;
    year?: number;
  }): Promise<PaginatedResponse<Salary>> =>
    apiClient.get("/salary/list", { params }),

  edit: (id: number, data: Partial<CreateSalaryRequest>): Promise<Salary> =>
    apiClient.put(`/salary/single/${id}`, data),

  delete: (id: number, companyId: number): Promise<void> =>
    apiClient.delete(`/salary/single/${id}`, { params: { companyId } }),
};
