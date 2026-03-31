// Authentication module exports
// This file provides a centralized way to import all authentication-related functionality

// Stores
export { useSessionAuthStore } from "../stores/sessionAuthStore";

// Services
export { sessionAuthService } from "../services/sessionAuthService";

// Hooks
export { useAuth } from "../hooks/useAuth";

// Context
export { AuthProvider, useAuthContext } from "../contexts/AuthContext";

// Components
export { default as ProtectedRoute } from "../components/ProtectedRoute";
export { default as RouteGuard } from "../components/RouteGuard";

// Utils
export * from "../utils/authUtils";
export * from "../utils/permissions";
export * from "../utils/errorHandler";

// Middleware
export { authMiddleware } from "../middleware/authMiddleware";

// Types
export type * from "../types/auth";

// Constants
export { ROLE_HIERARCHY, ROLE_DISPLAY_NAMES } from "../constants/app";
