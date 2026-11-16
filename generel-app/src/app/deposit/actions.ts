"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { formatTk, notify, notifyAdmins } from "@/lib/notify";
import { attempt, flash } from "@/lib/flash";

const METHODS = ["BANK", "MFS", "DIGITAL"] as const;

export async function createDeposit(formData: FormData) {
  const error = await attempt(async () => {
    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated");

    const amount = Number(formData.get("amount"));
    const method = formData.get("method") as (typeof METHODS)[number];
    const reference = String(formData.get("reference") ?? "").trim();

    if (!Number.isFinite(amount) || amount <= 0) throw new Error("সঠিক amount দাও");
    if (!METHODS.includes(method)) throw new Error("Payment method বাছাই করো");
    if (reference.length < 4) throw new Error("Transaction reference / TrxID দাও");

    const userId = session.user.id;
    const who = `${session.user.name ?? "User"} (${session.user.mobile})`;

    await prisma.$transaction(async (tx) => {
      await tx.deposit.create({
        data: { userId, amount, method, reference: reference.slice(0, 80) },
      });

      await notify(tx, {
        userId,
        category: "DEPOSIT",
        title: "Deposit request জমা হয়েছে",
        body: `${formatTk(amount)} (${method}) deposit request admin verification-এর অপেক্ষায় আছে।`,
        link: "/deposit",
      });

      await notifyAdmins(
        tx,
        {
          category: "DEPOSIT",
          title: "নতুন Deposit request",
          body: `${who} ${formatTk(amount)} (${method}) deposit request করেছে — review করো।`,
          link: "/admin/deposits",
        },
        { excludeUserId: userId }
      );
    });
  });

  if (error) flash("/deposit", "error", error);
  revalidatePath("/deposit");
  revalidatePath("/admin/deposits");
  flash("/deposit", "ok", "Deposit request জমা হয়েছে — admin verify করলে G-Wallet এ জমা হবে।");
}
