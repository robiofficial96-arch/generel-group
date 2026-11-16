import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import { EmptyState, PageHeader, Section } from "@/components/ui";
import { fmtDateTime } from "@/lib/format";

export const instant = false;

export default async function AdminAuditPage() {
  const admin = await requireAdminUser();
  const logs = await prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, include: { admin: { select: { name: true } } }, take: 300 });
  const targets = await prisma.user.findMany({ where: { id: { in: logs.map((l) => l.targetUserId).filter((x): x is string => Boolean(x)) } }, select: { id: true, name: true } });
  const nameOf = new Map(targets.map((t) => [t.id, t.name]));

  return (
    <AppShell user={admin}>
      <PageHeader title="Audit Logs" subtitle="প্রতিটি sensitive admin action এখানে সংরক্ষিত — মুছে ফেলা যায় না।" />
      <Section title="Admin Activity" subtitle={`সর্বশেষ ${logs.length}টি`} flush>
        {logs.length === 0 ? <EmptyState icon="file" title="এখনো কোনো log নেই" /> : (
          <div className="table-wrap"><table className="table-base table-cards">
            <thead><tr><th>Action</th><th>Admin</th><th>Target user</th><th>Details</th><th>Time</th></tr></thead>
            <tbody>{logs.map((l) => (
              <tr key={l.id}>
                <td className="cell-main font-mono text-[13px]">{l.action}</td>
                <td data-label="Admin">{l.admin.name}</td>
                <td data-label="Target">{l.targetUserId ? nameOf.get(l.targetUserId) ?? l.targetUserId : "—"}</td>
                <td data-label="Details" className="cell-muted max-w-xs break-all font-mono text-xs">{l.metadata ? JSON.stringify(l.metadata) : "—"}</td>
                <td data-label="Time" className="cell-muted whitespace-nowrap">{fmtDateTime(l.createdAt)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Section>
    </AppShell>
  );
}
