import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

type Db = Prisma.TransactionClient | typeof prisma;

/** Server-side guard for every admin action/page. Returns the admin's user id. */
export async function requireAdmin(): Promise<string> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Only admin can do this");
  return session.user.id;
}

/** Appends an audit-trail entry for a sensitive admin action. */
export async function logAdmin(
  db: Db,
  adminId: string,
  action: string,
  targetUserId?: string | null,
  metadata?: Prisma.InputJsonValue
) {
  await db.adminLog.create({
    data: { adminId, action, targetUserId: targetUserId ?? null, metadata },
  });
}

/** Documented business rules (read-only; shown on the admin settings screens). */
export const RULES = {
  directCommissionRate: 0.06,
  teamMatchingRate: 0.05,
  roiMonths: 18,
  withdrawFeeRate: 0.1,
  transferFeeRate: 0.1,
  minWithdraw: 1000,
} as const;
