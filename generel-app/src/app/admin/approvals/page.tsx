import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import { approveDeposit, rejectDeposit } from "../deposits/actions";
import { approveWithdrawal, rejectWithdrawal } from "../withdrawals/actions";
import AppShell from "@/components/AppShell";
import ReviewActions from "@/components/ReviewActions";
import { EmptyState, Flash, PageHeader, Section, SeeAll } from "@/components/ui";
import { fmtDateTime, METHOD_LABEL, tk } from "@/lib/format";
import { readFlash, type FlashParams } from "@/lib/flash";

export const instant = false;

export default async function ApprovalsPage({ searchParams }: { searchParams: FlashParams }) {
  const admin = await requireAdminUser();
  const { ok, error } = await readFlash(searchParams);

  const [deposits, withdrawals, tickets] = await Promise.all([
    prisma.deposit.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, include: { user: { select: { name: true, mobile: true } } }, take: 50 }),
    prisma.withdrawal.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" }, include: { user: { select: { name: true, mobile: true } } }, take: 50 }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
  ]);
  const back = "/admin/approvals";

  return (
    <AppShell user={admin}>
      <PageHeader title="Approvals" subtitle={`${deposits.length + withdrawals.length} টি request অপেক্ষায়।`} />
      <Flash ok={ok} error={error} />

      <div className="stack">
        <Section title={`Pending Deposits (${deposits.length})`} flush action={<SeeAll href="/admin/deposits?status=PENDING" />}>
          {deposits.length === 0 ? (
            <EmptyState icon="check" title="কোনো pending deposit নেই" />
          ) : (
            <ul>
              {deposits.map((d) => (
                <li key={d.id} className="flex flex-col gap-3 border-b border-[var(--border-color)] p-5 last:border-b-0 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{d.user.name} <span className="font-mono text-xs font-normal text-[var(--muted)]">{d.user.mobile}</span></p>
                    <p className="text-sm text-[var(--muted)]">
                      {METHOD_LABEL[d.method]} · Ref <span className="font-mono">{d.reference ?? "—"}</span> · {fmtDateTime(d.createdAt)}
                    </p>
                    <p className="mt-1 font-display text-lg font-extrabold tabular-nums">{tk(d.amount)}</p>
                  </div>
                  <ReviewActions idField="depositId" id={d.id} approve={approveDeposit} reject={rejectDeposit} back={back}
                    approveMessage={`${tk(d.amount)} ${d.user.name}-এর G-Wallet এ জমা হবে।`} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={`Pending Withdrawals (${withdrawals.length})`} flush action={<SeeAll href="/admin/withdrawals?status=PENDING" />}>
          {withdrawals.length === 0 ? (
            <EmptyState icon="check" title="কোনো pending withdrawal নেই" />
          ) : (
            <ul>
              {withdrawals.map((w) => (
                <li key={w.id} className="flex flex-col gap-3 border-b border-[var(--border-color)] p-5 last:border-b-0 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{w.user.name} <span className="font-mono text-xs font-normal text-[var(--muted)]">{w.user.mobile}</span></p>
                    <p className="text-sm text-[var(--muted)]">
                      {w.sourceWallet === "C_WALLET" ? "C-Wallet" : "R-Wallet"} · {METHOD_LABEL[w.payoutMethod].split(" (")[0]} · {w.accountDetails ?? "—"}
                    </p>
                    <p className="mt-1 text-sm">
                      Gross {tk(w.amount)} · Fee {tk(w.feeAmount)} · <span className="font-display text-lg font-extrabold tabular-nums">Net {tk(w.netAmount)}</span>
                    </p>
                  </div>
                  <ReviewActions idField="withdrawalId" id={w.id} approve={approveWithdrawal} reject={rejectWithdrawal} back={back}
                    approveMessage={`${w.user.name}-কে net ${tk(w.netAmount)} payout করতে হবে।`} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Link href="/admin/support" className="card flex items-center justify-between p-5 hover:border-[#cfdcf8]">
          <span className="font-semibold">Open support tickets</span>
          <span className="badge badge-pending">{tickets}</span>
        </Link>
      </div>
    </AppShell>
  );
}
