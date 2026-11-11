import { prisma } from "@/lib/prisma";
import { runRoiCron } from "./actions";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";

export const instant = false;

export default async function AdminRoiPage() {
  const session = await auth();
  const pendingCount = await prisma.roiSchedule.count({ where: { status: "PENDING" } });
  const paidCount = await prisma.roiSchedule.count({ where: { status: "APPROVED" } });

  const schedules = await prisma.roiSchedule.findMany({
    orderBy: [{ investmentId: "asc" }, { monthNo: "asc" }],
    include: { investment: { include: { user: true } } },
    take: 50,
  });

  return (
    <AppShell user={session?.user}>
      <h1 className="text-2xl font-semibold">ROI Schedule</h1>
      <div className="mt-2 flex items-center gap-4 text-sm text-[var(--muted)]">
        <span>Pending: <span className="font-medium text-[var(--foreground)]">{pendingCount}</span></span>
        <span>Paid: <span className="font-medium text-[var(--foreground)]">{paidCount}</span></span>
      </div>

      <form action={runRoiCron}>
        <button className="btn-primary mt-4">Run ROI Cron Now</button>
      </form>

      <div className="card mt-6 overflow-x-auto p-2">
        <table className="table-base">
          <thead>
            <tr>
              <th>User</th>
              <th>Investment</th>
              <th>Month</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Paid At</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id}>
                <td>{s.investment.user.name}</td>
                <td className="tabular-nums">{s.investment.amount.toString()}</td>
                <td>{s.monthNo}</td>
                <td className="tabular-nums">{s.amount.toString()}</td>
                <td><StatusBadge status={s.status} /></td>
                <td>{s.paidAt ? s.paidAt.toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
