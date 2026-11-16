import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import WithdrawForm from "./WithdrawForm";
import { EmptyState, Flash, KeyValue, PageHeader, Section, StatCard } from "@/components/ui";
import { CHANNEL_LABEL, fmtDateTime, METHOD_LABEL, num, ref, tk } from "@/lib/format";
import { readFlash, type FlashParams } from "@/lib/flash";
import { RULES } from "@/lib/admin";

export const instant = false;

export default async function WithdrawPage({ searchParams }: { searchParams: FlashParams }) {
  const sessionUser = await requireUser();
  const { ok, error } = await readFlash(searchParams);

  const [wallet, withdrawals] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: sessionUser.id } }),
    prisma.withdrawal.findMany({ where: { userId: sessionUser.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const sum = (status: string) =>
    withdrawals.filter((w) => w.status === status).reduce((s, w) => s + num(w.amount), 0);

  return (
    <AppShell user={sessionUser}>
      <PageHeader title="Withdraw" subtitle="C-Wallet বা R-Wallet থেকে withdrawal request করো।" />
      <Flash ok={ok} error={error} />

      <div className="stack">
        <div className="grid-stats">
          <StatCard label="C-Wallet (Commission)" value={tk(wallet?.cWallet)} icon="percent" tone="violet" />
          <StatCard label="R-Wallet (ROI)" value={tk(wallet?.rWallet)} icon="repeat" tone="teal" />
          <StatCard label="Pending Withdrawal" value={tk(sum("PENDING"))} icon="clock" tone="amber" />
          <StatCard label="Total Withdrawn" value={tk(sum("APPROVED"))} icon="withdraw" tone="green" />
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[1.25fr_1fr]">
          <Section title="New Withdrawal">
            <WithdrawForm
              cBalance={num(wallet?.cWallet)}
              rBalance={num(wallet?.rWallet)}
              feeRate={RULES.withdrawFeeRate}
              min={RULES.minWithdraw}
            />
          </Section>

          <Section title="Withdrawal Terms">
            <KeyValue
              rows={[
                ["Minimum withdrawal", tk(RULES.minWithdraw)],
                ["Maximum", "Unlimited (system limit সাপেক্ষে)"],
                ["Transaction charge", `${RULES.withdrawFeeRate * 100}%`],
                ["Example", "৳1,000 → charge ৳100 → net ৳900"],
              ]}
            />
            <p className="mt-3 text-sm text-[var(--muted)]">
              Request করলে amount wallet থেকে hold হয়। Reject হলে পুরো amount একই wallet এ ফেরত আসে।
            </p>
          </Section>
        </div>

        <Section title="Withdrawal History" subtitle={`${withdrawals.length} টি request`} flush>
          {withdrawals.length === 0 ? (
            <EmptyState icon="withdraw" title="এখনো কোনো withdrawal নেই" />
          ) : (
            <div className="table-wrap">
              <table className="table-base table-cards">
                <thead>
                  <tr>
                    <th>Withdrawal</th>
                    <th>Wallet</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th className="!text-right">Requested</th>
                    <th className="!text-right">Charge</th>
                    <th className="!text-right">Net Payable</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id}>
                      <td className="cell-main font-mono text-[13px]">{ref("WDR", w.id)}</td>
                      <td data-label="Wallet">{w.sourceWallet === "C_WALLET" ? "C-Wallet" : "R-Wallet"}</td>
                      <td data-label="Method">
                        {METHOD_LABEL[w.payoutMethod].split(" (")[0]}
                        <span className="cell-muted block">{CHANNEL_LABEL[w.channel]}</span>
                      </td>
                      <td data-label="Date" className="cell-muted whitespace-nowrap">{fmtDateTime(w.createdAt)}</td>
                      <td data-label="Requested" className="tabular-nums md:text-right">{tk(w.amount)}</td>
                      <td data-label="Charge" className="tabular-nums text-[var(--danger)] md:text-right">−{tk(w.feeAmount)}</td>
                      <td data-label="Net Payable" className="font-semibold tabular-nums md:text-right">{tk(w.netAmount)}</td>
                      <td data-label="Status">
                        <StatusBadge status={w.status} />
                        {w.status === "REJECTED" && w.rejectReason && (
                          <span className="cell-muted mt-1 block">{w.rejectReason}</span>
                        )}
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
