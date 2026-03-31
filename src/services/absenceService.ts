import { apiClient } from "./apiClient";
import type {
  Absence,
  CreateAbsenceRequest,
  UpdateAbsenceRequest,
  ApproveAbsenceRequest,
  GetAbsenceListRequest,
  AbsenceStatistics,
  BackendApiResponse,
  PaginatedResponse,
} from "../types";

export const absenceService = {
  // Create a new absence
  create: (data: CreateAbsenceRequest): Promise<Absence> =>
    apiClient.post("/absence/new", data),

  // Get absences list
  getList: (
    params: GetAbsenceListRequest
  ): Promise<BackendApiResponse<PaginatedResponse<Absence>>> =>
    apiClient.get("/absence/list", { params }),

  // Get absence by ID
  getById: (id: string): Promise<Absence> =>
    apiClient.get(`/absence/single/${id}`),

  // Update absence
  update: (id: string, data: UpdateAbsenceRequest): Promise<Absence> =>
    apiClient.put(`/absence/single/${id}`, data),

  // Approve/reject absence
  approve: (id: string, data: ApproveAbsenceRequest): Promise<Absence> =>
    apiClient.put(`/absence/approve/${id}`, data),

  // Delete absence
  delete: (id: string): Promise<{ success: boolean; message: string }> =>
    apiClient.delete(`/absence/single/${id}`),

  // Get absence summary/statistics
  getSummary: (companyId: number): Promise<AbsenceStatistics> =>
    apiClient.get("/absence/summary", { params: { companyId } }),
};
