import Link from "next/link";
import { addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { buyInvestmentSlot } from "./actions";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import ConfirmButton from "@/components/ConfirmButton";
import { EmptyState, Flash, Note, PageHeader, Progress, Section, StatCard } from "@/components/ui";
import { fmtDate, num, ref, tk } from "@/lib/format";
import { readFlash, type FlashParams } from "@/lib/flash";

export const instant = false;

export default async function InvestPage({ searchParams }: { searchParams: FlashParams }) {
  const sessionUser = await requireUser();
  const { ok, error } = await readFlash(searchParams);

  const [slots, wallet, investments] = await Promise.all([
    prisma.investmentSlot.findMany({ orderBy: { amount: "asc" } }),
    prisma.wallet.findUnique({ where: { userId: sessionUser.id } }),
    prisma.investment.findMany({
      where: { userId: sessionUser.id },
      include: { roiSchedules: { orderBy: { monthNo: "asc" } } },
      orderBy: { investedAt: "desc" },
    }),
  ]);

  const balance = num(wallet?.gWallet);
  const totalInvested = investments.reduce((s, i) => s + num(i.amount), 0);
  const allSchedules = investments.flatMap((i) => i.roiSchedules.map((s) => ({ ...s, investment: i })));
  const paid = allSchedules.filter((s) => s.status === "APPROVED");
  const roiReceived = paid.reduce((s, r) => s + num(r.amount), 0);
  const active = investments.filter((i) => i.roiSchedules.some((s) => s.status === "PENDING"));

  return (
    <AppShell user={sessionUser}>
      <PageHeader title="Investment Slots" subtitle="G-Wallet balance দিয়ে slot কেনো — ROI জমা হবে R-Wallet এ।" />
      <Flash ok={ok} error={error} />

      <div className="stack">
        <div className="grid-stats">
          <StatCard label="G-Wallet Balance" value={tk(balance)} icon="wallet" featured href="/deposit" />
          <StatCard label="Total Invested" value={tk(totalInvested)} icon="invest" tone="blue" />
          <StatCard label="Active Investments" value={active.length} icon="repeat" tone="green" />
          <StatCard label="ROI Received" value={tk(roiReceived)} icon="deposit" tone="teal" />
        </div>

        <Note>
          নিচের monthly ও total return হলো plan অনুযায়ী <strong>projected</strong> হিসাব (18 মাস, প্রতি ৳100,000-এ
          মাসে প্রায় ৳11,111, মোট ৳200,000)। এগুলো guaranteed নয় — actual credited amount নিচে ROI History-তে দেখো।
        </Note>

        <div>
          <h2 className="section-title mb-3">Available Slots</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {slots.map((slot, i) => {
              const amount = num(slot.amount);
              const monthly = Math.round(amount / 9);
              const affordable = balance >= amount;
              return (
                <form key={slot.id} action={buyInvestmentSlot} className="card flex flex-col overflow-hidden">
                  <input type="hidden" name="slotId" value={slot.id} />
                  <div className="hero-card !rounded-none p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
                      Slot {i + 1}
                    </p>
                    <p className="mt-1 font-display text-[1.7rem] font-extrabold tabular-nums">{tk(amount)}</p>
                  </div>
                  <dl className="kv flex-1 px-5 py-2">
                    <div className="kv-row"><dt>Duration</dt><dd>18 months</dd></div>
                    <div className="kv-row"><dt>Projected monthly</dt><dd className="tabular-nums">≈ {tk(monthly)}</dd></div>
                    <div className="kv-row"><dt>Projected total</dt><dd className="tabular-nums">{tk(amount * 2)}</dd></div>
                  </dl>
                  <div className="p-5 pt-2">
                    {affordable ? (
                      <ConfirmButton
                        className="btn-primary w-full"
                        title={`${tk(amount)} slot কিনবে?`}
                        message={
                          <>
                            G-Wallet থেকে <strong>{tk(amount)}</strong> কেটে নেওয়া হবে। এই transaction ফেরত নেওয়া
                            যাবে না। Return গুলো projected, guaranteed নয়।
                          </>
                        }
                        confirmLabel="Confirm investment"
                      >
                        Select Slot
                      </ConfirmButton>
                    ) : (
                      <Link href="/deposit" className="btn-outline w-full">
                        Balance কম — Deposit করো
                      </Link>
                    )}
                  </div>
                </form>
              );
            })}
          </div>
        </div>

        <Section title="My Investments" subtitle={`${investments.length} টি investment`} flush>
          {investments.length === 0 ? (
            <EmptyState icon="invest" title="এখনো কোনো investment নেই" text="উপরের যেকোনো slot বাছাই করে শুরু করো।" />
          ) : (
            <div className="table-wrap">
              <table className="table-base table-cards">
                <thead>
                  <tr>
                    <th>Investment</th>
                    <th>Date</th>
                    <th className="!text-right">Amount</th>
                    <th>ROI Progress</th>
                    <th>Next ROI</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((inv) => {
                    const paidMonths = inv.roiSchedules.filter((s) => s.status === "APPROVED").length;
                    const next = inv.roiSchedules.find((s) => s.status === "PENDING");
                    return (
                      <tr key={inv.id}>
                        <td className="cell-main font-mono text-[13px]">{ref("INV", inv.id)}</td>
                        <td data-label="Date" className="cell-muted whitespace-nowrap">{fmtDate(inv.investedAt)}</td>
                        <td data-label="Amount" className="font-semibold tabular-nums md:text-right">{tk(inv.amount)}</td>
                        <td data-label="ROI Progress">
                          <span className="flex min-w-32 items-center gap-2.5">
                            <span className="flex-1"><Progress value={paidMonths} max={18} /></span>
                            <span className="cell-muted tabular-nums">{paidMonths}/18</span>
                          </span>
                        </td>
                        <td data-label="Next ROI" className="cell-muted whitespace-nowrap">
                          {next ? fmtDate(addMonths(inv.investedAt, next.monthNo)) : "—"}
                        </td>
                        <td data-label="Status">
                          <StatusBadge status={next ? "ACTIVE" : "COMPLETED"} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="ROI History" subtitle="R-Wallet এ actual credited ROI" flush>
          {paid.length === 0 ? (
            <EmptyState icon="repeat" title="এখনো কোনো ROI credit হয়নি" text="Schedule অনুযায়ী ROI জমা হলে এখানে দেখাবে।" />
          ) : (
            <div className="table-wrap">
              <table className="table-base table-cards">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Investment</th>
                    <th>Month</th>
                    <th>Credited On</th>
                    <th className="!text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paid
                    .sort((a, b) => (b.paidAt?.getTime() ?? 0) - (a.paidAt?.getTime() ?? 0))
                    .slice(0, 60)
                    .map((s) => (
                      <tr key={s.id}>
                        <td className="cell-main font-mono text-[13px]">{ref("ROI", s.id)}</td>
                        <td data-label="Investment" className="tabular-nums">{tk(s.investment.amount)}</td>
                        <td data-label="Month">{s.monthNo} / 18</td>
                        <td data-label="Credited On" className="cell-muted">{fmtDate(s.paidAt)}</td>
                        <td data-label="Amount" className="font-semibold tabular-nums text-[var(--success)] md:text-right">
                          +{tk(s.amount)}
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
