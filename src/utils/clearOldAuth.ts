// Utility to clear old localStorage-based authentication
// This ensures a clean transition to session-based authentication
// NOTE: Only clears OLD keys, preserves new session-based auth keys

export const clearOldAuth = () => {
  // Only clear OLD auth keys that are no longer used
  // DO NOT clear: token, user, isAuthed, company, rememberMe (new session-based keys)
  localStorage.removeItem("access_token");  // Old key
  localStorage.removeItem("refresh_token"); // Old key
  localStorage.removeItem("isAuthenticated"); // Old key (new one is "isAuthed")
};

// Auto-clear old keys on import
if (typeof window !== "undefined") {
  clearOldAuth();
}
