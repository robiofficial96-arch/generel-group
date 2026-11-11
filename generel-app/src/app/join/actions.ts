"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function joinViaReferral(formData: FormData) {
  const refMobile = formData.get("refMobile") as string;
  const name = formData.get("name") as string;
  const mobile = formData.get("mobile") as string;
  const password = formData.get("password") as string;
  const side = formData.get("side") as "LEFT" | "RIGHT";

  const upline = await prisma.user.findUnique({ where: { mobile: refMobile } });
  if (!upline) throw new Error("রেফারেল লিংক সঠিক না — referrer পাওয়া যায়নি");

  const slotTaken = side === "LEFT" ? upline.leftChildId !== null : upline.rightChildId !== null;
  if (slotTaken) {
    throw new Error(`Referrer-এর ${side} side আগে থেকেই পূর্ণ, অন্য side বেছে নাও`);
  }

  const existing = await prisma.user.findUnique({ where: { mobile } });
  if (existing) throw new Error("এই Mobile দিয়ে আগে থেকেই অ্যাকাউন্ট আছে");

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        mobile,
        passwordHash,
        role: "CUSTOMER",
        uplineId: upline.id,
        placedSide: side,
        wallet: { create: {} },
        matchingLedger: { create: {} },
      },
    });

    await tx.user.update({
      where: { id: upline.id },
      data: side === "LEFT" ? { leftChildId: newUser.id } : { rightChildId: newUser.id },
    });
  });

  redirect("/login?joined=1");
}
