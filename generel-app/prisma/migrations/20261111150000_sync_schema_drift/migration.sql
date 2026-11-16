-- Brings the migration history in line with schema.prisma: these objects were
-- added to the schema after the init migration without a migration of their
-- own. Written idempotently so it is also safe on a database that already
-- received them through `prisma db push`.

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "WalletSource" AS ENUM ('C_WALLET', 'R_WALLET');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "MatchingLedger" ADD COLUMN IF NOT EXISTS "leftLifetimeVolume" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "MatchingLedger" ADD COLUMN IF NOT EXISTS "rightLifetimeVolume" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "transactionPinHash" TEXT;

-- AlterTable (temporary default backfills any existing rows, then is dropped to match the schema)
ALTER TABLE "Withdrawal" ADD COLUMN IF NOT EXISTS "sourceWallet" "WalletSource" NOT NULL DEFAULT 'C_WALLET';
ALTER TABLE "Withdrawal" ALTER COLUMN "sourceWallet" DROP DEFAULT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Passkey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "deviceLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Passkey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RewardClaim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rankId" TEXT NOT NULL,
    "status" "RewardStatus" NOT NULL DEFAULT 'PENDING_CLAIM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Passkey_credentialId_key" ON "Passkey"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "RewardClaim_userId_rankId_key" ON "RewardClaim"("userId", "rankId");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Passkey" ADD CONSTRAINT "Passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "RewardClaim" ADD CONSTRAINT "RewardClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "RewardClaim" ADD CONSTRAINT "RewardClaim_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
