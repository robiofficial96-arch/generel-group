"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { formatTk, notify, notifyAdmins } from "@/lib/notify";
import { attempt, flash } from "@/lib/flash";
import { RULES } from "@/lib/admin";

export async function requestWithdrawal(formData: FormData) {
  const error = await attempt(async () => {
    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated");
    const userId = session.user.id;

    const amount = Number(formData.get("amount"));
    const sourceWallet = formData.get("sourceWallet") as "C_WALLET" | "R_WALLET";
    const channel = formData.get("channel") as "ADMIN" | "AGENT" | "ID_TO_ID";
    const payoutMethod = formData.get("payoutMethod") as "BANK" | "MFS" | "DIGITAL";
    const accountDetails = String(formData.get("accountDetails") ?? "").trim();

    if (!["C_WALLET", "R_WALLET"].includes(sourceWallet)) throw new Error("Wallet বাছাই করো");
    if (!["ADMIN", "AGENT", "ID_TO_ID"].includes(channel)) throw new Error("Withdrawal channel বাছাই করো");
    if (!["BANK", "MFS", "DIGITAL"].includes(payoutMethod)) throw new Error("Payout method বাছাই করো");
    if (!Number.isFinite(amount) || amount < RULES.minWithdraw) {
      throw new Error(`সর্বনিম্ন উইথড্র ${formatTk(RULES.minWithdraw)}`);
    }
    if (accountDetails.length < 5) throw new Error("Payout account details দাও");

    const feeAmount = Math.round(amount * RULES.withdrawFeeRate * 100) / 100;
    const netAmount = amount - feeAmount;
    const walletName = sourceWallet === "C_WALLET" ? "C-Wallet" : "R-Wallet";

    await prisma.$transaction(async (tx) => {
      // Conditional decrement — never overdraws under concurrent requests.
      const debited = await tx.wallet.updateMany({
        where:
          sourceWallet === "C_WALLET"
            ? { userId, cWallet: { gte: amount } }
            : { userId, rWallet: { gte: amount } },
        data:
          sourceWallet === "C_WALLET"
            ? { cWallet: { decrement: amount } }
            : { rWallet: { decrement: amount } },
      });
      if (debited.count === 0) throw new Error(`${walletName} এ পর্যাপ্ত ব্যালেন্স নেই`);

      await tx.withdrawal.create({
        data: {
          userId,
          sourceWallet,
          amount,
          feeAmount,
          netAmount,
          channel,
          payoutMethod,
          accountDetails: accountDetails.slice(0, 200),
        },
      });

      await notify(tx, {
        userId,
        category: "WITHDRAWAL",
        title: "Withdrawal request জমা হয়েছে",
        body: `${walletName} থেকে ${formatTk(amount)} withdrawal request pending আছে। Charge ${formatTk(feeAmount)}, net payable ${formatTk(netAmount)}।`,
        link: "/withdraw",
      });

      await notifyAdmins(
        tx,
        {
          category: "WITHDRAWAL",
          title: "নতুন Withdrawal request",
          body: `${session.user.name ?? "User"} (${session.user.mobile}) ${formatTk(amount)} withdrawal request করেছে (net ${formatTk(netAmount)}) — review করো।`,
          link: "/admin/withdrawals",
        },
        { excludeUserId: userId }
      );
    });
  });

  if (error) flash("/withdraw", "error", error);
  revalidatePath("/withdraw");
  revalidatePath("/admin/withdrawals");
  revalidatePath("/dashboard");
  flash("/withdraw", "ok", "Withdrawal request জমা হয়েছে — admin approve করলে payout হবে।");
}
