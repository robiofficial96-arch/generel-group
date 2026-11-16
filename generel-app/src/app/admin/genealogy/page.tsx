import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import TreeView from "@/components/TreeView";
import { EmptyState, Flash, Note, PageHeader } from "@/components/ui";
import { getTree } from "@/lib/team";

export const instant = false;

export default async function AdminGenealogyPage({ searchParams }: { searchParams: Promise<{ root?: string; q?: string }> }) {
  const admin = await requireAdminUser();
  const { root, q } = await searchParams;

  let searchError: string | undefined;
  if (q?.trim()) {
    const found = await prisma.user.findUnique({ where: { mobile: q.trim() }, select: { id: true } });
    if (found) redirect(`/admin/genealogy?root=${found.id}`);
    searchError = "এই User ID পাওয়া যায়নি";
  }

  // Default root: the topmost user (no upline), oldest first
  const rootId = root ?? (await prisma.user.findFirst({ where: { uplineId: null, role: { not: "ADMIN" } }, orderBy: { createdAt: "asc" }, select: { id: true } }))?.id
    ?? (await prisma.user.findFirst({ where: { uplineId: null }, orderBy: { createdAt: "asc" }, select: { id: true } }))?.id;

  const tree = rootId ? await getTree(rootId, 3) : null;
  const parent = rootId ? await prisma.user.findFirst({ where: { OR: [{ leftChildId: rootId }, { rightChildId: rootId }] }, select: { id: true } }) : null;

  return (
    <AppShell user={admin}>
      <PageHeader title="Genealogy" subtitle="Global binary tree।"
        actions={<form className="flex w-full gap-2 sm:w-80" role="search"><input name="q" placeholder="User ID (mobile)" aria-label="Search by User ID" className="input-field !min-h-10 font-mono" /><button className="btn-outline !min-h-10 !px-3.5">Search</button></form>} />
      <Flash error={searchError} />
      <div className="stack">
        {tree ? <TreeView key={tree.id} root={tree} basePath="/admin/genealogy" parentHref={parent ? `/admin/genealogy?root=${parent.id}` : null} />
          : <div className="card"><EmptyState icon="tree" title="কোনো tree নেই" /></div>}
        <Note>Placement পরিবর্তন configuration এই version-এ চালু নেই — user তৈরির সময়ই position নির্ধারিত হয়।</Note>
      </div>
    </AppShell>
  );
}
