"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { processInvestmentCommissions } from "@/lib/commission";
import { generateRoiSchedule } from "@/lib/roi";

export async function buyInvestmentSlot(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const slotId = formData.get("slotId") as string;

  await prisma.$transaction(async (tx) => {
    const slot = await tx.investmentSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new Error("Slot পাওয়া যায়নি");

    const wallet = await tx.wallet.findUnique({
      where: { userId: session.user.id },
    });
    if (!wallet || wallet.gWallet.lessThan(slot.amount)) {
      throw new Error("G-Wallet এ পর্যাপ্ত ব্যালেন্স নেই");
    }

    const investor = await tx.user.findUnique({
      where: { id: session.user.id },
      select: { placedSide: true },
    });

    await tx.wallet.update({
      where: { userId: session.user.id },
      data: { gWallet: { decrement: slot.amount } },
    });

    const investment = await tx.investment.create({
      data: {
        userId: session.user.id,
        slotId: slot.id,
        amount: slot.amount,
        side: investor?.placedSide ?? null,
      },
    });

    await processInvestmentCommissions(tx, {
      investmentId: investment.id,
      investorId: session.user.id,
      amount: slot.amount,
    });

    await generateRoiSchedule(tx, investment.id, slot.amount);
  });

  revalidatePath("/invest");
  revalidatePath("/dashboard");
}
