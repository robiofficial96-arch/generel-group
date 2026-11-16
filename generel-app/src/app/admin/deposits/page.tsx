import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import { approveDeposit, rejectDeposit } from "./actions";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import ReviewActions from "@/components/ReviewActions";
import { EmptyState, Flash, PageHeader, Section, Tabs } from "@/components/ui";
import { fmtDateTime, METHOD_LABEL, ref, tk } from "@/lib/format";
import { readFlash, type FlashParams } from "@/lib/flash";

export const instant = false;

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export default async function AdminDepositsPage({ searchParams }: { searchParams: FlashParams }) {
  const admin = await requireAdminUser();
  const { ok, error, params } = await readFlash(searchParams);
  const raw = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = STATUSES.find((s) => s === raw);

  const [rows, counts] = await Promise.all([
    prisma.deposit.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, mobile: true } } },
      take: 200,
    }),
    prisma.deposit.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const back = status ? `/admin/deposits?status=${status}` : "/admin/deposits";

  return (
    <AppShell user={admin}>
      <PageHeader title="Deposits" subtitle="Payment reference যাচাই করে approve বা reject করো।" />
      <Flash ok={ok} error={error} />
      <div className="stack">
        <Tabs
          active={status ?? "all"}
          tabs={[
            { key: "all", label: "All", href: "/admin/deposits" },
            { key: "PENDING", label: "Pending", href: "/admin/deposits?status=PENDING", count: count("PENDING") },
            { key: "APPROVED", label: "Approved", href: "/admin/deposits?status=APPROVED" },
            { key: "REJECTED", label: "Rejected", href: "/admin/deposits?status=REJECTED" },
          ]}
        />
        <Section title="Deposit Requests" subtitle={`${rows.length} টি`} flush>
          {rows.length === 0 ? (
            <EmptyState icon="deposit" title="কোনো deposit নেই" />
          ) : (
            <div className="table-wrap">
              <table className="table-base table-cards">
                <thead>
                  <tr>
                    <th>Deposit</th><th>User</th><th>Method</th><th>Reference</th><th>Date</th>
                    <th className="!text-right">Amount</th><th>Status</th><th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.id}>
                      <td className="cell-main font-mono text-[13px]">{ref("DEP", d.id)}</td>
                      <td data-label="User">{d.user.name}<span className="cell-muted block font-mono">{d.user.mobile}</span></td>
                      <td data-label="Method">{METHOD_LABEL[d.method]}</td>
                      <td data-label="Reference" className="font-mono text-[13px]">{d.reference ?? "—"}</td>
                      <td data-label="Date" className="cell-muted whitespace-nowrap">{fmtDateTime(d.createdAt)}</td>
                      <td data-label="Amount" className="font-semibold tabular-nums md:text-right">{tk(d.amount)}</td>
                      <td data-label="Status">
                        <StatusBadge status={d.status} />
                        {d.rejectReason && <span className="cell-muted mt-1 block">{d.rejectReason}</span>}
                      </td>
                      <td className="cell-actions">
                        {d.status === "PENDING" && (
                          <ReviewActions
                            idField="depositId"
                            id={d.id}
                            approve={approveDeposit}
                            reject={rejectDeposit}
                            back={back}
                            approveMessage={`${tk(d.amount)} ${d.user.name}-এর G-Wallet এ জমা হবে। Payment reference (${d.reference ?? "—"}) যাচাই করেছো?`}
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
