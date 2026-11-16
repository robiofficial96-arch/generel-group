import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import { BarChart, PageHeader, Section, StatCard } from "@/components/ui";
import { num, tk } from "@/lib/format";
import { lastMonths, monthKey } from "@/lib/activity";

export const instant = false;

export default async function AdminReportsPage() {
  const admin = await requireAdminUser();
  const since = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);
  const [dep, wd, inv, com, roi] = await Promise.all([
    prisma.deposit.findMany({ where: { status: "APPROVED", createdAt: { gte: since } }, select: { amount: true, createdAt: true } }),
    prisma.withdrawal.findMany({ where: { status: "APPROVED", createdAt: { gte: since } }, select: { amount: true, createdAt: true } }),
    prisma.investment.findMany({ where: { investedAt: { gte: since } }, select: { amount: true, investedAt: true } }),
    prisma.commission.findMany({ where: { createdAt: { gte: since } }, select: { amount: true, createdAt: true } }),
    prisma.roiSchedule.findMany({ where: { status: "APPROVED", paidAt: { gte: since } }, select: { amount: true, paidAt: true } }),
  ]);

  const months = lastMonths(6);
  const series = (rows: { amount: unknown; d: Date | null }[]) => {
    const map = new Map(months.map((m) => [m.key, 0]));
    rows.forEach((r) => { if (r.d && map.has(monthKey(r.d))) map.set(monthKey(r.d), map.get(monthKey(r.d))! + num(r.amount as never)); });
    return months.map((m) => ({ label: m.label, value: map.get(m.key) ?? 0 }));
  };
  const sets = [
    { title: "Deposits", data: series(dep.map((r) => ({ amount: r.amount, d: r.createdAt }))) },
    { title: "Withdrawals", data: series(wd.map((r) => ({ amount: r.amount, d: r.createdAt }))) },
    { title: "Investments", data: series(inv.map((r) => ({ amount: r.amount, d: r.investedAt }))) },
    { title: "Commissions", data: series(com.map((r) => ({ amount: r.amount, d: r.createdAt }))) },
    { title: "ROI credited", data: series(roi.map((r) => ({ amount: r.amount, d: r.paidAt }))) },
  ];

  return (
    <AppShell user={admin}>
      <PageHeader title="Reports & Analytics" subtitle="গত ৬ মাসের মাসভিত্তিক সারাংশ।" />
      <div className="stack">
        <div className="grid-stats">
          {sets.slice(0, 4).map((s) => <StatCard key={s.title} label={`${s.title} (6 mo)`} value={tk(s.data.reduce((a, b) => a + b.value, 0))} icon="report" tone="blue" />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {sets.map((s) => <Section key={s.title} title={s.title}><BarChart data={s.data} /></Section>)}
        </div>
      </div>
    </AppShell>
  );
}
