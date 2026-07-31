import { randomBytes, createHash } from "crypto";

const CODE_PREFIX = "inv_";

export function generateInviteCode(): string {
  return CODE_PREFIX + randomBytes(8).toString("hex");
}

// Codes are high-entropy random values, not human passwords, so a fast
// cryptographic hash (not bcrypt) is the right tool here.
export function hashInviteCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}
