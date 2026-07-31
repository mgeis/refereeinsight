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
   * Admin-style reset: set a user's password directly, no verification of
   * the old one. For admin tooling / seeding, not the user-facing flow.
   */
  changePassword(userId: number, newPassword: string): Promise<void>;

  /**
   * Self-service change: the caller must supply their current session token
   * and prove they know the current password. Returns false (not an error)
   * if the current password is wrong.
   */
  changeOwnPassword(token: string, oldPassword: string, newPassword: string): Promise<boolean>;

  /**
   * Start a "forgot password" flow — sends a reset code to the email on file
   * for this username. Should not reveal whether the username exists;
   * callers should show the same message either way.
   */
  requestPasswordReset(username: string): Promise<void>;

  /**
   * Complete a "forgot password" flow with the code the user received.
   * Returns false if the code is wrong/expired.
   */
  confirmPasswordReset(username: string, code: string, newPassword: string): Promise<boolean>;

  /**
   * Register a new identity with the auth backend (does not create the
   * local User row — the caller does that, using the returned providerSub).
   * needsConfirmation is true when a verification code was sent and the
   * account can't sign in until confirmSignUp succeeds.
   */
  signUp(input: SignUpInput): Promise<{ providerSub: string | null; needsConfirmation: boolean }>;

  /**
   * Complete registration with the code sent during signUp. Returns false
   * if the code is wrong/expired. No-op (returns true) for providers that
   * don't have a confirmation step.
   */
  confirmSignUp(username: string, code: string): Promise<boolean>;
}

export interface SignUpInput {
  username: string;
  password: string;
  email: string;
  phone?: string | null;
}

export const SESSION_COOKIE = "ri_session";
