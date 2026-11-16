"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { notify, newMemberNotification, welcomeNotification } from "@/lib/notify";
import { logAdmin, requireAdmin } from "@/lib/admin";
import { attempt, flash } from "@/lib/flash";

export async function createUser(formData: FormData) {
  const error = await attempt(async () => {
    const adminId = await requireAdmin();

    const name = String(formData.get("name") ?? "").trim();
    const mobile = String(formData.get("mobile") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const role = formData.get("role") as "ADMIN" | "AGENT" | "CUSTOMER";
    const uplineMobile = String(formData.get("uplineMobile") ?? "").trim();
    const side = (formData.get("side") as "LEFT" | "RIGHT" | "") || null;

    if (name.length < 2) throw new Error("নাম লেখো");
    if (!/^01\d{9}$/.test(mobile)) throw new Error("সঠিক ১১ ডিজিটের মোবাইল নম্বর দাও");
    if (password.length < 8) throw new Error("Password কমপক্ষে 8 অক্ষরের হতে হবে");
    if (!["ADMIN", "AGENT", "CUSTOMER"].includes(role)) throw new Error("Role বাছাই করো");
    if (await prisma.user.findUnique({ where: { mobile } })) throw new Error("এই Mobile দিয়ে আগে থেকেই অ্যাকাউন্ট আছে");

    const passwordHash = await bcrypt.hash(password, 10);
    const upline = uplineMobile ? await prisma.user.findUnique({ where: { mobile: uplineMobile } }) : null;
    if (uplineMobile && !upline) throw new Error("Upline mobile পাওয়া যায়নি");
    if (upline && !side) throw new Error("Upline দিলে Left/Right side বাছাই করতে হবে");

    await prisma.$transaction(async (tx) => {
      if (upline && side) {
        const fresh = await tx.user.findUniqueOrThrow({ where: { id: upline.id } });
        if (side === "LEFT" ? fresh.leftChildId : fresh.rightChildId) {
          throw new Error(`Upline-এর ${side} side আগে থেকেই পূর্ণ`);
        }
      }

      const created = await tx.user.create({
        data: {
          name,
          mobile,
          passwordHash,
          role,
          uplineId: upline?.id ?? null,
          placedSide: upline ? side : null,
          wallet: { create: {} },
          matchingLedger: { create: {} },
        },
      });

      if (upline && side) {
        await tx.user.update({
          where: { id: upline.id },
          data: side === "LEFT" ? { leftChildId: created.id } : { rightChildId: created.id },
        });
        await notify(tx, newMemberNotification(upline.id, name, mobile, side));
      }

      await notify(tx, welcomeNotification(created.id, name));
      await logAdmin(tx, adminId, "USER_CREATED", created.id, { mobile, role });
    });
  });

  revalidatePath("/admin/users");
  if (error) flash("/admin/users", "error", error);
  flash("/admin/users", "ok", "User তৈরি হয়েছে।");
}

export async function updateUser(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const back = `/admin/users/${id}`;

  const error = await attempt(async () => {
    const adminId = await requireAdmin();
    const name = String(formData.get("name") ?? "").trim();
    const mobile = String(formData.get("mobile") ?? "").trim();

    if (name.length < 2) throw new Error("নাম লেখো");
    if (!/^01\d{9}$/.test(mobile)) throw new Error("সঠিক ১১ ডিজিটের মোবাইল নম্বর দাও");

    const before = await prisma.user.findUniqueOrThrow({ where: { id } });
    const clash = await prisma.user.findUnique({ where: { mobile } });
    if (clash && clash.id !== id) throw new Error("এই Mobile অন্য account-এ ব্যবহৃত");
    if (before.name === name && before.mobile === mobile) throw new Error("কোনো পরিবর্তন নেই");

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { name, mobile } });
      await notify(tx, {
        userId: id,
        category: "ACCOUNT",
        title: "Account তথ্য আপডেট হয়েছে",
        body: "Admin তোমার account-এর নাম/মোবাইল তথ্য আপডেট করেছে।",
        link: "/profile",
      });
      await logAdmin(tx, adminId, "USER_UPDATED", id, {
        from: { name: before.name, mobile: before.mobile },
        to: { name, mobile },
      });
    });
  });

  revalidatePath("/admin/users");
  revalidatePath(back);
  if (error) flash(back, "error", error);
  flash(back, "ok", "User তথ্য আপডেট হয়েছে।");
}

export async function toggleBlock(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const back = `/admin/users/${id}`;

  const error = await attempt(async () => {
    const adminId = await requireAdmin();
    if (id === adminId) throw new Error("নিজের account deactivate করা যাবে না");

    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { isBlocked: !user.isBlocked } });
      await logAdmin(tx, adminId, user.isBlocked ? "USER_ACTIVATED" : "USER_DEACTIVATED", id);
    });
  });

  revalidatePath("/admin/users");
  revalidatePath(back);
  if (error) flash(back, "error", error);
  flash(back, "ok", "Account status আপডেট হয়েছে।");
}

export async function resetPassword(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const back = `/admin/users/${id}`;

  const error = await attempt(async () => {
    const adminId = await requireAdmin();
    const password = String(formData.get("password") ?? "");
    if (password.length < 8) throw new Error("Password কমপক্ষে 8 অক্ষরের হতে হবে");

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: { passwordHash } });
      await notify(tx, {
        userId: id,
        category: "ACCOUNT",
        title: "Password reset হয়েছে",
        body: "Admin তোমার login password reset করেছে। নতুন password দিয়ে login করে পরিবর্তন করে নাও।",
        link: "/profile",
      });
      await logAdmin(tx, adminId, "USER_PASSWORD_RESET", id);
    });
  });

  if (error) flash(back, "error", error);
  flash(back, "ok", "Password reset হয়েছে।");
}
