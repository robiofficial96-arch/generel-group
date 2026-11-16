"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { formatTk, notify } from "@/lib/notify";
import { logAdmin, requireAdmin } from "@/lib/admin";
import { attempt, flash } from "@/lib/flash";

function refresh() {
  revalidatePath("/admin/withdrawals");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin");
  revalidatePath("/withdraw");
  revalidatePath("/dashboard");
}

export async function approveWithdrawal(formData: FormData) {
  const id = String(formData.get("withdrawalId") ?? "");
  const back = String(formData.get("back") ?? "/admin/withdrawals");

  const error = await attempt(async () => {
    const adminId = await requireAdmin();
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.withdrawal.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "APPROVED", processedAt: new Date() },
      });
      if (claimed.count === 0) throw new Error("এই withdrawal আগেই review করা হয়েছে");

      const w = await tx.withdrawal.findUniqueOrThrow({ where: { id } });
      await notify(tx, {
        userId: w.userId,
        category: "WITHDRAWAL",
        title: "Withdrawal approved",
        body: `${formatTk(w.amount)} withdrawal approve হয়েছে। Charge ${formatTk(w.feeAmount)}, net payable ${formatTk(w.netAmount)}।`,
        link: "/withdraw",
      });
      await logAdmin(tx, adminId, "WITHDRAWAL_APPROVED", w.userId, { withdrawalId: id, net: w.netAmount.toString() });
    });
  });

  refresh();
  if (error) flash(back, "error", error);
  flash(back, "ok", "Withdrawal approve করা হয়েছে — payout সম্পন্ন করো।");
}

export async function rejectWithdrawal(formData: FormData) {
  const id = String(formData.get("withdrawalId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const back = String(formData.get("back") ?? "/admin/withdrawals");

  const error = await attempt(async () => {
    const adminId = await requireAdmin();
    if (reason.length < 3) throw new Error("Rejection reason লেখো");

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.withdrawal.updateMany({
        where: { id, status: "PENDING" },
        data: { status: "REJECTED", processedAt: new Date(), rejectReason: reason.slice(0, 200) },
      });
      if (claimed.count === 0) throw new Error("এই withdrawal আগেই review করা হয়েছে");

      const w = await tx.withdrawal.findUniqueOrThrow({ where: { id } });
      const walletName = w.sourceWallet === "C_WALLET" ? "C-Wallet" : "R-Wallet";

      // Refund the held amount in full
      await tx.wallet.update({
        where: { userId: w.userId },
        data: w.sourceWallet === "C_WALLET" ? { cWallet: { increment: w.amount } } : { rWallet: { increment: w.amount } },
      });
      await notify(tx, {
        userId: w.userId,
        category: "WITHDRAWAL",
        title: "Withdrawal rejected",
        body: `${formatTk(w.amount)} withdrawal request reject হয়েছে, পুরো amount ${walletName} এ ফেরত দেওয়া হয়েছে। কারণ: ${reason.slice(0, 120)}`,
        link: "/withdraw",
      });
      await logAdmin(tx, adminId, "WITHDRAWAL_REJECTED", w.userId, { withdrawalId: id, reason });
    });
  });

  refresh();
  if (error) flash(back, "error", error);
  flash(back, "ok", "Withdrawal reject করা হয়েছে, amount ফেরত গেছে।");
}
