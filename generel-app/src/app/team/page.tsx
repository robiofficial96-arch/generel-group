import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import CopyButton from "@/components/CopyButton";
import Icon from "@/components/Icon";
import StatusBadge from "@/components/StatusBadge";
import { Avatar, EmptyState, PageHeader, Section, StatCard, Tabs } from "@/components/ui";
import { fmtDate, tk } from "@/lib/format";
import { getSubtree } from "@/lib/team";

export const instant = false;

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const sessionUser = await requireUser();
  const { view, q } = await searchParams;
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";

  const [me, team] = await Promise.all([
    prisma.user.findUnique({ where: { id: sessionUser.id }, select: { mobile: true, leftChildId: true, rightChildId: true } }),
    getSubtree(sessionUser.id),
  ]);

  const left = team.filter((m) => m.leg === "LEFT");
  const right = team.filter((m) => m.leg === "RIGHT");
  const directs = team.filter((m) => m.depth === 1);
  const volume = (list: typeof team) => list.reduce((s, m) => s + m.invested, 0);

  const active = view === "direct" || view === "left" || view === "right" ? view : "all";
  const base = active === "direct" ? directs : active === "left" ? left : active === "right" ? right : team;
  const query = (q ?? "").trim().toLowerCase();
  const rows = query ? base.filter((m) => `${m.name} ${m.mobile}`.toLowerCase().includes(query)) : base;

  const link = `${protocol}://${host}/join?ref=${me?.mobile ?? ""}`;

  return (
    <AppShell user={sessionUser}>
      <PageHeader
        title="My Team"
        subtitle="তোমার binary team — Left ও Right side।"
        actions={
          <Link href="/team/tree" className="btn-dark">
            <Icon name="tree" size={17} /> Genealogy Tree
          </Link>
        }
      />

      <div className="stack">
        <div className="grid-stats">
          <StatCard label="Total Team" value={team.length} icon="users" featured />
          <StatCard label="Direct Referrals" value={`${directs.length} / 2`} icon="user" tone="violet" />
          <StatCard label="Left Team" value={left.length} icon="chevron-left" tone="blue" hint={`Volume ${tk(volume(left))}`} />
          <StatCard label="Right Team" value={right.length} icon="chevron-right" tone="green" hint={`Volume ${tk(volume(right))}`} />
        </div>

        <Section title="Referral Link" subtitle="এই link share করো — নতুন member তোমার খালি Left/Right side-এ join করবে।">
          <CopyButton value={link} label="Copy link" />
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {(["LEFT", "RIGHT"] as const).map((side) => {
              const child = directs.find((d) => d.leg === side);
              return (
                <div key={side} className="rounded-2xl bg-[var(--background)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{side} side</p>
                  <p className="mt-0.5 font-semibold">{child ? child.name : "খালি — join করা যাবে"}</p>
                </div>
              );
            })}
          </div>
        </Section>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs
            active={active}
            tabs={[
              { key: "all", label: `All (${team.length})`, href: "/team" },
              { key: "direct", label: `Direct (${directs.length})`, href: "/team?view=direct" },
              { key: "left", label: `Left (${left.length})`, href: "/team?view=left" },
              { key: "right", label: `Right (${right.length})`, href: "/team?view=right" },
            ]}
          />
          <form className="flex gap-2 md:w-80" role="search">
            {active !== "all" && <input type="hidden" name="view" value={active} />}
            <input name="q" defaultValue={q ?? ""} placeholder="Name বা User ID" aria-label="Search members" className="input-field !min-h-10" />
            <button className="btn-outline !min-h-10 !px-3.5">Search</button>
          </form>
        </div>

        <Section title="Team Members" subtitle={`${rows.length} জন`} flush>
          {rows.length === 0 ? (
            <EmptyState icon="users" title="কোনো member পাওয়া যায়নি" text="Referral link share করে team তৈরি শুরু করো।" />
          ) : (
            <div className="table-wrap">
              <table className="table-base table-cards">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Side</th>
                    <th>Level</th>
                    <th>Status</th>
                    <th className="!text-right">Investment</th>
                    <th>Joined</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 200).map((m) => (
                    <tr key={m.id}>
                      <td className="cell-main">
                        <span className="flex items-center gap-3">
                          <Avatar name={m.name} size="sm" />
                          <span>
                            <span className="block font-semibold">{m.name}</span>
                            <span className="cell-muted block font-mono">{m.mobile}</span>
                          </span>
                        </span>
                      </td>
                      <td data-label="Side">
                        <span className={`badge ${m.leg === "LEFT" ? "badge-info" : "badge-approved"}`}>{m.leg}</span>
                      </td>
                      <td data-label="Level">{m.depth === 1 ? "Direct" : `Level ${m.depth}`}</td>
                      <td data-label="Status"><StatusBadge status={m.status} /></td>
                      <td data-label="Investment" className="font-semibold tabular-nums md:text-right">{tk(m.invested)}</td>
                      <td data-label="Joined" className="cell-muted whitespace-nowrap">{fmtDate(m.createdAt)}</td>
                      <td className="cell-actions">
                        <Link href={`/team/tree?root=${m.id}`} className="btn-ghost">
                          Tree <Icon name="chevron-right" size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </AppShell>
  );
}
