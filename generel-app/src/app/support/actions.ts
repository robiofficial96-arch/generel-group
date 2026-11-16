"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { notify, notifyAdmins } from "@/lib/notify";
import { attempt, flash } from "@/lib/flash";

export async function createTicket(formData: FormData) {
  const error = await attempt(async () => {
    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated");

    const subject = String(formData.get("subject") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    if (subject.length < 4) throw new Error("Subject লেখো");
    if (message.length < 10) throw new Error("সমস্যাটি একটু বিস্তারিত লেখো");

    await prisma.$transaction(async (tx) => {
      await tx.supportTicket.create({
        data: { userId: session.user.id, subject: subject.slice(0, 120), message: message.slice(0, 2000) },
      });
      await notify(tx, {
        userId: session.user.id,
        category: "ACCOUNT",
        title: "Support ticket জমা হয়েছে",
        body: `"${subject.slice(0, 60)}" — support team শীঘ্রই উত্তর দেবে।`,
        link: "/support",
      });
      await notifyAdmins(
        tx,
        {
          category: "ACCOUNT",
          title: "নতুন Support ticket",
          body: `${session.user.name ?? "User"} (${session.user.mobile}): ${subject.slice(0, 80)}`,
          link: "/admin/support",
        },
        { excludeUserId: session.user.id }
      );
    });
  });

  if (error) flash("/support", "error", error);
  revalidatePath("/support");
  revalidatePath("/admin/support");
  flash("/support", "ok", "Ticket জমা হয়েছে — উত্তর এলে notification পাবে।");
}
