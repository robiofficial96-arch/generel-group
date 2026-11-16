import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import { BarChart, EmptyState, PageHeader, Section, StatCard, Tabs } from "@/components/ui";
import { fmtDateTime, num, ref, tk } from "@/lib/format";
import { lastMonths, monthKey } from "@/lib/activity";

export const instant = false;

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sessionUser = await requireUser();
  const { type } = await searchParams;
  const filter = type === "direct" ? "DIRECT" : type === "matching" ? "TEAM_MATCHING" : null;

  const commissions = await prisma.commission.findMany({
    where: { userId: sessionUser.id },
    include: { fromInvestment: { include: { user: { select: { name: true, mobile: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const total = (t?: string) =>
    commissions.filter((c) => !t || c.type === t).reduce((s, c) => s + num(c.amount), 0);
  const rows = filter ? commissions.filter((c) => c.type === filter) : commissions;

  const months = lastMonths(6);
  const monthly = new Map(months.map((m) => [m.key, 0]));
  for (const c of commissions) {
    const k = monthKey(c.createdAt);
    if (monthly.has(k)) monthly.set(k, monthly.get(k)! + num(c.amount));
  }

  return (
    <AppShell user={sessionUser}>
      <PageHeader title="Commissions" subtitle="Direct referral (6%) ও team matching (5%) commission — C-Wallet এ জমা হয়।" />

      <div className="stack">
        <div className="grid-stats">
          <StatCard label="Total Earned" value={tk(total())} icon="percent" featured />
          <StatCard label="Direct Commission (6%)" value={tk(total("DIRECT"))} icon="user" tone="violet" />
          <StatCard label="Matching Commission (5%)" value={tk(total("TEAM_MATCHING"))} icon="scale" tone="teal" />
          <StatCard label="Paid to C-Wallet" value={tk(total())} icon="wallet" tone="green" hint="Commission সাথে সাথে credit হয়" />
        </div>

        <Section title="Monthly Commission" subtitle="Last 6 months">
          <BarChart data={months.map((m) => ({ label: m.label, value: monthly.get(m.key) ?? 0 }))} />
        </Section>

        <Tabs
          active={type === "direct" || type === "matching" ? type : "all"}
          tabs={[
            { key: "all", label: "All", href: "/commissions" },
            { key: "direct", label: "Direct Referral", href: "/commissions?type=direct" },
            { key: "matching", label: "Team Matching", href: "/commissions?type=matching" },
          ]}
        />

        <Section title="Commission History" subtitle={`${rows.length} টি record`} flush>
          {rows.length === 0 ? (
            <EmptyState
              icon="percent"
              title="এখনো কোনো commission নেই"
              text="তোমার direct referral invest করলে বা Left/Right exact match হলে commission এখানে দেখাবে।"
            />
          ) : (
            <div className="table-wrap">
              <table className="table-base table-cards">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Type</th>
                    <th>Source</th>
                    <th>Date</th>
                    <th className="!text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id}>
                      <td className="cell-main font-mono text-[13px]">{ref("COM", c.id)}</td>
                      <td data-label="Type">
                        <span className={`badge ${c.type === "DIRECT" ? "badge-info" : "badge-approved"}`}>
                          {c.type === "DIRECT" ? "Direct 6%" : "Matching 5%"}
                        </span>
                      </td>
                      <td data-label="Source">
                        {c.fromInvestment ? (
                          <>
                            {c.fromInvestment.user.name}
                            <span className="cell-muted block">Investment {tk(c.fromInvestment.amount)}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td data-label="Date" className="cell-muted whitespace-nowrap">{fmtDateTime(c.createdAt)}</td>
                      <td data-label="Amount" className="font-semibold tabular-nums text-[var(--success)] md:text-right">
                        +{tk(c.amount)}
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
