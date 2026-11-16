"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { processInvestmentCommissions } from "@/lib/commission";
import { generateRoiSchedule } from "@/lib/roi";
import { formatTk, notify } from "@/lib/notify";
import { attempt, flash } from "@/lib/flash";

export async function buyInvestmentSlot(formData: FormData) {
  let bought = "";

  const error = await attempt(async () => {
    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated");
    const userId = session.user.id;
    const slotId = formData.get("slotId") as string;

    await prisma.$transaction(async (tx) => {
      const slot = await tx.investmentSlot.findUnique({ where: { id: slotId } });
      if (!slot) throw new Error("Slot পাওয়া যায়নি");

      // Conditional decrement: fails (count 0) if the balance is insufficient,
      // so two simultaneous purchases can never overdraw the wallet.
      const debited = await tx.wallet.updateMany({
        where: { userId, gWallet: { gte: slot.amount } },
        data: { gWallet: { decrement: slot.amount } },
      });
      if (debited.count === 0) throw new Error("G-Wallet এ পর্যাপ্ত ব্যালেন্স নেই");

      const investor = await tx.user.findUnique({
        where: { id: userId },
        select: { placedSide: true },
      });

      const investment = await tx.investment.create({
        data: { userId, slotId: slot.id, amount: slot.amount, side: investor?.placedSide ?? null },
      });

      // An account becomes Active once it holds an investment.
      await tx.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });

      await processInvestmentCommissions(tx, {
        investmentId: investment.id,
        investorId: userId,
        amount: slot.amount,
      });

      await generateRoiSchedule(tx, investment.id, slot.amount);

      await notify(tx, {
        userId,
        category: "INVESTMENT",
        title: "Investment active হয়েছে",
        body: `G-Wallet থেকে ${formatTk(slot.amount)} slot কেনা হয়েছে। 18 মাসের ROI schedule তৈরি হয়েছে — ROI R-Wallet এ জমা হবে।`,
        link: "/invest",
      });

      bought = formatTk(slot.amount);
    });
  });

  if (error) flash("/invest", "error", error);
  revalidatePath("/invest");
  revalidatePath("/dashboard");
  flash("/invest", "ok", `${bought} investment slot সফলভাবে কেনা হয়েছে।`);
}
