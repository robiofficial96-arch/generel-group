import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { setTransactionPin } from "./actions";
import AppShell from "@/components/AppShell";

export const instant = false;

export default async function TransactionPinPage() {
  const session = await auth();
  const user = session?.user
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  return (
    <AppShell user={session?.user}>
      <h1 className="text-2xl font-semibold">Transaction PIN</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {user?.transactionPinHash
          ? "PIN সেট করা আছে — নিচে দিয়ে বদলাতে পারো।"
          : "Transfer করার আগে একটি ৪-৬ সংখ্যার PIN সেট করো।"}
      </p>

      <form action={setTransactionPin} className="card mt-5 max-w-sm space-y-4 p-5">
        <div>
          <label className="label-text">New PIN</label>
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            required
            className="input-field"
          />
        </div>
        <div>
          <label className="label-text">Confirm PIN</label>
          <input
            name="confirmPin"
            type="password"
            inputMode="numeric"
            required
            className="input-field"
          />
        </div>
        <button className="btn-primary w-full">Save PIN</button>
      </form>
    </AppShell>
  );
}
