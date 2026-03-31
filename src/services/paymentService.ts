import { apiClient } from "./apiClient";

export enum PaymentMethod {
  CASH = "CASH",
  MOBILE_WALLET = "MOBILE_WALLET",
  BANK_TRANSFER = "BANK_TRANSFER",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface Payment {
  id: string;
  purchaseId?: number;
  saleId?: number;
  companyId: number;
  userId: number;
  amount: number;
  paymentMethod: "CASH" | "MOBILE_WALLET" | "BANK_TRANSFER";
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  reference?: string;
  notes?: string;
  paymentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  purchaseId?: number;
  saleId?: number;
  companyId: number;
  amount: number;
  paymentMethod: "CASH" | "MOBILE_WALLET" | "BANK_TRANSFER";
  paymentStatus?: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  reference?: string;
  notes?: string;
  paymentDate?: string;
}

export interface UpdatePaymentRequest {
  companyId: number;
  amount?: number;
  paymentMethod?: "CASH" | "MOBILE_WALLET" | "BANK_TRANSFER";
  reference?: string;
  notes?: string;
  paymentDate?: string;
}

export interface SupplierPaymentSummary {
  supplierId: number;
  totalPurchases: number;
  totalPaid: number;
  outstanding: number;
  purchases: {
    id: number;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus: string;
  }[];
}

export const paymentService = {
  // Create payment
  create: (data: CreatePaymentRequest): Promise<Payment> =>
    apiClient.post("/payment/create", data),

  // Get payment list
  getList: (params: {
    companyId: number;
    page?: number;
    limit?: number;
    search?: string;
    paymentMethod?: string;
    paymentStatus?: string;
  }): Promise<{
    data: {
      list: Payment[];
      totalCount: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> => apiClient.get("/payment/list", { params }),

  // Get payment by ID
  getById: (paymentId: string, companyId: number): Promise<Payment> =>
    apiClient.get(`/payment/${paymentId}`, { params: { companyId } }),

  // Get payments by purchase
  getByPurchase: (purchaseId: number, companyId: number): Promise<Payment[]> =>
    apiClient.get(`/payment/purchase/${purchaseId}`, { params: { companyId } }),

  // Get payments by sale
  getBySale: (saleId: number, companyId: number): Promise<Payment[]> =>
    apiClient.get(`/payment/sale/${saleId}`, { params: { companyId } }),

  // Update payment
  update: (paymentId: string, data: UpdatePaymentRequest): Promise<Payment> =>
    apiClient.put(`/payment/${paymentId}`, data),

  // Delete payment
  delete: (
    paymentId: string,
    companyId: number
  ): Promise<{ success: boolean }> =>
    apiClient.delete(`/payment/${paymentId}`, { params: { companyId } }),

  // Get supplier payment summary
  getSupplierSummary: (
    supplierId: number,
    companyId: number
  ): Promise<SupplierPaymentSummary> =>
    apiClient.get(`/payment/supplier/${supplierId}/summary`, {
      params: { companyId },
    }),
};
