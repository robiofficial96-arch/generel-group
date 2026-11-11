import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requestWithdrawal } from "./actions";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";

export const instant = false;

export default async function WithdrawPage() {
  const session = await auth();
  const wallet = session?.user
    ? await prisma.wallet.findUnique({ where: { userId: session.user.id } })
    : null;
  const myWithdrawals = session?.user
    ? await prisma.withdrawal.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <AppShell user={session?.user}>
      <h1 className="text-2xl font-semibold">Withdraw Request</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        C-Wallet: <span className="font-medium text-[var(--foreground)]">{wallet?.cWallet.toString() ?? "0"}</span>
        {" · "}
        R-Wallet: <span className="font-medium text-[var(--foreground)]">{wallet?.rWallet.toString() ?? "0"}</span>
      </p>
      <p className="text-xs text-[var(--muted)]">
        সর্বনিম্ন 1,000 Tk, প্রতি উইথড্রয়ে 10% ফি কাটা হবে
      </p>

      <form action={requestWithdrawal} className="card mt-6 max-w-md space-y-4 p-5">
        <div>
          <label className="label-text">Source</label>
          <select name="sourceWallet" className="input-field">
            <option value="C_WALLET">C-Wallet (Commission)</option>
            <option value="R_WALLET">R-Wallet (ROI)</option>
          </select>
        </div>
        <div>
          <label className="label-text">Amount (Tk)</label>
          <input name="amount" type="number" min="1000" required className="input-field" />
        </div>
        <div>
          <label className="label-text">Channel</label>
          <select name="channel" className="input-field">
            <option value="ADMIN">Admin</option>
            <option value="AGENT">Agent</option>
            <option value="ID_TO_ID">ID-ID</option>
          </select>
        </div>
        <div>
          <label className="label-text">Payout Method</label>
          <select name="payoutMethod" className="input-field">
            <option value="BANK">Bank</option>
            <option value="MFS">MFS</option>
            <option value="DIGITAL">Digital</option>
          </select>
        </div>
        <button className="btn-primary w-full">Submit Withdraw Request</button>
      </form>

      <h2 className="mt-8 font-semibold">আমার Withdraw History</h2>
      <div className="card mt-3 overflow-x-auto p-2">
        <table className="table-base">
          <thead>
            <tr>
              <th>Source</th>
              <th>Amount</th>
              <th>Fee</th>
              <th>Net</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {myWithdrawals.map((w) => (
              <tr key={w.id}>
                <td>{w.sourceWallet}</td>
                <td className="tabular-nums">{w.amount.toString()}</td>
                <td className="tabular-nums">{w.feeAmount.toString()}</td>
                <td className="tabular-nums">{w.netAmount.toString()}</td>
                <td><StatusBadge status={w.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
