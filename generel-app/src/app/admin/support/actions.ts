"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notify";
import { logAdmin, requireAdmin } from "@/lib/admin";
import { attempt, flash } from "@/lib/flash";

export async function replyTicket(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const close = formData.get("close") === "1";

  const error = await attempt(async () => {
    const adminId = await requireAdmin();
    const reply = String(formData.get("reply") ?? "").trim();
    if (reply.length < 2) throw new Error("Reply লেখো");

    await prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.update({
        where: { id },
        data: { adminReply: reply.slice(0, 2000), status: close ? "CLOSED" : "ANSWERED" },
      });
      await notify(tx, {
        userId: ticket.userId,
        category: "ACCOUNT",
        title: "Support ticket-এর উত্তর এসেছে",
        body: `"${ticket.subject.slice(0, 60)}" ticket-এ support team উত্তর দিয়েছে।`,
        link: "/support",
      });
      await logAdmin(tx, adminId, "TICKET_REPLIED", ticket.userId, { ticketId: id, closed: close });
    });
  });

  revalidatePath("/admin/support");
  revalidatePath("/admin/approvals");
  revalidatePath("/support");
  if (error) flash("/admin/support", "error", error);
  flash("/admin/support", "ok", "Reply পাঠানো হয়েছে।");
}
