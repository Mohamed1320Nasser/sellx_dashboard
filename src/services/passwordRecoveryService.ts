import { apiClient } from "./apiClient";

export interface RequestOTPRequest {
  email: string;
  type: "PASSWORD_RESET";
}

export interface RequestOTPResponse {
  id: string;
  message: string;
}

export interface VerifyOTPRequest {
  requestId: string;
  otp: string;
}

export interface VerifyOTPResponse {
  right: boolean;
  expired: boolean;
}

export interface ResetPasswordRequest {
  email: string;
  requestId: string;
  new: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export const passwordRecoveryService = {
  // Request OTP for password recovery
  requestOTP: async (data: RequestOTPRequest): Promise<RequestOTPResponse> => {
    const response = await apiClient.post("/auth/otp/request", data);
    return response.data;
  },

  // Verify OTP code
  verifyOTP: async (data: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
    const response = await apiClient.post("/auth/otp/verify", data);
    return response.data;
  },

  // Reset password with new password
  resetPassword: async (
    data: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> => {
    const response = await apiClient.post("/auth/recover", data);
    return response.data;
  },

  // Resend OTP
  resendOTP: async (requestId: string): Promise<RequestOTPResponse> => {
    const response = await apiClient.post("/auth/otp/resend", { requestId });
    return response.data;
  },
};
