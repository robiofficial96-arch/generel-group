import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import { EmptyState, Note, PageHeader, Section, StatCard } from "@/components/ui";
import { tk } from "@/lib/format";

export const instant = false;

export default async function AdminWalletsPage() {
  const admin = await requireAdminUser();
  const [wallets, totals] = await Promise.all([
    prisma.wallet.findMany({ include: { user: { select: { id: true, name: true, mobile: true } } }, orderBy: { updatedAt: "desc" }, take: 200 }),
    prisma.wallet.aggregate({ _sum: { gWallet: true, cWallet: true, rWallet: true, tWallet: true } }),
  ]);

  return (
    <AppShell user={admin}>
      <PageHeader title="Wallets" subtitle="সব user-এর wallet balance।" />
      <div className="stack">
        <div className="grid-stats">
          <StatCard label="G-Wallet total" value={tk(totals._sum.gWallet)} icon="wallet" featured />
          <StatCard label="C-Wallet total" value={tk(totals._sum.cWallet)} icon="percent" tone="violet" />
          <StatCard label="R-Wallet total" value={tk(totals._sum.rWallet)} icon="repeat" tone="teal" />
          <StatCard label="T-Wallet total" value={tk(totals._sum.tWallet)} icon="transfer" tone="slate" />
        </div>
        <Note>E-Wallet-এর accounting definition pending — তাই মোট যোগফল দেখানো হচ্ছে না। Manual balance adjustment এই version-এ চালু নেই।</Note>
        <Section title="User Wallets" flush>
          {wallets.length === 0 ? <EmptyState icon="wallet" title="কোনো wallet নেই" /> : (
            <div className="table-wrap"><table className="table-base table-cards">
              <thead><tr><th>User</th><th className="!text-right">G</th><th className="!text-right">C</th><th className="!text-right">R</th><th className="!text-right">T</th><th /></tr></thead>
              <tbody>{wallets.map((w) => (
                <tr key={w.id}>
                  <td className="cell-main">{w.user.name}<span className="cell-muted ml-2 font-mono">{w.user.mobile}</span></td>
                  <td data-label="G-Wallet" className="tabular-nums md:text-right">{tk(w.gWallet)}</td>
                  <td data-label="C-Wallet" className="tabular-nums md:text-right">{tk(w.cWallet)}</td>
                  <td data-label="R-Wallet" className="tabular-nums md:text-right">{tk(w.rWallet)}</td>
                  <td data-label="T-Wallet" className="tabular-nums md:text-right">{tk(w.tWallet)}</td>
                  <td className="cell-actions"><Link href={`/admin/users/${w.user.id}`} className="btn-ghost">Details</Link></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </Section>
      </div>
    </AppShell>
  );
}
