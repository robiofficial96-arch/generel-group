"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { notify, newMemberNotification, welcomeNotification } from "@/lib/notify";
import { attempt, flash } from "@/lib/flash";

export async function joinViaReferral(formData: FormData) {
  const refMobile = String(formData.get("refMobile") ?? "").trim();
  const path = `/join?ref=${encodeURIComponent(refMobile)}`;

  const error = await attempt(async () => {
    const name = String(formData.get("name") ?? "").trim();
    const mobile = String(formData.get("mobile") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const side = formData.get("side") as "LEFT" | "RIGHT";

    if (name.length < 2) throw new Error("নাম লেখো");
    if (!/^01\d{9}$/.test(mobile)) throw new Error("সঠিক ১১ ডিজিটের মোবাইল নম্বর দাও (01XXXXXXXXX)");
    if (password.length < 8) throw new Error("Password কমপক্ষে 8 অক্ষরের হতে হবে");
    if (side !== "LEFT" && side !== "RIGHT") throw new Error("Placement side বাছাই করো");

    const upline = await prisma.user.findUnique({ where: { mobile: refMobile } });
    if (!upline) throw new Error("রেফারেল লিংক সঠিক না — referrer পাওয়া যায়নি");

    const existing = await prisma.user.findUnique({ where: { mobile } });
    if (existing) throw new Error("এই Mobile দিয়ে আগে থেকেই অ্যাকাউন্ট আছে");

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      // Re-check inside the transaction: the slot must still be free.
      const fresh = await tx.user.findUniqueOrThrow({ where: { id: upline.id } });
      const taken = side === "LEFT" ? fresh.leftChildId !== null : fresh.rightChildId !== null;
      if (taken) throw new Error(`Referrer-এর ${side} side আগে থেকেই পূর্ণ, অন্য side বেছে নাও`);

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

      await notify(tx, welcomeNotification(newUser.id, name));
      await notify(tx, newMemberNotification(upline.id, name, mobile, side));
    });
  });

  if (error) flash(path, "error", error);
  redirect("/login?joined=1");
}
