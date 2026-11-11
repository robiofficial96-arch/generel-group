import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buyInvestmentSlot } from "./actions";
import AppShell from "@/components/AppShell";

export const instant = false;

export default async function InvestPage() {
  const session = await auth();
  const slots = await prisma.investmentSlot.findMany({ orderBy: { amount: "asc" } });
  const wallet = session?.user
    ? await prisma.wallet.findUnique({ where: { userId: session.user.id } })
    : null;
  const myInvestments = session?.user
    ? await prisma.investment.findMany({
        where: { userId: session.user.id },
        include: { slot: true },
        orderBy: { investedAt: "desc" },
      })
    : [];

  return (
    <AppShell user={session?.user}>
      <h1 className="text-2xl font-semibold">Investment Slots</h1>
      <p className="mt-1 text-[var(--muted)]">
        G-Wallet Balance: <span className="font-medium text-[var(--foreground)]">{wallet?.gWallet.toString() ?? "0"}</span>
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {slots.map((slot) => (
          <form key={slot.id} action={buyInvestmentSlot} className="card p-4 text-center">
            <input type="hidden" name="slotId" value={slot.id} />
            <p className="font-semibold tabular-nums">{slot.amount.toString()} Tk</p>
            <button className="btn-primary mt-3 w-full text-sm">Buy</button>
          </form>
        ))}
      </div>

      <h2 className="mt-8 font-semibold">আমার Investments</h2>
      <div className="card mt-3 overflow-x-auto p-2">
        <table className="table-base">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {myInvestments.map((inv) => (
              <tr key={inv.id}>
                <td className="tabular-nums">{inv.slot.amount.toString()}</td>
                <td className="tabular-nums">{inv.amount.toString()}</td>
                <td>{inv.investedAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
