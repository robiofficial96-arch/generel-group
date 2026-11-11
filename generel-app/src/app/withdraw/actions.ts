"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const MIN_WITHDRAW = 1000;
const FEE_RATE = 0.1;

export async function requestWithdrawal(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const amount = Number(formData.get("amount"));
  const sourceWallet = formData.get("sourceWallet") as "C_WALLET" | "R_WALLET";
  const channel = formData.get("channel") as "ADMIN" | "AGENT" | "ID_TO_ID";
  const payoutMethod = formData.get("payoutMethod") as "BANK" | "MFS" | "DIGITAL";

  if (amount < MIN_WITHDRAW) {
    throw new Error(`সর্বনিম্ন উইথড্র ${MIN_WITHDRAW} Tk`);
  }

  await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId: session.user.id } });
    if (!wallet) throw new Error("Wallet পাওয়া যায়নি");

    const balanceField = sourceWallet === "C_WALLET" ? wallet.cWallet : wallet.rWallet;
    if (balanceField.lessThan(amount)) {
      throw new Error("পর্যাপ্ত ব্যালেন্স নেই");
    }

    const feeAmount = amount * FEE_RATE;
    const netAmount = amount - feeAmount;

    await tx.wallet.update({
      where: { userId: session.user.id },
      data:
        sourceWallet === "C_WALLET"
          ? { cWallet: { decrement: amount } }
          : { rWallet: { decrement: amount } },
    });

    await tx.withdrawal.create({
      data: {
        userId: session.user.id,
        sourceWallet,
        amount,
        feeAmount,
        netAmount,
        channel,
        payoutMethod,
      },
    });
  });

  revalidatePath("/withdraw");
  revalidatePath("/dashboard");
}
