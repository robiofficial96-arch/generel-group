import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import { EmptyState, PageHeader, Section, StatCard } from "@/components/ui";
import { fmtDate, num, ref, tk } from "@/lib/format";

export const instant = false;

export default async function AdminInvestmentsPage() {
  const admin = await requireAdminUser();
  const [investments, slots, total] = await Promise.all([
    prisma.investment.findMany({ orderBy: { investedAt: "desc" }, include: { user: { select: { name: true, mobile: true } }, roiSchedules: { select: { status: true } } }, take: 200 }),
    prisma.investmentSlot.findMany({ orderBy: { amount: "asc" }, include: { _count: { select: { investments: true } } } }),
    prisma.investment.aggregate({ _sum: { amount: true }, _count: true }),
  ]);
  const active = investments.filter((i) => i.roiSchedules.some((s) => s.status === "PENDING")).length;

  return (
    <AppShell user={admin}>
      <PageHeader title="Investments" subtitle="সব investment ও slot-wise সারাংশ।" />
      <div className="stack">
        <div className="grid-stats">
          <StatCard label="Total Invested" value={tk(total._sum.amount)} icon="invest" featured />
          <StatCard label="Investments" value={total._count} icon="file" tone="blue" />
          <StatCard label="Active" value={active} icon="repeat" tone="green" />
          <StatCard label="Completed" value={investments.length - active} icon="check" tone="slate" />
        </div>
        <Section title="Slots" subtitle="Slot amount সিস্টেম-নির্ধারিত (read-only)" flush>
          <div className="table-wrap"><table className="table-base table-cards">
            <thead><tr><th>Slot</th><th className="!text-right">Amount</th><th className="!text-right">Projected monthly</th><th className="!text-right">Purchased</th></tr></thead>
            <tbody>{slots.map((s, i) => (
              <tr key={s.id}><td className="cell-main">Slot {i + 1}</td><td data-label="Amount" className="tabular-nums md:text-right">{tk(s.amount)}</td><td data-label="Monthly" className="tabular-nums md:text-right">≈ {tk(Math.round(num(s.amount) / 9))}</td><td data-label="Purchased" className="tabular-nums md:text-right">{s._count.investments}</td></tr>
            ))}</tbody>
          </table></div>
        </Section>
        <Section title="All Investments" flush>
          {investments.length === 0 ? <EmptyState icon="invest" title="কোনো investment নেই" /> : (
            <div className="table-wrap"><table className="table-base table-cards">
              <thead><tr><th>Investment</th><th>User</th><th>Date</th><th className="!text-right">Amount</th><th>ROI paid</th></tr></thead>
              <tbody>{investments.map((i) => (
                <tr key={i.id}>
                  <td className="cell-main font-mono text-[13px]">{ref("INV", i.id)}</td>
                  <td data-label="User">{i.user.name}<span className="cell-muted block font-mono">{i.user.mobile}</span></td>
                  <td data-label="Date" className="cell-muted">{fmtDate(i.investedAt)}</td>
                  <td data-label="Amount" className="font-semibold tabular-nums md:text-right">{tk(i.amount)}</td>
                  <td data-label="ROI paid">{i.roiSchedules.filter((s) => s.status === "APPROVED").length} / 18</td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </Section>
      </div>
    </AppShell>
  );
}
