"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createUser(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    throw new Error("Only admin can create users");
  }

  const name = formData.get("name") as string;
  const mobile = formData.get("mobile") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "ADMIN" | "AGENT" | "CUSTOMER";
  const uplineMobile = (formData.get("uplineMobile") as string | null)?.trim();
  const side = formData.get("side") as "LEFT" | "RIGHT" | null;

  const passwordHash = await bcrypt.hash(password, 10);

  if (!uplineMobile) {
    await prisma.user.create({
      data: {
        name,
        mobile,
        passwordHash,
        role,
        wallet: { create: {} },
        matchingLedger: { create: {} },
      },
    });
    revalidatePath("/admin/users");
    return;
  }

  const upline = await prisma.user.findUnique({ where: { mobile: uplineMobile } });
  if (!upline) throw new Error("Upline mobile পাওয়া যায়নি");
  if (!side) throw new Error("Left/Right side বাছাই করতে হবে");

  const slotTaken =
    side === "LEFT" ? upline.leftChildId !== null : upline.rightChildId !== null;
  if (slotTaken) {
    throw new Error(`Upline-এর ${side} side আগে থেকেই পূর্ণ`);
  }

  await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        mobile,
        passwordHash,
        role,
        uplineId: upline.id,
        placedSide: side,
        wallet: { create: {} },
        matchingLedger: { create: {} },
      },
    });

    await tx.user.update({
      where: { id: upline.id },
      data:
        side === "LEFT"
          ? { leftChildId: newUser.id }
          : { rightChildId: newUser.id },
    });
  });

  revalidatePath("/admin/users");
}
