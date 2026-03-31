// Application constants
export const APP_NAME = "SellX";
export const APP_VERSION = "1.0.0";

// API related constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    ADMIN_LOGIN: "/auth/admin/login",
    LOGOUT: "/auth/logout",
    RECOVER: "/auth/recover",
    CHANGE_PASSWORD: "/auth/change/password",
    CHECK_EMAIL: "/auth/check",
  },
  USERS: {
    CREATE: "/user/create",
    LIST: "/user/list",
  },
  COMPANIES: {
    LIST: "/company/list",
    APPROVE: "/company/approve",
  },
  // Add more endpoints as needed
} as const;

// Role hierarchy for permission checking
export const ROLE_HIERARCHY = {
  CASHIER: 1,
  MANAGER: 2,
  ADMIN: 3,
  SYSTEM_ADMIN: 4,
} as const;

// Role display names in Arabic
export const ROLE_DISPLAY_NAMES = {
  CASHIER: "كاشير",
  MANAGER: "مدير",
  ADMIN: "مدير شركة",
  SYSTEM_ADMIN: "مدير النظام",
} as const;

// Default pagination settings
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;
