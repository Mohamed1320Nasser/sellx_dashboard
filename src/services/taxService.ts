import { apiClient } from "./apiClient";
import type {
  TaxSetting,
  CreateTaxSettingRequest,
  UpdateTaxSettingRequest,
  GetTaxSettingsRequest,
  PaginatedResponse,
  BackendApiResponse,
} from "../types";

export const taxService = {
  // Create tax setting
  create: (data: CreateTaxSettingRequest): Promise<TaxSetting> =>
    apiClient.post("/tax/new", data),

  // List tax settings
  getList: (
    params: GetTaxSettingsRequest
  ): Promise<BackendApiResponse<PaginatedResponse<TaxSetting>>> =>
    apiClient.post("/tax/list", params),

  // Get active tax settings (for dropdowns)
  getActive: (companyId: number): Promise<TaxSetting[]> =>
    apiClient.get(`/tax/active/${companyId}`),

  // Get default tax setting
  getDefault: (companyId: number): Promise<TaxSetting | null> =>
    apiClient.get(`/tax/default/${companyId}`),

  // Get single tax setting
  getById: (id: string, companyId: number): Promise<TaxSetting> =>
    apiClient.get(`/tax/single/${id}`, {
      params: { companyId },
    }),

  // Update tax setting
  update: (id: string, data: UpdateTaxSettingRequest): Promise<TaxSetting> =>
    apiClient.put(`/tax/single/${id}`, data),

  // Delete tax setting
  delete: (
    id: string,
    companyId: number
  ): Promise<{ success: boolean; message: string }> =>
    apiClient.delete(`/tax/single/${id}`, {
      params: { companyId },
    }),

  // Toggle tax setting active status
  toggle: (
    id: string,
    companyId: number
  ): Promise<TaxSetting> =>
    apiClient.put(`/tax/toggle/${id}`, { companyId }),

  // Set tax setting as default
  setDefault: (
    id: string,
    companyId: number
  ): Promise<TaxSetting> =>
    apiClient.put(`/tax/default/${id}`, { companyId }),
};
