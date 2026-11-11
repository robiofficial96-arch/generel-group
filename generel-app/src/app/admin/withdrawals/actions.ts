"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Only admin can do this");
}

export async function approveWithdrawal(formData: FormData) {
  await requireAdmin();
  const id = formData.get("withdrawalId") as string;

  await prisma.withdrawal.update({
    where: { id },
    data: { status: "APPROVED", processedAt: new Date() },
  });

  revalidatePath("/admin/withdrawals");
}

export async function rejectWithdrawal(formData: FormData) {
  await requireAdmin();
  const id = formData.get("withdrawalId") as string;

  await prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawal.findUnique({ where: { id } });
    if (!withdrawal || withdrawal.status !== "PENDING") return;

    await tx.withdrawal.update({
      where: { id },
      data: { status: "REJECTED", processedAt: new Date() },
    });

    await tx.wallet.update({
      where: { userId: withdrawal.userId },
      data:
        withdrawal.sourceWallet === "C_WALLET"
          ? { cWallet: { increment: withdrawal.amount } }
          : { rWallet: { increment: withdrawal.amount } },
    });
  });

  revalidatePath("/admin/withdrawals");
  revalidatePath("/dashboard");
}
