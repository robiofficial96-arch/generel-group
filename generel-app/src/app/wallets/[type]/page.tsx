import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import { AtmCard } from "@/components/WalletDeck";
import { TxTable } from "@/components/TxList";
import { Note, PageHeader, Section, StatCard, Tabs } from "@/components/ui";
import { maskedId, num, tk } from "@/lib/format";
import { getActivity, WALLET_INFO, type WalletKey } from "@/lib/activity";

export const instant = false;

const KEYS = ["E", "G", "C", "R", "T"] as const;

export default async function WalletDetailPage({ params }: { params: Promise<{ type: string }> }) {
  const sessionUser = await requireUser();
  const { type } = await params;
  const key = KEYS.find((k) => WALLET_INFO[k].slug === type);
  if (!key) notFound();
  const info = WALLET_INFO[key];

  const [user, wallet, rows] = await Promise.all([
    prisma.user.findUnique({ where: { id: sessionUser.id }, select: { name: true, mobile: true } }),
    prisma.wallet.findUnique({ where: { userId: sessionUser.id } }),
    key === "E" ? [] : getActivity(sessionUser.id, { wallet: key as WalletKey, limit: 200 }),
  ]);

  const balance = num(wallet?.[info.field]);
  const settled = rows.filter((r) => r.status !== "REJECTED");
  const credited = settled.filter((r) => r.amount > 0 && r.status === "APPROVED").reduce((s, r) => s + r.amount, 0);
  const debited = settled.filter((r) => r.amount < 0).reduce((s, r) => s - r.amount, 0);
  const pending = rows.filter((r) => r.status === "PENDING").reduce((s, r) => s + Math.abs(r.amount), 0);

  return (
    <AppShell user={sessionUser}>
      <PageHeader title={info.name} subtitle={info.description} back={{ href: "/wallets", label: "All wallets" }} />

      <div className="stack">
        <Tabs
          active={key}
          tabs={KEYS.map((k) => ({ key: k, label: WALLET_INFO[k].name, href: `/wallets/${WALLET_INFO[k].slug}` }))}
        />

        <div className="grid items-start gap-5 lg:grid-cols-[360px_1fr]">
          <AtmCard
            asLink={false}
            hidden={false}
            holder={user?.name ?? ""}
            masked={maskedId(user?.mobile)}
            wallet={{ key, name: info.name, tag: info.tag, balance, href: "#" }}
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard label="Available Balance" value={tk(balance)} icon="wallet" tone="blue" featured />
            <StatCard label="Pending" value={tk(pending)} icon="clock" tone="amber" />
            <StatCard label="Total Credited" value={tk(credited)} icon="deposit" tone="green" />
            <StatCard label="Total Debited" value={tk(debited)} icon="withdraw" tone="slate" />
          </div>
        </div>

        {key === "E" ? (
          <Note tone="warning">
            E-Wallet হলো overall overview wallet। এর accounting definition এখনো client confirm করেনি — চূড়ান্ত হলে
            এখানে statement দেখানো হবে। (Pending configuration)
          </Note>
        ) : (
          <Section title="Wallet Statement" subtitle={`${rows.length} টি transaction`} flush>
            <TxTable rows={rows} />
          </Section>
        )}
      </div>
    </AppShell>
  );
}
