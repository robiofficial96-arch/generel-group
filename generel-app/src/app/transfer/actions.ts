"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { formatTk, notify } from "@/lib/notify";
import { attempt, flash } from "@/lib/flash";
import { RULES } from "@/lib/admin";

/** Recipient verification step: resolves a User ID (mobile) to a display name. */
export async function lookupRecipient(mobile: string): Promise<{ name: string } | { error: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Not authenticated" };

  const clean = mobile.trim();
  if (!clean) return { error: "প্রাপকের User ID দাও" };
  if (clean === session.user.mobile) return { error: "নিজের আইডিতে ট্রান্সফার করা যাবে না" };

  const user = await prisma.user.findUnique({
    where: { mobile: clean },
    select: { name: true, isBlocked: true },
  });
  if (!user || user.isBlocked) return { error: "এই User ID পাওয়া যায়নি" };
  return { name: user.name };
}

export async function createTransfer(formData: FormData) {
  let done = "";

  const error = await attempt(async () => {
    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated");

    const toMobile = String(formData.get("toMobile") ?? "").trim();
    const amount = Number(formData.get("amount"));
    const pin = String(formData.get("pin") ?? "");

    if (!Number.isFinite(amount) || amount <= 0) throw new Error("সঠিক amount দাও");

    const me = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!me?.transactionPinHash) {
      throw new Error("Transfer করার আগে Settings থেকে Transaction PIN সেট করো");
    }

    const pinValid = await bcrypt.compare(pin, me.transactionPinHash);
    if (!pinValid) throw new Error("PIN ভুল হয়েছে");

    const toUser = await prisma.user.findUnique({ where: { mobile: toMobile } });
    if (!toUser || toUser.isBlocked) throw new Error("প্রাপকের User ID পাওয়া যায়নি");
    if (toUser.id === me.id) throw new Error("নিজের আইডিতে ট্রান্সফার করা যাবে না");

    const feeAmount = Math.round(amount * RULES.transferFeeRate * 100) / 100;
    const received = amount - feeAmount;

    await prisma.$transaction(async (tx) => {
      const debited = await tx.wallet.updateMany({
        where: { userId: me.id, tWallet: { gte: amount } },
        data: { tWallet: { decrement: amount } },
      });
      if (debited.count === 0) throw new Error("T-Wallet এ পর্যাপ্ত ব্যালেন্স নেই");

      await tx.wallet.update({
        where: { userId: toUser.id },
        data: { tWallet: { increment: received } },
      });

      await tx.transfer.create({
        data: { fromUserId: me.id, toUserId: toUser.id, amount, feeAmount },
      });

      await notify(tx, {
        userId: me.id,
        category: "TRANSFER",
        title: "Transfer পাঠানো হয়েছে",
        body: `${toUser.name} (${toUser.mobile})-কে T-Wallet থেকে ${formatTk(amount)} পাঠানো হয়েছে। Charge ${formatTk(feeAmount)}, প্রাপক পেয়েছে ${formatTk(received)}।`,
        link: "/transfer",
      });

      await notify(tx, {
        userId: toUser.id,
        category: "TRANSFER",
        title: "Transfer পেয়েছো",
        body: `${me.name} (${me.mobile}) থেকে ${formatTk(received)} তোমার T-Wallet এ জমা হয়েছে।`,
        link: "/transfer",
      });
    });

    done = `${toUser.name}-কে ${formatTk(amount)} পাঠানো হয়েছে (প্রাপক পেয়েছে ${formatTk(received)})।`;
  });

  if (error) flash("/transfer", "error", error);
  revalidatePath("/transfer");
  revalidatePath("/dashboard");
  flash("/transfer", "ok", done);
}
