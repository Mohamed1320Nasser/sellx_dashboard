// Token utility functions for better authentication handling

/**
 * Check if token is expired based on JWT payload
 * @param token - JWT token string
 * @returns boolean indicating if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true; // If we can't parse the token, consider it expired
  }
};

/**
 * Get token expiration time
 * @param token - JWT token string
 * @returns Date object of expiration time or null if invalid
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
};

/**
 * Check if token will expire soon (within 5 minutes)
 * @param token - JWT token string
 * @returns boolean indicating if token expires soon
 */
export const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    const fiveMinutes = 5 * 60; // 5 minutes in seconds
    return payload.exp - currentTime < fiveMinutes;
  } catch {
    return true; // If we can't parse the token, consider it expiring soon
  }
};

/**
 * Validate token format and basic structure
 * @param token - JWT token string
 * @returns boolean indicating if token has valid format
 */
export const isValidTokenFormat = (token: string): boolean => {
  if (!token || typeof token !== "string") {
    return false;
  }

  const parts = token.split(".");
  return parts.length === 3;
};

/**
 * Get token payload data
 * @param token - JWT token string
 * @returns token payload object or null if invalid
 */
export const getTokenPayload = (token: string): any | null => {
  try {
    if (!isValidTokenFormat(token)) {
      return null;
    }
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

/**
 * Get time until token expires in seconds
 * @param token - JWT token string
 * @returns number of seconds until expiration, or 0 if expired/invalid
 */
export const getTimeUntilExpiration = (token: string): number => {
  try {
    const payload = getTokenPayload(token);
    if (!payload || !payload.exp) {
      return 0;
    }

    const currentTime = Date.now() / 1000;
    const timeUntilExpiration = payload.exp - currentTime;
    return Math.max(0, timeUntilExpiration);
  } catch {
    return 0;
  }
};

/**
 * Format time until expiration as human readable string
 * @param token - JWT token string
 * @returns formatted string like "5 minutes" or "expired"
 */
export const getTimeUntilExpirationFormatted = (token: string): string => {
  const seconds = getTimeUntilExpiration(token);

  if (seconds === 0) {
    return "منتهي الصلاحية";
  }

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} يوم`;
  } else if (hours > 0) {
    return `${hours} ساعة`;
  } else if (minutes > 0) {
    return `${minutes} دقيقة`;
  } else {
    return `${Math.floor(seconds)} ثانية`;
  }
};

/**
 * Check if token needs refresh (expires within 10 minutes)
 * @param token - JWT token string
 * @returns boolean indicating if token needs refresh
 */
export const shouldRefreshToken = (token: string): boolean => {
  try {
    const payload = getTokenPayload(token);
    if (!payload || !payload.exp) {
      return true;
    }

    const currentTime = Date.now() / 1000;
    const tenMinutes = 10 * 60; // 10 minutes in seconds
    return payload.exp - currentTime < tenMinutes;
  } catch {
    return true;
  }
};

/**
 * Extract user ID from token payload
 * @param token - JWT token string
 * @returns user ID or null if not found
 */
export const getUserIdFromToken = (token: string): number | null => {
  try {
    const payload = getTokenPayload(token);
    return payload?.userId || payload?.id || null;
  } catch {
    return null;
  }
};

/**
 * Extract user role from token payload
 * @param token - JWT token string
 * @returns user role or null if not found
 */
export const getUserRoleFromToken = (token: string): string | null => {
  try {
    const payload = getTokenPayload(token);
    return payload?.role || null;
  } catch {
    return null;
  }
};
