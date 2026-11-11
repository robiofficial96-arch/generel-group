"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createDeposit(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const amount = formData.get("amount") as string;
  const method = formData.get("method") as "BANK" | "MFS" | "DIGITAL";

  await prisma.deposit.create({
    data: {
      userId: session.user.id,
      amount: Number(amount),
      method,
    },
  });

  revalidatePath("/deposit");
  revalidatePath("/admin/deposits");
}
