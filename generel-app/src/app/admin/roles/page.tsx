import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import { Note, PageHeader, Section } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const instant = false;

const ROLES = [
  ["ADMIN", "Full access — admin console, approvals, user management, audit logs।"],
  ["AGENT", "Customer features। Agent withdrawal channel হিসেবে চিহ্নিত।"],
  ["CUSTOMER", "নিজের wallet, investment, team ও support — admin feature দেখা যায় না।"],
];

export default async function AdminRolesPage() {
  const admin = await requireAdminUser();
  const [counts, admins] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.user.findMany({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <AppShell user={admin}>
      <PageHeader title="Roles & Permissions" />
      <div className="stack">
        <Section title="Roles" flush>
          <ul>{ROLES.map(([role, text]) => (
            <li key={role} className="tx-row"><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{role}</span><span className="block text-xs text-[var(--muted)]">{text}</span></span><span className="badge badge-neutral">{counts.find((c) => c.role === role)?._count._all ?? 0} users</span></li>
          ))}</ul>
        </Section>
        <Section title="Admin Users" flush>
          <ul>{admins.map((a) => (<li key={a.id} className="tx-row"><span className="min-w-0 flex-1 text-sm font-semibold">{a.name} <span className="font-mono text-xs font-normal text-[var(--muted)]">{a.mobile}</span></span><span className="text-xs text-[var(--muted)]">Since {fmtDate(a.createdAt)}</span></li>))}</ul>
        </Section>
        <Note>Granular role (Finance / Support / Operations) এখনো চালু হয়নি; এখন সব admin-এর পূর্ণ access। Role তৈরি করলে Users → Create User থেকে ADMIN role দাও।</Note>
      </div>
    </AppShell>
  );
}
