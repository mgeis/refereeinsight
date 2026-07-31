/**
 * AWS Cognito authentication provider.
 *
 * Requires:
 *   COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, COGNITO_REGION
 *
 * `authenticate` signs in via Cognito's USER_PASSWORD_AUTH flow and returns
 * the resulting access token (JWT) to store in the session cookie.
 * `resolveSession` verifies that JWT against Cognito's JWKS (signature +
 * expiry + audience, no DB round trip needed for that part) and maps its
 * `sub` claim to a local User via the `cognitoSub` column.
 */

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  GlobalSignOutCommand,
  AdminSetUserPasswordCommand,
  ChangePasswordCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  NotAuthorizedException,
  UserNotFoundException,
  CodeMismatchException,
  ExpiredCodeException,
} from "@aws-sdk/client-cognito-identity-provider";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { getPrisma } from "@/lib/db";
import type { AuthProvider } from "./types";

const client = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION ?? "us-east-1",
});

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  clientId:   process.env.COGNITO_CLIENT_ID!,
  tokenUse:   "access",
});

export const cognitoAuthProvider: AuthProvider = {
  async authenticate(username, password) {
    try {
      const result = await client.send(new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.COGNITO_CLIENT_ID!,
        AuthParameters: { USERNAME: username, PASSWORD: password },
      }));
      return result.AuthenticationResult?.AccessToken ?? null;
    } catch (err) {
      if (err instanceof NotAuthorizedException || err instanceof UserNotFoundException) {
        return null;
      }
      throw err;
    }
  },

  async resolveSession(token) {
    let payload;
    try {
      payload = await verifier.verify(token);
    } catch {
      return null;
    }

    const prisma = await getPrisma();

    // Local JWT verification alone can't see server-side revocation (e.g.
    // GlobalSignOut on logout) — check our own revocation log too.
    const revoked = await prisma.revokedToken.findUnique({ where: { jti: payload.jti } });
    if (revoked) return null;

    const user = await prisma.user.findUnique({ where: { cognitoSub: payload.sub } });
    return user?.id ?? null;
  },

  async invalidate(token) {
    try {
      await client.send(new GlobalSignOutCommand({ AccessToken: token }));
    } catch {
      // Already signed out / expired token — still record the jti below so
      // resolveSession rejects it even if Cognito-side revocation failed.
    }

    try {
      const payload = await verifier.verify(token);
      const prisma = await getPrisma();
      await prisma.revokedToken.create({
        data: { jti: payload.jti, expiresAt: new Date(payload.exp * 1000) },
      });
      // Opportunistic cleanup of old entries — no need for a cron job for this volume.
      await prisma.revokedToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    } catch {
      // Token was already invalid/expired — nothing meaningful to record.
    }
  },

  async changePassword(userId, newPassword) {
    const prisma = await getPrisma();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await client.send(new AdminSetUserPasswordCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username:   user.username,
      Password:   newPassword,
      Permanent:  true,
    }));
  },

  async changeOwnPassword(token, oldPassword, newPassword) {
    try {
      await client.send(new ChangePasswordCommand({
        AccessToken:      token,
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
      }));
      return true;
    } catch (err) {
      if (err instanceof NotAuthorizedException) return false;
      throw err;
    }
  },

  async requestPasswordReset(username) {
    try {
      await client.send(new ForgotPasswordCommand({
        ClientId: process.env.COGNITO_CLIENT_ID!,
        Username: username,
      }));
    } catch (err) {
      // Swallow "user doesn't exist" so callers can show a generic message
      // without revealing which usernames are registered.
      if (err instanceof UserNotFoundException) return;
      throw err;
    }
  },

  async confirmPasswordReset(username, code, newPassword) {
    try {
      await client.send(new ConfirmForgotPasswordCommand({
        ClientId:         process.env.COGNITO_CLIENT_ID!,
        Username:         username,
        ConfirmationCode: code,
        Password:         newPassword,
      }));
      return true;
    } catch (err) {
      if (err instanceof CodeMismatchException || err instanceof ExpiredCodeException) return false;
      throw err;
    }
  },

  async signUp({ username, password, email, phone }) {
    const attributes = [{ Name: "email", Value: email }];
    if (phone) attributes.push({ Name: "phone_number", Value: phone });

    const result = await client.send(new SignUpCommand({
      ClientId:       process.env.COGNITO_CLIENT_ID!,
      Username:       username,
      Password:       password,
      UserAttributes: attributes,
    }));

    return {
      providerSub: result.UserSub ?? null,
      needsConfirmation: !result.UserConfirmed,
    };
  },

  async confirmSignUp(username, code) {
    try {
      await client.send(new ConfirmSignUpCommand({
        ClientId:         process.env.COGNITO_CLIENT_ID!,
        Username:         username,
        ConfirmationCode: code,
      }));
      return true;
    } catch (err) {
      if (err instanceof CodeMismatchException || err instanceof ExpiredCodeException) return false;
      throw err;
    }
  },
};
