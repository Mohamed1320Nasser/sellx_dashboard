import { apiClient } from "./apiClient";
import type { PaginatedResponse, BackendApiResponse } from "../types";

export interface Shift {
  id: string;
  registerId: string;
  userId: number;
  companyId: number;
  openingBalance: number;
  closingBalance: number | null;
  expectedCash: number | null;
  actualCash: number | null;
  variance: number | null;
  status: "OPEN" | "CLOSED";
  startTime: string;
  endTime: string | null;
  notes: string | null;
  closingNotes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  register: {
    id: string;
    name: string;
    location: string | null;
    description: string | null;
  };
  user: {
    id: number;
    fullname: string;
    email: string;
  };
  sales?: any[];
  cashMovements?: CashMovement[];
}

export interface CashMovement {
  id: string;
  shiftId: string;
  companyId: number;
  amount: number;
  type:
    | "CASH_IN"
    | "CASH_OUT"
    | "PAYOUT"
    | "BANK_DEPOSIT"
    | "PETTY_CASH"
    | "CASH_CORRECTION";
  reason: string;
  reference: string | null;
  performedBy: number;
  notes: string | null;
  createdAt: string;
  user?: {
    id: number;
    fullname: string;
  };
}

export interface ShiftSummary {
  openingBalance: number;
  totalSales: number;
  totalSalesAmount: number;
  cashSales: number;
  salesByPaymentMethod: {
    [key: string]: {
      count: number;
      total: number;
    };
  };
  cashMovements: {
    count: number;
    cashIn: number;
    cashOut: number;
    net: number;
  };
  expectedCash: number;
  actualCash: number | null;
  variance: number | null;
  duration: string;
}

interface CreateShiftRequest {
  companyId: number;
  registerId: string;
  openingBalance: number;
  notes?: string;
}

interface CloseShiftRequest {
  companyId: number;
  actualCash: number;
  closingNotes?: string;
}

interface CreateCashMovementRequest {
  companyId: number;
  shiftId: string;
  amount: number;
  type:
    | "CASH_IN"
    | "CASH_OUT"
    | "PAYOUT"
    | "BANK_DEPOSIT"
    | "PETTY_CASH"
    | "CASH_CORRECTION";
  reason: string;
  reference?: string;
  notes?: string;
}

interface ShiftFilters {
  companyId: number;
  page?: number;
  limit?: number;
  status?: "OPEN" | "CLOSED";
  registerId?: string;
  userId?: number;
  startDate?: string;
  endDate?: string;
}

export const shiftService = {
  create: (data: CreateShiftRequest): Promise<{ message: string; shift: Shift }> =>
    apiClient.post("/shift/new", data),

  close: (
    id: string,
    data: CloseShiftRequest
  ): Promise<{
    message: string;
    shift: Shift;
    summary: ShiftSummary;
  }> => apiClient.put(`/shift/close/${id}`, data),

  createCashMovement: (
    data: CreateCashMovementRequest
  ): Promise<{ message: string; cashMovement: CashMovement }> =>
    apiClient.post("/shift/cash-movement", data),

  getList: (
    params: ShiftFilters
  ): Promise<
    BackendApiResponse<{ shifts: Shift[]; pagination: PaginatedResponse<any> }>
  > => apiClient.get("/shift/list", { params }),

  getById: (
    id: string,
    companyId: number
  ): Promise<{ shift: Shift; summary: ShiftSummary }> =>
    apiClient.get(`/shift/single/${id}`, { params: { companyId } }),

  getCurrent: (
    companyId: number
  ): Promise<{
    hasOpenShift: boolean;
    shift: Shift | null;
    summary: ShiftSummary | null;
  }> => apiClient.get("/shift/current", { params: { companyId } }),
};
