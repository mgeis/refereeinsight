-- Rename McpToken -> ApiToken: these bearer tokens now authenticate both the
-- MCP server and the external REST API, not just MCP. Renamed in place
-- (not dropped/recreated) to preserve existing tokens.
ALTER TABLE "McpToken" RENAME TO "ApiToken";
ALTER TABLE "ApiToken" RENAME CONSTRAINT "McpToken_pkey" TO "ApiToken_pkey";
ALTER INDEX "McpToken_tokenHash_key" RENAME TO "ApiToken_tokenHash_key";
ALTER TABLE "ApiToken" RENAME CONSTRAINT "McpToken_userId_fkey" TO "ApiToken_userId_fkey";
ALTER SEQUENCE "McpToken_id_seq" RENAME TO "ApiToken_id_seq";
