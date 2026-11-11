"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Only admin can do this");
  return session;
}

export async function approveDeposit(formData: FormData) {
  await requireAdmin();
  const depositId = formData.get("depositId") as string;

  const deposit = await prisma.deposit.findUnique({ where: { id: depositId } });
  if (!deposit || deposit.status !== "PENDING") return;

  await prisma.$transaction([
    prisma.deposit.update({
      where: { id: depositId },
      data: { status: "APPROVED", reviewedAt: new Date() },
    }),
    prisma.wallet.update({
      where: { userId: deposit.userId },
      data: { gWallet: { increment: deposit.amount } },
    }),
  ]);

  revalidatePath("/admin/deposits");
  revalidatePath("/dashboard");
}

export async function rejectDeposit(formData: FormData) {
  await requireAdmin();
  const depositId = formData.get("depositId") as string;

  await prisma.deposit.update({
    where: { id: depositId },
    data: { status: "REJECTED", reviewedAt: new Date() },
  });

  revalidatePath("/admin/deposits");
}
