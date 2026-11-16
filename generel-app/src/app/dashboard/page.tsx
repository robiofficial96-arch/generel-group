import Link from "next/link";
import { addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icon";
import StatusBadge from "@/components/StatusBadge";
import WalletDeck, { type DeckWallet } from "@/components/WalletDeck";
import { TxList } from "@/components/TxList";
import { BarChart, Donut, Progress, Section, SeeAll, StatCard } from "@/components/ui";
import { fmtDate, maskedId, num, tk } from "@/lib/format";
import { getActivity, getFinancialSummary, lastMonths, monthKey, WALLET_INFO } from "@/lib/activity";
import { getSubtree } from "@/lib/team";

export const instant = false;

export default async function DashboardPage() {
  const sessionUser = await requireUser();
  const userId = sessionUser.id;
  const since = new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);

  const [user, wallet, summary, ledger, investments, team, activity, commissions, roiPaid] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.wallet.findUnique({ where: { userId } }),
      getFinancialSummary(userId),
      prisma.matchingLedger.findUnique({ where: { userId } }),
      prisma.investment.findMany({
        where: { userId },
        include: { roiSchedules: { select: { monthNo: true, status: true, amount: true } } },
        orderBy: { investedAt: "desc" },
      }),
      getSubtree(userId),
      getActivity(userId, { limit: 6 }),
      prisma.commission.findMany({ where: { userId, createdAt: { gte: since } }, select: { amount: true, createdAt: true } }),
      prisma.roiSchedule.findMany({
        where: { status: "APPROVED", paidAt: { gte: since }, investment: { userId } },
        select: { amount: true, paidAt: true },
      }),
    ]);

  const wallets: DeckWallet[] = (["E", "G", "C", "R", "T"] as const).map((key) => ({
    key,
    name: WALLET_INFO[key].name,
    tag: WALLET_INFO[key].tag,
    balance: num(wallet?.[WALLET_INFO[key].field]),
    href: `/wallets/${WALLET_INFO[key].slug}`,
  }));

  // Monthly income (commission + ROI actually credited) for the last 6 months
  const months = lastMonths(6);
  const income = new Map(months.map((m) => [m.key, 0]));
  for (const c of commissions) {
    const k = monthKey(c.createdAt);
    if (income.has(k)) income.set(k, income.get(k)! + num(c.amount));
  }
  for (const r of roiPaid) {
    if (!r.paidAt) continue;
    const k = monthKey(r.paidAt);
    if (income.has(k)) income.set(k, income.get(k)! + num(r.amount));
  }

  const active = investments.filter((i) => i.roiSchedules.some((s) => s.status === "PENDING"));
  const completed = investments.length - active.length;
  const nextRoi = active
    .flatMap((i) =>
      i.roiSchedules
        .filter((s) => s.status === "PENDING")
        .map((s) => ({ due: addMonths(i.investedAt, s.monthNo), amount: num(s.amount) }))
    )
    .sort((a, b) => a.due.getTime() - b.due.getTime())[0];

  const leftCount = team.filter((m) => m.leg === "LEFT").length;
  const rightCount = team.filter((m) => m.leg === "RIGHT").length;
  const directs = team.filter((m) => m.depth === 1).length;
  const leftCarry = num(ledger?.leftCarryBalance);
  const rightCarry = num(ledger?.rightCarryBalance);
  const carryMax = Math.max(leftCarry, rightCarry, 1);

  const quick = [
    { href: "/deposit", label: "Deposit", icon: "deposit", tone: "tone-green" },
    { href: "/invest", label: "Invest", icon: "invest", tone: "tone-blue" },
    { href: "/withdraw", label: "Withdraw", icon: "withdraw", tone: "tone-amber" },
    { href: "/transfer", label: "Transfer", icon: "transfer", tone: "tone-violet" },
  ];

  return (
    <AppShell user={sessionUser}>
      <div className="stack">
        {/* Welcome */}
        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <div className="hero-card p-5 sm:p-6">
            <p className="text-sm text-white/65">স্বাগতম,</p>
            <div className="mt-1 flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold sm:text-[1.75rem]">{user?.name}</h1>
              <StatusBadge status={user?.status ?? "NORMAL"} />
            </div>
            <p className="mt-1 text-sm text-white/65">
              User ID <span className="font-mono text-white/90">{user?.mobile}</span>
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
              {[
                ["Total invested", tk(summary.invested)],
                ["Commission earned", tk(summary.commission)],
                ["ROI received", tk(summary.roi)],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-white/55">{label}</p>
                  <p className="mt-0.5 truncate font-display text-base font-bold tabular-nums sm:text-lg">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="quick-actions content-center">
            {quick.map((q) => (
              <Link key={q.href} href={q.href} className="quick-action">
                <span className={q.tone}>
                  <Icon name={q.icon} size={20} />
                </span>
                {q.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ATM wallet cards */}
        <WalletDeck wallets={wallets} holder={user?.name ?? ""} masked={maskedId(user?.mobile)} />

        {/* Financial summary */}
        <div>
          <h2 className="section-title mb-3">Financial Summary</h2>
          <div className="grid-stats">
            <StatCard label="Total Deposited" value={tk(summary.deposited)} icon="deposit" tone="green" href="/deposit" />
            <StatCard label="Total Investment" value={tk(summary.invested)} icon="invest" tone="blue" href="/invest" featured />
            <StatCard label="Commission Earned" value={tk(summary.commission)} icon="percent" tone="violet" href="/commissions" />
            <StatCard label="ROI Received" value={tk(summary.roi)} icon="repeat" tone="teal" href="/invest" />
            <StatCard label="Total Withdrawal" value={tk(summary.withdrawn)} icon="withdraw" tone="slate" href="/withdraw" />
            <StatCard label="Pending Withdrawal" value={tk(summary.pendingWithdrawal)} icon="clock" tone="amber" href="/withdraw" />
            <StatCard label="Team Members" value={team.length} icon="users" tone="blue" href="/team" hint={`${directs} direct`} />
            <StatCard label="Matched Volume" value={tk(ledger?.totalMatchedVolume)} icon="scale" tone="violet" href="/matching" />
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <Section title="Income Activity" subtitle="Commission + ROI credited, last 6 months">
            <BarChart data={months.map((m) => ({ label: m.label, value: income.get(m.key) ?? 0 }))} />
          </Section>
          <Section title="Income Sources" subtitle="Lifetime credited amounts">
            <Donut
              centerLabel="Income"
              data={[
                { label: "Direct commission", value: summary.directCommission },
                { label: "Matching commission", value: summary.matchingCommission },
                { label: "ROI", value: summary.roi },
              ]}
            />
          </Section>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Investment overview */}
          <Section title="Investment Overview" action={<SeeAll href="/invest" label="Slots" />}>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Active", String(active.length)],
                ["Completed", String(completed)],
                ["Next ROI", nextRoi ? fmtDate(nextRoi.due) : "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[var(--background)] p-3">
                  <p className="text-xs text-[var(--muted)]">{label}</p>
                  <p className="mt-0.5 font-display text-base font-bold tabular-nums">{value}</p>
                </div>
              ))}
            </div>
            {active.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted)]">
                কোনো active investment নেই।{" "}
                <Link href="/invest" className="font-semibold text-[var(--brand)]">
                  Slot দেখো →
                </Link>
              </p>
            ) : (
              <ul className="mt-4 space-y-3.5">
                {active.slice(0, 3).map((inv) => {
                  const paid = inv.roiSchedules.filter((s) => s.status === "APPROVED").length;
                  return (
                    <li key={inv.id}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-semibold tabular-nums">{tk(inv.amount)}</span>
                        <span className="text-xs text-[var(--muted)]">{paid}/18 months credited</span>
                      </div>
                      <Progress value={paid} max={18} />
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          {/* Team + matching */}
          <Section title="Team & Matching" action={<SeeAll href="/matching" label="Matching" />}>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Direct", `${directs} / 2`],
                ["Left team", String(leftCount)],
                ["Right team", String(rightCount)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[var(--background)] p-3">
                  <p className="text-xs text-[var(--muted)]">{label}</p>
                  <p className="mt-0.5 font-display text-base font-bold tabular-nums">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3.5">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">Left carry forward</span>
                  <span className="font-semibold tabular-nums">{tk(leftCarry)}</span>
                </div>
                <Progress value={leftCarry} max={carryMax} />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">Right carry forward</span>
                  <span className="font-semibold tabular-nums">{tk(rightCarry)}</span>
                </div>
                <Progress value={rightCarry} max={carryMax} tone="green" />
              </div>
            </div>
          </Section>
        </div>

        {/* Recent activity */}
        <Section title="Recent Activity" flush action={<SeeAll href="/activity" />}>
          <TxList rows={activity} />
        </Section>
      </div>
    </AppShell>
  );
}
