import { prisma } from "@/lib/prisma";
import { approveWithdrawal, rejectWithdrawal } from "./actions";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";

export const instant = false;

export default async function AdminWithdrawalsPage() {
  const session = await auth();
  const withdrawals = await prisma.withdrawal.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <AppShell user={session?.user}>
      <h1 className="text-2xl font-semibold">Withdraw Approvals</h1>

      <div className="card mt-6 overflow-x-auto p-2">
        <table className="table-base">
          <thead>
            <tr>
              <th>User</th>
              <th>Source</th>
              <th>Amount</th>
              <th>Net</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id}>
                <td>{w.user.name} ({w.user.mobile})</td>
                <td>{w.sourceWallet}</td>
                <td className="tabular-nums">{w.amount.toString()}</td>
                <td className="tabular-nums">{w.netAmount.toString()}</td>
                <td>{w.channel}</td>
                <td><StatusBadge status={w.status} /></td>
                <td>
                  {w.status === "PENDING" && (
                    <div className="flex gap-2">
                      <form action={approveWithdrawal}>
                        <input type="hidden" name="withdrawalId" value={w.id} />
                        <button className="btn-success">Approve</button>
                      </form>
                      <form action={rejectWithdrawal}>
                        <input type="hidden" name="withdrawalId" value={w.id} />
                        <button className="btn-danger">Reject</button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
