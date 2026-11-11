import { prisma } from "@/lib/prisma";
import { approveDeposit, rejectDeposit } from "./actions";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";

export const instant = false;

export default async function AdminDepositsPage() {
  const session = await auth();
  const deposits = await prisma.deposit.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <AppShell user={session?.user}>
      <h1 className="text-2xl font-semibold">Deposit Approvals</h1>

      <div className="card mt-6 overflow-x-auto p-2">
        <table className="table-base">
          <thead>
            <tr>
              <th>User</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map((d) => (
              <tr key={d.id}>
                <td>{d.user.name} ({d.user.mobile})</td>
                <td className="tabular-nums">{d.amount.toString()}</td>
                <td>{d.method}</td>
                <td><StatusBadge status={d.status} /></td>
                <td>
                  {d.status === "PENDING" && (
                    <div className="flex gap-2">
                      <form action={approveDeposit}>
                        <input type="hidden" name="depositId" value={d.id} />
                        <button className="btn-success">Approve</button>
                      </form>
                      <form action={rejectDeposit}>
                        <input type="hidden" name="depositId" value={d.id} />
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
