"use server";

import { prisma } from "@/lib/prisma";
import { logAdmin, requireAdmin } from "@/lib/admin";
import { flash } from "@/lib/flash";
import { revalidatePath } from "next/cache";
import { addMonths } from "date-fns";
import { formatTk, notify } from "@/lib/notify";


/**
 * Processes every ROI schedule row whose due date (investedAt + monthNo months)
 * has arrived. Intended to run on a monthly cron in production; here it's a
 * manual admin-triggered button for local development.
 */
export async function runRoiCron() {
  const adminId = await requireAdmin();

  const dueSchedules = await prisma.roiSchedule.findMany({
    where: { status: "PENDING" },
    include: { investment: true },
  });

  const now = new Date();
  let paidCount = 0;

  for (const schedule of dueSchedules) {
    const dueDate = addMonths(schedule.investment.investedAt, schedule.monthNo);
    if (dueDate > now) continue;

    const paid = await prisma.$transaction(async (tx) => {
      // Status-guarded so two overlapping runs can't pay the same month twice
      const claimed = await tx.roiSchedule.updateMany({
        where: { id: schedule.id, status: "PENDING" },
        data: { status: "APPROVED", paidAt: now },
      });
      if (claimed.count === 0) return false;

      await tx.wallet.update({
        where: { userId: schedule.investment.userId },
        data: { rWallet: { increment: schedule.amount } },
      });

      await notify(tx, {
        userId: schedule.investment.userId,
        category: "INVESTMENT",
        title: "ROI জমা হয়েছে",
        body: `${formatTk(schedule.investment.amount)} investment-এর Month ${schedule.monthNo}/18 ROI ${formatTk(schedule.amount)} R-Wallet এ জমা হয়েছে।`,
        link: "/dashboard",
      });
      return true;
    });
    if (paid) paidCount++;
  }

  await logAdmin(prisma, adminId, "ROI_RUN", null, { paid: paidCount });
  revalidatePath("/admin/roi");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  flash(
    "/admin/roi",
    "ok",
    paidCount > 0 ? `${paidCount} টি ROI installment credit হয়েছে।` : "এখন credit করার মতো কোনো due ROI নেই।"
  );
}
