import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createDeposit } from "./actions";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icon";
import StatusBadge from "@/components/StatusBadge";
import ConfirmButton from "@/components/ConfirmButton";
import { EmptyState, Flash, PageHeader, Section, StatCard } from "@/components/ui";
import { fmtDateTime, METHOD_LABEL, num, ref, tk } from "@/lib/format";
import { readFlash, type FlashParams } from "@/lib/flash";

export const instant = false;

const METHODS = [
  { value: "BANK", label: "Bank Transfer", hint: "Bank account-এ জমা", icon: "bank" },
  { value: "MFS", label: "Mobile Banking", hint: "bKash · Nagad · Rocket", icon: "phone" },
  { value: "DIGITAL", label: "Digital Payment", hint: "Card / online gateway", icon: "card" },
];

export default async function DepositPage({ searchParams }: { searchParams: FlashParams }) {
  const sessionUser = await requireUser();
  const { ok, error } = await readFlash(searchParams);

  const [wallet, deposits] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: sessionUser.id } }),
    prisma.deposit.findMany({ where: { userId: sessionUser.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const sum = (status: string) =>
    deposits.filter((d) => d.status === status).reduce((s, d) => s + num(d.amount), 0);

  return (
    <AppShell user={sessionUser}>
      <PageHeader title="Deposit" subtitle="Payment করে proof জমা দাও — admin approve করলে G-Wallet এ জমা হবে।" />
      <Flash ok={ok} error={error} />

      <div className="stack">
        <div className="grid-stats">
          <StatCard label="G-Wallet Balance" value={tk(wallet?.gWallet)} icon="wallet" featured />
          <StatCard label="Approved Deposits" value={tk(sum("APPROVED"))} icon="deposit" tone="green" />
          <StatCard label="Pending Verification" value={tk(sum("PENDING"))} icon="clock" tone="amber" />
          <StatCard label="Total Requests" value={deposits.length} icon="file" tone="slate" />
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[1.25fr_1fr]">
          <Section title="New Deposit" subtitle="Method বাছাই → amount → reference → submit">
            <form action={createDeposit} className="space-y-5">
              <fieldset>
                <legend className="label-text">1. Payment method</legend>
                <div className="option-grid">
                  {METHODS.map((m, i) => (
                    <label key={m.value} className="option-card">
                      <input type="radio" name="method" value={m.value} defaultChecked={i === 0} required />
                      <span className="text-[var(--royal)]">
                        <Icon name={m.icon} size={22} />
                      </span>
                      {m.label}
                      <small>{m.hint}</small>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label className="label-text" htmlFor="dep-amount">2. Amount (৳)</label>
                <input
                  id="dep-amount"
                  name="amount"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  required
                  placeholder="যেমন 10000"
                  className="input-field tabular-nums"
                />
              </div>

              <div>
                <label className="label-text" htmlFor="dep-ref">3. Transaction reference / TrxID</label>
                <input
                  id="dep-ref"
                  name="reference"
                  required
                  minLength={4}
                  maxLength={80}
                  placeholder="Payment-এর TrxID বা bank reference"
                  className="input-field font-mono"
                />
                <p className="field-hint">এই reference দিয়েই admin তোমার payment যাচাই করবে।</p>
              </div>

              <ConfirmButton
                className="btn-primary w-full"
                title="Deposit request confirm করো"
                message="তথ্য ঠিক আছে কিনা দেখে নাও। Submit করার পর admin verification-এ যাবে।"
                confirmLabel="Submit request"
                summary={[
                  { name: "amount", label: "Amount (৳)" },
                  { name: "reference", label: "Reference" },
                ]}
              >
                Submit Deposit Request
              </ConfirmButton>
            </form>
          </Section>

          <Section title="Payment Instructions">
            <ol className="space-y-3.5 text-sm">
              {[
                ["Payment পাঠাও", "বাছাই করা method-এ company-র official account-এ টাকা পাঠাও। Account details admin / support থেকে নিশ্চিত করে নাও।"],
                ["Reference সংরক্ষণ করো", "Payment-এর TrxID / bank reference number লিখে রাখো।"],
                ["Request submit করো", "Amount ও reference দিয়ে এই form submit করো — status হবে Pending।"],
                ["Admin approval", "Verify হলে amount G-Wallet এ জমা হবে এবং notification পাবে।"],
              ].map(([title, text], i) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-xs font-bold text-[var(--royal)]">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-semibold">{title}</span>
                    <span className="text-[var(--muted)]">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <Section title="Deposit History" subtitle={`${deposits.length} টি request`} flush>
          {deposits.length === 0 ? (
            <EmptyState icon="deposit" title="এখনো কোনো deposit নেই" text="উপরের form দিয়ে প্রথম deposit request করো।" />
          ) : (
            <div className="table-wrap">
              <table className="table-base table-cards">
                <thead>
                  <tr>
                    <th>Deposit</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Date</th>
                    <th className="!text-right">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((d) => (
                    <tr key={d.id}>
                      <td className="cell-main font-mono text-[13px]">{ref("DEP", d.id)}</td>
                      <td data-label="Method">{METHOD_LABEL[d.method]}</td>
                      <td data-label="Reference" className="font-mono text-[13px]">{d.reference ?? "—"}</td>
                      <td data-label="Date" className="cell-muted whitespace-nowrap">{fmtDateTime(d.createdAt)}</td>
                      <td data-label="Amount" className="font-semibold tabular-nums md:text-right">{tk(d.amount)}</td>
                      <td data-label="Status">
                        <StatusBadge status={d.status} />
                        {d.status === "REJECTED" && d.rejectReason && (
                          <span className="cell-muted mt-1 block">{d.rejectReason}</span>
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
