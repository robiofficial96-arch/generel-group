import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import { approveWithdrawal, rejectWithdrawal } from "./actions";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import ReviewActions from "@/components/ReviewActions";
import { EmptyState, Flash, PageHeader, Section, Tabs } from "@/components/ui";
import { CHANNEL_LABEL, fmtDateTime, METHOD_LABEL, ref, tk } from "@/lib/format";
import { readFlash, type FlashParams } from "@/lib/flash";

export const instant = false;

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export default async function AdminWithdrawalsPage({ searchParams }: { searchParams: FlashParams }) {
  const admin = await requireAdminUser();
  const { ok, error, params } = await readFlash(searchParams);
  const raw = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = STATUSES.find((s) => s === raw);

  const [rows, counts] = await Promise.all([
    prisma.withdrawal.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, mobile: true } } },
      take: 200,
    }),
    prisma.withdrawal.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const back = status ? `/admin/withdrawals?status=${status}` : "/admin/withdrawals";

  return (
    <AppShell user={admin}>
      <PageHeader title="Withdrawals" subtitle="Payout details দেখে approve করো, payment শেষে mark করো।" />
      <Flash ok={ok} error={error} />
      <div className="stack">
        <Tabs
          active={status ?? "all"}
          tabs={[
            { key: "all", label: "All", href: "/admin/withdrawals" },
            { key: "PENDING", label: "Pending", href: "/admin/withdrawals?status=PENDING", count: count("PENDING") },
            { key: "APPROVED", label: "Approved", href: "/admin/withdrawals?status=APPROVED" },
            { key: "REJECTED", label: "Rejected", href: "/admin/withdrawals?status=REJECTED" },
          ]}
        />
        <Section title="Withdrawal Requests" subtitle={`${rows.length} টি`} flush>
          {rows.length === 0 ? (
            <EmptyState icon="withdraw" title="কোনো withdrawal নেই" />
          ) : (
            <div className="table-wrap">
              <table className="table-base table-cards">
                <thead>
                  <tr>
                    <th>Withdrawal</th><th>User</th><th>Wallet</th><th>Payout</th><th>Date</th>
                    <th className="!text-right">Gross</th><th className="!text-right">Fee</th><th className="!text-right">Net</th>
                    <th>Status</th><th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((w) => (
                    <tr key={w.id}>
                      <td className="cell-main font-mono text-[13px]">{ref("WDR", w.id)}</td>
                      <td data-label="User">{w.user.name}<span className="cell-muted block font-mono">{w.user.mobile}</span></td>
                      <td data-label="Wallet">{w.sourceWallet === "C_WALLET" ? "C-Wallet" : "R-Wallet"}</td>
                      <td data-label="Payout">
                        {METHOD_LABEL[w.payoutMethod].split(" (")[0]}
                        <span className="cell-muted block">{CHANNEL_LABEL[w.channel]}</span>
                        <span className="cell-muted block break-all">{w.accountDetails ?? "—"}</span>
                      </td>
                      <td data-label="Date" className="cell-muted whitespace-nowrap">{fmtDateTime(w.createdAt)}</td>
                      <td data-label="Gross" className="tabular-nums md:text-right">{tk(w.amount)}</td>
                      <td data-label="Fee" className="tabular-nums md:text-right">{tk(w.feeAmount)}</td>
                      <td data-label="Net" className="font-semibold tabular-nums md:text-right">{tk(w.netAmount)}</td>
                      <td data-label="Status">
                        <StatusBadge status={w.status} />
                        {w.rejectReason && <span className="cell-muted mt-1 block">{w.rejectReason}</span>}
                      </td>
                      <td className="cell-actions">
                        {w.status === "PENDING" && (
                          <ReviewActions
                            idField="withdrawalId"
                            id={w.id}
                            approve={approveWithdrawal}
                            reject={rejectWithdrawal}
                            back={back}
                            approveMessage={`${w.user.name}-কে net ${tk(w.netAmount)} পাঠাতে হবে (${w.accountDetails ?? "—"}). Approve করার পর payout সম্পন্ন করো।`}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </AppShell>
  );
}
