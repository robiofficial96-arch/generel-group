import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import { replyTicket } from "./actions";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { SubmitButton } from "@/components/ConfirmButton";
import { EmptyState, Flash, PageHeader, Section } from "@/components/ui";
import { fmtDateTime, ref } from "@/lib/format";
import { readFlash, type FlashParams } from "@/lib/flash";

export const instant = false;

export default async function AdminSupportPage({ searchParams }: { searchParams: FlashParams }) {
  const admin = await requireAdminUser();
  const { ok, error } = await readFlash(searchParams);
  const tickets = await prisma.supportTicket.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { user: { select: { name: true, mobile: true } } },
    take: 100,
  });

  return (
    <AppShell user={admin}>
      <PageHeader title="Support Tickets" subtitle={`${tickets.filter((t) => t.status === "OPEN").length} টি open ticket।`} />
      <Flash ok={ok} error={error} />
      <Section flush title="All Tickets">
        {tickets.length === 0 ? <EmptyState icon="support" title="কোনো ticket নেই" /> : (
          <ul>
            {tickets.map((t) => (
              <li key={t.id} className="border-b border-[var(--border-color)] p-5 last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{t.subject}</p>
                    <p className="text-xs text-[var(--muted)]">{ref("TKT", t.id)} · {t.user.name} ({t.user.mobile}) · {fmtDateTime(t.createdAt)}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{t.message}</p>
                {t.adminReply && <p className="mt-2 rounded-xl bg-[#eff5ff] p-3 text-sm"><span className="font-semibold text-[var(--royal)]">Reply: </span>{t.adminReply}</p>}
                {t.status !== "CLOSED" && (
                  <form action={replyTicket} className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="id" value={t.id} />
                    <input name="reply" required minLength={2} placeholder="Reply লেখো…" aria-label="Reply" className="input-field" />
                    <SubmitButton className="btn-primary shrink-0">Reply</SubmitButton>
                    <button name="close" value="1" className="btn-outline shrink-0">Reply &amp; close</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </AppShell>
  );
}
