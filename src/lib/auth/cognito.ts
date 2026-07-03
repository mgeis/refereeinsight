/**
 * AWS Cognito authentication provider.
 *
 * SETUP CHECKLIST
 * ───────────────
 * 1. Create a Cognito User Pool in the AWS Console (or via CDK/Terraform).
 *    - Enable "Username / password" auth flow (ALLOW_USER_PASSWORD_AUTH).
 *    - Create an App Client with a client secret disabled (simpler for server-side).
 *
 * 2. Add environment variables:
 *      COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
 *      COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
 *      COGNITO_REGION=us-east-1
 *
 * 3. Install the AWS SDK:
 *      npm install @aws-sdk/client-cognito-identity-provider
 *
 * 4. Install a JWT verification library:
 *      npm install aws-jwt-verify
 *
 * 5. Add cognitoSub to the User model so Cognito users map to local records:
 *      model User {
 *        ...
 *        cognitoSub String? @unique
 *      }
 *    Then run: npx prisma migrate dev --name add_cognito_sub
 *
 * 6. Migrate existing users:
 *    - Use the Cognito "Import users" flow (CSV upload via the console), OR
 *    - On each user's first local login, call AdminCreateUser to provision
 *      them in Cognito and store the returned `sub` in User.cognitoSub.
 *
 * HOW IT WORKS (when implemented)
 * ────────────────────────────────
 * authenticate  → CognitoIdentityProviderClient.InitiateAuth
 *                 Returns an AccessToken (JWT). Store that in the cookie.
 *
 * resolveSession → Verify the JWT using aws-jwt-verify (checks signature +
 *                  expiry against Cognito's JWKS endpoint automatically).
 *                  Extract the `sub` claim, then:
 *                    prisma.user.findUnique({ where: { cognitoSub: sub } })
 *                  Return user.id.
 *
 * invalidate    → CognitoIdentityProviderClient.GlobalSignOut (revokes all
 *                  tokens for the user), or RevokeToken for just this session.
 *
 * changePassword → CognitoIdentityProviderClient.ChangePassword (requires the
 *                  current access token) or AdminSetUserPassword (server-side,
 *                  no current token needed — use for admin resets).
 */

// Uncomment these once the packages above are installed:
// import {
//   CognitoIdentityProviderClient,
//   InitiateAuthCommand,
//   GlobalSignOutCommand,
//   ChangePasswordCommand,
// } from "@aws-sdk/client-cognito-identity-provider";
// import { CognitoJwtVerifier } from "aws-jwt-verify";
// import { prisma } from "@/lib/db";

import type { AuthProvider } from "./types";

// const client = new CognitoIdentityProviderClient({
//   region: process.env.COGNITO_REGION ?? "us-east-1",
// });

// const verifier = CognitoJwtVerifier.create({
//   userPoolId:  process.env.COGNITO_USER_POOL_ID!,
//   clientId:    process.env.COGNITO_CLIENT_ID!,
//   tokenUse:    "access",
// });

export const cognitoAuthProvider: AuthProvider = {
  async authenticate(_username, _password) {
    // const result = await client.send(new InitiateAuthCommand({
    //   AuthFlow: "USER_PASSWORD_AUTH",
    //   ClientId: process.env.COGNITO_CLIENT_ID!,
    //   AuthParameters: { USERNAME: _username, PASSWORD: _password },
    // }));
    // return result.AuthenticationResult?.AccessToken ?? null;
    throw new Error("Cognito provider is not yet configured. See src/lib/auth/cognito.ts.");
  },

  async resolveSession(_token) {
    // const payload = await verifier.verify(_token);
    // const user = await prisma.user.findUnique({ where: { cognitoSub: payload.sub } });
    // return user?.id ?? null;
    throw new Error("Cognito provider is not yet configured. See src/lib/auth/cognito.ts.");
  },

  async invalidate(_token) {
    // await client.send(new GlobalSignOutCommand({ AccessToken: _token }));
    throw new Error("Cognito provider is not yet configured. See src/lib/auth/cognito.ts.");
  },

  async changePassword(_userId, _newPassword) {
    // For admin password resets (no current token required):
    // const user = await prisma.user.findUnique({ where: { id: _userId } });
    // await client.send(new AdminSetUserPasswordCommand({
    //   UserPoolId: process.env.COGNITO_USER_POOL_ID!,
    //   Username:   user!.cognitoSub!,
    //   Password:   _newPassword,
    //   Permanent:  true,
    // }));
    throw new Error("Cognito provider is not yet configured. See src/lib/auth/cognito.ts.");
  },
};
