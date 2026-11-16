"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { notify } from "@/lib/notify";
import { attempt, flash } from "@/lib/flash";

export async function changePassword(formData: FormData) {
  const error = await attempt(async () => {
    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated");

    const current = String(formData.get("current") ?? "");
    const next = String(formData.get("next") ?? "");
    const confirm = String(formData.get("confirm") ?? "");

    if (next.length < 8) throw new Error("নতুন password কমপক্ষে 8 অক্ষরের হতে হবে");
    if (next !== confirm) throw new Error("নতুন password দুটি মিলছে না");

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
      throw new Error("বর্তমান password ভুল");
    }

    const passwordHash = await bcrypt.hash(next, 10);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
      await notify(tx, {
        userId: user.id,
        category: "ACCOUNT",
        title: "Password পরিবর্তন হয়েছে",
        body: "তোমার login password পরিবর্তন করা হয়েছে। তুমি নিজে না করে থাকলে এখনই support-এ জানাও।",
        link: "/profile",
      });
    });
  });

  if (error) flash("/profile", "error", error);
  flash("/profile", "ok", "Password সফলভাবে পরিবর্তন হয়েছে।");
}
