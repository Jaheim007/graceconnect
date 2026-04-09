/**
 * useNewUserRedirect — previously redirected to /welcome on login.
 * Now a no-op: the ActionHub (/) adapts based on auth state directly.
 */
export function useNewUserRedirect() {
  // No-op — kept for compatibility with AppLayout import
}
