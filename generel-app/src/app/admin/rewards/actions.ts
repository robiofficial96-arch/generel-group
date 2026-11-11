"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Only admin can do this");
}

export async function updateRewardStatus(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const status = formData.get("status") as "PENDING_CLAIM" | "APPROVED" | "DELIVERED";

  await prisma.rewardClaim.update({ where: { id }, data: { status } });
  revalidatePath("/admin/rewards");
}
