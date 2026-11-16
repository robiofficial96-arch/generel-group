import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import { EmptyState, Note, PageHeader, Section, StatCard } from "@/components/ui";
import { num, tk } from "@/lib/format";

export const instant = false;

export default async function AdminMatchingPage() {
  const admin = await requireAdminUser();
  const [ledgers, totals] = await Promise.all([
    prisma.matchingLedger.findMany({ include: { user: { select: { name: true, mobile: true } } }, orderBy: { totalMatchedVolume: "desc" }, take: 200 }),
    prisma.matchingLedger.aggregate({ _sum: { totalMatchedVolume: true, leftCarryBalance: true, rightCarryBalance: true } }),
  ]);
  const rows = ledgers.filter((l) => num(l.leftCarryBalance) > 0 || num(l.rightCarryBalance) > 0 || num(l.totalMatchedVolume) > 0);

  return (
    <AppShell user={admin}>
      <PageHeader title="Binary Matching" subtitle="Exact equal matching — user-wise carry forward ও matched volume।" />
      <div className="stack">
        <div className="grid-stats">
          <StatCard label="Total Matched Volume" value={tk(totals._sum.totalMatchedVolume)} icon="scale" featured />
          <StatCard label="Unmatched Left" value={tk(totals._sum.leftCarryBalance)} icon="chevron-left" tone="blue" />
          <StatCard label="Unmatched Right" value={tk(totals._sum.rightCarryBalance)} icon="chevron-right" tone="green" />
          <StatCard label="Users with volume" value={rows.length} icon="users" tone="slate" />
        </div>
        <Note tone="warning">Matching history মুছে ফেলা বা চুপচাপ পরিবর্তন করা যায় না। Edge-case rule (excess volume, partial residual, daily cap) client confirm না করা পর্যন্ত pending।</Note>
        <Section title="User-wise Matching" flush>
          {rows.length === 0 ? <EmptyState icon="scale" title="কোনো matching data নেই" /> : (
            <div className="table-wrap"><table className="table-base table-cards">
              <thead><tr><th>User</th><th className="!text-right">Left carry</th><th className="!text-right">Right carry</th><th className="!text-right">Matched volume</th><th>Why no match</th></tr></thead>
              <tbody>{rows.map((l) => {
                const left = num(l.leftCarryBalance), right = num(l.rightCarryBalance);
                return (
                  <tr key={l.id}>
                    <td className="cell-main">{l.user.name}<span className="cell-muted ml-2 font-mono">{l.user.mobile}</span></td>
                    <td data-label="Left" className="tabular-nums md:text-right">{tk(left)}</td>
                    <td data-label="Right" className="tabular-nums md:text-right">{tk(right)}</td>
                    <td data-label="Matched" className="font-semibold tabular-nums md:text-right">{tk(l.totalMatchedVolume)}</td>
                    <td data-label="Status" className="cell-muted">{left === right ? (left === 0 ? "—" : "Equal — match pending") : `Sides unequal (diff ${tk(Math.abs(left - right))})`}</td>
                  </tr>
                );
              })}</tbody>
            </table></div>
          )}
        </Section>
      </div>
    </AppShell>
  );
}
