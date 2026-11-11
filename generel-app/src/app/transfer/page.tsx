import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createTransfer } from "./actions";
import Link from "next/link";
import AppShell from "@/components/AppShell";

export const instant = false;

export default async function TransferPage() {
  const session = await auth();
  const wallet = session?.user
    ? await prisma.wallet.findUnique({ where: { userId: session.user.id } })
    : null;
  const me = session?.user
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  const sent = session?.user
    ? await prisma.transfer.findMany({
        where: { fromUserId: session.user.id },
        include: { toUser: true },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const received = session?.user
    ? await prisma.transfer.findMany({
        where: { toUserId: session.user.id },
        include: { fromUser: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <AppShell user={session?.user}>
      <h1 className="text-2xl font-semibold">ID-ID Transfer</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        T-Wallet: <span className="font-medium text-[var(--foreground)]">{wallet?.tWallet.toString() ?? "0"}</span>
      </p>

      {!me?.transactionPinHash && (
        <p className="mt-3 max-w-md rounded-lg bg-amber-100 p-3 text-sm text-amber-900">
          Transfer করার আগে{" "}
          <Link href="/settings/pin" className="font-medium underline">
            Transaction PIN
          </Link>{" "}
          সেট করো।
        </p>
      )}

      <form action={createTransfer} className="card mt-6 max-w-md space-y-4 p-5">
        <div>
          <label className="label-text">প্রাপকের Mobile</label>
          <input name="toMobile" required className="input-field" />
        </div>
        <div>
          <label className="label-text">Amount (Tk)</label>
          <input name="amount" type="number" min="1" required className="input-field" />
        </div>
        <div>
          <label className="label-text">Transaction PIN</label>
          <input name="pin" type="password" inputMode="numeric" required className="input-field" />
        </div>
        <button className="btn-primary w-full">Send Transfer</button>
      </form>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="font-semibold">Sent</h2>
          <div className="card mt-3 overflow-x-auto p-2">
            <table className="table-base">
              <thead>
                <tr>
                  <th>To</th>
                  <th>Amount</th>
                  <th>Fee</th>
                </tr>
              </thead>
              <tbody>
                {sent.map((t) => (
                  <tr key={t.id}>
                    <td>{t.toUser.mobile}</td>
                    <td className="tabular-nums">{t.amount.toString()}</td>
                    <td className="tabular-nums">{t.feeAmount.toString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-semibold">Received</h2>
          <div className="card mt-3 overflow-x-auto p-2">
            <table className="table-base">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {received.map((t) => (
                  <tr key={t.id}>
                    <td>{t.fromUser.mobile}</td>
                    <td className="tabular-nums">{t.amount.sub(t.feeAmount).toString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
