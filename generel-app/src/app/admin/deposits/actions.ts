"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { formatTk, notify } from "@/lib/notify";
import { logAdmin, requireAdmin } from "@/lib/admin";
import { attempt, flash } from "@/lib/flash";

function refresh() {
  revalidatePath("/admin/deposits");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin");
  revalidatePath("/deposit");
  revalidatePath("/dashboard");
}

export async function approveDeposit(formData: FormData) {
  const depositId = String(formData.get("depositId") ?? "");
  const back = String(formData.get("back") ?? "/admin/deposits");

  const error = await attempt(async () => {
    const adminId = await requireAdmin();
    await prisma.$transaction(async (tx) => {
      // Status-guarded: concurrent reviews can't credit the wallet twice.
      const claimed = await tx.deposit.updateMany({
        where: { id: depositId, status: "PENDING" },
        data: { status: "APPROVED", reviewedAt: new Date() },
      });
      if (claimed.count === 0) throw new Error("এই deposit আগেই review করা হয়েছে");

      const deposit = await tx.deposit.findUniqueOrThrow({ where: { id: depositId } });
      await tx.wallet.update({
        where: { userId: deposit.userId },
        data: { gWallet: { increment: deposit.amount } },
      });
      await notify(tx, {
        userId: deposit.userId,
        category: "DEPOSIT",
        title: "Deposit approved",
        body: `${formatTk(deposit.amount)} deposit approve হয়েছে এবং G-Wallet এ জমা হয়েছে।`,
        link: "/deposit",
      });
      await logAdmin(tx, adminId, "DEPOSIT_APPROVED", deposit.userId, {
        depositId,
        amount: deposit.amount.toString(),
      });
    });
  });

  refresh();
  if (error) flash(back, "error", error);
  flash(back, "ok", "Deposit approve করা হয়েছে।");
}

export async function rejectDeposit(formData: FormData) {
  const depositId = String(formData.get("depositId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const back = String(formData.get("back") ?? "/admin/deposits");

  const error = await attempt(async () => {
    const adminId = await requireAdmin();
    if (reason.length < 3) throw new Error("Rejection reason লেখো");

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.deposit.updateMany({
        where: { id: depositId, status: "PENDING" },
        data: { status: "REJECTED", reviewedAt: new Date(), rejectReason: reason.slice(0, 200) },
      });
      if (claimed.count === 0) throw new Error("এই deposit আগেই review করা হয়েছে");

      const deposit = await tx.deposit.findUniqueOrThrow({ where: { id: depositId } });
      await notify(tx, {
        userId: deposit.userId,
        category: "DEPOSIT",
        title: "Deposit rejected",
        body: `${formatTk(deposit.amount)} deposit request reject হয়েছে। কারণ: ${reason.slice(0, 120)}`,
        link: "/deposit",
      });
      await logAdmin(tx, adminId, "DEPOSIT_REJECTED", deposit.userId, { depositId, reason });
    });
  });

  refresh();
  if (error) flash(back, "error", error);
  flash(back, "ok", "Deposit reject করা হয়েছে।");
}
