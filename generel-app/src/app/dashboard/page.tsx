import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";

export const instant = false;

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;

  const wallet = user
    ? await prisma.wallet.findUnique({ where: { userId: user.id } })
    : null;

  const fullUser = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        include: { rank: true, rewardClaims: { include: { rank: true } } },
      })
    : null;

  return (
    <AppShell user={user}>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-[var(--muted)]">স্বাগতম, {user?.name}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <WalletCard label="E-Wallet" value={wallet?.eWallet} />
        <WalletCard label="G-Wallet" value={wallet?.gWallet} accent />
        <WalletCard label="C-Wallet" value={wallet?.cWallet} />
        <WalletCard label="R-Wallet" value={wallet?.rWallet} />
        <WalletCard label="T-Wallet" value={wallet?.tWallet} />
      </div>

      <div className="card mt-6 p-5">
        <p className="label-text">My Rank</p>
        <p className="text-lg font-semibold">{fullUser?.rank?.name ?? "No Rank Yet"}</p>

        {fullUser && fullUser.rewardClaims.length > 0 && (
          <div className="mt-4">
            <p className="label-text">My Rewards</p>
            <ul className="space-y-1 text-sm">
              {fullUser.rewardClaims.map((rc) => (
                <li key={rc.id} className="flex items-center justify-between">
                  <span>{rc.rank.physicalReward}</span>
                  <StatusBadge status={String(rc.status)} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function WalletCard({
  label,
  value,
  accent,
}: {
  label: string;
  value?: { toString(): string } | null;
  accent?: boolean;
}) {
  return (
    <div className={`card p-4 ${accent ? "border-[var(--brand)]" : ""}`}>
      <p className="label-text">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value?.toString() ?? "0"}</p>
    </div>
  );
}
