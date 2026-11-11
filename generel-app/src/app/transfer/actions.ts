"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const FEE_RATE = 0.1;

export async function createTransfer(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const toMobile = formData.get("toMobile") as string;
  const amount = Number(formData.get("amount"));
  const pin = formData.get("pin") as string;

  if (amount <= 0) throw new Error("সঠিক amount দাও");

  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!me?.transactionPinHash) {
    throw new Error("Transfer করার আগে Settings থেকে Transaction PIN সেট করো");
  }

  const pinValid = await bcrypt.compare(pin, me.transactionPinHash);
  if (!pinValid) throw new Error("PIN ভুল হয়েছে");

  const toUser = await prisma.user.findUnique({ where: { mobile: toMobile } });
  if (!toUser) throw new Error("প্রাপকের Mobile পাওয়া যায়নি");
  if (toUser.id === me.id) throw new Error("নিজের আইডিতে ট্রান্সফার করা যাবে না");

  const feeAmount = amount * FEE_RATE;

  await prisma.$transaction(async (tx) => {
    const myWallet = await tx.wallet.findUnique({ where: { userId: me.id } });
    if (!myWallet || myWallet.tWallet.lessThan(amount)) {
      throw new Error("T-Wallet এ পর্যাপ্ত ব্যালেন্স নেই");
    }

    await tx.wallet.update({
      where: { userId: me.id },
      data: { tWallet: { decrement: amount } },
    });

    await tx.wallet.update({
      where: { userId: toUser.id },
      data: { tWallet: { increment: amount - feeAmount } },
    });

    await tx.transfer.create({
      data: {
        fromUserId: me.id,
        toUserId: toUser.id,
        amount,
        feeAmount,
      },
    });
  });

  revalidatePath("/transfer");
  revalidatePath("/dashboard");
}
