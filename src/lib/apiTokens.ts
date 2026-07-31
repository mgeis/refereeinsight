import { randomBytes, createHash } from "crypto";

const TOKEN_PREFIX = "api_";

export function generateApiToken(): string {
  return TOKEN_PREFIX + randomBytes(32).toString("hex");
}

// Tokens are high-entropy random values, not human passwords, so a fast
// cryptographic hash (not bcrypt) is the right tool here.
export function hashApiToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
