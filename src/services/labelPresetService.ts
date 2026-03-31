import { apiClient } from "./apiClient";
import type {
  LabelPreset,
  CreateLabelPresetRequest,
  UpdateLabelPresetRequest,
  GetLabelPresetsRequest,
  PaginatedResponse,
  BackendApiResponse,
} from "../types";

// Helper to extract data from backend API response wrapper
// Backend wraps all responses in { status, msg, error, data }
const extractData = <T>(response: any): T => {
  // If response has a data property and it's a backend wrapper, extract the inner data
  if (response && typeof response === 'object' && 'data' in response && 'error' in response) {
    return response.data as T;
  }
  // Otherwise return as-is (already extracted or different format)
  return response as T;
};

export const labelPresetService = {
  // Create label preset
  create: async (data: CreateLabelPresetRequest): Promise<LabelPreset> => {
    const response = await apiClient.post("/label-preset/new", data);
    return extractData<LabelPreset>(response);
  },

  // List label presets
  getList: async (
    params: GetLabelPresetsRequest
  ): Promise<PaginatedResponse<LabelPreset>> => {
    const response = await apiClient.post("/label-preset/list", params);
    return extractData<PaginatedResponse<LabelPreset>>(response);
  },

  // Get active label presets (for dropdowns)
  getActive: async (companyId: number): Promise<LabelPreset[]> => {
    const response = await apiClient.get(`/label-preset/active/${companyId}`);
    return extractData<LabelPreset[]>(response) || [];
  },

  // Get default label preset
  getDefault: async (companyId: number): Promise<LabelPreset | null> => {
    const response = await apiClient.get(`/label-preset/default/${companyId}`);
    return extractData<LabelPreset | null>(response);
  },

  // Get single label preset
  getById: async (id: string, companyId: number): Promise<LabelPreset> => {
    const response = await apiClient.get(`/label-preset/single/${id}`, {
      params: { companyId },
    });
    return extractData<LabelPreset>(response);
  },

  // Update label preset
  update: async (id: string, data: UpdateLabelPresetRequest): Promise<LabelPreset> => {
    const response = await apiClient.put(`/label-preset/single/${id}`, data);
    return extractData<LabelPreset>(response);
  },

  // Delete label preset
  delete: async (
    id: string,
    companyId: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/label-preset/single/${id}`, {
      params: { companyId },
    });
    return extractData<{ success: boolean; message: string }>(response);
  },

  // Toggle label preset active status
  toggle: async (
    id: string,
    companyId: number
  ): Promise<LabelPreset> => {
    const response = await apiClient.put(`/label-preset/toggle/${id}`, { companyId });
    return extractData<LabelPreset>(response);
  },

  // Set label preset as default
  setDefault: async (
    id: string,
    companyId: number
  ): Promise<LabelPreset> => {
    const response = await apiClient.put(`/label-preset/default/${id}`, { companyId });
    return extractData<LabelPreset>(response);
  },
};
