import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createTicket } from "./actions";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { SubmitButton } from "@/components/ConfirmButton";
import { EmptyState, Flash, PageHeader, Section } from "@/components/ui";
import { fmtDateTime, ref } from "@/lib/format";
import { readFlash, type FlashParams } from "@/lib/flash";

export const instant = false;

const FAQ: [string, string][] = [
  ["Deposit কত সময়ে approve হয়?", "Payment reference যাচাই করার পর admin approve করে। Approve হলে amount G-Wallet এ জমা হয় এবং notification আসে।"],
  ["Withdrawal-এ কত charge কাটে?", "প্রতি withdrawal-এ 10% transaction charge। সর্বনিম্ন withdrawal ৳1,000। Submit করার আগে charge ও net payable দেখানো হয়।"],
  ["Team matching commission কখন পাবো?", "Left ও Right side-এর carry-forward volume হুবহু সমান হলে matched volume-এর 5% C-Wallet এ জমা হয়। অমিল অংশ carry forward থাকে।"],
  ["নাম বা mobile number বদলাবো কীভাবে?", "এগুলো শুধু admin পরিবর্তন করতে পারে। নিচের form দিয়ে একটি support ticket পাঠাও।"],
  ["Transaction PIN ভুলে গেলে?", "Settings → Transaction PIN থেকে নতুন PIN সেট করো। সমস্যা হলে support ticket পাঠাও।"],
];

export default async function SupportPage({ searchParams }: { searchParams: FlashParams }) {
  const sessionUser = await requireUser();
  const { ok, error } = await readFlash(searchParams);
  const tickets = await prisma.supportTicket.findMany({
    where: { userId: sessionUser.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell user={sessionUser}>
      <PageHeader title="Support Center" subtitle="FAQ দেখো অথবা support ticket পাঠাও।" />
      <Flash ok={ok} error={error} />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="stack">
          <Section title="Create Support Ticket">
            <form action={createTicket} className="space-y-4">
              <div>
                <label className="label-text" htmlFor="tk-subject">Subject</label>
                <input id="tk-subject" name="subject" required minLength={4} maxLength={120} placeholder="যেমন: Mobile number পরিবর্তন" className="input-field" />
              </div>
              <div>
                <label className="label-text" htmlFor="tk-message">Message</label>
                <textarea id="tk-message" name="message" required minLength={10} maxLength={2000} rows={5} placeholder="সমস্যাটি বিস্তারিত লেখো…" className="input-field" />
              </div>
              <SubmitButton className="btn-primary w-full">Submit Ticket</SubmitButton>
            </form>
          </Section>

          <Section title="My Tickets" subtitle={`${tickets.length} টি ticket`} flush>
            {tickets.length === 0 ? (
              <EmptyState icon="support" title="কোনো ticket নেই" text="সাহায্য দরকার হলে উপরের form ব্যবহার করো।" />
            ) : (
              <ul>
                {tickets.map((t) => (
                  <li key={t.id} className="border-b border-[var(--border-color)] p-5 last:border-b-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{t.subject}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {ref("TKT", t.id)} · {fmtDateTime(t.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--muted)]">{t.message}</p>
                    {t.adminReply && (
                      <div className="mt-3 rounded-2xl bg-[#eff5ff] p-3 text-sm">
                        <p className="text-xs font-semibold text-[var(--royal)]">Support reply</p>
                        <p className="mt-1 whitespace-pre-wrap">{t.adminReply}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <Section title="Frequently Asked Questions" flush>
          <div>
            {FAQ.map(([question, answer]) => (
              <details key={question} className="group border-b border-[var(--border-color)] last:border-b-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold">
                  {question}
                  <span className="text-[var(--muted)] transition group-open:rotate-45">+</span>
                </summary>
                <p className="px-5 pb-4 text-sm text-[var(--muted)]">{answer}</p>
              </details>
            ))}
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
