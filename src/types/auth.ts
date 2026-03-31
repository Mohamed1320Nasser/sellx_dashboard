// Authentication Types
export interface User {
  id: number;
  fullname: string;
  email: string;
  phone?: string;
  role: "user" | "admin" | "system" | "tester";
  emailIsVerified: boolean;
  banned: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: {
    id: number;
    title: string;
    folder: string;
  };
  companyPermissions?: CompanyPermission[];
}

export interface CompanyPermission {
  companyId: number;
  role: "CASHIER" | "MANAGER" | "ADMIN";
  company: {
    id: number;
    name: string;
    status: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  identifier?: string;
}

// Backend response format after interceptor
export interface LoginResponse {
  msg: string;
  status: number;
  error: boolean;
  success?: boolean; // Optional for compatibility
  data: {
    login: boolean;
    token: string;
    user: {
      id: number;
      fullname: string;
      email: string;
      role: string;
      emailIsVerified: boolean;
      banned: boolean;
      createdAt: string;
      updatedAt: string;
      company?: {
        id: number;
        name: string;
        status: string;
      };
      companyPermissions?: CompanyPermission[]; // Added by frontend
    };
  };
}

export type UserRole = "CASHIER" | "MANAGER" | "ADMIN" | "SYSTEM_ADMIN";

export interface Permission {
  resource: string;
  action: string;
  granted: boolean;
}
