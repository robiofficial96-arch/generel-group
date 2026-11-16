import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { BarChart, Donut, EmptyState, PageHeader, Section, SeeAll, StatCard } from "@/components/ui";
import { fmtDateTime, num, tk } from "@/lib/format";
import { lastMonths, monthKey } from "@/lib/activity";

export const instant = false;

export default async function AdminDashboardPage() {
  const admin = await requireAdminUser();
  const since = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);

  const [
    users, activeUsers, deposits, withdrawals, investments, roi, direct, matching,
    pendingDeposits, pendingWithdrawals, openTickets,
    recentUsers, recentDeposits, regs, depositRows, investRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.deposit.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true } }),
    prisma.withdrawal.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true } }),
    prisma.investment.aggregate({ _sum: { amount: true } }),
    prisma.roiSchedule.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true } }),
    prisma.commission.aggregate({ where: { type: "DIRECT" }, _sum: { amount: true } }),
    prisma.commission.aggregate({ where: { type: "TEAM_MATCHING" }, _sum: { amount: true } }),
    prisma.deposit.count({ where: { status: "PENDING" } }),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.deposit.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: { select: { name: true } } } }),
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.deposit.findMany({ where: { status: "APPROVED", createdAt: { gte: since } }, select: { amount: true, createdAt: true } }),
    prisma.investment.findMany({ where: { investedAt: { gte: since } }, select: { amount: true, investedAt: true } }),
  ]);

  const months = lastMonths(6);
  const regMap = new Map(months.map((m) => [m.key, 0]));
  regs.forEach((r) => regMap.has(monthKey(r.createdAt)) && regMap.set(monthKey(r.createdAt), regMap.get(monthKey(r.createdAt))! + 1));
  const depMap = new Map(months.map((m) => [m.key, 0]));
  depositRows.forEach((r) => depMap.has(monthKey(r.createdAt)) && depMap.set(monthKey(r.createdAt), depMap.get(monthKey(r.createdAt))! + num(r.amount)));
  const invMap = new Map(months.map((m) => [m.key, 0]));
  investRows.forEach((r) => invMap.has(monthKey(r.investedAt)) && invMap.set(monthKey(r.investedAt), invMap.get(monthKey(r.investedAt))! + num(r.amount)));

  return (
    <AppShell user={admin}>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview ও pending কাজ।" />

      <div className="stack">
        <div className="grid-stats">
          <StatCard label="Registered Users" value={users} icon="users" featured href="/admin/users" />
          <StatCard label="Active Users" value={activeUsers} icon="check" tone="green" hint={`${users - activeUsers} Normal`} />
          <StatCard label="Total Deposits" value={tk(deposits._sum.amount)} icon="deposit" tone="green" href="/admin/deposits" />
          <StatCard label="Total Withdrawals" value={tk(withdrawals._sum.amount)} icon="withdraw" tone="amber" href="/admin/withdrawals" />
          <StatCard label="Total Investments" value={tk(investments._sum.amount)} icon="invest" tone="blue" href="/admin/investments" />
          <StatCard label="ROI Credited" value={tk(roi._sum.amount)} icon="repeat" tone="teal" href="/admin/roi" />
          <StatCard label="Direct Commission" value={tk(direct._sum.amount)} icon="percent" tone="violet" href="/admin/commissions" />
          <StatCard label="Team Commission" value={tk(matching._sum.amount)} icon="scale" tone="violet" href="/admin/matching" />
          <StatCard label="Pending Deposits" value={pendingDeposits} icon="clock" tone="amber" href="/admin/deposits?status=PENDING" />
          <StatCard label="Pending Withdrawals" value={pendingWithdrawals} icon="clock" tone="red" href="/admin/withdrawals?status=PENDING" />
          <StatCard label="Open Tickets" value={openTickets} icon="support" tone="slate" href="/admin/support" />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="User Registration Growth" subtitle="New users per month">
            <BarChart data={months.map((m) => ({ label: m.label, value: regMap.get(m.key) ?? 0 }))} />
          </Section>
          <Section title="Deposit Volume" subtitle="Approved deposits per month">
            <BarChart data={months.map((m) => ({ label: m.label, value: depMap.get(m.key) ?? 0 }))} />
          </Section>
          <Section title="Investment Trend" subtitle="New investment per month">
            <BarChart data={months.map((m) => ({ label: m.label, value: invMap.get(m.key) ?? 0 }))} />
          </Section>
          <Section title="Commission Distribution">
            <Donut
              centerLabel="Commission"
              data={[
                { label: "Direct (6%)", value: num(direct._sum.amount) },
                { label: "Team matching (5%)", value: num(matching._sum.amount) },
              ]}
            />
          </Section>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Recent Registrations" flush action={<SeeAll href="/admin/users" />}>
            <ul>
              {recentUsers.map((u) => (
                <li key={u.id}>
                  <Link href={`/admin/users/${u.id}`} className="tx-row hover:bg-[#fafbfe]">
                    <span className="avatar avatar-sm">{u.name.slice(0, 1).toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{u.name}</span>
                      <span className="block font-mono text-xs text-[var(--muted)]">{u.mobile}</span>
                    </span>
                    <span className="text-xs text-[var(--muted)]">{fmtDateTime(u.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Recent Deposit Requests" flush action={<SeeAll href="/admin/deposits" />}>
            {recentDeposits.length === 0 ? (
              <EmptyState icon="deposit" title="কোনো deposit নেই" />
            ) : (
              <ul>
                {recentDeposits.map((d) => (
                  <li key={d.id} className="tx-row">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{d.user.name}</span>
                      <span className="block text-xs text-[var(--muted)]">{fmtDateTime(d.createdAt)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-semibold tabular-nums">{tk(d.amount)}</span>
                      <StatusBadge status={d.status} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </AppShell>
  );
}
