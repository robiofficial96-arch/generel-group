import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import { EmptyState, KeyValue, PageHeader, Section, StatCard } from "@/components/ui";
import { fmtDateTime, ref, tk } from "@/lib/format";
import { RULES } from "@/lib/admin";

export const instant = false;

export default async function AdminCommissionsPage() {
  const admin = await requireAdminUser();
  const [rows, direct, matching] = await Promise.all([
    prisma.commission.findMany({ orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } }, fromInvestment: { select: { amount: true } } }, take: 200 }),
    prisma.commission.aggregate({ where: { type: "DIRECT" }, _sum: { amount: true } }),
    prisma.commission.aggregate({ where: { type: "TEAM_MATCHING" }, _sum: { amount: true } }),
  ]);

  return (
    <AppShell user={admin}>
      <PageHeader title="Commissions" subtitle="Commission ledger ও configuration।" />
      <div className="stack">
        <div className="grid-stats">
          <StatCard label="Direct Commission" value={tk(direct._sum.amount)} icon="user" tone="violet" />
          <StatCard label="Team Matching" value={tk(matching._sum.amount)} icon="scale" tone="teal" />
          <StatCard label="Direct rate" value={`${RULES.directCommissionRate * 100}%`} icon="percent" tone="blue" />
          <StatCard label="Matching rate" value={`${RULES.teamMatchingRate * 100}%`} icon="percent" tone="blue" />
        </div>
        <Section title="Configuration" subtitle="Rate সিস্টেম-নির্ধারিত; পরিবর্তন করতে developer লাগবে।">
          <KeyValue rows={[["Direct referral", "6% — C-Wallet"], ["Team matching", "5% — C-Wallet, exact equal match"], ["Daily matching cap", "Pending configuration"]]} />
        </Section>
        <Section title="Commission Ledger" flush>
          {rows.length === 0 ? <EmptyState icon="percent" title="কোনো commission নেই" /> : (
            <div className="table-wrap"><table className="table-base table-cards">
              <thead><tr><th>Transaction</th><th>Beneficiary</th><th>Type</th><th className="!text-right">Eligible investment</th><th>Date</th><th className="!text-right">Amount</th></tr></thead>
              <tbody>{rows.map((c) => (
                <tr key={c.id}>
                  <td className="cell-main font-mono text-[13px]">{ref("COM", c.id)}</td>
                  <td data-label="Beneficiary">{c.user.name}</td>
                  <td data-label="Type"><span className={`badge ${c.type === "DIRECT" ? "badge-info" : "badge-approved"}`}>{c.type === "DIRECT" ? "Direct 6%" : "Matching 5%"}</span></td>
                  <td data-label="Investment" className="tabular-nums md:text-right">{c.fromInvestment ? tk(c.fromInvestment.amount) : "—"}</td>
                  <td data-label="Date" className="cell-muted whitespace-nowrap">{fmtDateTime(c.createdAt)}</td>
                  <td data-label="Amount" className="font-semibold tabular-nums md:text-right">{tk(c.amount)}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </Section>
      </div>
    </AppShell>
  );
}
