import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import { resetPassword, toggleBlock, updateUser } from "../actions";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import ConfirmButton from "@/components/ConfirmButton";
import { TxTable } from "@/components/TxList";
import { Avatar, Flash, KeyValue, PageHeader, Section, StatCard } from "@/components/ui";
import { fmtDate, fmtDateTime, tk } from "@/lib/format";
import { readFlash, type FlashParams } from "@/lib/flash";
import { getActivity } from "@/lib/activity";

export const instant = false;

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: FlashParams;
}) {
  const admin = await requireAdminUser();
  const { id } = await params;
  const { ok, error } = await readFlash(searchParams);

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      wallet: true,
      matchingLedger: true,
      upline: { select: { id: true, name: true, mobile: true } },
      _count: { select: { investments: true, downlines: true } },
    },
  });
  if (!user) notFound();

  const [activity, logs] = await Promise.all([
    getActivity(id, { limit: 15 }),
    prisma.adminLog.findMany({ where: { targetUserId: id }, orderBy: { createdAt: "desc" }, take: 10, include: { admin: { select: { name: true } } } }),
  ]);

  return (
    <AppShell user={admin}>
      <PageHeader title={user.name} subtitle={<span className="font-mono">{user.mobile}</span>} back={{ href: "/admin/users", label: "All users" }}
        actions={user.isBlocked ? <StatusBadge status="BLOCKED" /> : <StatusBadge status={user.status} />} />
      <Flash ok={ok} error={error} />

      <div className="stack">
        <div className="grid-stats">
          <StatCard label="G-Wallet" value={tk(user.wallet?.gWallet)} icon="wallet" featured />
          <StatCard label="C-Wallet" value={tk(user.wallet?.cWallet)} icon="percent" tone="violet" />
          <StatCard label="R-Wallet" value={tk(user.wallet?.rWallet)} icon="repeat" tone="teal" />
          <StatCard label="T-Wallet" value={tk(user.wallet?.tWallet)} icon="transfer" tone="slate" />
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <Section title="Account Details">
            <div className="mb-3 flex items-center gap-3"><Avatar name={user.name} size="lg" /><span className="badge badge-info">{user.role}</span></div>
            <KeyValue rows={[
              ["Joined", fmtDate(user.createdAt)],
              ["Upline", user.upline ? `${user.upline.name} (${user.upline.mobile})` : "—"],
              ["Placement", user.placedSide ?? "—"],
              ["Investments", String(user._count.investments)],
              ["Direct downlines", `${user._count.downlines}`],
              ["Left carry", tk(user.matchingLedger?.leftCarryBalance)],
              ["Right carry", tk(user.matchingLedger?.rightCarryBalance)],
            ]} />
          </Section>

          <div className="stack">
            <Section title="Edit Name / Mobile" subtitle="Sensitive — প্রতিটি পরিবর্তন audit log-এ থাকে।">
              <form action={updateUser} className="space-y-4">
                <input type="hidden" name="id" value={user.id} />
                <div><label className="label-text" htmlFor="eu-name">Name</label><input id="eu-name" name="name" defaultValue={user.name} required className="input-field" /></div>
                <div><label className="label-text" htmlFor="eu-mobile">Registered mobile</label><input id="eu-mobile" name="mobile" defaultValue={user.mobile} required pattern="01\d{9}" className="input-field font-mono" /></div>
                <ConfirmButton className="btn-primary" title="User তথ্য পরিবর্তন করবে?" message="নাম/মোবাইল পরিবর্তন হবে ও user-কে notification যাবে।" confirmLabel="Save changes"
                  summary={[{ name: "name", label: "Name" }, { name: "mobile", label: "Mobile" }]}>Save changes</ConfirmButton>
              </form>
            </Section>

            <Section title="Security & Status">
              <div className="space-y-4">
                <form action={resetPassword} className="flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="id" value={user.id} />
                  <input name="password" type="password" minLength={8} required placeholder="New password (8+)" autoComplete="new-password" aria-label="New password" className="input-field" />
                  <ConfirmButton className="btn-outline shrink-0" title="Password reset করবে?" message="User-এর পুরনো password আর কাজ করবে না।" confirmLabel="Reset password">Reset password</ConfirmButton>
                </form>
                <form action={toggleBlock}>
                  <input type="hidden" name="id" value={user.id} />
                  <ConfirmButton className={user.isBlocked ? "btn-success" : "btn-danger"} tone={user.isBlocked ? "success" : "danger"}
                    title={user.isBlocked ? "Account activate করবে?" : "Account deactivate করবে?"}
                    message={user.isBlocked ? "User আবার login করতে পারবে।" : "User আর login করতে পারবে না।"}
                    confirmLabel={user.isBlocked ? "Activate" : "Deactivate"}>
                    {user.isBlocked ? "Activate account" : "Deactivate account"}
                  </ConfirmButton>
                </form>
              </div>
            </Section>
          </div>
        </div>

        <Section title="Recent Transactions" flush><TxTable rows={activity} /></Section>

        <Section title="Admin Activity (this user)" flush>
          {logs.length === 0 ? <p className="p-5 text-sm text-[var(--muted)]">কোনো admin action নেই।</p> : (
            <ul>{logs.map((l) => (
              <li key={l.id} className="tx-row"><span className="min-w-0 flex-1 text-sm"><span className="font-semibold">{l.action}</span> <span className="text-[var(--muted)]">by {l.admin.name}</span></span><span className="text-xs text-[var(--muted)]">{fmtDateTime(l.createdAt)}</span></li>
            ))}</ul>
          )}
        </Section>
      </div>
    </AppShell>
  );
}
