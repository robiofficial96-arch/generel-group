import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import { createUser } from "./actions";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { SubmitButton } from "@/components/ConfirmButton";
import { Avatar, EmptyState, Flash, PageHeader, Section, Tabs } from "@/components/ui";
import { fmtDate, tk } from "@/lib/format";
import { readFlash, type FlashParams } from "@/lib/flash";

export const instant = false;

export default async function AdminUsersPage({ searchParams }: { searchParams: FlashParams }) {
  const admin = await requireAdminUser();
  const { ok, error, params } = await readFlash(searchParams);
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const filter = pick(params.filter);
  const q = (pick(params.q) ?? "").trim();

  const users = await prisma.user.findMany({
    where: {
      ...(filter === "active" ? { status: "ACTIVE" as const } : {}),
      ...(filter === "normal" ? { status: "NORMAL" as const } : {}),
      ...(filter === "blocked" ? { isBlocked: true } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { mobile: { contains: q } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { wallet: true, upline: { select: { mobile: true } } },
    take: 200,
  });

  const active = ["active", "normal", "blocked"].includes(filter ?? "") ? filter! : "all";

  return (
    <AppShell user={admin}>
      <PageHeader title="Users" subtitle="সব user দেখো, তৈরি করো ও পরিচালনা করো।" />
      <Flash ok={ok} error={error} />

      <div className="stack">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs
            active={active}
            tabs={[
              { key: "all", label: "All", href: "/admin/users" },
              { key: "active", label: "Active", href: "/admin/users?filter=active" },
              { key: "normal", label: "Normal", href: "/admin/users?filter=normal" },
              { key: "blocked", label: "Deactivated", href: "/admin/users?filter=blocked" },
            ]}
          />
          <form className="flex gap-2 md:w-80" role="search">
            {active !== "all" && <input type="hidden" name="filter" value={active} />}
            <input name="q" defaultValue={q} placeholder="Name বা mobile" aria-label="Search users" className="input-field !min-h-10" />
            <button className="btn-outline !min-h-10 !px-3.5">Search</button>
          </form>
        </div>

        <Section title="All Users" subtitle={`${users.length} জন`} flush>
          {users.length === 0 ? (
            <EmptyState icon="users" title="কোনো user পাওয়া যায়নি" />
          ) : (
            <div className="table-wrap">
              <table className="table-base table-cards">
                <thead>
                  <tr>
                    <th>User</th><th>Role</th><th>Status</th><th>Upline</th><th>Side</th>
                    <th className="!text-right">G-Wallet</th><th>Joined</th><th />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="cell-main">
                        <span className="flex items-center gap-3">
                          <Avatar name={u.name} size="sm" />
                          <span><span className="block font-semibold">{u.name}</span><span className="cell-muted block font-mono">{u.mobile}</span></span>
                        </span>
                      </td>
                      <td data-label="Role"><span className="badge badge-info">{u.role}</span></td>
                      <td data-label="Status">{u.isBlocked ? <StatusBadge status="BLOCKED" /> : <StatusBadge status={u.status} />}</td>
                      <td data-label="Upline" className="font-mono text-[13px]">{u.upline?.mobile ?? "—"}</td>
                      <td data-label="Side">{u.placedSide ?? "—"}</td>
                      <td data-label="G-Wallet" className="tabular-nums md:text-right">{tk(u.wallet?.gWallet)}</td>
                      <td data-label="Joined" className="cell-muted whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                      <td className="cell-actions"><Link href={`/admin/users/${u.id}`} className="btn-ghost">Manage</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="Create User">
          <form action={createUser} className="grid gap-4 md:grid-cols-2">
            <div><label className="label-text" htmlFor="cu-name">Name</label><input id="cu-name" name="name" required className="input-field" /></div>
            <div><label className="label-text" htmlFor="cu-mobile">Mobile</label><input id="cu-mobile" name="mobile" required inputMode="numeric" pattern="01\d{9}" placeholder="01XXXXXXXXX" className="input-field" /></div>
            <div><label className="label-text" htmlFor="cu-pass">Password</label><input id="cu-pass" name="password" type="password" minLength={8} required autoComplete="new-password" className="input-field" /></div>
            <div>
              <label className="label-text" htmlFor="cu-role">Role</label>
              <select id="cu-role" name="role" className="input-field" defaultValue="CUSTOMER">
                <option value="CUSTOMER">Customer</option><option value="AGENT">Agent</option><option value="ADMIN">Admin</option>
              </select>
            </div>
            <div><label className="label-text" htmlFor="cu-up">Upline mobile (root user হলে খালি)</label><input id="cu-up" name="uplineMobile" className="input-field" /></div>
            <div>
              <label className="label-text" htmlFor="cu-side">Placement side</label>
              <select id="cu-side" name="side" defaultValue="" className="input-field">
                <option value="">— upline দিলে বাধ্যতামূলক —</option><option value="LEFT">Left</option><option value="RIGHT">Right</option>
              </select>
            </div>
            <div className="md:col-span-2"><SubmitButton className="btn-primary w-full md:w-auto">Create User</SubmitButton></div>
          </form>
        </Section>
      </div>
    </AppShell>
  );
}
