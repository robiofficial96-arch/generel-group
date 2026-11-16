import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import TransferForm from "./TransferForm";
import { Amount, EmptyState, Flash, KeyValue, Note, PageHeader, Section, StatCard } from "@/components/ui";
import { fmtDateTime, num, ref, tk } from "@/lib/format";
import { readFlash, type FlashParams } from "@/lib/flash";
import { RULES } from "@/lib/admin";

export const instant = false;

export default async function TransferPage({ searchParams }: { searchParams: FlashParams }) {
  const sessionUser = await requireUser();
  const { ok, error } = await readFlash(searchParams);
  const userId = sessionUser.id;

  const [wallet, me, sent, received] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { transactionPinHash: true } }),
    prisma.transfer.findMany({ where: { fromUserId: userId }, include: { toUser: true }, orderBy: { createdAt: "desc" } }),
    prisma.transfer.findMany({ where: { toUserId: userId }, include: { fromUser: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const history = [
    ...sent.map((t) => ({
      id: t.id, date: t.createdAt, direction: "Sent", party: `${t.toUser.name} (${t.toUser.mobile})`,
      amount: -num(t.amount), fee: num(t.feeAmount),
    })),
    ...received.map((t) => ({
      id: t.id, date: t.createdAt, direction: "Received", party: `${t.fromUser.name} (${t.fromUser.mobile})`,
      amount: num(t.amount) - num(t.feeAmount), fee: 0,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const totalSent = sent.reduce((s, t) => s + num(t.amount), 0);
  const totalReceived = received.reduce((s, t) => s + num(t.amount) - num(t.feeAmount), 0);

  return (
    <AppShell user={sessionUser}>
      <PageHeader title="ID-to-ID Transfer" subtitle="T-Wallet থেকে অন্য User ID-তে balance পাঠাও।" />
      <Flash ok={ok} error={error} />

      <div className="stack">
        <div className="grid-stats">
          <StatCard label="T-Wallet Balance" value={tk(wallet?.tWallet)} icon="wallet" featured />
          <StatCard label="Total Sent" value={tk(totalSent)} icon="withdraw" tone="slate" />
          <StatCard label="Total Received" value={tk(totalReceived)} icon="deposit" tone="green" />
          <StatCard label="Transfers" value={history.length} icon="transfer" tone="violet" />
        </div>

        {!me?.transactionPinHash && (
          <Note tone="warning">
            Transfer করার আগে{" "}
            <Link href="/settings/pin" className="font-semibold underline">
              Transaction PIN
            </Link>{" "}
            সেট করো।
          </Note>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[1.25fr_1fr]">
          <Section title="New Transfer">
            <TransferForm balance={num(wallet?.tWallet)} feeRate={RULES.transferFeeRate} />
          </Section>
          <Section title="Transfer Rules">
            <KeyValue
              rows={[
                ["Sender wallet", "T-Wallet"],
                ["Recipient wallet", "T-Wallet"],
                ["Transaction fee", `${RULES.transferFeeRate * 100}%`],
                ["Security", "Transaction PIN required"],
              ]}
            />
            <p className="mt-3 text-sm text-[var(--muted)]">
              Submit করার আগে recipient-এর নাম verify করে নাও। Transfer সাথে সাথে সম্পন্ন হয় এবং ফেরত নেওয়া যায় না।
            </p>
          </Section>
        </div>

        <Section title="Transfer History" flush subtitle={`${history.length} টি transfer`}>
          {history.length === 0 ? (
            <EmptyState icon="transfer" title="এখনো কোনো transfer নেই" />
          ) : (
            <div className="table-wrap">
              <table className="table-base table-cards">
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Type</th>
                    <th>User</th>
                    <th>Date</th>
                    <th className="!text-right">Fee</th>
                    <th className="!text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((t) => (
                    <tr key={`${t.direction}-${t.id}`}>
                      <td className="cell-main font-mono text-[13px]">{ref("TRF", t.id)}</td>
                      <td data-label="Type">
                        <span className={`badge ${t.direction === "Sent" ? "badge-neutral" : "badge-approved"}`}>{t.direction}</span>
                      </td>
                      <td data-label="User">{t.party}</td>
                      <td data-label="Date" className="cell-muted whitespace-nowrap">{fmtDateTime(t.date)}</td>
                      <td data-label="Fee" className="tabular-nums md:text-right">{t.fee ? tk(t.fee) : "—"}</td>
                      <td data-label="Amount" className="md:text-right"><Amount value={t.amount} signed /></td>
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
