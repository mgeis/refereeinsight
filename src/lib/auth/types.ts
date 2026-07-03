/**
 * Every auth backend implements this interface. Routes never import a
 * specific provider — they import `authProvider` from `./index.ts`.
 */
export interface AuthProvider {
  /**
   * Verify credentials. Returns an opaque session token to store in the
   * cookie on success, or null if authentication fails.
   */
  authenticate(username: string, password: string): Promise<string | null>;

  /**
   * Resolve a session token from the cookie to a local database user ID.
   * Returns null if the token is missing, invalid, or expired.
   */
  resolveSession(token: string): Promise<number | null>;

  /**
   * Invalidate a session (logout). Should be a no-op if the token is
   * already gone.
   */
  invalidate(token: string): Promise<void>;

  /**
   * Hash and persist a new password for the given local user ID.
   */
  changePassword(userId: number, newPassword: string): Promise<void>;
}

export const SESSION_COOKIE = "ri_session";
