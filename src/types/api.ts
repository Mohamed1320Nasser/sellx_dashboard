// API Response Types
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// Common pagination interface
export interface PaginatedResponse<T> {
  list: T[];
  totalCount: number;
  filterCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Backend API response wrapper
export interface BackendApiResponse<T> {
  data: T;
  error: boolean;
  msg: string;
  status: number;
}

// Common list parameters
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}
