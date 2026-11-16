import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import AppShell from "@/components/AppShell";
import TreeView from "@/components/TreeView";
import { EmptyState, Flash, Note, PageHeader } from "@/components/ui";
import { getTree, isInSubtree } from "@/lib/team";

export const instant = false;

export default async function TeamTreePage({
  searchParams,
}: {
  searchParams: Promise<{ root?: string; q?: string }>;
}) {
  const sessionUser = await requireUser();
  const { root, q } = await searchParams;

  let rootId = sessionUser.id;
  let searchError: string | undefined;

  // Search by User ID — only members inside the viewer's own team are reachable.
  const query = (q ?? "").trim();
  if (query) {
    const found = await prisma.user.findUnique({ where: { mobile: query }, select: { id: true } });
    if (found && (await isInSubtree(sessionUser.id, found.id))) redirect(`/team/tree?root=${found.id}`);
    searchError = "এই User ID তোমার team-এ পাওয়া যায়নি";
  } else if (root && root !== sessionUser.id) {
    if (await isInSubtree(sessionUser.id, root)) rootId = root;
  }

  const [tree, parent] = await Promise.all([
    getTree(rootId, 3),
    rootId === sessionUser.id
      ? null
      : prisma.user.findFirst({
          where: { OR: [{ leftChildId: rootId }, { rightChildId: rootId }] },
          select: { id: true },
        }),
  ]);

  return (
    <AppShell user={sessionUser}>
      <PageHeader
        title="Genealogy Tree"
        subtitle="Binary Left / Right team structure।"
        back={{ href: "/team", label: "My team" }}
        actions={
          <form className="flex w-full gap-2 sm:w-80" role="search">
            <input name="q" placeholder="User ID (mobile) দিয়ে খোঁজো" aria-label="Search by User ID" className="input-field !min-h-10 font-mono" />
            <button className="btn-outline !min-h-10 !px-3.5">Search</button>
          </form>
        }
      />
      <Flash error={searchError} />

      <div className="stack">
        {tree ? (
          <TreeView
            key={tree.id}
            root={tree}
            basePath="/team/tree"
            parentHref={parent ? (parent.id === sessionUser.id ? "/team/tree" : `/team/tree?root=${parent.id}`) : null}
          />
        ) : (
          <div className="card">
            <EmptyState icon="tree" title="Tree পাওয়া যায়নি" />
          </div>
        )}
        <Note>
          Placement এখান থেকে পরিবর্তন করা যায় না — registration-এর সময় নির্ধারিত side অনুযায়ী থাকে; প্রয়োজনে admin
          পরিবর্তন করতে পারে।
        </Note>
      </div>
    </AppShell>
  );
}
