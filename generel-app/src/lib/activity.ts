import { prisma } from "@/lib/prisma";
import { num, ref } from "@/lib/format";

export type WalletKey = "G" | "C" | "R" | "T";

export type ActivityRow = {
  id: string;
  ref: string;
  date: Date;
  type: string;
  detail: string;
  wallet: WalletKey;
  /** Signed: positive = credit to the wallet, negative = debit. */
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export const WALLET_INFO: Record<
  "E" | WalletKey,
  { name: string; tag: string; field: "eWallet" | "gWallet" | "cWallet" | "rWallet" | "tWallet"; slug: string; description: string }
> = {
  E: { name: "E-Wallet", tag: "Overview", field: "eWallet", slug: "e-wallet", description: "Main / overall wallet overview" },
  G: { name: "G-Wallet", tag: "Deposit", field: "gWallet", slug: "g-wallet", description: "Deposit / general wallet — approved deposits are credited here" },
  C: { name: "C-Wallet", tag: "Commission", field: "cWallet", slug: "c-wallet", description: "Direct referral and team matching commissions" },
  R: { name: "R-Wallet", tag: "ROI", field: "rWallet", slug: "r-wallet", description: "Investment return (ROI) credits" },
  T: { name: "T-Wallet", tag: "Transfer", field: "tWallet", slug: "t-wallet", description: "ID-to-ID internal transfers" },
};

/**
 * Unified, newest-first transaction feed for one user, built from the
 * underlying records (deposits, withdrawals, investments, commissions, ROI
 * credits and transfers).
 */
export async function getActivity(
  userId: string,
  options: { wallet?: WalletKey; limit?: number } = {}
): Promise<ActivityRow[]> {
  const limit = options.limit ?? 50;
  const want = (w: WalletKey) => !options.wallet || options.wallet === w;
  const take = limit;

  const [deposits, withdrawals, investments, commissions, roi, sent, received] = await Promise.all([
    want("G")
      ? prisma.deposit.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take })
      : [],
    want("C") || want("R")
      ? prisma.withdrawal.findMany({
          where: {
            userId,
            ...(options.wallet === "C" ? { sourceWallet: "C_WALLET" as const } : {}),
            ...(options.wallet === "R" ? { sourceWallet: "R_WALLET" as const } : {}),
          },
          orderBy: { createdAt: "desc" },
          take,
        })
      : [],
    want("G")
      ? prisma.investment.findMany({ where: { userId }, orderBy: { investedAt: "desc" }, take })
      : [],
    want("C")
      ? prisma.commission.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take })
      : [],
    want("R")
      ? prisma.roiSchedule.findMany({
          where: { status: "APPROVED", investment: { userId } },
          orderBy: { paidAt: "desc" },
          take,
        })
      : [],
    want("T")
      ? prisma.transfer.findMany({
          where: { fromUserId: userId },
          include: { toUser: { select: { name: true, mobile: true } } },
          orderBy: { createdAt: "desc" },
          take,
        })
      : [],
    want("T")
      ? prisma.transfer.findMany({
          where: { toUserId: userId },
          include: { fromUser: { select: { name: true, mobile: true } } },
          orderBy: { createdAt: "desc" },
          take,
        })
      : [],
  ]);

  const rows: ActivityRow[] = [
    ...deposits.map((d) => ({
      id: `dep-${d.id}`,
      ref: ref("DEP", d.id),
      date: d.createdAt,
      type: "Deposit",
      detail: d.method,
      wallet: "G" as const,
      amount: num(d.amount),
      status: d.status,
    })),
    ...withdrawals.map((w) => ({
      id: `wd-${w.id}`,
      ref: ref("WDR", w.id),
      date: w.createdAt,
      type: "Withdrawal",
      detail: `Charge ৳${num(w.feeAmount).toLocaleString("en-US")} · Net ৳${num(w.netAmount).toLocaleString("en-US")}`,
      wallet: (w.sourceWallet === "C_WALLET" ? "C" : "R") as WalletKey,
      amount: -num(w.amount),
      status: w.status,
    })),
    ...investments.map((i) => ({
      id: `inv-${i.id}`,
      ref: ref("INV", i.id),
      date: i.investedAt,
      type: "Investment",
      detail: "Slot purchase",
      wallet: "G" as const,
      amount: -num(i.amount),
      status: i.status,
    })),
    ...commissions.map((c) => ({
      id: `com-${c.id}`,
      ref: ref("COM", c.id),
      date: c.createdAt,
      type: c.type === "DIRECT" ? "Direct Commission" : "Matching Commission",
      detail: c.type === "DIRECT" ? "6% direct referral" : "5% team matching",
      wallet: "C" as const,
      amount: num(c.amount),
      status: "APPROVED" as const,
    })),
    ...roi.map((r) => ({
      id: `roi-${r.id}`,
      ref: ref("ROI", r.id),
      date: r.paidAt ?? new Date(0),
      type: "ROI Credit",
      detail: `Month ${r.monthNo}/18`,
      wallet: "R" as const,
      amount: num(r.amount),
      status: "APPROVED" as const,
    })),
    ...sent.map((t) => ({
      id: `tout-${t.id}`,
      ref: ref("TRF", t.id),
      date: t.createdAt,
      type: "Transfer Sent",
      detail: `To ${t.toUser.name} (${t.toUser.mobile})`,
      wallet: "T" as const,
      amount: -num(t.amount),
      status: "APPROVED" as const,
    })),
    ...received.map((t) => ({
      id: `tin-${t.id}`,
      ref: ref("TRF", t.id),
      date: t.createdAt,
      type: "Transfer Received",
      detail: `From ${t.fromUser.name} (${t.fromUser.mobile})`,
      wallet: "T" as const,
      amount: num(t.amount) - num(t.feeAmount),
      status: "APPROVED" as const,
    })),
  ];

  return rows.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
}

/** Lifetime totals shown on the dashboard's financial summary. */
export async function getFinancialSummary(userId: string) {
  const [dep, inv, com, roi, wdPaid, wdPending, direct, matching] = await Promise.all([
    prisma.deposit.aggregate({ where: { userId, status: "APPROVED" }, _sum: { amount: true } }),
    prisma.investment.aggregate({ where: { userId }, _sum: { amount: true }, _count: true }),
    prisma.commission.aggregate({ where: { userId }, _sum: { amount: true } }),
    prisma.roiSchedule.aggregate({
      where: { status: "APPROVED", investment: { userId } },
      _sum: { amount: true },
    }),
    prisma.withdrawal.aggregate({ where: { userId, status: "APPROVED" }, _sum: { amount: true } }),
    prisma.withdrawal.aggregate({ where: { userId, status: "PENDING" }, _sum: { amount: true } }),
    prisma.commission.aggregate({ where: { userId, type: "DIRECT" }, _sum: { amount: true } }),
    prisma.commission.aggregate({ where: { userId, type: "TEAM_MATCHING" }, _sum: { amount: true } }),
  ]);

  return {
    deposited: num(dep._sum.amount),
    invested: num(inv._sum.amount),
    investmentCount: inv._count,
    commission: num(com._sum.amount),
    roi: num(roi._sum.amount),
    withdrawn: num(wdPaid._sum.amount),
    pendingWithdrawal: num(wdPending._sum.amount),
    directCommission: num(direct._sum.amount),
    matchingCommission: num(matching._sum.amount),
  };
}

/** Last `months` calendar months as { key: "2026-11", label: "Nov" } oldest first. */
export function lastMonths(months: number, now: Date = new Date()) {
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-GB", { month: "short" }),
    };
  });
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
