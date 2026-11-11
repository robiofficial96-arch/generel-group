import { Prisma } from "@/generated/prisma/client";

type TxClient = Prisma.TransactionClient;

/**
 * Counts how many users in the binary subtree rooted at `rootId` (inclusive)
 * hold a rank whose order is >= minOrder. Used to check the "2x <rank>"
 * leg-count requirement for ranks above the first.
 */
async function countSubtreeAtRankOrAbove(
  tx: TxClient,
  rootId: string | null,
  minOrder: number
): Promise<number> {
  if (!rootId) return 0;

  const result = await tx.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    WITH RECURSIVE subtree AS (
      SELECT id, "leftChildId", "rightChildId", "rankId" FROM "User" WHERE id = ${rootId}
      UNION ALL
      SELECT u.id, u."leftChildId", u."rightChildId", u."rankId"
      FROM "User" u
      JOIN subtree s ON u.id = s."leftChildId" OR u.id = s."rightChildId"
    )
    SELECT count(*)::bigint as count
    FROM subtree s
    JOIN "Rank" r ON r.id = s."rankId"
    WHERE r."order" >= ${minOrder}
  `);

  return Number(result[0]?.count ?? 0);
}

/**
 * Checks whether `userId` now qualifies for the next rank and promotes them
 * if so (volume-based for Rank 1, leg-count-based — "2x previous rank" — for
 * every rank after that). Assigns salary/reward records on promotion.
 */
export async function checkAndPromoteRank(tx: TxClient, userId: string) {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { rankId: true, leftChildId: true, rightChildId: true, rank: true },
  });
  if (!user) return;

  const currentOrder = user.rank?.order ?? 0;
  const nextRank = await tx.rank.findUnique({ where: { order: currentOrder + 1 } });
  if (!nextRank) return;

  let qualifies = false;

  if (nextRank.qualificationAmount !== null) {
    const ledger = await tx.matchingLedger.findUnique({ where: { userId } });
    if (
      ledger &&
      ledger.leftLifetimeVolume.greaterThanOrEqualTo(nextRank.qualificationAmount) &&
      ledger.rightLifetimeVolume.greaterThanOrEqualTo(nextRank.qualificationAmount)
    ) {
      qualifies = true;
    }
  } else if (nextRank.requiredRankCountPerLeg !== null) {
    const [leftCount, rightCount] = await Promise.all([
      countSubtreeAtRankOrAbove(tx, user.leftChildId, currentOrder),
      countSubtreeAtRankOrAbove(tx, user.rightChildId, currentOrder),
    ]);
    if (
      leftCount >= nextRank.requiredRankCountPerLeg &&
      rightCount >= nextRank.requiredRankCountPerLeg
    ) {
      qualifies = true;
    }
  }

  if (!qualifies) return;

  await tx.user.update({ where: { id: userId }, data: { rankId: nextRank.id } });

  if (nextRank.salaryAmount !== null) {
    await tx.rankSalary.create({
      data: {
        userId,
        rankId: nextRank.id,
        totalMonths: nextRank.salaryMonths ?? 0,
        isLifetime: nextRank.isLifetimeSalary,
      },
    });
  }

  if (nextRank.physicalReward) {
    if (nextRank.order === 1) {
      // First rank's cash reward is credited immediately
      await tx.wallet.update({
        where: { userId },
        data: { cWallet: { increment: 10_000 } },
      });
      await tx.rewardClaim.upsert({
        where: { userId_rankId: { userId, rankId: nextRank.id } },
        create: { userId, rankId: nextRank.id, status: "DELIVERED" },
        update: {},
      });
    } else {
      await tx.rewardClaim.upsert({
        where: { userId_rankId: { userId, rankId: nextRank.id } },
        create: { userId, rankId: nextRank.id },
        update: {},
      });
    }
  }

  // A big one-time volume/count jump could qualify for more than one rank at once
  await checkAndPromoteRank(tx, userId);
}
