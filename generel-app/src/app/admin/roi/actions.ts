"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { addMonths } from "date-fns";

async function requireAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Only admin can do this");
}

/**
 * Processes every ROI schedule row whose due date (investedAt + monthNo months)
 * has arrived. Intended to run on a monthly cron in production; here it's a
 * manual admin-triggered button for local development.
 */
export async function runRoiCron() {
  await requireAdmin();

  const dueSchedules = await prisma.roiSchedule.findMany({
    where: { status: "PENDING" },
    include: { investment: true },
  });

  const now = new Date();
  let paidCount = 0;

  for (const schedule of dueSchedules) {
    const dueDate = addMonths(schedule.investment.investedAt, schedule.monthNo);
    if (dueDate > now) continue;

    await prisma.$transaction([
      prisma.roiSchedule.update({
        where: { id: schedule.id },
        data: { status: "APPROVED", paidAt: now },
      }),
      prisma.wallet.update({
        where: { userId: schedule.investment.userId },
        data: { rWallet: { increment: schedule.amount } },
      }),
    ]);
    paidCount++;
  }

  void paidCount;
  revalidatePath("/admin/roi");
  revalidatePath("/dashboard");
}
