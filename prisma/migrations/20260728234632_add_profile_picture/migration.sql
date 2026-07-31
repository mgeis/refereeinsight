-- DropIndex
DROP INDEX "McpToken_userId_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profilePictureKey" TEXT;
