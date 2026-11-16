import { addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import { runRoiCron } from "./actions";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import ConfirmButton from "@/components/ConfirmButton";
import { Flash, Note, PageHeader, Section, StatCard } from "@/components/ui";
import { fmtDate, num, tk } from "@/lib/format";
import { readFlash, type FlashParams } from "@/lib/flash";

export const instant = false;

export default async function AdminRoiPage({ searchParams }: { searchParams: FlashParams }) {
  const admin = await requireAdminUser();
  const { ok, error } = await readFlash(searchParams);

  const [pending, paid, pendingSum, paidSum, schedules] = await Promise.all([
    prisma.roiSchedule.count({ where: { status: "PENDING" } }),
    prisma.roiSchedule.count({ where: { status: "APPROVED" } }),
    prisma.roiSchedule.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
    prisma.roiSchedule.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true } }),
    prisma.roiSchedule.findMany({
      orderBy: [{ status: "asc" }, { paidAt: "desc" }, { monthNo: "asc" }],
      include: { investment: { include: { user: { select: { name: true } } } } },
      take: 60,
    }),
  ]);

  return (
    <AppShell user={admin}>
      <PageHeader title="ROI Management" subtitle="18 মাসের ROI schedule ও credit history।"
        actions={
          <form action={runRoiCron}>
            <ConfirmButton className="btn-primary" title="Due ROI credit করবে?" message="যেসব installment-এর তারিখ এসে গেছে সেগুলো user-দের R-Wallet এ credit হবে ও notification যাবে।" confirmLabel="Run now">
              Run ROI now
            </ConfirmButton>
          </form>
        } />
      <Flash ok={ok} error={error} />
      <div className="stack">
        <div className="grid-stats">
          <StatCard label="Pending Installments" value={pending} icon="clock" tone="amber" />
          <StatCard label="Pending Amount" value={tk(pendingSum._sum.amount)} icon="wallet" tone="slate" />
          <StatCard label="Paid Installments" value={paid} icon="check" tone="green" />
          <StatCard label="Total ROI Credited" value={tk(paidSum._sum.amount)} icon="repeat" featured />
        </div>
        <Note>ROI credit frequency চূড়ান্ত নয় — এখন manual trigger; production-এ monthly scheduled job হবে। (Pending configuration)</Note>
        <Section title="ROI Schedule" subtitle="সর্বশেষ 60টি" flush>
          <div className="table-wrap">
            <table className="table-base table-cards">
              <thead><tr><th>User</th><th className="!text-right">Investment</th><th>Month</th><th>Due</th><th className="!text-right">Amount</th><th>Status</th></tr></thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td className="cell-main">{s.investment.user.name}</td>
                    <td data-label="Investment" className="tabular-nums md:text-right">{tk(s.investment.amount)}</td>
                    <td data-label="Month">{s.monthNo} / 18</td>
                    <td data-label="Due" className="cell-muted">{s.paidAt ? `Paid ${fmtDate(s.paidAt)}` : fmtDate(addMonths(s.investment.investedAt, s.monthNo))}</td>
                    <td data-label="Amount" className="font-semibold tabular-nums md:text-right">{tk(num(s.amount))}</td>
                    <td data-label="Status"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
