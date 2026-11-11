import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createDeposit } from "./actions";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";

export const instant = false;

export default async function DepositPage() {
  const session = await auth();
  const myDeposits = session?.user
    ? await prisma.deposit.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <AppShell user={session?.user}>
      <h1 className="text-2xl font-semibold">Deposit Request</h1>

      <form action={createDeposit} className="card mt-6 max-w-md space-y-4 p-5">
        <div>
          <label className="label-text">Amount (Tk)</label>
          <input name="amount" type="number" min="1" required className="input-field" />
        </div>
        <div>
          <label className="label-text">Method</label>
          <select name="method" className="input-field">
            <option value="BANK">Bank</option>
            <option value="MFS">MFS (bKash/Nagad/Rocket)</option>
            <option value="DIGITAL">Digital</option>
          </select>
        </div>
        <button className="btn-primary w-full">Submit Deposit Request</button>
      </form>

      <h2 className="mt-8 font-semibold">আমার Deposit History</h2>
      <div className="card mt-3 overflow-x-auto p-2">
        <table className="table-base">
          <thead>
            <tr>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {myDeposits.map((d) => (
              <tr key={d.id}>
                <td className="tabular-nums">{d.amount.toString()}</td>
                <td>{d.method}</td>
                <td><StatusBadge status={d.status} /></td>
                <td>{d.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
