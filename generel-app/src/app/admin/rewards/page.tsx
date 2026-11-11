import { prisma } from "@/lib/prisma";
import { updateRewardStatus } from "./actions";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";

export const instant = false;

export default async function AdminRewardsPage() {
  const session = await auth();
  const claims = await prisma.rewardClaim.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, rank: true },
  });

  const users = await prisma.user.findMany({
    where: { rankId: { not: null } },
    include: { rank: true, rankSalaries: { include: { rank: true } } },
  });

  return (
    <AppShell user={session?.user}>
      <h1 className="text-2xl font-semibold">Rank Holders & Rewards</h1>

      <div className="card mt-4 overflow-x-auto p-2">
        <table className="table-base">
          <thead>
            <tr>
              <th>User</th>
              <th>Rank</th>
              <th>Salary (paid/total)</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name} ({u.mobile})</td>
                <td>{u.rank?.name}</td>
                <td>
                  {u.rankSalaries.map((rs) => (
                    <span key={rs.id}>
                      {rs.rank.name}: {rs.paidMonths}/{rs.isLifetime ? "Lifetime" : rs.totalMonths}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 font-semibold">Physical Reward Claims</h2>
      <div className="card mt-3 overflow-x-auto p-2">
        <table className="table-base">
          <thead>
            <tr>
              <th>User</th>
              <th>Reward</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id}>
                <td>{c.user.name}</td>
                <td>{c.rank.physicalReward}</td>
                <td><StatusBadge status={c.status} /></td>
                <td>
                  <form action={updateRewardStatus} className="flex gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    {c.status === "PENDING_CLAIM" && (
                      <button name="status" value="APPROVED" className="btn-primary px-3 py-1 text-sm">
                        Approve
                      </button>
                    )}
                    {c.status === "APPROVED" && (
                      <button name="status" value="DELIVERED" className="btn-success">
                        Mark Delivered
                      </button>
                    )}
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
