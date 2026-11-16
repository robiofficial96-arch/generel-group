import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icon";
import WalletDeck, { type DeckWallet } from "@/components/WalletDeck";
import { TxList } from "@/components/TxList";
import { Note, PageHeader, Section, SeeAll } from "@/components/ui";
import { maskedId, num, tk } from "@/lib/format";
import { getActivity, WALLET_INFO } from "@/lib/activity";

export const instant = false;

const ACTIONS: Record<string, { href: string; label: string; icon: string }[]> = {
  E: [{ href: "/activity", label: "All activity", icon: "activity" }],
  G: [
    { href: "/deposit", label: "Deposit", icon: "deposit" },
    { href: "/invest", label: "Invest", icon: "invest" },
  ],
  C: [
    { href: "/withdraw", label: "Withdraw", icon: "withdraw" },
    { href: "/commissions", label: "Commissions", icon: "percent" },
  ],
  R: [
    { href: "/withdraw", label: "Withdraw", icon: "withdraw" },
    { href: "/invest", label: "ROI history", icon: "repeat" },
  ],
  T: [{ href: "/transfer", label: "Transfer", icon: "transfer" }],
};

export default async function WalletsPage() {
  const sessionUser = await requireUser();
  const [user, wallet, activity] = await Promise.all([
    prisma.user.findUnique({ where: { id: sessionUser.id }, select: { name: true, mobile: true } }),
    prisma.wallet.findUnique({ where: { userId: sessionUser.id } }),
    getActivity(sessionUser.id, { limit: 8 }),
  ]);

  const keys = ["E", "G", "C", "R", "T"] as const;
  const wallets: DeckWallet[] = keys.map((key) => ({
    key,
    name: WALLET_INFO[key].name,
    tag: WALLET_INFO[key].tag,
    balance: num(wallet?.[WALLET_INFO[key].field]),
    href: `/wallets/${WALLET_INFO[key].slug}`,
  }));

  return (
    <AppShell user={sessionUser}>
      <PageHeader title="My Wallets" subtitle="পাঁচটি wallet — প্রতিটির balance, কাজ ও transaction history।" />

      <div className="stack">
        <WalletDeck wallets={wallets} holder={user?.name ?? ""} masked={maskedId(user?.mobile)} />

        <Note>
          E-Wallet-এর সাথে অন্য wallet-গুলোর accounting সম্পর্ক এখনো চূড়ান্ত হয়নি — তাই wallet balance যোগ করে
          কোনো মোট দেখানো হচ্ছে না।
        </Note>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {wallets.map((w) => (
            <div key={w.key} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    {w.tag}
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold">{w.name}</h2>
                </div>
                <p className="font-display text-xl font-extrabold tabular-nums">{tk(w.balance)}</p>
              </div>
              <p className="mt-2 flex-1 text-sm text-[var(--muted)]">{WALLET_INFO[w.key].description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {ACTIONS[w.key].map((a) => (
                  <Link key={a.href + a.label} href={a.href} className="btn-outline !min-h-9 !px-3 !py-1.5 text-sm">
                    <Icon name={a.icon} size={15} /> {a.label}
                  </Link>
                ))}
                <Link href={w.href} className="btn-ghost ml-auto">
                  Details <Icon name="chevron-right" size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <Section title="Recent Transactions" flush action={<SeeAll href="/activity" />}>
          <TxList rows={activity} />
        </Section>
      </div>
    </AppShell>
  );
}
