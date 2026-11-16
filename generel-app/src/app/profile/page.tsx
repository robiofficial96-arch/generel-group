import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { changePassword } from "./actions";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icon";
import StatusBadge from "@/components/StatusBadge";
import { SubmitButton } from "@/components/ConfirmButton";
import { Avatar, Flash, KeyValue, Note, PageHeader, Section } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { readFlash, type FlashParams } from "@/lib/flash";

export const instant = false;

export default async function ProfilePage({ searchParams }: { searchParams: FlashParams }) {
  const sessionUser = await requireUser();
  const { ok, error } = await readFlash(searchParams);

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { upline: { select: { name: true, mobile: true } }, _count: { select: { passkeys: true } } },
  });
  if (!user) return null;

  const security = [
    { href: "/settings/pin", icon: "key", label: "Transaction PIN", state: user.transactionPinHash ? "Set করা আছে" : "Set করা নেই" },
    { href: "/settings/passkey", icon: "fingerprint", label: "Fingerprint Login", state: `${user._count.passkeys} টি device` },
    { href: "/notifications", icon: "bell", label: "Notifications", state: "সব update দেখো" },
    { href: "/support", icon: "support", label: "Support Center", state: "Ticket ও FAQ" },
  ];

  return (
    <AppShell user={sessionUser}>
      <PageHeader title="My Profile" subtitle="Account information ও security settings।" />
      <Flash ok={ok} error={error} />

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="stack">
          <div className="hero-card p-6">
            <div className="flex items-center gap-4">
              <Avatar name={user.name} size="lg" />
              <div className="min-w-0">
                <h2 className="truncate text-xl font-extrabold">{user.name}</h2>
                <p className="font-mono text-sm text-white/70">ID {user.mobile}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusBadge status={user.status} />
                  <span className="badge badge-info">{user.role}</span>
                </div>
              </div>
            </div>
          </div>

          <Section title="Account Information">
            <KeyValue
              rows={[
                ["Full name", user.name],
                ["User ID", user.mobile],
                ["Mobile number", user.mobile],
                ["Account status", user.status === "ACTIVE" ? "Active" : "Normal"],
                ["Referral ID", user.mobile],
                ["Referred by", user.upline ? `${user.upline.name} (${user.upline.mobile})` : "—"],
                ["Placement side", user.placedSide ?? "—"],
                ["Member since", fmtDate(user.createdAt)],
              ]}
            />
          </Section>

          <Note>
            নাম ও registered mobile number নিজে পরিবর্তন করা যায় না — এগুলো admin পরিবর্তন করে। প্রয়োজনে{" "}
            <Link href="/support" className="font-semibold underline">
              support request
            </Link>{" "}
            পাঠাও।
          </Note>
        </div>

        <div className="stack">
          <Section title="Security Settings" flush>
            <ul>
              {security.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="tx-row hover:bg-[#fafbfe]">
                    <span className="tx-icon tone-blue">
                      <Icon name={s.icon} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{s.label}</span>
                      <span className="block text-xs text-[var(--muted)]">{s.state}</span>
                    </span>
                    <Icon name="chevron-right" size={17} className="text-[var(--muted)]" />
                  </Link>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Change Password">
            <form action={changePassword} className="space-y-4">
              <div>
                <label className="label-text" htmlFor="pw-current">Current password</label>
                <input id="pw-current" name="current" type="password" autoComplete="current-password" required className="input-field" />
              </div>
              <div>
                <label className="label-text" htmlFor="pw-next">New password</label>
                <input id="pw-next" name="next" type="password" autoComplete="new-password" minLength={8} required className="input-field" />
                <p className="field-hint">কমপক্ষে 8 অক্ষর।</p>
              </div>
              <div>
                <label className="label-text" htmlFor="pw-confirm">Confirm new password</label>
                <input id="pw-confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required className="input-field" />
              </div>
              <SubmitButton className="btn-primary w-full">Update Password</SubmitButton>
            </form>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}
