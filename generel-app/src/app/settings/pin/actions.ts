"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { notify } from "@/lib/notify";
import { attempt, flash } from "@/lib/flash";

export async function setTransactionPin(formData: FormData) {
  const error = await attempt(async () => {
    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated");

    const pin = String(formData.get("pin") ?? "");
    const confirmPin = String(formData.get("confirmPin") ?? "");

    if (!/^\d{4,6}$/.test(pin)) throw new Error("PIN অবশ্যই ৪-৬ সংখ্যার হতে হবে");
    if (pin !== confirmPin) throw new Error("PIN দুটি মিলছে না");

    const transactionPinHash = await bcrypt.hash(pin, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: session.user.id }, data: { transactionPinHash } });
      await notify(tx, {
        userId: session.user.id,
        category: "ACCOUNT",
        title: "Transaction PIN আপডেট হয়েছে",
        body: "তোমার Transaction PIN সেট/পরিবর্তন করা হয়েছে। তুমি নিজে না করে থাকলে এখনই admin-কে জানাও।",
        link: "/settings/pin",
      });
    });
  });

  if (error) flash("/settings/pin", "error", error);
  flash("/settings/pin", "ok", "Transaction PIN সেভ হয়েছে।");
}
