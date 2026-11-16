import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import MatchingCompare from "@/components/MatchingCompare";
import { EmptyState, KeyValue, Note, PageHeader, Section, StatCard } from "@/components/ui";
import { fmtDateTime, num, ref, tk } from "@/lib/format";

export const instant = false;

export default async function MatchingPage() {
  const sessionUser = await requireUser();
  const [ledger, matches] = await Promise.all([
    prisma.matchingLedger.findUnique({ where: { userId: sessionUser.id } }),
    prisma.commission.findMany({
      where: { userId: sessionUser.id, type: "TEAM_MATCHING" },
      include: { fromInvestment: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const left = num(ledger?.leftCarryBalance);
  const right = num(ledger?.rightCarryBalance);
  const earned = matches.reduce((s, m) => s + num(m.amount), 0);

  return (
    <AppShell user={sessionUser}>
      <PageHeader title="Binary Matching" subtitle="Exact equal matching — Left ও Right সমান হলে 5% team commission।" />

      <div className="stack">
        <div className="grid-stats">
          <StatCard label="Total Matched Volume" value={tk(ledger?.totalMatchedVolume)} icon="scale" featured />
          <StatCard label="Matching Commission" value={tk(earned)} icon="percent" tone="violet" />
          <StatCard label="Left Carry Forward" value={tk(left)} icon="chevron-left" tone="blue" />
          <StatCard label="Right Carry Forward" value={tk(right)} icon="chevron-right" tone="green" />
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Section title="Left vs Right" subtitle="Pending / unmatched volume">
            <MatchingCompare left={left} right={right} />
          </Section>

          <Section title="Matching Rules">
            <KeyValue
              rows={[
                ["Rule", "Exact equal match"],
                ["Commission", "5% of matched volume"],
                ["Partial matching", "নেই"],
                ["Smaller-slot cascading", "নেই"],
                ["Flush", "নেই — carry forward"],
                ["Lifetime Left volume", tk(ledger?.leftLifetimeVolume)],
                ["Lifetime Right volume", tk(ledger?.rightLifetimeVolume)],
              ]}
            />
          </Section>
        </div>

        <Note tone="warning">
          Excess volume, repeated match ও partial residual-এর edge-case rule এখনো client confirm করেনি — চূড়ান্ত
          হলে এই page আপডেট হবে। (Pending configuration)
        </Note>

        <Section title="Matching History" subtitle={`${matches.length} টি match`} flush>
          {matches.length === 0 ? (
            <EmptyState icon="scale" title="এখনো কোনো match হয়নি" text="Left ও Right side-এর volume হুবহু সমান হলে match record এখানে দেখাবে।" />
          ) : (
            <div className="table-wrap">
              <table className="table-base table-cards">
                <thead>
                  <tr>
                    <th>Match</th>
                    <th>Triggered By</th>
                    <th>Date</th>
                    <th className="!text-right">Matched Volume</th>
                    <th className="!text-right">Commission (5%)</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => (
                    <tr key={m.id}>
                      <td className="cell-main font-mono text-[13px]">{ref("MAT", m.id)}</td>
                      <td data-label="Triggered By">{m.fromInvestment?.user.name ?? "—"}</td>
                      <td data-label="Date" className="cell-muted whitespace-nowrap">{fmtDateTime(m.createdAt)}</td>
                      <td data-label="Matched Volume" className="tabular-nums md:text-right">{tk(num(m.amount) / 0.05)}</td>
                      <td data-label="Commission" className="font-semibold tabular-nums text-[var(--success)] md:text-right">+{tk(m.amount)}</td>
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
