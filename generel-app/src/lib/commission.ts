import { Prisma } from "@/generated/prisma/client";
import { formatTk, notify } from "@/lib/notify";

const DIRECT_COMMISSION_RATE = 0.06;
const TEAM_MATCHING_RATE = 0.05;

type TxClient = Prisma.TransactionClient;

/**
 * Direct Referral Commission (6%): goes only to the investor's immediate upline.
 */
async function processDirectCommission(
  tx: TxClient,
  investmentId: string,
  investorUplineId: string,
  amount: Prisma.Decimal
) {
  const commissionAmount = amount.mul(DIRECT_COMMISSION_RATE);

  await tx.wallet.update({
    where: { userId: investorUplineId },
    data: { cWallet: { increment: commissionAmount } },
  });

  await tx.commission.create({
    data: {
      userId: investorUplineId,
      fromInvestmentId: investmentId,
      type: "DIRECT",
      amount: commissionAmount,
    },
  });

  await notify(tx, {
    userId: investorUplineId,
    category: "COMMISSION",
    title: "Direct Referral Commission",
    body: `তোমার direct referral-এর ${formatTk(amount)} investment থেকে 6% commission ${formatTk(commissionAmount)} C-Wallet এ জমা হয়েছে।`,
    link: "/dashboard",
  });
}

/**
 * Team Sales Commission (5%) — Exact Equal Match rule:
 * Walking up the tree from the investor, each ancestor's matching ledger is
 * updated on the side the investor's branch sits under. A match (and 5%
 * commission) fires only when the two sides become EXACTLY equal — no
 * partial/cascading match, no flush: an unmatched amount simply waits
 * (carry forward) until a future investment on the other side makes it equal.
 */
async function processTeamMatching(
  tx: TxClient,
  investmentId: string,
  investorId: string,
  amount: Prisma.Decimal
) {
  let currentId = investorId;

  while (true) {
    const current = await tx.user.findUnique({
      where: { id: currentId },
      select: { id: true, uplineId: true },
    });
    if (!current?.uplineId) break;

    const ancestor = await tx.user.findUnique({
      where: { id: current.uplineId },
      select: { id: true, leftChildId: true, rightChildId: true },
    });
    if (!ancestor) break;

    const side: "LEFT" | "RIGHT" =
      ancestor.leftChildId === current.id ? "LEFT" : "RIGHT";

    const ledger = await tx.matchingLedger.upsert({
      where: { userId: ancestor.id },
      create: { userId: ancestor.id },
      update: {},
    });

    const updatedLedger = await tx.matchingLedger.update({
      where: { userId: ancestor.id },
      data:
        side === "LEFT"
          ? {
              leftCarryBalance: { increment: amount },
              leftLifetimeVolume: { increment: amount },
            }
          : {
              rightCarryBalance: { increment: amount },
              rightLifetimeVolume: { increment: amount },
            },
    });

    const left = updatedLedger.leftCarryBalance;
    const right = updatedLedger.rightCarryBalance;

    if (left.greaterThan(0) && left.equals(right)) {
      const matchedVolume = left;
      const commissionAmount = matchedVolume.mul(TEAM_MATCHING_RATE);

      await tx.matchingLedger.update({
        where: { userId: ancestor.id },
        data: {
          leftCarryBalance: 0,
          rightCarryBalance: 0,
          totalMatchedVolume: { increment: matchedVolume },
        },
      });

      await tx.wallet.update({
        where: { userId: ancestor.id },
        data: { cWallet: { increment: commissionAmount } },
      });

      await tx.commission.create({
        data: {
          userId: ancestor.id,
          fromInvestmentId: investmentId,
          type: "TEAM_MATCHING",
          amount: commissionAmount,
        },
      });

      await notify(tx, {
        userId: ancestor.id,
        category: "COMMISSION",
        title: "Team Matching Commission",
        body: `Left ও Right side ${formatTk(matchedVolume)}-এ exact match হয়েছে। 5% commission ${formatTk(commissionAmount)} C-Wallet এ জমা হয়েছে।`,
        link: "/dashboard",
      });
    }

    void ledger;
    currentId = ancestor.id;
  }
}

export async function processInvestmentCommissions(
  tx: TxClient,
  params: { investmentId: string; investorId: string; amount: Prisma.Decimal }
) {
  const { investmentId, investorId, amount } = params;

  const investor = await tx.user.findUnique({
    where: { id: investorId },
    select: { uplineId: true },
  });

  if (investor?.uplineId) {
    await processDirectCommission(tx, investmentId, investor.uplineId, amount);
  }

  await processTeamMatching(tx, investmentId, investorId, amount);
}
