-- CreateEnum
CREATE TYPE "TokenIssuerStatus" AS ENUM ('ACTIVE', 'RETIRING', 'REVOKED');

-- CreateTable
CREATE TABLE "TokenIssuer" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'livekit',
    "apiUrl" TEXT,
    "apiKeyEncrypted" TEXT NOT NULL,
    "apiSecretEncrypted" TEXT NOT NULL,
    "status" "TokenIssuerStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "rotatedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenIssuer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenIssuer_userId_provider_version_key" ON "TokenIssuer"("userId", "provider", "version");

-- CreateIndex
CREATE INDEX "TokenIssuer_userId_status_idx" ON "TokenIssuer"("userId", "status");

-- CreateIndex
CREATE INDEX "TokenIssuer_provider_status_idx" ON "TokenIssuer"("provider", "status");

-- CreateIndex
CREATE INDEX "TokenIssuer_createdAt_idx" ON "TokenIssuer"("createdAt");

-- AddForeignKey
ALTER TABLE "TokenIssuer" ADD CONSTRAINT "TokenIssuer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
