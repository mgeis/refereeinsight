import { localAuthProvider }   from "./local";
import { cognitoAuthProvider } from "./cognito";
import type { AuthProvider }   from "./types";

const provider = process.env.AUTH_PROVIDER ?? "local";

if (provider !== "local" && provider !== "cognito") {
  throw new Error(`Unknown AUTH_PROVIDER: "${provider}". Valid values: "local", "cognito".`);
}

export const authProvider: AuthProvider =
  provider === "cognito" ? cognitoAuthProvider : localAuthProvider;

export { SESSION_COOKIE } from "./types";
